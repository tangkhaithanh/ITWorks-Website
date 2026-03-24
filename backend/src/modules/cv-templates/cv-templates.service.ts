import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class CvTemplatesService {
  constructor(private readonly prisma: PrismaService) {}

  async listActiveTemplates() {
    return this.prisma.cvTemplate.findMany({
      where: { is_active: true },
      select: {
        id: true,
        code: true,
        name: true,
        version: true,
        description: true,
        preview_url: true,
        layout_schema: true,
        style_tokens: true,
      },
      orderBy: [{ code: 'asc' }, { version: 'desc' }],
    });
  }

  async getTemplateById(id: bigint) {
    const template = await this.prisma.cvTemplate.findUnique({
      where: { id },
    });
    if (!template || !template.is_active) {
      throw new NotFoundException('Template CV khong ton tai');
    }
    return template;
  }
}
