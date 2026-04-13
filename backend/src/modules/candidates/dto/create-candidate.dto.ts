import {
  IsOptional,
  IsString,
  IsArray,
  IsNumber,
  IsEnum,
  IsBoolean,
} from 'class-validator';
import { WorkMode } from '@prisma/client';
import { Type } from 'class-transformer';

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

  @IsOptional()
  @IsString()
  desired_role?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  desired_salary_min?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  desired_salary_max?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  experience_years?: number;

  @IsOptional()
  @IsString()
  education_level?: string;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  open_to_work?: boolean;
}
