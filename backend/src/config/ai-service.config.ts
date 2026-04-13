import { registerAs } from '@nestjs/config';

export default registerAs('aiService', () => ({
  baseUrl: process.env.AI_SERVICE_BASE_URL,
  apiKey: process.env.AI_SERVICE_API_KEY,
  timeoutMs: Number(process.env.AI_SERVICE_TIMEOUT_MS || '10000'),
}));
