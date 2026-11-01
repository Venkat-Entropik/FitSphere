/**
 * Optional dev helper: fills an EXISTING account with the app's sample history (workouts, runs, weights,
 * meals) so the dashboard and charts have something to show. Real users never get sample data.
 *
 *   npm --prefix backend run seed:dev -- you@example.com
 *
 * With the embedded database (no DATABASE_URL) stop the dev server first: only one process can open it.
 * The sample data comes from the app's own seed (src/services/mock-db/seed.ts), so there is one copy.
 */
import { loadConfig } from '../src/config.js';
import { createNutritionRepository } from '../src/data/nutrition.repository.js';
import { createProfileRepository } from '../src/data/profile.repository.js';
import { createActivityRepository, createWorkoutRepository } from '../src/data/records.repository.js';
import { openDatabase } from '../src/db.js';
import { buildSeed } from '../../src/services/mock-db/seed.ts';

const email = process.argv[2]?.trim().toLowerCase();
if (!email) {
  console.error('Usage: npm --prefix backend run seed:dev -- <email of an existing account>');
  process.exit(1);
}

const config = loadConfig();
if (config.NODE_ENV === 'production') {
  console.error('Refusing to seed sample data in production.');
  process.exit(1);
}

const db = await openDatabase({ url: config.DATABASE_URL, path: config.DATABASE_PATH });
const user = await db.get<{ id: string }>('SELECT id FROM users WHERE email = ?', [email]);
if (!user) {
  console.error(`No account for ${email}. Register in the app first.`);
  await await db.close();
  process.exit(1);
}

const seed = buildSeed();
const now = Date.now();
const profiles = createProfileRepository(db);
const workouts = createWorkoutRepository<{ id: string; startedAt: number }>(db);
const activities = createActivityRepository<{ id: string; startedAt: number }>(db);
const nutrition = createNutritionRepository(db);

// Each repository call is already atomic.
{
  await profiles.replace(user.id, seed.profile.profile, now, seed.weights.at(-1)?.dateKey ?? '2026-01-01', 'seed-profile-weight');
  for (const w of seed.weights) await profiles.logWeight(user.id, w, now);
  for (const w of seed.workouts) await workouts.upsert(user.id, w);
  for (const a of seed.activities) await activities.upsert(user.id, a);
  for (const day of Object.values(seed.nutritionDays)) {
    for (const meal of day.meals) await nutrition.logMeal(user.id, day.dateKey, meal);
    await nutrition.addWater(user.id, day.dateKey, day.hydrationMl);
  }
}

console.log(
  `Seeded ${email}: ${seed.workouts.length} workouts, ${seed.activities.length} activities, ${seed.weights.length} weights.`,
);
await db.close();
