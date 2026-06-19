import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { MongoServerError } from 'mongodb';
import { Model, Types } from 'mongoose';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import {
  APPEAL_DECISIONS,
  APPEAL_STATUSES,
} from '../common/constants/appeal.constants';
import { VERDICT_OUTCOMES } from '../common/constants/verdict.constants';
import { User, UserDocument } from '../users/schemas/user.schema';
import {
  ImageVerdict,
  ImageVerdictDocument,
} from '../verdicts/schemas/image-verdict.schema';
import { AppealResponseDto, toAppealResponse } from './dto/appeal-response.dto';
import { CreateAppealDto } from './dto/create-appeal.dto';
import { ListAdminAppealsQueryDto } from './dto/list-admin-appeals.query.dto';
import { ResolveAppealDto } from './dto/resolve-appeal.dto';
import { Appeal, AppealDocument } from './schemas/appeal.schema';

const PENDING_APPEAL_EXISTS_MESSAGE =
  'A pending appeal already exists for this verdict';
const APPEAL_NOT_APPEALABLE_MESSAGE =
  'Only flagged or blocked verdicts can be appealed';
const APPEAL_ALREADY_RESOLVED_MESSAGE = 'This appeal has already been resolved';

@Injectable()
export class AppealsService {
  constructor(
    @InjectModel(Appeal.name)
    private readonly appealModel: Model<AppealDocument>,
    @InjectModel(ImageVerdict.name)
    private readonly imageVerdictModel: Model<ImageVerdictDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  async createAppeal(
    user: AuthenticatedUser,
    dto: CreateAppealDto,
  ): Promise<AppealResponseDto> {
    const imageVerdictId = new Types.ObjectId(dto.imageVerdictId);
    const verdict = await this.imageVerdictModel.findById(imageVerdictId).exec();

    if (!verdict || verdict.userId.toString() !== user.userId) {
      throw new NotFoundException('Image verdict not found');
    }

    if (verdict.outcome === VERDICT_OUTCOMES.APPROVED) {
      throw new BadRequestException(APPEAL_NOT_APPEALABLE_MESSAGE);
    }

    const existingPending = await this.appealModel
      .findOne({
        imageVerdictId,
        status: APPEAL_STATUSES.PENDING,
      })
      .exec();

    if (existingPending) {
      throw new ConflictException(PENDING_APPEAL_EXISTS_MESSAGE);
    }

    let appeal: AppealDocument;

    try {
      appeal = await this.appealModel.create({
        imageVerdictId,
        userId: new Types.ObjectId(user.userId),
        justification: dto.justification.trim(),
        status: APPEAL_STATUSES.PENDING,
        adminResponse: null,
        reviewedBy: null,
        reviewedAt: null,
      });
    } catch (error) {
      if (error instanceof MongoServerError && error.code === 11000) {
        throw new ConflictException(PENDING_APPEAL_EXISTS_MESSAGE);
      }

      throw error;
    }

    await this.imageVerdictModel
      .updateOne({ _id: imageVerdictId }, { appealId: appeal._id })
      .exec();

    return toAppealResponse(appeal, { imageVerdict: verdict });
  }

  async listMyAppeals(user: AuthenticatedUser): Promise<AppealResponseDto[]> {
    const appeals = await this.appealModel
      .find({ userId: new Types.ObjectId(user.userId) })
      .sort({ createdAt: -1 })
      .exec();

    return this.populateAppealResponses(appeals);
  }

  async listAdminAppeals(
    query: ListAdminAppealsQueryDto,
  ): Promise<AppealResponseDto[]> {
    const appealFilter: Record<string, unknown> = {};

    if (query.status && query.status !== 'all') {
      appealFilter.status = query.status;
    } else if (!query.status) {
      appealFilter.status = APPEAL_STATUSES.PENDING;
    }

    if (query.dateFrom || query.dateTo) {
      const createdAt: { $gte?: Date; $lte?: Date } = {};
      if (query.dateFrom) createdAt.$gte = new Date(query.dateFrom);
      if (query.dateTo) createdAt.$lte = new Date(query.dateTo);
      appealFilter.createdAt = createdAt;
    }

    if (query.email) {
      const matchingUsers = await this.userModel
        .find({ email: { $regex: query.email, $options: 'i' } })
        .select('_id')
        .exec();
      const userIds = matchingUsers.map((u) => u._id);
      appealFilter.userId = { $in: userIds };
    }

    const appeals = await this.appealModel
      .find(appealFilter)
      .sort({ createdAt: 1 })
      .exec();

    return this.populateAppealResponses(appeals, { includeUser: true });
  }

  async resolveAppeal(
    admin: AuthenticatedUser,
    appealId: Types.ObjectId,
    dto: ResolveAppealDto,
  ): Promise<AppealResponseDto> {
    const appeal = await this.appealModel.findById(appealId).exec();

    if (!appeal) {
      throw new NotFoundException('Appeal not found');
    }

    if (appeal.status !== APPEAL_STATUSES.PENDING) {
      throw new BadRequestException(APPEAL_ALREADY_RESOLVED_MESSAGE);
    }

    const verdict = await this.imageVerdictModel
      .findById(appeal.imageVerdictId)
      .exec();

    if (!verdict) {
      throw new NotFoundException('Linked image verdict not found');
    }

    const reviewedAt = new Date();
    const adminResponse = dto.adminResponse?.trim() || null;
    const adminId = new Types.ObjectId(admin.userId);

    if (dto.decision === APPEAL_DECISIONS.ACCEPTED) {
      const overrideReason =
        adminResponse ?? 'Appeal accepted — verdict overridden to approved';

      await this.imageVerdictModel
        .updateOne(
          { _id: verdict._id },
          {
            outcome: VERDICT_OUTCOMES.APPROVED,
            override: {
              isOverridden: true,
              by: adminId,
              reason: overrideReason,
              at: reviewedAt,
            },
          },
        )
        .exec();

      appeal.status = APPEAL_STATUSES.ACCEPTED;
    } else {
      appeal.status = APPEAL_STATUSES.REJECTED;
    }

    appeal.adminResponse = adminResponse;
    appeal.reviewedBy = adminId;
    appeal.reviewedAt = reviewedAt;
    await appeal.save();

    const updatedVerdict = await this.imageVerdictModel
      .findById(verdict._id)
      .exec();
    const user = await this.userModel.findById(appeal.userId).exec();

    return toAppealResponse(appeal, {
      imageVerdict: updatedVerdict ?? verdict,
      user: user ?? undefined,
    });
  }

  private async populateAppealResponses(
    appeals: AppealDocument[],
    options?: { includeUser?: boolean },
  ): Promise<AppealResponseDto[]> {
    if (!appeals.length) {
      return [];
    }

    const verdictIds = appeals.map((appeal) => appeal.imageVerdictId);
    const verdicts = await this.imageVerdictModel
      .find({ _id: { $in: verdictIds } })
      .exec();
    const verdictById = new Map(
      verdicts.map((verdict) => [verdict._id.toString(), verdict]),
    );

    let userById = new Map<string, UserDocument>();

    if (options?.includeUser) {
      const userIds = [...new Set(appeals.map((appeal) => appeal.userId.toString()))];
      const users = await this.userModel
        .find({ _id: { $in: userIds.map((id) => new Types.ObjectId(id)) } })
        .exec();
      userById = new Map(users.map((entry) => [entry._id.toString(), entry]));
    }

    return appeals.map((appeal) =>
      toAppealResponse(appeal, {
        imageVerdict: verdictById.get(appeal.imageVerdictId.toString()),
        user: options?.includeUser
          ? userById.get(appeal.userId.toString())
          : undefined,
      }),
    );
  }
}
