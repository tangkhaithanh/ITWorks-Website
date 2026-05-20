import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

const trimOptionalString = (value: unknown) =>
  typeof value === 'string' ? value.trim() : undefined;

export class CloseReportedJobDto {
  @ApiPropertyOptional({ maxLength: 1000 })
  @IsOptional()
  @IsString()
  @MaxLength(1000, { message: 'Ghi chú không được vượt quá 1000 ký tự' })
  @Transform(({ value }) => trimOptionalString(value))
  note?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  resolveReport?: boolean = true;
}
