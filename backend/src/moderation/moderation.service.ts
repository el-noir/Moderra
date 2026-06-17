import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ModerationCategoryName } from '../common/constants/moderation.constants';
import { GroqVisionClient } from './groq-vision.client';
import { buildModerationPrompt } from './moderation.prompt';
import { CLASSIFICATIONS } from './moderation.constants';
import {
  CategoryModerationResult,
  moderationResponseSchema,
} from './moderation.schema';

@Injectable()
export class ModerationService {
  private readonly logger = new Logger(ModerationService.name);

  constructor(private readonly groqVisionClient: GroqVisionClient) {}

  async moderateImage(
    imageBuffer: Buffer,
    enabledCategories: ModerationCategoryName[],
    mimeType = 'image/jpeg',
  ): Promise<CategoryModerationResult[]> {
    const uniqueCategories = [...new Set(enabledCategories)];

    if (!uniqueCategories.length) {
      throw new BadRequestException(
        'At least one enabled moderation category is required.',
      );
    }

    const prompt = buildModerationPrompt(uniqueCategories);
    const rawResponse = await this.groqVisionClient.analyzeImage(
      imageBuffer,
      mimeType,
      prompt,
    );

    let parsedResponse: unknown;

    try {
      parsedResponse = JSON.parse(rawResponse);
    } catch {
      this.logger.error('Groq returned non-JSON moderation content');
      throw new InternalServerErrorException(
        'Moderation service returned invalid JSON',
      );
    }

    const validated = moderationResponseSchema.safeParse(parsedResponse);

    if (!validated.success) {
      this.logger.error('Groq moderation JSON failed schema validation');
      throw new InternalServerErrorException(
        'Moderation service returned an invalid structured response',
      );
    }

    this.assertCompleteEnabledCategoryCoverage(
      uniqueCategories,
      validated.data.results,
    );
    this.assertConsistentClassificationScores(validated.data.results);

    return validated.data.results;
  }

  private assertConsistentClassificationScores(
    results: CategoryModerationResult[],
  ): void {
    for (const result of results) {
      if (
        result.classification === CLASSIFICATIONS.NOT_DETECTED &&
        result.confidenceScore >= 50
      ) {
        this.logger.error(
          `Inconsistent moderation result for ${result.category}: not_detected with confidence ${result.confidenceScore}`,
        );
        throw new InternalServerErrorException(
          'Moderation service returned inconsistent category result',
        );
      }
    }
  }

  private assertCompleteEnabledCategoryCoverage(
    enabledCategories: ModerationCategoryName[],
    results: CategoryModerationResult[],
  ): void {
    const expected = new Set(enabledCategories);
    const received = new Set(results.map((result) => result.category));

    for (const category of expected) {
      if (!received.has(category)) {
        throw new InternalServerErrorException(
          `Moderation response missing category: ${category}`,
        );
      }
    }

    if (received.size !== expected.size) {
      throw new InternalServerErrorException(
        'Moderation response included unexpected categories',
      );
    }
  }
}
