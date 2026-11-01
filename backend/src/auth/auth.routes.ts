import { randomUUID } from 'node:crypto';

import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';

import type { Config } from '../config.js';
import { fail, validationFailure } from '../http.js';
import type { AuthRepository, UserRow } from './auth.repository.js';
import { hashPassword, verifyAgainstDecoy, verifyPassword } from './passwords.js';
import { createLoginLimiter } from './rate-limit.js';
import { email, newPassword } from './schemas.js';
import { hashRefreshToken, newRefreshToken, type TokenService } from './tokens.js';

const registerBody = z.object({
  name: z.string().trim().min(2, 'Enter your name').max(60, 'Keep your name under 60 characters'),
  email,
  password: newPassword,
});

const loginBody = z.object({ email, password: z.string().min(1, 'Password is required').max(128) });
const refreshBody = z.object({ refreshToken: z.string().min(20).max(200) });

export interface PublicUser {
  id: string;
  name: string;
  email: string;
}

const publicUser = (u: UserRow): PublicUser => ({ id: u.id, name: u.name, email: u.email });

declare module 'fastify' {
  interface FastifyRequest {
    userId?: string;
  }
  interface FastifyInstance {
    /** preHandler: rejects with 401 unless a valid bearer access token is present. */
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

export interface AuthDeps {
  config: Config;
  users: AuthRepository;
  tokens: TokenService;
  now?: () => number;
  /** Called once after a new account is created (e.g. to give it a default profile). */
  onUserCreated?: (user: UserRow) => void | Promise<void>;
}

export function registerAuthRoutes(app: FastifyInstance, deps: AuthDeps): void {
  const { config, users, tokens } = deps;
  const now = deps.now ?? Date.now;
  const loginLimiter = createLoginLimiter(config.LOGIN_MAX_ATTEMPTS, config.LOGIN_WINDOW_SEC);
  const signupLimiter = createLoginLimiter(20, 60 * 60);

  async function issueSession(user: UserRow) {
    const refreshToken = newRefreshToken();
    const issuedAt = now();
    await users.insertRefreshToken({
      id: randomUUID(),
      userId: user.id,
      tokenHash: hashRefreshToken(refreshToken),
      expiresAt: issuedAt + config.REFRESH_TOKEN_TTL_DAYS * 86_400_000,
      now: issuedAt,
    });
    return {
      user: publicUser(user),
      tokens: {
        accessToken: await tokens.signAccessToken(user.id),
        refreshToken,
        expiresIn: tokens.accessTtlSec,
      },
    };
  }

  app.decorate('authenticate', async (request: FastifyRequest, reply: FastifyReply) => {
    const header = request.headers.authorization;
    const token = header?.startsWith('Bearer ') ? header.slice(7) : null;
    const userId = token ? await tokens.verifyAccessToken(token) : null;
    if (!userId || !(await users.findUserById(userId))) {
      return fail(reply, 401, 'unauthorized', 'Your session has expired. Please sign in again.');
    }
    request.userId = userId;
  });

  app.post('/auth/register', async (request, reply) => {
    const blocked = signupLimiter.retryAfterSec(request.ip, now());
    if (blocked > 0) return fail(reply.header('Retry-After', blocked), 429, 'rate_limited', 'Too many sign-up attempts. Try again later.');
    signupLimiter.recordFailure(request.ip, now()); // counts every attempt

    const parsed = registerBody.safeParse(request.body);
    if (!parsed.success) return validationFailure(reply, parsed.error);

    const created = await users.createUser({
      id: randomUUID(),
      email: parsed.data.email,
      name: parsed.data.name,
      passwordHash: await hashPassword(parsed.data.password),
      now: now(),
    });
    if (!created) return fail(reply, 409, 'email_taken', 'An account with this email already exists.', { fieldErrors: { email: 'An account with this email already exists.' } });

    await deps.onUserCreated?.(created);
    return reply.status(201).send(await issueSession(created));
  });

  app.post('/auth/login', async (request, reply) => {
    const parsed = loginBody.safeParse(request.body);
    if (!parsed.success) return validationFailure(reply, parsed.error);

    const key = `${request.ip}|${parsed.data.email}`;
    const blocked = loginLimiter.retryAfterSec(key, now());
    if (blocked > 0) {
      return fail(reply.header('Retry-After', blocked), 429, 'rate_limited', `Too many failed attempts. Try again in ${Math.ceil(blocked / 60)} min.`);
    }

    const user = await users.findUserByEmail(parsed.data.email);
    const ok = user ? await verifyPassword(parsed.data.password, user.passwordHash) : await verifyAgainstDecoy(parsed.data.password);
    if (!user || !ok) {
      loginLimiter.recordFailure(key, now());
      return fail(reply, 401, 'invalid_credentials', 'Invalid email or password.');
    }

    loginLimiter.reset(key);
    return issueSession(user);
  });

  /** Rotates the refresh token. Replaying an already-used one ends every session for that user. */
  app.post('/auth/refresh', async (request, reply) => {
    const parsed = refreshBody.safeParse(request.body);
    if (!parsed.success) return fail(reply, 401, 'invalid_refresh_token', 'Your session has expired. Please sign in again.');

    const stored = await users.findRefreshToken(hashRefreshToken(parsed.data.refreshToken));
    const at = now();
    if (!stored) return fail(reply, 401, 'invalid_refresh_token', 'Your session has expired. Please sign in again.');
    if (stored.revokedAt !== null) {
      await users.revokeAllForUser(stored.userId, at);
      return fail(reply, 401, 'invalid_refresh_token', 'Your session has expired. Please sign in again.');
    }
    const user = await users.findUserById(stored.userId);
    if (stored.expiresAt <= at || !user) return fail(reply, 401, 'invalid_refresh_token', 'Your session has expired. Please sign in again.');

    const session = await issueSession(user);
    const next = await users.findRefreshToken(hashRefreshToken(session.tokens.refreshToken));
    await users.revokeRefreshToken(stored.id, at, next?.id ?? null);
    await users.pruneExpired(at);
    return { tokens: session.tokens };
  });

  app.post('/auth/logout', async (request, reply) => {
    const parsed = refreshBody.safeParse(request.body);
    if (parsed.success) {
      const stored = await users.findRefreshToken(hashRefreshToken(parsed.data.refreshToken));
      if (stored) await users.revokeRefreshToken(stored.id, now());
    }
    // Always 204: logging out must succeed even if the token was already gone.
    return reply.status(204).send();
  });

  app.get('/auth/me', { preHandler: app.authenticate }, async (request) => {
    const user = await users.findUserById(request.userId!);
    return { user: publicUser(user!) };
  });
}
