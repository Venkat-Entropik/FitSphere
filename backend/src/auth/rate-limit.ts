interface Entry {
  failures: number;
  windowStart: number;
}

export interface LoginLimiter {
  /** Seconds until another attempt is allowed, or 0 when not blocked. */
  retryAfterSec(key: string, now?: number): number;
  recordFailure(key: string, now?: number): void;
  reset(key: string): void;
}

/**
 * Per-key (IP + email) failed-login limiter held in memory. Good for one instance; behind a load
 * balancer use a shared store (Redis) instead.
 */
export function createLoginLimiter(maxAttempts: number, windowSec: number): LoginLimiter {
  const entries = new Map<string, Entry>();
  const windowMs = windowSec * 1000;

  const current = (key: string, now: number): Entry | undefined => {
    const entry = entries.get(key);
    if (entry && now - entry.windowStart >= windowMs) {
      entries.delete(key);
      return undefined;
    }
    return entry;
  };

  return {
    retryAfterSec(key, now = Date.now()) {
      const entry = current(key, now);
      if (!entry || entry.failures < maxAttempts) return 0;
      return Math.max(1, Math.ceil((entry.windowStart + windowMs - now) / 1000));
    },
    recordFailure(key, now = Date.now()) {
      const entry = current(key, now) ?? { failures: 0, windowStart: now };
      entries.set(key, { ...entry, failures: entry.failures + 1 });
    },
    reset(key) {
      entries.delete(key);
    },
  };
}
