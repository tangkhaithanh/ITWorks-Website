import {
  Controller,
  Get,
  Logger,
  Param,
  ParseIntPipe,
  Req,
  UseGuards,
} from '@nestjs/common';
import { RecruiterMatchingAction, Role } from '@prisma/client';

import { Roles } from '@/common/decorators/roles.decorator';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { JobOwnershipGuard } from '@/common/guards/job-ownership.guard';
import { MatchingHistoryService } from '@/modules/matching-history/matching-history.service';
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
  private readonly logger = new Logger(AiSyncController.name);

  constructor(
    private readonly aiSyncService: AiSyncService,
    private readonly matchingHistoryService: MatchingHistoryService,
  ) {}

  @Get(':id/rank-applicants')
  @UseGuards(JobOwnershipGuard)
  async rankApplicants(
    @Req() req: MatchingRequest,
    @Param('id', ParseIntPipe) sourceJobId: number,
  ): Promise<unknown> {
    const jobId = BigInt(req.job?.id ?? sourceJobId);
    const result = (await this.aiSyncService.rankApplicants(
      Number(jobId),
    )) as unknown;

    await this.captureHistory(
      req.user?.accountId,
      jobId,
      RecruiterMatchingAction.RANK_APPLICANTS,
      result,
    );

    return result;
  }

  @Get(':id/find-talent')
  @UseGuards(JobOwnershipGuard)
  async findTalent(
    @Req() req: MatchingRequest,
    @Param('id', ParseIntPipe) sourceJobId: number,
  ): Promise<unknown> {
    const jobId = BigInt(req.job?.id ?? sourceJobId);
    const result = (await this.aiSyncService.findTalent(
      Number(jobId),
    )) as unknown;

    await this.captureHistory(
      req.user?.accountId,
      jobId,
      RecruiterMatchingAction.FIND_TALENT,
      result,
    );

    return result;
  }

  private async captureHistory(
    recruiterId: bigint | undefined,
    jobId: bigint,
    actionType: RecruiterMatchingAction,
    response: unknown,
  ) {
    if (!recruiterId) return;

    try {
      await this.matchingHistoryService.captureSession({
        recruiterId,
        jobId,
        actionType,
        response,
      });
    } catch (error) {
      this.logger.error(
        `Unable to persist ${actionType} history for job ${jobId.toString()}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }
}
