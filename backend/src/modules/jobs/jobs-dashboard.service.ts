import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { JobDashboardQueryDto } from './dto/job-dashboard-query.dto';
import { NotFoundException } from '@nestjs/common';
import { ApplicationStatus } from '@prisma/client';
@Injectable()
export class JobDashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getJobDashboard(jobId: bigint, query: JobDashboardQueryDto) {
    const job = await this.getBaseJobOrThrow(jobId);

    const summary = this.buildSummary(job);
    const funnel = await this.buildFunnel(jobId);
    const timeline = await this.buildTimeline(job, jobId, query);
    const { latest_candidates, latest_pagination } =
      await this.getLatestCandidates(jobId, query);

    return {
      job: {
        id: job.id,
        title: job.title,
        status: job.status,
      },
      summary,
      funnel,
      timeline,
      latest_candidates,
      latest_pagination,
    };
  }

  // ===============================
  // 1. BASE JOB
  // ===============================
  private async getBaseJobOrThrow(jobId: bigint) {
    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
      include: {
        _count: {
          select: {
            applications: true,
            saved_jobs: true,
          },
        },
      },
    });

    if (!job) {
      throw new NotFoundException('Không tìm thấy công việc');
    }

    return job;
  }

  // ===============================
  // 2. SUMMARY
  // ===============================
  private buildSummary(job: any) {
    const now = new Date();
    let days_left: number | null = null;

    if (job.deadline) {
      const diffMs = job.deadline.getTime() - now.getTime();
      days_left = Math.ceil(diffMs / 86_400_000);
    }

    return {
      views_count: job.views_count,
      applications_count: job._count.applications,
      saved_count: job._count.saved_jobs,
      openings: job.number_of_openings,
      created_at: job.created_at,
      deadline: job.deadline,
      days_left,
      status: job.status,
    };
  }

  // ===============================
  // 3. FUNNEL
  // ===============================
  private async buildFunnel(jobId: bigint) {
    const raw = await this.prisma.application.groupBy({
      by: ['status'],
      where: { job_id: jobId },
      _count: { _all: true },
    });

    const allStatuses: ApplicationStatus[] = [
      'pending',
      'interviewing',
      'accepted',
      'rejected',
      'withdrawn',
    ];

    const by_status = allStatuses.map((status) => {
      const row = raw.find((r) => r.status === status);
      return {
        status,
        count: row ? row._count._all : 0,
      };
    });

    return {
      total: by_status.reduce((s, i) => s + i.count, 0),
      by_status,
    };
  }

  // ===============================
  // 4. TIMELINE
  // ===============================
  private async buildTimeline(
    job: any,
    jobId: bigint,
    query: JobDashboardQueryDto,
  ) {
    const { fromDate, toDate } = this.resolveDateRange(job, query);

    const applications = await this.prisma.application.findMany({
      where: {
        job_id: jobId,
        applied_at: { gte: fromDate, lte: toDate },
      },
      select: { applied_at: true },
    });

    const buckets = this.initDateBuckets(fromDate, toDate);

    for (const app of applications) {
      const key = this.formatLocalDate(app.applied_at);
      if (buckets[key] !== undefined) buckets[key]++;
    }

    return {
      range: { from: fromDate, to: toDate },
      points: Object.entries(buckets).map(([date, count]) => ({
        date,
        applications_count: count,
      })),
    };
  }

  // ===============================
  // 5. LATEST CANDIDATES
  // ===============================
  private async getLatestCandidates(
    jobId: bigint,
    query: JobDashboardQueryDto,
  ) {
    const limit = query.latest_limit ?? 10;
    const page = query.latest_page ?? 1;
    const skip = (page - 1) * limit;

    const total = await this.prisma.application.count({
      where: { job_id: jobId },
    });

    const apps = await this.prisma.application.findMany({
      where: { job_id: jobId },
      orderBy: { applied_at: 'desc' },
      skip,
      take: limit,
      include: {
        candidate: { include: { user: true } },
        cv: true,
      },
    });

    return {
      latest_candidates: apps.map((app) => ({
        application_id: app.id,
        status: app.status,
        applied_at: app.applied_at,
        candidate: {
          id: app.candidate_id,
          full_name: app.candidate.user.full_name,
          avatar_url: app.candidate.user.avatar_url,
        },
        cv: {
          id: app.cv_id,
          title: app.cv.title,
          file_url: app.cv.file_url,
          type: app.cv.type,
        },
      })),
      latest_pagination: {
        page,
        limit,
        total_items: total,
        total_pages: Math.ceil(total / limit),
      },
    };
  }

  // ===============================
  // HELPERS
  // ===============================
  private resolveDateRange(job: any, query: JobDashboardQueryDto) {
    const now = new Date();
    let fromDate: Date;
    let toDate: Date = now;

    if (query.from && query.to) {
      fromDate = this.parseLocalDate(query.from);
      toDate = this.parseLocalDate(query.to);
    } else {
      const range = query.range || '30d';
      const map: Record<string, number> = {
        '7d': 7,
        '14d': 14,
        '30d': 30,
      };

      if (range === 'all') {
        fromDate = new Date(job.created_at);
      } else {
        const days = map[range] ?? 30;
        fromDate = new Date(now);
        fromDate.setHours(0, 0, 0, 0);
        fromDate.setDate(fromDate.getDate() - (days - 1));
      }
    }

    if (fromDate > toDate) [fromDate, toDate] = [toDate, fromDate];
    return { fromDate, toDate };
  }

  private initDateBuckets(from: Date, to: Date) {
    const buckets: Record<string, number> = {};
    const cursor = new Date(
      from.getFullYear(),
      from.getMonth(),
      from.getDate(),
    );
    const end = new Date(to.getFullYear(), to.getMonth(), to.getDate());

    while (cursor <= end) {
      buckets[this.formatLocalDate(cursor)] = 0;
      cursor.setDate(cursor.getDate() + 1);
    }
    return buckets;
  }

  private parseLocalDate(dateStr: string): Date {
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d);
  }

  private formatLocalDate(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
}
