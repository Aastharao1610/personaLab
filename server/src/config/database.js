import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

export const connectDatabase = async () => {
  if (!env.MONGODB_URI) {
    logger.info('MongoDB connection skipped: MONGODB_URI is not configured');
    return null;
  }

  mongoose.set('strictQuery', true);

  const connection = await mongoose.connect(env.MONGODB_URI);
  logger.info(`MongoDB connected: ${connection.connection.host}`);

  return connection;
};
