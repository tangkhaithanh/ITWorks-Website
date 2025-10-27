import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CloudinaryService } from '@/modules/cloudinary/cloudinary.service';
import { CompanyStatus } from '@prisma/client';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { ElasticsearchCompanyService } from '../elasticsearch/company.elasticsearch.service';
@Injectable()
export class CompaniesService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly cloudinary: CloudinaryService,
        private readonly esCompany: ElasticsearchCompanyService,
    ) {}
   async create(accountId: bigint, dto: CreateCompanyDto, file?: Express.Multer.File) {
    if (!file) throw new BadRequestException('Công ty bắt buộc phải có logo');
    try {
      const { industry_ids, skill_ids, ...cleanDto } = dto;
      const { secure_url, public_id } = await this.cloudinary.uploadImage(file, 'companies/logos');

      const company = await this.prisma.company.create({
        data: {
          account_id: accountId,
          ...cleanDto,
          logo_url: secure_url,
          logo_public_id: public_id,
        },
      });
      // Tạo liên kết industry & skill nếu có
      await this.linkIndustriesAndSkills(company.id, dto);
      // Lấy lại dữ liệu đầy đủ để index
      const fullCompany = await this.getFullCompany(company.id);
      await this.esCompany.indexCompany(fullCompany);
      return fullCompany;

    } catch (error) {
      console.error('🔥 Lỗi tạo công ty:', error);
      throw new InternalServerErrorException('Không thể tạo công ty: ' + error.message);
    }
  }

    async update(companyId: bigint, dto: UpdateCompanyDto, file?: Express.Multer.File) {
    try {
        const { industry_ids, skill_ids, ...cleanDto } = dto;
        const company = await this.prisma.company.findUnique({ where: { id: companyId } });
        if (!company) throw new NotFoundException('Không tìm thấy công ty');

        let logoUrl = company.logo_url;
        let logoPublicId = company.logo_public_id;

        if (file) {
        // Xoá logo cũ nếu có
        if (logoPublicId) {
            await this.cloudinary.deleteFile(logoPublicId);
        }

        // Upload logo mới
        const { secure_url, public_id } = await this.cloudinary.uploadImage(file, 'companies/logos');
            logoUrl = secure_url;
            logoPublicId = public_id;
        }

        const updatedCompany = await this.prisma.company.update({
        where: { id: companyId },
        data: {
            ...cleanDto,
            logo_url: logoUrl,
            logo_public_id: logoPublicId,
        },
        });

        await this.linkIndustriesAndSkills(companyId, dto, true);

        const fullCompany = await this.getFullCompany(companyId);
        await this.esCompany.updateCompany(fullCompany);
        return fullCompany;
    }
    catch (error) {
        console.error('🔥 Lỗi cập nhật công ty:', error);
        throw new InternalServerErrorException('Không thể cập nhật công ty: ' + error.message);
    }
}
    
    async hide(companyId: bigint) {
    try {
        const company = await this.prisma.company.findUnique({ where: { id: companyId } });
        if (!company) throw new NotFoundException('Không tìm thấy công ty');

        if (company.status !== CompanyStatus.approved) {
        throw new BadRequestException('Chỉ công ty ở trạng thái approved mới có thể ẩn');
        }

        const updated = await this.prisma.company.update({
            where: { id: companyId },
            data: { status: CompanyStatus.hidden },
        });

         await this.esCompany.removeCompany(companyId);
         return updated;
    } catch (error) {
        console.error('🔥 Lỗi ẩn công ty:', error);
        throw new InternalServerErrorException('Không thể ẩn công ty: ' + error.message);
    }
}

    async unhide(companyId: bigint) {
    try {
        const company = await this.prisma.company.findUnique({ where: { id: companyId } });
        if (!company) throw new NotFoundException('Không tìm thấy công ty');

        if (company.status !== CompanyStatus.hidden) {
        throw new BadRequestException('Chỉ công ty ở trạng thái hidden mới có thể khôi phục');
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
        throw new InternalServerErrorException('Không thể khôi phục công ty: ' + error.message);
    }
}

   async findOne(companyId: bigint, mode: 'public' | 'edit' = 'public') {
    const company = await this.getFullCompany(companyId);
    if (!company) throw new NotFoundException('Không tìm thấy công ty');

    // Nếu là public mà công ty chưa approved -> ẩn luôn
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

    // 🟣 EDIT MODE (recruiter xem / chỉnh sửa)
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
}

  // Hàm cho admin:
 async approve(companyId: bigint) {
    try {
      const company = await this.prisma.company.findUnique({
        where: { id: companyId },
      });

      if (!company) throw new NotFoundException('Không tìm thấy công ty');

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

  // Helper Xử lý industry và skills
  private async linkIndustriesAndSkills(
  companyId: bigint,
  dto: CreateCompanyDto | UpdateCompanyDto,
  replace = false,// replace true là update, false là create
) {
  // 🏭 Nếu DTO có industry_ids thì mới xử lý industry
  if (replace && dto.industry_ids !== undefined) {
    await this.prisma.companyIndustry.deleteMany({ where: { company_id: companyId } });
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
    await this.prisma.companySkill.deleteMany({ where: { company_id: companyId } });
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
  return await this.prisma.company.findUnique({
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
        },
      },
    },
  });
}

}