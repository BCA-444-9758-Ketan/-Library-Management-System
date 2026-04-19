const prisma = require('../../config/prisma');
const { z } = require('zod');

// ---- Validation ----

const createReservationSchema = z.object({
  bookId: z.number().int().positive(),
  branchId: z.number().int().positive(),
});

// ---- Service Functions ----

/**
 * Reserve a book when it's not available.
 * Prevents duplicate pending reservations for same user+book+branch.
 */
const createReservation = async (userId, data) => {
  const validated = createReservationSchema.parse(data);

  // Check for existing pending reservation
  const existing = await prisma.reservation.findFirst({
    where: {
      userId,
      bookId: validated.bookId,
      branchId: validated.branchId,
      status: 'PENDING',
    },
  });

  if (existing) {
    const err = new Error('You already have a pending reservation for this book at this branch');
    err.statusCode = 409;
    throw err;
  }

  const [book, branch, inventory] = await Promise.all([
    prisma.book.findUnique({ where: { id: validated.bookId } }),
    prisma.branch.findUnique({ where: { id: validated.branchId } }),
    prisma.inventory.findUnique({
      where: {
        bookId_branchId: {
          bookId: validated.bookId,
          branchId: validated.branchId,
        },
      },
    }),
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

  if (!inventory) {
    const err = new Error('This book is not stocked at the selected branch');
    err.statusCode = 404;
    throw err;
  }

  if (inventory.availableQuantity > 0) {
    const err = new Error('Book is currently available. Please issue it directly instead of reserving.');
    err.statusCode = 409;
    throw err;
  }

  const reservation = await prisma.reservation.create({
    data: {
      userId,
      bookId: validated.bookId,
      branchId: validated.branchId,
      status: 'PENDING',
    },
    include: {
      book: { select: { title: true, author: true } },
      user: { select: { name: true, email: true } },
      branch: { select: { id: true, name: true, location: true } },
    },
  });

  return reservation;
};

/**
 * Cancel a reservation. Only the owner can cancel.
 */
const cancelReservation = async (userId, reservationId) => {
  const reservation = await prisma.reservation.findFirst({
    where: { id: reservationId, userId, status: 'PENDING' },
  });

  if (!reservation) {
    const err = new Error('Pending reservation not found or you are not the owner');
    err.statusCode = 404;
    throw err;
  }

  const updated = await prisma.reservation.update({
    where: { id: reservationId },
    data: { status: 'CANCELLED' },
    include: {
      book: { select: { title: true, author: true } },
      branch: { select: { id: true, name: true, location: true } },
    },
  });

  return updated;
};

/**
 * Get reservations for the logged-in user.
 */
const getMyReservations = async (userId) => {
  const reservations = await prisma.reservation.findMany({
    where: { userId },
    include: {
      book: { select: { id: true, title: true, author: true } },
      branch: { select: { id: true, name: true, location: true } },
    },
    orderBy: { reservedAt: 'desc' },
  });

  return reservations;
};

module.exports = { createReservation, cancelReservation, getMyReservations };
