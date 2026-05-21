import { InterviewResult } from '@prisma/client';
import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';

export class SubmitInterviewResultDto {
  @IsBoolean()
  no_show: boolean;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsEnum(InterviewResult)
  result: InterviewResult;
}
