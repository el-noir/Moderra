import { IsEnum, IsOptional } from 'class-validator';
import { APPEAL_STATUS_VALUES, AppealStatus } from '../../common/constants/appeal.constants';

export class ListAdminAppealsQueryDto {
  @IsOptional()
  @IsEnum(APPEAL_STATUS_VALUES)
  status?: AppealStatus;
}
