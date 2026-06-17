import { BadRequestException } from '@nestjs/common';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import {
  ENFORCEMENT_MODE_VALUES,
  EnforcementMode,
  MODERATION_CATEGORY_VALUES,
  ModerationCategoryName,
} from '../../common/constants/moderation.constants';

export class PolicyCategoryInputDto {
  @IsIn(MODERATION_CATEGORY_VALUES)
  @IsNotEmpty()
  name: ModerationCategoryName;

  @IsBoolean()
  enabled: boolean;

  @IsInt()
  @Min(0)
  @Max(100)
  confidenceThreshold: number;

  @IsIn(ENFORCEMENT_MODE_VALUES)
  enforcement: EnforcementMode;
}

export class UpdatePolicyDto {
  @IsArray()
  @ArrayMinSize(MODERATION_CATEGORY_VALUES.length)
  @ValidateNested({ each: true })
  @Type(() => PolicyCategoryInputDto)
  categories: PolicyCategoryInputDto[];
}

export function assertCompleteCategoryCoverage(
  categories: PolicyCategoryInputDto[],
): void {
  const providedNames = categories.map((category) => category.name);
  const uniqueNames = new Set(providedNames);

  if (uniqueNames.size !== MODERATION_CATEGORY_VALUES.length) {
    throw new BadRequestException(
      'Policy must include each moderation category exactly once.',
    );
  }

  for (const requiredName of MODERATION_CATEGORY_VALUES) {
    if (!uniqueNames.has(requiredName)) {
      throw new BadRequestException(`Missing required category: ${requiredName}`);
    }
  }
}
