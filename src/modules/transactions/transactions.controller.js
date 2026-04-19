const transactionsService = require('./transactions.service');
const { success, paginated } = require('../../utils/responseHelper');

const issueBook = async (req, res, next) => {
  try {
    const transaction = await transactionsService.issueBook(req.user.id, req.body);
    return success(res, {
      data: transaction,
      message: 'Book issued successfully',
      statusCode: 201,
    });
  } catch (err) {
    next(err);
  }
};

const returnBook = async (req, res, next) => {
  try {
    const result = await transactionsService.returnBook(req.user.id, req.body);
    return success(res, { data: result, message: 'Book returned successfully' });
  } catch (err) {
    next(err);
  }
};

const getAllTransactions = async (req, res, next) => {
  try {
    const { status, userId, page = '1', limit = '20' } = req.query;
    const result = await transactionsService.getAllTransactions({
      status,
      userId: userId ? parseInt(userId, 10) : undefined,
      page: parseInt(page, 10),
      limit: Math.min(parseInt(limit, 10), 100),
    });

    return paginated(res, {
      data: result.transactions,
      total: result.total,
      page: result.page,
      limit: result.limit,
      message: 'Transactions retrieved successfully',
    });
  } catch (err) {
    next(err);
  }
};

const getMyTransactions = async (req, res, next) => {
  try {
    const transactions = await transactionsService.getMyTransactions(req.user.id);
    return success(res, { data: transactions, message: 'Your transactions retrieved successfully' });
  } catch (err) {
    next(err);
  }
};

module.exports = { issueBook, returnBook, getAllTransactions, getMyTransactions };
