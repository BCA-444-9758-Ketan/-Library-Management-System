const { Prisma } = require('@prisma/client');

/**
 * Global error handler middleware (Express 4-argument signature).
 *
 * This catches all unhandled errors thrown in route handlers and
 * translates them into clean JSON responses. In production,
 * stack traces are hidden to prevent information leakage.
 */
const errorHandler = (err, req, res, _next) => {
  console.error(`[ERROR] ${req.method} ${req.path}:`, err.message);

  // Prisma-specific errors → user-friendly messages
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case 'P2002': {
        const fields = err.meta?.target?.join(', ') || 'field';
        return res.status(409).json({
          success: false,
          message: `Duplicate value for: ${fields}. This record already exists.`,
          statusCode: 409,
        });
      }
      case 'P2025':
        return res.status(404).json({
          success: false,
          message: 'Record not found.',
          statusCode: 404,
        });
      case 'P2003':
        return res.status(400).json({
          success: false,
          message: 'Invalid reference. The related record does not exist.',
          statusCode: 400,
        });
      default:
        return res.status(400).json({
          success: false,
          message: `Database error: ${err.message}`,
          statusCode: 400,
        });
    }
  }

  // Zod validation errors
  if (err.name === 'ZodError') {
    const issues = err.issues || err.errors || [];
    const messages = issues.map((e) => `${e.path.join('.')}: ${e.message}`);
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: messages,
      statusCode: 400,
    });
  }

  // Custom application errors (thrown with statusCode)
  const statusCode = err.statusCode || 500;
  const message =
    statusCode === 500 && process.env.NODE_ENV === 'production'
      ? 'Internal Server Error'
      : err.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    message,
    statusCode,
  });
};

module.exports = errorHandler;
