const crypto = require('crypto');
const { logSecurityEvent } = require('../utils/incidentLogger');

/**
 * CSRF Protection Middleware
 * Prevents Cross-Site Request Forgery attacks by validating tokens
 */

const tokenStore = new Map();
const TOKEN_EXPIRY = 15 * 60 * 1000; // 15 minutes

/**
 * Generate CSRF token for a user session
 */
const generateToken = (userId, sessionId) => {
  const token = crypto.randomBytes(32).toString('hex');
  const key = `${userId}:${sessionId}`;
  
  tokenStore.set(key, {
    token,
    createdAt: Date.now()
  });

  // Cleanup expired tokens periodically
  if (Math.random() < 0.1) {
    cleanupExpiredTokens();
  }

  return token;
};

/**
 * Validate CSRF token
 */
const validateToken = (userId, sessionId, providedToken) => {
  const key = `${userId}:${sessionId}`;
  const stored = tokenStore.get(key);

  if (!stored) {
    return false;
  }

  // Check expiry
  if (Date.now() - stored.createdAt > TOKEN_EXPIRY) {
    tokenStore.delete(key);
    return false;
  }

  // Constant-time comparison to prevent timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(stored.token),
    Buffer.from(providedToken)
  );
};

/**
 * Cleanup expired tokens
 */
const cleanupExpiredTokens = () => {
  const now = Date.now();
  for (const [key, value] of tokenStore.entries()) {
    if (now - value.createdAt > TOKEN_EXPIRY) {
      tokenStore.delete(key);
    }
  }
};

/**
 * CSRF protection middleware
 * Validates CSRF token for state-changing operations
 */
const csrfProtection = (req, res, next) => {
  // Skip CSRF for safe methods
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // Skip CSRF for API endpoints using Bearer token (already authenticated)
  // But still validate for cookie-based sessions if implemented
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    // For API requests, we rely on the JWT token
    // CSRF is primarily a concern for cookie-based sessions
    return next();
  }

  const token = req.headers['x-csrf-token'] || req.body?._csrf;
  const userId = req.user?.id || req.session?.userId;
  const sessionId = req.sessionID || req.user?.id;

  if (!token) {
    logSecurityEvent('CSRF_TOKEN_MISSING', {
      ip: req.ip,
      userAgent: req.get('user-agent'),
      path: req.path,
      method: req.method
    });

    return res.status(403).json({
      success: false,
      message: 'CSRF token required'
    });
  }

  if (!validateToken(userId, sessionId, token)) {
    logSecurityEvent('CSRF_TOKEN_INVALID', {
      ip: req.ip,
      userAgent: req.get('user-agent'),
      path: req.path,
      method: req.method,
      userId
    });

    return res.status(403).json({
      success: false,
      message: 'Invalid or expired CSRF token'
    });
  }

  next();
};

/**
 * Endpoint to get CSRF token
 */
const getCsrfToken = (req, res) => {
  const userId = req.user?.id;
  const sessionId = req.sessionID || req.user?.id;

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  const token = generateToken(userId, sessionId);

  res.status(200).json({
    success: true,
    csrfToken: token
  });
};

// Periodic cleanup of expired tokens
setInterval(cleanupExpiredTokens, 5 * 60 * 1000); // Every 5 minutes

module.exports = {
  csrfProtection,
  getCsrfToken,
  generateToken,
  validateToken
};
