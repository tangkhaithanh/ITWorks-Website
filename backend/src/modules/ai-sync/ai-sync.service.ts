import { Injectable, Logger } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import {
  CompanyStatus,
  CvType,
  EmploymentType,
  JobSkillType,
  RecruiterMatchingAction,
} from '@prisma/client';

import { MatchingHistoryService } from '@/modules/matching-history/matching-history.service';
import { PrismaService } from '@/prisma/prisma.service';
import {
  AiApplicationSyncPayload,
  AiCandidateCvSearchableSyncPayload,
  AiCandidateSyncPayload,
  AiCompanySyncPayload,
  AiJobSyncPayload,
  AiSyncClient,
} from './ai-sync.client';
import { AiSyncRequestError } from './ai-sync.errors';
import { buildAiJobDescription } from './job-text.utils';
import type {
  RecommendationResponse,
  RecommendationRecord,
  EnrichedRecommendation,
} from './dto/recommendation.types';

type CompanySyncRecord = Awaited<
  ReturnType<AiSyncService['getCompanyForSync']>
>;
type JobSyncRecord = Awaited<ReturnType<AiSyncService['getJobForSync']>>;
type CandidateSyncRecord = Awaited<
  ReturnType<AiSyncService['getCandidateForSync']>
>;
type ApplicationSyncRecord = Awaited<
  ReturnType<AiSyncService['getApplicationForSync']>
>;
type CvSyncRecord = Awaited<ReturnType<AiSyncService['getCvForSync']>>;
type PreparedCvFile = {
  buffer: Buffer;
  mimeType: string;
};

@Injectable()
export class AiSyncService {
  private readonly logger = new Logger(AiSyncService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiSyncClient: AiSyncClient,
    private readonly matchingHistoryService: MatchingHistoryService,
  ) {}

  async syncCompany(companyId: bigint) {
    this.logger.log(
      `[AI_SYNC_SERVICE] syncCompany start companyId=${companyId.toString()}`,
    );

    const company = await this.getCompanyForSync(companyId);

    if (company.status !== CompanyStatus.approved) {
      this.logger.warn(
        `[AI_SYNC_SERVICE] Skip companyId=${companyId.toString()} because status=${company.status}`,
      );
      throw new AiSyncRequestError(
        `Company ${companyId.toString()} is not approved for AI sync`,
        false,
      );
    }

    const payload = this.buildCompanyPayload(company);
    const synced = await this.aiSyncClient.syncCompany(payload);

    this.logger.log(
      `AI company synced sourceCompany=${company.id.toString()} ai=${synced.id}`,
    );

    return synced.id;
  }

  async syncJobCreated(jobId: bigint) {
    const job = await this.getJobForSync(jobId);
    await this.ensureCompanySynced(job.company_id);

    const payload = this.buildJobPayload(job);
    const synced = await this.aiSyncClient.syncJob(payload);
    await this.aiSyncClient.processJob(synced.id);

    this.logger.log(
      `AI job synced sourceJob=${job.id.toString()} ai=${synced.id}`,
    );

    return synced.id;
  }

  async syncJobUpdated(jobId: bigint) {
    const job = await this.getJobForSync(jobId);
    await this.ensureCompanySynced(job.company_id);

    const payload = this.buildJobPayload(job);
    const synced = await this.aiSyncClient.syncJob(payload);

    this.logger.log(
      `AI job updated sourceJob=${job.id.toString()} ai=${synced.id}`,
    );

    return synced.id;
  }

  async syncJobStatusChanged(jobId: bigint) {
    const job = await this.getJobForSync(jobId);
    await this.ensureCompanySynced(job.company_id);

    const payload = this.buildJobPayload(job, {
      status: this.mapJobStatus(job.status),
    });
    const synced = await this.aiSyncClient.syncJob(payload);

    this.logger.log(
      `AI job status synced sourceJob=${job.id.toString()} status=${job.status} ai=${synced.id}`,
    );

    return synced.id;
  }

  async syncCandidateCreated(candidateId: bigint) {
    const candidate = await this.getCandidateForSync(candidateId);
    const payload = this.buildCandidatePayload(candidate);
    const synced = await this.aiSyncClient.syncCandidate(payload);

    this.logger.log(
      `AI candidate synced sourceCandidate=${candidate.id.toString()} ai=${synced.id}`,
    );

    return synced.id;
  }

  async syncCandidateUpdated(candidateId: bigint) {
    return this.syncCandidateCreated(candidateId);
  }

  async syncApplicationApplied(applicationId: bigint) {
    const application = await this.getApplicationForSync(applicationId);
    //await this.syncCandidateCreated(application.candidate.id);
    //await this.syncJobUpdated(application.job.id);
    //await this.syncCvUploaded(application.cv_id);

    const payload = await this.buildApplicationPayload(application);
    const synced = await this.aiSyncClient.syncApplication(payload);

    this.logger.log(
      `AI application synced sourceApplication=${application.id.toString()} ai=${synced.id}`,
    );

    return synced.id;
  }

  async syncCvUploaded(cvId: bigint) {
    const cv = await this.getCvForSync(cvId);

    await this.syncCandidateCreated(cv.candidate.id);

    const preparedFile = await this.prepareCvFile(cv);
    const filename = this.resolveCvFilename(cv, preparedFile.mimeType);

    await this.aiSyncClient.uploadCandidateCv(
      this.toNumber(cv.candidate.id),
      this.toNumber(cv.id),
      preparedFile.buffer,
      filename,
      preparedFile.mimeType,
    );

    await this.aiSyncClient.processCandidateCv(
      this.toNumber(cv.candidate.id),
      this.toNumber(cv.id),
    );

    this.logger.log(
      `AI CV synced sourceCv=${cv.id.toString()} sourceCandidate=${cv.candidate.id.toString()}`,
    );
  }

  async syncCvSearchableChanged(
    candidateId: bigint,
    cvId: bigint,
    isSearchable: boolean,
  ) {
    const candidate = await this.prisma.candidate.findUnique({
      where: { id: candidateId },
      select: { id: true },
    });

    if (!candidate) {
      throw new AiSyncRequestError(
        `Candidate ${candidateId.toString()} not found for AI CV sync`,
        false,
      );
    }

    await this.syncCandidateCreated(candidate.id);

    const payload: AiCandidateCvSearchableSyncPayload = {
      sourceCvId: this.toNumber(cvId),
      sourceCandidateId: this.toNumber(candidate.id),
      isSearchable,
    };

    const synced = await this.aiSyncClient.syncCandidateCvSearchable(payload);

    this.logger.log(
      `AI CV searchable synced sourceCv=${cvId.toString()} sourceCandidate=${candidate.id.toString()} searchable=${isSearchable} ai=${synced.id}`,
    );

    return synced.id;
  }

  async getRecommendations(
    accountId: bigint,
    topK: number = 10,
  ): Promise<RecommendationResponse> {
    const user = await this.prisma.user.findUnique({
      where: { account_id: accountId },
      include: { candidate: { select: { id: true } } },
    });

    if (!user?.candidate) {
      throw new AiSyncRequestError(
        'Candidate profile not found. Please complete your profile.',
        false,
      );
    }

    const sourceCandidateId = this.toNumber(user.candidate.id);
    const result = await this.aiSyncClient.getRecommendations(
      sourceCandidateId,
      topK,
    );

    const rawMatches: RecommendationRecord[] = Array.isArray(result?.matches)
      ? result.matches
      : [];
    const jobIds = rawMatches.map((m) => m.job_id).filter(Boolean);

    const [jobsMap, appliedJobs, savedJobs] = await Promise.all([
      this.fetchJobsByIds(jobIds),
      this.fetchAppliedJobIds(user.candidate.id, jobIds),
      this.fetchSavedJobIds(user.candidate.id, jobIds),
    ]);

    const matches: EnrichedRecommendation[] = rawMatches.map((match) => {
      const job = jobsMap.get(match.job_id);
      return {
        ...match,
        job_title: job?.title ?? 'Unknown Job',
        company_name: job?.company?.name ?? 'Unknown Company',
        company_logo: job?.company?.logo_url ?? null,
        location_city: job?.location_city ?? '',
        salary_range: {
          min: job?.salary_min ?? null,
          max: job?.salary_max ?? null,
        },
        applied: appliedJobs.has(match.job_id),
        saved: savedJobs.has(match.job_id),
      };
    });

    console.log(
      `Returning ${matches.length} recommendations for candidateId=${user.candidate.id.toString()}`,
    );
    console.log('Sample enriched recommendation:', matches[0]);

    return {
      candidate_id: sourceCandidateId,
      source_candidate_id: result?.source_candidate_id ?? sourceCandidateId,
      total: matches.length,
      matches,
    };
  }

  private async fetchJobsByIds(jobIds: number[]) {
    if (jobIds.length === 0) return new Map<number, any>();

    const jobs = await this.prisma.job.findMany({
      where: { id: { in: jobIds.map(BigInt) } },
      include: { company: { select: { name: true, logo_url: true } } },
    });

    const map = new Map<number, any>();
    for (const job of jobs) {
      map.set(this.toNumber(job.id), job);
    }
    return map;
  }

  private async fetchAppliedJobIds(candidateId: bigint, jobIds: number[]) {
    if (jobIds.length === 0) return new Set<number>();

    const apps = await this.prisma.application.findMany({
      where: {
        candidate_id: candidateId,
        job_id: { in: jobIds.map(BigInt) },
      },
      select: { job_id: true },
    });
    return new Set(apps.map((a) => this.toNumber(a.job_id)));
  }

  private async fetchSavedJobIds(candidateId: bigint, jobIds: number[]) {
    if (jobIds.length === 0) return new Set<number>();

    const saved = await this.prisma.savedJob.findMany({
      where: {
        candidate_id: candidateId,
        job_id: { in: jobIds.map(BigInt) },
      },
      select: { job_id: true },
    });
    return new Set(saved.map((s) => this.toNumber(s.job_id)));
  }

  async rankApplicants(sourceJobId: number, recruiterId?: bigint) {
    const result = await this.aiSyncClient.rankApplicants(sourceJobId);
    const enrichedResult = await this.enrichMatchesWithCvFileUrls(result);

    await this.captureHistory(
      recruiterId,
      BigInt(sourceJobId),
      RecruiterMatchingAction.RANK_APPLICANTS,
      enrichedResult,
    );

    return enrichedResult;
  }

  async findTalent(sourceJobId: number, recruiterId?: bigint) {
    const result = await this.aiSyncClient.findTalent(sourceJobId);
    const enrichedResult = await this.enrichMatchesWithCvFileUrls(result);

    await this.captureHistory(
      recruiterId,
      BigInt(sourceJobId),
      RecruiterMatchingAction.FIND_TALENT,
      enrichedResult,
    );

    return enrichedResult;
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

  private async enrichMatchesWithCvFileUrls(result: any) {
    const matches = Array.isArray(result?.matches) ? result.matches : [];

    if (!Array.isArray(result?.matches)) {
      return result;
    }

    const sourceCvIdsByKey = new Map<string, bigint>();

    matches.forEach((match: any) => {
      const sourceCvId = this.toPositiveBigInt(match?.source_cv_id);

      if (sourceCvId) {
        sourceCvIdsByKey.set(sourceCvId.toString(), sourceCvId);
      }
    });

    const fileUrlsBySourceCvId = new Map<string, string | null>();

    if (sourceCvIdsByKey.size > 0) {
      const cvs = await this.prisma.cv.findMany({
        where: {
          id: {
            in: Array.from(sourceCvIdsByKey.values()),
          },
        },
        select: {
          id: true,
          file_url: true,
        },
      });

      cvs.forEach((cv) => {
        fileUrlsBySourceCvId.set(cv.id.toString(), cv.file_url);
      });
    }

    return {
      ...result,
      matches: matches.map((match: any) => {
        const sourceCvId = this.toPositiveBigInt(match?.source_cv_id);

        return {
          ...match,
          file_url: sourceCvId
            ? (fileUrlsBySourceCvId.get(sourceCvId.toString()) ?? null)
            : null,
        };
      }),
    };
  }

  private async ensureCompanySynced(companyId: bigint) {
    return this.syncCompany(companyId);
  }

  private async getCompanyForSync(companyId: bigint) {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      include: {
        industry_info: {
          include: {
            industry: true,
          },
        },
      },
    });

    if (!company) {
      throw new AiSyncRequestError(
        `Company ${companyId.toString()} not found for AI sync`,
        false,
      );
    }

    return company;
  }

  private async getJobForSync(jobId: bigint) {
    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
      include: {
        details: true,
        skills: {
          include: {
            skill: true,
          },
        },
      },
    });

    if (!job) {
      throw new AiSyncRequestError(
        `Job ${jobId.toString()} not found for AI sync`,
        false,
      );
    }

    return job;
  }

  private async getCandidateForSync(candidateId: bigint) {
    const candidate = await this.prisma.candidate.findUnique({
      where: { id: candidateId },
      include: {
        user: {
          include: {
            account: {
              select: {
                email: true,
              },
            },
          },
        },
      },
    });

    if (!candidate) {
      throw new AiSyncRequestError(
        `Candidate ${candidateId.toString()} not found for AI sync`,
        false,
      );
    }

    return candidate;
  }

  private async getApplicationForSync(applicationId: bigint) {
    const application = await this.prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        candidate: {
          select: {
            id: true,
          },
        },
        job: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!application) {
      throw new AiSyncRequestError(
        `Application ${applicationId.toString()} not found for AI sync`,
        false,
      );
    }

    return application;
  }

  private async getCvForSync(cvId: bigint) {
    const cv = await this.prisma.cv.findUnique({
      where: { id: cvId },
      include: {
        candidate: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!cv) {
      throw new AiSyncRequestError(
        `CV ${cvId.toString()} not found for AI sync`,
        false,
      );
    }

    return cv;
  }

  private buildCompanyPayload(
    company: NonNullable<CompanySyncRecord>,
  ): AiCompanySyncPayload {
    return {
      sourceCompanyId: this.toNumber(company.id),
      name: company.name,
      industry: company.industry_info
        .map((item) => item.industry.name)
        .join(', '),
      location: company.headquarters || company.address || null,
      size: company.size || null,
      description: company.description || null,
    };
  }

  private buildJobPayload(
    job: NonNullable<JobSyncRecord>,
    options?: { status?: string },
  ): AiJobSyncPayload {
    const payload: AiJobSyncPayload = {
      sourceJobId: this.toNumber(job.id),
      sourceCompanyId: this.toNumber(job.company_id),
      title: job.title,
      descriptionText: buildAiJobDescription(
        job.details?.description,
        job.details?.requirements,
      ),
      location: job.location_full || job.location_city || null,
      salaryMin: job.salary_min ?? null,
      salaryMax: job.salary_max ?? null,
      experienceRequired: this.getJobExperienceYears(job),
      skillsRequired: this.getJobSkillsByType(job, JobSkillType.REQUIRED),
      skillsNiceToHave: this.getJobSkillsByType(job, JobSkillType.NICE_TO_HAVE),
      employmentType: this.mapEmploymentType(job.employment_type),
    };

    if (options?.status) {
      payload.status = options.status;
    }

    return payload;
  }

  private buildCandidatePayload(
    candidate: NonNullable<CandidateSyncRecord>,
  ): AiCandidateSyncPayload {
    const fallbackSalary = candidate.preferred_salary ?? null;
    const desiredSalaryMin = candidate.desired_salary_min ?? fallbackSalary;
    const desiredSalaryMax =
      candidate.desired_salary_max ??
      candidate.desired_salary_min ??
      fallbackSalary;

    return {
      sourceCandidateId: this.toNumber(candidate.id),
      name: candidate.user.full_name,
      email: candidate.user.account.email || null,
      phone: candidate.user.phone || null,
      location: candidate.preferred_city || candidate.user.address || null,
      educationLevel: candidate.education_level || null,
      desiredRole: candidate.desired_role || null,
      desiredSalaryMin,
      desiredSalaryMax,
      experienceYears: candidate.experience_years ?? null,
      openToWork: candidate.open_to_work ?? null,
    };
  }

  private async buildApplicationPayload(
    application: NonNullable<ApplicationSyncRecord>,
  ): Promise<AiApplicationSyncPayload> {
    return {
      sourceApplicationId: this.toNumber(application.id),
      sourceCandidateId: this.toNumber(application.candidate.id),
      sourceJobId: this.toNumber(application.job.id),
      sourceCvId: this.toNumber(application.cv_id),
      status: this.mapApplicationStatus(application.status),
    };
  }

  private getJobExperienceYears(job: NonNullable<JobSyncRecord>) {
    if (
      typeof job.experience_required === 'number' &&
      Number.isFinite(job.experience_required)
    ) {
      return job.experience_required;
    }

    return this.getExperienceRequiredFromLevels(job.experience_levels);
  }

  private getExperienceRequiredFromLevels(value: unknown) {
    const levels = this.toStringArray(value);
    const map: Record<string, number> = {
      intern: 0,
      fresher: 0,
      junior: 1,
      mid: 3,
      senior: 5,
      lead: 7,
    };

    return levels.reduce((max, level) => Math.max(max, map[level] ?? 0), 0);
  }

  private getJobSkillsByType(
    job: NonNullable<JobSyncRecord>,
    type: JobSkillType,
  ) {
    return job.skills
      .filter((item) => item.type === type)
      .map((item) => item.skill.name);
  }

  private mapEmploymentType(type: EmploymentType) {
    const map: Record<EmploymentType, string> = {
      fulltime: 'full_time',
      parttime: 'part_time',
      intern: 'intern',
      contract: 'contract',
    };

    return map[type];
  }

  private mapJobStatus(status: string) {
    return status === 'active' ? 'open' : 'closed';
  }

  private mapApplicationStatus(status: string) {
    if (status === 'pending') {
      return 'applied';
    }

    return status;
  }

  private toStringArray(value: unknown) {
    if (Array.isArray(value)) {
      return value
        .map((item) => (typeof item === 'string' ? item : String(item)))
        .filter(Boolean);
    }

    return [];
  }

  private toNumber(value: bigint) {
    return Number(value);
  }

  private toPositiveBigInt(value: unknown) {
    if (typeof value === 'bigint') {
      return value > 0n ? value : null;
    }

    if (typeof value === 'number') {
      return Number.isInteger(value) && value > 0 ? BigInt(value) : null;
    }

    if (typeof value === 'string' && /^\d+$/.test(value)) {
      const parsed = BigInt(value);
      return parsed > 0n ? parsed : null;
    }

    return null;
  }

  private toIsoString(value: Date | null | undefined) {
    return value ? value.toISOString() : null;
  }

  private async prepareCvFile(
    cv: NonNullable<CvSyncRecord>,
  ): Promise<PreparedCvFile> {
    if (cv.type === CvType.FILE) {
      if (!cv.file_url) {
        throw new AiSyncRequestError(
          `CV ${cv.id.toString()} does not have a downloadable file URL`,
          false,
        );
      }

      return this.downloadCvFile(cv.file_url);
    }

    throw new AiSyncRequestError(
      `CV ${cv.id.toString()} has unsupported type ${String(cv.type)}`,
      false,
    );
  }

  private async downloadCvFile(fileUrl: string) {
    let response: Response;

    try {
      response = await fetch(fileUrl);
    } catch (error) {
      throw new AiSyncRequestError(
        `Failed to download CV file from ${fileUrl}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }

    if (!response.ok) {
      throw new AiSyncRequestError(
        `Failed to download CV file from ${fileUrl} | status=${response.status}`,
        response.status >= 500,
        response.status,
      );
    }

    return {
      buffer: Buffer.from(await response.arrayBuffer()),
      mimeType:
        response.headers.get('content-type') || 'application/octet-stream',
    };
  }

  private resolveCvFilename(cv: NonNullable<CvSyncRecord>, mimeType: string) {
    const extensionFromUrl = cv.file_url
      ? this.getFilenameFromUrl(cv.file_url)?.split('.').pop()
      : null;

    const titleHasExtension = /\.[a-z0-9]+$/i.test(cv.title);

    if (titleHasExtension) {
      return cv.title;
    }

    if (extensionFromUrl) {
      return `${cv.title}.${extensionFromUrl}`;
    }

    if (mimeType.includes('pdf')) {
      return `${cv.title}.pdf`;
    }

    if (mimeType.includes('word')) {
      return `${cv.title}.docx`;
    }

    return `${cv.title}.bin`;
  }

  private getFilenameFromUrl(fileUrl: string) {
    try {
      const pathname = new URL(fileUrl).pathname;
      return pathname.split('/').filter(Boolean).pop() || null;
    } catch {
      return null;
    }
  }
}
