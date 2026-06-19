export type CategoryResult = {
  category: string;
  classification: string;
  confidenceScore: number;
  reasoning: string;
};

export type ImageVerdict = {
  id: string;
  imagePath: string;
  originalFilename: string;
  outcome: 'approved' | 'flagged' | 'blocked';
  categoryResults: CategoryResult[];
  processingError: string | null;
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
  outcome: string;
  imagePath: string;
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
