import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { AttachmentType, NotificationType, Prisma, Role } from '@prisma/client';
import {
  MESSAGE_ATTACHMENT_ALLOWED_MIME_TYPES,
  MESSAGE_ATTACHMENT_MAX_SIZE_BYTES,
  MESSAGE_ATTACHMENTS_MAX_FILES,
  MESSAGE_BODY_MAX_LENGTH,
  MESSAGES_PAGE_SIZE,
} from './messaging.constants';
import { NotificationsService } from '@/modules/notifications/notifications.service';
import { CloudinaryService } from '@/modules/cloudinary/cloudinary.service';

@Injectable()
export class MessagingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  private readonly messageInclude = {
    sender: {
      select: {
        id: true,
        user: { select: { full_name: true, avatar_url: true } },
        company: { select: { name: true, logo_url: true } },
      },
    },
    attachments: {
      select: {
        id: true,
        file_name: true,
        mime_type: true,
        size_bytes: true,
        file_url: true,
        type: true,
        created_at: true,
      },
    },
  } as const;

  async assertParticipant(conversationId: bigint, accountId: bigint) {
    const conv = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      select: {
        job_id: true,
        applicant_account_id: true,
        recruiter_account_id: true,
      },
    });
    if (!conv) throw new NotFoundException('Không tìm thấy cuộc hội thoại.');
    const ok =
      conv.applicant_account_id === accountId ||
      conv.recruiter_account_id === accountId;
    if (!ok)
      throw new ForbiddenException('Bạn không thuộc cuộc hội thoại này.');
    return conv;
  }

  async assertRecruiterOwnsJob(jobId: bigint, recruiterAccountId: bigint) {
    const job = await this.prisma.job.findFirst({
      where: { id: jobId },
      select: {
        company: { select: { account_id: true } },
      },
    });
    if (!job) throw new NotFoundException('Không tìm thấy tin tuyển dụng.');
    if (job.company.account_id !== recruiterAccountId) {
      throw new ForbiddenException('Bạn không quản lý tin tuyển dụng này.');
    }
    return job;
  }

  async ensureApplicantAccountIsCandidate(applicantAccountId: bigint) {
    const acc = await this.prisma.account.findUnique({
      where: { id: applicantAccountId },
      select: { role: true },
    });
    if (!acc) throw new NotFoundException('Không tìm thấy tài khoản ứng viên.');
    if (acc.role !== Role.candidate) {
      throw new BadRequestException('Tài khoản đích phải là ứng viên.');
    }
  }

  async findOrCreateConversation(
    jobId: bigint,
    applicantAccountId: bigint,
    actorAccountId: bigint,
  ) {
    const job = await this.assertRecruiterOwnsJob(jobId, actorAccountId);
    await this.ensureApplicantAccountIsCandidate(applicantAccountId);

    return this.prisma.conversation.upsert({
      where: {
        job_id_applicant_account_id: {
          job_id: jobId,
          applicant_account_id: applicantAccountId,
        },
      },
      create: {
        job_id: jobId,
        applicant_account_id: applicantAccountId,
        recruiter_account_id: job.company.account_id,
      },
      update: {},
      include: this.conversationListInclude(),
    });
  }

  /** Ứng viên mở chat với job — recruiter lấy từ company. */
  async findOrCreateAsApplicant(jobId: bigint, applicantAccountId: bigint) {
    const job = await this.prisma.job.findFirst({
      where: { id: jobId },
      select: {
        id: true,
        company: { select: { account_id: true } },
      },
    });
    if (!job) throw new NotFoundException('Không tìm thấy tin tuyển dụng.');
    await this.ensureApplicantAccountIsCandidate(applicantAccountId);

    return this.prisma.conversation.upsert({
      where: {
        job_id_applicant_account_id: {
          job_id: jobId,
          applicant_account_id: applicantAccountId,
        },
      },
      create: {
        job_id: jobId,
        applicant_account_id: applicantAccountId,
        recruiter_account_id: job.company.account_id,
      },
      update: {},
      include: this.conversationListInclude(),
    });
  }

  async ensureConversationOnApply(
    tx: Prisma.TransactionClient,
    jobId: bigint,
    candidateId: bigint,
    recruiterAccountId: bigint,
  ) {
    const candidate = await tx.candidate.findUniqueOrThrow({
      where: { id: candidateId },
      include: { user: { select: { account_id: true } } },
    });
    const applicantAccountId = candidate.user.account_id;

    await tx.conversation.upsert({
      where: {
        job_id_applicant_account_id: {
          job_id: jobId,
          applicant_account_id: applicantAccountId,
        },
      },
      create: {
        job_id: jobId,
        applicant_account_id: applicantAccountId,
        recruiter_account_id: recruiterAccountId,
      },
      update: {},
    });
  }

  private conversationListInclude() {
    return {
      job: {
        select: {
          id: true,
          title: true,
          company: { select: { id: true, name: true, logo_url: true } },
        },
      },
      applicant_account: {
        select: {
          id: true,
          user: {
            select: { full_name: true, avatar_url: true },
          },
        },
      },
      recruiter_account: {
        select: {
          id: true,
          company: { select: { name: true, logo_url: true } },
        },
      },
    } as const;
  }

  async listConversations(accountId: bigint, role: Role) {
    const where =
      role === Role.candidate
        ? { applicant_account_id: accountId }
        : { recruiter_account_id: accountId };

    return this.prisma.conversation.findMany({
      where,
      orderBy: { updated_at: 'desc' },
      include: {
        ...this.conversationListInclude(),
        messages: {
          take: 1,
          orderBy: { created_at: 'desc' },
          select: {
            id: true,
            body: true,
            created_at: true,
            sender_account_id: true,
            attachments: {
              select: {
                id: true,
                file_name: true,
                mime_type: true,
                type: true,
              },
            },
          },
        },
      },
    });
  }

  async getConversationById(conversationId: bigint, accountId: bigint) {
    await this.assertParticipant(conversationId, accountId);
    return this.prisma.conversation.findUniqueOrThrow({
      where: { id: conversationId },
      include: this.conversationListInclude(),
    });
  }

  async listMessages(
    conversationId: bigint,
    accountId: bigint,
    beforeId?: bigint,
    limit = MESSAGES_PAGE_SIZE,
  ) {
    await this.assertParticipant(conversationId, accountId);

    const take = Math.min(Math.max(limit, 1), 100);
    const where: Prisma.MessageWhereInput = { conversation_id: conversationId };
    if (beforeId) {
      where.id = { lt: beforeId };
    }

    const rows = await this.prisma.message.findMany({
      where,
      orderBy: { id: 'desc' },
      take,
      include: this.messageInclude,
    });

    const chronological = [...rows].reverse();
    const nextCursor =
      rows.length === take && rows.length > 0
        ? rows[rows.length - 1].id.toString()
        : null;

    return { messages: chronological, nextCursor };
  }

  async createMessage(conversationId: bigint, accountId: bigint, body: string) {
    const trimmed = body?.trim();
    if (!trimmed)
      throw new BadRequestException('Nội dung tin nhắn không được để trống.');
    if (trimmed.length > MESSAGE_BODY_MAX_LENGTH) {
      throw new BadRequestException(`Tối đa ${MESSAGE_BODY_MAX_LENGTH} ký tự.`);
    }

    const conv = await this.assertParticipant(conversationId, accountId);

    const msg = await this.prisma.message.create({
      data: {
        conversation_id: conversationId,
        sender_account_id: accountId,
        body: trimmed,
      },
      include: this.messageInclude,
    });

    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { updated_at: new Date() },
    });

    const recipientAccountId =
      conv.applicant_account_id === accountId
        ? conv.recruiter_account_id
        : conv.applicant_account_id;

    if (recipientAccountId !== accountId) {
      await this.notificationsService.notifyAccount({
        accountId: recipientAccountId,
        type: 'message' as NotificationType,
        message: 'Bạn có tin nhắn mới',
        realtimePayload: {
          conversationId: conversationId.toString(),
          jobId: conv.job_id.toString(),
          messagePreview: msg.body.slice(0, 120),
        },
      });
    }

    return msg;
  }

  private assertValidAttachments(files: Express.Multer.File[]) {
    if (!files?.length) {
      throw new BadRequestException('Cần ít nhất 1 file đính kèm.');
    }

    if (files.length > MESSAGE_ATTACHMENTS_MAX_FILES) {
      throw new BadRequestException(
        `Tối đa ${MESSAGE_ATTACHMENTS_MAX_FILES} files mỗi tin nhắn.`,
      );
    }

    for (const file of files) {
      if (
        !MESSAGE_ATTACHMENT_ALLOWED_MIME_TYPES.includes(file.mimetype as any)
      ) {
        throw new BadRequestException(
          `Định dạng file không hỗ trợ: ${file.originalname}`,
        );
      }

      if (file.size > MESSAGE_ATTACHMENT_MAX_SIZE_BYTES) {
        throw new BadRequestException(
          `File quá lớn: ${file.originalname} (tối đa ${Math.floor(
            MESSAGE_ATTACHMENT_MAX_SIZE_BYTES / (1024 * 1024),
          )}MB)`,
        );
      }
    }
  }

  private getAttachmentType(mimeType: string): AttachmentType {
    return mimeType.startsWith('image/')
      ? AttachmentType.image
      : AttachmentType.file;
  }

  async createMessageWithAttachments(
    conversationId: bigint,
    accountId: bigint,
    body: string | undefined,
    files: Express.Multer.File[],
  ) {
    const trimmed = body?.trim() ?? '';
    if (trimmed.length > MESSAGE_BODY_MAX_LENGTH) {
      throw new BadRequestException(`Tối đa ${MESSAGE_BODY_MAX_LENGTH} ký tự.`);
    }
    if (!trimmed && (!files || files.length === 0)) {
      throw new BadRequestException(
        'Tin nhắn phải có nội dung hoặc file đính kèm.',
      );
    }

    if (files?.length) {
      this.assertValidAttachments(files);
    }

    const conv = await this.assertParticipant(conversationId, accountId);

    const uploaded = await Promise.all(
      (files || []).map(async (file) => {
        const result = await this.cloudinaryService.uploadChatAttachment(
          file,
          'messaging/attachments',
        );

        return {
          file_name: file.originalname,
          mime_type: file.mimetype,
          size_bytes: file.size,
          file_url: result.secure_url,
          file_public_id: result.public_id,
          type: this.getAttachmentType(file.mimetype),
        };
      }),
    );

    const msg = await this.prisma.$transaction(async (tx) => {
      const created = await tx.message.create({
        data: {
          conversation_id: conversationId,
          sender_account_id: accountId,
          body: trimmed,
          attachments:
            uploaded.length > 0
              ? {
                  create: uploaded,
                }
              : undefined,
        },
        include: this.messageInclude,
      });

      await tx.conversation.update({
        where: { id: conversationId },
        data: { updated_at: new Date() },
      });

      return created;
    });

    const recipientAccountId =
      conv.applicant_account_id === accountId
        ? conv.recruiter_account_id
        : conv.applicant_account_id;

    if (recipientAccountId !== accountId) {
      await this.notificationsService.notifyAccount({
        accountId: recipientAccountId,
        type: 'message' as NotificationType,
        message: 'Bạn có tin nhắn mới',
        realtimePayload: {
          conversationId: conversationId.toString(),
          jobId: conv.job_id.toString(),
          messagePreview: msg.body?.slice(0, 120) || '[Attachment]',
        },
      });
    }

    return msg;
  }
}
