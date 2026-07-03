const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const AuditLog = require('../models/AuditLog');

const FRESH_JUDGE_SESSION_MS = 12 * 60 * 60 * 1000;

const requireVerifiedJudge = (req, res, next) => {
  if (!req.user || req.user.role !== 'judge') {
    return res.status(403).json({
      success: false,
      message: 'Judge access is required for this route'
    });
  }

  if (!req.user.isVerified) {
    return res.status(403).json({
      success: false,
      message: 'Please confirm your email before accessing the Judge Dashboard'
    });
  }

  next();
};

const requireFreshJudgeSession = (req, res, next) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
  const decoded = token ? jwt.decode(token) : null;
  const issuedAt = decoded?.iat ? new Date(decoded.iat * 1000) : req.user.lastLogin;

  if (!issuedAt || Date.now() - issuedAt.getTime() > FRESH_JUDGE_SESSION_MS) {
    return res.status(401).json({
      success: false,
      message: 'Judge session has expired. Please log in again to access this secure dashboard.'
    });
  }

  next();
};

const sensitiveJudgeRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: 'Too many sensitive Judge Dashboard actions. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Too many sensitive Judge Dashboard actions. Please try again later.',
      retryAfter: 15 * 60
    });
  }
});

const auditJudgeAction = (action) => (req, res, next) => {
  const originalJson = res.json;

  res.json = function(payload) {
    if (res.statusCode < 400 && req.user) {
      AuditLog.create({
        userId: req.user._id,
        caseId: req.params.caseId || payload?.data?.case?._id || null,
        action,
        metadata: {
          role: req.user.role,
          email: req.user.email,
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
          requestBody: req.method !== 'GET' ? req.body : undefined
        }
      }).catch((error) => {
        console.error('Judge audit log error:', error.message);
      });
    }

    return originalJson.call(this, payload);
  };

  next();
};

module.exports = {
  requireVerifiedJudge,
  requireFreshJudgeSession,
  sensitiveJudgeRateLimiter,
  auditJudgeAction
};
