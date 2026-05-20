import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  JobStatus,
  NotificationType,
  ReportStatus,
  ReportTargetType,
  Role,
  Status,
} from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { NotificationsService } from '@/modules/notifications/notifications.service';
import { JobsService } from '@/modules/jobs/jobs.service';
import { CreateReportDto } from './dto/create-report.dto';
import { AdminReportQueryDto } from './dto/admin-report-query.dto';
import { UpdateReportStatusDto } from './dto/update-report-status.dto';
import { CloseReportedJobDto } from './dto/close-reported-job.dto';
import { mapReportDetail, mapReportSummary } from './report.mapper';

const ACTIVE_REPORT_STATUSES: ReportStatus[] = [
  ReportStatus.pending,
  ReportStatus.under_review,
];

const ALLOWED_TRANSITIONS: Record<ReportStatus, ReportStatus[]> = {
  [ReportStatus.pending]: [
    ReportStatus.under_review,
    ReportStatus.resolved,
    ReportStatus.dismissed,
  ],
  [ReportStatus.under_review]: [ReportStatus.resolved, ReportStatus.dismissed],
  [ReportStatus.resolved]: [],
  [ReportStatus.dismissed]: [],
};

type ReportNotificationPayload = {
  id: bigint;
  target_type: ReportTargetType;
  job_id?: bigint | null;
  company_id?: bigint | null;
  job?: { title?: string | null } | null;
  company?: { name?: string | null } | null;
};

@Injectable()
export class ReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly jobsService: JobsService,
  ) {}

  async createReport(reporterAccountId: bigint, dto: CreateReportDto) {
    const targetId = this.parseTargetId(dto.targetId);
    const reason = dto.reason.trim();

    if (dto.targetType === ReportTargetType.job) {
      await this.ensureReportableJob(targetId);
    } else {
      await this.ensureReportableCompany(targetId);
    }

    const duplicate = await this.prisma.report.findFirst({
      where: {
        reporter_account_id: reporterAccountId,
        target_type: dto.targetType,
        status: { in: ACTIVE_REPORT_STATUSES },
        ...(dto.targetType === ReportTargetType.job
          ? { job_id: targetId }
          : { company_id: targetId }),
      },
      select: { id: true },
    });

    if (duplicate) {
      throw new ConflictException(
        'Bạn đã gửi báo cáo cho mục này và báo cáo đang chờ xử lý',
      );
    }

    const report = await this.prisma.report.create({
      data: {
        reporter_account_id: reporterAccountId,
        target_type: dto.targetType,
        reason,
        ...(dto.targetType === ReportTargetType.job
          ? { job_id: targetId }
          : { company_id: targetId }),
      },
      include: this.summaryInclude(),
    });

    await this.notifyAdmins(report);

    return mapReportSummary(report);
  }

  async listAdminReports(query: AdminReportQueryDto) {
    const page = Math.max(Number(query.page ?? 1), 1);
    const limit = Math.min(Math.max(Number(query.limit ?? 10), 1), 50);
    const where = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.targetType ? { target_type: query.targetType } : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.report.findMany({
        where,
        include: this.summaryInclude(),
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.report.count({ where }),
    ]);

    return {
      items: items.map(mapReportSummary),
      page,
      limit,
      total,
    };
  }

  async getAdminReportDetail(reportId: bigint) {
    const report = await this.findReportDetail(reportId);
    return mapReportDetail(report);
  }

  async updateReportStatus(
    reportId: bigint,
    adminAccountId: bigint,
    dto: UpdateReportStatusDto,
  ) {
    const report = await this.prisma.report.findUnique({
      where: { id: reportId },
      select: { id: true, status: true },
    });

    if (!report) {
      throw new NotFoundException('Không tìm thấy báo cáo');
    }

    this.assertAllowedTransition(report.status, dto.status);

    await this.prisma.$transaction(async (tx) => {
      await tx.report.update({
        where: { id: reportId },
        data: {
          status: dto.status,
          latest_admin_note: dto.note || null,
          reviewed_by_account_id: adminAccountId,
          reviewed_at: new Date(),
        },
      });

      await tx.reportStatusHistory.create({
        data: {
          report_id: reportId,
          changed_by_account_id: adminAccountId,
          from_status: report.status,
          to_status: dto.status,
          note: dto.note || null,
          action: 'status_update',
        },
      });
    });

    return this.getAdminReportDetail(reportId);
  }

  async closeReportedJob(
    reportId: bigint,
    adminAccountId: bigint,
    dto: CloseReportedJobDto,
  ) {
    const report = await this.prisma.report.findUnique({
      where: { id: reportId },
      include: { job: true },
    });

    if (!report) {
      throw new NotFoundException('Không tìm thấy báo cáo');
    }

    if (report.target_type !== ReportTargetType.job || !report.job_id) {
      throw new BadRequestException(
        'Báo cáo này không thuộc về tin tuyển dụng',
      );
    }

    if (!ACTIVE_REPORT_STATUSES.includes(report.status)) {
      throw new BadRequestException(
        'Không thể đóng tin tuyển dụng từ báo cáo đã xử lý hoặc đã bỏ qua',
      );
    }

    if (!report.job) {
      throw new NotFoundException('Không tìm thấy tin tuyển dụng bị báo cáo');
    }

    if (report.job.status === JobStatus.closed) {
      throw new BadRequestException('Tin tuyển dụng đã được đóng');
    }

    await this.jobsService.updateStatus(report.job_id, JobStatus.closed);

    const nextStatus =
      dto.resolveReport === false ? report.status : ReportStatus.resolved;

    await this.prisma.$transaction(async (tx) => {
      await tx.report.update({
        where: { id: reportId },
        data: {
          status: nextStatus,
          latest_admin_note: dto.note || null,
          reviewed_by_account_id: adminAccountId,
          reviewed_at: new Date(),
        },
      });

      await tx.reportStatusHistory.create({
        data: {
          report_id: reportId,
          changed_by_account_id: adminAccountId,
          from_status: report.status,
          to_status: nextStatus,
          note: dto.note || null,
          action: 'job_closed',
        },
      });
    });

    return this.getAdminReportDetail(reportId);
  }

  private parseTargetId(targetId: string) {
    try {
      const parsed = BigInt(targetId);
      if (parsed <= 0n) {
        throw new Error('Invalid id');
      }
      return parsed;
    } catch {
      throw new BadRequestException('Mã đối tượng báo cáo không hợp lệ');
    }
  }

  private async ensureReportableJob(jobId: bigint) {
    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
      select: {
        id: true,
        status: true,
        company: { select: { status: true } },
      },
    });

    if (
      !job ||
      job.status !== JobStatus.active ||
      job.company.status !== 'approved'
    ) {
      throw new NotFoundException('Tin tuyển dụng không khả dụng để báo cáo');
    }
  }

  private async ensureReportableCompany(companyId: bigint) {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      select: { id: true, status: true },
    });

    if (!company || company.status !== 'approved') {
      throw new NotFoundException('Công ty không khả dụng để báo cáo');
    }
  }

  private assertAllowedTransition(
    currentStatus: ReportStatus,
    nextStatus: ReportStatus,
  ) {
    if (currentStatus === nextStatus) {
      return;
    }

    if (!ALLOWED_TRANSITIONS[currentStatus].includes(nextStatus)) {
      throw new BadRequestException(
        `Không thể chuyển báo cáo từ '${currentStatus}' sang '${nextStatus}'`,
      );
    }
  }

  private async notifyAdmins(report: ReportNotificationPayload) {
    const admins = await this.prisma.account.findMany({
      where: {
        role: Role.admin,
        status: Status.active,
      },
      select: { id: true },
    });

    if (!admins.length) {
      return;
    }

    await this.notificationsService.notifyAccounts({
      accountIds: admins.map((admin) => admin.id),
      type: NotificationType.report,
      message: `Báo cáo mới cần xem xét: ${report.target_type === ReportTargetType.job ? 'tin tuyển dụng' : 'công ty'} ${report.job?.title ?? report.company?.name ?? ''}`,
      realtimePayload: {
        reportId: report.id.toString(),
        targetType: report.target_type,
        targetId:
          report.target_type === ReportTargetType.job
            ? report.job_id?.toString()
            : report.company_id?.toString(),
      },
    });
  }

  private async findReportDetail(reportId: bigint) {
    const report = await this.prisma.report.findUnique({
      where: { id: reportId },
      include: {
        ...this.summaryInclude(),
        job: {
          include: {
            company: { select: { id: true, name: true } },
          },
        },
        company: true,
        histories: {
          include: {
            changed_by: {
              include: { user: { select: { full_name: true } } },
            },
          },
          orderBy: { created_at: 'asc' },
        },
      },
    });

    if (!report) {
      throw new NotFoundException('Không tìm thấy báo cáo');
    }

    return report;
  }

  private summaryInclude() {
    return {
      reporter: {
        include: { user: { select: { full_name: true } } },
      },
      job: {
        select: {
          id: true,
          title: true,
          status: true,
          company_id: true,
          company: { select: { id: true, name: true } },
        },
      },
      company: {
        select: {
          id: true,
          name: true,
          status: true,
          account_id: true,
        },
      },
    };
  }
}
