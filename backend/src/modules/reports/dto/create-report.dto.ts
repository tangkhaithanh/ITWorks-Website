import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ReportTargetType } from '@prisma/client';

const parseBigIntString = (value: unknown) => {
  if (value === undefined || value === null || value === '') {
    return '';
  }

  if (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'bigint'
  ) {
    return String(value);
  }

  return '';
};

const trimString = (value: unknown) =>
  typeof value === 'string' ? value.trim() : '';

export class CreateReportDto {
  @ApiProperty({ enum: ReportTargetType })
  @IsEnum(ReportTargetType, { message: 'Loại đối tượng báo cáo không hợp lệ' })
  targetType: ReportTargetType;

  @ApiProperty({ type: String, description: 'Job or company identifier' })
  @IsString()
  @IsNotEmpty({ message: 'Thiếu mã đối tượng báo cáo' })
  @Transform(({ value }) => parseBigIntString(value))
  targetId: string;

  @ApiProperty({ minLength: 10, maxLength: 1000 })
  @IsString()
  @MinLength(10, { message: 'Lý do báo cáo phải có ít nhất 10 ký tự' })
  @MaxLength(1000, { message: 'Lý do báo cáo không được vượt quá 1000 ký tự' })
  @Transform(({ value }) => trimString(value))
  reason: string;
}
