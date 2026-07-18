import { z } from 'zod';

const heatmapTypes = [
  'ignored_cta',
  'confusion',
  'repeated_click',
  'dead_end',
  'exit_point',
];

export const heatmapJsonSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['heatmap'],
  properties: {
    heatmap: {
      type: 'object',
      additionalProperties: false,
      required: ['summary', 'regions'],
      properties: {
        summary: { type: 'string' },
        regions: {
          type: 'array',
          items: {
            type: 'object',
            additionalProperties: false,
            required: [
              'id',
              'type',
              'label',
              'x',
              'y',
              'width',
              'height',
              'intensity',
              'evidence',
            ],
            properties: {
              id: { type: 'string' },
              type: {
                type: 'string',
                enum: heatmapTypes,
              },
              label: { type: 'string' },
              x: {
                type: 'number',
                minimum: 0,
                maximum: 1,
              },
              y: {
                type: 'number',
                minimum: 0,
                maximum: 1,
              },
              width: {
                type: 'number',
                minimum: 0.03,
                maximum: 1,
              },
              height: {
                type: 'number',
                minimum: 0.03,
                maximum: 1,
              },
              intensity: {
                type: 'number',
                minimum: 0,
                maximum: 1,
              },
              evidence: { type: 'string' },
            },
          },
        },
      },
    },
  },
};

const heatmapRegionSchema = z.object({
  id: z.string(),
  type: z.enum(heatmapTypes),
  label: z.string(),
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
  width: z.number().min(0.03).max(1),
  height: z.number().min(0.03).max(1),
  intensity: z.number().min(0).max(1),
  evidence: z.string(),
});

export const heatmapResponseSchema = z.object({
  heatmap: z.object({
    summary: z.string(),
    regions: z.array(heatmapRegionSchema).min(1),
  }),
});
