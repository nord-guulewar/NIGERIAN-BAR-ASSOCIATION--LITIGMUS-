const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const csrf = require('csurf');
const cookieParser = require('cookie-parser');

// XSS Protection - Sanitize user input
const xssProtection = () => {
  return xss();
};

// NoSQL Injection Protection
const noSqlInjectionProtection = () => {
  return mongoSanitize({
    replaceWith: '_',
    onSanitize: ({ req, key }) => {
      console.warn(`Potential NoSQL injection attempt detected: ${key}`);
    }
  });
};

// HTTP Parameter Pollution Protection
const parameterPollutionProtection = () => {
  return hpp({
    whitelist: ['status', 'courtType', 'state', 'caseType', 'role']
  });
};

// Rate Limiting - Prevent brute force attacks
const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts
  message: 'Too many login attempts. Please try again after 15 minutes.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  handler: (req, res) => {
    console.warn(`Rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      message: 'Too many login attempts. Please try again after 15 minutes.',
      retryAfter: 15 * 60
    });
  }
});

const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: 'Too many requests. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false
});

const registrationRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 registrations per hour per IP
  message: 'Too many registration attempts. Please try again after 1 hour.',
  skipSuccessfulRequests: false
});

// Strict rate limiter for email/phone verification endpoints (no skip on success)
const verificationRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many verification requests. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false
});

// Password reset rate limiter
const passwordResetRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: 'Too many password reset requests. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false
});

// Recovery login rate limiter (offline recovery code login)
const recoveryLoginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many recovery attempts. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false
});

// Docket actions rate limiter (clerks/judges creating/searching dockets)
const docketRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 50,
  message: 'Too many docket requests. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true
});

// General upload/file endpoint limiter
const uploadRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30,
  message: 'Too many upload requests. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false
});

// CSRF Protection
const csrfProtection = csrf({ 
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  }
});

// Input Validation Middleware
const validateInput = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors
      });
    }

    next();
  };
};

// Sanitize Output - Prevent XSS in responses
const sanitizeOutput = (data) => {
  if (typeof data === 'string') {
    return data
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  if (Array.isArray(data)) {
    return data.map(item => sanitizeOutput(item));
  }

  if (typeof data === 'object' && data !== null) {
    const sanitized = {};
    for (const key in data) {
      if (data.hasOwnProperty(key)) {
        sanitized[key] = sanitizeOutput(data[key]);
      }
    }
    return sanitized;
  }

  return data;
};

// NDPR Compliance - Data Access Logging
const logDataAccess = async (req, res, next) => {
  const sensitiveRoutes = ['/api/cases', '/api/judges', '/api/payments', '/api/auth'];
  const isSensitive = sensitiveRoutes.some(route => req.path.startsWith(route));

  if (isSensitive && req.user) {
    const accessLog = {
      userId: req.user._id,
      userEmail: req.user.email,
      userRole: req.user.role,
      action: req.method,
      resource: req.path,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      timestamp: new Date(),
      dataAccessed: req.method === 'GET' ? 'Read' : req.method === 'POST' ? 'Create' : req.method === 'PUT' ? 'Update' : 'Delete'
    };

    // Log to console (in production, save to database)
    console.log('NDPR Data Access Log:', JSON.stringify(accessLog));
  }

  next();
};

// Secure Headers Middleware
const secureHeaders = (req, res, next) => {
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Enable XSS filter
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Strict Transport Security (HTTPS only)
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  
  // Content Security Policy
  res.setHeader('Content-Security-Policy', 
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: https:; " +
    "font-src 'self' data:; " +
    "connect-src 'self';"
  );
  
  // Referrer Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Permissions Policy
  res.setHeader('Permissions-Policy', 
    'geolocation=(), ' +
    'microphone=(), ' +
    'camera=(), ' +
    'payment=(), ' +
    'usb=(), ' +
    'magnetometer=(), ' +
    'gyroscope=(), ' +
    'speaker=(), ' +
    'fullscreen=()'
  );

  next();
};

// Data Encryption for Sensitive Fields
const encryptSensitiveData = (data, sensitiveFields = []) => {
  const crypto = require('crypto');
  const algorithm = 'aes-256-cbc';
  const key = Buffer.from(process.env.ENCRYPTION_KEY || 'default-key-change-in-production-32', 'utf8');
  const iv = crypto.randomBytes(16);

  const encrypted = {};
  
  for (const field of sensitiveFields) {
    if (data[field]) {
      const cipher = crypto.createCipheriv(algorithm, key, iv);
      let encryptedData = cipher.update(data[field], 'utf8', 'hex');
      encryptedData += cipher.final('hex');
      encrypted[field] = {
        data: encryptedData,
        iv: iv.toString('hex')
      };
    }
  }

  return encrypted;
};

// Session Security
const sessionConfig = {
  secret: process.env.SESSION_SECRET || 'change-this-secret-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000
  },
  name: 'sessionId'
};

const sessionTimeout = 24 * 60 * 60 * 1000;

const sessionTimeoutMiddleware = (req, res, next) => {
  if (req.session) {
    if (req.session.lastActivity) {
      const timeSinceLastActivity = Date.now() - req.session.lastActivity;
      if (timeSinceLastActivity > sessionTimeout) {
        req.session.destroy();
        return res.status(401).json({
          success: false,
          message: 'Session expired. Please log in again.'
        });
      }
    }
    req.session.lastActivity = Date.now();
  }
  next();
};

// NDPR Consent Tracking
const trackConsent = async (userId, consentType, granted) => {
  const consentLog = {
    userId,
    consentType, // 'data_processing', 'data_sharing', 'marketing', etc.
    granted,
    timestamp: new Date(),
    ipAddress: null, // Set from request
    version: '1.0' // Track consent version
  };

  // In production, save to database
  console.log('NDPR Consent Log:', JSON.stringify(consentLog));
  return consentLog;
};

// Data Retention Policy (NDPR Requirement)
const dataRetentionCheck = async () => {
  // Check for data older than retention period
  // NDPR requires data to be deleted when no longer needed
  const retentionPeriod = 7 * 365 * 24 * 60 * 60 * 1000; // 7 years for legal data
  const cutoffDate = new Date(Date.now() - retentionPeriod);

  console.log(`Data retention check: Data before ${cutoffDate} should be reviewed for deletion`);
  
  // In production, implement actual deletion logic
  return cutoffDate;
};

// Audit Trail Middleware
const auditTrail = (action) => {
  return (req, res, next) => {
    const audit = {
      action,
      userId: req.user ? req.user._id : 'anonymous',
      userEmail: req.user ? req.user.email : 'anonymous',
      userRole: req.user ? req.user.role : 'anonymous',
      ipAddress: req.ip,
      timestamp: new Date(),
      requestBody: req.method !== 'GET' ? JSON.stringify(req.body) : null,
      success: true
    };

    // Store original send
    const originalSend = res.send;
    
    res.send = function(data) {
      audit.success = res.statusCode < 400;
      audit.statusCode = res.statusCode;
      
      // Log audit trail
      console.log('Audit Trail:', JSON.stringify(audit));
      
      // In production, save to database
      
      originalSend.call(this, data);
    };

    next();
  };
};

module.exports = {
  xssProtection,
  noSqlInjectionProtection,
  parameterPollutionProtection,
  loginRateLimiter,
  apiRateLimiter,
  registrationRateLimiter,
  verificationRateLimiter,
  passwordResetRateLimiter,
  recoveryLoginRateLimiter,
  docketRateLimiter,
  uploadRateLimiter,
  csrfProtection,
  validateInput,
  sanitizeOutput,
  logDataAccess,
  secureHeaders,
  encryptSensitiveData,
  sessionConfig,
  sessionTimeoutMiddleware,
  trackConsent,
  dataRetentionCheck,
  auditTrail,
  cookieParser,
  sessionTimeout
};
