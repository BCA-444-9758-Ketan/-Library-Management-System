const { Router } = require('express');
const usersController = require('./users.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { requireRole } = require('../../middlewares/role.middleware');

const router = Router();

/**
 * @swagger
 * /users:
 *   get:
 *     tags: [Users]
 *     summary: List users
 *     description: List all users. ADMIN only.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Users retrieved
 */
router.get('/', authenticate, requireRole('ADMIN'), usersController.getUsers);

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     tags: [Users]
 *     summary: Get user profile with active transactions
 *     description: |
 *       Get a user profile and active transactions.
 *       STUDENT users can access only their own profile.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: User profile retrieved
 *       403:
 *         description: Forbidden
 *       404:
 *         description: User not found
 */
router.get('/:id', authenticate, usersController.getUserProfile);

module.exports = router;
