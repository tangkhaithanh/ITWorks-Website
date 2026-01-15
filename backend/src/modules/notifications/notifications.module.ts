import { Module } from '@nestjs/common';
import { NotificationsGateway } from './notifications.gateway';
import { WsJwtGuard } from '@/common/guards/ws-jwt.guard';
import { WsAuthModule } from '@/common/services/ws/ws-auth.module';

@Module({
  imports: [WsAuthModule],
  providers: [NotificationsGateway, WsJwtGuard],
  exports: [NotificationsGateway],
})
export class NotificationsModule {}
