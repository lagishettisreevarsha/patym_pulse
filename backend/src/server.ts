import app from './app';
import { config } from './config/env.config';
import { logger } from './utils/logger';

const server = app.listen(config.PORT, () => {
  logger.info(`Server is running in ${config.NODE_ENV} mode on port ${config.PORT}`);
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received. Shutting down server...');
  server.close(() => {
    logger.info('Server closed.');
    process.exit(0);
  });
});
