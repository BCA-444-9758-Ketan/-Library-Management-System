const prisma = require('../../config/prisma');
const { z } = require('zod');
const { invalidateCache } = require('../../middlewares/cache.middleware');

// ---- Validation ----

const addStockSchema = z.object({
  bookId: z.number().int().positive(),
  branchId: z.number().int().positive(),
  quantity: z.number().int().positive('Quantity must be a positive number'),
});

const transferSchema = z.object({
  bookId: z.number().int().positive(),
  fromBranchId: z.number().int().positive(),
  toBranchId: z.number().int().positive(),
  quantity: z.number().int().positive(),
});

// ---- Service Functions ----

/**
 * Get inventory across all branches with optional filters.
 */
const getInventory = async ({ bookId, branchId, page = 1, limit = 20 }) => {
  const where = {};
  if (bookId) where.bookId = bookId;
  if (branchId) where.branchId = branchId;

  const skip = (page - 1) * limit;

  const [inventory, total] = await Promise.all([
    prisma.inventory.findMany({
      where,
      skip,
      take: limit,
      include: {
        book: { select: { id: true, title: true, author: true, isbn: true } },
        branch: { select: { id: true, name: true, location: true } },
      },
      orderBy: { id: 'desc' },
    }),
    prisma.inventory.count({ where }),
  ]);

  return { inventory, total, page, limit };
};

/**
 * Add or update stock at a branch.
 * Uses upsert: if inventory record exists, increment. Otherwise, create.
 */
const addStock = async (data) => {
  const validated = addStockSchema.parse(data);

  // Verify book and branch exist
  const [book, branch] = await Promise.all([
    prisma.book.findUnique({ where: { id: validated.bookId } }),
    prisma.branch.findUnique({ where: { id: validated.branchId } }),
  ]);

  if (!book) {
    const err = new Error('Book not found');
    err.statusCode = 404;
    throw err;
  }
  if (!branch) {
    const err = new Error('Branch not found');
    err.statusCode = 404;
    throw err;
  }

  const inventory = await prisma.inventory.upsert({
    where: {
      bookId_branchId: {
        bookId: validated.bookId,
        branchId: validated.branchId,
      },
    },
    update: {
      totalQuantity: { increment: validated.quantity },
      availableQuantity: { increment: validated.quantity },
    },
    create: {
      bookId: validated.bookId,
      branchId: validated.branchId,
      totalQuantity: validated.quantity,
      availableQuantity: validated.quantity,
    },
    include: {
      book: { select: { title: true, author: true } },
      branch: { select: { name: true } },
    },
  });

  await invalidateCache('books:*');

  return inventory;
};

/**
 * Transfer books between branches.
 * Uses Prisma transaction to ensure atomicity.
 */
const transferStock = async (data) => {
  const validated = transferSchema.parse(data);

  if (validated.fromBranchId === validated.toBranchId) {
    const err = new Error('Source and destination branches must be different');
    err.statusCode = 400;
    throw err;
  }

  const result = await prisma.$transaction(async (tx) => {
    const firstLockBranchId = Math.min(validated.fromBranchId, validated.toBranchId);
    const secondLockBranchId = Math.max(validated.fromBranchId, validated.toBranchId);

    await tx.$queryRaw`
      SELECT id
      FROM inventory
      WHERE book_id = ${validated.bookId} AND branch_id = ${firstLockBranchId}
      FOR UPDATE
    `;

    if (secondLockBranchId !== firstLockBranchId) {
      await tx.$queryRaw`
        SELECT id
        FROM inventory
        WHERE book_id = ${validated.bookId} AND branch_id = ${secondLockBranchId}
        FOR UPDATE
      `;
    }

    // Lock source inventory row
    const [sourceInventory] = await tx.$queryRaw`
      SELECT id, available_quantity, total_quantity 
      FROM inventory 
      WHERE book_id = ${validated.bookId} AND branch_id = ${validated.fromBranchId}
      FOR UPDATE
    `;

    if (!sourceInventory) {
      const err = new Error('Book not found in source branch');
      err.statusCode = 404;
      throw err;
    }

    if (sourceInventory.available_quantity < validated.quantity) {
      const err = new Error(
        `Insufficient stock. Available: ${sourceInventory.available_quantity}, Requested: ${validated.quantity}`
      );
      err.statusCode = 409;
      throw err;
    }

    // Decrement source
    await tx.inventory.update({
      where: {
        bookId_branchId: {
          bookId: validated.bookId,
          branchId: validated.fromBranchId,
        },
      },
      data: {
        totalQuantity: { decrement: validated.quantity },
        availableQuantity: { decrement: validated.quantity },
      },
    });

    // Upsert destination
    const destination = await tx.inventory.upsert({
      where: {
        bookId_branchId: {
          bookId: validated.bookId,
          branchId: validated.toBranchId,
        },
      },
      update: {
        totalQuantity: { increment: validated.quantity },
        availableQuantity: { increment: validated.quantity },
      },
      create: {
        bookId: validated.bookId,
        branchId: validated.toBranchId,
        totalQuantity: validated.quantity,
        availableQuantity: validated.quantity,
      },
    });

    return destination;
  });

  await invalidateCache('books:*');

  return result;
};

module.exports = { getInventory, addStock, transferStock };
