import { generateHeatmapData } from '../../../services/heatmap.service.js';
import { logger } from '../../../utils/logger.js';

export const generateHeatmap = async (request, response, next) => {
  try {
    const heatmap = await generateHeatmapData(request.body);

    logger.info('Heatmap data generated', {
      regions: heatmap.heatmap.regions.length,
      businessType: request.body.analysis?.businessType,
    });

    response.status(200).json(heatmap);
  } catch (error) {
    next(error);
  }
};
