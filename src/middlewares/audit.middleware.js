const prisma = require('../config/prisma');

/**
 * Audit logging middleware.
 *
 * Automatically logs all mutating operations (POST, PUT, PATCH, DELETE)
 * to the AuditLog table. This is critical for compliance and debugging.
 *
 * This runs AFTER the response is sent (using res.on('finish'))
 * so it doesn't slow down the actual request.
 */
const auditMiddleware = (req, res, next) => {
  // Only audit mutating operations
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    return next();
  }

  // Capture response data after the response is sent
  const originalJson = res.json.bind(res);

  res.json = (body) => {
    // Only log successful mutations
    if (res.statusCode >= 200 && res.statusCode < 300) {
      const sourcePath = req.originalUrl || req.path;
      const entity = extractEntity(sourcePath);
      const entityId = body?.data?.id || extractEntityId(sourcePath) || 0;

      // Fire and forget - don't block the response
      prisma.auditLog
        .create({
          data: {
            action: `${req.method} ${sourcePath}`,
            entity,
            entityId: typeof entityId === 'number' ? entityId : parseInt(entityId, 10) || 0,
            userId: req.user?.id || null,
            metadata: {
              body: sanitizeBody(req.body),
              statusCode: res.statusCode,
            },
          },
        })
        .catch((err) => {
          console.error('[AUDIT LOG ERROR]', err.message);
        });
    }

    return originalJson(body);
  };

  next();
};

/**
 * Extract entity name from path (e.g., /api/v1/books/5 → "books")
 */
function extractEntity(path) {
  const parts = path.split('/').filter(Boolean);
  // Skip 'api' and 'v1'
  const relevantParts = parts.filter((p) => p !== 'api' && !p.startsWith('v'));
  return relevantParts[0] || 'unknown';
}

/**
 * Extract entity ID from path (e.g., /api/v1/books/5 → 5)
 */
function extractEntityId(path) {
  const parts = path.split('/').filter(Boolean);
  const numericParts = parts.filter((p) => /^\d+$/.test(p));
  return numericParts.length > 0 ? parseInt(numericParts[0], 10) : 0;
}

/**
 * Remove sensitive fields from request body before logging
 */
function sanitizeBody(body) {
  if (!body) return {};
  const { password, token, ...safe } = body;
  return safe;
}

module.exports = auditMiddleware;
