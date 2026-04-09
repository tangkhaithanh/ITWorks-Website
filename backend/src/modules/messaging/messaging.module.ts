import { Module } from '@nestjs/common';
import { MessagingService } from './messaging.service';
import { MessagingController } from './messaging.controller';
import { MessagingGateway } from './messaging.gateway';
import { PrismaModule } from '@/prisma/prisma.module';
import { WsAuthModule } from '@/common/services/ws/ws-auth.module';
import { NotificationsModule } from '@/modules/notifications/notifications.module';

@Module({
  imports: [PrismaModule, WsAuthModule, NotificationsModule],
  controllers: [MessagingController],
  providers: [MessagingService, MessagingGateway],
  exports: [MessagingService, MessagingGateway],
})
export class MessagingModule {}
