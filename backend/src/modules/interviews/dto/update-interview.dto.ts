import { PartialType } from '@nestjs/mapped-types';
import { CreateInterviewDto } from './create-interview.dto';

export class UpdateInterviewDto extends PartialType(CreateInterviewDto) {
  // Có thể cho phép sửa lại thời gian, mode, location, link, interviewer...
}
