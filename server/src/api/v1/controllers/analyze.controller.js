import { analyzeScreenshot } from '../../../services/analyze.service.js';
import { removeTempFile } from '../../../services/tempFile.service.js';
import { captureWebsiteScreenshot } from '../../../services/websiteCapture.service.js';
import { logger } from '../../../utils/logger.js';

export const analyzeImage = async (request, response, next) => {
  try {
    if (!request.file) {
      const error = new Error('Image upload is required');
      error.statusCode = 400;
      throw error;
    }

    logger.info('Image received', {
      fileName: request.file.filename,
      originalName: request.file.originalname,
      mimeType: request.file.mimetype,
      size: request.file.size,
    });

    const analysis = await analyzeScreenshot(request.file);

    logger.info('Frontend response sent', {
      fileName: request.file.filename,
      pageIntent: analysis.pageIntent,
      productType: analysis.productType,
      industry: analysis.industry,
      confidence: analysis.confidence,
    });

    response.status(200).json(analysis);
  } catch (error) {
    next(error);
  } finally {
    await removeTempFile(request.file?.path);
  }
};

export const analyzeWebsiteUrl = async (request, response, next) => {
  let capturedFile;

  try {
    capturedFile = await captureWebsiteScreenshot(request.body?.url);

    logger.info('Website screenshot captured', {
      url: request.body?.url,
      fileName: capturedFile.filename,
      mimeType: capturedFile.mimetype,
      size: capturedFile.size,
    });

    const analysis = await analyzeScreenshot(capturedFile);

    logger.info('Frontend response sent', {
      fileName: capturedFile.filename,
      pageIntent: analysis.pageIntent,
      productType: analysis.productType,
      industry: analysis.industry,
      confidence: analysis.confidence,
      source: 'url',
    });

    response.status(200).json(analysis);
  } catch (error) {
    next(error);
  } finally {
    await removeTempFile(capturedFile?.path);
  }
};
