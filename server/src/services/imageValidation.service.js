import {
  ALLOWED_IMAGE_MIME_TYPES,
  MAX_IMAGE_SIZE_BYTES,
} from '../constants/imageUpload.js';

export const validateImageFile = (file) => {
  if (!file) {
    const error = new Error('Image file is required');
    error.statusCode = 400;
    throw error;
  }

  if (!ALLOWED_IMAGE_MIME_TYPES.has(file.mimetype)) {
    const error = new Error('Only PNG, JPEG, and WebP images are supported');
    error.statusCode = 415;
    throw error;
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    const error = new Error('Image must be 8MB or smaller');
    error.statusCode = 413;
    throw error;
  }

  return true;
};
