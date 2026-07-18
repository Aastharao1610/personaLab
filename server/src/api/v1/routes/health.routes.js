import { Router } from 'express';
import { getAiHealth, getHealth } from '../controllers/health.controller.js';

const router = Router();

router.get('/health', getHealth);
router.get('/health/ai', getAiHealth);

export default router;
