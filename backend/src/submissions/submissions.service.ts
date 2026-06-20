import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { Model, Types } from 'mongoose';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { USER_ROLES } from '../common/constants/user.constants';
import { VERDICT_OUTCOMES } from '../common/constants/verdict.constants';
import { ModerationService } from '../moderation/moderation.service';
import {
  buildPolicySnapshot,
  getEnabledCategoryNames,
} from '../policy/policy.helpers';
import { PolicyService } from '../policy/policy.service';
import { PolicyVersionDocument } from '../policy/schemas/policy-version.schema';
import { computeOutcome } from '../verdicts/compute-outcome';
import {
  ImageVerdict,
  ImageVerdictDocument,
} from '../verdicts/schemas/image-verdict.schema';
import { ListSubmissionsQueryDto } from './dto/list-submissions.query.dto';
import {
  SubmissionResponseDto,
  toSubmissionResponse,
} from './dto/submission-response.dto';
import { Submission, SubmissionDocument } from './schemas/submission.schema';
import { resolveStoredImagePath } from './config/submission-upload.config';

const MODERATION_FAILURE_MESSAGE = 'moderation service unavailable';

@Injectable()
export class SubmissionsService {
  constructor(
    @InjectModel(Submission.name)
    private readonly submissionModel: Model<SubmissionDocument>,
    @InjectModel(ImageVerdict.name)
    private readonly imageVerdictModel: Model<ImageVerdictDocument>,
    private readonly policyService: PolicyService,
    private readonly moderationService: ModerationService,
    private readonly configService: ConfigService,
  ) {}

  async createSubmission(
    user: AuthenticatedUser,
    files: any[],
  ): Promise<SubmissionResponseDto> {
    if (!files?.length) {
      throw new BadRequestException('At least one image is required');
    }

    const activePolicy = await this.policyService.getActivePolicy();
    const policySnapshot = buildPolicySnapshot(activePolicy);
    const enabledCategories = getEnabledCategoryNames(activePolicy);

    if (!enabledCategories.length) {
      throw new BadRequestException(
        'No categories are enabled in the active policy',
      );
    }

    const submission = await this.submissionModel.create({
      userId: new Types.ObjectId(user.userId),
      imageVerdictIds: [],
    });

    const settledResults = await Promise.allSettled(
      files.map((file) =>
        this.processImage(
          file,
          submission._id,
          user.userId,
          activePolicy,
          policySnapshot,
          enabledCategories,
        ),
      ),
    );

    const verdictIds: Types.ObjectId[] = [];

    for (const result of settledResults) {
      if (result.status === 'fulfilled') {
        verdictIds.push(result.value._id);
        continue;
      }

      const fallbackVerdict = await this.createFailedVerdict(
        submission._id,
        user.userId,
        activePolicy,
        policySnapshot,
        MODERATION_FAILURE_MESSAGE,
      );
      verdictIds.push(fallbackVerdict._id);
    }

    submission.imageVerdictIds = verdictIds;
    await submission.save();

    const verdicts = await this.imageVerdictModel
      .find({ _id: { $in: verdictIds } })
      .sort({ createdAt: 1 })
      .exec();

    return toSubmissionResponse(submission, verdicts);
  }

  async listSubmissions(
    user: AuthenticatedUser,
    query: ListSubmissionsQueryDto,
  ): Promise<SubmissionResponseDto[]> {
    const submissionIds = await this.findMatchingSubmissionIds(user.userId, query);

    if (submissionIds.length === 0) {
      return [];
    }

    const submissions = await this.submissionModel
      .find({ _id: { $in: submissionIds }, userId: new Types.ObjectId(user.userId) })
      .sort({ createdAt: -1 })
      .exec();

    return this.populateSubmissionResponses(submissions);
  }

  async getSubmissionById(
    submissionId: Types.ObjectId,
    user: AuthenticatedUser,
  ): Promise<SubmissionResponseDto> {
    const submission = await this.submissionModel.findById(submissionId).exec();

    if (!submission) {
      throw new NotFoundException('Submission not found');
    }

    const isOwner = submission.userId.toString() === user.userId;
    const isAdmin = user.role === USER_ROLES.ADMIN;

    if (!isOwner && !isAdmin) {
      throw new NotFoundException('Submission not found');
    }

    const verdicts = await this.imageVerdictModel
      .find({ _id: { $in: submission.imageVerdictIds } })
      .sort({ createdAt: 1 })
      .exec();

    return toSubmissionResponse(submission, verdicts);
  }

  private async processImage(
    file: any,
    submissionId: Types.ObjectId,
    userId: string,
    activePolicy: PolicyVersionDocument,
    policySnapshot: ReturnType<typeof buildPolicySnapshot>,
    enabledCategories: ReturnType<typeof getEnabledCategoryNames>,
  ): Promise<ImageVerdictDocument> {
    const uploadDir = this.configService.get<string>('uploadDir') ?? './uploads';
    const storedFilename = file.filename;
    const imagePath = resolveStoredImagePath(uploadDir, storedFilename);

    try {
      const imageBuffer = await this.readFileFromDisk(file.path);

      const categoryResults = await this.moderationService.moderateImage(
        imageBuffer,
        enabledCategories,
        file.mimetype,
      );

      const outcome = computeOutcome(categoryResults, policySnapshot);

      return this.imageVerdictModel.create({
        submissionId,
        userId: new Types.ObjectId(userId),
        imagePath,
        originalFilename: file.originalname,
        outcome,
        categoryResults,
        policyVersionId: activePolicy._id,
        policySnapshot,
        processingError: null,
        override: null,
        appealId: null,
      });
    } catch {
      return this.createFailedVerdict(
        submissionId,
        userId,
        activePolicy,
        policySnapshot,
        MODERATION_FAILURE_MESSAGE,
        imagePath,
        file.originalname,
      );
    }
  }

  private async createFailedVerdict(
    submissionId: Types.ObjectId,
    userId: string,
    activePolicy: PolicyVersionDocument,
    policySnapshot: ReturnType<typeof buildPolicySnapshot>,
    processingError: string,
    imagePath = 'unknown',
    originalFilename = 'unknown',
  ): Promise<ImageVerdictDocument> {
    return this.imageVerdictModel.create({
      submissionId,
      userId: new Types.ObjectId(userId),
      imagePath,
      originalFilename,
      outcome: VERDICT_OUTCOMES.FLAGGED,
      categoryResults: [],
      policyVersionId: activePolicy._id,
      policySnapshot,
      processingError,
      override: null,
      appealId: null,
    });
  }

  private async readFileFromDisk(path: string): Promise<Buffer> {
    const { readFile } = await import('node:fs/promises');
    return readFile(path);
  }

  private async findMatchingSubmissionIds(
    userId: string,
    query: ListSubmissionsQueryDto,
  ): Promise<Types.ObjectId[]> {
    const submissionFilter: Record<string, unknown> = {
      userId: new Types.ObjectId(userId),
    };

    if (query.dateFrom || query.dateTo) {
      const createdAt: { $gte?: Date; $lte?: Date } = {};
      if (query.dateFrom) {
        createdAt.$gte = new Date(query.dateFrom);
      }
      if (query.dateTo) {
        createdAt.$lte = new Date(query.dateTo);
      }
      submissionFilter.createdAt = createdAt;
    }

    if (query.outcome || query.category) {
      const verdictFilter: Record<string, unknown> = {
        userId: new Types.ObjectId(userId),
      };

      if (query.outcome) {
        verdictFilter.outcome = query.outcome;
      }

      if (query.category) {
        verdictFilter['categoryResults.category'] = query.category;
      }

      if (query.dateFrom || query.dateTo) {
        verdictFilter.createdAt = submissionFilter.createdAt;
      }

      return this.imageVerdictModel.distinct('submissionId', verdictFilter).exec();
    }

    const submissions = await this.submissionModel.find(submissionFilter).select('_id').exec();
    return submissions.map((submission: any) => submission._id);
  }

  private async populateSubmissionResponses(
    submissions: SubmissionDocument[],
  ): Promise<SubmissionResponseDto[]> {
    const responses: SubmissionResponseDto[] = [];

    for (const submission of submissions) {
      const verdicts = await this.imageVerdictModel
        .find({ _id: { $in: submission.imageVerdictIds } })
        .sort({ createdAt: 1 })
        .exec();

      responses.push(toSubmissionResponse(submission, verdicts));
    }

    return responses;
  }
}
