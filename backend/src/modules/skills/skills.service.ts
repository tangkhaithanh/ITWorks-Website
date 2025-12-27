// src/modules/skills/skills.service.ts
import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class SkillsService {
  constructor(private readonly prisma: PrismaService) {}

  async getAll() {
    return this.prisma.skill.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async create(name: string) {
    const exists = await this.prisma.skill.findUnique({ where: { name } });
    if (exists) throw new BadRequestException('Skill đã tồn tại');
    return this.prisma.skill.create({ data: { name } });
  }

  async update(id: bigint, name: string) {
    const skill = await this.prisma.skill.findUnique({ where: { id } });
    if (!skill) throw new NotFoundException('Skill không tồn tại');
    return this.prisma.skill.update({ where: { id }, data: { name } });
  }

  async delete(id: bigint) {
    const skill = await this.prisma.skill.findUnique({ where: { id } });
    if (!skill) throw new NotFoundException('Skill không tồn tại');
    return this.prisma.skill.delete({ where: { id } });
  }
}
