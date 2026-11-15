import { z } from 'zod';

const envSchema = z.object({
  EXPO_PUBLIC_API_URL: z.string().url(),
  EXPO_PUBLIC_API_TIMEOUT_MS: z.coerce.number().int().positive().default(15000),
  EXPO_PUBLIC_USE_MOCKS: z
    .enum(['true', 'false'])
    .default('true')
    .transform((v) => v === 'true'),
  /** Shown on the Privacy Policy and Terms pages. */
  EXPO_PUBLIC_SUPPORT_EMAIL: z
    .string()
    .trim()
    .email()
    .optional()
    .or(z.literal('').transform(() => undefined)),
});

/** Only EXPO_PUBLIC_* values are bundled into the app — never put secrets here. */
export function parseEnv(
  source: Record<string, string | undefined>,
  /** A release build (not the dev server). Defaults to the runtime flag. */
  production: boolean = !__DEV__,
) {
  const parsed = envSchema.safeParse(source);
  if (!parsed.success) {
    const details = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
    throw new Error(`Invalid environment configuration — ${details}. See .env.example.`);
  }
  const { EXPO_PUBLIC_API_URL, EXPO_PUBLIC_API_TIMEOUT_MS, EXPO_PUBLIC_USE_MOCKS } = parsed.data;
  if (production) {
    // A release build that points at sample data or an unencrypted server would ship broken or insecure.
    if (EXPO_PUBLIC_USE_MOCKS) {
      throw new Error('Release builds must set EXPO_PUBLIC_USE_MOCKS=false. See .env.example.');
    }
    if (!EXPO_PUBLIC_API_URL.startsWith('https://')) {
      throw new Error('Release builds must use an https:// EXPO_PUBLIC_API_URL. See .env.example.');
    }
  }
  return {
    apiUrl: EXPO_PUBLIC_API_URL,
    apiTimeoutMs: EXPO_PUBLIC_API_TIMEOUT_MS,
    useMocks: EXPO_PUBLIC_USE_MOCKS,
    supportEmail: parsed.data.EXPO_PUBLIC_SUPPORT_EMAIL,
  };
}

// Expo inlines EXPO_PUBLIC_* only for static `process.env.NAME` references.
export const env = parseEnv({
  EXPO_PUBLIC_API_URL: process.env.EXPO_PUBLIC_API_URL,
  EXPO_PUBLIC_API_TIMEOUT_MS: process.env.EXPO_PUBLIC_API_TIMEOUT_MS,
  EXPO_PUBLIC_USE_MOCKS: process.env.EXPO_PUBLIC_USE_MOCKS,
  EXPO_PUBLIC_SUPPORT_EMAIL: process.env.EXPO_PUBLIC_SUPPORT_EMAIL,
});
