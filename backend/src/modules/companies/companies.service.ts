import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CloudinaryService } from '@/modules/cloudinary/cloudinary.service';
import { CompanyStatus } from '@prisma/client';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
@Injectable()
export class CompaniesService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly cloudinary: CloudinaryService,
    ) {}
   async create(accountId: bigint, dto: CreateCompanyDto, file?: Express.Multer.File) {
    if (!file) throw new BadRequestException('Công ty bắt buộc phải có logo');

    try {
      const { secure_url, public_id } = await this.cloudinary.uploadFile(file, 'companies/logos');
      console.log('📤 Cloudinary upload success:', secure_url);

      return this.prisma.company.create({
        data: {
          account_id: accountId,
          ...dto,
          logo_url: secure_url,
          logo_public_id: public_id,
        },
      });
    } catch (error) {
      console.error('🔥 Lỗi tạo công ty:', error);
      throw new InternalServerErrorException('Không thể tạo công ty: ' + error.message);
    }
  }

    async update(companyId: bigint, dto: UpdateCompanyDto, file?: Express.Multer.File) {
    try {
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
        const { secure_url, public_id } = await this.cloudinary.uploadFile(file, 'companies/logos');
            logoUrl = secure_url;
            logoPublicId = public_id;
        }

        return this.prisma.company.update({
        where: { id: companyId },
        data: {
            ...dto,
            logo_url: logoUrl,
            logo_public_id: logoPublicId,
        },
        });
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

        return this.prisma.company.update({
        where: { id: companyId },
        data: { status: CompanyStatus.hidden },
        });
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

        return this.prisma.company.update({
        where: { id: companyId },
        data: { status: CompanyStatus.approved },
        });
    } catch (error) {
        console.error('🔥 Lỗi khôi phục công ty:', error);
        throw new InternalServerErrorException('Không thể khôi phục công ty: ' + error.message);
    }
}

   async findOne(companyId: bigint) {
    try {
        const company = await this.prisma.company.findFirst({
            where: { 
            id: companyId,
            status: 'approved',
            },
            include: {
            industry: true,
            jobs: {
                where: { status: 'active' },
                select: {
                    id: true,
                    title: true,
                    status: true,
                    location: true,
                    employment_type: true,
                    deadline: true,
                    created_at: true,
                    salary_min: true,
                    salary_max: true,
                    negotiable: true, // ✅ lấy flag này ra luôn
                },
            },
            },
        });

        return company;
    }
    catch (error) {
        console.error('🔥 Lỗi tìm công ty:', error);
        throw new InternalServerErrorException('Không thể tìm công ty: ' + error.message);
    }

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

      return updated;
    } catch (error) {
      console.error('🔥 Lỗi từ chối công ty:', error);
      throw new InternalServerErrorException(
        'Không thể từ chối công ty: ' + error.message,
      );
    }
  }
}