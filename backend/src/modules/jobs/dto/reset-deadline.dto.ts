// dto/reset-deadline.dto.ts
import { IsDateString } from "class-validator";

export class ResetDeadlineDto {
  @IsDateString({}, { message: "newDeadline phải đúng định dạng yyyy-MM-dd" })
  newDeadline: string;
}
