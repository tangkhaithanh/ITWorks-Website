import { IsNotEmpty, IsNumberString } from 'class-validator';

export class OpenConversationDto {
  @IsNotEmpty()
  @IsNumberString()
  job_id: string;
}
