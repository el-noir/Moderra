import { AppealDocument } from '../schemas/appeal.schema';
import { ImageVerdictDocument } from '../../verdicts/schemas/image-verdict.schema';
import { UserDocument } from '../../users/schemas/user.schema';

export class AppealVerdictSummaryDto {
  id: string;
  originalFilename: string;
  outcome: string;
  imagePath: string;
}

export class AppealUserSummaryDto {
  id: string;
  email: string;
}

export class AppealResponseDto {
  id: string;
  imageVerdictId: string;
  userId: string;
  justification: string;
  status: string;
  adminResponse: string | null;
  reviewedBy: string | null;
  reviewedAt: Date | null;
  createdAt: Date;
  imageVerdict?: AppealVerdictSummaryDto;
  user?: AppealUserSummaryDto;
}

export function toAppealVerdictSummary(
  verdict: ImageVerdictDocument,
): AppealVerdictSummaryDto {
  return {
    id: verdict._id.toString(),
    originalFilename: verdict.originalFilename,
    outcome: verdict.outcome,
    imagePath: verdict.imagePath,
  };
}

export function toAppealUserSummary(user: UserDocument): AppealUserSummaryDto {
  return {
    id: user._id.toString(),
    email: user.email,
  };
}

export function toAppealResponse(
  appeal: AppealDocument,
  extras?: {
    imageVerdict?: ImageVerdictDocument;
    user?: UserDocument;
  },
): AppealResponseDto {
  const response: AppealResponseDto = {
    id: appeal._id.toString(),
    imageVerdictId: appeal.imageVerdictId.toString(),
    userId: appeal.userId.toString(),
    justification: appeal.justification,
    status: appeal.status,
    adminResponse: appeal.adminResponse,
    reviewedBy: appeal.reviewedBy?.toString() ?? null,
    reviewedAt: appeal.reviewedAt,
    createdAt: appeal.createdAt,
  };

  if (extras?.imageVerdict) {
    response.imageVerdict = toAppealVerdictSummary(extras.imageVerdict);
  }

  if (extras?.user) {
    response.user = toAppealUserSummary(extras.user);
  }

  return response;
}
