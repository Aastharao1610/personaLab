import crypto from 'node:crypto';
import { productUnderstandingSchema } from '../schemas/productUnderstanding.schema.js';
import { personasResponseSchema } from '../schemas/persona.schema.js';
import {
  simulationJsonSchema,
  simulationActionValues,
  simulationResponseSchema,
  terminalOutcomeValues,
} from '../schemas/simulation.schema.js';
import { logger } from '../utils/logger.js';
import { AIProvider } from './AIProvider.js';
import { parseGeminiJson } from './openaiJson.service.js';

const simulationInstructions = [
  'You are Engine 3: Behavior Simulation for a product simulation platform.',
  'Use only the provided Product Understanding JSON and Persona JSON.',
  'Do not inspect images, screenshots, files, or external context.',
  'Generate the complete simulation in this single response. Do not assume any later calls.',
  'Each persona must behave independently and have a realistic ordered journey.',
  'Each journey must end in exactly one terminal outcome: CONVERTED, ABANDONED, EXITED, or HESITATED.',
  'Every step must be grounded in Product Understanding fields and the specific persona traits.',
  'Use pageIntent to choose realistic actions from the supplied schema.',
  'For DEVELOPER_PROFILE, prefer READ_BIO, OPEN_REPOSITORY, VIEW_CONTRIBUTIONS, OPEN_PINNED_PROJECT, FOLLOW, CONTACT, OPEN_GITHUB, HESITATE, EXIT_PAGE.',
  'For PORTFOLIO, prefer VIEW_PROJECT, DOWNLOAD_RESUME, OPEN_GITHUB, CONTACT, READ_BIO, HESITATE, EXIT_PAGE.',
  'For DOCUMENTATION, prefer SEARCH_DOCS, COPY_CODE, READ_GUIDE, OPEN_API_REFERENCE, SCAN_NAVIGATION, HESITATE, EXIT_PAGE.',
  'For ECOMMERCE, prefer SEARCH_PRODUCT, CHECK_PRICE, ADD_TO_CART, CHECKOUT, PURCHASE, LOOK_FOR_TRUST_SIGNALS, HESITATE, EXIT_PAGE.',
  'For SAAS and LANDING_PAGE, prefer READ_HEADLINE, CLICK_PRIMARY_CTA, REQUEST_DEMO, SIGN_UP, CHECK_PRICING, LOOK_FOR_TRUST_SIGNALS, HESITATE, EXIT_PAGE.',
  'Never simulate checkout, add-to-cart, purchase, pricing checkout, or buying behavior for DEVELOPER_PROFILE, PORTFOLIO, DOCUMENTATION, BLOG, NEWS, SOCIAL_PROFILE, or EDUCATION unless visible evidence clearly supports it.',
  'Never simulate checkout on a GitHub profile. Never simulate purchasing on a portfolio.',
  'Return only JSON matching the supplied schema. Do not include markdown, explanations, comments, or extra keys.',
].join(' ');

const pageIntentActionMap = {
  DEVELOPER_PROFILE: [
    'SCAN_PAGE',
    'READ_BIO',
    'OPEN_REPOSITORY',
    'VIEW_CONTRIBUTIONS',
    'OPEN_PINNED_PROJECT',
    'FOLLOW',
    'CONTACT',
    'OPEN_GITHUB',
    'HESITATE',
    'BACKTRACK',
    'EXIT_PAGE',
    'CONVERT',
  ],
  PORTFOLIO: [
    'SCAN_PAGE',
    'READ_BIO',
    'VIEW_PROJECT',
    'DOWNLOAD_RESUME',
    'OPEN_GITHUB',
    'CONTACT',
    'CLICK_PRIMARY_CTA',
    'HESITATE',
    'BACKTRACK',
    'EXIT_PAGE',
    'CONVERT',
  ],
  DOCUMENTATION: [
    'SCAN_PAGE',
    'SCAN_NAVIGATION',
    'SEARCH_DOCS',
    'READ_GUIDE',
    'OPEN_API_REFERENCE',
    'COPY_CODE',
    'HESITATE',
    'BACKTRACK',
    'EXIT_PAGE',
    'CONVERT',
  ],
  ECOMMERCE: [
    'SCAN_PAGE',
    'SEARCH_PRODUCT',
    'CHECK_PRICE',
    'ADD_TO_CART',
    'CHECKOUT',
    'PURCHASE',
    'LOOK_FOR_TRUST_SIGNALS',
    'HESITATE',
    'BACKTRACK',
    'EXIT_PAGE',
    'CONVERT',
  ],
  SAAS: [
    'SCAN_PAGE',
    'READ_HEADLINE',
    'SCAN_NAVIGATION',
    'CLICK_PRIMARY_CTA',
    'REQUEST_DEMO',
    'SIGN_UP',
    'CHECK_PRICING',
    'LOOK_FOR_TRUST_SIGNALS',
    'HESITATE',
    'BACKTRACK',
    'EXIT_PAGE',
    'CONVERT',
  ],
  BLOG: [
    'SCAN_PAGE',
    'READ_HEADLINE',
    'READ_POST',
    'OPEN_AUTHOR_PROFILE',
    'SHARE_ARTICLE',
    'SCAN_NAVIGATION',
    'HESITATE',
    'BACKTRACK',
    'EXIT_PAGE',
    'CONVERT',
  ],
  LANDING_PAGE: [
    'SCAN_PAGE',
    'READ_HEADLINE',
    'WATCH_VIDEO',
    'CLICK_PRIMARY_CTA',
    'CLICK_SECONDARY_CTA',
    'SIGN_UP',
    'REQUEST_DEMO',
    'LOOK_FOR_TRUST_SIGNALS',
    'HESITATE',
    'BACKTRACK',
    'EXIT_PAGE',
    'CONVERT',
  ],
  MARKETPLACE: [
    'SCAN_PAGE',
    'SEARCH_PRODUCT',
    'FILTER_RESULTS',
    'COMPARE_OPTIONS',
    'VIEW_PROFILE',
    'SAVE_ITEM',
    'CONTACT',
    'HESITATE',
    'BACKTRACK',
    'EXIT_PAGE',
    'CONVERT',
  ],
  SOCIAL_PROFILE: [
    'SCAN_PAGE',
    'READ_BIO',
    'VIEW_PROFILE',
    'FOLLOW',
    'CONTACT',
    'OPEN_AUTHOR_PROFILE',
    'HESITATE',
    'BACKTRACK',
    'EXIT_PAGE',
    'CONVERT',
  ],
  DASHBOARD: [
    'SCAN_PAGE',
    'VIEW_DASHBOARD',
    'FILTER_DATA',
    'OPEN_REPORT',
    'SCAN_NAVIGATION',
    'INSPECT_FORM',
    'HESITATE',
    'BACKTRACK',
    'EXIT_PAGE',
    'CONVERT',
  ],
  NEWS: [
    'SCAN_PAGE',
    'READ_HEADLINE',
    'READ_ARTICLE',
    'OPEN_AUTHOR_PROFILE',
    'SHARE_ARTICLE',
    'SCAN_NAVIGATION',
    'HESITATE',
    'BACKTRACK',
    'EXIT_PAGE',
    'CONVERT',
  ],
  EDUCATION: [
    'SCAN_PAGE',
    'READ_HEADLINE',
    'ENROLL',
    'START_LESSON',
    'READ_GUIDE',
    'WATCH_VIDEO',
    'SCAN_NAVIGATION',
    'HESITATE',
    'BACKTRACK',
    'EXIT_PAGE',
    'CONVERT',
  ],
};

const getAllowedActionsForIntent = (pageIntent) =>
  pageIntentActionMap[pageIntent] || simulationActionValues;

const createValidationError = (message) => {
  const error = new Error(message);
  error.statusCode = 502;
  return error;
};

const parseSimulationInput = (input) => {
  const parsedProductUnderstanding = productUnderstandingSchema.safeParse(input?.productUnderstanding);
  const parsedPersonas = personasResponseSchema.safeParse({
    personas: input?.personas,
  });

  if (!parsedProductUnderstanding.success || !parsedPersonas.success) {
    const error = new Error('Valid Product Understanding JSON and Persona JSON are required');
    error.statusCode = 400;
    error.validationErrors = {
      productUnderstanding: parsedProductUnderstanding.success
        ? []
        : parsedProductUnderstanding.error.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        })),
      personas: parsedPersonas.success
        ? []
        : parsedPersonas.error.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        })),
    };

    logger.error('Behavior simulation input validation failed', {
      engine: 'BehaviorSimulationEngine',
      validationErrors: error.validationErrors,
      productUnderstandingKeys: Object.keys(input?.productUnderstanding || {}),
      personaCount: Array.isArray(input?.personas) ? input.personas.length : null,
    });

    throw error;
  }

  const personaIds = parsedPersonas.data.personas.map((persona) => persona.id);

  if (new Set(personaIds).size !== personaIds.length) {
    const error = new Error('Persona IDs must be unique');
    error.statusCode = 400;
    throw error;
  }

  return {
    productUnderstanding: parsedProductUnderstanding.data,
    personas: parsedPersonas.data.personas,
  };
};

const validateJourneyIntegrity = (simulation, personas, simulationId) => {
  if (simulation.simulationId !== simulationId) {
    throw createValidationError('Gemini returned a simulationId that does not match the request');
  }

  const inputPersonaIds = new Set(personas.map((persona) => persona.id));
  const outputPersonaIds = simulation.personaJourneys.map((journey) => journey.personaId);

  if (new Set(outputPersonaIds).size !== outputPersonaIds.length) {
    throw createValidationError('Gemini returned duplicate persona IDs');
  }

  if (outputPersonaIds.length !== personas.length) {
    throw createValidationError('Gemini returned the wrong number of persona journeys');
  }

  for (const personaId of outputPersonaIds) {
    if (!inputPersonaIds.has(personaId)) {
      throw createValidationError('Gemini returned a journey for an unknown persona');
    }
  }

  for (const journey of simulation.personaJourneys) {
    if (!terminalOutcomeValues.includes(journey.outcome)) {
      throw createValidationError(`Unsupported terminal outcome: ${journey.outcome}`);
    }

    journey.steps.forEach((step, index) => {
      const expectedStepIndex = index + 1;

      if (step.stepIndex !== expectedStepIndex) {
        throw createValidationError(
          `Steps out of order for persona ${journey.personaId}: expected ${expectedStepIndex}`,
        );
      }
    });
  }

  const countedSummary = simulation.personaJourneys.reduce(
    (summary, journey) => ({
      totalPersonas: summary.totalPersonas + 1,
      converted: summary.converted + (journey.outcome === 'CONVERTED' ? 1 : 0),
      abandoned: summary.abandoned + (journey.outcome === 'ABANDONED' ? 1 : 0),
      exited: summary.exited + (journey.outcome === 'EXITED' ? 1 : 0),
      hesitated: summary.hesitated + (journey.outcome === 'HESITATED' ? 1 : 0),
    }),
    {
      totalPersonas: 0,
      converted: 0,
      abandoned: 0,
      exited: 0,
      hesitated: 0,
    },
  );

  for (const [key, value] of Object.entries(countedSummary)) {
    if (simulation.summary[key] !== value) {
      throw createValidationError(`Summary metric mismatch for ${key}`);
    }
  }
};

const normalize = (value) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');

const findJourneyForPersona = ({ persona, journeys, usedJourneyIndexes, fallbackIndex }) => {
  const matchedByIdIndex = journeys.findIndex((journey, index) =>
    !usedJourneyIndexes.has(index) && journey?.personaId === persona.id);

  if (matchedByIdIndex >= 0) {
    return {
      journey: journeys[matchedByIdIndex],
      journeyIndex: matchedByIdIndex,
    };
  }

  const matchedByNameIndex = journeys.findIndex((journey, index) =>
    !usedJourneyIndexes.has(index) && normalize(journey?.personaName) === normalize(persona.name));

  if (matchedByNameIndex >= 0) {
    return {
      journey: journeys[matchedByNameIndex],
      journeyIndex: matchedByNameIndex,
    };
  }

  if (journeys[fallbackIndex] && !usedJourneyIndexes.has(fallbackIndex)) {
    return {
      journey: journeys[fallbackIndex],
      journeyIndex: fallbackIndex,
    };
  }

  return {
    journey: null,
    journeyIndex: -1,
  };
};

const calculateSummary = (personaJourneys) => {
  const summary = personaJourneys.reduce(
    (result, journey) => ({
      totalPersonas: result.totalPersonas + 1,
      converted: result.converted + (journey.outcome === 'CONVERTED' ? 1 : 0),
      abandoned: result.abandoned + (journey.outcome === 'ABANDONED' ? 1 : 0),
      exited: result.exited + (journey.outcome === 'EXITED' ? 1 : 0),
      hesitated: result.hesitated + (journey.outcome === 'HESITATED' ? 1 : 0),
      confidenceTotal: result.confidenceTotal + Number(journey.confidence || 0),
    }),
    {
      totalPersonas: 0,
      converted: 0,
      abandoned: 0,
      exited: 0,
      hesitated: 0,
      confidenceTotal: 0,
    },
  );

  return {
    totalPersonas: summary.totalPersonas,
    converted: summary.converted,
    abandoned: summary.abandoned,
    exited: summary.exited,
    hesitated: summary.hesitated,
    averageConfidence: summary.totalPersonas
      ? Number((summary.confidenceTotal / summary.totalPersonas).toFixed(2))
      : 0,
  };
};

const commerceOnlyActions = new Set(['ADD_TO_CART', 'CHECKOUT', 'PURCHASE']);

const sanitizeActionForIntent = (action, pageIntent) => {
  if (pageIntent !== 'ECOMMERCE' && commerceOnlyActions.has(action)) {
    return 'HESITATE';
  }

  return action;
};

const createFallbackJourney = ({ persona, productUnderstanding, journeyIndex }) => ({
  personaId: persona.id,
  personaName: persona.name,
  outcome: 'HESITATED',
  confidence: Math.min(Math.max(Number(persona.confidence || 0.65), 0), 1),
  steps: [
    {
      stepIndex: 1,
      state: 'OBSERVING',
      observation: `The page appears to be a ${productUnderstanding.productType} in ${productUnderstanding.industry}.`,
      interpretation: `${persona.name} evaluates whether the page supports their goal: ${persona.primaryGoal}.`,
      action: 'SCAN_PAGE',
      target: productUnderstanding.mainCTA || productUnderstanding.primaryGoal,
      reason: persona.expectedJourney || persona.primaryGoal,
      friction: 0.45,
      trust: Math.min(Math.max(Number(productUnderstanding.confidence || 0.6), 0), 1),
      motivation: Math.min(Math.max(Number(persona.confidence || 0.65), 0), 1),
    },
    {
      stepIndex: 2,
      state: 'DECIDING',
      observation: productUnderstanding.potentialUXProblems[journeyIndex] ||
        'The next step is not fully validated by the available page evidence.',
      interpretation: `${persona.name} needs clearer evidence before committing.`,
      action: 'HESITATE',
      target: productUnderstanding.mainCTA || 'primary action',
      reason: persona.frustrations[0] || 'Insufficient confidence to complete the journey.',
      friction: 0.6,
      trust: 0.5,
      motivation: 0.55,
    },
  ],
});

const normalizeSimulationMetadata = ({ simulation, personas, simulationId }) => {
  const sourceJourneys = simulation?.personaJourneys || [];
  const usedJourneyIndexes = new Set();

  const personaJourneys = personas.map((persona, personaIndex) => {
    const { journey, journeyIndex } = findJourneyForPersona({
      persona,
      journeys: sourceJourneys,
      usedJourneyIndexes,
      fallbackIndex: personaIndex,
    });

    if (journeyIndex >= 0) {
      usedJourneyIndexes.add(journeyIndex);
    }

    if (!journey) {
      return createFallbackJourney({
        persona,
        productUnderstanding: simulation?.productUnderstanding || {},
        journeyIndex: personaIndex,
      });
    }

    return {
      ...journey,
      personaId: persona.id,
      personaName: persona.name,
      steps: (journey.steps || []).map((step, stepIndex) => ({
        ...step,
        action: sanitizeActionForIntent(step.action, simulation?.productUnderstanding?.pageIntent),
        stepIndex: stepIndex + 1,
      })),
    };
  });

  const countedSummary = calculateSummary(personaJourneys);

  return {
    ...simulation,
    simulationId,
    status: 'completed',
    personaJourneys,
    summary: {
      ...(simulation?.summary || {}),
      ...countedSummary,
      topFrictionPoints: Array.isArray(simulation?.summary?.topFrictionPoints)
        ? simulation.summary.topFrictionPoints
        : [],
    },
  };
};

const buildPromptPayload = ({ simulationId, productUnderstanding, personas }) => ({
  task: 'Generate Engine 3 behavior simulation from Product Understanding and Personas.',
  simulationId,
  constraints: {
    singleResponse: true,
    pageIntent: productUnderstanding.pageIntent,
    personaCount: personas.length,
    personaJourneys: `return exactly ${personas.length} personaJourneys`,
    personaIds: 'copy each input persona.id exactly into the matching personaJourney.personaId',
    personaNames: 'copy each input persona.name exactly into the matching personaJourney.personaName',
    requiredPersonaIds: personas.map((persona) => persona.id),
    missingPersonaRule: 'do not skip, merge, summarize, or omit any persona',
    simulationId: 'copy the provided simulationId exactly',
    stepIndexes: 'start at 1 and increase by 1 with no gaps',
    terminalOutcomes: terminalOutcomeValues,
    allowedActionsForPageIntent: getAllowedActionsForIntent(productUnderstanding.pageIntent),
    prohibitedBehavior:
      'do not use checkout, add-to-cart, purchase, or shopper behavior unless pageIntent is ECOMMERCE',
  },
  productUnderstanding,
  personas,
});

export const BehaviorSimulationEngine = {
  async run(input) {
    const { productUnderstanding, personas } = parseSimulationInput(input);
    const simulationId = crypto.randomUUID();

    logger.info('Behavior simulation started', {
      engine: 'BehaviorSimulationEngine',
      simulationId,
      personaCount: personas.length,
      pageIntent: productUnderstanding.pageIntent,
      productType: productUnderstanding.productType,
      industry: productUnderstanding.industry,
    });

    const { response, model } = await AIProvider.generateContent({
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: JSON.stringify(buildPromptPayload({
                simulationId,
                productUnderstanding,
                personas,
              })),
            },
          ],
        },
      ],
      config: {
        systemInstruction: simulationInstructions,
        responseMimeType: 'application/json',
        responseJsonSchema: simulationJsonSchema,
        groqResponseMode: 'json_object',
        temperature: 0,
      },
    }, {
      engine: 'BehaviorSimulationEngine',
      simulationId,
    });

    const simulation = parseGeminiJson(
      response,
      'Gemini returned an empty behavior simulation response',
      'Gemini returned invalid behavior simulation JSON',
    );

    const normalizedSimulation = normalizeSimulationMetadata({
      simulation: {
        ...simulation,
        productUnderstanding,
      },
      personas,
      simulationId,
    });

    const parsedSimulation = simulationResponseSchema.safeParse(normalizedSimulation);

    if (!parsedSimulation.success) {
      logger.error('Behavior simulation validation failed', {
        engine: 'BehaviorSimulationEngine',
        simulationId,
        validationErrors: parsedSimulation.error.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        })),
      });

      throw createValidationError('Gemini returned behavior simulation JSON that does not match the schema');
    }

    validateJourneyIntegrity(parsedSimulation.data, personas, simulationId);

    logger.info('Behavior simulation completed', {
      engine: 'BehaviorSimulationEngine',
      simulationId,
      model,
      personaCount: parsedSimulation.data.personaJourneys.length,
    });

    return parsedSimulation.data;
  },
};
