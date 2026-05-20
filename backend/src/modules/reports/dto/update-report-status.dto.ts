import { Transform } from 'class-transformer';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ReportStatus } from '@prisma/client';

const trimOptionalString = (value: unknown) =>
  typeof value === 'string' ? value.trim() : undefined;

export class UpdateReportStatusDto {
  @ApiProperty({ enum: ReportStatus })
  @IsEnum(ReportStatus, { message: 'Trạng thái báo cáo không hợp lệ' })
  status: ReportStatus;

  @ApiPropertyOptional({ maxLength: 1000 })
  @IsOptional()
  @IsString()
  @MaxLength(1000, { message: 'Ghi chú không được vượt quá 1000 ký tự' })
  @Transform(({ value }) => trimOptionalString(value))
  note?: string;
}
