const { Sequelize } = require('sequelize');

const databaseUrl = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/nba_litigmus';
const replicaUrl = process.env.DATABASE_REPLICA_URL || null;

// Pool sizing — DB connections are I/O-bound, not CPU-bound.
//
// If the database is remote (cross-country), each in-flight query holds a pool
// slot for the full round-trip latency (e.g. 100 ms Lagos→London means you
// need 10 slots just to serve 10 concurrent users without queuing).
//
// Rule: set DB_POOL_PER_WORKER explicitly based on expected concurrent queries
// per worker, NOT on CPU count.  A value of 10 is a safe starting point.
// Total DB connections = CLUSTER_WORKERS × DB_POOL_PER_WORKER.
// Keep that total ≤ DB_POOL_BUDGET (default 80) to stay under Postgres limits.
//
// To raise capacity: increase DB_POOL_PER_WORKER or CLUSTER_WORKERS, but
// ensure the product stays within DB_POOL_BUDGET.
const CLUSTER_WORKERS = Number(process.env.CLUSTER_WORKERS || 2);
const POOL_PER_WORKER = Number(process.env.DB_POOL_PER_WORKER || 10);
const POOL_BUDGET = Number(process.env.DB_POOL_BUDGET || 80);

if (CLUSTER_WORKERS * POOL_PER_WORKER > POOL_BUDGET) {
  console.warn(
    `⚠️  DB pool warning: ${CLUSTER_WORKERS} workers × ${POOL_PER_WORKER} pool = ` +
    `${CLUSTER_WORKERS * POOL_PER_WORKER} connections > budget ${POOL_BUDGET}. ` +
    `Reduce DB_POOL_PER_WORKER or DB_POOL_BUDGET accordingly.`
  );
}

const perWorkerMax = POOL_PER_WORKER;
const perWorkerMin = Math.max(1, Math.floor(POOL_PER_WORKER / 4));

const DIALECT_OPTIONS = {
  ssl: process.env.DB_SSL === 'true'
    ? { require: true, rejectUnauthorized: false }
    : false,
  // Keep TCP connections alive – critical for cross-region links
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
  statement_timeout: Number(process.env.DB_STATEMENT_TIMEOUT_MS || 30000),
  idle_in_transaction_session_timeout: Number(process.env.DB_TX_IDLE_TIMEOUT_MS || 15000)
};

const POOL_DEFAULTS = {
  max: Number(process.env.DB_POOL_MAX || perWorkerMax),
  min: Number(process.env.DB_POOL_MIN || perWorkerMin),
  acquire: Number(process.env.DB_POOL_ACQUIRE || 30000),
  idle: Number(process.env.DB_POOL_IDLE || 10000),
  evict: 5000   // scan for idle connections every 5 s
};

// ---------- Primary (read-write) ----------
const sequelize = new Sequelize(databaseUrl, {
  dialect: 'postgres',
  logging: false,
  pool: POOL_DEFAULTS,
  dialectOptions: DIALECT_OPTIONS
});

// ---------- Read replica (read-only) ----------
// When DATABASE_REPLICA_URL is set (e.g. a Postgres standby in another region)
// heavy read queries are routed here, leaving the primary free for writes.
const sequelizeRead = replicaUrl
  ? new Sequelize(replicaUrl, {
      dialect: 'postgres',
      logging: false,
      pool: POOL_DEFAULTS,
      dialectOptions: DIALECT_OPTIONS
    })
  : sequelize; // fall back to primary when no replica is configured

const setRequestRlsContext = async (transaction, context = {}) => {
  const replacements = {
    userId: context.userId || '',
    role: context.role || '',
    state: context.state || '',
    court: context.court || '',
    courtDivision: context.courtDivision || ''
  };

  await sequelize.query(
    `
      SELECT
        set_config('app.current_user_id', :userId, true),
        set_config('app.current_user_role', :role, true),
        set_config('app.current_state', :state, true),
        set_config('app.current_court', :court, true),
        set_config('app.current_court_division', :courtDivision, true)
    `,
    {
      transaction,
      replacements
    }
  );
};

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    const replicaLabel = replicaUrl ? ` | replica configured` : ' | no replica configured';
    console.log(`✅ PostgreSQL connected (${CLUSTER_WORKERS} workers × ${POOL_DEFAULTS.max} pool/worker = ${CLUSTER_WORKERS * POOL_DEFAULTS.max} max connections${replicaLabel})`);

    if (replicaUrl) {
      await sequelizeRead.authenticate();
      console.log('✅ PostgreSQL read replica connected');
    }
  } catch (error) {
    console.error('❌ PostgreSQL connection error:', error.message);
    console.error('💡 Set DATABASE_URL or start PostgreSQL locally with the nba_litigmus database.');
    error.code = error.code || 'DATABASE_CONNECTION_FAILED';
    throw error;
  }
};

const closeDB = async () => {
  await sequelize.close();
  if (replicaUrl) await sequelizeRead.close();
  console.log('📴 PostgreSQL connection(s) closed');
};

module.exports = {
  sequelize,
  sequelizeRead,
  connectDB,
  closeDB,
  setRequestRlsContext
};
