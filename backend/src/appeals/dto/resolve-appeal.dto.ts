import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { APPEAL_DECISION_VALUES, AppealDecision } from '../../common/constants/appeal.constants';

export class ResolveAppealDto {
  @IsEnum(APPEAL_DECISION_VALUES)
  decision: AppealDecision;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  adminResponse?: string;
}
