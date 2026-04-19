const redis = require('../config/redis');

/**
 * Cache middleware factory.
 *
 * Creates a middleware that checks Redis for cached response data.
 * If found, returns it immediately (cache HIT).
 * If not, lets the request proceed and caches the response.
 *
 * @param {Function} keyGenerator - Function that takes req and returns cache key string
 * @param {number} ttl - Time-to-live in seconds (default: 300 = 5 minutes)
 */
const cacheMiddleware = (keyGenerator, ttl = 300) => {
  return async (req, res, next) => {
    // Skip cache if Redis is not connected
    if (redis.status !== 'ready') {
      return next();
    }

    const key = keyGenerator(req);

    try {
      const cached = await redis.get(key);

      if (cached) {
        console.log(`[CACHE HIT] ${key}`);
        const data = JSON.parse(cached);
        return res.status(200).json(data);
      }

      console.log(`[CACHE MISS] ${key}`);

      // Override res.json to intercept and cache the response
      const originalJson = res.json.bind(res);
      res.json = (body) => {
        // Only cache successful responses
        if (res.statusCode >= 200 && res.statusCode < 300) {
          redis.set(key, JSON.stringify(body), 'EX', ttl).catch((err) => {
            console.error('[CACHE SET ERROR]', err.message);
          });
        }
        return originalJson(body);
      };

      next();
    } catch (err) {
      console.error('[CACHE ERROR]', err.message);
      // On cache error, just skip caching and continue
      next();
    }
  };
};

/**
 * Invalidate cache entries matching a pattern.
 * Usage: await invalidateCache('books:*')
 */
const invalidateCache = async (pattern) => {
  try {
    if (redis.status !== 'ready') return;

    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
      console.log(`[CACHE INVALIDATED] ${keys.length} keys matching "${pattern}"`);
    }
  } catch (err) {
    console.error('[CACHE INVALIDATE ERROR]', err.message);
  }
};

module.exports = { cacheMiddleware, invalidateCache };
