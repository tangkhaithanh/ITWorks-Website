import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { EmploymentType } from '@prisma/client';

export class CreateJobOfferDto {
  @IsNumber()
  @IsNotEmpty()
  application_id: number;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  message: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  salary?: number | null;

  @IsOptional()
  @IsString()
  currency?: string | null;

  @IsEnum(EmploymentType)
  employment_type: EmploymentType;

  @IsDateString()
  expires_at: string;
}