import { IsNotEmpty, IsNumberString } from 'class-validator';
export class CreateApplicationDto {
  @IsNotEmpty()
  @IsNumberString()
  job_id: string;

  @IsNotEmpty()
  @IsNumberString()
  cv_id: string;
}
