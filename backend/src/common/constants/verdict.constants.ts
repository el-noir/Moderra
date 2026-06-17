export const VERDICT_OUTCOMES = {
  APPROVED: 'approved',
  FLAGGED: 'flagged',
  BLOCKED: 'blocked',
} as const;

export type VerdictOutcome =
  (typeof VERDICT_OUTCOMES)[keyof typeof VERDICT_OUTCOMES];

export const VERDICT_OUTCOME_VALUES = Object.values(VERDICT_OUTCOMES);
