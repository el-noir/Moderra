import { existsSync, readFileSync } from 'node:fs';
import { extname, resolve } from 'node:path';
import { NestFactory } from '@nestjs/core';
import { Module } from '@nestjs/common';
import {
  MODERATION_CATEGORY_VALUES,
  ModerationCategoryName,
} from '../common/constants/moderation.constants';
import { ModerationModule } from './moderation.module';
import { ModerationService } from './moderation.service';

const SUPPORTED_IMAGE_MIME_TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
};

@Module({
  imports: [ModerationModule],
})
class ModerationTestModule {}

function printUsage(): void {
  process.stdout.write(
    [
      'Usage: npm run moderation:test -- <image-path> [category1,category2,...]',
      '',
      'Examples:',
      '  npm run moderation:test -- ./sample.jpg',
      '  npm run moderation:test -- ./sample.png "Graphic Violence,Hate Symbols"',
      '',
    ].join('\n'),
  );
}

function resolveEnabledCategories(
  rawCategories: string | undefined,
): ModerationCategoryName[] {
  if (!rawCategories) {
    return [...MODERATION_CATEGORY_VALUES];
  }

  const requested = rawCategories
    .split(',')
    .map((category) => category.trim())
    .filter(Boolean);

  const invalid = requested.filter(
    (category) =>
      !MODERATION_CATEGORY_VALUES.includes(category as ModerationCategoryName),
  );

  if (invalid.length) {
    throw new Error(`Unknown categories: ${invalid.join(', ')}`);
  }

  return requested as ModerationCategoryName[];
}

function resolveMimeType(imagePath: string): string {
  const extension = extname(imagePath).toLowerCase();
  const mimeType = SUPPORTED_IMAGE_MIME_TYPES[extension];

  if (!mimeType) {
    throw new Error(
      `Unsupported image extension "${extension}". Use jpg, jpeg, png, webp, or gif.`,
    );
  }

  return mimeType;
}

async function bootstrap() {
  const imageArg = process.argv[2];
  const categoriesArg = process.argv[3];

  if (!imageArg) {
    printUsage();
    process.exit(1);
  }

  const imagePath = resolve(imageArg);

  if (!existsSync(imagePath)) {
    throw new Error(`Image file not found: ${imagePath}`);
  }

  const enabledCategories = resolveEnabledCategories(categoriesArg);
  const mimeType = resolveMimeType(imagePath);
  const imageBuffer = readFileSync(imagePath);

  const app = await NestFactory.createApplicationContext(ModerationTestModule, {
    logger: ['error', 'warn', 'log'],
  });

  try {
    const moderationService = app.get(ModerationService);
    const results = await moderationService.moderateImage(
      imageBuffer,
      enabledCategories,
      mimeType,
    );

    process.stdout.write(
      `${JSON.stringify({ results }, null, 2)}\n`,
    );
  } finally {
    await app.close();
  }
}

bootstrap().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'Unknown moderation test error';
  process.stderr.write(`${message}\n`);
  process.exit(1);
});
