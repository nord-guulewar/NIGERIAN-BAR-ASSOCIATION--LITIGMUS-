const User = require('./models/User');
const { sequelize } = require('./config/postgres');

(async () => {
  try {
    await sequelize.authenticate();
    const user = await User.findOne({ email: 'admin@nba.org.ng' });
    if (user && user.verificationCode) {
      console.log('✅ Verification Code:', user.verificationCode);
      console.log('Expires at:', user.verificationCodeExpires);
    } else {
      console.log('❌ No verification code found');
    }
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
})();
