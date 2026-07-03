const { connectDB, closeDB } = require('../config/postgres');
const User = require('../models/User');
require('dotenv').config();

const updateUserEmail = async (currentEmail, newEmail) => {
  try {
    await connectDB();
    console.log('Connected to PostgreSQL');

    const user = await User.findOne({ email: currentEmail });
    
    if (!user) {
      console.log(`❌ User with email ${currentEmail} not found`);
      process.exit(1);
    }

    console.log(`\nFound user: ${user.firstName} ${user.lastName}`);
    console.log(`Current email: ${user.email}`);
    console.log(`Role: ${user.role}`);
    
    user.email = newEmail;
    await user.save();
    
    console.log(`\n✅ Email updated successfully to: ${newEmail}`);
    console.log('Verification codes will now be sent to this email.\n');
    
    await closeDB();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

const listUsers = async () => {
  try {
    await connectDB();
    console.log('Connected to PostgreSQL\n');

    const users = await User.findAll({ attributes: ['firstName', 'lastName', 'email', 'role'] });
    
    if (users.length === 0) {
      console.log('No users found in database');
      await closeDB();
    process.exit(0);
    }

    console.log('📋 All Users:\n');
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.firstName} ${user.lastName}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.role}\n`);
    });
    
    await closeDB();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

const args = process.argv.slice(2);

if (args[0] === 'list') {
  listUsers();
} else if (args.length === 2) {
  const [currentEmail, newEmail] = args;
  updateUserEmail(currentEmail, newEmail);
} else {
  console.log('\n📧 Update User Email Script\n');
  console.log('Usage:');
  console.log('  List all users:');
  console.log('    node scripts/updateUserEmail.js list\n');
  console.log('  Update email:');
  console.log('    node scripts/updateUserEmail.js <current-email> <new-email>\n');
  console.log('Example:');
  console.log('    node scripts/updateUserEmail.js old@email.com new@email.com\n');
  process.exit(1);
}
