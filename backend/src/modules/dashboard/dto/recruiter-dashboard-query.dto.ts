// src/dashboard/dto/recruiter-dashboard-query.dto.ts
import {
  IsOptional,
  IsString,
  IsIn,
  IsDateString,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Query cho Dashboard tổng quan của Recruiter (theo công ty).
 *
 * Ưu tiên:
 *  - Nếu có from/to => dùng custom range
 *  - Nếu không có from/to => dùng range (7d, 30d, all)
 */
export class RecruiterDashboardQueryDto {
  /**
   * Khoảng thời gian nhanh cho line chart:
   *  - 7d, 30d, all
   *  - Nếu có from/to thì bỏ qua range này.
   */
  @IsOptional()
  @IsString()
  @IsIn(['7d', '30d', 'all'])
  range?: '7d' | '30d' | 'all';

  /** Custom range: từ ngày (ISO string: yyyy-MM-dd hoặc full ISO) */
  @IsOptional()
  @IsDateString()
  from?: string;

  /** Custom range: tới ngày (đã include hết ngày đó) */
  @IsOptional()
  @IsDateString()
  to?: string;

  /** Số job top đang tuyển trả về (mặc định 5) */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(20)
  topJobsLimit?: number;

  /** Số ứng viên mới ứng tuyển (recent applications) trả về (mặc định 10) */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  recentApplicationsLimit?: number;

  /** Số lịch phỏng vấn sắp diễn ra trả về (mặc định 5) */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  upcomingInterviewsLimit?: number;
}
