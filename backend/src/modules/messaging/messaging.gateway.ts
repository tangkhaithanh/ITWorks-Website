import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayInit,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UsePipes, ValidationPipe } from '@nestjs/common';
import { WsAuthService } from '@/common/services/ws/ws-auth.service';
import { MessagingService } from './messaging.service';
import { MESSAGE_BODY_MAX_LENGTH } from './messaging.constants';
import { serializeSocketPayload } from '@/common/utils/serialize-socket-payload';

@WebSocketGateway({
  cors: {
    origin: 'http://localhost:5173',
    credentials: true,
  },
  namespace: '/chat',
})
export class MessagingGateway implements OnGatewayInit {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(MessagingGateway.name);

  constructor(
    private readonly wsAuthService: WsAuthService,
    private readonly messagingService: MessagingService,
  ) {}

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

  @SubscribeMessage('conversation:join')
  async handleJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { conversationId?: string },
  ) {
    const user = client.data.user;
    if (!user?.accountId) {
      return { event: 'error', data: { message: 'Unauthorized' } };
    }
    const raw = body?.conversationId;
    if (!raw) {
      return { event: 'error', data: { message: 'conversationId required' } };
    }
    let conversationId: bigint;
    try {
      conversationId = BigInt(raw);
    } catch {
      return { event: 'error', data: { message: 'Invalid conversationId' } };
    }

    try {
      await this.messagingService.assertParticipant(conversationId, user.accountId);
    } catch (e: any) {
      return { event: 'error', data: { message: e?.message || 'Forbidden' } };
    }

    const room = this.roomName(conversationId);
    await client.join(room);
    this.logger.log(`Socket ${client.id} joined ${room}`);
    return { event: 'conversation:joined', data: { conversationId: raw } };
  }

  @SubscribeMessage('conversation:leave')
  async handleLeave(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { conversationId?: string },
  ) {
    const raw = body?.conversationId;
    if (!raw) return { event: 'conversation:left', data: {} };
    try {
      const conversationId = BigInt(raw);
      await client.leave(this.roomName(conversationId));
    } catch {
      /* ignore */
    }
    return { event: 'conversation:left', data: { conversationId: raw } };
  }

  @SubscribeMessage('message:send')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async handleMessageSend(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { conversationId?: string; body?: string },
  ) {
    const user = client.data.user;
    if (!user?.accountId) {
      return { event: 'error', data: { message: 'Unauthorized' } };
    }
    const convIdRaw = body?.conversationId;
    const text = body?.body;
    if (!convIdRaw || text === undefined || text === null) {
      return { event: 'error', data: { message: 'conversationId và body là bắt buộc' } };
    }
    if (typeof text !== 'string' || text.trim().length === 0) {
      return { event: 'error', data: { message: 'Nội dung không hợp lệ' } };
    }
    if (text.length > MESSAGE_BODY_MAX_LENGTH) {
      return {
        event: 'error',
        data: { message: `Tối đa ${MESSAGE_BODY_MAX_LENGTH} ký tự` },
      };
    }

    let conversationId: bigint;
    try {
      conversationId = BigInt(convIdRaw);
    } catch {
      return { event: 'error', data: { message: 'Invalid conversationId' } };
    }

    try {
      const msg = await this.messagingService.createMessage(
        conversationId,
        user.accountId,
        text,
      );
      const payload = serializeSocketPayload({
        id: msg.id.toString(),
        conversation_id: conversationId.toString(),
        body: msg.body,
        created_at: msg.created_at,
        sender_account_id: msg.sender_account_id.toString(),
        sender: msg.sender,
        attachments: msg.attachments,
      });

      this.emitNewMessage(conversationId, payload);
      return {
        event: 'message:sent',
        data: payload,
      };
    } catch (e: any) {
      const status = e?.status || e?.statusCode;
      const msg = e?.response?.message || e?.message || 'Gửi tin nhắn thất bại';
      return { event: 'error', data: { message: msg, status } };
    }
  }

  emitNewMessage(
    conversationId: bigint,
    payload: {
      id: string;
      conversation_id: string;
      body: string;
      created_at: string;
      sender_account_id: string;
      sender: unknown;
      attachments?: unknown[];
    },
  ) {
    this.server.to(this.roomName(conversationId)).emit('message:new', payload);
  }

  private roomName(conversationId: bigint) {
    return `conversation:${conversationId.toString()}`;
  }
}
