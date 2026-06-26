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

exports.getUserComplaints = async (req, res, next) => {
    try {
        const complaints = await Complaint.find({ user: req.user.id })
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: complaints.length,
            data: complaints
        });
    } catch (error) {
        next(error);
    }
};

exports.answerComplaint = async (req, res, next) => {
    try {
        const { answer } = req.body;
        const complaint = await Complaint.findById(req.params.id);

        if (!complaint) {
            return res.status(404).json({ success: false, message: 'Complaint not found' });
        }

        complaint.answer = answer;
        complaint.status = 'resolved';
        complaint.answeredAt = Date.now();
        await complaint.save();

        res.status(200).json({
            success: true,
            data: complaint,
            message: 'Complaint answered successfully'
        });
    } catch (error) {
        next(error);
    }
};

exports.deleteComplaint = async (req, res, next) => {
    try {
        const complaint = await Complaint.findByIdAndDelete(req.params.id);

        if (!complaint) {
            return res.status(404).json({ success: false, message: 'Complaint not found' });
        }

        res.status(200).json({
            success: true,
            message: 'Complaint deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};