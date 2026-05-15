import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsIn, IsInt, IsOptional, Min } from 'class-validator';

export class TopCompaniesQueryDto {
  @ApiPropertyOptional({
    enum: ['7d', '30d', '3m', '1y'],
    description:
      'Preset reporting period. Ignored when from or to is provided.',
    default: '30d',
  })
  @IsOptional()
  @IsIn(['7d', '30d', '3m', '1y'])
  range?: '7d' | '30d' | '3m' | '1y';

  @ApiPropertyOptional({
    format: 'date',
    example: '2026-05-01',
    description: 'Custom start date in YYYY-MM-DD format.',
  })
  @IsOptional()
  @IsDateString({ strict: true })
  from?: string;

  @ApiPropertyOptional({
    format: 'date',
    example: '2026-05-15',
    description: 'Custom end date in YYYY-MM-DD format.',
  })
  @IsOptional()
  @IsDateString({ strict: true })
  to?: string;

  @ApiPropertyOptional({
    minimum: 1,
    maximum: 50,
    default: 10,
    description:
      'Number of ranked companies to return. Values above 50 are capped at 50.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;
}
