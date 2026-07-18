import { heatmapJsonSchema, heatmapResponseSchema } from '../schemas/heatmap.schema.js';
import { screenshotAnalysisSchema } from '../schemas/screenshotAnalysis.schema.js';
import { simulationResponseSchema } from '../schemas/simulation.schema.js';
import { generateGeminiContent } from './gemini.service.js';
import { parseGeminiJson } from './openaiJson.service.js';

const heatmapInstructions = [
  'You generate UX heatmap overlay data from screenshot analysis and persona simulation results.',
  'Return normalized coordinates from 0 to 1, where x and y are the top-left position relative to the screenshot, and width and height are relative dimensions.',
  'Generate regions for ignored CTAs, confusion, repeated clicks, dead ends, and exit points when evidence exists.',
  'Use the screenshot analysis to infer approximate visual locations such as hero, header navigation, forms, primary CTA, secondary CTA, and footer.',
  'Use simulation clicks, confusion, exit reasons, and purchase probability to set intensity.',
  'Return only JSON matching the supplied schema.',
  'Do not include markdown, explanations, comments, or extra keys.',
].join(' ');

const parseHeatmapInput = (input) => {
  const parsedAnalysis = screenshotAnalysisSchema.safeParse(input?.analysis);
  const parsedSimulations = simulationResponseSchema.safeParse({
    simulations: input?.simulations,
  });

  if (!parsedAnalysis.success || !parsedSimulations.success) {
    const error = new Error('Valid analysis JSON and simulation results are required');
    error.statusCode = 400;
    throw error;
  }

  return {
    analysis: parsedAnalysis.data,
    simulations: parsedSimulations.data.simulations,
  };
};

export const generateHeatmapData = async (input) => {
  const { analysis, simulations } = parseHeatmapInput(input);

  const { response } = await generateGeminiContent({
    contents: [
      {
        role: 'user',
        parts: [
          {
            text: JSON.stringify({
              task: 'Generate heatmap overlay data from these simulation results.',
              analysis,
              simulations,
            }),
          },
        ],
      },
    ],
    config: {
      systemInstruction: heatmapInstructions,
      responseMimeType: 'application/json',
      responseJsonSchema: heatmapJsonSchema,
    },
  }, { engine: 'HeatmapService' });

  const heatmap = parseGeminiJson(
    response,
    'Gemini returned an empty heatmap response',
    'Gemini returned invalid heatmap JSON',
  );

  const parsedHeatmap = heatmapResponseSchema.safeParse(heatmap);

  if (!parsedHeatmap.success) {
    const error = new Error('Gemini returned heatmap JSON that does not match the schema');
    error.statusCode = 502;
    throw error;
  }

  return parsedHeatmap.data;
};
