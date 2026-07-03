const redis = require('redis');

const redisEnabled = process.env.REDIS_ENABLED === 'true' || Boolean(process.env.REDIS_URL);

const redisConfig = process.env.REDIS_URL
  ? {
      url: process.env.REDIS_URL,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 3) {
            return false;
          }
          return Math.min(retries * 200, 1500);
        }
      }
    }
  : {
      socket: {
        host: process.env.REDIS_HOST || '127.0.0.1',
        port: Number(process.env.REDIS_PORT || 6379),
        reconnectStrategy: (retries) => {
          if (retries > 3) {
            return false;
          }
          return Math.min(retries * 200, 1500);
        }
      }
    };

const redisClient = redis.createClient({
  ...redisConfig,
  password: process.env.REDIS_PASSWORD || undefined
});

let redisConnectPromise = null;
let redisDisabledLogged = false;

const logRedisDisabled = () => {
  if (!redisDisabledLogged) {
    console.warn('Redis caching disabled. Falling back to in-memory throttling/cache bypass.');
    redisDisabledLogged = true;
  }
};

if (!redisEnabled) {
  logRedisDisabled();
}

redisClient.on('connect', () => {
  console.log('✅ Redis connected');
});

redisClient.on('error', (err) => {
  if (!redisEnabled) {
    return;
  }
  console.error('❌ Redis error:', err.message);
});

const connectRedis = async () => {
  if (!redisEnabled) {
    return null;
  }

  if (redisClient.isOpen) {
    return redisClient;
  }

  if (!redisConnectPromise) {
    redisConnectPromise = redisClient.connect()
      .catch((error) => {
        redisConnectPromise = null;
        console.error('❌ Redis connection failed. Falling back without Redis:', error.message);
        return null;
      });
  }

  return redisConnectPromise;
};

const getRedisClient = () => (redisEnabled ? redisClient : null);

const isRedisReady = () => redisEnabled && redisClient.isReady;

// ── Cache key strategy ───────────────────────────────────────────────────────
// Many GET responses are identical for everyone who shares the same role +
// state + court (e.g. all registrars in "Lagos" / "Lagos High Court" see the
// exact same case list).  Keying on userId would create one cache entry per
// user and never share the hot data.
//
// Taxonomy:
//   PUBLIC   – no auth needed (reference data: states, courts, LGAs)
//   SHARED   – same response for all users in the same (role, state, court)
//   PERSONAL – response is unique per user (my-profile, my-notifications)
//   SKIP     – never cache (mutation-adjacent GETs, search with filters)

const PUBLIC_PATH_PREFIXES = ['/api/states', '/api/courts', '/api/lgas', '/api/fees'];
const PERSONAL_PATH_PREFIXES = ['/api/auth/me', '/api/notifications', '/api/profile'];
const SKIP_PATH_PATTERNS = [/\/search/, /\/export/, /\?.*filter/, /\/admin\/security/];

function buildCacheKey(req) {
  const url = req.originalUrl || req.url;
  const user = req.user;

  // Public reference data — single global key, no user segment
  if (PUBLIC_PATH_PREFIXES.some((p) => url.startsWith(p))) {
    return `cache:pub:${url}`;
  }

  // Personally scoped — key by user id
  if (!user || PERSONAL_PATH_PREFIXES.some((p) => url.startsWith(p))) {
    return `cache:user:${user?._id || 'guest'}:${url}`;
  }

  // Role-scoped shared data — key by (role, state, court) so all users with
  // the same context share one cache entry
  const role = user.role || 'unknown';
  const state = user.state || '_';
  const court = user.court || '_';
  return `cache:shared:${role}:${state}:${court}:${url}`;
}

// Cache middleware
const cache = (duration = 300) => {
  return (req, res, next) => {
    if (req.method !== 'GET' || !redisEnabled) {
      return next();
    }

    // Skip volatile / search endpoints
    const url = req.originalUrl || req.url;
    if (SKIP_PATH_PATTERNS.some((p) => p.test(url))) {
      return next();
    }

    const key = buildCacheKey(req);

    connectRedis()
      .then(async (client) => {
        if (!client || !client.isReady) {
          return next();
        }

        const data = await client.get(key);

        if (data) {
          res.set('X-Cache', 'HIT');
          return res.json(JSON.parse(data));
        }

        res.set('X-Cache', 'MISS');
        const originalJson = res.json.bind(res);

        res.json = (body) => {
          client.setEx(key, duration, JSON.stringify(body)).catch((error) => {
            console.error('Cache write error:', error.message);
          });
          return originalJson(body);
        };

        return next();
      })
      .catch((err) => {
        console.error('Cache read error:', err.message);
        next();
      });
  };
};

// Clear cache by pattern
const clearCache = (pattern) => {
  if (!redisEnabled) {
    return Promise.resolve(0);
  }

  return connectRedis().then(async (client) => {
    if (!client || !client.isReady) {
      return 0;
    }

    const keys = await client.keys(pattern);
    if (keys.length === 0) {
      return 0;
    }

    const count = await client.del(keys);
    console.log(`🗑️  Cleared ${count} cache entries`);
    return count;
  });
};

// Clear user-specific cache (personal keys)
const clearUserCache = (userId) => {
  return clearCache(`cache:user:${userId}:*`);
};

// Clear shared cache for a role+state+court (call after any write to Cases/Users)
const clearSharedCache = ({ role, state, court } = {}) => {
  const seg = [
    role || '*',
    state || '*',
    court || '*'
  ].join(':');
  return clearCache(`cache:shared:${seg}:*`);
};

// Clear all cache
const clearAllCache = () => {
  if (!redisEnabled) {
    return Promise.resolve(false);
  }

  return connectRedis().then(async (client) => {
    if (!client || !client.isReady) {
      return false;
    }

    const succeeded = await client.flushDb();
    console.log('🗑️  All cache cleared');
    return succeeded;
  });
};

module.exports = {
  redisEnabled,
  redisClient,
  connectRedis,
  getRedisClient,
  isRedisReady,
  cache,
  buildCacheKey,
  clearCache,
  clearUserCache,
  clearSharedCache,
  clearAllCache
};
