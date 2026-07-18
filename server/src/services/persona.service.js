import { PersonaGenerationEngine } from './PersonaGenerationEngine.js';

export const generatePersonasFromProductUnderstanding = (productUnderstanding) =>
  PersonaGenerationEngine.generate(productUnderstanding);

export const generatePersonasFromAnalysis = generatePersonasFromProductUnderstanding;
