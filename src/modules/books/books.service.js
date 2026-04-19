const prisma = require('../../config/prisma');
const { z } = require('zod');
const { invalidateCache } = require('../../middlewares/cache.middleware');

// ---- Validation ----

const createBookSchema = z.object({
  title: z.string().min(1, 'Title is required').max(500),
  author: z.string().min(1, 'Author is required').max(300),
  isbn: z.string().min(10, 'ISBN must be at least 10 characters').max(13),
  category: z.string().min(1, 'Category is required'),
  description: z.string().optional(),
  publishedYear: z.number().int().min(1000).max(new Date().getFullYear()).optional(),
});

// ---- Service Functions ----

/**
 * Search books with pagination and filters.
 * Supports search by title, author; filter by category.
 */
const searchBooks = async ({ search, category, page = 1, limit = 10 }) => {
  const skip = (page - 1) * limit;

  const where = {};

  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { author: { contains: search, mode: 'insensitive' } },
      { isbn: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (category) {
    where.category = { equals: category, mode: 'insensitive' };
  }

  const [books, total] = await Promise.all([
    prisma.book.findMany({
      where,
      skip,
      take: limit,
      include: {
        inventory: {
          include: { branch: true },
        },
      },
      orderBy: { title: 'asc' },
    }),
    prisma.book.count({ where }),
  ]);

  return { books, total, page, limit };
};

/**
 * Get a single book with full branch availability details.
 */
const getBookById = async (id) => {
  const book = await prisma.book.findUnique({
    where: { id },
    include: {
      inventory: {
        include: { branch: true },
      },
    },
  });

  if (!book) {
    const err = new Error('Book not found');
    err.statusCode = 404;
    throw err;
  }

  return book;
};

/**
 * Get real-time availability of a book across all branches.
 */
const getBookAvailability = async (bookId) => {
  const inventory = await prisma.inventory.findMany({
    where: { bookId },
    include: { branch: true },
  });

  return inventory.map((inv) => ({
    branchId: inv.branchId,
    branchName: inv.branch.name,
    location: inv.branch.location,
    totalQuantity: inv.totalQuantity,
    availableQuantity: inv.availableQuantity,
  }));
};

/**
 * Create a new book.
 * Invalidates search cache since results are now stale.
 */
const createBook = async (data) => {
  const validated = createBookSchema.parse(data);

  const book = await prisma.book.create({
    data: validated,
  });

  // Invalidate all book search caches
  await invalidateCache('books:*');

  return book;
};

module.exports = { searchBooks, getBookById, getBookAvailability, createBook };
