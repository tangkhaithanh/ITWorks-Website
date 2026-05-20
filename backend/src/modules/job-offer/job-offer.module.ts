import { Module } from '@nestjs/common';
import { PrismaModule } from '@/prisma/prisma.module';
import { NotificationsModule } from '@/modules/notifications/notifications.module';
import { JobOfferController } from './job-offer.controller';
import { JobOfferService } from './job-offer.service';

@Module({
  imports: [PrismaModule, NotificationsModule],
  controllers: [JobOfferController],
  providers: [JobOfferService],
  exports: [JobOfferService],
})
export class JobOfferModule {}
