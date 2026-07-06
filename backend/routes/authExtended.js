const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { sanitizeObject } = require('../utils/validation');
const { sendVerificationCode, verifyCode } = require('../utils/verificationService');
const { loginRateLimiter, recoveryLoginRateLimiter } = require('../middleware/security');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// Step 1: Login credentials check
router.post('/login-step1', loginRateLimiter, async (req, res) => {
  try {
    const sanitizedData = sanitizeObject(req.body);
    const { email, password } = sanitizedData;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    if (user.role === 'judge') {
      return res.status(400).json({
        success: false,
        message: 'Judicial officers must use the dedicated judge login portal.'
      });
    }

    if (user.role === 'admin') {
      return res.status(400).json({
        success: false,
        message: 'Administrators must use the dedicated admin login portal.'
      });
    }

    // Check if account is locked
    if (user.isAccountLocked()) {
      const lockedMinutes = Math.ceil((user.accountLockedUntil - new Date()) / 60000);
      return res.status(423).json({
        success: false,
        message: `Account locked due to too many failed login attempts. Try again in ${lockedMinutes} minutes.`,
        data: { 
          locked: true, 
          unlocksAt: user.accountLockedUntil,
          canResetPassword: true 
        }
      });
    }

    const isPasswordMatch = await bcrypt.compare(password, user.password);

    if (!isPasswordMatch) {
      // Record failed login attempt
      const attempts = await user.recordFailedLogin();
      const remainingAttempts = 5 - attempts;
      
      if (user.isAccountLocked()) {
        return res.status(423).json({
          success: false,
          message: 'Account locked due to too many failed login attempts. Please reset your password or try again later.',
          data: {
            locked: true,
            failedAttempts: attempts,
            unlocksAt: user.accountLockedUntil,
            canResetPassword: true
          }
        });
      }

      return res.status(401).json({
        success: false,
        message: `Invalid credentials. ${remainingAttempts} attempts remaining.`,
        data: {
          failedAttempts: attempts,
          remainingAttempts: remainingAttempts
        }
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated. Please contact administrator'
      });
    }

    if (!user.isVerified) {
      return res.status(403).json({
        success: false,
        message: 'Please confirm your email before logging in'
      });
    }

    // Record successful login (resets failed attempts)
    await user.recordSuccessfulLogin();

    // Send verification code
    const result = await sendVerificationCode(user.id, req.ip, req.get('user-agent'));
    const method = result.method || 'email';

    res.status(200).json({
      success: true,
      message: `Verification code sent via ${method}`,
      data: {
        userId: user.id,
        phoneNumber: user.phoneNumber ? user.phoneNumber.replace(/\d(?=\d{4})/g, '*') : null,
        method,
        demoCode: result.demoCode,
        expiresAt: result.expiresAt
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Step 2: Verify code and complete login
router.post('/login-verify', async (req, res) => {
  try {
    const { userId, code } = req.body;

    if (!userId || !code) {
      return res.status(400).json({
        success: false,
        message: 'Please provide user ID and verification code'
      });
    }

    const verifyResult = await verifyCode(userId, code);

    if (!verifyResult.success) {
      return res.status(400).json({
        success: false,
        message: verifyResult.message
      });
    }

    const user = await User.findById(userId);
    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user.id);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          state: user.state,
          court: user.court,
          phoneNumber: user.phoneNumber
        },
        token
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Resend verification code
router.post('/resend-code', async (req, res) => {
  try {
    const { userId, method } = req.body;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide user ID'
      });
    }

    const result = await sendVerificationCode(userId, req.ip, req.get('user-agent'));
    
    res.status(result.success ? 200 : 400).json({
      success: result.success,
      message: result.message,
      ...(result.success ? { 
        demoCode: result.demoCode,
        expiresAt: result.expiresAt 
      } : {})
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
