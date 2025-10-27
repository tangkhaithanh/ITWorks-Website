import { IsString, IsEmail, IsOptional, IsDateString, IsEnum, MinLength, ValidateIf } from 'class-validator';
import { Gender } from '@prisma/client';
export class RegisterUserDto {
  @IsEmail({}, { message: 'Invalid email format' })
  email: string;

  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password: string;

  @IsString()
  fullName: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @ValidateIf((_, value) => value !== null && value !== undefined && value !== '')
  @IsDateString({}, { message: 'Date of birth must be a valid date string' })
  dob?: string;

  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  avatarUrl?: string;
}
