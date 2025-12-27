import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { InterviewMode, InterviewStatus } from '@prisma/client';
export class CreateInterviewDto {
  @IsNumber()
  @IsNotEmpty()
  application_id: number;

  @IsDateString()
  scheduled_at: string;

  @IsEnum(InterviewMode)
  mode: InterviewMode;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  meeting_link?: string;

  @IsOptional()
  @IsEnum(InterviewStatus)
  status?: InterviewStatus;

  @IsOptional()
  @IsString()
  notes?: string;
}
