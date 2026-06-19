import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ImageVerdict, ImageVerdictDocument } from './schemas/image-verdict.schema';
import { OverrideVerdictDto } from './dto/override-verdict.dto';
import { GetVerdictsDto } from './dto/get-verdicts.dto';

// ─── Response shape ───────────────────────────────────────────────────────────

export interface VerdictOverrideResponse {
  isOverridden: boolean;
  by: string;
  reason: string;
  at: Date;
}

export interface CategoryResultResponse {
  category: string;
  classification: string;
  confidenceScore: number;
  reasoning: string;
}

export interface AdminVerdictResponse {
  id: string;
  submissionId: string;
  userId: string;
  imagePath: string;
  originalFilename: string;
  outcome: string;
  categoryResults: CategoryResultResponse[];
  processingError: string | null;
  override: VerdictOverrideResponse | null;
  createdAt: Date;
}

function toAdminVerdictResponse(doc: ImageVerdictDocument): AdminVerdictResponse {
  return {
    id: doc._id.toString(),
    submissionId: doc.submissionId.toString(),
    userId: doc.userId.toString(),
    imagePath: doc.imagePath,
    originalFilename: doc.originalFilename,
    outcome: doc.outcome,
    categoryResults: doc.categoryResults.map((c) => ({
      category: c.category,
      classification: c.classification,
      confidenceScore: c.confidenceScore,
      reasoning: c.reasoning,
    })),
    processingError: doc.processingError,
    override: doc.override
      ? {
          isOverridden: doc.override.isOverridden,
          by: doc.override.by.toString(),
          reason: doc.override.reason,
          at: doc.override.at,
        }
      : null,
    createdAt: doc.createdAt,
  };
}

// ─── Service ──────────────────────────────────────────────────────────────────

@Injectable()
export class VerdictsService {
  constructor(
    @InjectModel(ImageVerdict.name)
    private readonly verdictModel: Model<ImageVerdictDocument>,
  ) {}

  async getVerdicts(query: GetVerdictsDto) {
    const { outcome, category, userId, dateFrom, dateTo, page = 1, limit = 20 } = query;

    const filter: any = {};

    if (outcome) {
      filter.outcome = outcome;
    }
    if (category) {
      filter['categoryResults.category'] = category;
    }
    if (userId && Types.ObjectId.isValid(userId)) {
      filter.userId = new Types.ObjectId(userId);
    }
    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) filter.createdAt.$gte = dateFrom;
      if (dateTo) filter.createdAt.$lte = dateTo;
    }

    const skip = (page - 1) * limit;

    const [docs, total] = await Promise.all([
      this.verdictModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.verdictModel.countDocuments(filter).exec(),
    ]);

    return {
      items: docs.map(toAdminVerdictResponse),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async overrideVerdict(
    verdictId: Types.ObjectId,
    adminId: Types.ObjectId,
    dto: OverrideVerdictDto,
  ): Promise<AdminVerdictResponse> {
    const verdict = await this.verdictModel.findById(verdictId);
    if (!verdict) {
      throw new NotFoundException(`ImageVerdict with ID ${verdictId} not found`);
    }

    verdict.outcome = dto.outcome;
    verdict.override = {
      isOverridden: true,
      by: adminId,
      reason: dto.reason,
      at: new Date(),
    };

    const saved = await verdict.save();
    return toAdminVerdictResponse(saved);
  }
}
