const { Router } = require('express');
const branchesController = require('./branches.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { requireRole } = require('../../middlewares/role.middleware');

const router = Router();

/**
 * @swagger
 * /branches:
 *   get:
 *     tags: [Branches]
 *     summary: List all branches
 *     description: Public endpoint to list all available library branches.
 *     responses:
 *       200:
 *         description: Branch list retrieved successfully
 */
router.get('/', branchesController.getBranches);

/**
 * @swagger
 * /branches:
 *   post:
 *     tags: [Branches]
 *     summary: Create a branch
 *     description: Add a new library branch. ADMIN only.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, location]
 *             properties:
 *               name:
 *                 type: string
 *                 example: Main Branch
 *               location:
 *                 type: string
 *                 example: CIMAGE Boring Road Patna
 *     responses:
 *       201:
 *         description: Branch created
 *       403:
 *         description: Forbidden
 */
router.post('/', authenticate, requireRole('ADMIN'), branchesController.createBranch);

module.exports = router;
