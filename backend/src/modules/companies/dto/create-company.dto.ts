import { IsString, IsEnum, IsEmail, IsDateString } from 'class-validator';
import { CompanySize } from '@prisma/client';

export class CreateCompanyDto {
  @IsString()
  name: string;

  @IsString()
  website: string;

  @IsString()
  description: string;

  @IsString()
  address: string;

  @IsString()
  headquarters: string;

  @IsEnum(CompanySize)
  size: CompanySize;

  // Pháp lý
  @IsString()
  business_code: string;

  @IsString()
  representative_name: string;

  @IsString()
  representative_position: string;

  @IsString()
  license_file_url: string;

  @IsDateString()
  founded_date: Date;

  // Liên hệ
  @IsEmail()
  contact_email: string;

  @IsString()
  contact_phone: string;

  // Liên kết
  industry_id: bigint;
}
