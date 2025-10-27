import { Transform } from 'class-transformer';
import { IsOptional, IsInt, Min } from 'class-validator';
import { ApplicationStatus } from '@prisma/client';

export class GetApplicationsQueryDTO {
  @Transform(({ value }) => parseInt(value, 10) || 1)
  @IsInt()
  @Min(1)
  @IsOptional()
  page = 1;

  @Transform(({ value }) => parseInt(value, 10) || 10)
  @IsInt()
  @Min(1)
  @IsOptional()
  limit = 10;

  @IsOptional()
  status?: ApplicationStatus;

  @Transform(({ value }) => (value ? BigInt(value) : undefined))
  @IsOptional() // 👈 thêm dòng này
  jobId?: bigint;

  @IsOptional()
  search?: string;
}
