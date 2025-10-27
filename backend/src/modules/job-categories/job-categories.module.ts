// src/modules/job-categories/job-categories.module.ts
import { Module } from '@nestjs/common';
import { PrismaModule } from '@/prisma/prisma.module';
import { JobCategoriesService } from './job-categories.service';
import { JobCategoriesController } from './job-categories.controller';

@Module({
  imports: [PrismaModule],
  controllers: [JobCategoriesController],
  providers: [JobCategoriesService],
  exports: [JobCategoriesService],
})
export class JobCategoriesModule {}
