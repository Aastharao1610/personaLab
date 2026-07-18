import app from './app.js';
import { env } from './config/env.js';
import { connectDatabase } from './config/database.js';
import { logger } from './utils/logger.js';

const startServer = async () => {
  try {
    await connectDatabase();

    app.listen(env.PORT, () => {
      logger.info(`PersonaLab API listening on port ${env.PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start server', error);
    process.exit(1);
  }
};

startServer();
