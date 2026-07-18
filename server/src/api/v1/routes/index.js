import { Router } from 'express';
import analyzeRoutes from './analyze.routes.js';
import heatmapRoutes from './heatmap.routes.js';
import healthRoutes from './health.routes.js';
import insightsRoutes from './insights.routes.js';
import personaRoutes from './persona.routes.js';
import simulationRoutes from './simulation.routes.js';
import uploadRoutes from './upload.routes.js';

const router = Router();

router.use(analyzeRoutes);
router.use(heatmapRoutes);
router.use(healthRoutes);
router.use(insightsRoutes);
router.use(personaRoutes);
router.use(simulationRoutes);
router.use(uploadRoutes);

export default router;
