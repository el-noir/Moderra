import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model, Types } from 'mongoose';
import {
  PolicyVersion,
  PolicyVersionDocument,
} from './schemas/policy-version.schema';
import {
  assertCompleteCategoryCoverage,
  PolicyCategoryInputDto,
} from './dto/update-policy.dto';
import {
  mapCategoryInputs,
  toAdminPolicyResponse,
  toEnabledCategoriesResponse,
  toPolicyVersionResponse,
} from './policy.mapper';
import {
  AdminPolicyResponseDto,
  EnabledCategoriesResponseDto,
  PolicyVersionResponseDto,
} from './dto/policy-response.dto';

@Injectable()
export class PolicyService {
  constructor(
    @InjectModel(PolicyVersion.name)
    private readonly policyVersionModel: Model<PolicyVersionDocument>,
  ) {}

  async getEnabledCategoryNames(): Promise<EnabledCategoriesResponseDto> {
    const activePolicy = await this.findActivePolicy();

    if (!activePolicy) {
      throw new NotFoundException('No active policy version found');
    }

    return toEnabledCategoriesResponse(activePolicy.categories);
  }

  async getAdminPolicyView(): Promise<AdminPolicyResponseDto> {
    const activePolicy = await this.findActivePolicy();

    if (!activePolicy) {
      throw new NotFoundException('No active policy version found');
    }

    const history = await this.policyVersionModel
      .find({ _id: { $ne: activePolicy._id } })
      .sort({ version: -1 })
      .exec();

    return toAdminPolicyResponse(activePolicy, history);
  }

  async publishNewVersion(
    createdBy: Types.ObjectId,
    categoryInputs: PolicyCategoryInputDto[],
  ): Promise<PolicyVersionResponseDto> {
    assertCompleteCategoryCoverage(categoryInputs);

    const categories = mapCategoryInputs(categoryInputs);
    const session = await this.policyVersionModel.db.startSession();

    try {
      let createdPolicy: PolicyVersionDocument;

      await session.withTransaction(async () => {
        const nextVersion = await this.getNextVersionNumber(session);
        await this.deactivateActiveVersions(session);
        createdPolicy = await this.insertPolicyVersion(
          {
            version: nextVersion,
            isActive: true,
            createdBy,
            categories,
          },
          session,
        );
      });

      return toPolicyVersionResponse(createdPolicy!);
    } finally {
      await session.endSession();
    }
  }

  findByVersion(version: number): Promise<PolicyVersionDocument | null> {
    return this.policyVersionModel.findOne({ version }).exec();
  }

  /**
   * Seed-only insert. Runtime policy changes must go through publishNewVersion().
   */
  async createInitialVersion(
    data: Pick<PolicyVersion, 'version' | 'isActive' | 'createdBy' | 'categories'>,
  ): Promise<PolicyVersionDocument> {
    return this.insertPolicyVersion(data);
  }

  private async findActivePolicy(): Promise<PolicyVersionDocument | null> {
    return this.policyVersionModel.findOne({ isActive: true }).exec();
  }

  private async getNextVersionNumber(session: ClientSession): Promise<number> {
    const latestPolicy = await this.policyVersionModel
      .findOne()
      .sort({ version: -1 })
      .session(session)
      .exec();

    return (latestPolicy?.version ?? 0) + 1;
  }

  /**
   * The only permitted mutation on existing PolicyVersion documents: flip isActive to false.
   * Immutable fields are protected by schema middleware in policy-version.immutability.ts.
   */
  private async deactivateActiveVersions(session: ClientSession): Promise<void> {
    await this.policyVersionModel.updateMany(
      { isActive: true },
      { $set: { isActive: false } },
      { session },
    );
  }

  /** Insert-only path for policy configuration. No findByIdAndUpdate / save-on-existing. */
  private async insertPolicyVersion(
    data: Pick<PolicyVersion, 'version' | 'isActive' | 'createdBy' | 'categories'>,
    session?: ClientSession,
  ): Promise<PolicyVersionDocument> {
    const [createdPolicy] = await this.policyVersionModel.create([data], { session });
    return createdPolicy;
  }
}
