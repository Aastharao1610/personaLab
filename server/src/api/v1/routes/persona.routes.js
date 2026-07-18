import { Router } from 'express';
import { generatePersonas } from '../controllers/persona.controller.js';

const router = Router();

router.post('/personas', generatePersonas);

export default router;
