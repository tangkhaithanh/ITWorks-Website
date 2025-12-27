import {
  IsEmail,
  IsString,
  MinLength,
  IsOptional,
  IsEnum,
} from 'class-validator';
import { CompanySize } from '@prisma/client';
export class RegisterRecruiterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  companyName: string;

  @IsOptional()
  @IsString()
  website?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsEnum(CompanySize)
  size?: CompanySize;

  @IsOptional()
  @IsString()
  logoUrl?: string;
}
