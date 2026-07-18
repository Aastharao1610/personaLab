import { generateInsights } from '../../../services/insights.service.js';
import { logger } from '../../../utils/logger.js';

export const generateProductInsights = async (request, response, next) => {
  try {
    const insights = await generateInsights(request.body);

    logger.info('Product insights generated', {
      launchScore: insights.launchScore,
      recommendation: insights.recommendation,
      productType: request.body.productUnderstanding?.productType,
    });

    response.status(200).json(insights);
  } catch (error) {
    next(error);
  }
};
