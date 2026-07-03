const User = require('./models/User');
const { sequelize } = require('./config/postgres');
const bcrypt = require('bcryptjs');

(async () => {
  try {
    await sequelize.authenticate();
    const email = 'admin@nba.org.ng';
    const password = 'Admin@123';
    
    console.log('Testing login...');
    console.log('Email:', email);
    console.log('Password:', password);
    
    // Exactly as in authExtended.js
    const user = await User.findOne({ email });
    console.log('User found:', user ? 'YES' : 'NO');
    
    if (user) {
      console.log('User email:', user.email);
      console.log('User password field type:', typeof user.password);
      console.log('User password:', user.password ? '(set)' : '(not set)');
      
      const isPasswordMatch = await bcrypt.compare(password, user.password);
      console.log('Password match result:', isPasswordMatch);
      
      if (isPasswordMatch) {
        console.log('✅ LOGIN SUCCESSFUL');
      } else {
        console.log('❌ LOGIN FAILED - PASSWORD MISMATCH');
      }
    } else {
      console.log('❌ USER NOT FOUND');
    }
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    console.error(err.stack);
    process.exit(1);
  }
})();
