export const QUEUES = {
  JOB_EVENTS: 'job-events',
} as const;

export const JOB_EVENT_NAMES = {
  CREATED: 'job.created',
  UPDATED: 'job.updated',
  STATUS_CHANGED: 'job.status.changed',
  EXPIRED: 'job.expired',
} as const;
