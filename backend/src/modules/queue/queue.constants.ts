export const QUEUES = {
  JOB_EVENTS: 'job-events',
  AI_SYNC: 'ai-sync',
  AUTH_SYNC: 'auth-sync',
} as const;

export const JOB_EVENT_NAMES = {
  CREATED: 'job.created',
  UPDATED: 'job.updated',
  STATUS_CHANGED: 'job.status.changed',
  EXPIRED: 'job.expired',
} as const;

export const AI_SYNC_JOB_NAMES = {
  COMPANY_CREATED: 'ai-sync.company.created',
  COMPANY_APPROVED: 'ai-sync.company.approved',
  JOB_CREATED: 'ai-sync.job.created',
  JOB_UPDATED: 'ai-sync.job.updated',
  JOB_STATUS_CHANGED: 'ai-sync.job.status.changed',
  CANDIDATE_CREATED: 'ai-sync.candidate.created',
  CANDIDATE_UPDATED: 'ai-sync.candidate.updated',
  APPLICATION_APPLIED: 'ai-sync.application.applied',
  CV_UPLOADED: 'ai-sync.cv.uploaded',
  CV_SEARCHABLE_CHANGED: 'ai-sync.cv.searchable.changed',
} as const;

export const AUTH_SYNC_JOB_NAMES = {
  CANDIDATE_SIGN_UP_EMAIL: 'auth-sync.candidate.sign-up.email',
} as const;
