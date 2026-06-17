import { z } from 'zod';
import { MODERATION_CATEGORY_VALUES } from '../common/constants/moderation.constants';
import { CLASSIFICATION_VALUES } from './moderation.constants';

export const categoryModerationResultSchema = z.object({
  category: z.enum(MODERATION_CATEGORY_VALUES),
  classification: z.enum(CLASSIFICATION_VALUES),
  confidenceScore: z.number().min(0).max(100),
  reasoning: z.string().min(1),
});

export const moderationResponseSchema = z.object({
  results: z.array(categoryModerationResultSchema).min(1),
});

export type CategoryModerationResult = z.infer<
  typeof categoryModerationResultSchema
>;

export type ModerationResponse = z.infer<typeof moderationResponseSchema>;
