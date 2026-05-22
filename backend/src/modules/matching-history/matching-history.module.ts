import { Module } from '@nestjs/common';

import { PrismaModule } from '@/prisma/prisma.module';
import { MatchingHistoryController } from './matching-history.controller';
import { MatchingHistoryService } from './matching-history.service';

@Module({
  imports: [PrismaModule],
  controllers: [MatchingHistoryController],
  providers: [MatchingHistoryService],
  exports: [MatchingHistoryService],
})
export class MatchingHistoryModule {}
