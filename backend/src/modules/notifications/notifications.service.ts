import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { NotificationsGateway } from './notifications.gateway';
import { NotificationType } from '@prisma/client';
import { NotFoundException } from '@nestjs/common';
@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: NotificationsGateway,
  ) { }
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
   * Đánh dấu 1 notification đã đọc
   */
  async markAsRead(notificationId: bigint, accountId: bigint) {
    const result = await this.prisma.notification.updateMany({
      where: {
        id: notificationId,
        account_id: accountId,
      },
      data: {
        is_read: true,
      },
    });

    return {
      message: 'Marked as read',
    };
  }
  // Đánh dấu tất cả đã đọc:
  async markAllAsRead(accountId: bigint) {
    try {
      const result = await this.prisma.notification.updateMany({
        where: {
          account_id: accountId,
          is_read: false,
        },
        data: {
          is_read: true,
        },
      });

      if (result.count === 0) {
        throw new NotFoundException('No unread notifications found');
      }

      return {
        message: 'Marked all notifications as read',
        updatedCount: result.count,
      };
    } catch (error) {
      console.error('❌ Error in markAllAsRead:', error);

      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error('Failed to mark all notifications as read');
    }
  }


  // Lấy toàn bộ thông báo của 1 user:
  async getAllNotificationsByAccountId(
    accountId: bigint,
    options?: {
      limit?: number;
      cursor?: string;
    },
  ) {
    const limit = Math.min(Math.max(options?.limit || 10, 1), 50);

    const notifications = await this.prisma.notification.findMany({
      where: {
        account_id: accountId,
      },
      orderBy: {
        id: 'desc',
      },
      take: limit + 1,
      ...(options?.cursor
        ? {
          cursor: {
            id: BigInt(options.cursor),
          },
          skip: 1,
        }
        : {}),
    });
    const hasMore = notifications.length > limit;
    const items = hasMore ? notifications.slice(0, limit) : notifications;

    return {
      items: items.map((item) => ({
        id: item.id.toString(),
        account_id: item.account_id.toString(),
        type: item.type,
        message: item.message,
        is_read: item.is_read,
        created_at: item.created_at,
        updated_at: item.updated_at,
      })),
      nextCursor: hasMore ? items[items.length - 1].id.toString() : null,
      hasMore,
    };
  }
}