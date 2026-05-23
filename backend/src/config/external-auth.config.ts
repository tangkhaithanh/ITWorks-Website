import { registerAs } from '@nestjs/config';

export default registerAs('externalAuth', () => ({
  baseUrl: process.env.EXTERNAL_AUTH_BASE_URL || 'http://localhost:3100',
  signUpEmailPath:
    process.env.EXTERNAL_AUTH_SIGN_UP_EMAIL_PATH || '/api/auth/sign-up/email',
  callbackUrl: process.env.EXTERNAL_AUTH_CALLBACK_URL || '/dashboard',
  timeoutMs: Number(process.env.EXTERNAL_AUTH_TIMEOUT_MS || '10000'),
}));
