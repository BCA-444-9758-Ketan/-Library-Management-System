const prisma = require('../../config/prisma');

const getUsers = async ({ page = 1, limit = 20, search }) => {
  const skip = (page - 1) * limit;

  const where = search
    ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      }
    : {};

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        borrowingLimit: true,
        createdAt: true,
        _count: {
          select: {
            transactions: true,
            reservations: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.user.count({ where }),
  ]);

  return { users, total, page, limit };
};

const getUserProfile = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      borrowingLimit: true,
      createdAt: true,
      transactions: {
        where: {
          status: 'ISSUED',
        },
        select: {
          id: true,
          status: true,
          issuedAt: true,
          dueDate: true,
          fineAmount: true,
          book: {
            select: {
              id: true,
              title: true,
              author: true,
              isbn: true,
            },
          },
          branch: {
            select: {
              id: true,
              name: true,
              location: true,
            },
          },
        },
        orderBy: { issuedAt: 'desc' },
      },
    },
  });

  if (!user) {
    const err = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }

  return user;
};

module.exports = { getUsers, getUserProfile };
