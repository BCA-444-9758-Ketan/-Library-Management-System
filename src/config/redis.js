const Redis = require('ioredis');

let redis;

try {
  redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
      if (times > 5) {
        console.error('⚠️ Redis retry limit reached. Caching is disabled until restart.');
        return null;
      }

      // Exponential backoff capped at 3 seconds
      const delay = Math.min(times * 200, 3000);
      return delay;
    },
    // Don't crash the app if Redis is down - degrade gracefully
    lazyConnect: true,
    enableOfflineQueue: false,
  });

  redis.on('connect', () => {
    console.log('✅ Redis connected');
  });

  redis.on('error', (err) => {
    console.error('❌ Redis error:', err?.message || 'connection failed');
  });
} catch (err) {
  console.error('❌ Redis initialization failed:', err.message);
  // Create a dummy redis that always misses cache
  // This lets the app work without Redis (graceful degradation)
  redis = {
    get: async () => null,
    set: async () => 'OK',
    del: async () => 0,
    keys: async () => [],
    status: 'disconnected',
  };
}

module.exports = redis;
