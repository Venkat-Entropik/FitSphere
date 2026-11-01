import cors from '@fastify/cors';
import Fastify, { type FastifyInstance } from 'fastify';
import type { DatabaseSync } from 'node:sqlite';
import type { z } from 'zod';

import { createAuthRepository } from './auth/auth.repository.js';
import { registerAuthRoutes } from './auth/auth.routes.js';
import { createAiService } from './ai/ai.service.js';
import { createCoachRepository } from './ai/coach.repository.js';
import { registerCoachRoutes } from './ai/coach.routes.js';
import { createGeminiProvider } from './ai/gemini.provider.js';
import type { AiProvider } from './ai/provider.js';
import { createNutritionRepository } from './data/nutrition.repository.js';
import { registerNutritionRoutes } from './data/nutrition.routes.js';
import { createProfileRepository } from './data/profile.repository.js';
import { registerProfileRoutes } from './data/profile.routes.js';
import { createActivityRepository, createWorkoutRepository } from './data/records.repository.js';
import { registerRecordRoutes } from './data/records.routes.js';
import { createTokenService } from './auth/tokens.js';
import type { Config } from './config.js';
import type { activityBody, workoutBody } from './data/schemas.js';

type WorkoutRecord = z.infer<typeof workoutBody>;
type ActivityRecord = z.infer<typeof activityBody>;

export interface AppOptions {
  config: Config;
  db: DatabaseSync;
  now?: () => number;
  /** Overrides the model provider (tests pass a fake; `null` forces rule-based answers). */
  ai?: AiProvider | null;
}

export async function buildApp({ config, db, now, ai }: AppOptions): Promise<FastifyInstance> {
  // Bodies are small by design (routes are downsampled to ≤200 points), so cap them well below Fastify's 1 MB.
  const app = Fastify({
    // Request logs carry method, path and status only: never bodies, headers or tokens. Silent in tests.
    logger: config.NODE_ENV !== 'test',
    bodyLimit: 256 * 1024,
    trustProxy: config.TRUST_PROXY,
  });
  const clock = now ?? Date.now;

  await app.register(cors, {
    origin: config.CORS_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean),
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  app.get('/health', async () => ({ status: 'ok' }));

  const profiles = createProfileRepository(db);

  registerAuthRoutes(app, {
    config,
    users: createAuthRepository(db),
    tokens: createTokenService(config.JWT_SECRET, config.ACCESS_TOKEN_TTL_SEC),
    now,
    onUserCreated: (user) => profiles.ensure(user.id, clock()),
  });

  // Every data route authenticates and scopes by the token's user id; no route accepts one from the client.
  registerProfileRoutes(app, profiles, { now: clock });
  const workouts = createWorkoutRepository<WorkoutRecord>(db);
  const activities = createActivityRepository<ActivityRecord>(db);
  const nutrition = createNutritionRepository(db);
  registerRecordRoutes(app, { workouts, activities });
  registerNutritionRoutes(app, nutrition, { now: clock });

  // The model key lives only on the server. Without one (or if the model fails) the coach uses rules.
  const provider =
    ai !== undefined
      ? ai
      : config.GEMINI_API_KEY
        ? createGeminiProvider({ apiKey: config.GEMINI_API_KEY, model: config.GEMINI_MODEL, timeoutMs: config.AI_TIMEOUT_MS })
        : null;
  registerCoachRoutes(app, {
    config,
    // Log only that a call failed, never prompts, replies or request bodies.
    ai: createAiService(provider, (error) => app.log.warn({ err: error instanceof Error ? error.name : 'unknown' }, 'AI provider call failed')),
    coach: createCoachRepository(db),
    sources: { profiles, workouts, activities, nutrition },
    now: clock,
  });

  // Never leak internals (stack traces, SQL) to clients.
  app.setErrorHandler((error: unknown, _request, reply) => {
    const statusCode = (error as { statusCode?: unknown }).statusCode;
    const status = typeof statusCode === 'number' && statusCode >= 400 ? statusCode : 500;
    if (status >= 500) app.log.error(error);
    const message = error instanceof Error ? error.message : 'Bad request';
    return reply.status(status).send({
      message: status >= 500 ? 'Something went wrong on our side. Try again later.' : message,
      code: status >= 500 ? 'internal_error' : 'bad_request',
    });
  });

  return app;
}
