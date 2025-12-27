import { IsInt, IsOptional, IsString, Min, IsIn } from 'class-validator';
import { Transform } from 'class-transformer';
import { CompanyStatus } from '@prisma/client';

export class AdminGetCompaniesDto {
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  limit: number = 10;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  @IsIn(['pending', 'approved', 'rejected', 'hidden'])
  status?: CompanyStatus;
}
