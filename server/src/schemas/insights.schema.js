import { z } from 'zod';

export const recommendationValues = [
  'READY_TO_LAUNCH',
  'IMPROVE_BEFORE_LAUNCH',
  'HIGH_RISK',
];

export const insightsJsonSchema = {
  type: 'object',
  additionalProperties: false,
  required: [
    'launchScore',
    'recommendation',
    'strengths',
    'weaknesses',
    'frictionPoints',
    'personaSummary',
    'uxRecommendations',
  ],
  properties: {
    launchScore: { type: 'integer', minimum: 0, maximum: 100 },
    recommendation: { type: 'string', enum: recommendationValues },
    strengths: {
      type: 'array',
      items: { type: 'string' },
    },
    weaknesses: {
      type: 'array',
      items: { type: 'string' },
    },
    frictionPoints: {
      type: 'array',
      items: { type: 'string' },
    },
    personaSummary: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['personaId', 'personaName', 'outcome', 'confidence', 'summary'],
        properties: {
          personaId: { type: 'string' },
          personaName: { type: 'string' },
          outcome: { type: 'string' },
          confidence: { type: 'number', minimum: 0, maximum: 1 },
          summary: { type: 'string' },
        },
      },
    },
    uxRecommendations: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['priority', 'recommendation', 'rationale'],
        properties: {
          priority: { type: 'string', enum: ['High', 'Medium', 'Low'] },
          recommendation: { type: 'string' },
          rationale: { type: 'string' },
        },
      },
    },
  },
};

export const personaInsightSummarySchema = z.object({
  personaId: z.string().uuid(),
  personaName: z.string().min(1),
  outcome: z.string().min(1),
  confidence: z.number().min(0).max(1),
  summary: z.string().min(1),
});

export const uxRecommendationSchema = z.object({
  priority: z.enum(['High', 'Medium', 'Low']),
  recommendation: z.string().min(1),
  rationale: z.string().min(1),
});

export const insightsResponseSchema = z.object({
  launchScore: z.number().int().min(0).max(100),
  recommendation: z.enum(recommendationValues),
  strengths: z.array(z.string().min(1)),
  weaknesses: z.array(z.string().min(1)),
  frictionPoints: z.array(z.string().min(1)),
  personaSummary: z.array(personaInsightSummarySchema).min(1),
  uxRecommendations: z.array(uxRecommendationSchema).min(1),
});
