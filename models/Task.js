const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    category: { type: String, default: 'general' },
    title: { type: String, required: true },
    project: { type: String },
    description: { type: String },
    deadline: { type: Date, required: true },
    priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    status: { type: String, enum: ['todo', 'inprogress', 'completed'], default: 'todo' },
    metadata: {
        course: String,
        assignmentType: String,
        amount: Number,
        platform: String,
        recurrence: String,
        person: String,
        action: String
    }
}, { timestamps: true });

module.exports = mongoose.model('Task', taskSchema);
