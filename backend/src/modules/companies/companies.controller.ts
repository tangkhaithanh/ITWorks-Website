import {
  Controller,
  Post,
  Patch,
  Body,
  Param,
  UploadedFile,
  UseInterceptors,
  UseGuards,
  BadRequestException,
  Get,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CompaniesService } from './companies.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { User } from '@/common/decorators/user.decorator';

@Controller('companies')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  // -------------------------
  // CREATE COMPANY (Recruiter)
  // -------------------------
  @Post()
  @Roles(Role.recruiter)
  @UseInterceptors(
    FileInterceptor('logo', {
      limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png)$/)) {
          return cb(new BadRequestException('Chỉ chấp nhận file JPG/PNG'), false);
        }
        cb(null, true);
      },
    }),
  )
  create(
    @User('userId') accountId: bigint,
    @Body() dto: CreateCompanyDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.companiesService.create(accountId, dto, file);
  }

  // -------------------------
  // UPDATE COMPANY (Recruiter)
  // -------------------------
  @Patch(':id')
  @Roles(Role.recruiter)
  @UseInterceptors(
    FileInterceptor('logo', {
      limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png)$/)) {
          return cb(new BadRequestException('Chỉ chấp nhận file JPG/PNG'), false);
        }
        cb(null, true);
      },
    }),
  )
  update(
    @Param('id') id: string,
    @Body() dto: UpdateCompanyDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.companiesService.update(BigInt(id), dto, file);
  }

  // -------------------------
  // HIDE COMPANY (Admin)
  // -------------------------
  @Patch(':id/hide')
  @Roles(Role.admin, Role.recruiter)
  hide(@Param('id') id: string) {
    return this.companiesService.hide(BigInt(id));
  }

  // -------------------------
  // UNHIDE COMPANY (Admin)
  // -------------------------
  @Patch(':id/unhide')
  @Roles(Role.admin, Role.recruiter)
  unhide(@Param('id') id: string) {
    return this.companiesService.unhide(BigInt(id));
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.companiesService.findOne(BigInt(id));
  }

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
}
