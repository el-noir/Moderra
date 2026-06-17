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

export type LoginResponse = {
  accessToken: string;
  user: {
    id: string;
    email: string;
    role: string;
  };
};
