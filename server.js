require('dotenv').config();

const app = require('./app');
const prisma = require('./src/config/prisma');
const redis = require('./src/config/redis');

const PORT = Number(process.env.PORT) || 5000;

const connectRedisIfPossible = async () => {
  if (typeof redis.connect !== 'function') {
    return;
  }

  if (redis.status === 'ready' || redis.status === 'connecting') {
    return;
  }

  try {
    await redis.connect();
  } catch (err) {
    console.error('[STARTUP] Redis unavailable, continuing without cache:', err.message);
  }
};

const start = async () => {
  await connectRedisIfPossible();

  const server = app.listen(PORT, () => {
    console.log(`Smart Library API running on http://localhost:${PORT}`);
    console.log(`Swagger docs available at http://localhost:${PORT}/api-docs`);
  });

  const shutdown = async (signal) => {
    console.log(`[SHUTDOWN] ${signal} received. Closing server...`);

    server.close(async () => {
      try {
        if (typeof redis.quit === 'function' && redis.status === 'ready') {
          await redis.quit();
        }

        await prisma.$disconnect();
        console.log('[SHUTDOWN] Graceful shutdown completed.');
        process.exit(0);
      } catch (err) {
        console.error('[SHUTDOWN] Error during shutdown:', err.message);
        process.exit(1);
      }
    });

    setTimeout(() => {
      console.error('[SHUTDOWN] Force closing due to timeout.');
      process.exit(1);
    }, 10000).unref();
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
};

start().catch(async (err) => {
  console.error('[STARTUP] Failed to start server:', err);

  try {
    await prisma.$disconnect();
  } catch (_disconnectErr) {
    // Ignore disconnect failure during crash path
  }

  process.exit(1);
});
