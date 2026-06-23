// src/routes/admin.routes.js
const express = require('express');
const router = express.Router();

const { protect } = require('../middlewares/auth.middleware');
const { isAdmin } = require('../middlewares/admin.middleware');
const adminController = require('../controllers/admin.controller');

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Admin dashboard dynamic management APIs for all entities
 */

// Apply middlewares to all routes

router.use(protect, isAdmin);

/**
 * @swagger
 * /api/admin/{entity}:
 *   get:
 *     summary: Get all records for a specific entity
 *     description: Retrieve all records dynamically based on entity name.
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: entity
 *         required: true
 *         schema:
 *           type: string
 *           enum: [users, posts, comments, complaints, conversations, messages, disease-scans]
 *         description: Name of the entity collection
 *     responses:
 *       200:
 *         description: Successfully retrieved records
 *       400:
 *         description: Invalid entity name
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Internal server error
 */
router.get('/:entity', adminController.getAll);

/**
 * @swagger
 * /api/admin/{entity}:
 *   post:
 *     summary: Create a new record
 *     description: Create a new document dynamically in the specified entity
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: entity
 *         required: true
 *         schema:
 *           type: string
 *           enum: [users, posts, comments, complaints, conversations, messages, disease-scans]
 *         description: Name of the entity collection
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: JSON payload for the new entity
 *     responses:
 *       201:
 *         description: Record created successfully
 *       400:
 *         description: Validation error or invalid entity
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Internal server error
 */
router.post('/:entity', adminController.createEntity);

/**
 * @swagger
 * /api/admin/{entity}/{id}:
 *   put:
 *     summary: Update a record
 *     description: Update an existing document by ID
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: entity
 *         required: true
 *         schema:
 *           type: string
 *           enum: [users, posts, comments, complaints, conversations, messages, disease-scans]
 *         description: Name of the entity collection
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: Data to update
 *     responses:
 *       200:
 *         description: Record updated successfully
 *       404:
 *         description: Record not found
 *       400:
 *         description: Invalid input
 *       500:
 *         description: Internal server error
 */
router.put('/:entity/:id', adminController.updateEntity);

/**
 * @swagger
 * /api/admin/{entity}/{id}:
 *   delete:
 *     summary: Delete a record
 *     description: Delete a document by ID
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: entity
 *         required: true
 *         schema:
 *           type: string
 *           enum: [users, posts, comments, complaints, conversations, messages, disease-scans]
 *         description: Name of the entity collection
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId
 *     responses:
 *       200:
 *         description: Record deleted successfully
 *       404:
 *         description: Record not found
 *       400:
 *         description: Invalid input
 *       500:
 *         description: Internal server error
 */
router.delete('/:entity/:id', adminController.deleteEntity);

module.exports = router;