# Email Notification Setup Guide

## Prerequisites
- Node.js installed on your system
- Gmail account (or other email service)

## Setup Steps

### 1. Install Dependencies
Open terminal in the project folder and run:
```bash
npm install
```

### 2. Configure Gmail App Password
1. Go to your Google Account settings
2. Enable 2-Factor Authentication
3. Go to Security > App Passwords
4. Generate a new app password for "Mail"
5. Copy the 16-character password

### 3. Update server.js
Open `server.js` and replace:
```javascript
user: 'your-email@gmail.com',     // Your Gmail address
pass: 'your-app-password'          // The 16-char app password
```

Also update the `from` field in mailOptions:
```javascript
from: 'your-email@gmail.com'
```

### 4. Start the Server
```bash
npm start
```

Server will run on http://localhost:3000

### 5. Use the Application
1. Open `login.html` in your browser
2. Sign up with a REAL email address
3. Add tasks with deadlines
4. You'll receive emails:
   - 24 hours before deadline
   - 1 hour before deadline

## Alternative Email Services

### Using Outlook/Hotmail:
```javascript
service: 'hotmail'
```

### Using Custom SMTP:
```javascript
host: 'smtp.example.com',
port: 587,
secure: false,
auth: {
    user: 'your-email',
    pass: 'your-password'
}
```

## Testing
- Set a task deadline 1-2 hours from now
- Wait for the hourly cron job to run
- Check your email inbox

## Troubleshooting
- Make sure server is running
- Check console for errors
- Verify email credentials
- Check spam folder for emails
- Ensure firewall allows port 3000

## Production Deployment
For production, consider:
- Using a database (MongoDB/PostgreSQL)
- Environment variables for credentials
- Hosting on AWS/Heroku/DigitalOcean
- Using a dedicated email service (SendGrid, AWS SES)
