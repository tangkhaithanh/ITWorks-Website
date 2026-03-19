import { Module } from '@nestjs/common';
import { NotificationsGateway } from './notifications.gateway';
import { WsJwtGuard } from '@/common/guards/ws-jwt.guard';
import { WsAuthModule } from '@/common/services/ws/ws-auth.module';
import { NotificationsService } from '@/modules/notifications/notifications.service';
import { NotificationsController } from '@/modules/notifications/notifications.controller';
@Module({
  imports: [WsAuthModule],
  providers: [NotificationsGateway, WsJwtGuard , NotificationsService],
  exports: [NotificationsGateway, NotificationsService],
  controllers: [NotificationsController],
})
export class NotificationsModule {}