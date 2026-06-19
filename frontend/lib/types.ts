export type CategoryResult = {
  category: string;
  classification: string;
  confidenceScore: number;
  reasoning: string;
};

export type VerdictOverride = {
  isOverridden: boolean;
  by: string;
  reason: string;
  at: string;
};

export type ImageVerdict = {
  id: string;
  imagePath: string;
  originalFilename: string;
  outcome: 'approved' | 'flagged' | 'blocked';
  categoryResults: CategoryResult[];
  processingError: string | null;
  override?: VerdictOverride | null;
  createdAt: string;
};

export type PolicyCategory = {
  name: string;
  enabled: boolean;
  confidenceThreshold: number;
  enforcement: 'auto_block' | 'flag_for_review';
};

export type PolicyVersion = {
  id: string;
  version: number;
  isActive: boolean;
  categories: PolicyCategory[];
  createdAt: string;
};

export type Submission = {
  id: string;
  createdAt: string;
  imageVerdicts: ImageVerdict[];
};

export type AuthUser = {
  id: string;
  email: string;
  role: string;
};

export type LoginResponse = {
  accessToken: string;
  user: AuthUser;
};

export type AppealVerdictSummary = {
  id: string;
  originalFilename: string;
  outcome: 'approved' | 'flagged' | 'blocked';
  imagePath: string;
  categoryResults?: CategoryResult[];
};

export type AppealUserSummary = {
  id: string;
  email: string;
};

export type Appeal = {
  id: string;
  imageVerdictId: string;
  userId: string;
  justification: string;
  status: 'pending' | 'accepted' | 'rejected';
  adminResponse: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdAt: string;
  imageVerdict?: AppealVerdictSummary;
  user?: AppealUserSummary;
};

export type AppealDecision = 'accepted' | 'rejected';

// ── Analytics ─────────────────────────────────────────────────────────────────

export type SubmissionOverTime = { date: string; count: number };

export type VerdictByOutcome = {
  approved: number;
  flagged: number;
  blocked: number;
};

export type VerdictByCategory = {
  category: string;
  detected: number;
  notDetected: number;
};

export type AppealStats = {
  total: number;
  pending: number;
  accepted: number;
  rejected: number;
  resolutionRate: number;
};

export type UserRankRow = { userId: string; email: string; count: number };

export type AnalyticsResponse = {
  submissionsOverTime: SubmissionOverTime[];
  verdictDistribution: {
    byOutcome: VerdictByOutcome;
    byCategory: VerdictByCategory[];
  };
  appealStats: AppealStats;
  userRankings: {
    bySubmissionCount: UserRankRow[];
    byViolationCount: UserRankRow[];
  };
};
