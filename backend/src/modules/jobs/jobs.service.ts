import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { ElasticsearchJobService } from '../elasticsearch/job.elasticsearch.service';
import { LocationService } from '../location/location.service';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { Cron, CronExpression } from '@nestjs/schedule';
import { JobStatus } from '@prisma/client';
import { ApplicationStatus } from '@prisma/client';
import { JobDashboardQueryDto } from './dto/job-dashboard-query.dto';
@Injectable()
export class JobsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly esJob: ElasticsearchJobService,
    private readonly locationService: LocationService,
  ) {}

  // -----------------------------
  // CREATE JOB (Recruiter)
  // -----------------------------
  // -----------------------------
  // CREATE JOB (Recruiter) - ✅ Atomic quota like consumeJobQuota
  // -----------------------------
  async create(accountId: bigint, dto: CreateJobDto) {
    try {
      const { skill_ids, description, requirements, ...rest } = dto;

      // ⭐ Tách category_id ra để không bị spread vào Prisma
      const { category_id, ...data } = rest;

      // ✅ Lấy công ty của recruiter
      const company = await this.prisma.company.findUnique({
        where: { account_id: accountId },
      });
      if (!company) {
        throw new NotFoundException('Nhà tuyển dụng chưa có công ty hợp lệ');
      }

      // ✅ Ghép địa chỉ đầy đủ
      const parts = [
        data.location_street,
        data.location_ward,
        data.location_district,
        data.location_city,
      ].filter(Boolean);
      const location_full = parts.join(', ');

      // ✅ Tự động lấy toạ độ (nếu có) — làm ngoài transaction để tránh gọi API nhiều lần
      let latitude = data.latitude ?? null;
      let longitude = data.longitude ?? null;

      if (!latitude && !longitude && location_full) {
        const geo = await this.locationService.geocodeAddress(location_full);
        latitude = geo.latitude;
        longitude = geo.longitude;
      }

      const now = new Date();

      // 🔐 DB TRANSACTION: Create Job + Skills + Consume Quota (atomic)
      const createdJobId = await this.prisma.$transaction(async (tx) => {
        // 1) Check plan active (giống consumeJobQuota)
        const current = await tx.companyPlan.findUnique({
          where: { company_id: company.id },
        });

        if (
          !current ||
          current.status !== 'active' ||
          current.end_date <= now
        ) {
          throw new BadRequestException(
            'Bạn chưa có gói dịch vụ hoặc gói đã hết hạn.',
          );
        }

        // 2) Tạo job (giữ nguyên logic cũ)
        const job = await tx.job.create({
          data: {
            company: { connect: { id: company.id } },

            // ⭐ Chỉ spread data KHÔNG chứa category_id
            ...data,

            // ⭐ Gắn category bằng quan hệ
            ...(category_id
              ? {
                  category: {
                    connect: { id: BigInt(category_id) },
                  },
                }
              : {}),

            location_full,
            latitude,
            longitude,

            number_of_openings: data.number_of_openings ?? 1,

            details: {
              create: {
                description,
                requirements,
              },
            },

            deadline: data.deadline ? new Date(data.deadline) : null,
          },
        });

        // 3) Gắn kỹ năng nếu có (giữ nguyên logic cũ)
        if (skill_ids?.length) {
          await tx.jobSkill.createMany({
            data: skill_ids.map((id) => ({
              job_id: job.id,
              skill_id: id,
            })),
          });
        }

        // 4) ✅ ATOMIC CONSUME QUOTA (GIỐNG consumeJobQuota)
        // updateMany + điều kiện gt:0 để chống race condition / double click
        const result = await tx.companyPlan.updateMany({
          where: {
            id: current.id,
            jobs_left: { gt: 0 },
          },
          data: {
            jobs_left: { decrement: 1 },
          },
        });

        if (result.count === 0) {
          // Nếu 2 request song song, request đến sau sẽ rơi vào case này
          throw new BadRequestException(
            'Đã hết lượt đăng tin (Quota exhausted). Vui lòng nâng cấp gói.',
          );
        }

        return job.id;
      });

      // ✅ Lấy lại dữ liệu đầy đủ để index (giữ nguyên logic cũ)
      const fullJob = await this.getFullJob(createdJobId);

      // ✅ Index Elasticsearch (ngoài transaction)
      // Khuyên: đừng làm fail cả request vì ES không rollback được -> tránh user retry gây tạo trùng
      try {
        await this.esJob.indexJob(fullJob);
      } catch (esErr) {
        console.error(
          '⚠️ Elasticsearch index failed (job vẫn tạo thành công):',
          esErr,
        );
        // không throw
      }

      return fullJob;
    } catch (error) {
      console.error('🔥 Lỗi tạo job:', error);

      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }

      throw new InternalServerErrorException(
        'Không thể tạo job: ' + error.message,
      );
    }
  }

  // UPDATE JOB (Recruiter)
  // -----------------------------
  async update(jobId: bigint, dto: UpdateJobDto) {
    try {
      const { skill_ids, description, requirements, ...data } = dto;

      // ✅ Kiểm tra job tồn tại
      const job = await this.prisma.job.findUnique({
        where: { id: jobId },
        include: { details: true },
      });
      if (!job) throw new NotFoundException('Không tìm thấy công việc');

      // ✅ Ghép location_full nếu có bất kỳ field địa chỉ nào thay đổi
      let location_full = job.location_full;
      if (
        data.location_city ||
        data.location_district ||
        data.location_ward ||
        data.location_street
      ) {
        const parts = [
          data.location_street ?? job.location_street,
          data.location_ward ?? job.location_ward,
          data.location_district ?? job.location_district,
          data.location_city ?? job.location_city,
        ].filter(Boolean);
        location_full = parts.join(', ');
      }

      // ✅ Tính lại toạ độ nếu có thay đổi địa chỉ hoặc latitude/longitude được gửi mới
      let latitude = data.latitude ?? job.latitude;
      let longitude = data.longitude ?? job.longitude;
      if (
        (data.location_city ||
          data.location_district ||
          data.location_ward ||
          data.location_street) &&
        location_full
      ) {
        const geo = await this.locationService.geocodeAddress(location_full);
        latitude = geo.latitude;
        longitude = geo.longitude;
      }

      // ✅ Chuẩn hóa deadline & category_id
      const deadline = data.deadline ? new Date(data.deadline) : job.deadline;
      const category_id =
        data.category_id !== undefined
          ? BigInt(data.category_id as any)
          : job.category_id;
      const updateDetailData: any = {};
      if (description !== undefined) updateDetailData.description = description;
      if (requirements !== undefined)
        updateDetailData.requirements = requirements;

      // ✅ Cập nhật job chính
      const updatedJob = await this.prisma.job.update({
        where: { id: jobId },
        data: {
          ...data,
          category_id,
          location_full,
          latitude,
          longitude,
          deadline,
          details: {
            upsert: {
              update: { ...updateDetailData },
              create: { description, requirements },
            },
          },
        },
        include: { company: true, category: true },
      });

      // ✅ Nếu có skill_ids gửi lên => thay toàn bộ
      if (skill_ids !== undefined) {
        await this.prisma.jobSkill.deleteMany({ where: { job_id: jobId } });
        if (skill_ids.length) {
          await this.prisma.jobSkill.createMany({
            data: skill_ids.map((id) => ({
              job_id: jobId,
              skill_id: id,
            })),
          });
        }
      }

      // ✅ Lấy lại job đầy đủ để index
      const fullJob = await this.getFullJob(jobId);

      // ✅ Cập nhật Elasticsearch
      await this.esJob.updateJob(fullJob);

      return fullJob;
    } catch (error) {
      console.error('🔥 Lỗi cập nhật job:', error);
      throw new InternalServerErrorException(
        'Không thể cập nhật job: ' + error.message,
      );
    }
  }

  async updateStatus(
    jobId: bigint,
    status: 'active' | 'hidden' | 'closed' | 'expired',
  ) {
    try {
      const job = await this.prisma.job.findUnique({ where: { id: jobId } });
      if (!job) throw new NotFoundException('Không tìm thấy công việc');

      if (status === 'expired') {
        throw new BadRequestException(
          "Không thể chuyển trạng thái thủ công sang 'expired' — hệ thống sẽ tự đánh dấu khi quá hạn.",
        );
      }
      const validTransitions: Record<string, string[]> = {
        active: ['hidden', 'closed'],
        hidden: ['active'],
        closed: [],
        expired: [],
      };

      const currentStatus = job.status;
      const allowedNext = validTransitions[currentStatus];
      if (!allowedNext.includes(status)) {
        throw new BadRequestException(
          `Không thể chuyển từ trạng thái '${currentStatus}' sang '${status}'`,
        );
      }

      const updatedJob = await this.prisma.job.update({
        where: { id: jobId },
        data: { status },
      });

      // Đồng bộ elasticsearch
      if (status === 'active') {
        // ✅ Active → reindex vào Elasticsearch
        const fullJob = await this.getFullJob(jobId);
        await this.esJob.indexJob(fullJob);
      } else {
        // ❌ Hidden hoặc Closed → xóa khỏi Elasticsearch
        await this.esJob.removeJob(jobId);
      }

      return updatedJob;
    } catch (error) {
      console.error('🔥 Lỗi cập nhật trạng thái job:', error);
      throw new InternalServerErrorException(
        'Không thể cập nhật trạng thái: ' + error.message,
      );
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async autoExpireJobs() {
    const now = new Date();

    // 1️⃣ Lấy tất cả job đang active nhưng quá deadline
    const expiredJobs = await this.prisma.job.findMany({
      where: {
        status: 'active',
        deadline: { lt: now },
      },
      select: { id: true },
    });

    if (!expiredJobs.length) {
      console.log('✅ Không có job nào hết hạn hôm nay.');
      return;
    }

    const jobIds = expiredJobs.map((j) => j.id);

    // 2️⃣ Cập nhật trạng thái sang expired
    await this.prisma.job.updateMany({
      where: { id: { in: jobIds } },
      data: { status: 'expired' },
    });

    // 3️⃣ Xóa khỏi Elasticsearch
    for (const jobId of jobIds) {
      try {
        await this.esJob.removeJob(jobId);
      } catch (err) {
        console.error(`⚠️ Lỗi xóa job ${jobId} khỏi Elasticsearch:`, err);
      }
    }

    console.log(
      `🚀 Đã chuyển ${jobIds.length} job sang 'expired' và xóa khỏi Elasticsearch`,
    );
  }

  // Hàm SearhJobs (gọi elasticsearch)
  async search(query: any) {
    const work_modes = this.safeParseArray(query.work_modes);
    const experience_levels = this.safeParseArray(query.experience_levels);
    const skills = this.safeParseArray(query.skills);
    const employment_type = this.safeParseArray(query.employment_type);
    try {
      return await this.esJob.searchJobs({
        keyword: query.keyword,

        city: query.city,
        district: query.district,
        ward: query.ward,
        street: query.street,

        work_modes,
        experience_levels,
        skills,
        employment_type,

        negotiable:
          query.negotiable !== undefined
            ? String(query.negotiable) === 'true'
            : undefined,
        category: query.category,

        min_salary:
          query.min_salary !== undefined ? Number(query.min_salary) : undefined,
        max_salary:
          query.max_salary !== undefined ? Number(query.max_salary) : undefined,

        lat: query.lat !== undefined ? Number(query.lat) : undefined,
        lon: query.lon !== undefined ? Number(query.lon) : undefined,
        radius_km:
          query.radius_km !== undefined ? Number(query.radius_km) : undefined,

        page: query.page ? Number(query.page) : 1,
        limit: query.limit ? Number(query.limit) : 10,
        sort: query.sort,
      });
    } catch (e) {
      console.error('❌ Lỗi search job:', e);
      throw new InternalServerErrorException('Không thể tìm kiếm công việc');
    }
  }

  // Hàm gợi ý công việc:
  async suggest(q: string) {
    try {
      if (!q || !q.trim()) return [];
      return await this.esJob.suggestJobs(q);
    } catch (e) {
      console.error('❌ Lỗi suggest job:', e);
      throw new InternalServerErrorException('Không thể gợi ý từ khóa');
    }
  }

  // Lấy ra toàn bộ thông tin của một job:
  async getOne(id: bigint, mode: 'public' | 'edit' = 'public') {
    const job = await this.getFullJob(id);
    if (!job) throw new NotFoundException('Không tìm thấy công việc');

    // Nếu public mà job chưa active hoặc công ty chưa approved thì ẩn
    if (
      mode === 'public' &&
      (job.status !== 'active' || job.company.status !== 'approved')
    ) {
      throw new NotFoundException('Công việc không khả dụng');
    }

    // ---------------------
    // 1️⃣ Base data dùng chung
    // ---------------------
    const baseData = {
      id: job.id,
      title: job.title,
      salary_min: job.salary_min,
      salary_max: job.salary_max,
      negotiable: job.negotiable,
      employment_type: job.employment_type,
      location_city: job.location_city,
      work_modes: job.work_modes,
      experience_levels: job.experience_levels,
      status: job.status,
      deadline: job.deadline,
      location: { full: job.location_full },
      description: job.details?.description,
      requirements: job.details?.requirements,
      category: job.category
        ? { id: job.category.id, name: job.category.name }
        : null,
      skills: job.skills.map((js) => js.skill.name),
      company: {
        id: job.company.id,
        name: job.company.name,
        logo_url: job.company.logo_url,
        address: job.company.address,
        industries: job.company.industry_info.map((ci) => ci.industry.name),
        tech_stacks: job.company.skills.map((cs) => cs.skill.name),
        company_website: job.company.website,
      },
      created_at: job.created_at,
      updated_at: job.updated_at,
    };

    // ---------------------
    // 2️⃣ Mode xử lý
    // ---------------------

    // 🟢 Public mode → chỉ trả thông tin hiển thị
    if (mode === 'public') {
      return baseData;
    }

    // 🟣 Edit mode → thêm các field phục vụ form chỉnh sửa
    return {
      ...baseData,
      category_id: job.category_id,
      skill_ids: job.skills.map((js) => js.skill_id),
      company_id: job.company_id,
      location_city: job.location_city,
      location_district: job.location_district,
      location_ward: job.location_ward,
      location_street: job.location_street,
      latitude: job.latitude,
      longitude: job.longitude,
    };
  }

  async getCompanyJobs(
    accountId: bigint,
    page = 1,
    limit = 10,
    search?: string,
    status?: JobStatus,
  ) {
    try {
      const company = await this.prisma.company.findUnique({
        where: { account_id: accountId },
      });

      if (!company) {
        throw new NotFoundException('Company not found');
      }

      const where: any = { company_id: company.id };

      // ❗ Prisma count() KHÔNG hỗ trợ mode: 'insensitive'
      if (search) {
        where.title = { contains: search }; // MySQL mặc định không phân biệt hoa/thường
      }

      if (status) {
        where.status = status;
      }
      const [items, total] = await Promise.all([
        this.prisma.job.findMany({
          where,
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { created_at: 'desc' },
          include: {
            _count: {
              select: { applications: true },
            },
          },
        }),
        // ❗ Không dùng mode tại đây
        this.prisma.job.count({ where }),
      ]);

      return {
        success: true,
        page,
        limit,
        total,
        items,
      };
    } catch (error) {
      console.error('❌ [getCompanyJobs] Lỗi xảy ra:', error);
      throw error;
    }
  }

  async getJobsDropdownByCompany(accountId: bigint) {
    try {
      console.log('➡️ accountId nhận được:', accountId);

      const company = await this.prisma.company.findUnique({
        where: { account_id: accountId },
      });

      console.log('➡️ Company tìm được:', company);

      if (!company) {
        throw new NotFoundException('Company not found for this account');
      }

      const jobs = await this.prisma.job.findMany({
        where: { company_id: company.id },
        select: {
          id: true,
          title: true,
        },
        orderBy: { created_at: 'desc' },
      });

      return jobs;
    } catch (error) {
      console.error('❌ Lỗi trong getJobsByCompany:', error);

      // ném lỗi lại để Nest xử lý và trả Response đúng format
      throw error;
    }
  }
  async resetDeadline(id: bigint, newDeadlineStr: string) {
    try {
      const job = await this.prisma.job.findUnique({ where: { id } });

      if (!job) {
        throw new NotFoundException('Không tìm thấy công việc');
      }

      // Job chưa hết hạn thì không cho reset
      if (job.deadline && job.deadline > new Date()) {
        throw new BadRequestException(
          'Job chưa hết hạn, không thể đặt lại deadline',
        );
      }

      const newDeadline = new Date(newDeadlineStr);

      if (isNaN(newDeadline.getTime())) {
        throw new BadRequestException('Ngày deadline không hợp lệ');
      }

      const updatedJob = await this.prisma.job.update({
        where: { id },
        data: {
          deadline: newDeadline,
          status: 'active',
        },
      });

      return {
        success: true,
        message: 'Cập nhật deadline thành công',
        data: updatedJob,
      };
    } catch (error) {
      console.error('❌ [resetDeadline] Lỗi xảy ra:', error);
      throw error;
    }
  }

  async reindexJobsByCompany(companyId: bigint) {
    const jobs = await this.prisma.job.findMany({
      where: { company_id: companyId },
    });
    console.log(
      '🔥 JOB LIST NEED REINDEX:',
      jobs.map((j) => j.id),
    );

    for (const j of jobs) {
      const fullJob = await this.getFullJob(j.id);
      await this.esJob.updateJob(fullJob);
    }
  }
  // Hàm phục vụ cho trang thống kê:
  async getJobDashboard(jobId: bigint, query: JobDashboardQueryDto) {
    // 1) Lấy job + _count cơ bản
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

    const now = new Date();

    // --------------- 1. SUMMARY CARDS ----------------
    let days_left: number | null = null;
    if (job.deadline) {
      const diffMs = job.deadline.getTime() - now.getTime();
      // có thể âm nếu đã hết hạn
      days_left = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    }

    const summary = {
      views_count: job.views_count, // 👀
      applications_count: job._count.applications, // 📩
      saved_count: job._count.saved_jobs, // 💾
      openings: job.number_of_openings, // 🎯
      created_at: job.created_at, // 📅
      deadline: job.deadline,
      days_left,
      status: job.status, // 🔥 active/hidden/expired/closed
    };

    // --------------- 2. HIRING FUNNEL ----------------
    const funnelRaw = await this.prisma.application.groupBy({
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
      const row = funnelRaw.find((r) => r.status === status);
      return {
        status,
        count: row ? row._count._all : 0,
      };
    });

    const funnel = {
      total: by_status.reduce((sum, s) => sum + s.count, 0),
      by_status, // [{ status: 'pending', count: ... }, ...]
    };

    // --------------- 3. LINE CHART (ỨNG VIÊN THEO THỜI GIAN) ---------------
    let fromDate: Date;
    let toDate: Date = now;

    if (query.from && query.to) {
      // Custom range (ngày mang format "yyyy-MM-dd")
      fromDate = this.parseLocalDate(query.from);
      toDate = this.parseLocalDate(query.to);
    } else {
      const range = query.range || '30d';
      const mapRangeToDays: Record<string, number> = {
        '7d': 7,
        '14d': 14,
        '30d': 30,
      };

      if (range === 'all') {
        fromDate = new Date(job.created_at);
        toDate = now;
      } else {
        const days = mapRangeToDays[range] ?? 30;
        fromDate = new Date(now);
        fromDate.setHours(0, 0, 0, 0);
        fromDate.setDate(fromDate.getDate() - (days - 1));

        toDate = new Date(now);
        toDate.setHours(23, 59, 59, 999);
      }
    }

    // Đảm bảo fromDate <= toDate
    if (fromDate > toDate) {
      const tmp = fromDate;
      fromDate = toDate;
      toDate = tmp;
    }

    // Lấy dữ liệu ứng tuyển
    const appsInRange = await this.prisma.application.findMany({
      where: {
        job_id: jobId,
        applied_at: {
          gte: fromDate,
          lte: toDate,
        },
      },
      select: {
        applied_at: true,
      },
    });

    // ------------------ Buckets theo ngày ------------------
    const buckets: Record<string, number> = {};

    const cursor = new Date(
      fromDate.getFullYear(),
      fromDate.getMonth(),
      fromDate.getDate(),
    );

    const endDate = new Date(
      toDate.getFullYear(),
      toDate.getMonth(),
      toDate.getDate(),
    );

    // Tạo bucket rỗng cho từng ngày
    while (cursor <= endDate) {
      const key = this.formatLocalDate(cursor);
      buckets[key] = 0;
      cursor.setDate(cursor.getDate() + 1);
    }

    // Đếm số ứng tuyển theo ngày
    for (const app of appsInRange) {
      const localKey = this.formatLocalDate(app.applied_at);
      if (buckets[localKey] !== undefined) {
        buckets[localKey]++;
      }
    }

    const timeline = {
      range: {
        from: fromDate,
        to: toDate,
      },
      points: Object.entries(buckets).map(([date, count]) => ({
        date,
        applications_count: count,
      })),
    };

    // --------------- 4. LATEST CANDIDATES ---------------
    const latest_limit = query.latest_limit ?? 10;
    const latest_page = query.latest_page ?? 1;

    const skip = (latest_page - 1) * latest_limit;

    // tổng số đơn ứng tuyển (để tính total_pages)
    const totalLatest = await this.prisma.application.count({
      where: { job_id: jobId },
    });

    const latestApplications = await this.prisma.application.findMany({
      where: { job_id: jobId },
      orderBy: { applied_at: 'desc' },
      skip,
      take: latest_limit,
      include: {
        candidate: {
          include: {
            user: true,
          },
        },
        cv: true,
      },
    });

    const latest_candidates = latestApplications.map((app) => ({
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
    }));

    const latest_pagination = {
      page: latest_page,
      limit: latest_limit,
      total_items: totalLatest,
      total_pages: Math.ceil(totalLatest / latest_limit),
    };

    // --------------- RESPONSE TỔNG HỢP ---------------
    return {
      job: {
        id: job.id,
        title: job.title,
        status: job.status,
      },
      summary, // block 1
      funnel, // block 2
      timeline, // block 3
      latest_candidates, // block 4
      latest_pagination,
    };
  }

  // -----------------------------
  // Helper: Lấy full job
  // -----------------------------
  private async getFullJob(id: bigint) {
    return await this.prisma.job.findUnique({
      where: { id },
      include: {
        details: true,
        category: true,
        skills: { include: { skill: true } },
        company: {
          include: {
            industry_info: { include: { industry: true } },
            skills: { include: { skill: true } },
          },
        },
      },
    });
  }

  // -----------------------------
  // Helper:  parse mảng an toàn từ query string
  // -----------------------------
  private safeParseArray(value: any): string[] | undefined {
    if (!value) return undefined;
    if (Array.isArray(value)) return value; // ?param=a&param=b
    if (typeof value === 'string') {
      // Nếu frontend gửi JSON string ["a","b"]
      if (value.startsWith('[')) {
        try {
          return JSON.parse(value);
        } catch {
          return [value];
        }
      }
      // Nếu chỉ gửi ?param=a
      return [value];
    }
    return undefined;
  }
  // Helpers xử lý thời gian:
  private parseLocalDate(dateStr: string): Date {
    // input: "yyyy-MM-dd"
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d); // local date
  }

  private formatLocalDate(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
}
