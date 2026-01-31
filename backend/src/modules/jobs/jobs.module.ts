import { Module } from '@nestjs/common';
import { JobsController } from './jobs.controller';
import { JobsService } from './jobs.service';
import { PrismaModule } from '@/prisma/prisma.module';
import { ElasticsearchCustomModule } from '../elasticsearch/elasticsearch.module';
import { LocationModule } from '../location/location.module';
import { BullModule } from '@nestjs/bullmq';
import { QUEUES } from '@/modules/queue/queue.constants';
import { JobEventsQueue } from './queues/job-events.queue';
import { JobDashboardService } from '@/modules/jobs/jobs-dashboard.service';
import { JobEventsConsumer } from './consumers/job-events.consumer';
@Module({
  imports: [
    PrismaModule,
    ElasticsearchCustomModule,
    LocationModule,
    // Đăng ký 1 queue để sử dụng riêng cho module jobs này:
    BullModule.registerQueue({
      name: QUEUES.JOB_EVENTS,
    }),
  ],
  controllers: [JobsController],
  providers: [JobsService, JobEventsQueue, JobDashboardService, JobEventsConsumer ],
  exports: [JobsService, JobEventsQueue, JobDashboardService],
})
export class JobsModule {}
