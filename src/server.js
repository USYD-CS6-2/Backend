require('dotenv').config();

const app = require('./app');
const { config, validateConfig } = require('./config/env');
const logger = require('./utils/logger');

validateConfig();

const PORT = config.app.port;

const server = app.listen(PORT, () => {
  logger.info('Server started', {
    port: PORT,
    node_env: config.app.nodeEnv,
  });
});

function shutdown(signal) {
  logger.warn('Shutdown signal received', { signal });

  server.close((err) => {
    if (err) {
      logger.error('Error during server shutdown', {
        signal,
        message: err.message,
      });
      process.exit(1);
    }

    logger.info('Server stopped gracefully', { signal });
    process.exit(0);
  });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

process.on('uncaughtException', (err) => {
  logger.error('Uncaught exception', { message: err.message, stack: err.stack });
});

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled rejection', {
    reason: reason instanceof Error ? reason.message : String(reason),
  });
});