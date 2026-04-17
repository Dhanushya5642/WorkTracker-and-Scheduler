const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true },
    password: { type: String, required: true } // Storing in plain text for now to keep it simple
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
