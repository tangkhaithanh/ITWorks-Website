import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { JOB_EVENT_NAMES, QUEUES } from '@/modules/queue/queue.constants';

@Injectable()
export class JobEventsQueue {
  constructor(
    @InjectQueue(QUEUES.JOB_EVENTS)
    private readonly queue: Queue,
  ) {}

  private defaultJobOptions = {
    attempts: 5, // Thử lại tối đa 5 lần nếu thất bại
    backoff: { type: 'exponential', delay: 1000 }, // Thời gian chờ giữa các lần thử lại
    removeOnComplete: 200,// Giữ lại 200 job đã hoàn thành gần nhất
    removeOnFail: 500,// Giữ lại 500 job thất bại gần nhất
  };

  async jobCreated(jobId: bigint) {
    await this.queue.add(
      JOB_EVENT_NAMES.CREATED,
      { jobId: jobId.toString() },
      this.defaultJobOptions,
    );
  }

  async jobUpdated(jobId: bigint) {
    await this.queue.add(
      JOB_EVENT_NAMES.UPDATED,
      { jobId: jobId.toString() },
      this.defaultJobOptions,
    );
  }

  async jobStatusChanged(jobId: bigint, status: string) {
    await this.queue.add(
      JOB_EVENT_NAMES.STATUS_CHANGED,
      { jobId: jobId.toString(), status },
      this.defaultJobOptions,
    );
  }

  async jobExpiredBulk(jobIds: bigint[]) {
    if (!jobIds.length) return;

    await this.queue.addBulk(
      jobIds.map((id) => ({
        name: JOB_EVENT_NAMES.EXPIRED,
        data: { jobId: id.toString() },
        opts: this.defaultJobOptions,
      })),
    );
  }
}
