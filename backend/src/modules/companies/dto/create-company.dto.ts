import { IsString, IsEnum, IsEmail, IsDateString, IsOptional, IsUrl, ArrayNotEmpty, IsArray } from 'class-validator';
import { CompanySize } from '@prisma/client';
import { Transform, Type } from 'class-transformer';

export class CreateCompanyDto {
  @IsString()
  name: string;

  @IsUrl()
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

  @IsString()
  founded_date: string;

  // Liên hệ
  @IsEmail()
  contact_email: string;

  @IsString()
  contact_phone: string;

   // 🏭 Lĩnh vực hoạt động (nhiều ngành)
  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @Transform(({ value }) => value.map((v: string) => BigInt(v)))
  industry_ids?: bigint[];

  // 💡 Kỹ năng / công nghệ
  @IsOptional()
  @IsArray()
  @Transform(({ value }) => value.map((v: string) => BigInt(v)))
  skill_ids?: bigint[];
}
