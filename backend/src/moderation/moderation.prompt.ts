import { BadRequestException } from '@nestjs/common';
import { ModerationCategoryName } from '../common/constants/moderation.constants';
import { MODERATION_CATEGORY_DESCRIPTIONS } from './moderation.constants';

export function buildModerationPrompt(
  enabledCategories: ModerationCategoryName[],
): string {
  if (!enabledCategories.length) {
    throw new BadRequestException(
      'At least one enabled moderation category is required.',
    );
  }

  const categoryLines = enabledCategories
    .map(
      (category) =>
        `- ${category}: ${MODERATION_CATEGORY_DESCRIPTIONS[category]}`,
    )
    .join('\n');

  return [
    'You are an image content moderation classifier.',
    'Analyze the provided image ONLY for the categories listed below.',
    'Do not evaluate or mention categories that are not listed.',
    '',
    'Categories to evaluate:',
    categoryLines,
    '',
    'Confidence calibration anchors:',
    '- 0-30: no meaningful resemblance to the category',
    '- 30-70: ambiguous or partial resemblance',
    '- 70-100: clear, strong match',
    '',
    'confidenceScore must represent how likely the category\'s prohibited content is present in the image,',
    'independent of the classification label. If the content is not present, use classification',
    '"not_detected" AND a low confidenceScore (typically below 30). Never return not_detected with',
    'a high confidenceScore.',
    '',
    'Return JSON only, with exactly one result object per listed category.',
    'Use these exact category names and classification values.',
    '',
    'Required JSON shape:',
    '{',
    '  "results": [',
    '    {',
    '      "category": "<exact category name>",',
    '      "classification": "detected" | "not_detected",',
    '      "confidenceScore": <integer 0-100>,',
    '      "reasoning": "<brief explanation>"',
    '    }',
    '  ]',
    '}',
  ].join('\n');
}
