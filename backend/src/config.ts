import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  /** Bind to 127.0.0.1 by default; use 0.0.0.0 to reach the API from a phone on your network. */
  HOST: z.string().default('127.0.0.1'),
  /** Set to true behind a reverse proxy (Railway, Fly, nginx) so rate limits see each client's real IP. */
  TRUST_PROXY: z
    .enum(['true', 'false'])
    .default('false')
    .transform((v) => v === 'true'),
  /** Postgres connection string (e.g. from Neon). Required in production. */
  DATABASE_URL: z.string().optional(),
  /** Without DATABASE_URL, a local embedded Postgres (PGlite) keeps its files in this folder. */
  DATABASE_PATH: z.string().default('./data/pglite'),
  /** Signs access tokens. Required, at least 32 characters, never committed. */
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  ACCESS_TOKEN_TTL_SEC: z.coerce.number().int().positive().default(15 * 60),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().positive().default(30),
  /** Comma-separated browser origins allowed to call the API (the Expo web dev server). */
  CORS_ORIGINS: z.string().default('http://localhost:8081,http://localhost:8090'),
  LOGIN_MAX_ATTEMPTS: z.coerce.number().int().positive().default(5),
  /** Server-side only. Without it the coach answers from built-in rules. Never sent to the app. */
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().default('gemini-3.8-flash'),
  AI_TIMEOUT_MS: z.coerce.number().int().positive().default(20_000),
  /** Sends password-reset emails through Resend (https://resend.com). Without it no email is sent. */
  RESEND_API_KEY: z.string().optional(),
  /** The From address, e.g. "FitSphere <no-reply@yourdomain.com>". Must be a domain verified in Resend. */
  MAIL_FROM: z.string().optional(),
  /** AI chat messages one user may send per hour. */
  AI_CHAT_PER_HOUR: z.coerce.number().int().positive().default(20),
  LOGIN_WINDOW_SEC: z.coerce.number().int().positive().default(15 * 60),
});

export type Config = z.infer<typeof schema>;

export function loadConfig(env: Record<string, string | undefined> = process.env): Config {
  const parsed = schema.safeParse(env);
  if (!parsed.success) {
    const details = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
    throw new Error(`Invalid backend configuration — ${details}. See backend/.env.example.`);
  }
  return parsed.data;
}
