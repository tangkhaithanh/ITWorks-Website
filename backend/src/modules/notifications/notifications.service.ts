import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { NotificationsGateway } from './notifications.gateway';
import { NotificationType } from '@prisma/client';
@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: NotificationsGateway,
  ) {}
  /**
   * Gửi notification cho 1 account (realtime + DB)
   */
  async notifyAccount(params: {
    accountId: bigint;
    type: NotificationType;
    message: string;
    realtimePayload?: any;
  }) {
    // 1️⃣ Lưu DB
    const notification = await this.prisma.notification.create({
      data: {
        account_id: params.accountId,
        type: params.type,
        message: params.message,
      },
    });

    // 2️⃣ Emit realtime
    this.gateway.sendToAccount(params.accountId, 'notification:new', {
      id: notification.id.toString(),
      type: notification.type,
      message: notification.message,
      is_read: notification.is_read,
      created_at: notification.created_at,
      payload: params.realtimePayload ?? null,
    });

    return notification;
  }

  /**
   * Gửi notification cho nhiều account
   */
  async notifyAccounts(params: {
    accountIds: bigint[];
    type: NotificationType;
    message: string;
    realtimePayload?: any;
  }) {
    if (!params.accountIds.length) return;

    // 1️⃣ Insert DB hàng loạt
    await this.prisma.notification.createMany({
      data: params.accountIds.map((accountId) => ({
        account_id: accountId,
        type: params.type,
        message: params.message,
      })),
    });

    // 2️⃣ Emit realtime
    this.gateway.sendToAccounts(params.accountIds, 'notification:new', {
      type: params.type,
      message: params.message,
      payload: params.realtimePayload ?? null,
    });
  }

  /**
   * Đánh dấu notification đã đọc
   */
  async markAsRead(notificationId: bigint, accountId: bigint) {
    return this.prisma.notification.updateMany({
      where: {
        id: notificationId,
        account_id: accountId,
      },
      data: {
        is_read: true,
      },
    });
  }
}