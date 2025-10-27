import { Module } from '@nestjs/common';
import { JobsController } from './jobs.controller';
import { JobsService } from './jobs.service';
import { PrismaModule } from '@/prisma/prisma.module';
import { ElasticsearchCustomModule } from '../elasticsearch/elasticsearch.module';
import { LocationModule } from '../location/location.module';

@Module({
  imports: [PrismaModule, ElasticsearchCustomModule, LocationModule],
  controllers: [JobsController],
  providers: [JobsService],
  exports: [JobsService],
})
export class JobsModule {}
