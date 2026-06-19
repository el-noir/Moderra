import { Type } from 'class-transformer';
import { IsDate, IsOptional } from 'class-validator';

export class GetAnalyticsDto {
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  dateFrom?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  dateTo?: Date;
}
