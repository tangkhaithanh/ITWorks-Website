import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateIndustryDto } from './dto/create-industry.dto';
import { UpdateIndustryDto } from './dto/update-industry.dto';

@Injectable()
export class IndustryService {
  constructor(private prisma: PrismaService) {}

  // CREATE
  async create(dto: CreateIndustryDto) {
    try {
      const industry = await this.prisma.industry.create({
        data: { name: dto.name },
      });

      return industry;
    } catch (e) {
      throw new BadRequestException('Tên ngành đã tồn tại');
    }
  }

  // READ ALL
  async findAll() {
    const industries = await this.prisma.industry.findMany({
      orderBy: { name: 'asc' },
    });

    return industries;
  }

  // READ ONE
  async findOne(id: bigint) {
    const industry = await this.prisma.industry.findUnique({
      where: { id },
    });

    if (!industry) throw new NotFoundException('Không tìm thấy ngành này');

    return industry;
  }

  // UPDATE
  async update(id: bigint, dto: UpdateIndustryDto) {
    try {
      const updated = await this.prisma.industry.update({
        where: { id },
        data: dto,
      });

      return updated;
    } catch (e) {
      throw new NotFoundException('Không cập nhật được ngành này');
    }
  }

  // DELETE
  async remove(id: bigint) {
    try {
      await this.prisma.industry.delete({
        where: { id },
      });

      return { success: true, message: 'Xóa ngành thành công' };
    } catch (e) {
      throw new NotFoundException('Không tìm thấy ngành để xóa');
    }
  }
}
