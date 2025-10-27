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
import {Cron, CronExpression} from "@nestjs/schedule";
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
  async create(accountId: bigint, dto: CreateJobDto) {
    try {
      const { skill_ids, description, requirements, ...data } = dto;

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

      // ✅ Tự động lấy toạ độ (nếu có địa chỉ)
      let latitude = data.latitude ?? null;
      let longitude = data.longitude ?? null;
      if (!latitude && !longitude && location_full) {
        const geo = await this.locationService.geocodeAddress(location_full);
        latitude = geo.latitude;
        longitude = geo.longitude;
      }
      

      // ✅ Tạo job chính
      const job = await this.prisma.job.create({
        data: {
            company_id: company.id,
            ...data,
            ...(data.category_id ? { category_id: BigInt(data.category_id) } : {}),
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
        } as any, // tạm thời bỏ qua lỗi kiểu dữ liệu bigint
        include: { company: true },
        });

      // ✅ Gắn kỹ năng nếu có
      if (skill_ids?.length) {
        await this.prisma.jobSkill.createMany({
          data: skill_ids.map((id) => ({
            job_id: job.id,
            skill_id: id,
          })),
        });
      }

      // ✅ Lấy lại dữ liệu đầy đủ để index
      const fullJob = await this.getFullJob(job.id);

      // ✅ Index vào Elasticsearch
      await this.esJob.indexJob(fullJob);

      return fullJob;
    } catch (error) {
      console.error('🔥 Lỗi tạo job:', error);
      throw new InternalServerErrorException('Không thể tạo job: ' + error.message);
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
      const deadline = data.deadline
        ? new Date(data.deadline)
        : job.deadline;
      const category_id =
        data.category_id !== undefined
          ? BigInt(data.category_id as any)
          : job.category_id;
    const updateDetailData: any = {};
    if (description !== undefined) updateDetailData.description = description;
    if (requirements !== undefined) updateDetailData.requirements = requirements;

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
      throw new InternalServerErrorException('Không thể cập nhật job: ' + error.message);
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

    console.log(`🚀 Đã chuyển ${jobIds.length} job sang 'expired' và xóa khỏi Elasticsearch`);
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
}