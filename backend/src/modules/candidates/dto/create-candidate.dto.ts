import {
  IsOptional,
  IsString,
  IsArray,
  IsNumber,
  IsEnum,
} from 'class-validator';
import { WorkMode } from '@prisma/client';

export class CreateCandidateDto {
  @IsOptional()
  @IsString()
  preferred_city?: string;

  @IsOptional()
  @IsEnum(WorkMode)
  preferred_work_mode?: WorkMode;

  @IsOptional()
  @IsNumber()
  preferred_category?: number;

  @IsOptional()
  @IsNumber()
  preferred_salary?: number;

  @IsOptional()
  @IsArray()
  skills?: number[];
}
