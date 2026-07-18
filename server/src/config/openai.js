import { GoogleGenAI } from '@google/genai';
import { env } from './env.js';

export const aiProvider = env.AI_PROVIDER;

export const gemini = env.GEMINI_API_KEY
  ? new GoogleGenAI({
      apiKey: env.GEMINI_API_KEY,
    })
  : null;

export const geminiModel = env.GEMINI_MODEL;
export const geminiFallbackModel = env.GEMINI_FALLBACK_MODEL;
export const geminiModels = [geminiModel, geminiFallbackModel];

export const groqApiKey = env.GROQ_API_KEY || env.GROQ_OPENAI_API_KEY || env.OPENAI_API_KEY;
export const groqTextModel = env.GROQ_TEXT_MODEL;
export const groqVisionModel = env.GROQ_VISION_MODEL;
export const groqFallbackModel = env.GROQ_FALLBACK_MODEL;
