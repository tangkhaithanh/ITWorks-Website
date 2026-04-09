import { IsNotEmpty, IsNumberString } from 'class-validator';

export class StartConversationDto {
  @IsNotEmpty()
  @IsNumberString()
  job_id: string;

  /** Account id của ứng viên (role candidate) */
  @IsNotEmpty()
  @IsNumberString()
  applicant_account_id: string;
}
