import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

import { AuthSyncRequestError } from './auth-sync.errors';

export interface ExternalAuthSignUpEmailPayload {
  name: string;
  email: string;
  password: string;
  username: string;
  displayUsername: string;
  callbackURL: string;
}

@Injectable()
export class ExternalAuthClient {
  private readonly logger = new Logger(ExternalAuthClient.name);
  private readonly http: ReturnType<typeof axios.create>;
  private readonly signUpEmailPath: string;

  constructor(private readonly configService: ConfigService) {
    const baseURL =
      this.configService.get<string>('externalAuth.baseUrl') ??
      'http://localhost:3100';
    this.signUpEmailPath =
      this.configService.get<string>('externalAuth.signUpEmailPath') ??
      '/api/auth/sign-up/email';

    this.http = axios.create({
      baseURL,
      timeout:
        this.configService.get<number>('externalAuth.timeoutMs') ?? 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  async signUpEmail(payload: ExternalAuthSignUpEmailPayload) {
    try {
      this.logger.debug(
        `External auth request POST ${this.signUpEmailPath} email=${payload.email}`,
      );

      const response = await this.http.post(this.signUpEmailPath, payload);

      this.logger.debug(
        `External auth response POST ${this.signUpEmailPath} -> ${response.status}`,
      );

      return response.data;
    } catch (error) {
      throw this.toAuthSyncError(error);
    }
  }

  private toAuthSyncError(error: unknown) {
    if ((error as any)?.isAxiosError) {
      const axiosError = error as any;
      const statusCode = axiosError.response?.status;
      const responseData = axiosError.response?.data;
      const retryable =
        !statusCode || statusCode >= 500 || axiosError.code === 'ECONNABORTED';
      const message = [
        `External auth request failed: POST ${this.signUpEmailPath}`,
        statusCode ? `status=${statusCode}` : null,
        axiosError.message,
      ]
        .filter(Boolean)
        .join(' | ');

      this.logger.error(
        `[EXTERNAL_AUTH_CLIENT] ${message} response=${JSON.stringify(
          responseData,
        )}`,
      );

      return new AuthSyncRequestError(
        message,
        retryable,
        statusCode,
        responseData,
      );
    }

    if (error instanceof AuthSyncRequestError) {
      return error;
    }

    return new AuthSyncRequestError(
      `Unexpected external auth sync error: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
}
