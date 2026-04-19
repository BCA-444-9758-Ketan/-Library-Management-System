const { error } = require('../utils/responseHelper');

/**
 * Role-based access control middleware.
 * Usage: requireRole('ADMIN') or requireRole('LIBRARIAN', 'ADMIN').
 */
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return error(res, {
        message: 'Authentication required.',
        statusCode: 401,
      });
    }

    if (!roles.includes(req.user.role)) {
      return error(res, {
        message: `Access denied. Required role(s): ${roles.join(', ')}`,
        statusCode: 403,
      });
    }

    next();
  };
};

module.exports = { requireRole };
