const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const cron = require('node-cron');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// ==============================
// SERVE FRONTEND (IMPORTANT)
// ==============================
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ==============================
// EMAIL CONFIG (ENV VARIABLES)
// ==============================
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Verify email setup
transporter.verify((error, success) => {
    if (error) {
        console.error('❌ Email config error:', error.message);
    } else {
        console.log('✅ Email server ready');
    }
});

// ==============================
// DATA STORAGE (TEMP)
// ==============================
let userTasks = {};
let sentNotifications = new Set();

// ==============================
// API ROUTES
// ==============================
app.post('/api/sync-tasks', (req, res) => {
    const { username, email, tasks } = req.body;
    userTasks[username] = { email, tasks };
    console.log(`Tasks synced for ${username}`);
    res.json({ success: true });
});

// ==============================
// EMAIL LOGIC
// ==============================
function checkAndSendEmails() {
    console.log('Checking deadlines...');
    const now = new Date();

    Object.entries(userTasks).forEach(([username, data]) => {
        const { email, tasks } = data;

        tasks.forEach(task => {
            if (task.status === 'completed') return;

            const deadline = new Date(task.deadline);
            const minutesUntil = (deadline - now) / (1000 * 60);

            if (minutesUntil <= 10 && minutesUntil > 0) {
                const key = `${task.id}-10min`;

                if (!sentNotifications.has(key)) {
                    const mailOptions = {
                        from: process.env.EMAIL_USER,
                        to: email,
                        subject: `⏰ Reminder: ${task.title}`,
                        html: `
                            <h2>Task Reminder</h2>
                            <p><b>${task.title}</b> is due soon!</p>
                            <p>Deadline: ${deadline.toLocaleString()}</p>
                        `
                    };

                    transporter.sendMail(mailOptions, (err, info) => {
                        if (err) {
                            console.log('❌ Email error:', err.message);
                        } else {
                            console.log('📧 Email sent:', info.response);
                            sentNotifications.add(key);
                        }
                    });
                }
            }
        });
    });
}

// ==============================
// CRON JOBS
// ==============================
cron.schedule('*/5 * * * *', () => {
    console.log('⏳ Running 5-min check...');
    checkAndSendEmails();
});

// ==============================
// START SERVER (IMPORTANT FIX)
// ==============================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log('===================================');
    console.log(`🚀 Server running on port ${PORT}`);
    console.log('===================================');
});