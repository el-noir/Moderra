import { ImageVerdictDocument } from '../../verdicts/schemas/image-verdict.schema';
import { SubmissionDocument } from '../schemas/submission.schema';

export class CategoryResultResponseDto {
  category: string;
  classification: string;
  confidenceScore: number;
  reasoning: string;
}

export class ImageVerdictResponseDto {
  id: string;
  imagePath: string;
  originalFilename: string;
  outcome: string;
  categoryResults: CategoryResultResponseDto[];
  processingError: string | null;
  createdAt: Date;
}

export class SubmissionResponseDto {
  id: string;
  createdAt: Date;
  imageVerdicts: ImageVerdictResponseDto[];
}

function toCategoryResultResponse(
  result: ImageVerdictDocument['categoryResults'][number],
): CategoryResultResponseDto {
  return {
    category: result.category,
    classification: result.classification,
    confidenceScore: result.confidenceScore,
    reasoning: result.reasoning,
  };
}

export function toImageVerdictResponse(
  verdict: ImageVerdictDocument,
): ImageVerdictResponseDto {
  return {
    id: verdict._id.toString(),
    imagePath: verdict.imagePath,
    originalFilename: verdict.originalFilename,
    outcome: verdict.outcome,
    categoryResults: verdict.categoryResults.map(toCategoryResultResponse),
    processingError: verdict.processingError,
    createdAt: verdict.createdAt,
  };
}

export function toSubmissionResponse(
  submission: SubmissionDocument,
  verdicts: ImageVerdictDocument[],
): SubmissionResponseDto {
  return {
    id: submission._id.toString(),
    createdAt: submission.createdAt,
    imageVerdicts: verdicts.map(toImageVerdictResponse),
  };
}
