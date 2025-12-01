import { IsNotEmpty, IsString } from 'class-validator';

export class CreateIndustryDto {
  @IsString()
  @IsNotEmpty()
  name: string;
}
