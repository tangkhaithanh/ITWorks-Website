import {
  IsOptional,
  IsString,
  IsArray,
  IsEnum,
  IsDateString,
  ValidateIf,
} from 'class-validator';
import {
  PotentialCandidateStatus,
  PotentialCandidatePriority,
} from '@prisma/client';

export class UpdatePotentialCandidateDto {
  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsEnum(PotentialCandidateStatus)
  status?: PotentialCandidateStatus;

  @IsOptional()
  @IsEnum(PotentialCandidatePriority)
  priority?: PotentialCandidatePriority;

  @IsOptional()
  @ValidateIf((_, value) => value !== null && value !== undefined)
  @IsDateString({}, { message: 'followUpDate must be a valid date' })
  followUpDate?: string;
}
