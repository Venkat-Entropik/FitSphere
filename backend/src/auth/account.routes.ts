import { createHash, randomInt, timingSafeEqual } from 'node:crypto';

import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

import type { Config } from '../config.js';
import { fail, validationFailure } from '../http.js';
import type { Mailer } from '../mail/mailer.js';
import type { AuthRepository } from './auth.repository.js';
import { hashPassword, verifyPassword } from './passwords.js';
import { createLoginLimiter } from './rate-limit.js';
import { email, newPassword } from './schemas.js';

const RESET_TTL_MS = 15 * 60_000;
const MAX_CODE_ATTEMPTS = 5;

const forgotBody = z.object({ email });
const resetBody = z.object({
  email,
  code: z.string().trim().regex(/^\d{6}$/, 'Enter the 6-digit code'),
  password: newPassword,
});
const deleteBody = z.object({ password: z.string().min(1, 'Password is required').max(128) });

/** Bound to the user so a code can't be replayed against another account, and never stored in plain text. */
const hashCode = (userId: string, code: string) => createHash('sha256').update(`${userId}:${code}`).digest('hex');

function sameHash(a: string, b: string): boolean {
  const x = Buffer.from(a, 'hex');
  const y = Buffer.from(b, 'hex');
  return x.length === y.length && timingSafeEqual(x, y);
}

export interface AccountDeps {
  config: Config;
  users: AuthRepository;
  mailer: Mailer;
  now?: () => number;
  /** Called with the error when an email could not be sent. Must not log the message contents. */
  onMailError?: (error: unknown) => void;
}

/** Password reset by emailed code, and permanent account deletion. */
export function registerAccountRoutes(app: FastifyInstance, deps: AccountDeps): void {
  const { config, users, mailer } = deps;
  const now = deps.now ?? Date.now;
  const forgotIp = createLoginLimiter(10, 3600);
  const forgotEmail = createLoginLimiter(3, 3600);
  const resetFailures = createLoginLimiter(config.LOGIN_MAX_ATTEMPTS, config.LOGIN_WINDOW_SEC);
  const deleteFailures = createLoginLimiter(config.LOGIN_MAX_ATTEMPTS, config.LOGIN_WINDOW_SEC);

  /** Sent in the background so response time doesn't reveal whether the account exists. */
  const sendInBackground = (message: Parameters<Mailer['send']>[0]) => {
    void mailer.send(message).catch((error: unknown) => deps.onMailError?.(error));
  };

  app.post('/auth/forgot-password', async (request, reply) => {
    const parsed = forgotBody.safeParse(request.body);
    if (!parsed.success) return validationFailure(reply, parsed.error);
    const at = now();
    const address = parsed.data.email;

    const blocked = Math.max(forgotIp.retryAfterSec(request.ip, at), forgotEmail.retryAfterSec(address, at));
    if (blocked > 0) {
      return fail(reply.header('Retry-After', blocked), 429, 'rate_limited', 'Too many reset requests. Try again later.');
    }
    forgotIp.recordFailure(request.ip, at); // counts every request, known account or not
    forgotEmail.recordFailure(address, at);

    const user = await users.findUserByEmail(address);
    if (user) {
      const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
      await users.putResetCode({ userId: user.id, codeHash: hashCode(user.id, code), expiresAt: at + RESET_TTL_MS, now: at });
      sendInBackground({
        to: user.email,
        subject: 'Your FitSphere password reset code',
        text: `Your FitSphere password reset code is ${code}.\n\nIt expires in 15 minutes. If you did not ask for this, ignore this email; your password has not changed.`,
      });
    }
    // Same answer whether or not the account exists.
    return reply.status(202).send({ message: 'If an account exists for that email, we sent a reset code.' });
  });

  app.post('/auth/reset-password', async (request, reply) => {
    const parsed = resetBody.safeParse(request.body);
    if (!parsed.success) return validationFailure(reply, parsed.error);
    const at = now();
    const { email: address, code, password } = parsed.data;

    const key = `${request.ip}|${address}`;
    const blocked = resetFailures.retryAfterSec(key, at);
    if (blocked > 0) {
      return fail(reply.header('Retry-After', blocked), 429, 'rate_limited', 'Too many attempts. Try again later.');
    }
    const invalid = () => {
      resetFailures.recordFailure(key, at);
      return fail(reply, 400, 'invalid_code', 'That code is invalid or has expired. Request a new one.', {
        fieldErrors: { code: 'That code is invalid or has expired.' },
      });
    };

    const user = await users.findUserByEmail(address);
    const reset = user ? await users.findResetCode(user.id) : undefined;
    if (!user || !reset) return invalid();
    if (reset.expires_at <= at) {
      await users.deleteResetCode(user.id);
      return invalid();
    }
    if (!sameHash(reset.code_hash, hashCode(user.id, code))) {
      await users.addResetAttempt(user.id);
      // A 6-digit code can't survive guessing, so it is burned after a few misses.
      if (reset.attempts + 1 >= MAX_CODE_ATTEMPTS) await users.deleteResetCode(user.id);
      return invalid();
    }

    await users.setPassword(user.id, await hashPassword(password));
    await users.deleteResetCode(user.id);
    await users.revokeAllForUser(user.id, at); // signs the account out everywhere
    resetFailures.reset(key);
    sendInBackground({
      to: user.email,
      subject: 'Your FitSphere password was changed',
      text: 'Your FitSphere password was just changed and you were signed out on all devices. If this was not you, reset your password again now.',
    });
    return reply.status(204).send();
  });

  /** Permanent. Requires the password so a stolen access token alone can't erase an account. */
  app.post('/auth/delete-account', { preHandler: app.authenticate }, async (request, reply) => {
    const parsed = deleteBody.safeParse(request.body);
    if (!parsed.success) return validationFailure(reply, parsed.error);
    const userId = request.userId!;
    const at = now();

    const blocked = deleteFailures.retryAfterSec(userId, at);
    if (blocked > 0) {
      return fail(reply.header('Retry-After', blocked), 429, 'rate_limited', 'Too many attempts. Try again later.');
    }
    const user = (await users.findUserById(userId))!;
    // 403, not 401: the app treats 401 as an expired session and would try to refresh and retry.
    if (!(await verifyPassword(parsed.data.password, user.passwordHash))) {
      deleteFailures.recordFailure(userId, at);
      return fail(reply, 403, 'invalid_credentials', 'Incorrect password.', { fieldErrors: { password: 'Incorrect password.' } });
    }

    await users.deleteUser(userId);
    deleteFailures.reset(userId);
    return reply.status(204).send();
  });
}
