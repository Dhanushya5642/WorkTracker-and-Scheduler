const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const cron = require('node-cron');

const app = express();
app.use(cors());
app.use(express.json());

// ============================================
// CONFIGURE YOUR EMAIL HERE
// ============================================
const EMAIL_CONFIG = {
    service: 'gmail',
    user: 'dhanushyathangavel5642@gmail.com',      // ← CHANGE THIS
    pass: 'jwbc huwn bzhb upjk',          // ← CHANGE THIS (16-char App Password)
};

// Create email transporter
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
        user: EMAIL_CONFIG.user,
        pass: EMAIL_CONFIG.pass
    },
    tls: {
        rejectUnauthorized: false
    }
});

// Verify email configuration on startup
transporter.verify((error, success) => {
    if (error) {
        console.error('Email configuration error:', error.message);
        console.log('\nPlease check:');
        console.log('1. Email and password are correct in EMAIL_CONFIG');
        console.log('2. Using App Password (not regular password)');
        console.log('3. 2-Factor Authentication is enabled on Gmail');
    } else {
        console.log('Email server is ready to send emails');
    }
});

// Store user tasks and sent notifications
let userTasks = {};
let sentNotifications = new Set();

// Sync tasks endpoint
app.post('/api/sync-tasks', (req, res) => {
    const { username, email, tasks } = req.body;
    userTasks[username] = { email, tasks };
    console.log(`Tasks synced for ${username}: ${tasks.length} tasks`);
    res.json({ success: true });
});

// Check deadlines and send emails
function checkAndSendEmails() {
    console.log('Checking deadlines...');
    const now = new Date();
    let emailsSent = 0;
    
    Object.entries(userTasks).forEach(([username, data]) => {
        const { email, tasks } = data;
        
        tasks.forEach(task => {
            if (task.status === 'completed') return;
            
            const deadline = new Date(task.deadline);
            const minutesUntil = (deadline - now) / (1000 * 60);
            const hoursUntil = minutesUntil / 60;
            
            let timeMessage = '';
            let urgencyLevel = '';
            let notificationKey = '';
            
            // Determine time-based notifications
            if (minutesUntil <= 10 && minutesUntil > 0) {
                timeMessage = `Only ${Math.floor(minutesUntil)} minutes left`;
                urgencyLevel = 'URGENT';
                notificationKey = `${task.id}-10min`;
            } else if (minutesUntil <= 30 && minutesUntil > 10) {
                timeMessage = `Only 30 minutes left`;
                urgencyLevel = 'URGENT';
                notificationKey = `${task.id}-30min`;
            } else if (hoursUntil <= 1 && hoursUntil > 0.5) {
                timeMessage = `Only 1 hour left`;
                urgencyLevel = 'Important';
                notificationKey = `${task.id}-1hour`;
            } else if (hoursUntil <= 3 && hoursUntil > 1) {
                timeMessage = `Only 3 hours left`;
                urgencyLevel = 'Reminder';
                notificationKey = `${task.id}-3hours`;
            } else if (hoursUntil <= 24 && hoursUntil > 23) {
                timeMessage = `1 day left`;
                urgencyLevel = 'Reminder';
                notificationKey = `${task.id}-1day`;
            }
            
            // Send email if time threshold met and not already sent
            if (timeMessage && !sentNotifications.has(notificationKey)) {
                const priorityEmoji = task.priority === 'high' ? '🔴' : task.priority === 'medium' ? '🟡' : '🟢';
                
                const taskCat = task.category || 'general';
                let subject = `${urgencyLevel} - ${timeMessage} for "${task.title}"`;
                let headerEmoji = '📋';
                let alertColor = '#1976d2';
                let alertMsg = "⚡ Don't forget to complete it on time!";

                if (taskCat === 'birthday') {
                    subject = `🎉 Birthday Reminder: ${task.title} is coming up in ${timeMessage}!`;
                    headerEmoji = '🎂';
                    alertColor = '#ed64a6';
                    alertMsg = `🎉 Make sure you're ready to ${task.metadata?.action || 'celebrate'}!`;
                } else if (taskCat === 'college') {
                    subject = `📚 Academic Alert: ${timeMessage} for ${task.title}`;
                    headerEmoji = '📚';
                    alertColor = '#667eea';
                    alertMsg = `📖 Almost due! Keep pushing!`;
                } else if (taskCat === 'investment') {
                    subject = `📈 Financial Reminder: ${timeMessage} for ${task.title}`;
                    headerEmoji = '💰';
                    alertColor = '#38b2ac';
                    alertMsg = `📈 Secure your finances! action needed.`;
                }

                let extraMetadata = '';
                if (taskCat === 'college' && task.metadata) {
                    extraMetadata = `
                        <tr>
                            <td style="padding: 10px; background: #f8f9fa;"><strong>Course:</strong></td>
                            <td style="padding: 10px;">${task.metadata.course}</td>
                        </tr>
                    `;
                } else if (taskCat === 'investment' && task.metadata) {
                    extraMetadata = `
                        <tr>
                            <td style="padding: 10px; background: #f8f9fa;"><strong>Amount:</strong></td>
                            <td style="padding: 10px;">₹${task.metadata.amount}</td>
                        </tr>
                    `;
                }

                const mailOptions = {
                    from: EMAIL_CONFIG.user,
                    to: email,
                    subject: subject,
                    html: `
                        <div style="font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5;">
                            <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                                <h2 style="color: #d32f2f; margin-top: 0;">${urgencyLevel}</h2>
                                <h1 style="color: #333; font-size: 24px;">${timeMessage} for this due!</h1>
                                
                                <div style="background: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0;">
                                    <h3 style="margin: 0; color: #856404;">${headerEmoji} ${task.title}</h3>
                                </div>
                                
                                <table style="width: 100%; margin: 20px 0; border-collapse: collapse;">
                                    <tr>
                                        <td style="padding: 10px; background: #f8f9fa; width: 30%;"><strong>Category:</strong></td>
                                        <td style="padding: 10px;">${taskCat.toUpperCase()}</td>
                                    </tr>
                                    ${extraMetadata}
                                    <tr>
                                        <td style="padding: 10px; background: #f8f9fa;"><strong>Priority:</strong></td>
                                        <td style="padding: 10px;">${priorityEmoji} ${task.priority.toUpperCase()}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 10px; background: #f8f9fa;"><strong>Deadline:</strong></td>
                                        <td style="padding: 10px; color: #d32f2f; font-weight: bold;">${deadline.toLocaleString()}</td>
                                    </tr>
                                </table>
                                
                                ${task.description ? `<p style="color: #666; margin: 20px 0;"><strong>Description:</strong><br>${task.description}</p>` : ''}
                                
                                <div style="background: #e3f2fd; padding: 15px; border-radius: 5px; margin-top: 20px;">
                                    <p style="margin: 0; color: ${alertColor};"><b>${alertMsg}</b></p>
                                </div>
                            </div>
                        </div>
                    `
                };
                
                transporter.sendMail(mailOptions, (error, info) => {
                    if (error) {
                        console.log('Error sending email:', error.message);
                    } else {
                        console.log(`Email sent to ${email}: ${timeMessage} - ${task.title}`);
                        sentNotifications.add(notificationKey);
                        emailsSent++;
                    }
                });
            }
        });
    });
    
    if (emailsSent === 0) {
        console.log('No emails to send at this time');
    }
}

// Run every 5 minutes for testing
cron.schedule('*/5 * * * *', () => {
    console.log('\nRunning 5-minute deadline check...');
    checkAndSendEmails();
});

// Run every hour
cron.schedule('0 * * * *', () => {
    console.log('\nRunning hourly deadline check...');
    checkAndSendEmails();
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log('\n' + '='.repeat(50));
    console.log('Email notification server running on port ' + PORT);
    console.log('Email checks run every 5 minutes (testing) and every hour');
    console.log('='.repeat(50));
    console.log('\nIMPORTANT: Configure your email in EMAIL_CONFIG');
    console.log(`Current email: ${EMAIL_CONFIG.user}`);
    console.log('\nWaiting for requests...\n');
});
