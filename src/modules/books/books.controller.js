const booksService = require('./books.service');
const { success, paginated } = require('../../utils/responseHelper');

const searchBooks = async (req, res, next) => {
  try {
    const { search, category, page = '1', limit = '10' } = req.query;
    const result = await booksService.searchBooks({
      search,
      category,
      page: parseInt(page, 10),
      limit: Math.min(parseInt(limit, 10), 100), // Cap at 100 to prevent abuse
    });

    return paginated(res, {
      data: result.books,
      total: result.total,
      page: result.page,
      limit: result.limit,
      message: 'Books retrieved successfully',
    });
  } catch (err) {
    next(err);
  }
};

const getBookById = async (req, res, next) => {
  try {
    const book = await booksService.getBookById(parseInt(req.params.id, 10));
    return success(res, { data: book, message: 'Book retrieved successfully' });
  } catch (err) {
    next(err);
  }
};

const getBookAvailability = async (req, res, next) => {
  try {
    const availability = await booksService.getBookAvailability(parseInt(req.params.id, 10));
    return success(res, { data: availability, message: 'Availability retrieved successfully' });
  } catch (err) {
    next(err);
  }
};

const createBook = async (req, res, next) => {
  try {
    const book = await booksService.createBook(req.body);
    return success(res, { data: book, message: 'Book created successfully', statusCode: 201 });
  } catch (err) {
    next(err);
  }
};

module.exports = { searchBooks, getBookById, getBookAvailability, createBook };
