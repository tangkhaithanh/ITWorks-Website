import { Matches } from 'class-validator';

export class MatchingHistoryIdDto {
  @Matches(/^\d+$/, { message: 'id must be a numeric string' })
  id!: string;
}
