import { IsDateString, IsIn, IsOptional, IsString } from 'class-validator';
import { APPEAL_STATUS_VALUES, AppealStatus } from '../../common/constants/appeal.constants';

export class ListAdminAppealsQueryDto {
  @IsOptional()
  @IsIn([...APPEAL_STATUS_VALUES, 'all'])
  status?: AppealStatus | 'all';

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @IsOptional()
  @IsDateString()
  dateTo?: string;
}
