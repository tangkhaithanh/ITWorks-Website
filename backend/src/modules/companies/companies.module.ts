import { Module } from '@nestjs/common';
import { CompaniesController } from './companies.controller';
import { CompaniesService } from './companies.service';
import { PrismaModule } from '@/prisma/prisma.module';
import { CloudinaryModule } from '@/modules/cloudinary/cloudinary.module';
import { ElasticsearchCustomModule } from '../elasticsearch/elasticsearch.module';
import { JobsModule } from '../jobs/jobs.module';
@Module({
  imports: [
    PrismaModule,
    CloudinaryModule,
    ElasticsearchCustomModule,
    JobsModule,
  ],
  controllers: [CompaniesController],
  providers: [CompaniesService],
  exports: [CompaniesService],
})
export class CompaniesModule {}
