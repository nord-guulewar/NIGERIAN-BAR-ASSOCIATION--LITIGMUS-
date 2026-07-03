require('dotenv').config();

const fs = require('fs');
const path = require('path');
const { sequelize, connectDB, closeDB } = require('../config/postgres');
const { applyRls } = require('./applyRls');

function loadModels() {
  const modelsDir = path.join(__dirname, '..', 'models');

  fs.readdirSync(modelsDir)
    .filter((fileName) => fileName.endsWith('.js'))
    .sort()
    .forEach((fileName) => {
      require(path.join(modelsDir, fileName));
    });
}

async function applyIndexes() {
  const sqlPath = path.join(__dirname, '..', 'migrations', '002_indexes.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');
  // Split on semicolons but skip empty statements
  const statements = sql
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.startsWith('--'));

  for (const stmt of statements) {
    await sequelize.query(stmt + ';');
  }
  console.log('✅ Database indexes applied');
}

async function bootstrapDatabase() {
  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_SCHEMA_BOOTSTRAP !== 'true') {
    throw new Error('Schema bootstrap is blocked in production unless ALLOW_SCHEMA_BOOTSTRAP=true');
  }

  try {
    loadModels();
    await connectDB();
    await sequelize.sync();
    console.log('✅ PostgreSQL schema bootstrapped');
    await applyRls({ manageConnection: false });
    await applyIndexes();
  } catch (error) {
    console.error('❌ Database bootstrap failed:', error.message);
    process.exitCode = 1;
  } finally {
    await closeDB();
  }
}

if (require.main === module) {
  bootstrapDatabase().catch(() => {
    process.exit(1);
  });
}

module.exports = { bootstrapDatabase, loadModels };