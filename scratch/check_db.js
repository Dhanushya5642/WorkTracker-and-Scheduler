const mongoose = require('mongoose');
const Task = require('../models/Task');
const User = require('../models/User');

async function check() {
    await mongoose.connect('mongodb://127.0.0.1:27017/worktracker');
    console.log('Connected to DB');
    
    const tasks = await Task.find({ status: { $ne: 'completed' } }).populate('userId');
    const now = new Date();
    
    console.log(`Found ${tasks.length} pending tasks.`);
    
    tasks.forEach(task => {
        const deadline = new Date(task.deadline);
        const minutesUntil = (deadline - now) / (1000 * 60);
        const priority = task.priority || 'medium';
        
        console.log(`\nTask: ${task.title}`);
        console.log(`Priority: ${priority}`);
        console.log(`Deadline: ${deadline.toLocaleString()}`);
        console.log(`Minutes Until: ${minutesUntil.toFixed(2)}`);
        
        if (task.userId && task.userId.email) {
            console.log(`User Email: ${task.userId.email}`);
        } else {
            console.log('WARNING: Missing userId or email on this task!');
        }
    });
    
    mongoose.disconnect();
}

check().catch(console.error);
