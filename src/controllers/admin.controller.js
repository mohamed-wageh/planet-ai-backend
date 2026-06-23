// src/controllers/admin.controller.js
const mongoose = require('mongoose');

const getModel = (modelName) => {
    const models = {
        users: 'User',
        posts: 'Post',
        comments: 'Comment',
        complaints: 'Complaint',
        conversations: 'Conversation',
        messages: 'Message',
        'disease-scans': 'DiseaseScan' 
    };
    const exactName = models[modelName.toLowerCase()];
    if (!exactName) return null;
    return mongoose.model(exactName);
};

exports.getAll = async (req, res) => {
    const Model = getModel(req.params.entity);
    if (!Model) return res.status(400).json({ error: 'Invalid entity name' });

    try {
        const data = await Model.find();
        res.status(200).json({ success: true, count: data.length, data });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.createEntity = async (req, res) => {
    const Model = getModel(req.params.entity);
    if (!Model) return res.status(400).json({ error: 'Invalid entity name' });

    try {
        const newData = await Model.create(req.body);
        res.status(201).json({ success: true, data: newData });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.updateEntity = async (req, res) => {
    const Model = getModel(req.params.entity);
    if (!Model) return res.status(400).json({ error: 'Invalid entity name' });

    try {
        const updatedData = await Model.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });
        if (!updatedData) return res.status(404).json({ error: 'Not found' });
        res.status(200).json({ success: true, data: updatedData });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.deleteEntity = async (req, res) => {
    const Model = getModel(req.params.entity);
    if (!Model) return res.status(400).json({ error: 'Invalid entity name' });

    try {
        const deletedData = await Model.findByIdAndDelete(req.params.id);
        if (!deletedData) return res.status(404).json({ error: 'Not found' });
        res.status(200).json({ success: true, data: {} });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};