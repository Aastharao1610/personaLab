import { Router } from 'express';
import { generateProductInsights } from '../controllers/insights.controller.js';

const router = Router();

router.post('/insights', generateProductInsights);

export default router;
