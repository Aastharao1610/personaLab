import { z } from 'zod';

const technicalSkillValues = ['Low', 'Medium', 'High'];

export const personasJsonSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['personas'],
  properties: {
    personas: {
      type: 'array',
      minItems: 6,
      maxItems: 8,
      items: {
        type: 'object',
        additionalProperties: false,
        required: [
          'id',
          'name',
          'age',
          'occupation',
          'country',
          'technicalSkill',
          'primaryGoal',
          'frustrations',
          'motivations',
          'buyingBehavior',
          'riskTolerance',
          'decisionStyle',
          'attentionSpan',
          'accessibilityNeeds',
          'devices',
          'internetQuality',
          'expectedJourney',
          'confidence',
        ],
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          age: { type: 'integer', minimum: 13, maximum: 100 },
          occupation: { type: 'string' },
          country: { type: 'string' },
          technicalSkill: {
            type: 'string',
            enum: technicalSkillValues,
          },
          primaryGoal: { type: 'string' },
          frustrations: {
            type: 'array',
            items: { type: 'string' },
          },
          motivations: {
            type: 'array',
            items: { type: 'string' },
          },
          buyingBehavior: { type: 'string' },
          riskTolerance: { type: 'string' },
          decisionStyle: { type: 'string' },
          attentionSpan: { type: 'string' },
          accessibilityNeeds: {
            type: 'array',
            items: { type: 'string' },
          },
          devices: {
            type: 'array',
            items: { type: 'string' },
          },
          internetQuality: { type: 'string' },
          expectedJourney: { type: 'string' },
          confidence: {
            type: 'number',
            minimum: 0,
            maximum: 1,
          },
        },
      },
    },
  },
};

export const personaSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  age: z.number().int().min(13).max(100),
  occupation: z.string().min(1),
  country: z.string().min(1),
  technicalSkill: z.enum(technicalSkillValues),
  primaryGoal: z.string().min(1),
  frustrations: z.array(z.string().min(1)).min(1),
  motivations: z.array(z.string().min(1)).min(1),
  buyingBehavior: z.string().min(1),
  riskTolerance: z.string().min(1),
  decisionStyle: z.string().min(1),
  attentionSpan: z.string().min(1),
  accessibilityNeeds: z.array(z.string()),
  devices: z.array(z.string().min(1)).min(1),
  internetQuality: z.string().min(1),
  expectedJourney: z.string().min(1),
  confidence: z.number().min(0).max(1),
});

export const personasResponseSchema = z.object({
  personas: z.array(personaSchema).min(6).max(8),
});
