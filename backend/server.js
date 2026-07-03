const { ensureAppReady } = require('./app');
const { closeDB } = require('./config/postgres');

// Graceful shutdown
let server;

const gracefulShutdown = async (signal) => {
  console.log(`\n${signal} received. Closing server gracefully...`);
  try {
    await closeDB();
    console.log('PostgreSQL connection closed.');
  } catch (err) {
    console.error('Error closing PostgreSQL:', err.message);
  }
  if (server) {
    server.close(() => {
      console.log('HTTP server closed.');
      process.exit(0);
    });
    return;
  }

  process.exit(0);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

const startServer = async () => {
  try {
    await ensureAppReady();
    const { app } = require('./app');
    const PORT = process.env.PORT || 5000;

    server = app.listen(PORT, () => {
      console.log(`NBA LITIGMUS Server running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV}`);
    });
  } catch (error) {
    console.error('❌ PostgreSQL startup error:', error.message);
    process.exit(1);
  }
};

void startServer();
