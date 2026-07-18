import multer from 'multer';

const allowedMimeTypes = new Set(['image/png', 'image/jpeg', 'image/webp']);

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 8 * 1024 * 1024,
    files: 1,
  },
  fileFilter(_request, file, callback) {
    if (allowedMimeTypes.has(file.mimetype)) {
      callback(null, true);
      return;
    }

    const error = new Error('Only PNG, JPEG, and WebP images are supported');
    error.statusCode = 415;
    callback(error);
  },
});

export const uploadImageMiddleware = upload.single('image');
