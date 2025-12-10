import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  UploadedFiles,
  UseInterceptors,
  UseGuards,
  BadRequestException,
  Query,
} from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { User } from '@/common/decorators/user.decorator';
import { Public } from "@/common/decorators/public.decorator";
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { CompanyOwnershipGuard } from '@/common/guards/company-ownership.guard';
import { Req } from '@nestjs/common';
import { AdminGetCompaniesDto } from './dto/admin-get-companies.dto';
@Controller('companies')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) { }

  // =========================
  // CREATE COMPANY (Recruiter)
  // =========================
  @Post()
  @Roles(Role.recruiter)
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'logo', maxCount: 1 },
        { name: 'licenseFile', maxCount: 1 },
      ],
      {
        limits: { fileSize: 5 * 1024 * 1024 },
        fileFilter: (req, file, cb) => {
          if (file.fieldname === 'logo' && !file.mimetype.match(/\/(jpg|jpeg|png)$/))
            return cb(new BadRequestException('Logo phải JPG/PNG'), false);

          if (file.fieldname === 'licenseFile' && !file.mimetype.match(/pdf$/))
            return cb(new BadRequestException('Giấy phép phải PDF'), false);

          cb(null, true);
        },
      },
    ),
  )
  create(
    @User('accountId') accountId: bigint,
    @Body() dto: CreateCompanyDto,
    @UploadedFiles() files: any,
  ) {
    return this.companiesService.create(
      accountId,
      dto,
      files.logo?.[0],
      files.licenseFile?.[0],
    );
  }

  // =========================
  // UPDATE COMPANY (Recruiter) – NEED GUARD
  // =========================
  @Patch(':id')
  @Roles(Role.recruiter)
  @UseGuards(CompanyOwnershipGuard)
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'logo', maxCount: 1 },
        { name: 'licenseFile', maxCount: 1 },
      ],
      {
        limits: { fileSize: 5 * 1024 * 1024 },
        fileFilter: (req, file, cb) => {
          if (file.fieldname === 'logo' && !file.mimetype.match(/\/(jpg|jpeg|png)$/))
            return cb(new BadRequestException('Logo phải JPG/PNG'), false);

          const allowedFiles = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          ];
          if (file.fieldname === 'licenseFile' && !allowedFiles.includes(file.mimetype))
            return cb(new BadRequestException('Giấy phép phải PDF/DOC/DOCX'), false);

          cb(null, true);
        },
      },
    ),
  )
  update(
    @Req() req: any,
    @Body() dto: UpdateCompanyDto,
    @UploadedFiles() files: any,
  ) {
    return this.companiesService.update(
      req.company.id,
      dto,
      files.logo?.[0],
      files.licenseFile?.[0],
    );
  }

  // =========================
  // GET MY COMPANY
  // =========================
  @Get('my-company')
  @Roles(Role.recruiter)
  getMyCompany(@User('accountId') accountId: bigint) {
    return this.companiesService.getMyCompany(accountId);
  }

  // Get all company for admin:
  @Get()
  @Roles(Role.admin)
  getAllCompanies(@Query() query: AdminGetCompaniesDto) {
    return this.companiesService.adminGetCompanies(query);
  }

  // =========================
  // HIDE COMPANY (Admin + Recruiter owner)
  // =========================
  @Patch(':id/hide')
  @Roles(Role.admin, Role.recruiter)
  @UseGuards(CompanyOwnershipGuard)
  hide(@Req() req: any) {
    return this.companiesService.hide(req.company.id);
  }

  @Patch(':id/unhide')
  @Roles(Role.admin, Role.recruiter)
  @UseGuards(CompanyOwnershipGuard)
  unhide(@Req() req: any) {
    return this.companiesService.unhide(req.company.id);
  }

  // =========================
  // PUBLIC GET COMPANY
  // =========================
  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.companiesService.findOne(BigInt(id));
  }

  // =========================
  // APPROVE / REJECT COMPANY (Admin only)
  // =========================
  @Patch(':id/approve')
  @Roles(Role.admin)
  approve(@Param('id') id: string) {
    return this.companiesService.approve(BigInt(id));
  }

  @Patch(':id/reject')
  @Roles(Role.admin)
  reject(@Param('id') id: string) {
    return this.companiesService.reject(BigInt(id));
  }

  // =========================
  // GET COMPANY FOR EDIT
  // (Recruiter owner OR Admin)
  // =========================
  @Get(':id/edit')
  @Roles(Role.recruiter, Role.admin)
  @UseGuards(CompanyOwnershipGuard)
  getForEdit(@Req() req: any) {
    return this.companiesService.findOne(req.company.id, 'edit');
  }
}
