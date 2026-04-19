const usersService = require('./users.service');
const { paginated, success } = require('../../utils/responseHelper');

const getUsers = async (req, res, next) => {
  try {
    const { page = '1', limit = '20', search = '' } = req.query;

    const result = await usersService.getUsers({
      page: parseInt(page, 10),
      limit: Math.min(parseInt(limit, 10), 100),
      search,
    });

    return paginated(res, {
      data: result.users,
      total: result.total,
      page: result.page,
      limit: result.limit,
      message: 'Users retrieved successfully',
    });
  } catch (err) {
    next(err);
  }
};

const getUserProfile = async (req, res, next) => {
  try {
    const targetUserId = parseInt(req.params.id, 10);

    if (
      req.user.role === 'STUDENT' &&
      req.user.id !== targetUserId
    ) {
      const err = new Error('You can only access your own profile');
      err.statusCode = 403;
      throw err;
    }

    const user = await usersService.getUserProfile(targetUserId);

    return success(res, {
      data: user,
      message: 'User profile retrieved successfully',
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getUsers, getUserProfile };
