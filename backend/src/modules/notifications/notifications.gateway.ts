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
    
    if (user && user.userId) {
      const userId = user.userId.toString();
      
      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, new Set());
      }
      this.userSockets.get(userId)?.add(client.id);
      this.logger.log(`Client connected: ${client.id} - User: ${userId}`);
      client.join(`user:${userId}`);
    }
  }

  handleDisconnect(@ConnectedSocket() client: Socket) {
    const user = client.data.user;
    if (user && user.userId) {
      const userId = user.userId.toString();
      this.userSockets.get(userId)?.delete(client.id);
      
      if (this.userSockets.get(userId)?.size === 0) {
        this.userSockets.delete(userId);
      }

      this.logger.log(`Client disconnected: ${client.id} - User: ${userId}`);
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

  sendToUser(userId: string | number, event: string, data: any) {
    const userIdStr = userId.toString();
    this.server.to(`user:${userIdStr}`).emit(event, data);
    this.logger.log(`Sent ${event} to user ${userIdStr}`);
  }

  sendToUsers(userIds: (string | number)[], event: string, data: any) {
    userIds.forEach((userId) => {
      this.sendToUser(userId, event, data);
    });
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
