const express = require('express');
const { getGreeting } = require('../controllers/user.controller');
const { protect } = require('../middlewares/auth.middleware');

const router = express.Router();

/**
 * @swagger
 * /api/user/greeting:
 *   get:
 *     summary: Get a smart, weather-based greeting for the user
 *     tags:
 *       - User
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dynamic greeting message based on governorate weather
 *       401:
 *         description: Not authorized
 */
router.get('/greeting', protect, getGreeting);

module.exports = router;