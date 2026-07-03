const fs = require('fs');
const path = require('path');
const { sequelize, connectDB, closeDB } = require('../config/postgres');

const migrationPath = path.join(__dirname, '..', 'migrations', '001_enable_rls.sql');

async function applyRls(options = {}) {
  const { manageConnection = true } = options;
  const sql = fs.readFileSync(migrationPath, 'utf8');

  try {
    if (manageConnection) {
      await connectDB();
    }
    await sequelize.query(sql);
    console.log('✅ Row level security migration applied successfully');
    return true;
  } catch (error) {
    console.error('❌ Failed to apply RLS migration:', error.message);
    if (manageConnection) {
      process.exitCode = 1;
    }
    throw error;
  } finally {
    if (manageConnection) {
      await closeDB();
    }
  }
}

if (require.main === module) {
  applyRls().catch(() => {
    process.exit(1);
  });
}

module.exports = { applyRls };