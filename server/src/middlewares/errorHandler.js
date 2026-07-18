import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

export const errorHandler = (error, _request, response, _next) => {
  const statusCode = error.statusCode || error.status || 500;

  if (error.structuredError) {
    logger.error('Request failed', {
      message: error.message,
      statusCode,
      code: error.structuredError.error?.code,
    });
    response.status(statusCode).json(error.structuredError);
    return;
  }

  const payload = {
    message: statusCode === 500 ? 'Internal server error' : error.message,
  };

  if (error.code === 'LIMIT_FILE_SIZE') {
    payload.message = 'Image must be 8MB or smaller';
    response.status(413).json(payload);
    return;
  }

  if (env.NODE_ENV !== 'production') {
    payload.details = error.message;
    if (error.validationErrors) {
      payload.validationErrors = error.validationErrors;
    }
  }

  logger.error('Request failed', {
    message: error.message,
    statusCode,
    code: error.code,
  });
  response.status(statusCode).json(payload);
};
