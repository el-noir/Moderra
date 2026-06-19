import { IsEnum, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { VERDICT_OUTCOME_VALUES, VerdictOutcome } from '../../common/constants/verdict.constants';

export class OverrideVerdictDto {
  @IsEnum(VERDICT_OUTCOME_VALUES)
  @IsNotEmpty()
  outcome: VerdictOutcome;

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  reason: string;
}
