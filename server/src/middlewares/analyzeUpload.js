import path from 'node:path';
import crypto from 'node:crypto';
import multer from 'multer';
import {
  ALLOWED_IMAGE_MIME_TYPES,
  MAX_IMAGE_SIZE_BYTES,
} from '../constants/imageUpload.js';
import { ensureTempUploadDirectory, tempUploadDirectory } from '../services/tempFile.service.js';

const extensionByMimeType = {
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/webp': '.webp',
};

const storage = multer.diskStorage({
  async destination(_request, _file, callback) {
    try {
      const directory = await ensureTempUploadDirectory();
      callback(null, directory);
    } catch (error) {
      callback(error);
    }
  },
  filename(_request, file, callback) {
    const extension =
      extensionByMimeType[file.mimetype] || path.extname(file.originalname);
    const filename = `${crypto.randomUUID()}${extension}`;
    callback(null, filename);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: MAX_IMAGE_SIZE_BYTES,
    files: 1,
  },
  fileFilter(_request, file, callback) {
    if (ALLOWED_IMAGE_MIME_TYPES.has(file.mimetype)) {
      callback(null, true);
      return;
    }

    const error = new Error('Only PNG, JPEG, and WebP images are supported');
    error.statusCode = 415;
    callback(error);
  },
});

export const analyzeUploadMiddleware = upload.single('image');
export { tempUploadDirectory };
