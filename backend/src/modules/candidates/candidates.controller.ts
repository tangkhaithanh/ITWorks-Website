import {
  Controller,
  Post,
  Delete,
  Get,
  Body,
  Param,
  UseGuards,
  Patch,
} from '@nestjs/common';
import { CandidatesService } from './candidates.service';
import { SaveJobDto } from './dto/saved-job.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { User } from '@/common/decorators/user.decorator';
import { CreateCandidateDto } from './dto/create-candidate.dto';
import { UpdateCandidateDto } from './dto/update-candidate.dto';
@Controller('candidates')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.candidate)
export class CandidatesController {
  constructor(private candidatesService: CandidatesService) {}

  @Post('saved-jobs')
  async saveJob(@User('userId') userId: bigint, @Body() dto: SaveJobDto) {
    console.log('Saving job for userId:', userId, 'with jobId:', dto.job_id);
    return this.candidatesService.saveJob(userId, BigInt(dto.job_id));
  }

  @Delete('saved-jobs/:jobId')
  async unsaveJob(
    @User('userId') userId: bigint,
    @Param('jobId') jobId: string,
  ) {
    return this.candidatesService.unsaveJob(userId, BigInt(jobId));
  }

  @Get('saved-jobs')
  async getSavedJobs(@User('userId') userId: bigint) {
    return this.candidatesService.getSavedJobs(userId);
  }

  @Get('saved-jobs/:jobId/check')
  async checkSavedJob(
    @User('userId') userId: bigint,
    @Param('jobId') jobId: string,
  ) {
    return this.candidatesService.checkSavedJob(userId, BigInt(jobId));
  }

  @Post()
  async create(
    @User('userId') userId: bigint,
    @Body() dto: CreateCandidateDto,
  ) {
    return this.candidatesService.create(userId, dto);
  }

  @Patch()
  async update(
    @User('userId') userId: bigint,
    @Body() dto: UpdateCandidateDto,
  ) {
    return this.candidatesService.update(userId, dto);
  }

  // Lấy thông tin của candidate hiện tại:
  @Get()
  async findOne(@User('accountId') accountId: bigint) {
    return this.candidatesService.getFullUserProfile(accountId);
  }
}
