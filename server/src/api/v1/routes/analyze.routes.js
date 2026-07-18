import { Router } from 'express';
import { analyzeImage, analyzeWebsiteUrl } from '../controllers/analyze.controller.js';
import { analyzeUploadMiddleware } from '../../../middlewares/analyzeUpload.js';

const router = Router();

router.post('/analyze', analyzeUploadMiddleware, analyzeImage);
router.post('/analyze/url', analyzeWebsiteUrl);

export default router;
