require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const cors = require('cors');
const cron = require('node-cron');
const path = require('path');

const User = require('./models/User');
const Task = require('./models/Task');
const Schedule = require('./models/Schedule');

const app = express();
app.use(cors());
app.use(express.json());

// ==============================
// MONGODB CONNECTION
// ==============================
mongoose.connect('mongodb://127.0.0.1:27017/worktracker')
    .then(() => console.log('✅ Connected to MongoDB'))
    .catch(err => console.error('❌ MongoDB connection error:', err));

// ==============================
// SERVE FRONTEND
// ==============================
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ==============================
// API ROUTES
// ==============================

// User Signup
app.post('/api/auth/signup', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const existingUser = await User.findOne({ username });
        if (existingUser) return res.status(400).json({ error: 'Username already exists' });

        const newUser = new User({ username, email, password });
        await newUser.save();
        res.json({ success: true, message: 'Account created' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// User Login
app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username, password });
        if (!user) return res.status(401).json({ error: 'Invalid username or password' });
        
        // Return userId to store on frontend for future requests
        res.json({ success: true, userId: user._id, username: user.username });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get all tasks for user
app.get('/api/tasks/:userId', async (req, res) => {
    try {
        const tasks = await Task.find({ userId: req.params.userId }).sort({ deadline: 1 });
        res.json(tasks);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create task
app.post('/api/tasks', async (req, res) => {
    try {
        const newTask = new Task(req.body);
        await newTask.save();
        res.json(newTask);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update task status / details
app.put('/api/tasks/:id', async (req, res) => {
    try {
        const updatedTask = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updatedTask);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete task
app.delete('/api/tasks/:id', async (req, res) => {
    try {
        await Task.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get schedules for user
app.get('/api/schedules/:userId', async (req, res) => {
    try {
        const schedules = await Schedule.find({ userId: req.params.userId }).sort({ createdAt: -1 });
        res.json(schedules);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create schedule
app.post('/api/schedules', async (req, res) => {
    try {
        const newSchedule = new Schedule(req.body);
        await newSchedule.save();
        res.json(newSchedule);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete schedule
app.delete('/api/schedules/:id', async (req, res) => {
    try {
        await Schedule.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ==============================
// EMAIL CONFIG & CRON
// ==============================
const EMAIL_CONFIG = {
    service: 'gmail',
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
};

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: { user: EMAIL_CONFIG.user, pass: EMAIL_CONFIG.pass },
    tls: {
        rejectUnauthorized: false
    }
});

transporter.verify((error) => {
    if (error) console.error('❌ Email config error:', error.message);
    else console.log('✅ Email server ready');
});

let sentNotifications = new Set();

async function checkAndSendEmails() {
    const now = new Date();
    
    try {
        // Find tasks due soon
        const tasks = await Task.find({ status: { $ne: 'completed' } }).populate('userId');
        
        tasks.forEach(task => {
            const deadline = new Date(task.deadline);
            const minutesUntil = (deadline - now) / (1000 * 60);

            if (minutesUntil > 0 && task.userId && task.userId.email) {
                const priority = task.priority || 'medium';
                
                // Define thresholds
                const thresholds = [
                    { label: '2 hours', minutes: 120 },
                    { label: '1 hour', minutes: 60 },
                    { label: '40 minutes', minutes: 40 },
                    { label: '30 minutes', minutes: 30 },
                    { label: '20 minutes', minutes: 20 },
                    { label: '10 minutes', minutes: 10 },
                    { label: '5 minutes', minutes: 5 },
                    { label: '2 minutes', minutes: 2 },
                    { label: '1 minute', minutes: 1 }
                ];

                thresholds.forEach(threshold => {
                    // Check if we have passed the threshold (and haven't sent the email yet)
                    if (minutesUntil <= threshold.minutes && minutesUntil > 0) {
                        const key = `${task._id}-${threshold.label}`;

                        if (!sentNotifications.has(key)) {
                            const mailOptions = {
                                from: EMAIL_CONFIG.user,
                                to: task.userId.email,
                                subject: `⏰ [${priority.toUpperCase()}] Reminder: ${task.title}`,
                                html: `
                                    <h2>Task Reminder</h2>
                                    <p><b>${task.title}</b> is due in ${threshold.label}!</p>
                                    <p>Priority: <b>${priority.toUpperCase()}</b></p>
                                    <p>Deadline: ${deadline.toLocaleString()}</p>
                                `
                            };

                            transporter.sendMail(mailOptions, (err) => {
                                if (err) {
                                    console.log('❌ Email error:', err.message);
                                } else {
                                    console.log('📧 Email sent to', task.userId.email, 'for', threshold.label);
                                    sentNotifications.add(key);
                                }
                            });
                        }
                    }
                });
            }
        });
    } catch (err) {
        console.error('Error checking emails:', err);
    }
}

cron.schedule('* * * * *', () => {
    console.log('⏳ Checking deadlines from MongoDB...');
    checkAndSendEmails();
});

// ==============================
// START SERVER
// ==============================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log('===================================');
    console.log(`🚀 Server running on port ${PORT}`);
    console.log('===================================');
});