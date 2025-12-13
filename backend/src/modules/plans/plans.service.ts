import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';

@Injectable()
export class PlansService {
    constructor(private prisma: PrismaService) { }

    async findAll(includeHidden = false) {
        const plans = await this.prisma.plan.findMany({
            where: {
                ...(includeHidden ? {} : { is_hidden: false }),
            },
            orderBy: { price: 'asc' },
        });

        return plans.map((plan) => ({
            ...plan,
            price: plan.price.toString(),
        }));
    }

    async findOne(id: bigint, includeHidden = false) {
        const plan = await this.prisma.plan.findFirst({
            where: {
                id,
                ...(includeHidden ? {} : { is_hidden: false }),
            },
        });

        if (!plan) {
            throw new NotFoundException('Plan không tồn tại');
        }

        return {
            ...plan,
            price: plan.price.toString(),
        };
    }

    async create(dto: CreatePlanDto) {
        try {
            const {
                name,
                price,
                job_limit,
                credit_amount,
                duration_days,
                features,
            } = dto;

            const existed = await this.prisma.plan.findFirst({
                where: { name },
            });

            if (existed) {
                throw new BadRequestException('Tên plan đã tồn tại');
            }

            await this.prisma.plan.create({
                data: {
                    name,
                    price: BigInt(price),
                    job_limit,
                    credit_amount,
                    duration_days,
                    features,
                },
            });

            return {
                message: 'Tạo plan thành công',
            };
        } catch (error) {
            console.log(error);
            throw error;
        }
    }


    async update(id: bigint, dto: UpdatePlanDto) {
        try {
            await this.findOne(id, true);

            const data: any = { ...dto };

            if (dto.price !== undefined) {
                data.price = BigInt(dto.price);
            }

            Object.keys(data).forEach(
                (key) => data[key] === undefined && delete data[key],
            );

            if (Object.keys(data).length === 0) {
                throw new BadRequestException('Không có dữ liệu để cập nhật');
            }

            await this.prisma.plan.update({
                where: { id },
                data,
            });

            return {
                message: 'Cập nhật plan thành công',
            };
        } catch (error) {
            console.log(error);
            throw error;
        }
    }


    async remove(id: bigint) {
        try {
            const plan = await this.findOne(id, true);

            if (plan.is_hidden) {
                throw new BadRequestException('Plan đã bị ẩn trước đó');
            }

            await this.prisma.plan.update({
                where: { id },
                data: { is_hidden: true },
            });

            return {
                message: 'Xoá plan thành công',
            };
        } catch (error) {
            console.log(error);
            throw error;
        }
    }
}
