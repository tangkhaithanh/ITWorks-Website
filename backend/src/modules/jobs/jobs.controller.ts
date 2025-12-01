import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { JobsService } from './jobs.service';
import { Roles } from '@/common/decorators/roles.decorator';
import { User } from '@/common/decorators/user.decorator';
import { Public } from '@/common/decorators/public.decorator';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { JobStatus, Role } from '@prisma/client';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { ResetDeadlineDto } from './dto/reset-deadline.dto';
import { JobOwnershipGuard } from '@/common/guards/job-ownership.guard';
import { JobDashboardQueryDto } from './dto/job-dashboard-query.dto';
@Controller('jobs')
@UseGuards(JwtAuthGuard, RolesGuard)
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Post()
  @Roles(Role.recruiter)
  create(@User('accountId') accountId: bigint, @Body() dto: CreateJobDto) {
    return this.jobsService.create(accountId, dto);
  }

  @Public()
  @Post('search')
  async search(@Body() body: any) {
    return this.jobsService.search(body);
  }

  @Public()
  @Get('suggest')
  async suggest(@Query('q') q: string) {
    return this.jobsService.suggest(q);
  }

  @Get('company')
  @Roles(Role.recruiter)
  async getCompanyJobs(
    @User('accountId') accountId: bigint,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('search') search?: string,
    @Query('status') status?: JobStatus,
  ) {
    return this.jobsService.getCompanyJobs(
      accountId,
      Number(page),
      Number(limit),
      search,
      status as JobStatus,
    );
  }

  @Get('company/dropdown')
  @Roles(Role.recruiter)
  getCompanyJobsForDropdown(@User('accountId') accountId: bigint) {
    return this.jobsService.getJobsDropdownByCompany(accountId);
  }

  // ============================
  // 📌 GET JOB FOR EDIT (must check ownership)
  // ============================
  @Get(':id/edit')
  @Roles(Role.recruiter)
  @UseGuards(JobOwnershipGuard)
  getJobForEdit(@Param('id') id: string, @Req() req: any) {
    return this.jobsService.getOne(req.job.id, 'edit');
  }

  // ============================
  // 📌 UPDATE JOB
  // ============================
  @Patch(':id')
  @Roles(Role.recruiter)
  @UseGuards(JobOwnershipGuard)
  update(@Req() req: any, @Body() dto: UpdateJobDto) {
    return this.jobsService.update(req.job.id, dto);
  }

  // ============================
  // 📌 HIDE JOB
  // ============================
  @Patch(':id/hide')
  @Roles(Role.recruiter)
  @UseGuards(JobOwnershipGuard)
  hideJob(@Req() req: any) {
    return this.jobsService.updateStatus(req.job.id, 'hidden');
  }

  // ============================
  // 📌 UNHIDE JOB
  // ============================
  @Patch(':id/unhide')
  @Roles(Role.recruiter)
  @UseGuards(JobOwnershipGuard)
  unhideJob(@Req() req: any) {
    return this.jobsService.updateStatus(req.job.id, 'active');
  }

  // ============================
  // 📌 CLOSE JOB
  // ============================
  @Patch(':id/close')
  @Roles(Role.recruiter, Role.admin)
  @UseGuards(JobOwnershipGuard)
  closeJob(@Req() req: any) {
    return this.jobsService.updateStatus(req.job.id, 'closed');
  }

  // ============================
  // 📌 RESET DEADLINE
  // ============================
  @Patch(':id/deadline')
  @Roles(Role.recruiter)
  @UseGuards(JobOwnershipGuard)
  resetDeadline(
    @Req() req: any,
    @Body() body: ResetDeadlineDto,
  ) {
    return this.jobsService.resetDeadline(req.job.id, body.newDeadline);
  }

  @Get(':id/dashboard')
  @Roles(Role.recruiter)
  @UseGuards(JobOwnershipGuard)
  getJobDashboard(
    @Req() req: any,
    @Query() query: JobDashboardQueryDto,
  ) {
    // JobOwnershipGuard đã gắn req.job.id (BigInt)
    return this.jobsService.getJobDashboard(req.job.id, query);
  }

   // ============================
  // 📌 GET JOB BY ID (PUBLIC)
  // ============================
  @Public()
  @Get(':id')
  getJob(@Param('id') id: string) {
    return this.jobsService.getOne(BigInt(id));
  }
}
