import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { ElasticsearchJobService } from '../elasticsearch/job.elasticsearch.service';
import { LocationService } from '../location/location.service';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { Cron, CronExpression } from '@nestjs/schedule';
import { JobStatus } from '@prisma/client';
import { JobEventsQueue } from './queues/job-events.queue';
@Injectable()
export class JobsService {
  private readonly logger = new Logger(JobsService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly locationService: LocationService,
    private readonly jobEventsQueue: JobEventsQueue,
    private readonly esJob: ElasticsearchJobService,
  ) {}
  // CREATE JOB (Recruiter) - ✅ Atomic quota like consumeJobQuota
  async create(accountId: bigint, dto: CreateJobDto) {
    try {
      // 1) chạy core business + transaction (sync)
      const jobId = await this.createJobCore(accountId, dto);
      // 2) Đưa vào queue:
      await this.jobEventsQueue.jobCreated(jobId);

      return {
        message: 'Tạo công việc thành công',
      };
    } catch (error) {
      this.logger.error('🔥 Lỗi tạo job', error?.stack || error);

      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }

      throw new InternalServerErrorException(
        'Không thể tạo job: ' + (error?.message || 'Unknown error'),
      );
    }
  }
  // Core create:
  private async createJobCore(accountId: bigint, dto: CreateJobDto) {
    const { skill_ids, description, requirements, ...data } = dto;
    const { category_id, ...rest } = data;

    // 1) Lấy company
    const company = await this.prisma.company.findUnique({
      where: { account_id: accountId },
    });
    if (!company) {
      throw new NotFoundException('Nhà tuyển dụng chưa có công ty hợp lệ');
    }
    // đảm bảo trường location_city_id không null/undefined:
    if (rest.location_city_id === undefined || rest.location_city_id === null) {
      throw new BadRequestException('Vui lòng chọn thành phố');
    }

    // 2) Resolve city/ward + build location_full + geocode (giữ sync để không đổi behavior)
    const location = await this.resolveLocationForCreateOrThrow({
      location_city_id: rest.location_city_id,
      location_ward_id: rest.location_ward_id,
      location_street: rest.location_street,
      latitude: rest.latitude,
      longitude: rest.longitude,
    });

    const now = new Date();

    // 3) Transaction core
    const createdJobId = await this.prisma.$transaction(async (tx) => {
      const currentPlan = await tx.companyPlan.findUnique({
        where: { company_id: company.id },
      });

      if (
        !currentPlan ||
        currentPlan.status !== 'active' ||
        currentPlan.end_date <= now
      ) {
        throw new BadRequestException(
          'Bạn chưa có gói dịch vụ hoặc gói đã hết hạn',
        );
      }

      const job = await tx.job.create({
        data: {
          company: { connect: { id: company.id } },

          title: rest.title,
          salary_min: rest.salary_min,
          salary_max: rest.salary_max,
          negotiable: rest.negotiable,
          employment_type: rest.employment_type,
          work_modes: rest.work_modes,
          experience_levels: rest.experience_levels,

          location_city: location.location_city,
          location_ward: location.location_ward,
          location_district: null,
          location_street: rest.location_street,
          location_full: location.location_full,
          latitude: location.latitude,
          longitude: location.longitude,

          number_of_openings: rest.number_of_openings ?? 1,
          deadline: rest.deadline ? new Date(rest.deadline) : null,

          ...(category_id
            ? {
                category: {
                  connect: { id: BigInt(category_id as any) },
                },
              }
            : {}),

          details: {
            create: {
              description,
              requirements,
            },
          },
        },
      });

      if (skill_ids?.length) {
        await tx.jobSkill.createMany({
          data: skill_ids.map((id) => ({
            job_id: job.id,
            skill_id: id,
          })),
        });
      }

      // ✅ Atomic consume quota
      const quotaResult = await tx.companyPlan.updateMany({
        where: {
          id: currentPlan.id,
          jobs_left: { gt: 0 },
        },
        data: {
          jobs_left: { decrement: 1 },
        },
      });

      if (quotaResult.count === 0) {
        throw new BadRequestException('Đã hết lượt đăng tin');
      }

      return job.id;
    });

    return createdJobId;
  }
  async update(jobId: bigint, dto: UpdateJobDto) {
    try {
      const updatedJobId = await this.updateJobCore(jobId, dto);
      await this.jobEventsQueue.jobUpdated(updatedJobId);

      return {
        message: 'Cập nhật công việc thành công',
      };
    } catch (error) {
      this.logger.error('🔥 Lỗi cập nhật job', error?.stack || error);

      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }

      throw new InternalServerErrorException(
        'Không thể cập nhật job: ' + (error?.message || 'Unknown error'),
      );
    }
  }
  private async updateJobCore(jobId: bigint, dto: UpdateJobDto) {
    const { skill_ids, description, requirements, ...data } = dto;

    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
      include: { details: true },
    });
    if (!job) throw new NotFoundException('Không tìm thấy công việc');

    // ✅ DÙNG LẠI helper
    const location = await this.resolveLocationForUpdateOrThrow(job, data);

    const deadline = data.deadline ? new Date(data.deadline) : job.deadline;

    const category_id =
      data.category_id !== undefined
        ? BigInt(data.category_id as any)
        : job.category_id;

    await this.prisma.$transaction(async (tx) => {
      await tx.job.update({
        where: { id: jobId },
        data: {
          title: data.title ?? job.title,
          salary_min: data.salary_min ?? job.salary_min,
          salary_max: data.salary_max ?? job.salary_max,
          negotiable: data.negotiable ?? job.negotiable,
          employment_type: data.employment_type ?? job.employment_type,

          // JSON fields: PATCH đúng nghĩa
          ...(data.work_modes !== undefined && {
            work_modes: data.work_modes,
          }),
          ...(data.experience_levels !== undefined && {
            experience_levels: data.experience_levels,
          }),

          location_city: location.location_city,
          location_ward: location.location_ward,
          location_district: null,
          location_street: location.location_street,
          location_full: location.location_full,
          latitude: location.latitude,
          longitude: location.longitude,

          deadline,
          category_id,

          number_of_openings:
            data.number_of_openings !== undefined
              ? data.number_of_openings
              : job.number_of_openings,

          details: {
            upsert: {
              update: { description, requirements },
              create: { description, requirements },
            },
          },
        },
      });

      // skills
      if (skill_ids !== undefined) {
        await tx.jobSkill.deleteMany({ where: { job_id: jobId } });

        if (skill_ids.length) {
          await tx.jobSkill.createMany({
            data: skill_ids.map((id) => ({
              job_id: jobId,
              skill_id: id,
            })),
          });
        }
      }
    });

    return jobId;
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

      // side-effect ES -> queue
      await this.jobEventsQueue.jobStatusChanged(jobId, status);

      return {
        message: 'Cập nhật trạng thái công việc thành công',
      };
    } catch (error) {
      this.logger.error(
        '🔥 Lỗi cập nhật trạng thái job',
        error?.stack || error,
      );
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Không thể cập nhật trạng thái: ' + (error?.message || 'Unknown error'),
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
      number_of_openings: job.number_of_openings,
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


  // -----------------------------
  // Helper: Lấy full job
  // -----------------------------
  public getFullJob(id: bigint) {
    return this.prisma.job.findUnique({
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
  private async resolveLocationForCreateOrThrow(input: {
    location_city_id: number;
    location_ward_id?: number | null;
    location_street?: string | null;
    latitude?: number | null;
    longitude?: number | null;
  }) {
    const city = await this.prisma.locationCity.findUnique({
      where: { id: input.location_city_id },
    });
    if (!city) throw new BadRequestException('Thành phố không hợp lệ');

    let wardName: string | null = null;
    if (input.location_ward_id) {
      const ward = await this.prisma.locationWard.findFirst({
        where: {
          id: input.location_ward_id,
          city_id: city.id,
        },
        select: { name: true },
      });
      if (!ward) throw new BadRequestException('Phường/Xã không hợp lệ');
      wardName = ward.name;
    }

    const location_city = city.name;
    const location_ward = wardName;

    const parts = [input.location_street, location_ward, location_city].filter(
      Boolean,
    );
    const location_full = parts.join(', ');

    let latitude = input.latitude ?? null;
    let longitude = input.longitude ?? null;

    // giữ behavior cũ: thiếu lat/lon thì geocode sync
    if (!latitude && !longitude && location_full) {
      const geo = await this.locationService.geocodeAddress(location_full);
      latitude = geo.latitude;
      longitude = geo.longitude;
    }

    return {
      location_city,
      location_ward,
      location_street: input.location_street ?? null,
      location_full,
      latitude,
      longitude,
    };
  }
  private async resolveLocationForUpdateOrThrow(job: any, data: any) {
    let location_city = job.location_city;
    let location_ward = job.location_ward;

    // resolve city nếu có gửi ID
    if (data.location_city_id) {
      const city = await this.prisma.locationCity.findUnique({
        where: { id: data.location_city_id },
      });
      if (!city) throw new BadRequestException('Thành phố không hợp lệ');
      location_city = city.name;
    }

    // resolve ward nếu có
    if (data.location_ward_id) {
      const ward = await this.prisma.locationWard.findFirst({
        where: {
          id: data.location_ward_id,
          city_id: data.location_city_id ?? undefined,
        },
        select: { name: true },
      });
      if (!ward) throw new BadRequestException('Phường/Xã không hợp lệ');
      location_ward = ward.name;
    }

    // location_street
    const location_street = data.location_street ?? job.location_street;

    // build location_full nếu có thay đổi location parts
    let location_full = job.location_full;
    if (
      data.location_city_id ||
      data.location_ward_id ||
      data.location_street
    ) {
      const parts = [location_street, location_ward, location_city].filter(
        Boolean,
      );
      location_full = parts.join(', ');
    }

    let latitude = data.latitude ?? job.latitude;
    let longitude = data.longitude ?? job.longitude;

    // giữ behavior cũ: nếu đổi address -> geocode lại
    if (
      (data.location_city_id ||
        data.location_ward_id ||
        data.location_street) &&
      location_full
    ) {
      const geo = await this.locationService.geocodeAddress(location_full);
      latitude = geo.latitude;
      longitude = geo.longitude;
    }

    return {
      location_city,
      location_ward,
      location_street,
      location_full,
      latitude,
      longitude,
    };
  }
}
