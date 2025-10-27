import { Transform } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

export class QueryCvDto {
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(1)
  page = 1;

  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(1)
  limit = 10;
}