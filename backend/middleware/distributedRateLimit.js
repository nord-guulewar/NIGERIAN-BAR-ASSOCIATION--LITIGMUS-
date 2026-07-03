const { getRedisClient, connectRedis, isRedisReady } = require('../config/cache');

const fallbackStore = new Map();

const getFallbackBucket = (key, windowMs) => {
  const now = Date.now();
  const existing = fallbackStore.get(key);

  if (!existing || existing.resetAt <= now) {
    const fresh = { count: 0, resetAt: now + windowMs };
    fallbackStore.set(key, fresh);
    return fresh;
  }

  return existing;
};

const cleanupFallbackStore = () => {
  const now = Date.now();
  for (const [key, value] of fallbackStore.entries()) {
    if (value.resetAt <= now) {
      fallbackStore.delete(key);
    }
  }
};

const incrementFallback = (key, windowMs) => {
  const bucket = getFallbackBucket(key, windowMs);
  bucket.count += 1;

  if (Math.random() < 0.01) {
    cleanupFallbackStore();
  }

  return {
    totalHits: bucket.count,
    resetTime: new Date(bucket.resetAt)
  };
};

const incrementRedis = async (key, windowMs) => {
  const redisClient = getRedisClient();
  const totalHits = await redisClient.incr(key);

  if (totalHits === 1) {
    await redisClient.pExpire(key, windowMs);
  }

  const ttlMs = await redisClient.pTTL(key);
  const resetTime = new Date(Date.now() + (ttlMs > 0 ? ttlMs : windowMs));

  return { totalHits, resetTime };
};

const createDistributedRateLimiter = ({
  windowMs,
  max,
  message,
  prefix = 'rate-limit',
  skipSuccessfulRequests = false,
  keyGenerator
}) => {
  return async (req, res, next) => {
    const identifier = keyGenerator ? keyGenerator(req) : req.ip;
    const key = `${prefix}:${identifier}`;

    try {
      if (!isRedisReady()) {
        await connectRedis().catch(() => null);
      }

      const { totalHits, resetTime } = isRedisReady()
        ? await incrementRedis(key, windowMs)
        : incrementFallback(key, windowMs);

      res.setHeader('RateLimit-Limit', max);
      res.setHeader('RateLimit-Remaining', Math.max(max - totalHits, 0));
      res.setHeader('RateLimit-Reset', Math.ceil(resetTime.getTime() / 1000));

      if (skipSuccessfulRequests) {
        res.once('finish', async () => {
          if (res.statusCode >= 200 && res.statusCode < 400) {
            try {
              if (isRedisReady()) {
                const redisClient = getRedisClient();
                await redisClient.decr(key);
              } else {
                const bucket = fallbackStore.get(key);
                if (bucket) {
                  bucket.count = Math.max(bucket.count - 1, 0);
                }
              }
            } catch (_) {
              // Ignore limiter decrement failures.
            }
          }
        });
      }

      if (totalHits > max) {
        const retryAfter = Math.max(Math.ceil((resetTime.getTime() - Date.now()) / 1000), 1);
        res.setHeader('Retry-After', retryAfter);
        return res.status(429).json({
          success: false,
          message,
          retryAfter
        });
      }

      next();
    } catch (error) {
      const { totalHits, resetTime } = incrementFallback(key, windowMs);
      res.setHeader('RateLimit-Limit', max);
      res.setHeader('RateLimit-Remaining', Math.max(max - totalHits, 0));
      res.setHeader('RateLimit-Reset', Math.ceil(resetTime.getTime() / 1000));

      if (totalHits > max) {
        const retryAfter = Math.max(Math.ceil((resetTime.getTime() - Date.now()) / 1000), 1);
        return res.status(429).json({
          success: false,
          message,
          retryAfter
        });
      }

      next();
    }
  };
};

module.exports = {
  createDistributedRateLimiter
};