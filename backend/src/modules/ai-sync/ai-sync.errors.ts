export class AiSyncRequestError extends Error {
  constructor(
    message: string,
    public readonly retryable = true,
    public readonly statusCode?: number,
    public readonly responseData?: unknown,
  ) {
    super(message);
    this.name = 'AiSyncRequestError';
  }
}
