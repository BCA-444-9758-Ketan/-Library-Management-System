const { Router } = require('express');
const reservationsController = require('./reservations.controller');
const { authenticate } = require('../../middlewares/auth.middleware');

const router = Router();

/**
 * @swagger
 * /reservations:
 *   post:
 *     tags: [Reservations]
 *     summary: Reserve a book
 *     description: Create a reservation for a book that isn't currently available. Prevents duplicate pending reservations.
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
 *         description: Reservation created
 *       409:
 *         description: Duplicate reservation
 */
router.post('/', authenticate, reservationsController.createReservation);

/**
 * @swagger
 * /reservations/{id}:
 *   delete:
 *     tags: [Reservations]
 *     summary: Cancel a reservation
 *     description: Cancel a pending reservation. Only the owner can cancel.
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
 *         description: Reservation cancelled
 *       404:
 *         description: Reservation not found
 */
router.delete('/:id', authenticate, reservationsController.cancelReservation);

/**
 * @swagger
 * /reservations/my:
 *   get:
 *     tags: [Reservations]
 *     summary: My reservations
 *     description: Get all reservations for the authenticated user.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User's reservations
 */
router.get('/my', authenticate, reservationsController.getMyReservations);

module.exports = router;
