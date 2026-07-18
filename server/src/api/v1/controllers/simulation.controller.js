import { runSimulationEngine } from '../../../services/simulation.service.js';
import { logger } from '../../../utils/logger.js';

export const simulatePersonas = async (request, response, next) => {
  try {
    const simulations = await runSimulationEngine(request.body);

    logger.info('Persona simulations generated', {
      simulationId: simulations.simulationId,
      count: simulations.personaJourneys.length,
      productType: request.body.productUnderstanding?.productType,
    });

    response.status(200).json(simulations);
  } catch (error) {
    next(error);
  }
};
