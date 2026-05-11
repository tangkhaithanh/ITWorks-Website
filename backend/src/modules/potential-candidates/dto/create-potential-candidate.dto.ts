import { IsString, IsNumber, IsOptional, IsArray, Min } from 'class-validator';

export class CreatePotentialCandidateDto {
  @IsString()
  candidateId: string;

  @IsOptional()
  @IsString()
  jobId?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  matchScore?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  matchedSkills?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  missingSkills?: string[];
}
