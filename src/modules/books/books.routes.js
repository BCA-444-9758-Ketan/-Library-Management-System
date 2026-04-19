const { Router } = require('express');
const booksController = require('./books.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { requireRole } = require('../../middlewares/role.middleware');
const { cacheMiddleware } = require('../../middlewares/cache.middleware');

const router = Router();

// Cache key generator for book searches
const bookSearchCacheKey = (req) => {
  const { search = '', category = '', page = '1', limit = '10' } = req.query;
  return `books:search:${search}:${category}:${page}:${limit}`;
};

/**
 * @swagger
 * /books:
 *   get:
 *     tags: [Books]
 *     summary: Search books
 *     description: Search books by title, author, or ISBN with pagination. Results are cached for 5 minutes.
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term (title, author, ISBN)
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: List of books with pagination
 */
router.get('/', cacheMiddleware(bookSearchCacheKey, 300), booksController.searchBooks);

/**
 * @swagger
 * /books:
 *   post:
 *     tags: [Books]
 *     summary: Add a new book
 *     description: Create a new book record. Requires LIBRARIAN or ADMIN role.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, author, isbn, category]
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Data Structures and Algorithms"
 *               author:
 *                 type: string
 *                 example: "Narasimha Karumanchi"
 *               isbn:
 *                 type: string
 *                 example: "9788192107554"
 *               category:
 *                 type: string
 *                 example: "Computer Science"
 *               description:
 *                 type: string
 *               publishedYear:
 *                 type: integer
 *                 example: 2016
 *     responses:
 *       201:
 *         description: Book created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient role
 */
router.post('/', authenticate, requireRole('LIBRARIAN', 'ADMIN'), booksController.createBook);

/**
 * @swagger
 * /books/{id}:
 *   get:
 *     tags: [Books]
 *     summary: Get book by ID
 *     description: Get a single book with all branch availability information.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Book details with inventory
 *       404:
 *         description: Book not found
 */
router.get('/:id', booksController.getBookById);

/**
 * @swagger
 * /books/{id}/availability:
 *   get:
 *     tags: [Books]
 *     summary: Book availability across branches
 *     description: Get real-time availability of a book across all library branches.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Availability data by branch
 */
router.get('/:id/availability', booksController.getBookAvailability);

module.exports = router;
