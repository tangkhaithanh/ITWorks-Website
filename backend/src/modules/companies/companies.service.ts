import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
  HttpException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CloudinaryService } from '@/modules/cloudinary/cloudinary.service';
import { CompanyStatus } from '@prisma/client';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { ElasticsearchCompanyService } from '../elasticsearch/company.elasticsearch.service';
import { JobsService } from '@/modules/jobs/jobs.service';
import { AdminGetCompaniesDto } from './dto/admin-get-companies.dto';
import { JobStatus } from '@prisma/client';
import { PlanStatus } from '@prisma/client';
import { AiSyncProducer } from '@/modules/ai-sync/ai-sync.producer';
@Injectable()
export class CompaniesService {
  private readonly logger = new Logger(CompaniesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinary: CloudinaryService,
    private readonly esCompany: ElasticsearchCompanyService,
    private readonly jobsService: JobsService,
    private readonly aiSyncProducer: AiSyncProducer,
  ) {}
  async create(
    accountId: bigint,
    dto: CreateCompanyDto,
    logo?: Express.Multer.File,
    licenseFile?: Express.Multer.File,
  ) {
    if (!logo) {
      throw new BadRequestException('Công ty bắt buộc phải có logo');
    }
    if (!licenseFile) {
      throw new BadRequestException('Vui lòng upload giấy phép kinh doanh');
    }

    try {
      const { industry_ids, skill_ids, ...cleanDto } = dto;

      // --- Upload logo ---
      const logoUploaded = await this.cloudinary.uploadImage(
        logo,
        'companies/logos',
      );

      // --- Upload license PDF ---
      const licenseUploaded = await this.cloudinary.uploadDocument(
        licenseFile,
        'companies/licenses',
      );

      const company = await this.prisma.company.create({
        data: {
          account_id: accountId,
          ...cleanDto,
          founded_date: new Date(dto.founded_date),
          logo_url: logoUploaded.secure_url,
          logo_public_id: logoUploaded.public_id,

          license_file_url: licenseUploaded.secure_url,
          license_file_public_id: licenseUploaded.public_id,
        },
      });

      await this.linkIndustriesAndSkills(company.id, dto);

      const fullCompany = await this.getFullCompany(company.id);
      await this.esCompany.indexCompany(fullCompany);

      return fullCompany;
    } catch (error) {
      console.error('🔥 Lỗi tạo công ty:', error);
      throw new InternalServerErrorException(
        'Không thể tạo công ty: ' + error.message,
      );
    }
  }

  async update(
    id: bigint,
    dto: UpdateCompanyDto,
    logo?: Express.Multer.File,
    licenseFile?: Express.Multer.File,
  ) {
    try {
      const company = await this.prisma.company.findUnique({ where: { id } });
      if (!company) throw new NotFoundException('Không tìm thấy công ty.');

      // Clean DTO – remove undefined and REMOVE industry_ids and skill_ids
      const updateData: any = {};
      Object.entries(dto).forEach(([key, val]) => {
        if (
          val !== undefined &&
          val !== null &&
          key !== 'industry_ids' &&
          key !== 'skill_ids'
        ) {
          updateData[key] = val;
        }
      });

      // Convert date
      if (updateData.founded_date) {
        updateData.founded_date = new Date(updateData.founded_date);
      }

      // UPDATE LOGO
      if (logo) {
        if (company.logo_public_id) {
          await this.cloudinary.deleteFile(company.logo_public_id);
        }
        const uploadedLogo = await this.cloudinary.uploadImage(
          logo,
          'companies/logos',
        );
        updateData.logo_url = uploadedLogo.secure_url;
        updateData.logo_public_id = uploadedLogo.public_id;
      }

      // UPDATE LICENSE
      if (licenseFile) {
        if (company.license_file_public_id) {
          await this.cloudinary.deleteFile(company.license_file_public_id);
        }
        const uploadedLicense = await this.cloudinary.uploadDocument(
          licenseFile,
          'companies/licenses',
        );
        updateData.license_file_url = uploadedLicense.secure_url;
        updateData.license_file_public_id = uploadedLicense.public_id;
      }
      updateData.status = CompanyStatus.pending;
      // UPDATE COMPANY
      const updated = await this.prisma.company.update({
        where: { id },
        data: updateData,
      });

      // UPDATE INDUSTRY + SKILLS (correctly)
      await this.linkIndustriesAndSkills(id, dto, true);

      const fullCompany = await this.getFullCompany(id);
      if (!fullCompany) {
        throw new NotFoundException('Không lấy được full company');
      }
      await this.esCompany.indexCompany(fullCompany);
      // Lấy danh sách job của công ty
      const jobs = await this.prisma.job.findMany({
        where: { company_id: company.id },
      });

      // Reindex từng job
      await this.jobsService.reindexJobsByCompany(company.id);
      console.log('🔥 DB COMPANY AFTER UPDATE:', updated);
      console.log(
        '🔥 FULL COMPANY AFTER UPDATE:',
        fullCompany.name,
        fullCompany.logo_url,
      );

      return fullCompany;
    } catch (error) {
      console.error('🔥 Lỗi UPDATE công ty:', error);
      throw new InternalServerErrorException(
        `Lỗi khi cập nhật công ty: ${error.message}`,
      );
    }
  }
  async hide(companyId: bigint) {
    try {
      const company = await this.prisma.company.findUnique({
        where: { id: companyId },
      });
      if (!company) throw new NotFoundException('Không tìm thấy công ty');

      if (company.status !== CompanyStatus.approved) {
        throw new BadRequestException(
          'Chỉ công ty ở trạng thái approved mới có thể ẩn',
        );
      }

      const updated = await this.prisma.company.update({
        where: { id: companyId },
        data: { status: CompanyStatus.hidden },
      });

      await this.esCompany.removeCompany(companyId);
      return updated;
    } catch (error) {
      console.error('🔥 Lỗi ẩn công ty:', error);
      throw new InternalServerErrorException(
        'Không thể ẩn công ty: ' + error.message,
      );
    }
  }

  async unhide(companyId: bigint) {
    try {
      const company = await this.prisma.company.findUnique({
        where: { id: companyId },
      });
      if (!company) throw new NotFoundException('Không tìm thấy công ty');

      if (company.status !== CompanyStatus.hidden) {
        throw new BadRequestException(
          'Chỉ công ty ở trạng thái hidden mới có thể khôi phục',
        );
      }

      const updated = await this.prisma.company.update({
        where: { id: companyId },
        data: { status: CompanyStatus.approved },
      });

      const fullCompany = await this.getFullCompany(companyId);
      await this.esCompany.indexCompany(fullCompany);
      return updated;
    } catch (error) {
      console.error('🔥 Lỗi khôi phục công ty:', error);
      throw new InternalServerErrorException(
        'Không thể khôi phục công ty: ' + error.message,
      );
    }
  }

  async findOne(companyId: bigint, mode: 'public' | 'edit' = 'public') {
    try {
      const company = await this.getFullCompany(companyId);
      if (!company) {
        throw new NotFoundException('Không tìm thấy công ty');
      }

      // Nếu là public nhưng công ty chưa approved → không cho xem
      if (mode === 'public' && company.status !== 'approved') {
        throw new NotFoundException('Công ty chưa được duyệt hoặc đã bị ẩn');
      }

      // -------------------
      // 1️⃣ Base info dùng chung
      // -------------------
      const base = {
        id: company.id,
        name: company.name,
        logo_url: company.logo_url,
        website: company.website,
        description: company.description,
        address: company.address,
        headquarters: company.headquarters,
        size: company.size,
        contact_email: company.contact_email,
        contact_phone: company.contact_phone,
        status: company.status,
        industries: company.industry_info.map((ci) => ci.industry.name),
        tech_stacks: company.skills.map((cs) => cs.skill.name),
      };

      // -------------------
      // 2️⃣ Mode xử lý
      // -------------------

      // 🟢 PUBLIC MODE (ứng viên xem)
      if (mode === 'public') {
        return {
          ...base,
          jobs: company.jobs.filter((j) => j.status === 'active'),
        };
      }

      // 🟣 EDIT MODE (recruiter hoặc admin xem/edit)
      return {
        ...base,
        industry_ids: company.industry_info.map((ci) => ci.industry_id),
        skill_ids: company.skills.map((cs) => cs.skill_id),
        business_code: company.business_code,
        representative_name: company.representative_name,
        representative_position: company.representative_position,
        license_file_url: company.license_file_url,
        founded_date: company.founded_date,
      };
    } catch (error) {
      console.error('findOne() error:', error);

      // Nếu lỗi đã là HttpException (NotFound, Forbidden, ...) → ném lại
      if (error instanceof HttpException) {
        throw error;
      }

      // Lỗi bất ngờ → báo lỗi server
      throw new InternalServerErrorException(
        'Đã xảy ra lỗi khi lấy thông tin công ty',
      );
    }
  }

  // Hàm cho admin:
  async approve(companyId: bigint) {
    try {
      this.logger.log(
        `[APPROVE_COMPANY] Start companyId=${companyId.toString()}`,
      );
      const company = await this.prisma.company.findUnique({
        where: { id: companyId },
      });

      if (!company) throw new NotFoundException('Không tìm thấy công ty');

      this.logger.log(
        `[APPROVE_COMPANY] Loaded companyId=${companyId.toString()} status=${company.status} aiServiceId=${company.ai_service_id ?? 'null'}`,
      );

      if (company.status !== CompanyStatus.pending) {
        throw new BadRequestException(
          'Chỉ có thể duyệt công ty đang ở trạng thái pending',
        );
      }

      const updated = await this.prisma.company.update({
        where: { id: companyId },
        data: { status: CompanyStatus.approved },
      });

      const fullCompany = await this.getFullCompany(companyId);
      await this.esCompany.indexCompany(fullCompany);
      this.logger.log(
        `[APPROVE_COMPANY] Indexed Elasticsearch companyId=${companyId.toString()}`,
      );
      await this.aiSyncProducer.companyApproved(companyId);
      this.logger.log(
        `[APPROVE_COMPANY] Queued AI sync companyId=${companyId.toString()}`,
      );

      return updated;
    } catch (error) {
      console.error('🔥 Lỗi duyệt công ty:', error);
      throw new InternalServerErrorException(
        'Không thể duyệt công ty: ' + error.message,
      );
    }
  }

  async reject(companyId: bigint) {
    try {
      const company = await this.prisma.company.findUnique({
        where: { id: companyId },
      });

      if (!company) throw new NotFoundException('Không tìm thấy công ty');

      if (company.status !== CompanyStatus.pending) {
        throw new BadRequestException(
          'Chỉ có thể từ chối công ty đang ở trạng thái pending',
        );
      }

      const updated = await this.prisma.company.update({
        where: { id: companyId },
        data: { status: CompanyStatus.rejected },
      });
      await this.esCompany.removeCompany(companyId);
      return updated;
    } catch (error) {
      console.error('🔥 Lỗi từ chối công ty:', error);
      throw new InternalServerErrorException(
        'Không thể từ chối công ty: ' + error.message,
      );
    }
  }

  async getMyCompany(accountId: bigint) {
    const company = await this.prisma.company.findUnique({
      where: { account_id: accountId },
      include: {
        industry_info: { include: { industry: true } },
        skills: { include: { skill: true } },
      },
    });

    if (!company) {
      // ❗ Return THUẦN — interceptor sẽ wrap lại
      return null;
    }

    // ❗ Return THUẦN OBJECT — interceptor sẽ wrap thành { success, message, data }
    return company;
  }
  // Helper Xử lý industry và skills
  private async linkIndustriesAndSkills(
    companyId: bigint,
    dto: CreateCompanyDto | UpdateCompanyDto,
    replace = false, // replace true là update, false là create
  ) {
    // 🏭 Nếu DTO có industry_ids thì mới xử lý industry
    if (replace && dto.industry_ids !== undefined) {
      await this.prisma.companyIndustry.deleteMany({
        where: { company_id: companyId },
      });
      if (dto.industry_ids.length) {
        await this.prisma.companyIndustry.createMany({
          data: dto.industry_ids.map((id) => ({
            company_id: companyId,
            industry_id: id,
          })),
        });
      }
    }

    // 💡 Nếu DTO có skill_ids thì mới xử lý skill
    if (replace && dto.skill_ids !== undefined) {
      await this.prisma.companySkill.deleteMany({
        where: { company_id: companyId },
      });
      if (dto.skill_ids.length) {
        await this.prisma.companySkill.createMany({
          data: dto.skill_ids.map((id) => ({
            company_id: companyId,
            skill_id: id,
          })),
        });
      }
    }

    // 🆕 Khi tạo mới (replace = false)
    if (!replace) {
      if (dto.industry_ids?.length) {
        await this.prisma.companyIndustry.createMany({
          data: dto.industry_ids.map((id) => ({
            company_id: companyId,
            industry_id: id,
          })),
        });
      }

      if (dto.skill_ids?.length) {
        await this.prisma.companySkill.createMany({
          data: dto.skill_ids.map((id) => ({
            company_id: companyId,
            skill_id: id,
          })),
        });
      }
    }
  }

  private async getFullCompany(id: bigint) {
    return this.prisma.company.findUnique({
      where: { id },
      include: {
        industry_info: { include: { industry: true } },
        skills: { include: { skill: true } },
        jobs: {
          select: {
            id: true,
            title: true,
            status: true,
            employment_type: true,
            deadline: true,
            salary_min: true,
            salary_max: true,
            negotiable: true,
            location_city: true,
            created_at: true,
            // ✅ THÊM PHẦN NÀY
            category: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });
  }
  // Hàm lấy toàn bộ công ty dành cho admin:
  async adminGetCompanies(query: AdminGetCompaniesDto) {
    const { page, limit, search, status } = query;

    const where: any = {};

    // 🔍 Search theo tên công ty / email account / business code
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { business_code: { contains: search } },
        {
          account: {
            email: { contains: search },
          },
        },
      ];
    }

    //Filter theo trạng thái
    if (status) {
      where.status = status;
    }

    const total = await this.prisma.company.count({ where });

    const companies = await this.prisma.company.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: [
        { status: 'asc' }, // pending lên đầu
        { created_at: 'desc' }, // trong mỗi nhóm, mới → cũ
      ],
      include: {
        account: { select: { email: true } },
        jobs: { select: { id: true } },
      },
    });

    const data = companies.map((c) => ({
      id: c.id,
      name: c.name,
      logo_url: c.logo_url,
      status: c.status,
      created_at: c.created_at,
      account_email: c.account.email,
      total_jobs: c.jobs.length,
      representative_name: c.representative_name,
      contact_email: c.contact_email,
    }));

    return {
      companies: data,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }

  // Hàm tìm kiếm công ty:
  async searchCompanies(keyword?: string, page = 1, limit = 12) {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const skip = (page - 1) * limit;
    const hasKeyword = !!keyword && keyword.trim().length > 0;

    /**
     * =================================================
     * BASE QUERY (approved companies)
     * =================================================
     */
    const companies = await this.prisma.company.findMany({
      where: {
        status: CompanyStatus.approved,
        ...(hasKeyword && {
          name: {
            contains: keyword,
          },
        }),
      },
      include: {
        companyPlan: true,
        jobs: {
          where: {
            status: JobStatus.active,
          },
          select: {
            id: true,
            created_at: true,
          },
        },
      },
    });

    /**
     * =================================================
     * SOFT RANKING (DÙ CÓ HAY KHÔNG KEYWORD)
     * =================================================
     */
    const ranked = companies
      .map((c) => {
        const hasActivePlan =
          c.companyPlan &&
          c.companyPlan.status === PlanStatus.active &&
          c.companyPlan.end_date > now;

        const jobsLast30Days = c.jobs.filter(
          (j) => j.created_at >= thirtyDaysAgo,
        );

        let score = 0;

        if (hasActivePlan) score += 100;
        if (jobsLast30Days.length > 0) score += jobsLast30Days.length * 10;
        if (c.jobs.length > 0) score += 5;

        return {
          id: c.id,
          name: c.name,
          logo_url: c.logo_url,
          score,
        };
      })
      .sort((a, b) => b.score - a.score);

    /**
     * =================================================
     * PAGINATION
     * =================================================
     */
    const total = ranked.length;
    const paged = ranked.slice(skip, skip + limit);

    return {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      result: paged.map(({ score, ...rest }) => rest),
    };
  }
}
