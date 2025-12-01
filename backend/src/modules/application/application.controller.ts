import {
  Controller,
  Post,
  Get,
  Patch,
  Param,
  Query,
  Body,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ApplicationService } from './application.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { Role, ApplicationStatus } from '@prisma/client';
import { User } from '@/common/decorators/user.decorator';
import { GetApplicationsQueryDTO } from './dto/Get-ApplicationsQuery.dto';

// Guards
import { ApplicationOwnershipGuard } from '@/common/guards/application-ownership.guard';
import { ApplicationCandidateGuard } from '@/common/guards/application-candidate.guard';

@Controller('applications')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ApplicationController {
  constructor(private readonly applicationService: ApplicationService) {}

  // ====================================
  // 📌 API cho Candidate
  // ====================================

  /**
   * Ứng viên gửi đơn ứng tuyển
   */
  @Post('apply')
  @Roles(Role.candidate)
  async applyJob(
    @User('userId') userId: bigint,
    @Body() dto: CreateApplicationDto,
  ) {
    return this.applicationService.apply(userId, dto);
  }

  /**
   * Lấy danh sách đơn ứng tuyển của candidate
   */
  @Get('my')
  @Roles(Role.candidate)
  async getMyApplications(
    @User('userId') userId: bigint,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('status') status?: ApplicationStatus,
  ) {
    return this.applicationService.getMyApplications(
      userId,
      Number(page),
      Number(limit),
      status as ApplicationStatus,
    );
  }

  /**
   * Xem chi tiết đơn ứng tuyển của chính candidate
   */
  @Get('my/:id')
  @Roles(Role.candidate)
  @UseGuards(ApplicationCandidateGuard)
  async getMyApplicationDetail(
    @User('userId') userId: bigint,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.applicationService.getMyApplicationDetail(userId, BigInt(id));
  }

  /**
   * Ứng viên rút đơn ứng tuyển
   */
  @Patch('my/:id/withdraw')
  @Roles(Role.candidate)
  @UseGuards(ApplicationCandidateGuard)
  async withdrawApplication(
    @User('userId') userId: bigint,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.applicationService.withdrawApplication(userId, BigInt(id));
  }

  /**
   * Kiểm tra ứng viên đã ứng tuyển job chưa
   */
  @Get('check')
  @Roles(Role.candidate)
  async checkAlreadyApplied(
    @User('userId') userId: bigint,
    @Query('jobId', ParseIntPipe) jobId: number,
  ) {
    const exists = await this.applicationService.checkAlreadyApplied(
      userId,
      BigInt(jobId),
    );
    return { jobId, applied: exists };
  }

  // ====================================
  // 📌 API cho Recruiter
  // ====================================

  /**
   * Lấy danh sách ứng viên ứng tuyển job của công ty recruiter
   */
  @Get('company')
  @Roles(Role.recruiter)
  async getByCompany(
    @User('accountId') accountId: bigint,
    @Query() query: GetApplicationsQueryDTO,
  ) {
    return this.applicationService.getApplicationsByCompany(
      accountId,
      query.page,
      query.limit,
      query.status,
      query.jobId,
      query.search,
    );
  }

  /**
   * Recruiter xem chi tiết đơn ứng tuyển thuộc công ty mình
   */
  @Get('company/:id')
  @Roles(Role.recruiter)
  @UseGuards(ApplicationOwnershipGuard)
  async getCompanyApplicationDetail(
    @User('accountId') accountId: bigint,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.applicationService.getApplicationDetailByCompany(
      accountId,
      BigInt(id),
    );
  }

  /**
   * Recruiter chấp nhận đơn ứng tuyển
   */
  @Patch(':id/accept')
  @Roles(Role.recruiter)
  @UseGuards(ApplicationOwnershipGuard)
  async acceptApplication(
    @User('accountId') accountId: bigint,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.applicationService.acceptApplication(accountId, BigInt(id));
  }

  /**
   * Recruiter từ chối đơn ứng tuyển
   */
  @Patch(':id/reject')
  @Roles(Role.recruiter)
  @UseGuards(ApplicationOwnershipGuard)
  async rejectApplication(
    @User('accountId') accountId: bigint,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.applicationService.rejectApplication(accountId, BigInt(id));
  }

  // ====================================
  // 📌 Candidate check đã apply (route phụ)
  // ====================================
  @Get(':jobId/check')
  @Roles(Role.candidate)
  async checkAppliedByJob(
    @User('userId') userId: bigint,
    @Param('jobId', ParseIntPipe) jobId: number,
  ) {
    return this.applicationService.checkAlreadyApplied(userId, BigInt(jobId));
  }
}
