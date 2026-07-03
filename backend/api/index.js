const { app, ensureAppReady } = require('../app');

module.exports = async (req, res) => {
  try {
    await ensureAppReady();
    return app(req, res);
  } catch (error) {
    console.error('❌ Vercel bootstrap error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server startup failed'
    });
  }
};