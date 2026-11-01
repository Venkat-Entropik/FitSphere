import { AxiosError, AxiosHeaders, type InternalAxiosRequestConfig } from 'axios';

import { attachAuthToken } from '@/services/api/api-client';
import { ApiError, toApiError } from '@/services/api/api-error';
import { secureStorage } from '@/services/storage/secure-storage';

function axiosError(status: number | null, data?: unknown, code?: string): AxiosError {
  const config = { headers: {} } as InternalAxiosRequestConfig;
  const response =
    status === null ? undefined : { status, data, statusText: '', headers: {}, config };
  return new AxiosError('failed', code, config, null, response);
}

describe('toApiError', () => {
  it('maps a missing response to a retryable network error', () => {
    const error = toApiError(axiosError(null));
    expect(error.kind).toBe('network');
    expect(error.isRetryable).toBe(true);
  });

  it('maps timeouts', () => {
    expect(toApiError(axiosError(null, undefined, 'ECONNABORTED')).kind).toBe('timeout');
  });

  it('maps 401 to unauthorized (not retryable) and uses the server message', () => {
    const error = toApiError(axiosError(401, { message: 'Token expired' }));
    expect(error).toMatchObject({ kind: 'unauthorized', status: 401, message: 'Token expired' });
    expect(error.isRetryable).toBe(false);
  });

  it('maps 422 to validation and 503 to a retryable server error', () => {
    expect(toApiError(axiosError(422)).kind).toBe('validation');
    expect(toApiError(axiosError(503)).isRetryable).toBe(true);
  });

  it('passes ApiError through and wraps unknown values', () => {
    const existing = new ApiError('x', 'server', 500);
    expect(toApiError(existing)).toBe(existing);
    expect(toApiError('boom').kind).toBe('unknown');
  });
});

describe('attachAuthToken', () => {
  it('adds a bearer header when a token is stored', async () => {
    await secureStorage.setTokens({ accessToken: 'abc', refreshToken: null });
    const config = await attachAuthToken({
      headers: new AxiosHeaders(),
    } as InternalAxiosRequestConfig);
    expect(config.headers.get('Authorization')).toBe('Bearer abc');
    await secureStorage.clearTokens();
  });
});
