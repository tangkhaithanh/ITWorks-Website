import { Module } from '@nestjs/common';
import { PrismaModule } from '@/prisma/prisma.module';
import { CloudinaryModule } from '@/modules/cloudinary/cloudinary.module';
import { ElasticsearchCustomModule } from '../elasticsearch/elasticsearch.module';
import { JobsModule } from '../jobs/jobs.module';

import { CompaniesController } from './companies.controller';
import { CompaniesService } from './companies.service';

import { CompaniesPlansController } from './companiesPlans.controller';
import { CompaniesPlansService } from './companiesPlans.service';

@Module({
  imports: [
    PrismaModule,
    CloudinaryModule,
    ElasticsearchCustomModule,
    JobsModule,
  ],
  controllers: [
    CompaniesController,
    CompaniesPlansController, // ✅ thêm
  ],
  providers: [
    CompaniesService,
    CompaniesPlansService, // ✅ thêm
  ],
  exports: [
    CompaniesService,
    CompaniesPlansService, // ✅ export để module khác dùng
  ],
})
export class CompaniesModule { }
