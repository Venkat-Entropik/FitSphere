import { createHash, timingSafeEqual } from 'node:crypto';

import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

import { fail, validationFailure } from '../http.js';
import type { PlanRepository } from './plan.repository.js';

const body = z
  .object({
    email: z.string().trim().toLowerCase().email().max(254),
    plan: z.enum(['free', 'pro']),
    /** Epoch ms when Pro ends; omit for no expiry. */
    expiresAt: z.number().int().positive().optional(),
  })
  .strict();

const digest = (value: string) => createHash('sha256').update(value).digest();

/**
 * Operator-only: sets an account's plan (testing, support, and later the billing webhook's target).
 * Not registered at all unless ADMIN_TOKEN is configured.
 */
export function registerAdminRoutes(
  app: FastifyInstance,
  { token, plans }: { token: string | undefined; plans: PlanRepository },
): void {
  if (!token) return;
  const expected = digest(token);
  app.post('/admin/plan', async (request, reply) => {
    const given = request.headers['x-admin-token'];
    if (typeof given !== 'string' || !timingSafeEqual(digest(given), expected)) {
      return fail(reply, 401, 'unauthorized', 'Not authorised.');
    }
    const parsed = body.safeParse(request.body);
    if (!parsed.success) return validationFailure(reply, parsed.error);
    const ok = await plans.setPlan(
      parsed.data.email,
      parsed.data.plan,
      parsed.data.expiresAt ?? null,
    );
    return ok ? { ok: true } : fail(reply, 404, 'not_found', 'No account with that email.');
  });
}
