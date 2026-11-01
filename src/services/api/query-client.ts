import { QueryClient } from '@tanstack/react-query';

import { toApiError } from './api-error';

const MAX_RETRIES = 2;

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        // Only transient failures (network/timeout/5xx) are worth retrying.
        retry: (failureCount, error) => failureCount < MAX_RETRIES && toApiError(error).isRetryable,
      },
      mutations: { retry: false },
    },
  });
}
