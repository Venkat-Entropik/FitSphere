import cors from '@fastify/cors';
import Fastify, { type FastifyInstance } from 'fastify';
import type { DatabaseSync } from 'node:sqlite';

import { createAuthRepository } from './auth/auth.repository.js';
import { registerAuthRoutes } from './auth/auth.routes.js';
import { createTokenService } from './auth/tokens.js';
import type { Config } from './config.js';

export interface AppOptions {
  config: Config;
  db: DatabaseSync;
  now?: () => number;
}

export async function buildApp({ config, db, now }: AppOptions): Promise<FastifyInstance> {
  const app = Fastify({ logger: config.NODE_ENV === 'development' });

  await app.register(cors, {
    origin: config.CORS_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean),
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  app.get('/health', async () => ({ status: 'ok' }));

  registerAuthRoutes(app, {
    config,
    users: createAuthRepository(db),
    tokens: createTokenService(config.JWT_SECRET, config.ACCESS_TOKEN_TTL_SEC),
    now,
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
