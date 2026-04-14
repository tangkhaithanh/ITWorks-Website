import { IsOptional, IsString, MaxLength } from 'class-validator';
import { MESSAGE_BODY_MAX_LENGTH } from '../messaging.constants';

export class CreateMessageWithAttachmentsDto {
  @IsOptional()
  @IsString()
  @MaxLength(MESSAGE_BODY_MAX_LENGTH)
  body?: string;
}
