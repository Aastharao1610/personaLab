import { z } from 'zod';

export const screenshotAnalysisJsonSchema = {
  type: 'object',
  additionalProperties: false,
  required: [
    'layout',
    'buttons',
    'navigation',
    'forms',
    'trustSignals',
    'primaryCTA',
    'secondaryCTA',
    'businessType',
    'expectedUserGoal',
  ],
  properties: {
    layout: {
      type: 'object',
      additionalProperties: false,
      required: ['summary', 'visualHierarchy', 'density', 'issues'],
      properties: {
        summary: { type: 'string' },
        visualHierarchy: { type: 'string' },
        density: {
          type: 'string',
          enum: ['minimal', 'balanced', 'dense', 'unclear'],
        },
        issues: {
          type: 'array',
          items: { type: 'string' },
        },
      },
    },
    buttons: {
      type: 'object',
      additionalProperties: false,
      required: ['count', 'labels', 'observations'],
      properties: {
        count: { type: 'integer' },
        labels: {
          type: 'array',
          items: { type: 'string' },
        },
        observations: {
          type: 'array',
          items: { type: 'string' },
        },
      },
    },
    navigation: {
      type: 'object',
      additionalProperties: false,
      required: ['present', 'type', 'items', 'observations'],
      properties: {
        present: { type: 'boolean' },
        type: {
          type: 'string',
          enum: ['top', 'side', 'bottom', 'none', 'unclear'],
        },
        items: {
          type: 'array',
          items: { type: 'string' },
        },
        observations: {
          type: 'array',
          items: { type: 'string' },
        },
      },
    },
    forms: {
      type: 'object',
      additionalProperties: false,
      required: ['present', 'fields', 'observations'],
      properties: {
        present: { type: 'boolean' },
        fields: {
          type: 'array',
          items: { type: 'string' },
        },
        observations: {
          type: 'array',
          items: { type: 'string' },
        },
      },
    },
    trustSignals: {
      type: 'array',
      items: { type: 'string' },
    },
    primaryCTA: {
      type: 'object',
      additionalProperties: false,
      required: ['label', 'location', 'clarity'],
      properties: {
        label: { type: 'string' },
        location: { type: 'string' },
        clarity: {
          type: 'string',
          enum: ['clear', 'weak', 'missing', 'unclear'],
        },
      },
    },
    secondaryCTA: {
      type: 'object',
      additionalProperties: false,
      required: ['label', 'location', 'clarity'],
      properties: {
        label: { type: 'string' },
        location: { type: 'string' },
        clarity: {
          type: 'string',
          enum: ['clear', 'weak', 'missing', 'unclear'],
        },
      },
    },
    businessType: { type: 'string' },
    expectedUserGoal: { type: 'string' },
  },
};

export const screenshotAnalysisSchema = z.object({
  layout: z.object({
    summary: z.string(),
    visualHierarchy: z.string(),
    density: z.enum(['minimal', 'balanced', 'dense', 'unclear']),
    issues: z.array(z.string()),
  }),
  buttons: z.object({
    count: z.number().int(),
    labels: z.array(z.string()),
    observations: z.array(z.string()),
  }),
  navigation: z.object({
    present: z.boolean(),
    type: z.enum(['top', 'side', 'bottom', 'none', 'unclear']),
    items: z.array(z.string()),
    observations: z.array(z.string()),
  }),
  forms: z.object({
    present: z.boolean(),
    fields: z.array(z.string()),
    observations: z.array(z.string()),
  }),
  trustSignals: z.array(z.string()),
  primaryCTA: z.object({
    label: z.string(),
    location: z.string(),
    clarity: z.enum(['clear', 'weak', 'missing', 'unclear']),
  }),
  secondaryCTA: z.object({
    label: z.string(),
    location: z.string(),
    clarity: z.enum(['clear', 'weak', 'missing', 'unclear']),
  }),
  businessType: z.string(),
  expectedUserGoal: z.string(),
});
