import { Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job, UnrecoverableError } from 'bullmq';

import { AUTH_SYNC_JOB_NAMES, QUEUES } from '@/modules/queue/queue.constants';
import { AuthSyncRequestError } from '../auth-sync.errors';
import { ExternalAuthClient } from '../external-auth.client';
import { CandidateExternalAuthSignUpJob } from '../queues/auth-sync.queue';

@Processor(QUEUES.AUTH_SYNC)
export class AuthSyncConsumer extends WorkerHost {
  private readonly logger = new Logger(AuthSyncConsumer.name);

  constructor(private readonly externalAuthClient: ExternalAuthClient) {
    super();
  }

  async process(job: Job<CandidateExternalAuthSignUpJob>) {
    const attempt = job.attemptsMade + 1;
    this.logger.log(
      `Processing auth sync job name=${job.name} attempt=${attempt} accountId=${job.data.accountId}`,
    );

    try {
      switch (job.name) {
        case AUTH_SYNC_JOB_NAMES.CANDIDATE_SIGN_UP_EMAIL:
          await this.externalAuthClient.signUpEmail(job.data.payload);
          this.logger.log(
            `External auth sign-up synced accountId=${job.data.accountId} candidateId=${job.data.candidateId}`,
          );
          break;
        default:
          throw new AuthSyncRequestError(
            `Unhandled auth sync job name: ${job.name}`,
            false,
          );
      }
    } catch (error) {
      if (error instanceof AuthSyncRequestError && !error.retryable) {
        this.logger.error(
          `Non-retryable auth sync error name=${job.name} message=${error.message} response=${JSON.stringify(error.responseData)}`,
        );
        throw new UnrecoverableError(error.message);
      }

      this.logger.error(
        `Retryable auth sync error name=${job.name} attempt=${attempt}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }
}
