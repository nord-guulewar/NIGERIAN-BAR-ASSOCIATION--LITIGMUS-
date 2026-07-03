const cluster = require('cluster');
const numCPUs = require('os').cpus().length;
const { createDistributedRateLimiter } = require('./distributedRateLimit');

const isProduction = process.env.NODE_ENV === 'production';

const clusterMode = (app) => {
  if (isProduction && cluster.isMaster) {
    console.log(`Master ${process.pid} is running`);
    for (let i = 0; i < numCPUs; i++) {
      cluster.fork();
    }
    cluster.on('exit', (worker) => {
      console.error(`Worker ${worker.process.pid} died`);
      cluster.fork();
    });
  } else {
    return true;
  }
};

const helmetConfig = {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'", "data:"],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"],
      formAction: ["'self'"],
      baseUri: ["'self'"],
      upgradeInsecureRequests: []
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  noSniff: true,
  dontBrowserDowngrade: true,
  xssFilter: true,
  frameguard: { action: 'deny' },
  hidePoweredBy: true
};

const createRateLimiter = (windowMs, max, message, prefix = 'global') => createDistributedRateLimiter({
  windowMs,
  max,
  message,
  prefix,
  skipSuccessfulRequests: true
});

const globalRateLimiter = createRateLimiter(
  15 * 60 * 1000,
  1000,
  'Too many requests from this IP',
  'global'
);

const healthCheckRateLimiter = createRateLimiter(
  60 * 1000,
  10,
  'Health check rate limit exceeded',
  'health'
);

const hidePoweredBy = (req, res, next) => {
  res.removeHeader('X-Powered-By');
  next();
};

const noCacheSensitive = (req, res, next) => {
  if (req.path.includes('/api/auth') || req.path.includes('/api/admin')) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
  next();
};

const validateContentType = (req, res, next) => {
  if (['GET', 'DELETE', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // For requests expected to carry JSON payloads, require application/json.
  if (!req.is('application/json')) {
    return res.status(415).json({
      success: false,
      message: 'Unsupported Media Type. Content-Type must be application/json'
    });
  }

  next();
};

const sanitizeEnv = () => {
  const sensitiveKeys = ['PASSWORD', 'SECRET', 'KEY', 'TOKEN', 'API_KEY'];
  for (const key of Object.keys(process.env)) {
    if (sensitiveKeys.some(s => key.toUpperCase().includes(s))) {
      if (process.env[key] === key.toLowerCase() || process.env[key].length < 16) {
        console.warn(`⚠️  Weak configuration detected for ${key}`);
      }
    }
  }
};

module.exports = {
  clusterMode,
  helmetConfig,
  createRateLimiter,
  globalRateLimiter,
  healthCheckRateLimiter,
  hidePoweredBy,
  noCacheSensitive,
  validateContentType,
  sanitizeEnv,
  isProduction
};