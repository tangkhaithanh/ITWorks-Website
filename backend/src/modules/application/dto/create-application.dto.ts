import {
  IsNotEmpty,
  IsNumberString,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateApplicationDto {
  @IsNotEmpty()
  @IsNumberString()
  job_id: string;

  @IsNotEmpty()
  @IsNumberString()
  cv_id: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  cover_letter?: string;
}
