import { ConfigService } from '@nestjs/config';
import { diskStorage } from 'multer';
import { extname, join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { existsSync, mkdirSync } from 'node:fs';

export const MAX_IMAGE_UPLOAD_BYTES = 5 * 1024 * 1024;
export const MAX_IMAGES_PER_SUBMISSION = 10;

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);

const ALLOWED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);

export function createSubmissionUploadOptions(configService: ConfigService) {
  const uploadDir = configService.get<string>('uploadDir') ?? './uploads';

  if (!existsSync(uploadDir)) {
    mkdirSync(uploadDir, { recursive: true });
  }

  return {
    storage: diskStorage({
      destination: uploadDir,
      filename: (_req: any, file: any, callback: any) => {
        const extension = extname(file.originalname).toLowerCase();

        if (!ALLOWED_EXTENSIONS.has(extension)) {
          callback(new Error('Unsupported image file type'), '');
          return;
        }

        callback(null, `${randomUUID()}${extension}`);
      },
    }),
    limits: {
      fileSize: MAX_IMAGE_UPLOAD_BYTES,
      files: MAX_IMAGES_PER_SUBMISSION,
    },
    fileFilter: (
      _req: any,
      file: any,
      callback: (error: Error | null, acceptFile: boolean) => void,
    ) => {
      if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
        callback(new Error('Only image uploads are allowed'), false);
        return;
      }

      callback(null, true);
    },
  };
}

export function resolveStoredImagePath(
  uploadDir: string,
  storedFilename: string,
): string {
  return join(uploadDir, storedFilename);
}
