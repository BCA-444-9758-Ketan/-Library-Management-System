const auditService = require('./audit.service');
const { paginated } = require('../../utils/responseHelper');

const getAuditLogs = async (req, res, next) => {
  try {
    const result = await auditService.getAuditLogs(req.query);

    return paginated(res, {
      data: result.logs,
      total: result.total,
      page: result.page,
      limit: result.limit,
      message: 'Audit logs retrieved successfully',
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAuditLogs };
