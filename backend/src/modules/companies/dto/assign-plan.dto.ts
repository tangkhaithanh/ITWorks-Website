import { IsInt, IsOptional, IsPositive } from 'class-validator';

export class AssignPlanDto {
  @IsInt()
  @IsPositive()
  plan_id: number;

  @IsOptional()
  @IsInt()
  @IsPositive()
  order_id?: number;
}
