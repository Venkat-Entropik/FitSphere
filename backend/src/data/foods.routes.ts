import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

import { fail, validationFailure } from '../http.js';

const query = z.object({ q: z.string().trim().min(2).max(80) });
const FIELDS = 'code,product_name,brands,nutriments,serving_quantity,serving_size';

/**
 * Food search for the web build. Browsers cannot call Open Food Facts' text search directly (no CORS
 * headers), so signed-in users go through here. Phones call the database themselves.
 */
export function registerFoodRoutes(app: FastifyInstance, fetchImpl: typeof fetch = fetch): void {
  app.get('/foods/search', { preHandler: app.authenticate }, async (request, reply) => {
    const parsed = query.safeParse(request.query);
    if (!parsed.success) return validationFailure(reply, parsed.error);
    const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(parsed.data.q)}&search_simple=1&action=process&json=1&page_size=25&fields=${FIELDS}`;
    try {
      const response = await fetchImpl(url, {
        headers: { Accept: 'application/json', 'User-Agent': 'FitSphere/1.0 (web proxy)' },
        signal: AbortSignal.timeout(10_000),
      });
      if (response.status === 429)
        return fail(reply, 429, 'rate_limited', 'Too many searches. Wait a minute and try again.');
      if (!response.ok)
        return fail(reply, 502, 'unavailable', 'The food database is not responding.');
      const body = (await response.json()) as { products?: unknown[] };
      return { products: Array.isArray(body.products) ? body.products : [] };
    } catch {
      return fail(reply, 502, 'unavailable', 'The food database is not responding.');
    }
  });
}
