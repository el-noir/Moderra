import { IsDateString, IsIn, IsOptional } from 'class-validator';
import { MODERATION_CATEGORY_VALUES, ModerationCategoryName } from '../../common/constants/moderation.constants';
import { VERDICT_OUTCOME_VALUES, VerdictOutcome } from '../../common/constants/verdict.constants';

export class ListSubmissionsQueryDto {
  @IsOptional()
  @IsIn(VERDICT_OUTCOME_VALUES)
  outcome?: VerdictOutcome;

  @IsOptional()
  @IsIn(MODERATION_CATEGORY_VALUES)
  category?: ModerationCategoryName;

  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @IsOptional()
  @IsDateString()
  dateTo?: string;
}
