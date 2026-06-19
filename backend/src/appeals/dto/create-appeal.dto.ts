import { IsMongoId, IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateAppealDto {
  @IsMongoId()
  @IsNotEmpty()
  imageVerdictId: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(2000)
  justification: string;
}
