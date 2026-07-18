import { Router } from 'express';
import { uploadImage } from '../controllers/upload.controller.js';
import { uploadImageMiddleware } from '../../../middlewares/uploadImage.js';

const router = Router();

router.post('/uploads/images', uploadImageMiddleware, uploadImage);

export default router;
