import { Module } from '@nestjs/common';
import { PrismaModule } from '@/prisma/prisma.module';
import { CvTemplatesService } from './cv-templates.service';
import { CvTemplatesController } from './cv-templates.controller';

@Module({
  imports: [PrismaModule],
  providers: [CvTemplatesService],
  controllers: [CvTemplatesController],
  exports: [CvTemplatesService],
})
export class CvTemplatesModule {}
