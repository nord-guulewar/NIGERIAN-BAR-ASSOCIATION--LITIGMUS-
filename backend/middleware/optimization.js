/**
 * Backend Optimization Middleware
 * Reduces memory usage and improves traffic handling
 */

const compression = require('compression');

/**
 * Enable compression for all responses
 * Reduces payload size by 60-80%
 */
const compressionMiddleware = compression({
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
  level: 6, // Balance between compression ratio and speed
  threshold: 1000 // Only compress payloads larger than 1KB
});

/**
 * Cache headers middleware
 * Reduces repeated API calls from clients
 */
const cacheHeadersMiddleware = (req, res, next) => {
  // Don't cache POST, PUT, DELETE requests
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    // Cache read-only data for 5 minutes
    if (req.path.includes('/states') || 
        req.path.includes('/courts') || 
        req.path.includes('/lgas')) {
      res.set('Cache-Control', 'public, max-age=300'); // 5 minutes
    }
    // Cache dashboard data for 1 minute
    else if (req.path.includes('/reports/dashboard')) {
      res.set('Cache-Control', 'private, max-age=60'); // 1 minute
    }
    // Default: no cache for sensitive data
    else {
      res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    }
  } else {
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  }
  next();
};

/**
 * Response filtering middleware
 * Removes unnecessary fields to reduce payload
 */
const responseFilterMiddleware = (req, res, next) => {
  const originalJson = res.json;
  
  res.json = function(data) {
    // Only include necessary fields in responses
    if (data && data.data) {
      // Filter out internal fields
      const filtered = filterFields(data.data);
      data.data = filtered;
    }
    return originalJson.call(this, data);
  };
  
  next();
};

/**
 * Filter unnecessary fields from response
 */
function filterFields(data) {
  if (Array.isArray(data)) {
    return data.map(item => filterItem(item));
  }
  return filterItem(data);
}

function filterItem(item) {
  if (!item || typeof item !== 'object') {
    return item;
  }

  // Remove internal/sensitive fields
  const excludeFields = [
    '_doc',
    '__v',
    'password',
    'verificationCode',
    'verificationCodeExpires',
    'emailConfirmationToken',
    'offlineRecoveryCode',
    'staffIdGenerationCode',
    'lastLoginIp',
    'lastUserAgent',
    'caseNotes', // Can be large
    'calendarEvents' // Can be large
  ];

  const filtered = {};
  for (const key in item) {
    if (!excludeFields.includes(key)) {
      filtered[key] = item[key];
    }
  }
  return filtered;
}

/**
 * Request size limiter
 * Prevents large payloads from consuming memory
 */
const requestSizeLimiter = (req, res, next) => {
  const maxSize = 10 * 1024 * 1024; // 10MB
  const contentLength = parseInt(req.headers['content-length'], 10);
  
  if (contentLength && contentLength > maxSize) {
    return res.status(413).json({
      success: false,
      message: 'Payload too large'
    });
  }
  next();
};

/**
 * Apply tighter request body limits to sensitive or abuse-prone routes.
 * This runs before body parsing and relies on Content-Length when present.
 */
const selectiveBodySizeLimiter = (req, res, next) => {
  const contentLength = parseInt(req.headers['content-length'], 10);
  if (!contentLength || Number.isNaN(contentLength)) {
    return next();
  }

  const routeLimits = [
    { matcher: /^\/api\/auth/, limit: 64 * 1024, message: 'Auth payload too large' },
    { matcher: /^\/api\/admin/, limit: 128 * 1024, message: 'Admin payload too large' },
    { matcher: /^\/api\/payment-verification/, limit: 256 * 1024, message: 'Payment verification payload too large' },
    { matcher: /^\/api\/cases/, limit: 512 * 1024, message: 'Case payload too large' }
  ];

  const matched = routeLimits.find((entry) => entry.matcher.test(req.path));
  if (matched && contentLength > matched.limit) {
    return res.status(413).json({
      success: false,
      message: matched.message
    });
  }

  next();
};

/**
 * Connection timeout middleware
 * Prevents hanging connections from consuming resources
 */
const connectionTimeoutMiddleware = (timeout = 30000) => {
  return (req, res, next) => {
    req.setTimeout(timeout, () => {
      res.status(408).json({
        success: false,
        message: 'Request timeout'
      });
    });
    next();
  };
};

/**
 * Memory monitoring middleware
 * Logs memory usage for debugging
 */
const memoryMonitoringMiddleware = (req, res, next) => {
  if (process.env.NODE_ENV === 'development') {
    const used = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);
    console.log(`[Memory] ${used}MB | ${req.method} ${req.path}`);
  }
  next();
};

/**
 * Pagination enforcer middleware
 * Prevents loading excessive data
 */
const paginationEnforcerMiddleware = (req, res, next) => {
  const limit = parseInt(req.query.limit) || 20;
  const maxLimit = 100;
  
  // Enforce maximum limit
  if (limit > maxLimit) {
    req.query.limit = maxLimit;
  }
  
  // Set minimum limit
  if (limit < 1) {
    req.query.limit = 1;
  }
  
  next();
};

/**
 * Query optimization middleware
 * Removes unnecessary query parameters
 */
const queryOptimizationMiddleware = (req, res, next) => {
  // Remove empty query parameters
  Object.keys(req.query).forEach(key => {
    if (!req.query[key]) {
      delete req.query[key];
    }
  });
  next();
};

module.exports = {
  compressionMiddleware,
  cacheHeadersMiddleware,
  responseFilterMiddleware,
  requestSizeLimiter,
  selectiveBodySizeLimiter,
  connectionTimeoutMiddleware,
  memoryMonitoringMiddleware,
  paginationEnforcerMiddleware,
  queryOptimizationMiddleware,
  filterFields
};
