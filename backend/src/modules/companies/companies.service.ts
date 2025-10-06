import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
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
        if (!file) {
        throw new BadRequestException('Công ty bắt buộc phải có logo');
        }

        // Upload logo → lấy secure_url & public_id
        const { secure_url, public_id } = await this.cloudinary.uploadFile(file, 'companies/logos');

        return this.prisma.company.create({
        data: {
            account_id: accountId,
            ...dto,
            logo_url: secure_url,
            logo_public_id: public_id,
        },
        });
    }

    async update(companyId: bigint, dto: UpdateCompanyDto, file?: Express.Multer.File) {
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
    
    async hide(companyId: bigint) {
        const company = await this.prisma.company.findUnique({ where: { id: companyId } });
        if (!company) throw new NotFoundException('Không tìm thấy công ty');

        return this.prisma.company.update({
            where: { id: companyId },
            data: { status: CompanyStatus.hidden },
        });
    }

    async unhide(companyId: bigint) {
        const company = await this.prisma.company.findUnique({ where: { id: companyId } });
        if (!company) throw new NotFoundException('Không tìm thấy công ty');

        return this.prisma.company.update({
            where: { id: companyId },
            data: { status: CompanyStatus.approved },
        });
    }

   async findOne(companyId: bigint) {
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
}