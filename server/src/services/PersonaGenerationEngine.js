import crypto from 'node:crypto';
import { productUnderstandingSchema } from '../schemas/productUnderstanding.schema.js';
import { personasJsonSchema, personasResponseSchema } from '../schemas/persona.schema.js';
import { logger } from '../utils/logger.js';
import { AIProvider } from './AIProvider.js';
import { parseGeminiJson } from './openaiJson.service.js';

const MAX_GENERATION_ATTEMPTS = 2;

const personaInstructions = [
  'You are Engine 2: Persona Generation for a product simulation platform.',
  'Use only the provided Product Understanding JSON. Do not infer from images, files, screenshots, or outside context.',
  'Generate 6 to 8 realistic target-user personas most likely to interact with this product.',
  'Use productUnderstanding.pageIntent as the primary driver for persona archetypes.',
  'For DEVELOPER_PROFILE, include recruiters, hiring managers, open source contributors, junior developers, engineering peers, and technical founders when relevant.',
  'For PORTFOLIO, include HR reviewers, clients, recruiters, designers, collaborators, and project evaluators when relevant.',
  'For ECOMMERCE, include shoppers, bargain hunters, returning customers, premium buyers, mobile buyers, and skeptical buyers when relevant.',
  'For DOCUMENTATION, include beginner developers, senior engineers, API consumers, technical writers, support engineers, and integration owners when relevant.',
  'For SAAS, include evaluators, admins, team leads, operators, budget owners, and power users when relevant.',
  'For BLOG, NEWS, EDUCATION, MARKETPLACE, SOCIAL_PROFILE, DASHBOARD, and LANDING_PAGE, choose personas whose goals match that intent instead of forcing shopping behavior.',
  'The output must be deterministic: keep temperature-sensitive variation low, avoid random gimmicks, and use stable archetypes grounded in the input.',
  'Each persona must explain why they exist through primaryGoal, motivations, frustrations, buyingBehavior, and expectedJourney.',
  'Include diverse archetypes when relevant: first-time user, returning customer, budget-conscious buyer, premium buyer, accessibility-focused user, mobile-first user, power user, and skeptical user.',
  'Do not create duplicate goals, demographics, or behaviors.',
  'Make personas specific to pageIntent, productType, industry, targetAudience, CTA structure, pricing visibility, checkout presence, trust signals, and UX problems.',
  'Return only JSON matching the supplied schema. Do not include markdown, explanations, comments, or extra keys.',
].join(' ');

const normalize = (value) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');

const deterministicUuid = (seed) => {
  const hash = crypto.createHash('sha256').update(seed).digest('hex');
  return [
    hash.slice(0, 8),
    hash.slice(8, 12),
    `5${hash.slice(13, 16)}`,
    `${((parseInt(hash.slice(16, 18), 16) & 0x3f) | 0x80).toString(16)}${hash.slice(18, 20)}`,
    hash.slice(20, 32),
  ].join('-');
};

const withDeterministicIds = (personaResponse, productUnderstanding) => ({
  personas: (personaResponse?.personas || []).map((persona, index) => ({
    ...persona,
    id: deterministicUuid(JSON.stringify({
      productType: productUnderstanding.productType,
      pageIntent: productUnderstanding.pageIntent,
      industry: productUnderstanding.industry,
      targetAudience: productUnderstanding.targetAudience,
      index,
      name: persona.name,
      primaryGoal: persona.primaryGoal,
      occupation: persona.occupation,
      country: persona.country,
    })),
  })),
});

const findDuplicateBy = (personas, getKey) => {
  const seen = new Set();

  for (const persona of personas) {
    const key = getKey(persona);

    if (seen.has(key)) {
      return key;
    }

    seen.add(key);
  }

  return null;
};

const validatePersonaDiversity = (personas) => {
  const duplicatedGoal = findDuplicateBy(personas, (persona) => normalize(persona.primaryGoal));

  if (duplicatedGoal) {
    return `duplicated goal: ${duplicatedGoal}`;
  }

  const duplicatedDemographics = findDuplicateBy(personas, (persona) =>
    [
      Math.floor(persona.age / 10),
      normalize(persona.occupation),
      normalize(persona.country),
      normalize(persona.technicalSkill),
    ].join('|'));

  if (duplicatedDemographics) {
    return `duplicated demographics: ${duplicatedDemographics}`;
  }

  const duplicatedBehavior = findDuplicateBy(personas, (persona) =>
    [
      normalize(persona.buyingBehavior),
      normalize(persona.riskTolerance),
      normalize(persona.decisionStyle),
      normalize(persona.attentionSpan),
    ].join('|'));

  if (duplicatedBehavior) {
    return `duplicated behavior: ${duplicatedBehavior}`;
  }

  return null;
};

const buildPromptPayload = ({ productUnderstanding, validationFeedback }) => ({
  task: 'Generate Engine 2 personas from this Product Understanding JSON.',
  constraints: {
    personaCount: '6 to 8',
    inputSource: 'Product Understanding JSON only',
    pageIntent: productUnderstanding.pageIntent,
    rejectDuplicatesFor: ['primaryGoal', 'demographics', 'buying behavior'],
    deterministic: true,
  },
  validationFeedback,
  productUnderstanding,
});

export const PersonaGenerationEngine = {
  async generate(productUnderstandingInput) {
    const parsedProductUnderstanding = productUnderstandingSchema.safeParse(productUnderstandingInput);

    if (!parsedProductUnderstanding.success) {
      const error = new Error('Valid Product Understanding JSON is required');
      error.statusCode = 400;
      throw error;
    }

    const productUnderstanding = parsedProductUnderstanding.data;
    let validationFeedback = null;

    for (let attempt = 1; attempt <= MAX_GENERATION_ATTEMPTS; attempt += 1) {
      logger.info('Persona generation started', {
        engine: 'PersonaGenerationEngine',
        attempt,
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
                  productUnderstanding,
                  validationFeedback,
                })),
              },
            ],
          },
        ],
        config: {
          systemInstruction: personaInstructions,
          responseMimeType: 'application/json',
          responseJsonSchema: personasJsonSchema,
          temperature: 0,
        },
      }, { engine: 'PersonaGenerationEngine', attempt });

      const generatedPersonas = parseGeminiJson(
        response,
        'Gemini returned an empty persona response',
        'Gemini returned invalid persona JSON',
      );

      const normalizedPersonas = withDeterministicIds(generatedPersonas, productUnderstanding);
      const parsedPersonas = personasResponseSchema.safeParse(normalizedPersonas);

      if (!parsedPersonas.success) {
        validationFeedback = 'Generated personas did not match the required schema.';
      } else {
        validationFeedback = validatePersonaDiversity(parsedPersonas.data.personas);

        if (!validationFeedback) {
          logger.info('Persona generation completed', {
            engine: 'PersonaGenerationEngine',
            attempt,
            model,
            count: parsedPersonas.data.personas.length,
          });

          return parsedPersonas.data;
        }
      }

      logger.warn('Persona generation validation rejected output', {
        engine: 'PersonaGenerationEngine',
        attempt,
        validationFeedback,
      });
    }

    const error = new Error(`Persona generation failed validation: ${validationFeedback}`);
    error.statusCode = 502;
    throw error;
  },
};
