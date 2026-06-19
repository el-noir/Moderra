export const APPEAL_STATUSES = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
} as const;

export type AppealStatus =
  (typeof APPEAL_STATUSES)[keyof typeof APPEAL_STATUSES];

export const APPEAL_STATUS_VALUES = Object.values(APPEAL_STATUSES);

export const APPEAL_DECISIONS = {
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
} as const;

export type AppealDecision =
  (typeof APPEAL_DECISIONS)[keyof typeof APPEAL_DECISIONS];

export const APPEAL_DECISION_VALUES = Object.values(APPEAL_DECISIONS);
