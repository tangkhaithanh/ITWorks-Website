import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { User } from '@/common/decorators/user.decorator';
import { Role } from '@prisma/client';
import { MessagingService } from './messaging.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { StartConversationDto } from './dto/start-conversation.dto';
import { OpenConversationDto } from './dto/open-conversation.dto';
import { MessagingGateway } from './messaging.gateway';
import { serializeSocketPayload } from '@/common/utils/serialize-socket-payload';
import { CreateMessageWithAttachmentsDto } from './dto/create-message-with-attachments.dto';

@Controller('conversations')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MessagingController {
  constructor(
    private readonly messagingService: MessagingService,
    private readonly messagingGateway: MessagingGateway,
  ) {}

  @Get()
  @Roles(Role.candidate, Role.recruiter)
  async list(@User('accountId') accountId: bigint, @User('role') role: Role) {
    return this.messagingService.listConversations(accountId, role);
  }

  /** Recruiter: mở / tạo hội thoại với ứng viên theo job */
  @Post('start')
  @Roles(Role.recruiter)
  async startAsRecruiter(
    @User('accountId') accountId: bigint,
    @Body() dto: StartConversationDto,
  ) {
    return this.messagingService.findOrCreateConversation(
      BigInt(dto.job_id),
      BigInt(dto.applicant_account_id),
      accountId,
    );
  }

  /** Ứng viên: mở / tạo hội thoại với nhà tuyển dụng theo job */
  @Post('open')
  @Roles(Role.candidate)
  async openAsApplicant(
    @User('accountId') accountId: bigint,
    @Body() dto: OpenConversationDto,
  ) {
    return this.messagingService.findOrCreateAsApplicant(
      BigInt(dto.job_id),
      accountId,
    );
  }

  @Get(':id')
  @Roles(Role.candidate, Role.recruiter)
  async getOne(
    @Param('id') id: string,
    @User('accountId') accountId: bigint,
  ) {
    return this.messagingService.getConversationById(BigInt(id), accountId);
  }

  @Get(':id/messages')
  @Roles(Role.candidate, Role.recruiter)
  async listMessages(
    @Param('id') id: string,
    @User('accountId') accountId: bigint,
    @Query('before') before?: string,
    @Query('limit') limit?: string,
  ) {
    const beforeId = before ? BigInt(before) : undefined;
    const lim = limit ? parseInt(limit, 10) : undefined;
    return this.messagingService.listMessages(
      BigInt(id),
      accountId,
      beforeId,
      lim,
    );
  }

  @Post(':id/messages')
  @Roles(Role.candidate, Role.recruiter)
  async createMessage(
    @Param('id') id: string,
    @User('accountId') accountId: bigint,
    @Body() dto: CreateMessageDto,
  ) {
    const conversationId = BigInt(id);
    const msg = await this.messagingService.createMessage(
      conversationId,
      accountId,
      dto.body,
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

    this.messagingGateway.emitNewMessage(conversationId, payload);

    return msg;
  }

  @Post(':id/messages/with-attachments')
  @Roles(Role.candidate, Role.recruiter)
  @UseInterceptors(FilesInterceptor('files', 5))
  async createMessageWithAttachments(
    @Param('id') id: string,
    @User('accountId') accountId: bigint,
    @Body() dto: CreateMessageWithAttachmentsDto,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    const conversationId = BigInt(id);
    const msg = await this.messagingService.createMessageWithAttachments(
      conversationId,
      accountId,
      dto.body,
      files ?? [],
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

    this.messagingGateway.emitNewMessage(conversationId, payload);

    return msg;
  }
}
