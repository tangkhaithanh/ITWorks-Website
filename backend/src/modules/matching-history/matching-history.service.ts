import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma, RecruiterMatchingAction } from '@prisma/client';

import { PrismaService } from '@/prisma/prisma.service';
import {
  toMatchingHistoryDetail,
  toMatchingHistorySummary,
} from './matching-history.mapper';

type CaptureMatchingSessionInput = {
  recruiterId: bigint;
  jobId: bigint;
  actionType: RecruiterMatchingAction;
  response: unknown;
};

@Injectable()
export class MatchingHistoryService {
  private readonly logger = new Logger(MatchingHistoryService.name);

  constructor(private readonly prisma: PrismaService) {}

  async captureSession(input: CaptureMatchingSessionInput) {
    const job = await this.prisma.job.findUnique({
      where: { id: input.jobId },
      select: {
        id: true,
        title: true,
        company: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!job) {
      this.logger.warn(
        `Skipped matching history capture for missing job ${input.jobId.toString()}`,
      );
      return null;
    }

    return this.prisma.recruiterMatchingHistory.create({
      data: {
        recruiter_id: input.recruiterId,
        job_id: job.id,
        action_type: input.actionType,
        job_title_snapshot: job.title,
        company_name_snapshot: job.company.name,
        response_snapshot: input.response as Prisma.InputJsonValue,
      },
    });
  }

  async findSummaries(recruiterId: bigint) {
    const histories = await this.prisma.recruiterMatchingHistory.findMany({
      where: { recruiter_id: recruiterId },
      orderBy: [{ searched_at: 'desc' }, { id: 'desc' }],
    });

    return histories.map(toMatchingHistorySummary);
  }

  async findDetail(id: bigint, recruiterId: bigint) {
    const history = await this.prisma.recruiterMatchingHistory.findFirst({
      where: {
        id,
        recruiter_id: recruiterId,
      },
    });

    if (!history) {
      throw new NotFoundException('Matching history session not found');
    }

    return toMatchingHistoryDetail(history);
  }
}
