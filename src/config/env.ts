import { z } from 'zod';

const envSchema = z.object({
  EXPO_PUBLIC_API_URL: z.string().url(),
  EXPO_PUBLIC_API_TIMEOUT_MS: z.coerce.number().int().positive().default(15000),
  EXPO_PUBLIC_USE_MOCKS: z
    .enum(['true', 'false'])
    .default('true')
    .transform((v) => v === 'true'),
});

/** Only EXPO_PUBLIC_* values are bundled into the app — never put secrets here. */
export function parseEnv(source: Record<string, string | undefined>) {
  const parsed = envSchema.safeParse(source);
  if (!parsed.success) {
    const details = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
    throw new Error(`Invalid environment configuration — ${details}. See .env.example.`);
  }
  const { EXPO_PUBLIC_API_URL, EXPO_PUBLIC_API_TIMEOUT_MS, EXPO_PUBLIC_USE_MOCKS } = parsed.data;
  return {
    apiUrl: EXPO_PUBLIC_API_URL,
    apiTimeoutMs: EXPO_PUBLIC_API_TIMEOUT_MS,
    useMocks: EXPO_PUBLIC_USE_MOCKS,
  };
}

// Expo inlines EXPO_PUBLIC_* only for static `process.env.NAME` references.
export const env = parseEnv({
  EXPO_PUBLIC_API_URL: process.env.EXPO_PUBLIC_API_URL,
  EXPO_PUBLIC_API_TIMEOUT_MS: process.env.EXPO_PUBLIC_API_TIMEOUT_MS,
  EXPO_PUBLIC_USE_MOCKS: process.env.EXPO_PUBLIC_USE_MOCKS,
});
