const authService = require('./auth.service');
const { success } = require('../../utils/responseHelper');

/**
 * Register a new user
 */
const register = async (req, res, next) => {
  try {
    const result = await authService.register(req.body);
    return success(res, {
      data: result,
      message: 'User registered successfully',
      statusCode: 201,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Login user
 */
const login = async (req, res, next) => {
  try {
    const result = await authService.login(req.body);
    return success(res, {
      data: result,
      message: 'Login successful',
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login };
