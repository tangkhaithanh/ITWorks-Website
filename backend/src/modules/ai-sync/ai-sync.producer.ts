import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

import { AI_SYNC_JOB_NAMES, QUEUES } from '@/modules/queue/queue.constants';

@Injectable()
export class AiSyncProducer {
  private readonly logger = new Logger(AiSyncProducer.name);

  constructor(
    @InjectQueue(QUEUES.AI_SYNC)
    private readonly queue: Queue,
  ) {}

  private readonly defaultJobOptions = {
    attempts: 5,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: 200,
    removeOnFail: 500,
  };

  async companyApproved(companyId: bigint) {
    this.logger.log(
      `[AI_SYNC_PRODUCER] Queue company sync companyId=${companyId.toString()}`,
    );
    await this.add(AI_SYNC_JOB_NAMES.COMPANY_APPROVED, {
      companyId: companyId.toString(),
    });
  }

  async jobCreated(jobId: bigint) {
    await this.add(AI_SYNC_JOB_NAMES.JOB_CREATED, {
      jobId: jobId.toString(),
    });
  }

  async jobUpdated(jobId: bigint) {
    await this.add(AI_SYNC_JOB_NAMES.JOB_UPDATED, {
      jobId: jobId.toString(),
    });
  }

  async jobStatusChanged(jobId: bigint) {
    await this.add(AI_SYNC_JOB_NAMES.JOB_STATUS_CHANGED, {
      jobId: jobId.toString(),
    });
  }

  async candidateCreated(candidateId: bigint) {
    await this.add(AI_SYNC_JOB_NAMES.CANDIDATE_CREATED, {
      candidateId: candidateId.toString(),
    });
  }

  async candidateUpdated(candidateId: bigint) {
    await this.add(AI_SYNC_JOB_NAMES.CANDIDATE_UPDATED, {
      candidateId: candidateId.toString(),
    });
  }

  async applicationApplied(applicationId: bigint) {
    await this.add(AI_SYNC_JOB_NAMES.APPLICATION_APPLIED, {
      applicationId: applicationId.toString(),
    });
  }

  async cvUploaded(cvId: bigint) {
    await this.add(AI_SYNC_JOB_NAMES.CV_UPLOADED, {
      cvId: cvId.toString(),
    });
  }

  async cvSearchableChanged(
    candidateId: bigint,
    cvId: bigint,
    isSearchable: boolean,
  ) {
    await this.add(AI_SYNC_JOB_NAMES.CV_SEARCHABLE_CHANGED, {
      candidateId: candidateId.toString(),
      cvId: cvId.toString(),
      isSearchable: String(isSearchable),
    });
  }

  private async add(name: string, data: Record<string, string>) {
    await this.queue.add(name, data, this.defaultJobOptions);
    this.logger.debug(`Queued AI sync job ${name} ${JSON.stringify(data)}`);
  }
}
