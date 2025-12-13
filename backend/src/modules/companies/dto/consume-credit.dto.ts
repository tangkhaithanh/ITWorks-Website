import { IsInt, IsOptional, IsPositive } from 'class-validator';

export class ConsumeCreditDto {
    @IsInt()
    @IsPositive()
    amount: number;

    @IsOptional()
    @IsInt()
    @IsPositive()
    job_id?: number;
}
