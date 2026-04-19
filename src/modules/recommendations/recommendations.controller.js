const recommendationsService = require('./recommendations.service');
const { success } = require('../../utils/responseHelper');

const getRecommendations = async (req, res, next) => {
  try {
    const targetUserId = parseInt(req.params.userId, 10);

    if (req.user.role === 'STUDENT' && req.user.id !== targetUserId) {
      const err = new Error('You can only view your own recommendations');
      err.statusCode = 403;
      throw err;
    }

    const result = await recommendationsService.getRecommendations(targetUserId);

    return success(res, {
      data: result,
      message: 'Recommendations retrieved successfully',
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getRecommendations };
