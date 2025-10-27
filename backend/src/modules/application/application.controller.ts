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
import { Role } from '@prisma/client';
import { User } from '@/common/decorators/user.decorator';
import { ApplicationStatus } from '@prisma/client';
import { GetApplicationsQueryDTO } from './dto/Get-ApplicationsQuery.dto';
@Controller('applications')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ApplicationController {
    constructor(private readonly applicationService: ApplicationService) {}

//===API dành cho candidate==========

  @Post('apply')
  @Roles(Role.candidate)
  async applyJob(
    @User('userId') userId: bigint,
    @Body() dto: CreateApplicationDto,
  ) {
    return this.applicationService.apply(userId, dto);
  }

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

  // Xem chi tiết một đơn ứng tuyển @Get('my/:id')
  @Get('my/:id')
  @Roles(Role.candidate)
  async getMyApplicationDetail(
    @User('userId') userId: bigint,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.applicationService.getMyApplicationDetail(userId, BigInt(id));
  }

  // Rút lại đơn ứng tuyển
  @Patch('my/:id/withdraw')
  @Roles(Role.candidate)
  async withdrawApplication(
    @User('userId') userId: bigint,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.applicationService.withdrawApplication(userId, BigInt(id));
  }

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

//=========API dành cho recruiter/admin==========

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

  @Get('company/:id')
  @Roles(Role.recruiter)
  async getCompanyApplicationDetail(
    @User('userId') recruiterId: bigint,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.applicationService.getApplicationDetailByCompany(recruiterId, BigInt(id));
  }

  @Patch(':id/accept')
  @Roles(Role.recruiter)
  async acceptApplication(
    @User('accountId') accountId: bigint,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.applicationService.acceptApplication(accountId, BigInt(id));
  }

  @Patch(':id/reject')
  @Roles(Role.recruiter)
  async rejectApplication(
    @User('accountId') accountId: bigint,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.applicationService.rejectApplication(accountId, BigInt(id));
  }

  @Get(':jobId/check')
  @Roles(Role.candidate)
  async checkAppliedByJob(
    @User('userId') userId: bigint,
    @Param('jobId', ParseIntPipe) jobId: number,
  ) {
    return this.applicationService.checkAlreadyApplied(userId, BigInt(jobId));
  }
}