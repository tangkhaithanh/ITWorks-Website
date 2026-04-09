import { Module } from '@nestjs/common';
import { ApplicationController } from './application.controller';
import { ApplicationService } from './application.service';
import { PrismaModule } from '@/prisma/prisma.module';
import { MailModule } from '@/common/services/mail/mail.module';
import { NotificationsModule } from '@/modules/notifications/notifications.module';
import { MessagingModule } from '@/modules/messaging/messaging.module';
@Module({
  imports: [PrismaModule, MailModule, NotificationsModule, MessagingModule],
  controllers: [ApplicationController],
  providers: [ApplicationService],
  exports: [ApplicationService],
})
export class ApplicationModule {}
