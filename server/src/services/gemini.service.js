import { AIProvider, AIProviderError } from './AIProvider.js';

export { AIProviderError as AiServiceError };

export const generateGeminiContent = (request, context = {}) =>
  AIProvider.generateContent(request, context);

export const checkGeminiHealth = () => AIProvider.checkHealth();
