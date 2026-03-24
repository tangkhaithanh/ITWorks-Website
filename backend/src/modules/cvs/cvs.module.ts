import { Module } from '@nestjs/common';
import { CvsService } from './cvs.service';
import { CvsController } from './cvs.controller';
import { PrismaModule } from '@/prisma/prisma.module';
import { CloudinaryModule } from '@/modules/cloudinary/cloudinary.module';
import { CvRenderingService } from './cv-rendering.service';
import { CvTemplatesModule } from '@/modules/cv-templates/cv-templates.module';

@Module({
  imports: [PrismaModule, CloudinaryModule, CvTemplatesModule],
  controllers: [CvsController],
  providers: [CvsService, CvRenderingService],
  exports: [CvsService],
})
export class CvsModule {}
