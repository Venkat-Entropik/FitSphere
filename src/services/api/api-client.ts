import { create, type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';

import { env } from '@/config/env';
import { secureStorage } from '@/services/storage/secure-storage';

import { toApiError } from './api-error';

type UnauthorizedHandler = () => void;
let onUnauthorized: UnauthorizedHandler | null = null;

/** The auth store registers a handler so a 401 can sign the user out without a circular import. */
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

export function createApiClient(baseURL: string, timeout: number): AxiosInstance {
  const client = create({
    baseURL,
    timeout,
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
  });

  client.interceptors.request.use(attachAuthToken);
  client.interceptors.response.use(
    (response) => response,
    (error: unknown) => {
      const apiError = toApiError(error);
      if (apiError.kind === 'unauthorized') onUnauthorized?.();
      return Promise.reject(apiError);
    },
  );

  return client;
}

export const apiClient = createApiClient(env.apiUrl, env.apiTimeoutMs);
