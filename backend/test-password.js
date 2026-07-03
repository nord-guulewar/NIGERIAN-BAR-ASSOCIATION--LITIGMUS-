const User = require('./models/User');
const { sequelize } = require('./config/postgres');
const bcrypt = require('bcryptjs');

(async () => {
  try {
    await sequelize.authenticate();
    const user = await User.findOne({ email: 'admin@nba.org.ng' });
    if (user) {
      console.log('User found:', user.email);
      const match = await bcrypt.compare('Admin@123', user.password);
      console.log('Password match:', match);
      
      if (!match) {
        // Reset password
        const fresh = await bcrypt.hash('Admin@123', 10);
        user.password = fresh;
        await user.save();
        console.log('✅ Password reset to Admin@123');
      } else {
        console.log('✅ Password is correct');
      }
    } else {
      console.log('❌ User not found');
    }
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
})();
