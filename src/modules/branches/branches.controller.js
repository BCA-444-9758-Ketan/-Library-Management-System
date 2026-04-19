const branchesService = require('./branches.service');
const { success } = require('../../utils/responseHelper');

const getBranches = async (_req, res, next) => {
  try {
    const branches = await branchesService.getBranches();
    return success(res, {
      data: branches,
      message: 'Branches retrieved successfully',
    });
  } catch (err) {
    next(err);
  }
};

const createBranch = async (req, res, next) => {
  try {
    const branch = await branchesService.createBranch(req.body);
    return success(res, {
      data: branch,
      message: 'Branch created successfully',
      statusCode: 201,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getBranches, createBranch };
