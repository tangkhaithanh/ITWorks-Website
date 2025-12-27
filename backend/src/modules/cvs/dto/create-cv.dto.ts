import {
  IsOptional,
  IsString,
  IsNumber,
  IsObject,
  IsNotEmpty,
} from 'class-validator';
export class CreateCvDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsOptional()
  @IsNumber()
  template_id?: number;

  // Toàn bộ nội dung CV lưu dưới dạng chuỗi json
  @IsOptional()
  @IsObject()
  content?: Record<string, any>;
}
