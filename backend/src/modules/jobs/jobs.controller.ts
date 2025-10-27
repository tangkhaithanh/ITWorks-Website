import {Controller, Post,Patch, Body, UseGuards, Param,Get, Query} from '@nestjs/common';
import { JobsService } from './jobs.service';
import { CreateJobDto } from './dto/create-job.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { User } from '@/common/decorators/user.decorator';
import { UpdateJobDto } from './dto/update-job.dto';
import { Public } from '@/common/decorators/public.decorator';
@Controller('jobs')
@UseGuards(JwtAuthGuard, RolesGuard)
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  // -------------------------
  // CREATE JOB (Recruiter)
  // -------------------------
  @Post()
  @Roles(Role.recruiter)
  create(@User('accountId') accountId: bigint, @Body() dto: CreateJobDto) {
    return this.jobsService.create(accountId, dto);
  }

  @Patch(':id')
  @Roles(Role.recruiter)
  async update(@Param('id') id: string, @Body() dto: UpdateJobDto) {
    return this.jobsService.update(BigInt(id), dto);
  }

  @Patch(':id/hide')
  @Roles(Role.recruiter)
  async hideJob(@Param('id') id: string) {
    return this.jobsService.updateStatus(BigInt(id), 'hidden');
  }

  @Patch(':id/unhide')
  @Roles(Role.recruiter)
  async unhideJob(@Param('id') id: string) {
    return this.jobsService.updateStatus(BigInt(id), 'active');
  }

  @Patch(':id/close')
  @Roles(Role.recruiter, Role.admin)
  async closeJob(@Param('id') id: string) {
    return this.jobsService.updateStatus(BigInt(id), 'closed');
  }

  // Endpoint search job:
  @Public()
  @Post('search')
  async search(@Body() body: any) {
    console.log('📦 Body nhận được:', body);
    return this.jobsService.search(body);
  }
  @Public()
  @Get('suggest')
  async suggest(@Query('q') q: string) {
    return this.jobsService.suggest(q);
  }
  @Public()
  @Get(':id')
  async getJob(@Param('id') id: string) {
    // mode mặc định = 'public' → chỉ active & approved
    return this.jobsService.getOne(BigInt(id));
  }

  @Get(':id/edit')
  @Roles(Role.recruiter)
  async getJobForEdit(@Param('id') id: string) {
    // mode 'edit' cho phép lấy cả job chưa active hoặc công ty pending
    return this.jobsService.getOne(BigInt(id), 'edit');
  }

}