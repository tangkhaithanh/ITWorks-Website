import {
  IsOptional,
  IsString,
  IsIn,
  IsDateString,
  IsInt,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class JobDashboardQueryDto {
  /**
   * Range nhanh cho line chart:
   *  - 7d, 14d, 30d, all
   *  - nếu có from/to thì coi như custom, bỏ qua range
   */
  @IsOptional()
  @IsString()
  @IsIn(['7d', '14d', '30d', 'all'])
  range?: '7d' | '14d' | '30d' | 'all';

  /** Custom range: từ ngày (ISO string: yyyy-MM-dd hoặc full ISO) */
  @IsOptional()
  @IsDateString()
  from?: string;

  /** Custom range: tới ngày */
  @IsOptional()
  @IsDateString()
  to?: string;

  /** Số ứng viên mới nhất lấy về (mặc định 10) */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  latest_limit?: number;

  /** Trang hiện tại */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  latest_page?: number;
}
