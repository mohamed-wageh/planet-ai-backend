const express = require('express');
const router = express.Router();
const communityController = require('../controllers/community.controller');
const { protect } = require('../middlewares/auth.middleware');
const upload = require('../middlewares/upload.middleware');

/**
 * @swagger
 * tags:
 *   - name: Community
 *     description: Community posts and comments management
 */

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

// Protect all routes
router.use(protect);

/**
 * @swagger
 * /api/community/posts:
 *   get:
 *     summary: Get all community posts
 *     tags: [Community]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all posts
 *
 *   post:
 *     summary: Create a new post with optional image
 *     tags: [Community]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *                 description: The text content of the post
 *               media:
 *                 type: string
 *                 format: binary
 *                 description: Image file (optional)
 *     responses:
 *       201:
 *         description: Post created successfully
 */
router
  .route('/posts')
  .get(communityController.getPosts)
  .post(upload.single('media'), communityController.createPost);

/**
 * @swagger
 * /api/community/posts/{postId}/upvote:
 *   post:
 *     summary: Toggle upvote on a post
 *     tags: [Community]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: The post ID
 *     responses:
 *       200:
 *         description: Upvote toggled successfully
 */
router.post('/posts/:postId/upvote', communityController.togglePostUpvote);

/**
 * @swagger
 * /api/community/posts/{postId}/comments:
 *   get:
 *     summary: Get comments for a specific post
 *     tags: [Community]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of comments sorted by role and votes
 *
 *   post:
 *     summary: Add a comment to a post
 *     tags: [Community]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *     responses:
 *       201:
 *         description: Comment added successfully
 */
router
  .route('/posts/:postId/comments')
  .get(communityController.getPostComments)
  .post(communityController.addComment);

/**
 * @swagger
 * /api/community/comments/{commentId}/vote:
 *   post:
 *     summary: Upvote or downvote a comment
 *     tags: [Community]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - voteType
 *             properties:
 *               voteType:
 *                 type: string
 *                 enum: [upvote, downvote]
 *     responses:
 *       200:
 *         description: Vote registered successfully
 */
router.post('/comments/:commentId/vote', communityController.voteComment);

module.exports = router;