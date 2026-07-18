import { Router } from 'express';
import { simulatePersonas } from '../controllers/simulation.controller.js';

const router = Router();

router.post('/simulations', simulatePersonas);

export default router;
