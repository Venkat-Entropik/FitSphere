import { randomUUID } from 'node:crypto';

import type { FastifyInstance } from 'fastify';

import { fail, validationFailure } from '../http.js';
import type { DataDeps } from './profile.routes.js';
import type { NutritionRepository } from './nutrition.repository.js';
import { dateQuery, foodBody, idParams, MAX_MEALS_PER_DAY, waterBody } from './schemas.js';

export function registerNutritionRoutes(app: FastifyInstance, nutrition: NutritionRepository, { now }: DataDeps): void {
  const auth = { preHandler: app.authenticate };

  app.get('/nutrition/daily', auth, async (request, reply) => {
    const query = dateQuery.safeParse(request.query);
    if (!query.success) return validationFailure(reply, query.error);
    return nutrition.getDay(request.userId!, query.data.date);
  });

  app.post('/nutrition/foods', auth, async (request, reply) => {
    const parsed = foodBody.safeParse(request.body);
    if (!parsed.success) return validationFailure(reply, parsed.error);
    const { date, id, loggedAt, ...meal } = parsed.data;
    const day = nutrition.logMeal(request.userId!, date, {
      id: id ?? randomUUID(),
      loggedAt: loggedAt ?? now(),
      ...meal,
    });
    if (!day) {
      return fail(reply, 409, 'day_full', `You can log at most ${MAX_MEALS_PER_DAY} meals a day.`);
    }
    return reply.status(201).send(day);
  });

  app.delete('/nutrition/foods/:id', auth, async (request, reply) => {
    const params = idParams.safeParse(request.params);
    const query = dateQuery.safeParse(request.query);
    if (!params.success) return validationFailure(reply, params.error);
    if (!query.success) return validationFailure(reply, query.error);
    return nutrition.removeMeal(request.userId!, query.data.date, params.data.id);
  });

  app.post('/nutrition/water', auth, async (request, reply) => {
    const parsed = waterBody.safeParse(request.body);
    if (!parsed.success) return validationFailure(reply, parsed.error);
    return nutrition.addWater(request.userId!, parsed.data.date, parsed.data.ml);
  });
}
