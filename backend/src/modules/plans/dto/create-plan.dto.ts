import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreatePlanDto {
  @IsString()
  name: string;

  @IsInt()
  @Min(0)
  price: number; // VND nguyên

  @IsInt()
  @Min(0)
  job_limit: number;

  @IsInt()
  @Min(0)
  credit_amount: number;

  @IsInt()
  @Min(1)
  duration_days: number;

  @IsOptional()
  @IsString()
  features?: string;
}
