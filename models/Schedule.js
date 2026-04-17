const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    tasks: [{
        taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task' },
        title: String,
        project: String,
        description: String,
        deadline: Date,
        priority: String,
        status: String,
        quadrant: Number
    }]
}, { timestamps: true });

module.exports = mongoose.model('Schedule', scheduleSchema);
