const prisma = require('../../config/prisma');

const buildRecommendationPayload = (book, reason) => {
  return {
    id: book.id,
    title: book.title,
    author: book.author,
    category: book.category,
    isbn: book.isbn,
    reason,
    availability: book.inventory.map((entry) => ({
      branchId: entry.branchId,
      branchName: entry.branch.name,
      location: entry.branch.location,
      availableQuantity: entry.availableQuantity,
    })),
  };
};

const getRecommendations = async (userId) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    const err = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }

  const recentTransactions = await prisma.transaction.findMany({
    where: { userId },
    include: {
      book: {
        select: {
          id: true,
          category: true,
        },
      },
    },
    orderBy: { issuedAt: 'desc' },
    take: 10,
  });

  const borrowedBookIds = [...new Set(recentTransactions.map((tx) => tx.bookId))];
  const preferredCategories = [...new Set(recentTransactions.map((tx) => tx.book.category))];

  const recommendations = [];

  if (preferredCategories.length > 0) {
    const categoryBooks = await prisma.book.findMany({
      where: {
        category: { in: preferredCategories },
        ...(borrowedBookIds.length > 0 ? { id: { notIn: borrowedBookIds } } : {}),
        inventory: {
          some: {
            availableQuantity: { gt: 0 },
          },
        },
      },
      include: {
        inventory: {
          where: {
            availableQuantity: { gt: 0 },
          },
          include: {
            branch: {
              select: {
                id: true,
                name: true,
                location: true,
              },
            },
          },
        },
      },
      orderBy: { title: 'asc' },
      take: 10,
    });

    for (const book of categoryBooks) {
      recommendations.push(buildRecommendationPayload(book, 'Matched from your recent categories'));
    }
  }

  if (recommendations.length < 10) {
    const excludedBookIds = [
      ...borrowedBookIds,
      ...recommendations.map((book) => book.id),
    ];

    const popularInventory = await prisma.inventory.groupBy({
      by: ['bookId'],
      where: {
        availableQuantity: { gt: 0 },
        ...(excludedBookIds.length > 0 ? { bookId: { notIn: excludedBookIds } } : {}),
      },
      _sum: {
        availableQuantity: true,
      },
      orderBy: {
        _sum: {
          availableQuantity: 'desc',
        },
      },
      take: 30,
    });

    if (popularInventory.length > 0) {
      const popularBookIds = popularInventory.map((entry) => entry.bookId);

      const fallbackBooks = await prisma.book.findMany({
        where: {
          id: {
            in: popularBookIds,
          },
        },
        include: {
          inventory: {
            where: {
              availableQuantity: { gt: 0 },
            },
            include: {
              branch: {
                select: {
                  id: true,
                  name: true,
                  location: true,
                },
              },
            },
          },
        },
      });

      const fallbackMap = new Map(fallbackBooks.map((book) => [book.id, book]));

      for (const id of popularBookIds) {
        const book = fallbackMap.get(id);
        if (!book) {
          continue;
        }

        recommendations.push(buildRecommendationPayload(book, 'Popular and currently available'));

        if (recommendations.length >= 10) {
          break;
        }
      }
    }
  }

  return {
    userId,
    preferredCategories,
    recommendations: recommendations.slice(0, 10),
  };
};

module.exports = { getRecommendations };
