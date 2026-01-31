import { Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';

import { ElasticsearchJobService } from '@/modules/elasticsearch/job.elasticsearch.service';
import { JOB_EVENT_NAMES, QUEUES } from '@/modules/queue/queue.constants';
import { JobsService } from '../jobs.service';

@Processor(QUEUES.JOB_EVENTS)
export class JobEventsConsumer extends WorkerHost {
  private readonly logger = new Logger(JobEventsConsumer.name);

  constructor(
    private readonly jobsService: JobsService,
    private readonly esJob: ElasticsearchJobService,
  ) {
    super();
  }

  private toBigInt(id: string | number | bigint) {
    return typeof id === 'bigint' ? id : BigInt(id);
  }

  // BULLMQ ENTRY POINT
  async process(job: Job) {
    console.log('🔥 Worker received job:', job.name, job.data);
    try {
      switch (job.name) {
        case JOB_EVENT_NAMES.CREATED:
          await this.onCreated(job);
          break;

        case JOB_EVENT_NAMES.UPDATED:
          await this.onUpdated(job);
          break;

        case JOB_EVENT_NAMES.STATUS_CHANGED:
          await this.onStatusChanged(job);
          break;

        case JOB_EVENT_NAMES.EXPIRED:
          await this.onExpired(job);
          break;

        default:
          this.logger.warn(`⚠️ Unhandled job event: ${job.name}`);
          break;
      }
    } catch (error) {
      this.logger.error(
        `🔥 JobEventsConsumer failed [${job.name}]`,
        error?.stack || error,
      );
      throw error; // ❗ BULLMQ cần throw để retry
    }
  }

  // ===== HANDLERS =====

  private async onCreated(job: Job) {
    const jobId = this.toBigInt(job.data.jobId);
    this.logger.log(`🔔 job.created: ${jobId.toString()}`);

    const fullJob = await this.jobsService.getFullJob(jobId);
    await this.esJob.indexJob(fullJob);
  }

  private async onUpdated(job: Job) {
    const jobId = this.toBigInt(job.data.jobId);
    this.logger.log(`🔔 job.updated: ${jobId.toString()}`);

    const fullJob = await this.jobsService.getFullJob(jobId);
    await this.esJob.updateJob(fullJob);
  }

  private async onStatusChanged(job: Job) {
    const jobId = this.toBigInt(job.data.jobId);
    const status = String(job.data.status);
    this.logger.log(`🔔 job.status.changed: ${jobId.toString()} -> ${status}`);

    if (status === 'active') {
      const fullJob = await this.jobsService.getFullJob(jobId);
      await this.esJob.indexJob(fullJob);
      return;
    }

    // hidden / closed / expired
    await this.esJob.removeJob(jobId);
  }

  private async onExpired(job: Job) {
    const jobId = this.toBigInt(job.data.jobId);
    this.logger.log(`🔔 job.expired: ${jobId.toString()}`);

    await this.esJob.removeJob(jobId);
  }
}
