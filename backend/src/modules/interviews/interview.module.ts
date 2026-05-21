import { Module } from '@nestjs/common';
import { InterviewService } from './interview.service';
import { InterviewController } from './interview.controller';
import { PrismaService } from '@/prisma/prisma.service';
import { MailModule } from '@/common/services/mail/mail.module';
import { NotificationsModule } from '@/modules/notifications/notifications.module';

@Module({
  imports: [MailModule, NotificationsModule],
  providers: [InterviewService, PrismaService],
  controllers: [InterviewController],
})
export class InterviewModule {}
