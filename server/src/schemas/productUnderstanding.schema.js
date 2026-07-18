import { z } from 'zod';

export const pageIntentValues = [
  'ECOMMERCE',
  'SAAS',
  'PORTFOLIO',
  'DEVELOPER_PROFILE',
  'DOCUMENTATION',
  'BLOG',
  'LANDING_PAGE',
  'MARKETPLACE',
  'SOCIAL_PROFILE',
  'DASHBOARD',
  'NEWS',
  'EDUCATION',
  'OTHER',
];

const pageIntentSchema = z.preprocess((value) => {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  const normalizedValue = String(value)
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, '_');

  if (normalizedValue.includes('DEVELOPER_PROFILE')) {
    return 'DEVELOPER_PROFILE';
  }

  if (normalizedValue.includes('ECOMMERCE') || normalizedValue.includes('E_COMMERCE')) {
    return 'ECOMMERCE';
  }

  if (normalizedValue.includes('DOCUMENTATION')) {
    return 'DOCUMENTATION';
  }

  if (normalizedValue.includes('PORTFOLIO')) {
    return 'PORTFOLIO';
  }

  return normalizedValue;
}, z.enum(pageIntentValues).default('OTHER'));

export const productUnderstandingJsonSchema = {
  type: 'object',
  additionalProperties: false,
  required: [
    'pageIntent',
    'productType',
    'industry',
    'primaryGoal',
    'targetAudience',
    'mainCTA',
    'secondaryCTA',
    'navigationStructure',
    'trustSignals',
    'forms',
    'pricingVisible',
    'checkoutDetected',
    'potentialUXProblems',
    'confidence',
  ],
  properties: {
    pageIntent: { type: 'string', enum: pageIntentValues },
    productType: { type: 'string' },
    industry: { type: 'string' },
    primaryGoal: { type: 'string' },
    targetAudience: { type: 'string' },
    mainCTA: { type: 'string' },
    secondaryCTA: { type: 'string' },
    navigationStructure: {
      type: 'array',
      items: { type: 'string' },
    },
    trustSignals: {
      type: 'array',
      items: { type: 'string' },
    },
    forms: {
      type: 'array',
      items: { type: 'string' },
    },
    pricingVisible: { type: 'boolean' },
    checkoutDetected: { type: 'boolean' },
    potentialUXProblems: {
      type: 'array',
      items: { type: 'string' },
    },
    confidence: {
      type: 'number',
      minimum: 0,
      maximum: 1,
    },
  },
};

export const productUnderstandingSchema = z.object({
  pageIntent: pageIntentSchema,
  productType: z.string(),
  industry: z.string(),
  primaryGoal: z.string(),
  targetAudience: z.string(),
  mainCTA: z.string(),
  secondaryCTA: z.string(),
  navigationStructure: z.array(z.string()),
  trustSignals: z.array(z.string()),
  forms: z.array(z.string()),
  pricingVisible: z.boolean(),
  checkoutDetected: z.boolean(),
  potentialUXProblems: z.array(z.string()),
  confidence: z.number().min(0).max(1),
});
