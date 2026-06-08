const express = require('express');
const {
  getPublicScans,
  getDistributionByGovernorate,
  getDistributionByDisease,
} = require('../controllers/analytics.controller');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Analytics
 *     description: Public health data and scan distributions
 */

/**
 * @swagger
 * /api/analytics/scans:
 *   get:
 *     summary: Get all scans with pagination and filters
 *     tags:
 *       - Analytics
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [governorate, disease, date]
 *         description: Sort the results
 *       - in: query
 *         name: governorate
 *         schema:
 *           type: string
 *         description: Filter by specific governorate
 *     responses:
 *       200:
 *         description: Paginated list of scans
 */
router.get('/scans', getPublicScans);

/**
 * @swagger
 * /api/analytics/distribution/governorate:
 *   get:
 *     summary: Get diseases distribution grouped by governorate
 *     tags:
 *       - Analytics
 *     responses:
 *       200:
 *         description: Statistics grouped by governorate
 */
router.get('/distribution/governorate', getDistributionByGovernorate);

/**
 * @swagger
 * /api/analytics/distribution/disease:
 *   get:
 *     summary: Get governorates distribution grouped by disease
 *     tags:
 *       - Analytics
 *     responses:
 *       200:
 *         description: Statistics grouped by disease
 */
router.get('/distribution/disease', getDistributionByDisease);

module.exports = router;