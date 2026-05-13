import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

import { AiSyncRequestError } from './ai-sync.errors';

export interface AiSyncResultResponse {
  entity: string;
  id: number;
  sourceId?: number | null;
  status: string;
  message: string;
  warnings?: string[];
  candidateCvId?: number | null;
  cvResolutionStatus?: string | null;
}

export interface AiCompanySyncPayload {
  sourceCompanyId: number;
  name: string;
  industry?: string | null;
  location?: string | null;
  size?: string | null;
  description?: string | null;
}

export interface AiJobSyncPayload {
  sourceJobId: number;
  sourceCompanyId: number;
  title: string;
  descriptionText?: string | null;
  location?: string | null;
  salaryMin?: number | null;
  salaryMax?: number | null;
  experienceRequired?: number | null;
  skillsRequired?: string[] | null;
  skillsNiceToHave?: string[] | null;
  employmentType?: string | null;
  status?: string;
}

export interface AiCandidateSyncPayload {
  sourceCandidateId: number;
  name: string;
  email?: string | null;
  phone?: string | null;
  location?: string | null;
  educationLevel?: string | null;
  desiredRole?: string | null;
  experienceYears?: number | null;
  desiredSalaryMin?: number | null;
  desiredSalaryMax?: number | null;
  openToWork?: boolean | null;
}

export interface AiApplicationSyncPayload {
  sourceApplicationId: number;
  sourceCandidateId: number;
  sourceJobId: number;
  sourceCvId?: number | null;
  status?: string | null;
  note?: string | null;
  appliedAt?: Date | string | null;
  updatedAt?: Date | string | null;
}

export interface AiCandidateCvSearchableSyncPayload {
  sourceCvId: number;
  sourceCandidateId: number;
  isSearchable: boolean;
}

interface UploadCvResponse {
  id?: number;
  source_candidate_id?: number;
  source_cv_id?: number;
  candidate_id?: number;
  filename?: string;
  status?: string;
  message?: string;
}

interface CandidateCvExistsResponse {
  success: boolean;
  data?: {
    exists?: boolean;
  };
  message?: string;
}

@Injectable()
export class AiSyncClient {
  private readonly logger = new Logger(AiSyncClient.name);
  private readonly http: ReturnType<typeof axios.create>;
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly timeoutMs: number;

  constructor(private readonly configService: ConfigService) {
    this.baseUrl = this.configService.get<string>('aiService.baseUrl') ?? '';
    this.apiKey = this.configService.get<string>('aiService.apiKey') ?? '';
    this.timeoutMs =
      this.configService.get<number>('aiService.timeoutMs') ?? 10000;

    this.http = axios.create({
      baseURL: this.baseUrl,
      timeout: this.timeoutMs,
      headers: {
        'X-API-Key': this.apiKey,
      },
    });
  }

  async syncCompany(payload: AiCompanySyncPayload) {
    return this.request<AiSyncResultResponse>(
      'post',
      '/api/v1/sync/companies',
      {
        body: payload,
      },
    );
  }

  async syncJob(payload: AiJobSyncPayload) {
    return this.request<AiSyncResultResponse>('post', '/api/v1/sync/jobs', {
      body: payload,
    });
  }

  async processJob(jobId: number) {
    return this.request<AiSyncResultResponse>(
      'post',
      `/api/v1/jobs/${jobId}/process`,
    );
  }

  async syncCandidate(payload: AiCandidateSyncPayload) {
    return this.request<AiSyncResultResponse>(
      'post',
      '/api/v1/sync/candidates',
      {
        body: payload,
      },
    );
  }

  async syncApplication(payload: AiApplicationSyncPayload) {
    return this.request<AiSyncResultResponse>(
      'post',
      '/api/v1/sync/applications',
      {
        body: payload,
      },
    );
  }

  async checkCandidateCvExists(sourceCvId: number) {
    const response = await this.request<CandidateCvExistsResponse>(
      'get',
      '/api/v1/sync/candidate-cvs/exists',
      {
        params: {
          source_cv_id: sourceCvId,
        },
      },
    );

    return response.data?.exists === true;
  }

  async uploadCandidateCv(
    sourceCandidateId: number,
    sourceCvId: number,
    fileBuffer: Buffer,
    filename: string,
    mimeType: string,
  ) {
    this.assertConfigured();

    const formData = new FormData();
    formData.append(
      'file',
      new Blob([new Uint8Array(fileBuffer)], { type: mimeType }),
      filename,
    );
    formData.append('sourceCvId', String(sourceCvId));

    const url = new URL(
      `/api/v1/candidates/${sourceCandidateId}/upload-cv`,
      this.baseUrl,
    );

    try {
      this.logger.debug(`AI request POST ${url.pathname}`);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'X-API-Key': this.apiKey,
        },
        body: formData,
        signal: AbortSignal.timeout(this.timeoutMs),
      });

      if (!response.ok) {
        const responseBody = await this.readFetchErrorBody(response);
        this.logger.error(
          `[AI_SYNC_CLIENT] AI request failed: POST ${url.pathname} | status=${response.status} response=${JSON.stringify(responseBody)}`,
        );
        throw new AiSyncRequestError(
          `AI request failed: POST ${url.pathname} | status=${response.status}`,
          response.status >= 500,
          response.status,
          responseBody,
        );
      }

      return (await this.readFetchSuccessBody(response)) as UploadCvResponse;
    } catch (error) {
      if (error instanceof AiSyncRequestError) {
        throw error;
      }

      throw new AiSyncRequestError(
        `AI CV upload failed for candidate ${sourceCandidateId}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  async processCandidateCv(candidateId: number, cvId: number) {
    return this.request<string>(
      'post',
      `/api/v1/candidates/${candidateId}/process/${cvId}`,
    );
  }

  async syncCandidateCvSearchable(payload: AiCandidateCvSearchableSyncPayload) {
    return this.request<AiSyncResultResponse>(
      'post',
      '/api/v1/sync/candidate-cvs',
      {
        body: payload,
      },
    );
  }

  async getRecommendations(sourceCandidateId: number, topK?: number) {
    return this.request<any>(
      'get',
      `/api/v1/candidates/${sourceCandidateId}/recommendations`,
      {
        params: { top_k: topK ?? 10 },
      },
    );
  }

  async rankApplicants(sourceJobId: number) {
    return this.request<any>(
      'post',
      `/api/v1/match/job-rank-applicants/${sourceJobId}`,
    );
  }

  async findTalent(sourceJobId: number) {
    return this.request<any>(
      'post',
      `/api/v1/match/job-find-talent/${sourceJobId}`,
    );
  }

  private assertConfigured() {
    if (!this.baseUrl) {
      throw new AiSyncRequestError(
        'Missing AI_SERVICE_BASE_URL configuration',
        false,
      );
    }

    if (!this.apiKey) {
      throw new AiSyncRequestError(
        'Missing AI_SERVICE_API_KEY configuration. Fill this in backend/.env.',
        false,
      );
    }
  }

  private async request<T>(
    method: string,
    url: string,
    options?: { body?: unknown; params?: Record<string, string | number> },
  ): Promise<T> {
    this.assertConfigured();

    try {
      this.logger.debug(`AI request ${method.toUpperCase()} ${url}`);

      const response = await this.http.request<any>({
        method,
        url,
        data: options?.body,
        params: options?.params,
      });

      this.logger.debug(
        `AI response ${method.toUpperCase()} ${url} -> ${response.status}`,
      );

      return response.data;
    } catch (error) {
      throw this.toAiSyncError(method, url, error);
    }
  }

  private toAiSyncError(method: string, url: string, error: unknown) {
    if ((error as any)?.isAxiosError) {
      const axiosError = error as any;
      const statusCode = axiosError.response?.status;
      const responseData = axiosError.response?.data;
      const retryable =
        !statusCode || statusCode >= 500 || axiosError.code === 'ECONNABORTED';
      const message = [
        `AI request failed: ${method.toUpperCase()} ${url}`,
        statusCode ? `status=${statusCode}` : null,
        axiosError.message,
      ]
        .filter(Boolean)
        .join(' | ');

      this.logger.error(
        `[AI_SYNC_CLIENT] ${message} response=${JSON.stringify(responseData)}`,
      );

      return new AiSyncRequestError(
        message,
        retryable,
        statusCode,
        responseData,
      );
    }

    if (error instanceof AiSyncRequestError) {
      return error;
    }

    return new AiSyncRequestError(
      `Unexpected AI sync error for ${method.toUpperCase()} ${url}: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }

  private async readFetchErrorBody(response: Response) {
    const contentType = response.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      return response.json();
    }

    return response.text();
  }

  private async readFetchSuccessBody(response: Response) {
    const contentType = response.headers.get('content-type') || '';
    const bodyText = await response.text();

    if (!bodyText.trim()) {
      return {};
    }

    if (contentType.includes('application/json')) {
      try {
        return JSON.parse(bodyText);
      } catch {
        return {};
      }
    }

    return {
      message: bodyText,
    };
  }
}
