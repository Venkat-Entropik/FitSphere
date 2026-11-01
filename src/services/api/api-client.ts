import { create, type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';

import { env } from '@/config/env';
import { secureStorage } from '@/services/storage/secure-storage';

import { toApiError } from './api-error';
import { refreshSession } from './session-refresh';

type UnauthorizedHandler = () => void;
let onUnauthorized: UnauthorizedHandler | null = null;

/** The auth store registers a handler so a dead session can sign the user out without a circular import. */
export function setUnauthorizedHandler(handler: UnauthorizedHandler | null): void {
  onUnauthorized = handler;
}

export async function attachAuthToken(
  config: InternalAxiosRequestConfig,
): Promise<InternalAxiosRequestConfig> {
  const tokens = await secureStorage.getTokens();
  if (tokens) config.headers.set('Authorization', `Bearer ${tokens.accessToken}`);
  return config;
}

/** Credentials endpoints return 401 for *wrong input*, not for an expired session. */
const isCredentialsRequest = (url: string | undefined) =>
  /\/auth\/(login|register|refresh)\b/.test(url ?? '');

type RetriableConfig = InternalAxiosRequestConfig & { _retried?: boolean };

export function createApiClient(baseURL: string, timeout: number): AxiosInstance {
  const client = create({
    baseURL,
    timeout,
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
  });

  client.interceptors.request.use(attachAuthToken);
  client.interceptors.response.use(
    (response) => response,
    async (error: unknown) => {
      const apiError = toApiError(error);
      const original = (error as { config?: RetriableConfig }).config;

      if (
        apiError.kind === 'unauthorized' &&
        original &&
        !original._retried &&
        !isCredentialsRequest(original.url)
      ) {
        // Access token expired: try once to renew the session and replay the request.
        original._retried = true;
        try {
          const tokens = await refreshSession();
          if (tokens) {
            original.headers.set('Authorization', `Bearer ${tokens.accessToken}`);
            return await client.request(original);
          }
        } catch (refreshError) {
          return Promise.reject(toApiError(refreshError)); // e.g. offline: keep the session, surface the error
        }
        onUnauthorized?.();
      } else if (apiError.kind === 'unauthorized' && !isCredentialsRequest(original?.url)) {
        onUnauthorized?.();
      }
      return Promise.reject(apiError);
    },
  );

  return client;
}

export const apiClient = createApiClient(env.apiUrl, env.apiTimeoutMs);
