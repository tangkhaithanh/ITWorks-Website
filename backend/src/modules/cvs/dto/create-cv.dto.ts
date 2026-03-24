import {
  IsArray,
  IsEmail,
  IsOptional,
  IsString,
  IsNumber,
  IsObject,
  IsNotEmpty,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class PersonalInfoDto {
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  phone: string;
}

class EducationItemDto {
  @IsString()
  school: string;

  @IsString()
  degree: string;

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;
}

class ExperienceItemDto {
  @IsString()
  company: string;

  @IsString()
  role: string;

  @IsOptional()
  @IsString()
  description?: string;
}

class ProjectItemDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;
}

class CvContentDto {
  @ValidateNested()
  @Type(() => PersonalInfoDto)
  personal: PersonalInfoDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EducationItemDto)
  education: EducationItemDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExperienceItemDto)
  experience: ExperienceItemDto[];

  @IsArray()
  @IsString({ each: true })
  skills: string[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProjectItemDto)
  projects: ProjectItemDto[];
}

export class CreateCvDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsOptional()
  @IsNumber()
  template_id?: number;

  // Toàn bộ nội dung CV lưu dưới dạng chuỗi json
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => CvContentDto)
  content?: CvContentDto;
}
