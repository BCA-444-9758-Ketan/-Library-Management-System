const { Router } = require('express');
const inventoryController = require('./inventory.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { requireRole } = require('../../middlewares/role.middleware');

const router = Router();

/**
 * @swagger
 * /inventory:
 *   get:
 *     tags: [Inventory]
 *     summary: Get inventory across branches
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: bookId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: branchId
 *         schema:
 *           type: integer
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
 *     responses:
 *       200:
 *         description: Inventory list with pagination
 */
router.get('/', authenticate, inventoryController.getInventory);

/**
 * @swagger
 * /inventory:
 *   post:
 *     tags: [Inventory]
 *     summary: Add stock to a branch
 *     description: Add book copies to a specific branch inventory. ADMIN only.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [bookId, branchId, quantity]
 *             properties:
 *               bookId:
 *                 type: integer
 *                 example: 1
 *               branchId:
 *                 type: integer
 *                 example: 1
 *               quantity:
 *                 type: integer
 *                 example: 5
 *     responses:
 *       201:
 *         description: Stock added
 *       404:
 *         description: Book or branch not found
 */
router.post('/', authenticate, requireRole('ADMIN'), inventoryController.addStock);

/**
 * @swagger
 * /inventory/transfer:
 *   patch:
 *     tags: [Inventory]
 *     summary: Transfer books between branches
 *     description: Atomically transfer book copies from one branch to another. Uses row-level locking for concurrency safety.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [bookId, fromBranchId, toBranchId, quantity]
 *             properties:
 *               bookId:
 *                 type: integer
 *                 example: 1
 *               fromBranchId:
 *                 type: integer
 *                 example: 1
 *               toBranchId:
 *                 type: integer
 *                 example: 2
 *               quantity:
 *                 type: integer
 *                 example: 2
 *     responses:
 *       200:
 *         description: Transfer successful
 *       409:
 *         description: Insufficient stock
 */
router.patch('/transfer', authenticate, requireRole('ADMIN', 'LIBRARIAN'), inventoryController.transferStock);

module.exports = router;
