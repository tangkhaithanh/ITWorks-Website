import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { WsJwtGuard } from '@/common/guards/ws-jwt.guard';
import { WsAuthService } from '@/common/services/ws/ws-auth.service';

@WebSocketGateway({
  cors: {
    origin: 'http://localhost:5173',
    credentials: true,
  },
  namespace: '/notifications',
})
export class NotificationsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationsGateway.name);
  private readonly userSockets = new Map<string, Set<string>>();

  constructor(private wsAuthService: WsAuthService) {}

  afterInit(server: Server) {
    server.use(async (socket: Socket, next) => {
      const user = await this.wsAuthService.authenticateSocket(socket);

      if (!user) {
        return next(new Error('Unauthorized'));
      }

      socket.data.user = user;
      next();
    });
  }

  handleConnection(@ConnectedSocket() client: Socket) {
    const user = client.data.user;
    if (!user?.accountId) {
      this.logger.warn(`Socket ${client.id} connected without accountId`);
      client.disconnect(true);
      return;
    }

    const accountId = user.accountId.toString();
    if (!this.userSockets.has(accountId)) {
      this.userSockets.set(accountId, new Set());
    }
    this.userSockets.get(accountId)!.add(client.id);
    // Tạo room:
    client.join(`account:${accountId}`);

    if (Array.isArray(user.roles)) {
      for (const role of user.roles) {
        client.join(`role:${role}`);
      }
    }

    this.logger.log(
      `Client connected: ${client.id} - Account: ${accountId} - Roles: ${user.roles?.join(', ')}`,
    );
  }

  handleDisconnect(@ConnectedSocket() client: Socket) {
    const user = client.data.user;

    if (user?.accountId) {
      const accountId = user.accountId.toString();

      this.userSockets.get(accountId)?.delete(client.id);

      if (this.userSockets.get(accountId)?.size === 0) {
        this.userSockets.delete(accountId);
      }

      this.logger.log(
        `Client disconnected: ${client.id} - Account: ${accountId}`,
      );
    }
  }

  @SubscribeMessage('ping')
  @UseGuards(WsJwtGuard)
  handlePing(@ConnectedSocket() client: Socket) {
    return {
      event: 'pong',
      data: { message: 'pong', timestamp: new Date().toISOString() },
    };
  }

  sendToAccount(accountId: bigint | number, event: string, data: any) {
    const id = accountId.toString();
    this.server.to(`account:${id}`).emit(event, data);

    this.logger.log(`Sent ${event} to account ${id}`);
  }

  sendToAccounts(accountIds: (bigint | number)[], event: string, data: any) {
    accountIds.forEach((id) => this.sendToAccount(id, event, data));
  }

  broadcast(event: string, data: any) {
    this.server.emit(event, data);
    this.logger.log(`Broadcasted ${event} to all users`);
  }

  sendToRole(role: string, event: string, data: any) {
    this.server.to(`role:${role}`).emit(event, data);
    this.logger.log(`Sent ${event} to role ${role}`);
  }
}
