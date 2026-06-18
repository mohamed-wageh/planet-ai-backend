const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        subject: {
            type: String,
            required: true,
            trim: true
        },
        description: {
            type: String,
            required: true
        },
        status: {
            type: String,
            enum: ['pending', 'reviewed', 'resolved'],
            default: 'pending'
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model('Complaint', complaintSchema);