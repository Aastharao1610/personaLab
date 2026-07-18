import { Router } from 'express';
import { generateHeatmap } from '../controllers/heatmap.controller.js';

const router = Router();

router.post('/heatmap', generateHeatmap);

export default router;
