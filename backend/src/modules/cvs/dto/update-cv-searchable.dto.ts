import { IsBoolean } from 'class-validator';

export class UpdateCvSearchableDto {
  @IsBoolean()
  is_searchable!: boolean;
}
