import { Controller, Get, Param, Patch, Query, Req, UseGuards } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { User } from '@/common/decorators/user.decorator';
@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  /**
   * GET /notifications/my
   * Lấy toàn bộ thông báo của account đang đăng nhập
   */
  @Get('my')
  async getMyNotifications(
    @User('accountId') accountId: bigint,
    @Query('limit') limit?: string,
    @Query('cursor') cursor?: string,
  ) {
    console.log('🔔 Fetching notifications for accountId:', accountId);
    return await this.notificationsService.getAllNotificationsByAccountId(
      accountId,
      {
        limit: limit ? Number(limit) : 10,
        cursor,
      },
    );
  }


  @Patch(':id/read')
  async markAsRead(
    @Param('id') notificationId: string,
    @User('accountId') accountId: bigint,
  ) {
    return this.notificationsService.markAsRead(
      BigInt(notificationId),
      accountId,
    );
  }

  // ✅ Mark all notifications as read
  @Patch('read-all')
  async markAllAsRead(
    @User('accountId') accountId: bigint,
  ) {
    return this.notificationsService.markAllAsRead(accountId);
  }

}