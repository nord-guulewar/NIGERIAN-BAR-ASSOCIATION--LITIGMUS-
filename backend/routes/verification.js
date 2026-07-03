const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { sendVerificationCode, verifyCode } = require('../utils/verificationService');
const { verificationRateLimiter } = require('../middleware/security');

router.post('/send-code', protect, verificationRateLimiter, async (req, res) => {
  try {
    const { method } = req.body;
    const result = await sendVerificationCode(req.user._id, method || 'sms');
    
    res.status(result.success ? 200 : 400).json({
      success: result.success,
      message: result.message,
      ...(result.success ? { expiresAt: result.expiresAt } : {})
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

router.post('/verify-code', protect, verificationRateLimiter, async (req, res) => {
  try {
    const { code } = req.body;
    
    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'Please provide verification code'
      });
    }

    const result = await verifyCode(req.user._id, code);
    
    res.status(result.success ? 200 : 400).json({
      success: result.success,
      message: result.message
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
