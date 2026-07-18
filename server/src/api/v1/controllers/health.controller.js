import { checkGeminiHealth } from '../../../services/gemini.service.js';

export const getHealth = (_request, response) => {
  response.status(200).json({
    status: 'ok',
    service: 'personalab-api',
    timestamp: new Date().toISOString(),
  });
};

export const getAiHealth = async (_request, response, next) => {
  try {
    const aiHealth = await checkGeminiHealth();

    response.status(200).json({
      status: 'ok',
      service: 'personalab-ai',
      provider: 'gemini',
      model: aiHealth.model,
      responseTextLength: aiHealth.responseTextLength,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
};
