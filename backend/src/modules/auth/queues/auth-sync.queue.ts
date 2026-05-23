import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

import { AUTH_SYNC_JOB_NAMES, QUEUES } from '@/modules/queue/queue.constants';
import { ExternalAuthSignUpEmailPayload } from '../external-auth.client';

export interface CandidateExternalAuthSignUpJob {
  accountId: string;
  candidateId: string;
  payload: ExternalAuthSignUpEmailPayload;
}

@Injectable()
export class AuthSyncQueue {
  private readonly logger = new Logger(AuthSyncQueue.name);

  constructor(
    @InjectQueue(QUEUES.AUTH_SYNC)
    private readonly queue: Queue,
  ) {}

  private readonly defaultJobOptions = {
    attempts: 5,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: 200,
    removeOnFail: 500,
  };

  async candidateSignUpEmail(data: CandidateExternalAuthSignUpJob) {
    await this.queue.add(
      AUTH_SYNC_JOB_NAMES.CANDIDATE_SIGN_UP_EMAIL,
      data,
      this.defaultJobOptions,
    );

    this.logger.debug(
      `Queued external auth sign-up accountId=${data.accountId} candidateId=${data.candidateId}`,
    );
  }
}
