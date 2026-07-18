import { productUnderstandingSchema } from '../schemas/productUnderstanding.schema.js';
import { personasResponseSchema } from '../schemas/persona.schema.js';
import { simulationResponseSchema } from '../schemas/simulation.schema.js';
import {
  insightsJsonSchema,
  insightsResponseSchema,
  recommendationValues,
} from '../schemas/insights.schema.js';
import { logger } from '../utils/logger.js';
import { AIProvider } from './AIProvider.js';
import { parseGeminiJson } from './openaiJson.service.js';

const insightsInstructions = [
  'You are Engine 4: Insights & Launch Recommendation for a product simulation platform.',
  'Use only the provided Product Understanding, Personas, and Behavior Simulation JSON.',
  'Do not inspect images, screenshots, files, or external context.',
  'Use productUnderstanding.pageIntent as the primary context for strengths, weaknesses, friction points, and UX recommendations.',
  'Generate a concise launch assessment with evidence grounded in the provided inputs.',
  'Launch score must be an integer from 0 to 100.',
  `Recommendation must be one of: ${recommendationValues.join(', ')}.`,
  'Persona summaries must align with simulation persona journeys and outcomes.',
  'Recommended improvements must be practical UX changes, not new product features.',
  'For DEVELOPER_PROFILE, recommend improvements like clearer bio, stronger project descriptions, contribution visibility, technology highlights, pinned project clarity, and contact/recruiting paths.',
  'For PORTFOLIO, recommend improvements like project showcase clarity, resume visibility, contact CTA, role/case-study context, and proof of work.',
  'For DOCUMENTATION, recommend improvements like search, navigation, code examples, API reference clarity, onboarding path, and copyable snippets.',
  'For ECOMMERCE, recommend improvements like CTA clarity, pricing visibility, trust signals, product discovery, cart, checkout, and purchase confidence.',
  'For SAAS, recommend improvements like value proposition clarity, demo/signup CTA, pricing visibility, trust proof, onboarding, and feature comprehension.',
  'Do not recommend checkout, cart, purchase, or pricing-flow improvements for developer profiles or portfolios unless the Product Understanding explicitly shows commerce.',
  'Return only JSON matching the supplied schema. Do not include markdown, explanations, comments, or extra keys.',
].join(' ');

const parseInsightsInput = (input) => {
  const parsedProductUnderstanding = productUnderstandingSchema.safeParse(input?.productUnderstanding);
  const parsedPersonas = personasResponseSchema.safeParse({
    personas: input?.personas,
  });
  const parsedSimulation = simulationResponseSchema.safeParse(input?.simulation);

  if (!parsedProductUnderstanding.success || !parsedPersonas.success || !parsedSimulation.success) {
    const error = new Error('Valid Product Understanding, Persona, and Simulation JSON are required');
    error.statusCode = 400;
    throw error;
  }

  return {
    productUnderstanding: parsedProductUnderstanding.data,
    personas: parsedPersonas.data.personas,
    simulation: parsedSimulation.data,
  };
};

const createValidationError = (message) => {
  const error = new Error(message);
  error.statusCode = 502;
  return error;
};

const validateInsightIntegrity = (insights, personas, simulation) => {
  const personaIds = new Set(personas.map((persona) => persona.id));
  const journeyIds = new Set(simulation.personaJourneys.map((journey) => journey.personaId));
  const summaryIds = insights.personaSummary.map((summary) => summary.personaId);

  if (new Set(summaryIds).size !== summaryIds.length) {
    throw createValidationError('Insights returned duplicate persona summaries');
  }

  for (const personaId of summaryIds) {
    if (!personaIds.has(personaId) || !journeyIds.has(personaId)) {
      throw createValidationError('Insights returned a summary for an unknown persona');
    }
  }

  if (summaryIds.length !== personas.length) {
    throw createValidationError('Insights returned the wrong number of persona summaries');
  }

  const averageJourneyConfidence =
    simulation.personaJourneys.reduce((total, journey) => total + journey.confidence, 0) /
    Math.max(simulation.personaJourneys.length, 1);

  if (insights.launchScore >= 75 && insights.recommendation === 'HIGH_RISK') {
    throw createValidationError('Insights recommendation conflicts with high launch score');
  }

  if (insights.launchScore < 40 && insights.recommendation === 'READY_TO_LAUNCH') {
    throw createValidationError('Insights recommendation conflicts with low launch score');
  }

  if (averageJourneyConfidence < 0.4 && insights.launchScore > 80) {
    throw createValidationError('Insights launch score conflicts with simulation confidence');
  }
};

export const InsightsEngine = {
  async generate(input) {
    const { productUnderstanding, personas, simulation } = parseInsightsInput(input);

    logger.info('Insights generation started', {
      engine: 'InsightsEngine',
      simulationId: simulation.simulationId,
      personaCount: personas.length,
      pageIntent: productUnderstanding.pageIntent,
      productType: productUnderstanding.productType,
    });

    const { response, model } = await AIProvider.generateContent({
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: JSON.stringify({
                task: 'Generate Engine 4 insights and launch recommendation.',
                productUnderstanding,
                personas,
                simulation,
              }),
            },
          ],
        },
      ],
      config: {
        systemInstruction: insightsInstructions,
        responseMimeType: 'application/json',
        responseJsonSchema: insightsJsonSchema,
        temperature: 0,
      },
    }, {
      engine: 'InsightsEngine',
      simulationId: simulation.simulationId,
    });

    const insights = parseGeminiJson(
      response,
      'Gemini returned an empty insights response',
      'Gemini returned invalid insights JSON',
    );

    const parsedInsights = insightsResponseSchema.safeParse(insights);

    if (!parsedInsights.success) {
      throw createValidationError('Gemini returned insights JSON that does not match the schema');
    }

    validateInsightIntegrity(parsedInsights.data, personas, simulation);

    logger.info('Insights generation completed', {
      engine: 'InsightsEngine',
      simulationId: simulation.simulationId,
      model,
      launchScore: parsedInsights.data.launchScore,
      recommendation: parsedInsights.data.recommendation,
    });

    return parsedInsights.data;
  },
};
