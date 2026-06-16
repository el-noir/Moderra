import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { Types } from 'mongoose';
import {
  ENFORCEMENT_MODES,
  MODERATION_CATEGORY_VALUES,
} from '../common/constants/moderation.constants';
import {
  PASSWORD_PATTERN,
  PASSWORD_VALIDATION_MESSAGE,
} from '../common/constants/password.constants';
import { USER_ROLES } from '../common/constants/user.constants';
import { PolicyService } from '../policy/policy.service';
import { UsersService } from '../users/users.service';

const BCRYPT_ROUNDS = 12;
const DEFAULT_POLICY_VERSION = 1;

@Injectable()
export class SeedService {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
    private readonly policyService: PolicyService,
  ) {}

  async run(): Promise<void> {
    const admin = await this.seedAdminUser();
    await this.seedDefaultPolicy(admin._id);
    this.logger.log('Seed completed');
  }

  private async seedAdminUser() {
    const email = this.configService.get<string>('seedAdminEmail')!;
    const password = this.configService.get<string>('seedAdminPassword')!;

    if (!PASSWORD_PATTERN.test(password) || password.length < 8) {
      throw new Error(PASSWORD_VALIDATION_MESSAGE);
    }

    const existingAdmin = await this.usersService.findByEmail(email);

    if (existingAdmin) {
      this.logger.log(`Admin user already exists: ${email}`);
      return existingAdmin;
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const admin = await this.usersService.create(
      email,
      passwordHash,
      USER_ROLES.ADMIN,
    );

    this.logger.log(`Created admin user: ${email}`);
    return admin;
  }

  private async seedDefaultPolicy(adminId: Types.ObjectId) {
    const existingPolicy = await this.policyService.findByVersion(
      DEFAULT_POLICY_VERSION,
    );

    if (existingPolicy) {
      this.logger.log(`Policy version ${DEFAULT_POLICY_VERSION} already exists`);
      return existingPolicy;
    }

    const categories = MODERATION_CATEGORY_VALUES.map((name) => ({
      name,
      enabled: true,
      confidenceThreshold: 70,
      enforcement: ENFORCEMENT_MODES.FLAG_FOR_REVIEW,
    }));

    const policy = await this.policyService.create({
      version: DEFAULT_POLICY_VERSION,
      isActive: true,
      createdBy: adminId,
      categories,
    });

    this.logger.log(`Created policy version ${policy.version}`);
    return policy;
  }
}
