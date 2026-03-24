import { Controller, Get, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { CvTemplatesService } from './cv-templates.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';

@Controller('cv-templates')
@UseGuards(JwtAuthGuard)
export class CvTemplatesController {
  constructor(private readonly cvTemplatesService: CvTemplatesService) {}

  @Get()
  listTemplates() {
    return this.cvTemplatesService.listActiveTemplates();
  }

  @Get(':id')
  getTemplate(@Param('id', ParseIntPipe) id: number) {
    return this.cvTemplatesService.getTemplateById(BigInt(id));
  }
}
