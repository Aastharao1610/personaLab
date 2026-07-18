import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { corsMiddleware } from './config/cors.js';
import { env } from './config/env.js';
import apiRoutes from './api/v1/routes/index.js';
import analyzeRoutes from './api/v1/routes/analyze.routes.js';
import { getAiHealth } from './api/v1/controllers/health.controller.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { notFoundHandler } from './middlewares/notFoundHandler.js';

const app = express();

app.use(helmet());
app.use(corsMiddleware);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

if (env.NODE_ENV !== 'test') {
  app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

app.get('/health/ai', getAiHealth);
app.use(analyzeRoutes);
app.use('/api/v1', apiRoutes);
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
