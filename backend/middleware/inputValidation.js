const validator = require('validator');
const { logSecurityEvent } = require('../utils/incidentLogger');

/**
 * Comprehensive input validation and sanitization middleware
 * Prevents injection attacks, malformed data, and client-side bypass attempts
 */

// Whitelist patterns for common fields
const PATTERNS = {
  uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  objectId: /^[0-9a-fA-F]{24}$/,
  email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  phone: /^\+?[1-9]\d{1,14}$/,
  alphanumeric: /^[a-zA-Z0-9\s-]+$/,
  caseNumber: /^[A-Z0-9\/-]+$/,
  staffId: /^NBA-[A-Z0-9-]+$/,
  role: /^(admin|judge|registrar|clerk|secretary|accountant|cashier|bailiff|prosecutor|record_officer|librarian|court_reporter|usher|security)$/,
  status: /^(pending|active|completed|dismissed|adjourned|resolved|investigating|escalated|flagged)$/
};

// SQL injection patterns to block
const SQL_INJECTION_PATTERNS = [
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|UNION|DECLARE)\b)/gi,
  /(--|\;|\/\*|\*\/|xp_|sp_)/gi,
  /('|"|`|;|\b(OR|AND)\b.*=.*)/gi
];

// NoSQL injection patterns
const NOSQL_INJECTION_PATTERNS = [
  /\$where/gi,
  /\$ne/gi,
  /\$gt/gi,
  /\$lt/gi,
  /\$regex/gi,
  /\$nin/gi,
  /\$or/gi,
  /\$and/gi
];

// XSS patterns
const XSS_PATTERNS = [
  /<script[^>]*>.*?<\/script>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi,
  /<iframe/gi,
  /<embed/gi,
  /<object/gi
];

/**
 * Check if string contains SQL injection attempts
 */
const containsSQLInjection = (str) => {
  if (typeof str !== 'string') return false;
  return SQL_INJECTION_PATTERNS.some(pattern => pattern.test(str));
};

/**
 * Check if value contains NoSQL injection attempts
 */
const containsNoSQLInjection = (value) => {
  const str = JSON.stringify(value);
  return NOSQL_INJECTION_PATTERNS.some(pattern => pattern.test(str));
};

/**
 * Check if string contains XSS attempts
 */
const containsXSS = (str) => {
  if (typeof str !== 'string') return false;
  return XSS_PATTERNS.some(pattern => pattern.test(str));
};

/**
 * Sanitize string input
 */
const sanitizeString = (str, maxLength = 500) => {
  if (typeof str !== 'string') return str;
  
  // Remove null bytes
  str = str.replace(/\0/g, '');
  
  // Trim whitespace
  str = str.trim();
  
  // Enforce max length
  if (str.length > maxLength) {
    str = str.substring(0, maxLength);
  }
  
  // HTML escape for display contexts
  str = validator.escape(str);
  
  return str;
};

/**
 * Validate MongoDB ObjectId or UUID
 */
const isValidId = (id) => {
  if (!id) return false;
  return PATTERNS.uuid.test(id) || PATTERNS.objectId.test(id);
};

/**
 * Validate email with strict rules
 */
const isValidEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  
  // Length check
  if (email.length > 254) return false;
  
  // Use validator library for comprehensive checks
  if (!validator.isEmail(email, { allow_utf8_local_part: false })) return false;
  
  // Additional pattern check
  return PATTERNS.email.test(email);
};

/**
 * Validate and sanitize request body
 */
const validateRequestBody = (schema) => {
  return (req, res, next) => {
    const errors = [];
    const body = req.body || {};

    // Check for injection attempts in entire payload
    if (containsNoSQLInjection(body)) {
      logSecurityEvent('NOSQL_INJECTION_ATTEMPT', {
        ip: req.ip,
        userAgent: req.get('user-agent'),
        path: req.path,
        body: JSON.stringify(body).substring(0, 500)
      });
      return res.status(400).json({
        success: false,
        message: 'Invalid request data format'
      });
    }

    // Validate each field according to schema
    for (const [field, rules] of Object.entries(schema)) {
      const value = body[field];

      // Required field check
      if (rules.required && (value === undefined || value === null || value === '')) {
        errors.push(`${field} is required`);
        continue;
      }

      // Skip validation if field is optional and not provided
      if (!rules.required && (value === undefined || value === null)) {
        continue;
      }

      // Type validation
      if (rules.type) {
        const actualType = Array.isArray(value) ? 'array' : typeof value;
        if (actualType !== rules.type) {
          errors.push(`${field} must be of type ${rules.type}`);
          continue;
        }
      }

      // String validations
      if (typeof value === 'string') {
        // SQL injection check
        if (containsSQLInjection(value)) {
          logSecurityEvent('SQL_INJECTION_ATTEMPT', {
            ip: req.ip,
            userAgent: req.get('user-agent'),
            path: req.path,
            field,
            value: value.substring(0, 100)
          });
          errors.push(`${field} contains invalid characters`);
          continue;
        }

        // XSS check
        if (rules.noXSS !== false && containsXSS(value)) {
          logSecurityEvent('XSS_ATTEMPT', {
            ip: req.ip,
            userAgent: req.get('user-agent'),
            path: req.path,
            field,
            value: value.substring(0, 100)
          });
          errors.push(`${field} contains invalid content`);
          continue;
        }

        // Min length
        if (rules.minLength && value.length < rules.minLength) {
          errors.push(`${field} must be at least ${rules.minLength} characters`);
        }

        // Max length
        if (rules.maxLength && value.length > rules.maxLength) {
          errors.push(`${field} must be at most ${rules.maxLength} characters`);
        }

        // Pattern matching
        if (rules.pattern && !rules.pattern.test(value)) {
          errors.push(`${field} format is invalid`);
        }

        // Email validation
        if (rules.email && !isValidEmail(value)) {
          errors.push(`${field} must be a valid email address`);
        }

        // Sanitize the value
        if (rules.sanitize !== false) {
          req.body[field] = sanitizeString(value, rules.maxLength || 500);
        }
      }

      // Number validations
      if (typeof value === 'number' || (rules.type === 'number' && value)) {
        const num = Number(value);
        
        if (isNaN(num)) {
          errors.push(`${field} must be a valid number`);
          continue;
        }

        if (rules.min !== undefined && num < rules.min) {
          errors.push(`${field} must be at least ${rules.min}`);
        }

        if (rules.max !== undefined && num > rules.max) {
          errors.push(`${field} must be at most ${rules.max}`);
        }

        if (rules.integer && !Number.isInteger(num)) {
          errors.push(`${field} must be an integer`);
        }
      }

      // Array validations
      if (Array.isArray(value)) {
        if (rules.minItems && value.length < rules.minItems) {
          errors.push(`${field} must have at least ${rules.minItems} items`);
        }

        if (rules.maxItems && value.length > rules.maxItems) {
          errors.push(`${field} must have at most ${rules.maxItems} items`);
        }

        // Validate array items
        if (rules.items) {
          value.forEach((item, index) => {
            if (rules.items.type && typeof item !== rules.items.type) {
              errors.push(`${field}[${index}] must be of type ${rules.items.type}`);
            }
            if (typeof item === 'string' && containsSQLInjection(item)) {
              errors.push(`${field}[${index}] contains invalid characters`);
            }
          });
        }
      }

      // Enum validation
      if (rules.enum && !rules.enum.includes(value)) {
        errors.push(`${field} must be one of: ${rules.enum.join(', ')}`);
      }

      // Custom validation function
      if (rules.custom && typeof rules.custom === 'function') {
        const customError = rules.custom(value, body);
        if (customError) {
          errors.push(customError);
        }
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }

    next();
  };
};

/**
 * Validate URL parameters (IDs)
 */
const validateParams = (...paramNames) => {
  return (req, res, next) => {
    for (const param of paramNames) {
      const value = req.params[param];
      
      if (!value) {
        return res.status(400).json({
          success: false,
          message: `${param} parameter is required`
        });
      }

      if (!isValidId(value)) {
        logSecurityEvent('INVALID_ID_PARAMETER', {
          ip: req.ip,
          userAgent: req.get('user-agent'),
          path: req.path,
          param,
          value
        });
        return res.status(400).json({
          success: false,
          message: `Invalid ${param} format`
        });
      }
    }
    next();
  };
};

/**
 * Validate query parameters
 */
const validateQuery = (schema) => {
  return (req, res, next) => {
    const errors = [];
    const query = req.query || {};

    for (const [field, rules] of Object.entries(schema)) {
      const value = query[field];

      if (rules.required && !value) {
        errors.push(`${field} query parameter is required`);
        continue;
      }

      if (value && typeof value === 'string') {
        if (containsSQLInjection(value)) {
          logSecurityEvent('SQL_INJECTION_QUERY', {
            ip: req.ip,
            path: req.path,
            field,
            value
          });
          errors.push(`${field} contains invalid characters`);
          continue;
        }

        if (rules.pattern && !rules.pattern.test(value)) {
          errors.push(`${field} query parameter format is invalid`);
        }

        // Sanitize query param
        req.query[field] = sanitizeString(value, 100);
      }

      if (rules.enum && value && !rules.enum.includes(value)) {
        errors.push(`${field} must be one of: ${rules.enum.join(', ')}`);
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid query parameters',
        errors
      });
    }

    next();
  };
};

/**
 * Prevent mass assignment attacks
 */
const allowedFields = (fields) => {
  return (req, res, next) => {
    if (!req.body || typeof req.body !== 'object') {
      return next();
    }

    const allowedSet = new Set(fields);
    const providedFields = Object.keys(req.body);
    const unauthorizedFields = providedFields.filter(f => !allowedSet.has(f));

    if (unauthorizedFields.length > 0) {
      logSecurityEvent('MASS_ASSIGNMENT_ATTEMPT', {
        ip: req.ip,
        userAgent: req.get('user-agent'),
        path: req.path,
        unauthorizedFields
      });
      
      // Remove unauthorized fields
      unauthorizedFields.forEach(field => {
        delete req.body[field];
      });
    }

    next();
  };
};

/**
 * Rate limit per user for sensitive operations
 */
const userRateLimit = (maxRequests, windowMs, operation) => {
  const userRequests = new Map();

  return (req, res, next) => {
    if (!req.user || !req.user.id) {
      return next();
    }

    const userId = req.user.id.toString();
    const now = Date.now();
    const key = `${userId}:${operation}`;

    if (!userRequests.has(key)) {
      userRequests.set(key, []);
    }

    const requests = userRequests.get(key);
    const recentRequests = requests.filter(timestamp => now - timestamp < windowMs);

    if (recentRequests.length >= maxRequests) {
      logSecurityEvent('USER_RATE_LIMIT_EXCEEDED', {
        userId,
        operation,
        ip: req.ip,
        path: req.path
      });

      return res.status(429).json({
        success: false,
        message: 'Too many requests. Please try again later.',
        retryAfter: Math.ceil(windowMs / 1000)
      });
    }

    recentRequests.push(now);
    userRequests.set(key, recentRequests);

    // Cleanup old entries periodically
    if (Math.random() < 0.01) {
      for (const [k, timestamps] of userRequests.entries()) {
        const valid = timestamps.filter(t => now - t < windowMs);
        if (valid.length === 0) {
          userRequests.delete(k);
        } else {
          userRequests.set(k, valid);
        }
      }
    }

    next();
  };
};

module.exports = {
  validateRequestBody,
  validateParams,
  validateQuery,
  allowedFields,
  userRateLimit,
  isValidId,
  isValidEmail,
  sanitizeString,
  containsSQLInjection,
  containsXSS,
  PATTERNS
};
