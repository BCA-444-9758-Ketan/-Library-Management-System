const { Router } = require('express');
const auditController = require('./audit.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { requireRole } = require('../../middlewares/role.middleware');

const router = Router();

/**
 * @swagger
 * /audit-logs:
 *   get:
 *     tags: [Audit]
 *     summary: List audit logs
 *     description: Retrieve audit entries with optional filters. ADMIN only.
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
 *         name: action
 *         schema:
 *           type: string
 *       - in: query
 *         name: entity
 *         schema:
 *           type: string
 *       - in: query
 *         name: userId
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Audit logs retrieved
 */
router.get('/', authenticate, requireRole('ADMIN'), auditController.getAuditLogs);

module.exports = router;
