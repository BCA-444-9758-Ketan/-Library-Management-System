const { PrismaClient } = require('@prisma/client');

// Singleton pattern - prevents multiple Prisma instances in development
// when hot-reloading causes module re-evaluation.
// In production, this doesn't matter, but it's a good habit.

let prisma;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient({
    log: ['error'],
  });
} else {
  // In development, reuse the client across hot reloads
  if (!global.__prisma) {
    global.__prisma = new PrismaClient({
      log: ['query', 'error', 'warn'],
    });
  }
  prisma = global.__prisma;
}

module.exports = prisma;
