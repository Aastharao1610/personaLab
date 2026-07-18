import fs from 'node:fs/promises';
import {
  productUnderstandingJsonSchema,
  productUnderstandingSchema,
} from '../schemas/productUnderstanding.schema.js';
import { logger } from '../utils/logger.js';
import { AIProvider } from './AIProvider.js';
import { validateImageFile } from './imageValidation.service.js';
import { parseGeminiJson } from './openaiJson.service.js';

const productUnderstandingInstructions = [
  'You are Engine 1: Product Understanding for an AI product simulation platform.',
  'First classify the website intent visible in the screenshot as pageIntent.',
  'pageIntent must be exactly one of: ECOMMERCE, SAAS, PORTFOLIO, DEVELOPER_PROFILE, DOCUMENTATION, BLOG, LANDING_PAGE, MARKETPLACE, SOCIAL_PROFILE, DASHBOARD, NEWS, EDUCATION, OTHER.',
  'Use DEVELOPER_PROFILE for GitHub user profiles, contributor profiles, personal coding profiles, and pages centered on one developer.',
  'Use PORTFOLIO for personal/professional portfolio sites showcasing work and contact/resume paths.',
  'Use DOCUMENTATION for docs, API references, guides, SDK pages, and technical help centers.',
  'Use ECOMMERCE only when the visible page is primarily for browsing, buying, cart, checkout, or product purchase.',
  'Analyze only what is visible in the uploaded product screenshot.',
  'Infer the product type, industry, primary user goal, target audience, CTA structure, navigation, trust signals, forms, pricing visibility, checkout presence, and likely UX problems.',
  'Return only strict JSON matching the supplied schema.',
  'Do not include markdown, explanations, comments, or extra keys.',
  'Use empty arrays when no visible evidence exists.',
  'Use empty strings when a text field cannot be confidently inferred.',
  'Set confidence from 0 to 1 based on visual evidence quality.',
].join(' ');

const toInlineImageData = async (file) => {
  const imageBuffer = await fs.readFile(file.path);

  return {
    data: imageBuffer.toString('base64'),
    mimeType: file.mimetype,
  };
};

export const ProductUnderstandingEngine = {
  async analyzeScreenshot(file) {
    validateImageFile(file);

    const inlineImageData = await toInlineImageData(file);

    logger.info('Gemini request sent', {
      engine: 'ProductUnderstandingEngine',
      fileName: file.filename,
      mimeType: file.mimetype,
      size: file.size,
    });

    const { response, model } = await AIProvider.generateContent({
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: 'Analyze this uploaded screenshot for Engine 1: Product Understanding. Return only the strict JSON object.',
            },
            {
              inlineData: inlineImageData,
            },
          ],
        },
      ],
      config: {
        systemInstruction: productUnderstandingInstructions,
        responseMimeType: 'application/json',
        responseJsonSchema: productUnderstandingJsonSchema,
      },
    }, {
      engine: 'ProductUnderstandingEngine',
      fileName: file.filename,
    });

    logger.info('Gemini response received', {
      engine: 'ProductUnderstandingEngine',
      fileName: file.filename,
      model,
      responseTextLength: response.text?.length || 0,
    });

    const productUnderstanding = parseGeminiJson(
      response,
      'Gemini returned an empty product understanding response',
      'Gemini returned invalid product understanding JSON',
    );

    const parsedProductUnderstanding =
      productUnderstandingSchema.safeParse(productUnderstanding);

    if (!parsedProductUnderstanding.success) {
      const error = new Error(
        'Gemini returned product understanding JSON that does not match the schema',
      );
      error.statusCode = 502;
      throw error;
    }

    logger.info('JSON parsed', {
      engine: 'ProductUnderstandingEngine',
      fileName: file.filename,
      keys: Object.keys(parsedProductUnderstanding.data),
      pageIntent: parsedProductUnderstanding.data.pageIntent,
      confidence: parsedProductUnderstanding.data.confidence,
    });

    return parsedProductUnderstanding.data;
  },
};
