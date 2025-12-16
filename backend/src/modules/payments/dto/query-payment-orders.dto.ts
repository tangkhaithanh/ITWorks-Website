import {
    IsOptional,
    IsString,
    IsEnum,
    IsInt,
    Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentStatus } from '@prisma/client';

export class QueryPaymentOrdersDto {
    // 🔍 Tìm theo tên gói hoặc mã đơn
    @IsOptional()
    @IsString()
    keyword?: string;

    // 📌 Lọc theo trạng thái
    @IsOptional()
    @IsEnum(PaymentStatus)
    status?: PaymentStatus;

    // 📄 Trang
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page: number = 1;

    // 📦 Số bản ghi / trang
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    limit: number = 10;
}
