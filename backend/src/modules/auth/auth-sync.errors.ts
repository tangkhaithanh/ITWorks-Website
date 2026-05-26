export class AuthSyncRequestError extends Error {
  constructor(
    message: string,
    public readonly retryable = true,
    public readonly statusCode?: number,
    public readonly responseData?: unknown,
  ) {
    super(message);
  }
}
