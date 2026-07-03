const User = require('./models/User');
const { sequelize } = require('./config/postgres');
const bcrypt = require('bcryptjs');

(async () => {
  try {
    await sequelize.authenticate();
    
    // Get the user
    const user = await User.findOne({ email: 'admin@nba.org.ng' });
    console.log('Current password hash:', user.password);
    
    // Create a new fresh hash
    const newHash = await bcrypt.hash('Admin@123', 10);
    console.log('New password hash:', newHash);
    
    // Test the new hash
    const testMatch = await bcrypt.compare('Admin@123', newHash);
    console.log('Test match with new hash:', testMatch);
    
    // Update the user with the new hash
    console.log('Updating user password...');
    user.password = newHash;
    await user.save();
    console.log('User password updated');
    
    // Verify it was saved
    const updatedUser = await User.findOne({ email: 'admin@nba.org.ng' });
    console.log('Saved password hash:', updatedUser.password);
    
    const finalTest = await bcrypt.compare('Admin@123', updatedUser.password);
    console.log('Final password match test:', finalTest);
    
    if (finalTest) {
      console.log('✅ PASSWORD RESET SUCCESSFUL');
    } else {
      console.log('❌ PASSWORD RESET FAILED');
    }
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
})();
