import fs from 'node:fs/promises';
import {
  screenshotAnalysisJsonSchema,
  screenshotAnalysisSchema,
} from '../schemas/screenshotAnalysis.schema.js';
import { generateGeminiContent } from './gemini.service.js';
import { validateImageFile } from './imageValidation.service.js';
import { parseGeminiJson } from './openaiJson.service.js';

const analysisInstructions = [
  'Analyze the uploaded screenshot as a conversion and product UX reviewer.',
  'Identify the layout, buttons, navigation, forms, trust signals, primary CTA, secondary CTA, business type, and expected user goal.',
  'Return only JSON that matches the provided schema.',
  'Do not include markdown, prose, comments, or extra keys.',
  'If a requested item is not visible, use empty arrays and values such as "missing", "none", or "unclear" where allowed.',
].join(' ');

const toInlineImageData = async (file) => {
  const imageBuffer = await fs.readFile(file.path);
  return {
    data: imageBuffer.toString('base64'),
    mimeType: file.mimetype,
  };
};

export const analyzeScreenshot = async (file) => {
  validateImageFile(file);

  const inlineImageData = await toInlineImageData(file);

  const { response } = await generateGeminiContent({
    contents: [
      {
        role: 'user',
        parts: [
          {
            text: 'Analyze this screenshot and return the strict JSON analysis.',
          },
          {
            inlineData: inlineImageData,
          },
        ],
      },
    ],
    config: {
      systemInstruction: analysisInstructions,
      responseMimeType: 'application/json',
      responseJsonSchema: screenshotAnalysisJsonSchema,
    },
  }, { engine: 'ScreenshotAnalysisService', fileName: file.filename });

  const analysis = parseGeminiJson(
    response,
    'Gemini returned an empty analysis response',
    'Gemini returned invalid JSON',
  );

  const parsedAnalysis = screenshotAnalysisSchema.safeParse(analysis);

  if (!parsedAnalysis.success) {
    const error = new Error('Gemini returned analysis JSON that does not match the schema');
    error.statusCode = 502;
    throw error;
  }

  return parsedAnalysis.data;
};
