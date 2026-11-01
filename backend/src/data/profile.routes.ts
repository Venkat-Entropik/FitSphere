import type { FastifyInstance } from 'fastify';

import { validationFailure } from '../http.js';
import type { ProfileRepository } from './profile.repository.js';
import { profileBody, profilePatchBody, weightBody } from './schemas.js';

export interface DataDeps {
  now: () => number;
}

const utcDate = (ms: number) => new Date(ms).toISOString().slice(0, 10);

export function registerProfileRoutes(app: FastifyInstance, profiles: ProfileRepository, { now }: DataDeps): void {
  const auth = { preHandler: app.authenticate };

  app.get('/profile', auth, async (request) => profiles.get(request.userId!, now()));

  app.put('/profile', auth, async (request, reply) => {
    const parsed = profileBody.safeParse(request.body);
    if (!parsed.success) return validationFailure(reply, parsed.error);
    const at = now();
    return profiles.replace(request.userId!, parsed.data, at, utcDate(at), `weight-${at}`);
  });

  app.patch('/profile', auth, async (request, reply) => {
    const parsed = profilePatchBody.safeParse(request.body);
    if (!parsed.success) return validationFailure(reply, parsed.error);
    const at = now();
    return profiles.patch(request.userId!, parsed.data, at, utcDate(at), `weight-${at}`);
  });

  app.get('/profile/weights', auth, async (request) => profiles.listWeights(request.userId!));

  app.post('/profile/weights', auth, async (request, reply) => {
    const parsed = weightBody.safeParse(request.body);
    if (!parsed.success) return validationFailure(reply, parsed.error);
    const at = now();
    const { id, dateKey, ...rest } = parsed.data;
    return profiles.logWeight(request.userId!, { id: id ?? `weight-${at}`, dateKey: dateKey ?? utcDate(at), ...rest }, at);
  });
}
