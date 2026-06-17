import { ModerationCategoryName } from '../common/constants/moderation.constants';

export const CLASSIFICATIONS = {
  DETECTED: 'detected',
  NOT_DETECTED: 'not_detected',
} as const;

export type Classification =
  (typeof CLASSIFICATIONS)[keyof typeof CLASSIFICATIONS];

export const CLASSIFICATION_VALUES = Object.values(CLASSIFICATIONS);

export const MODERATION_CATEGORY_DESCRIPTIONS: Record<
  ModerationCategoryName,
  string
> = {
  'Graphic Violence':
    'Depictions of physical harm, gore, or serious injury to humans or animals.',
  'Hate Symbols':
    'Imagery associated with extremist ideologies or designated terrorist organizations.',
  'Self-Harm':
    'Visual content depicting or glorifying acts of self-inflicted injury.',
  'Extremist Propaganda':
    'Content that promotes, recruits for, or glorifies violent extremist movements.',
  'Weapons & Contraband':
    'Imagery depicting illegal weapons, drug manufacturing, or trafficking-related content.',
  'Harassment & Humiliation':
    'Imagery intended to degrade, threaten, or publicly humiliate an identifiable individual.',
};

export const GROQ_API_BASE_URL = 'https://api.groq.com/openai/v1';
