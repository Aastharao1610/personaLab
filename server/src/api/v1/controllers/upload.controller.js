export const uploadImage = (request, response) => {
  const { file } = request;

  if (!file) {
    response.status(400).json({ message: 'Image file is required' });
    return;
  }

  response.status(201).json({
    message: 'Image uploaded successfully',
    image: {
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
    },
  });
};
