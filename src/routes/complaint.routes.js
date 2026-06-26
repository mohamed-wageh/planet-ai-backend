const express = require('express');
const router = express.Router();
const { submitComplaint, getAllComplaints, getUserComplaints, answerComplaint, deleteComplaint } = require('../controllers/complaint.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const { isAdmin } = require('../middlewares/admin.middleware');

/**
 * @swagger
 * tags:
 *   name: Complaints
 *   description: API endpoints for managing user complaints and feedback
 */

// Protect all complaint routes with user authentication
router.use(authMiddleware.protect);

/**
 * @swagger
 * /api/complaints:
 *   get:
 *     summary: Get all complaints
 *     tags: [Complaints]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved all complaints
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 count:
 *                   type: integer
 *                   example: 1
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       subject:
 *                         type: string
 *                       description:
 *                         type: string
 *                       status:
 *                         type: string
 *                       user:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           username:
 *                             type: string
 *                           role:
 *                             type: string
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/', getAllComplaints);

/**
 * @swagger
 * /api/complaints:
 *   post:
 *     summary: Submit a new complaint
 *     tags: [Complaints]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - subject
 *               - description
 *             properties:
 *               subject:
 *                 type: string
 *                 description: The brief title or subject of the complaint
 *                 example: "Fix system connection issue"
 *               description:
 *                 type: string
 *                 description: Detailed explanation of the issue faced by the user
 *                 example: "The model API drops connection during concurrent image requests."
 *     responses:
 *       201:
 *         description: Complaint submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Complaint submitted successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: "64f1a2b3c4d5e6f7a8b9c0d1"
 *                     user:
 *                       type: string
 *                       example: "64f1a2b3c4d5e6f7a8b9c000"
 *                     subject:
 *                       type: string
 *                       example: "Fix system connection issue"
 *                     description:
 *                       type: string
 *                       example: "The model API drops connection during concurrent image requests."
 *                     status:
 *                       type: string
 *                       example: "pending"
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2026-06-18T20:00:00.000Z"
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2026-06-18T20:00:00.000Z"
 *       401:
 *         description: Unauthorized - Missing or invalid token
 *       500:
 *         description: Internal server error
 */
router.post('/', submitComplaint);
router.get('/my-complaints', getUserComplaints);
router.put('/:id/answer', isAdmin, answerComplaint);
router.delete('/:id', isAdmin, deleteComplaint);

module.exports = router;