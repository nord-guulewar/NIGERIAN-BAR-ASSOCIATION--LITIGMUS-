// Number of PM2 workers.  Keep this in sync with DB_POOL_BUDGET / DB_POOL_MAX
// so total DB connections = CLUSTER_WORKERS × perWorkerMax ≤ DB_POOL_BUDGET.
// Default: 2 workers × 10 pool = 20 connections (safe margin under Postgres 100).
// Increase to 4 on a 4+ core server with DB_POOL_BUDGET=80 (4 × 10 = 40).
const CLUSTER_WORKERS = Number(process.env.CLUSTER_WORKERS || 2);

module.exports = {
  apps: [{
    name: 'nba-litigmus',
    script: './cluster.js',
    instances: CLUSTER_WORKERS,
    exec_mode: 'cluster',

    // Memory management
    // Heap is 768 MB.  Restart threshold is 900 MB — well above heap ceiling
    // so the process never restarts mid-request due to heap fluctuation.
    max_memory_restart: '900M',

    // Environment variables — expose CLUSTER_WORKERS so postgres.js can
    // compute the per-worker pool size correctly.
    env: {
      NODE_ENV: 'development',
      PORT: 5000,
      CLUSTER_WORKERS
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 5000,
      CLUSTER_WORKERS
    },

    // Logging
    error_file: './logs/error.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,

    // Advanced features
    watch: false,
    ignore_watch: ['node_modules', 'logs', '.git'],

    // Restart strategy
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s',

    // Graceful shutdown
    kill_timeout: 5000,
    // wait_ready removed: the app does not call process.send('ready'),
    // so leaving wait_ready=true would stall startup for listen_timeout ms.
    listen_timeout: 5000,

    // Performance monitoring
    instance_var: 'INSTANCE_ID',

    // cron_restart removed: causes unnecessary downtime.
    // Use 'pm2 reload ecosystem.config.js' for zero-downtime rolling restarts.

    // Node.js optimization flags
    node_args: [
      '--max-old-space-size=768',  // Heap ceiling per worker
      '--gc-interval=200'           // Less aggressive GC — reduces latency spikes
    ]
  }],

  // Deployment configuration
  deploy: {
    production: {
      user: 'ubuntu',
      host: ['your-server-ip'],
      ref: 'origin/main',
      repo: 'git@github.com:your-repo/nba-litigmus.git',
      path: '/var/www/nba-litigmus',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env production',
      'pre-setup': 'apt-get install git -y'
    }
  }
};
