import { isAxiosError } from 'axios';

export type ApiErrorKind =
  'network' | 'timeout' | 'unauthorized' | 'validation' | 'server' | 'unknown';

export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  readonly status: number | null;

  constructor(message: string, kind: ApiErrorKind, status: number | null = null) {
    super(message);
    this.name = 'ApiError';
    this.kind = kind;
    this.status = status;
  }

  get isRetryable(): boolean {
    return this.kind === 'network' || this.kind === 'timeout' || this.kind === 'server';
  }
}

function messageFromBody(data: unknown): string | null {
  if (data && typeof data === 'object' && 'message' in data) {
    const { message } = data as { message: unknown };
    if (typeof message === 'string' && message.length > 0) return message;
  }
  return null;
}

/** Normalizes any thrown value into an ApiError with a user-presentable message. */
export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;

  if (isAxiosError(error)) {
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      return new ApiError('The request timed out. Please try again.', 'timeout');
    }
    if (!error.response) {
      return new ApiError('No connection. Check your internet and try again.', 'network');
    }
    const { status, data } = error.response;
    const serverMessage = messageFromBody(data);
    if (status === 401) {
      return new ApiError(
        serverMessage ?? 'Your session has expired. Please sign in again.',
        'unauthorized',
        status,
      );
    }
    if (status === 400 || status === 422) {
      return new ApiError(
        serverMessage ?? 'Some of the information is invalid.',
        'validation',
        status,
      );
    }
    if (status >= 500) {
      return new ApiError(
        serverMessage ?? 'Something went wrong on our side. Try again later.',
        'server',
        status,
      );
    }
    return new ApiError(serverMessage ?? 'Request failed.', 'unknown', status);
  }

  return new ApiError(error instanceof Error ? error.message : 'Unexpected error.', 'unknown');
}
