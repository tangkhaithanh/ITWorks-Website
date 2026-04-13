import { Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job, UnrecoverableError } from 'bullmq';

import { AI_SYNC_JOB_NAMES, QUEUES } from '@/modules/queue/queue.constants';
import { AiSyncRequestError } from '../ai-sync.errors';
import { AiSyncService } from '../ai-sync.service';

@Processor(QUEUES.AI_SYNC)
export class AiSyncConsumer extends WorkerHost {
  private readonly logger = new Logger(AiSyncConsumer.name);

  constructor(private readonly aiSyncService: AiSyncService) {
    super();
  }

  async process(job: Job) {
    const attempt = job.attemptsMade + 1;
    this.logger.log(
      `Processing AI sync job name=${job.name} attempt=${attempt} data=${JSON.stringify(job.data)}`,
    );

    try {
      switch (job.name) {
        case AI_SYNC_JOB_NAMES.COMPANY_CREATED:
        case AI_SYNC_JOB_NAMES.COMPANY_APPROVED:
          this.logger.log(
            `[AI_SYNC_CONSUMER] Start companyId=${job.data.companyId}`,
          );
          await this.aiSyncService.syncCompany(BigInt(job.data.companyId));
          this.logger.log(
            `[AI_SYNC_CONSUMER] Done companyId=${job.data.companyId}`,
          );
          break;
        case AI_SYNC_JOB_NAMES.JOB_CREATED:
          await this.aiSyncService.syncJobCreated(BigInt(job.data.jobId));
          break;
        case AI_SYNC_JOB_NAMES.JOB_UPDATED:
          await this.aiSyncService.syncJobUpdated(BigInt(job.data.jobId));
          break;
        case AI_SYNC_JOB_NAMES.JOB_STATUS_CHANGED:
          await this.aiSyncService.syncJobStatusChanged(BigInt(job.data.jobId));
          break;
        case AI_SYNC_JOB_NAMES.CANDIDATE_CREATED:
          await this.aiSyncService.syncCandidateCreated(
            BigInt(job.data.candidateId),
          );
          break;
        case AI_SYNC_JOB_NAMES.CANDIDATE_UPDATED:
          await this.aiSyncService.syncCandidateUpdated(
            BigInt(job.data.candidateId),
          );
          break;
        case AI_SYNC_JOB_NAMES.APPLICATION_APPLIED:
          await this.aiSyncService.syncApplicationApplied(
            BigInt(job.data.applicationId),
          );
          break;
        case AI_SYNC_JOB_NAMES.CV_UPLOADED:
          await this.aiSyncService.syncCvUploaded(BigInt(job.data.cvId));
          break;
        case AI_SYNC_JOB_NAMES.CV_SEARCHABLE_CHANGED:
          await this.aiSyncService.syncCvSearchableChanged(
            BigInt(job.data.candidateId),
            BigInt(job.data.cvId),
            job.data.isSearchable === 'true',
          );
          break;
        default:
          throw new AiSyncRequestError(
            `Unhandled AI sync job name: ${job.name}`,
            false,
          );
      }
    } catch (error) {
      if (error instanceof AiSyncRequestError && !error.retryable) {
        this.logger.error(
          `Non-retryable AI sync error name=${job.name} message=${error.message} response=${JSON.stringify(error.responseData)}`,
        );
        throw new UnrecoverableError(error.message);
      }

      this.logger.error(
        `Retryable AI sync error name=${job.name} attempt=${attempt}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }
}
