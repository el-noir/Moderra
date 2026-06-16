export const MODERATION_CATEGORIES = {
  GRAPHIC_VIOLENCE: 'Graphic Violence',
  HATE_SYMBOLS: 'Hate Symbols',
  SELF_HARM: 'Self-Harm',
  EXTREMIST_PROPAGANDA: 'Extremist Propaganda',
  WEAPONS_CONTRABAND: 'Weapons & Contraband',
  HARASSMENT_HUMILIATION: 'Harassment & Humiliation',
} as const;

export type ModerationCategoryName =
  (typeof MODERATION_CATEGORIES)[keyof typeof MODERATION_CATEGORIES];

export const MODERATION_CATEGORY_VALUES = Object.values(MODERATION_CATEGORIES);

export const ENFORCEMENT_MODES = {
  AUTO_BLOCK: 'auto_block',
  FLAG_FOR_REVIEW: 'flag_for_review',
} as const;

export type EnforcementMode =
  (typeof ENFORCEMENT_MODES)[keyof typeof ENFORCEMENT_MODES];

export const ENFORCEMENT_MODE_VALUES = Object.values(ENFORCEMENT_MODES);
