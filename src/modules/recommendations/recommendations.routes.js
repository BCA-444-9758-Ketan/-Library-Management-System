const { Router } = require('express');
const recommendationsController = require('./recommendations.controller');
const { authenticate } = require('../../middlewares/auth.middleware');

const router = Router();

/**
 * @swagger
 * /recommendations/{userId}:
 *   get:
 *     tags: [Recommendations]
 *     summary: Get recommendations for a user
 *     description: |
 *       Recommends books from categories in the user's last 10 transactions.
 *       If no history exists, returns top currently available books.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Recommendations retrieved
 *       403:
 *         description: Forbidden
 *       404:
 *         description: User not found
 */
router.get('/:userId', authenticate, recommendationsController.getRecommendations);

module.exports = router;
