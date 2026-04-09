import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { MessagingService } from './messaging.service';
import { PrismaService } from '@/prisma/prisma.service';
import { NotificationsService } from '@/modules/notifications/notifications.service';

describe('MessagingService', () => {
  let service: MessagingService;
  const prisma = {
    conversation: {
      findUnique: jest.fn(),
    },
  };
  const notificationsService = { notifyAccount: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessagingService,
        { provide: PrismaService, useValue: prisma },
        { provide: NotificationsService, useValue: notificationsService },
      ],
    }).compile();

    service = module.get(MessagingService);
  });

  it('assertParticipant throws NotFound when conversation missing', async () => {
    prisma.conversation.findUnique.mockResolvedValue(null);
    await expect(
      service.assertParticipant(1n, 2n),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('assertParticipant throws Forbidden when account not participant', async () => {
    prisma.conversation.findUnique.mockResolvedValue({
      applicant_account_id: 3n,
      recruiter_account_id: 4n,
    });
    await expect(
      service.assertParticipant(1n, 2n),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('assertParticipant returns when account is applicant', async () => {
    prisma.conversation.findUnique.mockResolvedValue({
      applicant_account_id: 2n,
      recruiter_account_id: 4n,
    });
    await expect(
      service.assertParticipant(1n, 2n),
    ).resolves.toBeDefined();
  });
});
