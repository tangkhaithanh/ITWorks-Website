/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-argument, @typescript-eslint/require-await */
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import {
  JobStatus,
  NotificationType,
  ReportStatus,
  ReportTargetType,
} from '@prisma/client';
import { ReportsService } from './reports.service';

describe('ReportsService', () => {
  const prisma = {
    report: {
      findFirst: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    job: {
      findUnique: jest.fn(),
    },
    company: {
      findUnique: jest.fn(),
    },
    account: {
      findMany: jest.fn(),
    },
    reportStatusHistory: {
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  };
  const notificationsService = {
    notifyAccounts: jest.fn(),
  };
  const jobsService = {
    updateStatus: jest.fn(),
  };

  let service: ReportsService;

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.$transaction.mockImplementation(async (callback) =>
      callback({
        report: prisma.report,
        reportStatusHistory: prisma.reportStatusHistory,
      }),
    );
    service = new ReportsService(
      prisma as any,
      notificationsService as any,
      jobsService as any,
    );
  });

  it('creates a job report and notifies admins', async () => {
    prisma.job.findUnique.mockResolvedValue({
      id: 10n,
      status: JobStatus.active,
      company: { status: 'approved' },
    });
    prisma.report.findFirst.mockResolvedValue(null);
    prisma.report.create.mockResolvedValue({
      id: 1n,
      reporter_account_id: 2n,
      target_type: ReportTargetType.job,
      job_id: 10n,
      company_id: null,
      reason: 'Suspicious job content',
      status: ReportStatus.pending,
      created_at: new Date('2026-05-20T00:00:00Z'),
      updated_at: new Date('2026-05-20T00:00:00Z'),
      reporter: { email: 'user@example.com', user: { full_name: 'User' } },
      job: {
        id: 10n,
        title: 'Job A',
        status: JobStatus.active,
        company_id: 3n,
      },
      company: null,
    });
    prisma.account.findMany.mockResolvedValue([{ id: 99n }]);

    const result = await service.createReport(2n, {
      targetType: ReportTargetType.job,
      targetId: '10',
      reason: '  Suspicious job content  ',
    });

    expect(result.id).toBe('1');
    expect(prisma.report.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          reporter_account_id: 2n,
          target_type: ReportTargetType.job,
          job_id: 10n,
          reason: 'Suspicious job content',
        }),
      }),
    );
    expect(notificationsService.notifyAccounts).toHaveBeenCalledWith(
      expect.objectContaining({
        accountIds: [99n],
        type: NotificationType.report,
      }),
    );
  });

  it('rejects duplicate active reports from the same reporter and target', async () => {
    prisma.job.findUnique.mockResolvedValue({
      id: 10n,
      status: JobStatus.active,
      company: { status: 'approved' },
    });
    prisma.report.findFirst.mockResolvedValue({ id: 1n });

    await expect(
      service.createReport(2n, {
        targetType: ReportTargetType.job,
        targetId: '10',
        reason: 'Suspicious job content',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects unavailable job targets', async () => {
    prisma.job.findUnique.mockResolvedValue({
      id: 10n,
      status: JobStatus.closed,
      company: { status: 'approved' },
    });

    await expect(
      service.createReport(2n, {
        targetType: ReportTargetType.job,
        targetId: '10',
        reason: 'Suspicious job content',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('lists reports with admin filters and pagination', async () => {
    prisma.report.findMany.mockResolvedValue([]);
    prisma.report.count.mockResolvedValue(0);

    const result = await service.listAdminReports({
      status: ReportStatus.pending,
      targetType: ReportTargetType.company,
      page: 2,
      limit: 5,
    });

    expect(result).toEqual({ items: [], page: 2, limit: 5, total: 0 });
    expect(prisma.report.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          status: ReportStatus.pending,
          target_type: ReportTargetType.company,
        },
        skip: 5,
        take: 5,
      }),
    );
  });

  it('records status transition history', async () => {
    prisma.report.findUnique
      .mockResolvedValueOnce({ id: 1n, status: ReportStatus.pending })
      .mockResolvedValueOnce({
        id: 1n,
        reporter_account_id: 2n,
        target_type: ReportTargetType.job,
        job_id: 10n,
        reason: 'Suspicious',
        status: ReportStatus.under_review,
        created_at: new Date(),
        updated_at: new Date(),
        reporter: {},
        job: {},
        company: null,
        histories: [],
      });

    await service.updateReportStatus(1n, 99n, {
      status: ReportStatus.under_review,
      note: 'Checking',
    });

    expect(prisma.report.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 1n },
        data: expect.objectContaining({
          status: ReportStatus.under_review,
          reviewed_by_account_id: 99n,
        }),
      }),
    );
    expect(prisma.reportStatusHistory.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          from_status: ReportStatus.pending,
          to_status: ReportStatus.under_review,
          action: 'status_update',
        }),
      }),
    );
  });

  it('rejects invalid terminal status transitions', async () => {
    prisma.report.findUnique.mockResolvedValue({
      id: 1n,
      status: ReportStatus.resolved,
    });

    await expect(
      service.updateReportStatus(1n, 99n, {
        status: ReportStatus.under_review,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('closes a reported job and resolves the report', async () => {
    prisma.report.findUnique
      .mockResolvedValueOnce({
        id: 1n,
        status: ReportStatus.under_review,
        target_type: ReportTargetType.job,
        job_id: 10n,
        job: { id: 10n, status: JobStatus.active },
      })
      .mockResolvedValueOnce({
        id: 1n,
        reporter_account_id: 2n,
        target_type: ReportTargetType.job,
        job_id: 10n,
        reason: 'Suspicious',
        status: ReportStatus.resolved,
        created_at: new Date(),
        updated_at: new Date(),
        reporter: {},
        job: {},
        company: null,
        histories: [],
      });
    jobsService.updateStatus.mockResolvedValue({ message: 'ok' });

    await service.closeReportedJob(1n, 99n, {
      note: 'Fraudulent',
      resolveReport: true,
    });

    expect(jobsService.updateStatus).toHaveBeenCalledWith(
      10n,
      JobStatus.closed,
    );
    expect(prisma.reportStatusHistory.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: 'job_closed',
          to_status: ReportStatus.resolved,
        }),
      }),
    );
  });
});
