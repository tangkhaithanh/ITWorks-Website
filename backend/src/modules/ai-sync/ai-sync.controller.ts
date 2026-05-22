import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';

import { Roles } from '@/common/decorators/roles.decorator';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { JobOwnershipGuard } from '@/common/guards/job-ownership.guard';
import { AiSyncService } from './ai-sync.service';

type MatchingRequest = {
  job?: {
    id?: bigint | number | string;
  };
  user?: {
    accountId?: bigint;
  };
};

@Controller('matching')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.recruiter)
export class AiSyncController {
  constructor(private readonly aiSyncService: AiSyncService) {}

  @Get(':id/rank-applicants')
  @UseGuards(JobOwnershipGuard)
  async rankApplicants(
    @Req() req: MatchingRequest,
    @Param('id', ParseIntPipe) sourceJobId: number,
  ): Promise<unknown> {
    const jobId = BigInt(req.job?.id ?? sourceJobId);
    return this.aiSyncService.rankApplicants(
      Number(jobId),
      req.user?.accountId,
    );
  }

  @Get(':id/find-talent')
  @UseGuards(JobOwnershipGuard)
  async findTalent(
    @Req() req: MatchingRequest,
    @Param('id', ParseIntPipe) sourceJobId: number,
  ): Promise<unknown> {
    const jobId = BigInt(req.job?.id ?? sourceJobId);
    return this.aiSyncService.findTalent(Number(jobId), req.user?.accountId);
  }
}
