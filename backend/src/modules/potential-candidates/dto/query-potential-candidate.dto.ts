import {
  IsOptional,
  IsString,
  IsEnum,
  IsInt,
  Min,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  PotentialCandidateStatus,
  PotentialCandidatePriority,
} from '@prisma/client';

export class QueryPotentialCandidateDto {
  @IsOptional()
  @IsString()
  @Matches(/^\d+$/, { message: 'jobId must be a numeric string' })
  jobId?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(PotentialCandidateStatus)
  status?: PotentialCandidateStatus;

  @IsOptional()
  @IsEnum(PotentialCandidatePriority)
  priority?: PotentialCandidatePriority;

  @IsOptional()
  @IsString()
  tags?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit: number = 20;
}
