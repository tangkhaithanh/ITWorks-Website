import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsEnum,
  IsArray,
  ArrayNotEmpty,
  IsDateString,
  ValidateIf,
} from 'class-validator';
import { EmploymentType } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import { WorkMode, ExperienceLevel } from '@prisma/client';
export class CreateJobDto {
  // --- Cơ bản ---
  @IsString()
  title: string;

  // 💰 Lương — chỉ bắt buộc khi không chọn "Thỏa thuận"
  @ValidateIf((o) => !o.negotiable)
  @IsNumber(
    {},
    { message: 'Phải nhập mức lương tối thiểu nếu không thỏa thuận' },
  )
  @Type(() => Number)
  salary_min?: number;

  @ValidateIf((o) => !o.negotiable)
  @IsNumber({}, { message: 'Phải nhập mức lương tối đa nếu không thỏa thuận' })
  @Type(() => Number)
  salary_max?: number;

  @IsBoolean()
  @Type(() => Boolean)
  @IsOptional()
  negotiable?: boolean = false;

  // --- Địa điểm ---
  @Type(() => Number)
  @IsNumber()
  location_city_id?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  location_ward_id?: number;

  @IsOptional()
  @IsString()
  location_street?: string;

  @IsOptional()
  @Type(() => Number)
  latitude?: number;

  @IsOptional()
  @Type(() => Number)
  longitude?: number;

  // --- Hình thức làm việc & cấp độ ---
  @IsArray()
  @ArrayNotEmpty({ message: 'Phải chọn ít nhất một hình thức làm việc' })
  @IsEnum(WorkMode, { each: true, message: 'Hình thức làm việc không hợp lệ' })
  @Transform(({ value }) =>
    typeof value === 'string' ? JSON.parse(value) : value,
  )
  work_modes: WorkMode[];

  @IsArray()
  @ArrayNotEmpty({ message: 'Phải chọn ít nhất một cấp độ kinh nghiệm' })
  @IsEnum(ExperienceLevel, {
    each: true,
    message: 'Cấp độ kinh nghiệm không hợp lệ',
  })
  @Transform(({ value }) =>
    typeof value === 'string' ? JSON.parse(value) : value,
  )
  experience_levels: ExperienceLevel[];

  @IsEnum(EmploymentType, { message: 'Loại công việc không hợp lệ' })
  employment_type: EmploymentType;

  // --- Thông tin khác ---
  @IsOptional()
  @IsDateString()
  deadline?: string;

  @IsOptional()
  @Type(() => Number)
  category_id?: number;

  // --- Chi tiết mô tả ---
  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  requirements?: string;

  // --- Kỹ năng liên quan ---
  @IsOptional()
  @IsArray()
  @Transform(({ value }) => value.map((v: string) => BigInt(v)))
  skill_ids?: bigint[];
  // Số lượng cần tuyển
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  number_of_openings?: number;
}
