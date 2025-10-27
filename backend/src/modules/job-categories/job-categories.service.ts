// src/modules/job-categories/job-categories.service.ts
import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class JobCategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async getAll() {
    return this.prisma.jobCategory.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async create(name: string) {
    const exists = await this.prisma.jobCategory.findUnique({ where: { name } });
    if (exists) throw new BadRequestException('Danh mục đã tồn tại');
    return this.prisma.jobCategory.create({ data: { name } });
  }

  async update(id: bigint, name: string) {
    const found = await this.prisma.jobCategory.findUnique({ where: { id } });
    if (!found) throw new NotFoundException('Danh mục không tồn tại');
    return this.prisma.jobCategory.update({ where: { id }, data: { name } });
  }

  async delete(id: bigint) {
    const found = await this.prisma.jobCategory.findUnique({ where: { id } });
    if (!found) throw new NotFoundException('Danh mục không tồn tại');
    return this.prisma.jobCategory.delete({ where: { id } });
  }
}
