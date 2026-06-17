import { EnforcementMode, ModerationCategoryName } from '../../common/constants/moderation.constants';

export class PolicyCategoryResponseDto {
  name: ModerationCategoryName;
  enabled: boolean;
  confidenceThreshold: number;
  enforcement: EnforcementMode;
}

export class PolicyVersionResponseDto {
  id: string;
  version: number;
  isActive: boolean;
  createdBy: string;
  categories: PolicyCategoryResponseDto[];
  createdAt: Date;
}

export class EnabledCategoriesResponseDto {
  categories: ModerationCategoryName[];
}

export class AdminPolicyResponseDto {
  active: PolicyVersionResponseDto;
  history: PolicyVersionResponseDto[];
}
