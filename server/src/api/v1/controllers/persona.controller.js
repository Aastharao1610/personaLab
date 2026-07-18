import { generatePersonasFromProductUnderstanding } from '../../../services/persona.service.js';
import { logger } from '../../../utils/logger.js';

export const generatePersonas = async (request, response, next) => {
  try {
    const personas = await generatePersonasFromProductUnderstanding(request.body);

    logger.info('Personas generated from product understanding', {
      count: personas.personas.length,
      productType: request.body.productType,
      industry: request.body.industry,
    });

    response.status(200).json(personas);
  } catch (error) {
    next(error);
  }
};
