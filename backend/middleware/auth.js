const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { logSecurityEvent } = require('../utils/incidentLogger');
const { abacFilter, abacEnforce, getFilteredQuery } = require('./abac');
const { sequelize, setRequestRlsContext } = require('../config/postgres');
const { runWithRequestContext } = require('../db/requestContext');

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id);
    
    if (!req.user) {
      logSecurityEvent('TOKEN_COMPROMISED', { 
        ip: req.ip, 
        userAgent: req.get('user-agent'),
        reason: 'User not found for token'
      });
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!req.user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'User account is deactivated'
      });
    }

    if (!req.user.isVerified) {
      return res.status(403).json({
        success: false,
        message: 'Please confirm your email before continuing'
      });
    }

    const transaction = await sequelize.transaction();
    let transactionClosed = false;

    const finalizeTransaction = async (action) => {
      if (transactionClosed) {
        return;
      }

      transactionClosed = true;
      try {
        if (action === 'commit') {
          await transaction.commit();
        } else {
          await transaction.rollback();
        }
      } catch (txError) {
        console.error(`RLS transaction ${action} failed:`, txError.message);
      }
    };

    const cleanupListeners = () => {
      res.removeListener('finish', onFinish);
      res.removeListener('close', onClose);
      res.removeListener('error', onError);
    };

    const onFinish = () => {
      cleanupListeners();
      void finalizeTransaction('commit');
    };

    const onClose = () => {
      cleanupListeners();
      void finalizeTransaction(res.writableEnded ? 'commit' : 'rollback');
    };

    const onError = () => {
      cleanupListeners();
      void finalizeTransaction('rollback');
    };

    await setRequestRlsContext(transaction, {
      userId: req.user.id || req.user._id,
      role: req.user.role,
      state: req.user.state,
      court: req.user.court,
      courtDivision: req.user.courtDivision
    });

    res.once('finish', onFinish);
    res.once('close', onClose);
    res.once('error', onError);

    return runWithRequestContext({
      transaction,
      rlsContext: {
        userId: req.user.id || req.user._id,
        role: req.user.role,
        state: req.user.state,
        court: req.user.court,
        courtDivision: req.user.courtDivision
      }
    }, () => next());
  } catch (error) {
    logSecurityEvent('TOKEN_INVALID', { 
      ip: req.ip, 
      userAgent: req.get('user-agent'),
      error: error.message
    });
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route'
    });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role ${req.user.role} is not authorized to access this route`
      });
    }
    next();
  };
};

module.exports = { 
  protect, 
  authorize,
  abacFilter,
  abacEnforce,
  getFilteredQuery
};
