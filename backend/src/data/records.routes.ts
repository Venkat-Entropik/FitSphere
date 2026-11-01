import type { FastifyInstance } from 'fastify';
import type { z } from 'zod';

import { validationFailure } from '../http.js';
import type { RecordStore } from './records.repository.js';
import { activityBody, workoutBody } from './schemas.js';

type Workout = z.infer<typeof workoutBody>;
type Activity = z.infer<typeof activityBody>;

export function registerRecordRoutes(
  app: FastifyInstance,
  stores: { workouts: RecordStore<Workout>; activities: RecordStore<Activity> },
): void {
  const auth = { preHandler: app.authenticate };

  app.get('/workouts/history', auth, async (request) => stores.workouts.list(request.userId!));

  app.post('/workouts', auth, async (request, reply) => {
    const parsed = workoutBody.safeParse(request.body);
    if (!parsed.success) return validationFailure(reply, parsed.error);
    return reply.status(201).send(stores.workouts.upsert(request.userId!, parsed.data));
  });

  app.get('/activities', auth, async (request) => stores.activities.list(request.userId!));

  app.post('/activities', auth, async (request, reply) => {
    const parsed = activityBody.safeParse(request.body);
    if (!parsed.success) return validationFailure(reply, parsed.error);
    return reply.status(201).send(stores.activities.upsert(request.userId!, parsed.data));
  });
}
