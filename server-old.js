const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const cron = require('node-cron');

const app = express();
app.use(cors());
app.use(express.json());

// Email configuration (use your email service)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'your-email@gmail.com', // Replace with your email
        pass: 'your-app-password'      // Replace with your app password
    }
});

// Store user tasks in memory (in production, use a database)
let userTasks = {};

// Test email endpoint
app.post('/api/test-email', async (req, res) => {
    const { username, email } = req.body;
    
    const mailOptions = {
        from: 'your-email@gmail.com',
        to: email,
        subject: 'Test Email - Work Tracker',
        html: `
            <h2>Test Email Successful!</h2>
            <p>Hi ${username},</p>
            <p>If you're reading this, email notifications are working correctly! 🎉</p>
            <p>You will receive deadline reminders at:</p>
            <ul>
                <li>24 hours before deadline</li>
                <li>1 hour before deadline</li>
            </ul>
            <p>Make sure to add tasks with upcoming deadlines to test the automatic notifications.</p>
        `
    };
    
    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('Test email sent:', info.response);
        res.json({ success: true, message: 'Email sent successfully' });
    } catch (error) {
        console.error('Email error:', error);
        res.json({ success: false, error: error.message });
    }
});

// Endpoint to sync tasks
app.post('/api/sync-tasks', (req, res) => {
    const { username, email, tasks } = req.body;
    userTasks[username] = { email, tasks };
    console.log(`Tasks synced for ${username}: ${tasks.length} tasks`);
    res.json({ success: true });
});

// Check deadlines and send emails
function checkAndSendEmails() {
    const now = new Date();
    
    Object.entries(userTasks).forEach(([username, data]) => {
        const { email, tasks } = data;
        
        tasks.forEach(task => {
            if (task.status === 'completed') return;
            
            const deadline = new Date(task.deadline);
            const hoursUntil = (deadline - now) / (1000 * 60 * 60);
            
            // Send email 24 hours before and 1 hour before
            if ((hoursUntil < 24 && hoursUntil > 23) || (hoursUntil < 1 && hoursUntil > 0)) {
                const mailOptions = {
                    from: 'your-email@gmail.com',
                    to: email,
                    subject: `Deadline Reminder: ${task.title}`,
                    html: `
                        <h2>Deadline Reminder</h2>
                        <p>Hi ${username},</p>
                        <p>Your task "<strong>${task.title}</strong>" is due ${hoursUntil < 1 ? 'in 1 hour' : 'in 24 hours'}!</p>
                        <p><strong>Project:</strong> ${task.project || 'N/A'}</p>
                        <p><strong>Priority:</strong> ${task.priority.toUpperCase()}</p>
                        <p><strong>Deadline:</strong> ${deadline.toLocaleString()}</p>
                        <p><strong>Description:</strong> ${task.description || 'No description'}</p>
                        <br>
                        <p>Don't forget to complete it on time!</p>
                    `
                };
                
                transporter.sendMail(mailOptions, (error, info) => {
                    if (error) {
                        console.log('Error sending email:', error);
                    } else {
                        console.log('Email sent:', info.response);
                    }
                });
            }
        });
    });
}

// Run every hour
cron.schedule('0 * * * *', () => {
    console.log('Running scheduled deadline check...');
    checkAndSendEmails();
});

// Also run every 5 minutes for testing (comment out in production)
cron.schedule('*/5 * * * *', () => {
    console.log('Running 5-minute deadline check (testing mode)...');
    checkAndSendEmails();
});

app.listen(3000, () => {
    console.log('Email notification server running on port 3000');
    console.log('Email checks run every 5 minutes (testing) and every hour');
    console.log('Make sure to configure your email in server.js!');
});
