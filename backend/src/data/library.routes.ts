import type { FastifyInstance } from 'fastify';
import type { z } from 'zod';

import { fail, validationFailure } from '../http.js';
import type { DataDeps } from './profile.routes.js';
import type { DocStore } from './library.repository.js';
import {
  customExerciseBody,
  idParams,
  MAX_CUSTOM_EXERCISES,
  MAX_ROUTINES,
  routineBody,
} from './schemas.js';

type Routine = z.infer<typeof routineBody>;
type CustomExercise = z.infer<typeof customExerciseBody>;

export function registerLibraryRoutes(
  app: FastifyInstance,
  stores: { routines: DocStore<Routine>; customExercises: DocStore<CustomExercise> },
  { now }: DataDeps,
): void {
  const auth = { preHandler: app.authenticate };

  app.get('/routines', auth, async (request) => stores.routines.list(request.userId!));

  app.post('/routines', auth, async (request, reply) => {
    const parsed = routineBody.safeParse(request.body);
    if (!parsed.success) return validationFailure(reply, parsed.error);
    const saved = await stores.routines.upsert(request.userId!, parsed.data, parsed.data.updatedAt);
    if (!saved)
      return fail(
        reply,
        409,
        'limit_reached',
        `You can keep at most ${MAX_ROUTINES} routines. Delete one first.`,
      );
    return reply.status(201).send(saved);
  });

  app.delete('/routines/:id', auth, async (request, reply) => {
    const params = idParams.safeParse(request.params);
    if (!params.success) return validationFailure(reply, params.error);
    await stores.routines.remove(request.userId!, params.data.id);
    return reply.status(204).send();
  });

  app.get('/exercises/custom', auth, async (request) =>
    stores.customExercises.list(request.userId!),
  );

  app.post('/exercises/custom', auth, async (request, reply) => {
    const parsed = customExerciseBody.safeParse(request.body);
    if (!parsed.success) return validationFailure(reply, parsed.error);
    const saved = await stores.customExercises.upsert(request.userId!, parsed.data, now());
    if (!saved) {
      return fail(
        reply,
        409,
        'limit_reached',
        `You can create at most ${MAX_CUSTOM_EXERCISES} custom exercises.`,
      );
    }
    return reply.status(201).send(saved);
  });

  app.delete('/exercises/custom/:id', auth, async (request, reply) => {
    const params = idParams.safeParse(request.params);
    if (!params.success) return validationFailure(reply, params.error);
    await stores.customExercises.remove(request.userId!, params.data.id);
    return reply.status(204).send();
  });
}
