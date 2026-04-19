const { Router } = require('express');
const transactionsController = require('./transactions.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { requireRole } = require('../../middlewares/role.middleware');

const router = Router();

/**
 * @swagger
 * /transactions/issue:
 *   post:
 *     tags: [Transactions]
 *     summary: Issue a book
 *     description: |
 *       Issue a book to the authenticated user. Uses PostgreSQL row-level locking
 *       (SELECT FOR UPDATE) to prevent race conditions.
 *       
 *       Checks performed:
 *       - Available quantity > 0
 *       - User below borrowing limit
 *       - No duplicate active issue for same book
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [bookId, branchId]
 *             properties:
 *               bookId:
 *                 type: integer
 *                 example: 1
 *               branchId:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       201:
 *         description: Book issued successfully
 *       409:
 *         description: Conflict - no copies available or borrowing limit reached
 */
router.post('/issue', authenticate, transactionsController.issueBook);

/**
 * @swagger
 * /transactions/return:
 *   post:
 *     tags: [Transactions]
 *     summary: Return a book
 *     description: |
 *       Return a borrowed book. Calculates fine if overdue (Rs 5/day).
 *       Auto-fulfills pending reservations when a copy becomes available.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             oneOf:
 *               - type: object
 *                 required: [transactionId]
 *                 properties:
 *                   transactionId:
 *                     type: integer
 *                     example: 1
 *               - type: object
 *                 required: [bookId]
 *                 properties:
 *                   bookId:
 *                     type: integer
 *                     example: 1
 *     responses:
 *       200:
 *         description: Book returned successfully with fine details
 *       404:
 *         description: Active transaction not found
 */
router.post('/return', authenticate, transactionsController.returnBook);

/**
 * @swagger
 * /transactions:
 *   get:
 *     tags: [Transactions]
 *     summary: Get all transactions
 *     description: Get all transactions with optional filters. ADMIN and LIBRARIAN only.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ISSUED, RETURNED, OVERDUE]
 *       - in: query
 *         name: userId
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
 *         description: Transaction list with pagination
 */
router.get('/', authenticate, requireRole('ADMIN', 'LIBRARIAN'), transactionsController.getAllTransactions);

/**
 * @swagger
 * /transactions/my:
 *   get:
 *     tags: [Transactions]
 *     summary: My transactions
 *     description: Get all transactions for the logged-in user.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User's transaction history
 */
router.get('/my', authenticate, transactionsController.getMyTransactions);

module.exports = router;
