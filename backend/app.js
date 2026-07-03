const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
require('dotenv').config({ path: ['.env', '../.env'] });
require('dotenv').config({ override: false });

const { validateEnv } = require('./middleware/envGuard');
const timeout = require('./middleware/requestTimeout');
const {
  xssProtection,
  noSqlInjectionProtection,
  parameterPollutionProtection,
  secureHeaders,
  logDataAccess
} = require('./middleware/security');
const {
  globalRateLimiter,
  hidePoweredBy,
  noCacheSensitive,
  validateContentType,
  sanitizeEnv
} = require('./middleware/deployment');
const {
  headerSecurityCheck,
  validateOrigin,
  preventParameterPollution,
  enforceContentType,
  botDetection,
  requestThrottler,
  validateJsonDepth,
  timingAttackDetection
} = require('./middleware/advancedSecurity');

const { connectDB } = require('./config/postgres');
const { dbConcurrencyLimit, dbWriteRateLimit, dbReadRateLimit, dbConcurrencyStats } = require('./middleware/dbRateLimit');
const authRoutes = require('./routes/auth');
const authExtendedRoutes = require('./routes/authExtended');
const passwordResetRoutes = require('./routes/passwordReset');
const verificationRoutes = require('./routes/verification');
const caseRoutes = require('./routes/cases');
const judgeRoutes = require('./routes/judges');
const judgeDashboardRoutes = require('./routes/judgeDashboard');
const judgeDashboardExtendedRoutes = require('./routes/judgeDashboardExtended');
const registrarDashboardRoutes = require('./routes/registrarDashboard');
const secretaryDashboardRoutes = require('./routes/secretaryDashboard');
const allDashboardRoutes = require('./routes/allDashboardRoutes');
const paymentRoutes = require('./routes/payments');
const paymentPortalRoutes = require('./routes/paymentPortal');
const feeRoutes = require('./routes/fees');
const courtRoutes = require('./routes/courts');
const stateRoutes = require('./routes/states');
const lgaRoutes = require('./routes/lgas');
const reportRoutes = require('./routes/reports');
const documentRoutes = require('./routes/documents');
const docketRoutes = require('./routes/dockets');
const adminRoutes = require('./routes/admin');
const paymentVerificationRoutes = require('./routes/paymentVerification');
const {
  cacheHeadersMiddleware,
  responseFilterMiddleware,
  paginationEnforcerMiddleware,
  memoryMonitoringMiddleware,
  requestSizeLimiter,
  selectiveBodySizeLimiter,
  queryOptimizationMiddleware
} = require('./middleware/optimization');

let routesRegistered = false;
let errorHandlersRegistered = false;
let dbReadyPromise = null;
let environmentValidated = false;

const app = express();

app.set('trust proxy', 1);
app.disable('x-powered-by');

const ensureEnvironmentReady = () => {
  if (environmentValidated) {
    return;
  }

  validateEnv();
  sanitizeEnv();
  environmentValidated = true;
};

app.use(secureHeaders);
app.use(hidePoweredBy);
app.use(noCacheSensitive);
app.use(globalRateLimiter);
app.use(botDetection);
app.use(headerSecurityCheck);
app.use(validateOrigin);
app.use(selectiveBodySizeLimiter);

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  frameguard: { action: 'deny' },
  referrerPolicy: { policy: 'strict-origin' },
  permissionsPolicy: {
    geolocation: [],
    microphone: [],
    camera: [],
    payment: [],
    usb: [],
    magnetometer: [],
    gyroscope: [],
    speaker: [],
    fullscreen: []
  },
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
  crossOriginResourcePolicy: { policy: 'same-origin' }
}));

const corsOptions = {
  origin: process.env.NODE_ENV === 'production'
    ? process.env.FRONTEND_URL
    : ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  maxAge: 86400
};
app.use(cors(corsOptions));

app.use(compression());
app.use(process.env.NODE_ENV === 'development' ? morgan('dev') : morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(validateContentType);
app.use(enforceContentType);
app.use(xssProtection());
app.use(noSqlInjectionProtection());
app.use(parameterPollutionProtection());
app.use(preventParameterPollution);
app.use(timeout(30000));
app.use(validateJsonDepth(8));
app.use(timingAttackDetection);
app.use(logDataAccess);

if (process.env.NODE_ENV === 'development') {
  app.use(memoryMonitoringMiddleware);
}

app.use(requestSizeLimiter);
app.use(queryOptimizationMiddleware);
app.use(paginationEnforcerMiddleware);
app.use(cacheHeadersMiddleware);
app.use(responseFilterMiddleware);

app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'NBA LITIGMUS API is running',
    timestamp: new Date().toISOString(),
    database: 'PostgreSQL configured'
  });
});

app.get('/api/health/db-concurrency', (req, res) => {
  const ip = req.ip || '';
  if (!['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(ip)) {
    return res.status(403).json({ success: false, message: 'Forbidden' });
  }
  return res.json(dbConcurrencyStats());
});

const registerRoutes = () => {
  if (routesRegistered) {
    return;
  }

  app.use('/api', dbConcurrencyLimit());
  app.use('/api', dbReadRateLimit);
  app.use('/api', dbWriteRateLimit);

  app.use('/api/auth/extended', requestThrottler(250), authExtendedRoutes);
  app.use('/api/auth', requestThrottler(250), authRoutes);
  app.use('/api/auth/password', passwordResetRoutes);
  app.use('/api/verification', verificationRoutes);
  app.use('/api/cases', caseRoutes);
  app.use('/api/judges', judgeRoutes);
  app.use('/api/judge-dashboard', judgeDashboardRoutes);
  app.use('/api/judge-dashboard-extended', judgeDashboardExtendedRoutes);
  app.use('/api/registrar-dashboard', registrarDashboardRoutes);
  app.use('/api/secretary-dashboard', secretaryDashboardRoutes);
  app.use('/api/dashboard', allDashboardRoutes);
  app.use('/api/payments', paymentRoutes);
  app.use('/api/payment-portal', paymentPortalRoutes);
  app.use('/api/fees', feeRoutes);
  app.use('/api/courts', courtRoutes);
  app.use('/api/states', stateRoutes);
  app.use('/api/lgas', lgaRoutes);
  app.use('/api/reports', reportRoutes);
  app.use('/api/documents', documentRoutes);
  app.use('/api/dockets', docketRoutes);
  app.use('/api/admin', requestThrottler(300), adminRoutes);
  app.use('/api/payment-verification', paymentVerificationRoutes);

  app.use('*', (req, res) => {
    if (res.headersSent) return;
    res.status(404).json({ success: false, message: 'Route not found' });
  });

  routesRegistered = true;
};

const registerErrorHandlers = () => {
  if (errorHandlersRegistered) {
    return;
  }

  app.use((err, req, res, next) => {
    if (res.headersSent) {
      return next(err);
    }

    console.error('Unhandled Error:', err.stack);
    const statusCode = err.status || 500;
    const message = process.env.NODE_ENV === 'development'
      ? err.message || 'Internal Server Error'
      : 'Internal Server Error';

    res.status(statusCode).json({ success: false, message });
  });

  errorHandlersRegistered = true;
};

const ensureAppReady = async () => {
  if (!dbReadyPromise) {
    ensureEnvironmentReady();

    dbReadyPromise = connectDB()
      .then(() => {
        registerRoutes();
        registerErrorHandlers();
        return app;
      })
      .catch((error) => {
        dbReadyPromise = null;
        throw error;
      });
  }

  return dbReadyPromise;
};

module.exports = {
  app,
  ensureAppReady
};