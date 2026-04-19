/**
 * Standardized API response helpers.
 *
 * Why? Consistent response shapes make it trivial for frontend devs
 * to parse your API. Every response has `success`, `message`, and `data`.
 * Paginated responses add a `pagination` object.
 */

/**
 * Send a success response
 */
const success = (res, { data = null, message = 'Success', statusCode = 200 } = {}) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

/**
 * Send a paginated success response
 */
const paginated = (res, { data, total, page, limit, message = 'Success' }) => {
  return res.status(200).json({
    success: true,
    message,
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  });
};

/**
 * Send an error response
 */
const error = (res, { message = 'Internal Server Error', statusCode = 500 } = {}) => {
  return res.status(statusCode).json({
    success: false,
    message,
    statusCode,
  });
};

module.exports = { success, paginated, error };
