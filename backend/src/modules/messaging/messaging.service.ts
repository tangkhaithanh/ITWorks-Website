import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { Prisma, Role } from '@prisma/client';
import { MESSAGE_BODY_MAX_LENGTH, MESSAGES_PAGE_SIZE } from './messaging.constants';

@Injectable()
export class MessagingService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async assertParticipant(conversationId: bigint, accountId: bigint) {
    const conv = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      select: {
        applicant_account_id: true,
        recruiter_account_id: true,
      },
    });
    if (!conv) throw new NotFoundException('Không tìm thấy cuộc hội thoại.');
    const ok =
      conv.applicant_account_id === accountId ||
      conv.recruiter_account_id === accountId;
    if (!ok) throw new ForbiddenException('Bạn không thuộc cuộc hội thoại này.');
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
          select: { id: true, body: true, created_at: true, sender_account_id: true },
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
      include: {
        sender: {
          select: {
            id: true,
            user: { select: { full_name: true, avatar_url: true } },
            company: { select: { name: true, logo_url: true } },
          },
        },
      },
    });

    const chronological = [...rows].reverse();
    const nextCursor =
      rows.length === take && rows.length > 0
        ? rows[rows.length - 1].id.toString()
        : null;

    return { messages: chronological, nextCursor };
  }

  async createMessage(
    conversationId: bigint,
    accountId: bigint,
    body: string,
  ) {
    const trimmed = body?.trim();
    if (!trimmed) throw new BadRequestException('Nội dung tin nhắn không được để trống.');
    if (trimmed.length > MESSAGE_BODY_MAX_LENGTH) {
      throw new BadRequestException(`Tối đa ${MESSAGE_BODY_MAX_LENGTH} ký tự.`);
    }

    await this.assertParticipant(conversationId, accountId);

    const msg = await this.prisma.message.create({
      data: {
        conversation_id: conversationId,
        sender_account_id: accountId,
        body: trimmed,
      },
      include: {
        sender: {
          select: {
            id: true,
            user: { select: { full_name: true, avatar_url: true } },
            company: { select: { name: true, logo_url: true } },
          },
        },
      },
    });

    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { updated_at: new Date() },
    });

    return msg;
  }
}
