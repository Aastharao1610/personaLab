import cors from 'cors';
import { env } from './env.js';

const allowedOrigins = env.CLIENT_URL.split(',').map((origin) => origin.trim());

export const corsMiddleware = cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
});
