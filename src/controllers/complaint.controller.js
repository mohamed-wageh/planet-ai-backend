const Complaint = require('../models/complaint.model');

exports.submitComplaint = async (req, res, next) => {
    try {
        const { subject, description } = req.body;
        const userId = req.user.id; 
        const complaint = await Complaint.create({
            user: userId,
            subject,
            description
        });

        res.status(201).json({
            success: true,
            data: complaint,
            message: 'Complaint submitted successfully'
        });
    } catch (error) {
        next(error); 
    }
};

// Get all complaints (Usually for Admin Dashboard)
exports.getAllComplaints = async (req, res, next) => {
    try {
        const complaints = await Complaint.find()
            .sort({ createdAt: -1 }) // الأحدث أولاً
            .populate('user', 'username role governorate'); // جلب بيانات صاحب الشكوى

        res.status(200).json({
            success: true,
            count: complaints.length,
            data: complaints
        });
    } catch (error) {
        next(error);
    }
};