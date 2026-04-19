const prisma = require('../../config/prisma');
const { z } = require('zod');
const { calculateFine } = require('../../utils/fineCalculator');

const LOAN_PERIOD_DAYS = parseInt(process.env.LOAN_PERIOD_DAYS, 10) || 14;

// ---- Validation ----

const issueBookSchema = z.object({
  bookId: z.number().int().positive(),
  branchId: z.number().int().positive(),
});

const returnBookSchema = z
  .object({
    transactionId: z.number().int().positive().optional(),
    bookId: z.number().int().positive().optional(),
  })
  .refine((value) => value.transactionId || value.bookId, {
    message: 'Either transactionId or bookId is required',
  });

// ---- Service Functions ----

/**
 * Issue a book to a user.
 *
 * This is the most critical function in the system. It uses PostgreSQL
 * row-level locking (SELECT ... FOR UPDATE) inside a Prisma transaction
 * to prevent race conditions where two users try to issue the last copy
 * simultaneously.
 *
 * Steps:
 * 1. Validate input
 * 2. Check user's borrowing limit
 * 3. Check for duplicate active issue
 * 4. Lock inventory row (FOR UPDATE)
 * 5. Verify availability
 * 6. Decrement quantity + create transaction (atomically)
 */
const issueBook = async (userId, data) => {
  const validated = issueBookSchema.parse(data);

  // === Critical section: atomic transaction with row-level lock ===
  const result = await prisma.$transaction(async (tx) => {
    // Lock user row first to serialize concurrent issuing for the same user.
    const lockedUsers = await tx.$queryRaw`
      SELECT id, borrowing_limit
      FROM users
      WHERE id = ${userId}
      FOR UPDATE
    `;

    if (!lockedUsers || lockedUsers.length === 0) {
      const err = new Error('User not found');
      err.statusCode = 404;
      throw err;
    }

    const borrowingLimit = Number(lockedUsers[0].borrowing_limit);

    const activeCount = await tx.transaction.count({
      where: { userId, status: 'ISSUED' },
    });

    if (activeCount >= borrowingLimit) {
      const err = new Error(
        `Borrowing limit reached. You have ${activeCount}/${borrowingLimit} active issues.`
      );
      err.statusCode = 409;
      throw err;
    }

    const duplicate = await tx.transaction.findFirst({
      where: { userId, bookId: validated.bookId, status: 'ISSUED' },
    });

    if (duplicate) {
      const err = new Error('You already have this book issued. Return it first.');
      err.statusCode = 409;
      throw err;
    }

    // Lock the inventory row - prevents concurrent reads from seeing stale data
    const rows = await tx.$queryRaw`
      SELECT id, available_quantity, total_quantity 
      FROM inventory 
      WHERE book_id = ${validated.bookId} AND branch_id = ${validated.branchId}
      FOR UPDATE
    `;

    if (!rows || rows.length === 0) {
      const err = new Error('Book not available at this branch');
      err.statusCode = 404;
      throw err;
    }

    const inventory = rows[0];

    if (inventory.available_quantity < 1) {
      const err = new Error('No copies available at this branch. Consider placing a reservation.');
      err.statusCode = 409;
      throw err;
    }

    // Decrement available quantity
    await tx.inventory.update({
      where: { id: Number(inventory.id) },
      data: { availableQuantity: { decrement: 1 } },
    });

    // Calculate due date
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + LOAN_PERIOD_DAYS);

    // Create transaction record
    const transaction = await tx.transaction.create({
      data: {
        userId,
        bookId: validated.bookId,
        branchId: validated.branchId,
        status: 'ISSUED',
        dueDate,
      },
      include: {
        book: { select: { title: true, author: true } },
        user: { select: { name: true, email: true } },
        branch: { select: { id: true, name: true, location: true } },
      },
    });

    // Log audit
    await tx.auditLog.create({
      data: {
        action: 'BOOK_ISSUED',
        entity: 'transactions',
        entityId: transaction.id,
        userId,
        metadata: {
          bookId: validated.bookId,
          branchId: validated.branchId,
          dueDate: dueDate.toISOString(),
        },
      },
    });

    return transaction;
  });

  return result;
};

/**
 * Return a book.
 * Calculates fine if overdue, updates inventory, and auto-fulfills reservations.
 */
const returnBook = async (userId, data) => {
  const validated = returnBookSchema.parse(data);

  const result = await prisma.$transaction(async (tx) => {
    let rows;

    if (validated.transactionId) {
      rows = await tx.$queryRaw`
        SELECT id, user_id, book_id, branch_id, due_date
        FROM transactions
        WHERE id = ${validated.transactionId} AND user_id = ${userId} AND status = 'ISSUED'
        FOR UPDATE
      `;
    } else {
      rows = await tx.$queryRaw`
        SELECT id, user_id, book_id, branch_id, due_date
        FROM transactions
        WHERE user_id = ${userId} AND book_id = ${validated.bookId} AND status = 'ISSUED'
        ORDER BY issued_at DESC
        LIMIT 1
        FOR UPDATE
      `;
    }

    if (!rows || rows.length === 0) {
      const err = new Error('Active transaction not found or you are not the borrower');
      err.statusCode = 404;
      throw err;
    }

    const lockedTransaction = rows[0];
    const transactionId = Number(lockedTransaction.id);
    const bookId = Number(lockedTransaction.book_id);
    const branchId = Number(lockedTransaction.branch_id);

    const now = new Date();
    const { isOverdue, daysOverdue, fineAmount } = calculateFine(lockedTransaction.due_date, now);

    // Update transaction
    const updated = await tx.transaction.update({
      where: { id: transactionId },
      data: {
        status: 'RETURNED',
        returnedAt: now,
        fineAmount,
      },
      include: {
        book: { select: { title: true, author: true } },
        user: { select: { name: true, email: true } },
        branch: { select: { id: true, name: true, location: true } },
      },
    });

    await tx.$queryRaw`
      SELECT id
      FROM inventory
      WHERE book_id = ${bookId} AND branch_id = ${branchId}
      FOR UPDATE
    `;

    // Restore inventory
    await tx.inventory.update({
      where: {
        bookId_branchId: {
          bookId,
          branchId,
        },
      },
      data: { availableQuantity: { increment: 1 } },
    });

    // Lock next reservation in queue so concurrent returns do not fulfill the same row.
    const pendingReservations = await tx.$queryRaw`
      SELECT id
      FROM reservations
      WHERE book_id = ${bookId} AND branch_id = ${branchId} AND status = 'PENDING'
      ORDER BY reserved_at ASC
      LIMIT 1
      FOR UPDATE SKIP LOCKED
    `;

    let fulfilledReservationId = null;

    if (pendingReservations && pendingReservations.length > 0) {
      fulfilledReservationId = Number(pendingReservations[0].id);
      await tx.reservation.update({
        where: { id: fulfilledReservationId },
        data: { status: 'FULFILLED' },
      });
    }

    // Audit log
    await tx.auditLog.create({
      data: {
        action: 'BOOK_RETURNED',
        entity: 'transactions',
        entityId: transactionId,
        userId,
        metadata: {
          bookId,
          branchId,
          isOverdue,
          daysOverdue,
          fineAmount,
          reservationFulfilled: fulfilledReservationId,
        },
      },
    });

    return {
      ...updated,
      fine: { isOverdue, daysOverdue, fineAmount },
    };
  });

  return result;
};

/**
 * Get all transactions with filters (admin/librarian).
 */
const getAllTransactions = async ({ status, userId, page = 1, limit = 20 }) => {
  const where = {};
  if (status) where.status = status;
  if (userId) where.userId = userId;

  const skip = (page - 1) * limit;

  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      skip,
      take: limit,
      include: {
        book: { select: { id: true, title: true, author: true } },
        user: { select: { id: true, name: true, email: true } },
        branch: { select: { id: true, name: true, location: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.transaction.count({ where }),
  ]);

  return { transactions, total, page, limit };
};

/**
 * Get transactions for the logged-in user.
 */
const getMyTransactions = async (userId) => {
  const transactions = await prisma.transaction.findMany({
    where: { userId },
    include: {
      book: { select: { id: true, title: true, author: true, isbn: true } },
      branch: { select: { id: true, name: true, location: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return transactions;
};

module.exports = { issueBook, returnBook, getAllTransactions, getMyTransactions };
