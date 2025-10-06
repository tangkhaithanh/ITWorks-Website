import { Module } from '@nestjs/common';
import { CompaniesController } from './companies.controller';
import { CompaniesService } from './companies.service';
import { PrismaModule } from '@/prisma/prisma.module';
import { CloudinaryModule } from '@/modules/cloudinary/cloudinary.module';

@Module({
  imports: [
    PrismaModule,      // PrismaService
    CloudinaryModule,  // CloudinaryService
  ],
  controllers: [CompaniesController],
  providers: [CompaniesService],
  exports: [CompaniesService], // để module khác dùng (nếu cần)
})
export class CompaniesModule {}
