const { logSecurityEvent } = require('../utils/incidentLogger');

const HEADER_NAME_PATTERNS = {
  'user-agent': [
    /<script|javascript:|onerror=/i,
    /\$\(|\$\{|`/,
    /UNION\s+SELECT|DROP\s+TABLE|INSERT\s+INTO/i
  ],
  referer: [
    /<script|javascript:|onerror=/i,
    /\.\.\//,
    /\$\(|\$\{|`/,
    /UNION\s+SELECT|DROP\s+TABLE|INSERT\s+INTO/i
  ],
  'x-forwarded-for': [
    /[^0-9a-fA-F\.:,\s]/,
    /\.\.\//,
    /UNION\s+SELECT|DROP\s+TABLE|INSERT\s+INTO/i
  ],
  accept: [
    /<script|javascript:|onerror=/i,
    /\.\.\//,
    /UNION\s+SELECT|DROP\s+TABLE|INSERT\s+INTO/i
  ],
  'accept-language': [
    /<script|javascript:|onerror=/i,
    /\.\.\//,
    /UNION\s+SELECT|DROP\s+TABLE|INSERT\s+INTO/i
  ]
};

/**
 * Enhanced Security Middleware
 * Additional protection layers beyond helmet and standard middleware
 */

/**
 * Detect and block common attack patterns in headers
 */
const headerSecurityCheck = (req, res, next) => {
  const headersToCheck = Object.keys(HEADER_NAME_PATTERNS)
    .map((headerName) => ({
      headerName,
      headerValue: req.get(headerName)
    }))
    .filter(({ headerValue }) => Boolean(headerValue));

  for (const { headerName, headerValue } of headersToCheck) {
    const suspiciousPatterns = HEADER_NAME_PATTERNS[headerName] || [];

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(headerValue)) {
        logSecurityEvent('MALICIOUS_HEADER_DETECTED', {
          ip: req.ip,
          path: req.path,
          headerName,
          header: headerValue.substring(0, 100),
          pattern: pattern.toString()
        });

        return res.status(400).json({
          success: false,
          message: 'Invalid request headers'
        });
      }
    }
  }

  next();
};

/**
 * Validate request origin and prevent DNS rebinding attacks
 */
const validateOrigin = (req, res, next) => {
  const allowedOrigins = [
    process.env.FRONTEND_URL,
    process.env.ADMIN_URL,
    'http://localhost:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001'
  ].filter(Boolean);

  const allowedLoopbackHosts = new Set(['localhost', '127.0.0.1', '::1', '[::1]']);

  const isAllowedOrigin = (value) => {
    if (!value) {
      return false;
    }

    if (allowedOrigins.some((allowed) => value.startsWith(allowed))) {
      return true;
    }

    if (process.env.NODE_ENV !== 'production') {
      try {
        const parsedOrigin = new URL(value);
        return allowedLoopbackHosts.has(parsedOrigin.hostname);
      } catch (error) {
        return false;
      }
    }

    return false;
  };

  const origin = req.get('origin');
  const referer = req.get('referer');

  // For non-browser requests (API calls), origin may be undefined
  if (!origin && !referer) {
    return next();
  }

  // Check if origin is in allowed list
  if (origin && !isAllowedOrigin(origin)) {
    logSecurityEvent('INVALID_ORIGIN', {
      ip: req.ip,
      origin,
      path: req.path,
      method: req.method
    });

    return res.status(403).json({
      success: false,
      message: 'Invalid request origin'
    });
  }

  next();
};

/**
 * Prevent HTTP parameter pollution
 */
const preventParameterPollution = (req, res, next) => {
  // Check for duplicate parameters in query string
  if (req.query) {
    const queryString = req.url.split('?')[1];
    if (queryString) {
      const params = queryString.split('&');
      const paramNames = params.map(p => p.split('=')[0]);
      const uniqueParams = new Set(paramNames);

      if (paramNames.length !== uniqueParams.size) {
        logSecurityEvent('PARAMETER_POLLUTION_DETECTED', {
          ip: req.ip,
          path: req.path,
          queryString: queryString.substring(0, 200)
        });

        return res.status(400).json({
          success: false,
          message: 'Duplicate parameters detected'
        });
      }
    }
  }

  next();
};

/**
 * Enforce content-type for POST/PUT/PATCH requests
 */
const enforceContentType = (req, res, next) => {
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    const contentType = req.get('content-type');

    if (!contentType) {
      return res.status(400).json({
        success: false,
        message: 'Content-Type header required'
      });
    }

    // Only allow JSON for API requests
    if (!contentType.includes('application/json') && 
        !contentType.includes('multipart/form-data')) {
      logSecurityEvent('INVALID_CONTENT_TYPE', {
        ip: req.ip,
        path: req.path,
        contentType
      });

      return res.status(415).json({
        success: false,
        message: 'Unsupported Media Type. Use application/json or multipart/form-data'
      });
    }
  }

  next();
};

/**
 * Detect bot and crawler patterns
 */
const botDetection = (req, res, next) => {
  const userAgent = req.get('user-agent') || '';
  
  const suspiciousBotPatterns = [
    /sqlmap/i,
    /nikto/i,
    /nmap/i,
    /masscan/i,
    /metasploit/i,
    /burpsuite/i,
    /havij/i,
    /acunetix/i
  ];

  for (const pattern of suspiciousBotPatterns) {
    if (pattern.test(userAgent)) {
      logSecurityEvent('SUSPICIOUS_BOT_DETECTED', {
        ip: req.ip,
        userAgent,
        path: req.path
      });

      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
  }

  next();
};

/**
 * Enforce minimum request spacing for sensitive endpoints
 */
const requestThrottler = (minSpacingMs) => {
  const lastRequests = new Map();

  return (req, res, next) => {
    const key = `${req.ip}:${req.path}`;
    const now = Date.now();
    const lastRequest = lastRequests.get(key);

    if (lastRequest && (now - lastRequest) < minSpacingMs) {
      logSecurityEvent('REQUEST_THROTTLE_TRIGGERED', {
        ip: req.ip,
        path: req.path,
        timeSinceLastMs: now - lastRequest
      });

      return res.status(429).json({
        success: false,
        message: 'Request too frequent. Please slow down.',
        retryAfter: Math.ceil((minSpacingMs - (now - lastRequest)) / 1000)
      });
    }

    lastRequests.set(key, now);

    // Periodic cleanup
    if (Math.random() < 0.01) {
      const cutoff = now - (minSpacingMs * 10);
      for (const [k, timestamp] of lastRequests.entries()) {
        if (timestamp < cutoff) {
          lastRequests.delete(k);
        }
      }
    }

    next();
  };
};

/**
 * Validate JSON payloads are not deeply nested (prevent DoS)
 */
const validateJsonDepth = (maxDepth = 10) => {
  const getDepth = (obj, depth = 0) => {
    if (depth > maxDepth) return depth;
    if (typeof obj !== 'object' || obj === null) return depth;
    
    const depths = Object.values(obj).map(value => getDepth(value, depth + 1));
    return Math.max(depth, ...depths);
  };

  return (req, res, next) => {
    if (req.body && typeof req.body === 'object') {
      const depth = getDepth(req.body);
      
      if (depth > maxDepth) {
        logSecurityEvent('EXCESSIVE_JSON_NESTING', {
          ip: req.ip,
          path: req.path,
          depth
        });

        return res.status(400).json({
          success: false,
          message: 'Request payload too deeply nested'
        });
      }
    }

    next();
  };
};

/**
 * Detect timing attack attempts
 */
const timingAttackDetection = (req, res, next) => {
  const startTime = process.hrtime.bigint();

  const originalSend = res.send;
  res.send = function(data) {
    const endTime = process.hrtime.bigint();
    const duration = Number(endTime - startTime) / 1000000; // Convert to ms

    // Log unusually fast responses that might indicate timing attacks
    if (duration < 1 && req.path.includes('login')) {
      logSecurityEvent('POTENTIAL_TIMING_ATTACK', {
        ip: req.ip,
        path: req.path,
        duration: duration.toFixed(3)
      });
    }

    return originalSend.call(this, data);
  };

  next();
};

module.exports = {
  headerSecurityCheck,
  validateOrigin,
  preventParameterPollution,
  enforceContentType,
  botDetection,
  requestThrottler,
  validateJsonDepth,
  timingAttackDetection
};
