// src/dashboard/dashboard.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { RecruiterDashboardQueryDto } from './dto/recruiter-dashboard-query.dto';
import { AdminDashboardQueryDto } from './dto/admin-dashboard-query.dto';
type RevenueBucket = 'day' | 'month';
@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) { }

  /**
   * Lấy Dashboard cho account recruiter (tự suy ra company theo account_id).
   */
  async getRecruiterDashboard(accountId: bigint, query: RecruiterDashboardQueryDto) {
    // Tìm company theo account hiện tại
    const company = await this.prisma.company.findUnique({
      where: { account_id: accountId },
    });

    if (!company) {
      throw new NotFoundException('Không tìm thấy công ty cho tài khoản hiện tại');
    }

    const companyId = company.id;

    const now = new Date();

    const {
      topJobsLimit = 5,
      recentApplicationsLimit = 5,
      upcomingInterviewsLimit = 5,
    } = query;

    // 1. KPI tổng quan
    const kpis = await this.buildKpis(companyId, now);

    // 2. Biểu đồ line: ứng tuyển theo ngày
    const applicationTimeline = await this.buildApplicationTimeline(companyId, query, now);

    // 3. Top job đang tuyển
    const topJobs = await this.buildTopActiveJobs(companyId, topJobsLimit);

    // 4. Ứng viên mới ứng tuyển gần đây
    const recentApplications = await this.buildRecentApplications(companyId, recentApplicationsLimit);

    // 5. Lịch phỏng vấn sắp diễn ra
    const upcomingInterviews = await this.buildUpcomingInterviews(
      companyId,
      upcomingInterviewsLimit,
      now,
    );

    return {
      company: {
        id: company.id,
        name: company.name,
      },
      kpis,
      applicationTimeline,
      topJobs,
      recentApplications,
      upcomingInterviews,
    };
  }

  /**
   * KPI Cards
   *  - totalActiveJobs
   *  - totalApplications
   *  - newCandidatesLast7Days (unique candidate apply trong 7 ngày)
   *  - totalJobViews (sum views_count)
   *  - upcomingInterviews (số interview đã lên lịch trong tương lai)
   *  - newCvsLast7Days (CV liên quan tới application của company trong 7 ngày)
   */
  private async buildKpis(companyId: bigint, now: Date) {
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [
      totalActiveJobs,
      totalApplications,
      newCandidatesDistinct,
      jobViewsAgg,
      upcomingInterviewsCount,
      newApplicationsLast7Days,
    ] = await this.prisma.$transaction([
      // Tổng job đang active
      this.prisma.job.count({
        where: {
          company_id: companyId,
          status: 'active',
          OR: [{ deadline: null }, { deadline: { gte: now } }],
        },
      }),

      // Tổng application toàn công ty
      this.prisma.application.count({
        where: {
          job: { company_id: companyId },
        },
      }),

      // Số ứng viên unique apply trong 7 ngày
      this.prisma.application.aggregate({
        where: {
          job: { company_id: companyId },
          applied_at: { gte: sevenDaysAgo },
        },
        _count: {
          candidate_id: true,
        },
      }),

      // Tổng lượt view job
      this.prisma.job.aggregate({
        where: { company_id: companyId },
        _sum: { views_count: true },
      }),

      // Số interview tương lai
      this.prisma.interview.count({
        where: {
          application: {
            job: { company_id: companyId },
          },
          scheduled_at: { gte: now },
          status: { in: ['scheduled', 'rescheduled'] },
        },
      }),

      // ⭐ NEW: Số application mới 7 ngày qua
      this.prisma.application.count({
        where: {
          job: { company_id: companyId },
          applied_at: { gte: sevenDaysAgo },
        },
      }),
    ]);

    return {
      totalActiveJobs,
      totalApplications,
      newCandidatesLast7Days: newCandidatesDistinct._count.candidate_id ?? 0,
      totalJobViews: jobViewsAgg._sum.views_count ?? 0,
      upcomingInterviews: upcomingInterviewsCount,
      newApplicationsLast7Days,
    };
  }

  /**
   * Biểu đồ line: tổng số application theo ngày.
   * Trả về:
   *  {
   *    range: { from: 'yyyy-MM-dd', to: 'yyyy-MM-dd' },
   *    points: [{ date: 'yyyy-MM-dd', count: number }]
   *  }
   */
  private async buildApplicationTimeline(
    companyId: bigint,
    query: RecruiterDashboardQueryDto,
    now: Date,
  ) {
    const { startDate, endDate } = await this.resolveDateRangeForCompany(companyId, query, now);

    // Lấy tất cả application trong range và tự group theo day phía server
    const applications = await this.prisma.application.findMany({
      where: {
        job: { company_id: companyId },
        applied_at: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        applied_at: true,
      },
    });

    // Khởi tạo map [yyyy-MM-dd] = 0 cho toàn bộ ngày trong khoảng
    const dateMap = new Map<string, number>();
    const cursor = new Date(startDate);
    cursor.setHours(0, 0, 0, 0);

    while (cursor <= endDate) {
      const key = cursor.toISOString().slice(0, 10); // yyyy-MM-dd
      dateMap.set(key, 0);
      cursor.setDate(cursor.getDate() + 1);
    }

    // Đếm số application theo ngày
    for (const app of applications) {
      const key = app.applied_at.toISOString().slice(0, 10);
      if (dateMap.has(key)) {
        dateMap.set(key, (dateMap.get(key) ?? 0) + 1);
      }
    }

    const points = Array.from(dateMap.entries()).map(([date, count]) => ({
      date,
      count,
    }));

    return {
      range: {
        from: startDate.toISOString().slice(0, 10),
        to: endDate.toISOString().slice(0, 10),
      },
      points,
    };
  }

  /**
   * Tính khoảng ngày cho line chart.
   * - Nếu có from/to => dùng luôn
   * - Nếu range = '7d' | '30d'
   * - Nếu range = 'all' => từ application đầu tiên tới hiện tại
   */
  private async resolveDateRangeForCompany(
    companyId: bigint,
    query: RecruiterDashboardQueryDto,
    now: Date,
  ): Promise<{ startDate: Date; endDate: Date }> {
    // Custom range
    if (query.from || query.to) {
      const start = query.from ? new Date(query.from) : new Date(now);
      const end = query.to ? new Date(query.to) : new Date(now);

      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);

      return { startDate: start, endDate: end };
    }

    // Nhanh theo range
    if (query.range === 'all') {
      // Tìm application sớm nhất của company
      const firstApp = await this.prisma.application.findFirst({
        where: { job: { company_id: companyId } },
        orderBy: { applied_at: 'asc' },
        select: { applied_at: true },
      });

      if (!firstApp) {
        // Không có application nào => default 7 ngày gần nhất
        const defaultStart = new Date(now);
        defaultStart.setDate(defaultStart.getDate() - 6);
        defaultStart.setHours(0, 0, 0, 0);

        const defaultEnd = new Date(now);
        defaultEnd.setHours(23, 59, 59, 999);

        return { startDate: defaultStart, endDate: defaultEnd };
      }

      const start = new Date(firstApp.applied_at);
      start.setHours(0, 0, 0, 0);

      const end = new Date(now);
      end.setHours(23, 59, 59, 999);

      return { startDate: start, endDate: end };
    }

    // 7d hoặc 30d (default 7d)
    const days = query.range === '30d' ? 30 : 7;
    const start = new Date(now);
    start.setDate(start.getDate() - (days - 1));
    start.setHours(0, 0, 0, 0);

    const end = new Date(now);
    end.setHours(23, 59, 59, 999);

    return { startDate: start, endDate: end };
  }

  /**
   * Top job đang tuyển:
   *  - Theo views_count desc
   *  - Có kèm số lượng ứng viên apply
   */
  private async buildTopActiveJobs(companyId: bigint, limit: number) {
    return this.prisma.job.findMany({
      where: {
        company_id: companyId,
        status: 'active',
      },
      orderBy: [
        { applications: { _count: 'desc' } },
        { views_count: 'desc' },
      ],
      take: limit,
      select: {
        id: true,
        title: true,
        deadline: true,
        status: true,
        views_count: true,
        _count: {
          select: {
            applications: true,  // FE yêu cầu
          },
        },
      },
    });
  }

  /**
   * Ứng viên mới ứng tuyển gần đây
   */
  private async buildRecentApplications(companyId: bigint, limit: number) {
    const applications = await this.prisma.application.findMany({
      where: {
        job: { company_id: companyId },
      },
      orderBy: {
        applied_at: 'desc',
      },
      take: limit,
      include: {
        job: {
          select: {
            id: true,
            title: true,
          },
        },
        candidate: {
          include: {
            user: {
              select: {
                id: true,
                full_name: true,
                avatar_url: true,
              },
            },
          },
        },
      },
    });

    return applications.map((app) => ({
      id: app.id,
      applied_at: app.applied_at,
      status: app.status,
      job: {
        id: app.job.id,
        title: app.job.title,
      },
      candidate: {
        id: app.candidate.id,
        full_name: app.candidate.user.full_name,
        avatar_url: app.candidate.user.avatar_url,
      },
    }));
  }

  /**
   * Lịch phỏng vấn sắp diễn ra
   */
  private async buildUpcomingInterviews(companyId: bigint, limit: number, now: Date) {
    const interviews = await this.prisma.interview.findMany({
      where: {
        application: {
          job: { company_id: companyId },
        },
        scheduled_at: { gte: now },
        status: { in: ['scheduled', 'rescheduled'] },
      },
      orderBy: {
        scheduled_at: 'asc',
      },
      take: 1, // CHỈ LẤY 1 — cái gần nhất
      include: {
        application: {
          include: {
            job: {
              select: {
                id: true,
                title: true,
              },
            },
            candidate: {
              include: {
                user: {
                  select: {
                    id: true,
                    full_name: true,
                    avatar_url: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    return interviews.map((itv) => ({
      id: itv.id,
      scheduled_at: itv.scheduled_at,
      mode: itv.mode,
      location: itv.location,
      meeting_link: itv.meeting_link,
      status: itv.status,
      notes: itv.notes,
      candidate: {
        id: itv.application.candidate.id,
        full_name: itv.application.candidate.user.full_name,
        avatar_url: itv.application.candidate.user.avatar_url,
      },
      job: {
        id: itv.application.job.id,
        title: itv.application.job.title,
      },
    }));
  }

  // =========================
  // ADMIN DASHBOARD
  // =========================
  async getAdminDashboard(query: AdminDashboardQueryDto) {
    const now = new Date();
    const { startDate, endDate } = this.resolveAdminRange(query, now);

    const [kpis, revenueTimeline, orderStatus, topPlans] =
      await Promise.all([
        this.buildAdminKpis(now),
        this.buildAdminRevenueTimeline(startDate, endDate),
        this.buildAdminOrderStatus(startDate, endDate),
        this.buildAdminTopPlans(startDate, endDate),
      ]);

    return {
      range: {
        from: startDate.toISOString().slice(0, 10),
        to: endDate.toISOString().slice(0, 10),
      },
      kpis,
      charts: {
        revenueTimeline,
        orderStatus,
        topPlans,
      },
    };
  }

  /**
   * KPI Cards theo design:
   * - totalRevenueAllTime
   * - revenueThisMonth + percent MoM
   * - revenueToday
   * - paidOrdersCount (+ failed/expired count để so)
   * - payingRecruitersCount (CompanyPlan active + end_date > now)
   * - pendingCompaniesCount (Company.status = pending)
   * - activeJobsCount (Job.status = active)
   */
  private async buildAdminKpis(now: Date) {
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);

    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0, 0);

    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
    const thisMonthStartCopy = new Date(thisMonthStart);

    const [
      totalRevenueAgg,
      revenueThisMonthAgg,
      revenuePrevMonthAgg,
      revenueTodayAgg,
      paidOrdersCount,
      failedOrExpiredCount,
      payingRecruitersCount,
      pendingCompaniesCount,
      activeJobsCount,
    ] = await this.prisma.$transaction([
      this.prisma.paymentOrder.aggregate({
        where: { status: 'paid' },
        _sum: { amount: true },
      }),

      this.prisma.paymentOrder.aggregate({
        where: {
          status: 'paid',
          paid_at: { gte: thisMonthStart, lt: nextMonthStart },
        },
        _sum: { amount: true },
      }),

      this.prisma.paymentOrder.aggregate({
        where: {
          status: 'paid',
          paid_at: { gte: prevMonthStart, lt: thisMonthStartCopy },
        },
        _sum: { amount: true },
      }),

      this.prisma.paymentOrder.aggregate({
        where: {
          status: 'paid',
          paid_at: { gte: todayStart, lte: todayEnd },
        },
        _sum: { amount: true },
      }),

      this.prisma.paymentOrder.count({
        where: { status: 'paid' },
      }),

      this.prisma.paymentOrder.count({
        where: { status: { in: ['failed', 'expired'] } },
      }),

      this.prisma.companyPlan.count({
        where: { status: 'active', end_date: { gt: now } },
      }),

      this.prisma.company.count({
        where: { status: 'pending' },
      }),

      this.prisma.job.count({
        where: { status: 'active' },
      }),
    ]);

    const totalRevenueAllTime = Number(totalRevenueAgg._sum.amount ?? 0);
    const revenueThisMonth = Number(revenueThisMonthAgg._sum.amount ?? 0);
    const revenuePrevMonth = Number(revenuePrevMonthAgg._sum.amount ?? 0);

    const revenueMoMPercent =
      revenuePrevMonth <= 0
        ? (revenueThisMonth > 0 ? 100 : 0)
        : ((revenueThisMonth - revenuePrevMonth) / revenuePrevMonth) * 100;

    return {
      totalRevenueAllTime,
      revenueThisMonth,
      revenueMoMPercent: Number(revenueMoMPercent.toFixed(2)),
      revenueToday: Number(revenueTodayAgg._sum.amount ?? 0),
      paidOrdersCount,
      failedOrExpiredCount,
      payingRecruitersCount,
      pendingCompaniesCount,
      activeJobsCount,
    };
  }

  /**
   * Revenue timeline:
   * - nếu range ngắn => group theo ngày
   * - nếu range dài (>= ~62 ngày) => group theo tháng
   */
  private async buildAdminRevenueTimeline(startDate: Date, endDate: Date) {
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / 86_400_000) + 1;
    const bucket: RevenueBucket = days >= 62 ? 'month' : 'day';

    // Lấy paid orders trong range
    const orders = await this.prisma.paymentOrder.findMany({
      where: {
        status: 'paid',
        paid_at: { gte: startDate, lte: endDate },
      },
      select: { paid_at: true, amount: true },
    });

    const keyOf = (d: Date) => {
      if (bucket === 'day') return d.toISOString().slice(0, 10); // yyyy-MM-dd
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      return `${y}-${m}`; // yyyy-MM
    };

    // Init buckets
    const map = new Map<string, number>();

    if (bucket === 'day') {
      const cursor = new Date(startDate);
      cursor.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      while (cursor <= end) {
        map.set(cursor.toISOString().slice(0, 10), 0);
        cursor.setDate(cursor.getDate() + 1);
      }
    } else {
      const cursor = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
      const end = new Date(endDate.getFullYear(), endDate.getMonth(), 1);

      while (cursor <= end) {
        map.set(keyOf(cursor), 0);
        cursor.setMonth(cursor.getMonth() + 1);
      }
    }

    // Sum revenue
    for (const o of orders) {
      const k = keyOf(o.paid_at ?? new Date());
      if (!map.has(k)) map.set(k, 0);
      map.set(k, (map.get(k) ?? 0) + Number(o.amount ?? 0));
    }

    const points = Array.from(map.entries()).map(([label, value]) => ({
      label, // yyyy-MM-dd hoặc yyyy-MM
      value,
    }));

    return { bucket, points };
  }

  /**
   * Order status breakdown (donut/pie)
   */
  private async buildAdminOrderStatus(startDate: Date, endDate: Date) {
    const rows = await this.prisma.paymentOrder.groupBy({
      by: ['status'],
      where: {
        created_at: { gte: startDate, lte: endDate }, // dùng created_at cho “đơn theo thời gian”
      },
      _count: { _all: true },
    });

    const base = {
      paid: 0,
      pending: 0,
      failed: 0,
      expired: 0,
      cancelled: 0,
    };

    for (const r of rows) {
      // @ts-ignore
      base[r.status] = r._count._all;
    }

    return {
      range: {
        from: startDate.toISOString().slice(0, 10),
        to: endDate.toISOString().slice(0, 10),
      },
      data: base,
    };
  }

  /**
   * Top plans (bar chart): plan name -> số lượt mua + doanh thu
   */
  private async buildAdminTopPlans(startDate: Date, endDate: Date) {
    const grouped = await this.prisma.paymentOrder.groupBy({
      by: ['plan_id'],
      where: {
        status: 'paid',
        paid_at: { gte: startDate, lte: endDate },
      },
      _count: {
        id: true,   // 👈 đếm theo id
      },
      _sum: {
        amount: true,
      },
      orderBy: {
        _count: {
          id: 'desc', // 👈 ORDER BY COUNT(id)
        },
      },
      take: 10,
    });

    const planIds = grouped.map((g) => g.plan_id);
    const plans = await this.prisma.plan.findMany({
      where: { id: { in: planIds } },
      select: { id: true, name: true },
    });

    const planMap = new Map(plans.map((p) => [p.id.toString(), p.name]));

    return grouped.map((g) => ({
      plan_id: g.plan_id.toString(),
      plan_name: planMap.get(g.plan_id.toString()) ?? 'Unknown',
      purchases: g._count.id,      // 👈 dùng id
      revenue: Number(g._sum.amount ?? 0),
    }));
  }

  /**
   * Range resolver:
   * - nếu from/to có -> ưu tiên
   * - else preset 7d/30d/3m/1y
   */
  private resolveAdminRange(query: AdminDashboardQueryDto, now: Date) {
    if (query.from || query.to) {
      const start = query.from ? new Date(`${query.from}T00:00:00`) : new Date(now);
      const end = query.to ? new Date(`${query.to}T23:59:59`) : new Date(now);

      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);

      return { startDate: start, endDate: end };
    }

    const range = query.range ?? '30d';
    const end = new Date(now);
    end.setHours(23, 59, 59, 999);

    const start = new Date(now);
    start.setHours(0, 0, 0, 0);

    if (range === '7d') start.setDate(start.getDate() - 6);
    else if (range === '30d') start.setDate(start.getDate() - 29);
    else if (range === '3m') start.setMonth(start.getMonth() - 3);
    else if (range === '1y') start.setFullYear(start.getFullYear() - 1);

    return { startDate: start, endDate: end };
  }
}
