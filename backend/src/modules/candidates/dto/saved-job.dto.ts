import { IsNotEmpty, IsNumber } from 'class-validator';

export class SaveJobDto {
  @IsNumber()
  @IsNotEmpty()
  job_id: number;
}
