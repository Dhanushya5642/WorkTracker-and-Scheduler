# Common Terminal Errors & Solutions

## Error 1: "Cannot find module 'express'" or similar
**Solution:** Install dependencies
```bash
npm install
```

## Error 2: "Port 3000 is already in use"
**Solution:** Kill the process or use different port
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID_NUMBER> /F

# Or change port in server.js
app.listen(3001, () => { ... });
```

## Error 3: "Invalid login" or authentication error
**Cause:** Wrong email credentials in server.js

**Solution:** 
1. Go to https://myaccount.google.com/security
2. Enable 2-Step Verification
3. Go to App Passwords
4. Create new app password for "Mail"
5. Update server.js with the 16-character password

## Error 4: "ECONNREFUSED" or "Connection refused"
**Cause:** Gmail blocking the connection

**Solution:** Use this updated transporter config:
```javascript
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
        user: 'your-email@gmail.com',
        pass: 'your-app-password'
    },
    tls: {
        rejectUnauthorized: false
    }
});
```

## Error 5: "node is not recognized"
**Cause:** Node.js not installed

**Solution:** Download and install Node.js from https://nodejs.org

## Error 6: Syntax errors in server.js
**Cause:** Missing commas, brackets, or quotes

**Solution:** Check the complete server.js file structure

## How to Check What Error You Have:
1. Open terminal in project folder
2. Run: npm start
3. Copy the FULL error message
4. Share it so I can help fix it

## Quick Test Without Email:
If you just want to test the app without email:
- Comment out the email code in server.js
- Or just use the frontend without starting the server
- Browser notifications will still work!
