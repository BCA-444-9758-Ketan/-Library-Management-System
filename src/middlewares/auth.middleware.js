const jwt = require('jsonwebtoken');
const { error } = require('../utils/responseHelper');
const { requireRole } = require('./role.middleware');

/**
 * JWT authentication middleware.
 * Extracts token from Authorization header (Bearer <token>),
 * verifies it, and attaches decoded user to `req.user`.
 */
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return error(res, {
      message: 'Authentication required. Provide a valid Bearer token.',
      statusCode: 401,
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = {
      id: decoded.id,
      role: decoded.role,
      email: decoded.email,
    };
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return error(res, { message: 'Token expired. Please login again.', statusCode: 401 });
    }
    return error(res, { message: 'Invalid token.', statusCode: 401 });
  }
};

module.exports = { authenticate, requireRole };
