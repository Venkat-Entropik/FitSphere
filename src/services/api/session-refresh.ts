import axios, { isAxiosError } from 'axios';

import { env } from '@/config/env';
import { secureStorage, type StoredTokens } from '@/services/storage/secure-storage';

interface RefreshResponse {
  tokens: { accessToken: string; refreshToken: string };
}

let inFlight: Promise<StoredTokens | null> | null = null;

/**
 * Exchanges the stored refresh token for a new pair and saves it. Concurrent callers share one
 * request (refresh tokens rotate, so a second parallel refresh would look like token theft).
 * Resolves null when there is no usable session, so the caller can sign the user out.
 */
export function refreshSession(): Promise<StoredTokens | null> {
  inFlight ??= (async () => {
    try {
      const stored = await secureStorage.getTokens();
      if (!stored?.refreshToken) return null;
      // A bare client: this call must not pass through the 401-retry interceptor.
      const { data } = await axios.post<RefreshResponse>(
        `${env.apiUrl}/auth/refresh`,
        { refreshToken: stored.refreshToken },
        { timeout: env.apiTimeoutMs },
      );
      const next: StoredTokens = {
        accessToken: data.tokens.accessToken,
        refreshToken: data.tokens.refreshToken,
      };
      await secureStorage.setTokens(next);
      return next;
    } catch (error) {
      // A rejected refresh token means the session is over; a network blip should not end it.
      if (isAxiosError(error) && error.response && error.response.status < 500) {
        await secureStorage.clearTokens();
        return null;
      }
      throw error;
    } finally {
      inFlight = null;
    }
  })();
  return inFlight;
}
