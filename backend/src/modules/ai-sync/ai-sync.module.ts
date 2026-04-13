import { Global, Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';

import { PrismaModule } from '@/prisma/prisma.module';
import { QUEUES } from '@/modules/queue/queue.constants';
import { AiSyncClient } from './ai-sync.client';
import { AiSyncProducer } from './ai-sync.producer';
import { AiSyncService } from './ai-sync.service';
import { AiSyncConsumer } from './consumers/ai-sync.consumer';
import { AiSyncController } from './ai-sync.controller';

@Global()
@Module({
  imports: [
    PrismaModule,
    BullModule.registerQueue({
      name: QUEUES.AI_SYNC,
    }),
  ],
  controllers: [AiSyncController],
  providers: [AiSyncClient, AiSyncProducer, AiSyncService, AiSyncConsumer],
  exports: [AiSyncClient, AiSyncProducer, AiSyncService],
})
export class AiSyncModule {}
