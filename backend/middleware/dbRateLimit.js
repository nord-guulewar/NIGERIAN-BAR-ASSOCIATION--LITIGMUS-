/**
 * Database I/O Rate Limiting Middleware
 *
 * Provides three layers of protection:
 *
 *  1. CONCURRENCY LIMITER
 *     Caps the number of simultaneous in-flight DB operations globally.
 *     Prevents a burst of slow cross-country queries from exhausting the pool.
 *     Excess requests queue briefly; if the queue fills they get 503.
 *
 *  2. PER-USER WRITE RATE LIMITER
 *     Caps how many DB writes (POST/PUT/PATCH/DELETE) one user can make per
 *     minute. Protects against a single compromised account bulk-deleting or
 *     bulk-inserting records.
 *
 *  3. PER-IP READ RATE LIMITER
 *     Caps GET request throughput per IP. Prevents bulk data harvesting and
 *     scraping even without a valid token.
 *
 * Redis is used when available. Falls back gracefully to in-memory counters
 * so the app still works when Redis is down (e.g. local dev).
 */

const { getRedisClient, isRedisReady } = require('../config/cache');

// ── 1. Concurrency limiter ────────────────────────────────────────────────────

// How many simultaneous DB operations are allowed across the whole worker.
// Set this slightly above DB_POOL_PER_WORKER (default 10) so pool slots are
// always available when a query slot is granted.
const MAX_CONCURRENT = Number(process.env.DB_CONCURRENCY_LIMIT || 12);

// How many requests can wait in the queue before we reject with 503.
const MAX_QUEUE = Number(process.env.DB_QUEUE_LIMIT || 50);

let activeConcurrent = 0;
let queuedConcurrent = 0;

/**
 * Returns a middleware that wraps the route in a concurrency-limited slot.
 * Call it as: router.get('/heavy-endpoint', dbConcurrencyLimit(), handler)
 * Or apply globally to all DB-touching routes.
 */
function dbConcurrencyLimit() {
  return (req, res, next) => {
    if (activeConcurrent < MAX_CONCURRENT) {
      activeConcurrent++;
      res.on('finish', () => { activeConcurrent = Math.max(0, activeConcurrent - 1); });
      res.on('close', () => { activeConcurrent = Math.max(0, activeConcurrent - 1); });
      return next();
    }

    if (queuedConcurrent >= MAX_QUEUE) {
      return res.status(503).json({
        success: false,
        message: 'Server is busy. Please retry in a moment.',
        retryAfter: 2
      });
    }

    // Queue the request — wait for a slot to free up (max 5 s)
    queuedConcurrent++;
    const timer = setTimeout(() => {
      queuedConcurrent = Math.max(0, queuedConcurrent - 1);
      res.status(503).json({
        success: false,
        message: 'Request timed out waiting for a database slot.',
        retryAfter: 5
      });
    }, 5000);

    const interval = setInterval(() => {
      if (activeConcurrent < MAX_CONCURRENT) {
        clearInterval(interval);
        clearTimeout(timer);
        queuedConcurrent = Math.max(0, queuedConcurrent - 1);
        activeConcurrent++;
        res.on('finish', () => { activeConcurrent = Math.max(0, activeConcurrent - 1); });
        res.on('close', () => { activeConcurrent = Math.max(0, activeConcurrent - 1); });
        next();
      }
    }, 50);
  };
}

// ── 2. Per-user write rate limiter ────────────────────────────────────────────

// Writes (POST/PUT/PATCH/DELETE) are expensive and irreversible.
// These are the limits — adjust via env vars.
const WRITE_WINDOW_SECONDS = Number(process.env.DB_WRITE_WINDOW_SECONDS || 60);
const WRITE_LIMITS = {
  admin:        Number(process.env.DB_WRITE_LIMIT_ADMIN        || 500),
  registrar:    Number(process.env.DB_WRITE_LIMIT_REGISTRAR    || 120),
  clerk:        Number(process.env.DB_WRITE_LIMIT_CLERK        || 80),
  accountant:   Number(process.env.DB_WRITE_LIMIT_ACCOUNTANT   || 80),
  cashier:      Number(process.env.DB_WRITE_LIMIT_CASHIER      || 60),
  judge:        Number(process.env.DB_WRITE_LIMIT_JUDGE        || 40),
  bailiff:      Number(process.env.DB_WRITE_LIMIT_BAILIFF      || 40),
  _default:     Number(process.env.DB_WRITE_LIMIT_DEFAULT      || 30)
};

// In-memory fallback when Redis is not available
const inMemoryWriteCounts = new Map();

async function incrementWriteCount(userId, role) {
  const limit = WRITE_LIMITS[role] || WRITE_LIMITS._default;
  const key = `db:write:${userId}`;

  if (isRedisReady()) {
    const client = getRedisClient();
    const current = await client.incr(key);
    if (current === 1) {
      await client.expire(key, WRITE_WINDOW_SECONDS);
    }
    return { count: current, limit };
  }

  // Fallback: in-memory (per worker, resets on restart)
  const now = Date.now();
  const entry = inMemoryWriteCounts.get(userId) || { count: 0, resetAt: now + WRITE_WINDOW_SECONDS * 1000 };
  if (now > entry.resetAt) {
    entry.count = 0;
    entry.resetAt = now + WRITE_WINDOW_SECONDS * 1000;
  }
  entry.count++;
  inMemoryWriteCounts.set(userId, entry);
  return { count: entry.count, limit };
}

/**
 * Middleware: rate-limit write operations per authenticated user.
 * Attach to all mutation routes or apply to the whole API router.
 */
async function dbWriteRateLimit(req, res, next) {
  const WRITE_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'];
  if (!WRITE_METHODS.includes(req.method)) return next();

  const user = req.user;
  if (!user) return next(); // auth middleware will handle unauthenticated cases

  try {
    const { count, limit } = await incrementWriteCount(String(user.id || user._id), user.role);

    res.set('X-DB-Write-Count', String(count));
    res.set('X-DB-Write-Limit', String(limit));

    if (count > limit) {
      return res.status(429).json({
        success: false,
        message: `Write rate limit exceeded. Maximum ${limit} writes per ${WRITE_WINDOW_SECONDS} seconds.`,
        retryAfter: WRITE_WINDOW_SECONDS
      });
    }

    next();
  } catch (err) {
    // Never block the request if the limiter itself errors
    console.error('dbWriteRateLimit error:', err.message);
    next();
  }
}

// ── 3. Per-IP read rate limiter ───────────────────────────────────────────────

const READ_WINDOW_SECONDS = Number(process.env.DB_READ_WINDOW_SECONDS || 60);
const READ_LIMIT_AUTHED   = Number(process.env.DB_READ_LIMIT_AUTHED   || 300);
const READ_LIMIT_ANON     = Number(process.env.DB_READ_LIMIT_ANON     || 60);

const inMemoryReadCounts = new Map();

async function incrementReadCount(key) {
  if (isRedisReady()) {
    const client = getRedisClient();
    const current = await client.incr(key);
    if (current === 1) {
      await client.expire(key, READ_WINDOW_SECONDS);
    }
    return current;
  }

  const now = Date.now();
  const entry = inMemoryReadCounts.get(key) || { count: 0, resetAt: now + READ_WINDOW_SECONDS * 1000 };
  if (now > entry.resetAt) {
    entry.count = 0;
    entry.resetAt = now + READ_WINDOW_SECONDS * 1000;
  }
  entry.count++;
  inMemoryReadCounts.set(key, entry);
  return entry.count;
}

/**
 * Middleware: rate-limit read (GET) operations per IP / user.
 * Authenticated users get a higher ceiling than anonymous IPs.
 */
async function dbReadRateLimit(req, res, next) {
  if (req.method !== 'GET') return next();

  const userId = req.user?.id || req.user?._id;
  const key = userId
    ? `db:read:user:${userId}`
    : `db:read:ip:${req.ip}`;
  const limit = userId ? READ_LIMIT_AUTHED : READ_LIMIT_ANON;

  try {
    const count = await incrementReadCount(key);

    res.set('X-DB-Read-Count', String(count));
    res.set('X-DB-Read-Limit', String(limit));

    if (count > limit) {
      return res.status(429).json({
        success: false,
        message: `Read rate limit exceeded. Maximum ${limit} reads per ${READ_WINDOW_SECONDS} seconds.`,
        retryAfter: READ_WINDOW_SECONDS
      });
    }

    next();
  } catch (err) {
    console.error('dbReadRateLimit error:', err.message);
    next();
  }
}

// ── Diagnostics ───────────────────────────────────────────────────────────────

/**
 * Returns current concurrency stats. Mount on an internal health endpoint.
 *   GET /api/health/db-concurrency  → { active, queued, maxConcurrent, maxQueue }
 */
function dbConcurrencyStats() {
  return {
    active: activeConcurrent,
    queued: queuedConcurrent,
    maxConcurrent: MAX_CONCURRENT,
    maxQueue: MAX_QUEUE
  };
}

module.exports = {
  dbConcurrencyLimit,
  dbWriteRateLimit,
  dbReadRateLimit,
  dbConcurrencyStats
};
