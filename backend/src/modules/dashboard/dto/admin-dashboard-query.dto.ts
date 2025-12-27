import { IsIn, IsOptional, IsString } from 'class-validator';

export class AdminDashboardQueryDto {
  /**
   * range preset: 7d | 30d | 3m | 1y
   * (default: 30d)
   */
  @IsOptional()
  @IsIn(['7d', '30d', '3m', '1y'])
  range?: '7d' | '30d' | '3m' | '1y';

  /**
   * custom range: yyyy-MM-dd
   * nếu có from/to thì ưu tiên dùng custom range
   */
  @IsOptional()
  @IsString()
  from?: string;

  @IsOptional()
  @IsString()
  to?: string;
}
