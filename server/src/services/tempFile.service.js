import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const serverRoot = path.resolve(__dirname, '..', '..');

export const tempUploadDirectory = path.join(serverRoot, 'tmp', 'uploads');

export const ensureTempUploadDirectory = async () => {
  await fs.mkdir(tempUploadDirectory, { recursive: true });
  return tempUploadDirectory;
};

export const removeTempFile = async (filePath) => {
  if (!filePath) return;

  await fs.rm(filePath, { force: true });
};
