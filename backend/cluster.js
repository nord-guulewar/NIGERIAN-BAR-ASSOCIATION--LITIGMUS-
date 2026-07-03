const cluster = require('cluster');
const os = require('os');

// Determine number of workers (use 75% of available CPUs to leave room for system)
const numCPUs = Math.max(1, Math.floor(os.cpus().length * 0.75));

if (cluster.isMaster) {
  console.log(`🚀 Master process ${process.pid} is running`);
  console.log(`💻 Starting ${numCPUs} worker processes...`);

  // Fork workers
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  // Track worker restarts
  let workerRestarts = {};

  cluster.on('exit', (worker, code, signal) => {
    console.log(`⚠️  Worker ${worker.process.pid} died (${signal || code})`);
    
    // Prevent rapid restart loops
    const now = Date.now();
    workerRestarts[worker.id] = workerRestarts[worker.id] || [];
    workerRestarts[worker.id].push(now);
    
    // Remove old restart records (older than 1 minute)
    workerRestarts[worker.id] = workerRestarts[worker.id].filter(
      time => now - time < 60000
    );
    
    // If worker has restarted more than 5 times in 1 minute, don't restart
    if (workerRestarts[worker.id].length > 5) {
      console.error(`❌ Worker ${worker.id} crashed too many times. Not restarting.`);
      return;
    }
    
    // Restart the worker
    console.log('🔄 Starting a new worker...');
    cluster.fork();
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('📴 SIGTERM received. Shutting down gracefully...');
    
    for (const id in cluster.workers) {
      cluster.workers[id].kill();
    }
    
    setTimeout(() => {
      console.log('⏰ Forcing shutdown after timeout');
      process.exit(0);
    }, 10000);
  });

  // Memory monitoring
  setInterval(() => {
    const used = process.memoryUsage();
    console.log(`📊 Master Memory: ${Math.round(used.heapUsed / 1024 / 1024)}MB / ${Math.round(used.heapTotal / 1024 / 1024)}MB`);
    
    for (const id in cluster.workers) {
      cluster.workers[id].send({ cmd: 'memoryCheck' });
    }
  }, 60000); // Check every minute

} else {
  // Worker processes run the actual server
  require('./server.js');
  
  console.log(`✅ Worker ${process.pid} started`);
  
  // Handle memory check requests
  process.on('message', (msg) => {
    if (msg.cmd === 'memoryCheck') {
      const used = process.memoryUsage();
      console.log(`   Worker ${process.pid}: ${Math.round(used.heapUsed / 1024 / 1024)}MB`);
      
      // If memory usage is too high, restart this worker
      if (used.heapUsed > 500 * 1024 * 1024) { // 500MB threshold
        console.warn(`⚠️  Worker ${process.pid} memory usage too high. Restarting...`);
        process.exit(1);
      }
    }
  });
  
  // Graceful shutdown for worker
  process.on('SIGTERM', () => {
    console.log(`📴 Worker ${process.pid} shutting down...`);
    process.exit(0);
  });
}
