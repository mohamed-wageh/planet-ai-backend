const express = require('express');
const multer = require('multer');
const { protect } = require('../middlewares/auth.middleware');
const {
  createConversation,
  getConversations,
  getConversation,
  updateConversation,
  deleteConversation,
  sendTextMessage,
  sendImageMessage,
} = require('../controllers/chat.controller');

const router = express.Router();

// Configure multer for in-memory image uploads (max 10MB)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  },
});

// All routes below require authentication
router.use(protect);

/**
 * @swagger
 * tags:
 *   - name: Conversations
 *     description: Manage chat conversations
 *   - name: Messages
 *     description: Send messages within a conversation
 */

/**
 * @swagger
 * /api/chat/conversations:
 *   post:
 *     summary: Create a new conversation
 *     tags: [Conversations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 description: Optional title for the conversation
 *     responses:
 *       201:
 *         description: Conversation created successfully
 *       401:
 *         description: Not authorized
 */
router.post('/conversations', createConversation);

/**
 * @swagger
 * /api/chat/conversations:
 *   get:
 *     summary: Get all conversations for the logged-in user
 *     tags: [Conversations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of conversations
 *       401:
 *         description: Not authorized
 */
router.get('/conversations', getConversations);

/**
 * @swagger
 * /api/chat/conversations/{id}:
 *   get:
 *     summary: Get a single conversation with all its messages
 *     tags: [Conversations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Conversation ID
 *     responses:
 *       200:
 *         description: Conversation with messages
 *       404:
 *         description: Conversation not found
 *       401:
 *         description: Not authorized
 */
router.get('/conversations/:id', getConversation);

/**
 * @swagger
 * /api/chat/conversations/{id}:
 *   patch:
 *     summary: Update conversation title
 *     tags: [Conversations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Conversation ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *             properties:
 *               title:
 *                 type: string
 *     responses:
 *       200:
 *         description: Conversation updated
 *       404:
 *         description: Conversation not found
 *       401:
 *         description: Not authorized
 */
router.patch('/conversations/:id', updateConversation);

/**
 * @swagger
 * /api/chat/conversations/{id}:
 *   delete:
 *     summary: Delete a conversation and all its messages
 *     tags: [Conversations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Conversation ID
 *     responses:
 *       200:
 *         description: Conversation deleted
 *       404:
 *         description: Conversation not found
 *       401:
 *         description: Not authorized
 */
router.delete('/conversations/:id', deleteConversation);

/**
 * @swagger
 * /api/chat/conversations/{id}/text:
 *   post:
 *     summary: Send a text question (processed by LLM)
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Conversation ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - question
 *             properties:
 *               question:
 *                 type: string
 *                 description: The text question to ask the plant AI
 *     responses:
 *       200:
 *         description: LLM response saved
 *       404:
 *         description: Conversation not found
 *       502:
 *         description: LLM service unavailable
 *       401:
 *         description: Not authorized
 */
router.post('/conversations/:id/text', sendTextMessage);

/**
 * @swagger
 * /api/chat/conversations/{id}/image:
 *   post:
 *     summary: Upload a plant image for disease detection (processed by CNN)
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Conversation ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: The plant leaf image to analyze
 *     responses:
 *       200:
 *         description: CNN response saved
 *       404:
 *         description: Conversation not found
 *       502:
 *         description: CNN service unavailable
 *       401:
 *         description: Not authorized
 */
router.post('/conversations/:id/image', upload.single('file'), sendImageMessage);

module.exports = router;
