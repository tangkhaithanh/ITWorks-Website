import { IsOptional, IsString } from 'class-validator';

export class CreateVnpayPaymentDto {
  @IsString()
  plan_id: string;

  @IsOptional()
  @IsString()
  bank_code?: string;

  @IsOptional()
  @IsString()
  locale?: 'vn' | 'en';
}
