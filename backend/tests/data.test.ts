import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';

import type { FastifyInstance } from 'fastify';

import { buildApp } from '../src/app.js';
import { loadConfig } from '../src/config.js';
import { openDatabase, type Db } from '../src/db.js';
import { testDb } from './helpers.js';

const SECRET = 'test-secret-test-secret-test-secret-1234';
const NOW = Date.parse('2026-11-01T12:00:00Z');

interface Harness {
  app: FastifyInstance;
  db: Db;
}
const open: Harness[] = [];

async function setup(): Promise<Harness> {
  const db = await testDb();
  const app = await buildApp({ config: loadConfig({ NODE_ENV: 'test', JWT_SECRET: SECRET }), db, now: () => NOW });
  const h = { app, db };
  open.push(h);
  return h;
}

afterEach(async () => {
  for (const h of open.splice(0)) {
    await h.app.close();
  }
});

async function signUp(h: Harness, email: string): Promise<{ token: string; id: string }> {
  const res = await h.app.inject({
    method: 'POST',
    url: '/auth/register',
    payload: { name: 'Test User', email, password: 'Passw0rdOK' },
  });
  assert.equal(res.statusCode, 201);
  const body = res.json();
  return { token: body.tokens.accessToken, id: body.user.id };
}

const call = (h: Harness, token: string | null, method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE', url: string, payload?: unknown) =>
  h.app.inject({
    method,
    url,
    payload: payload as object | undefined,
    headers: token ? { authorization: `Bearer ${token}` } : {},
  });

const body = {
  profile: { goal: 'fat_loss', sex: 'female', heightCm: 165, weightKg: 62, targetKg: 58, experience: 'intermediate', daysPerWeek: 4 },
  workout: (id = 'w1') => ({
    id,
    planId: null,
    title: 'Push day',
    startedAt: NOW - 3_600_000,
    endedAt: NOW,
    durationSec: 3600,
    volumeKg: 4200,
    setsCompleted: 2,
    prCount: 1,
    kcal: 300,
    exercises: [{ exerciseId: 'bench', name: 'Bench Press', muscleGroup: 'chest', sets: [{ kg: 60, reps: 8, isPersonalRecord: true }] }],
    source: 'user',
  }),
  activity: (id = 'a1', points = 3) => ({
    id,
    kind: 'run',
    title: 'Morning run',
    startedAt: NOW - 1_800_000,
    endedAt: NOW,
    distanceKm: 5,
    durationSec: 1800,
    movingSec: 1780,
    avgPaceSecPerKm: 360,
    kcal: 320,
    elevationGainM: 20,
    splits: [{ km: 1, paceSecPerKm: 360, isFastest: true }],
    route: Array.from({ length: points }, (_, i) => ({ lat: 12 + i * 0.001, lng: 77 })),
    source: 'user',
  }),
  meal: (extra: object = {}) => ({
    date: '2026-11-01',
    category: 'lunch',
    title: 'Chicken bowl',
    kcal: 600,
    protein: 45,
    carbs: 60,
    fat: 18,
    ...extra,
  }),
};

describe('authentication', () => {
  it('rejects every data route without a valid bearer token', async () => {
    const h = await setup();
    const routes: [Parameters<typeof call>[2], string][] = [
      ['GET', '/profile'],
      ['PUT', '/profile'],
      ['PATCH', '/profile'],
      ['GET', '/profile/weights'],
      ['POST', '/profile/weights'],
      ['GET', '/workouts/history'],
      ['POST', '/workouts'],
      ['GET', '/activities'],
      ['POST', '/activities'],
      ['GET', '/nutrition/daily?date=2026-11-01'],
      ['GET', '/nutrition/range?from=2026-11-01&to=2026-11-01'],
      ['GET', '/routines'],
      ['POST', '/routines'],
      ['DELETE', '/routines/r1'],
      ['GET', '/exercises/custom'],
      ['POST', '/exercises/custom'],
      ['DELETE', '/exercises/custom/e1'],
      ['POST', '/nutrition/foods'],
      ['DELETE', '/nutrition/foods/m1?date=2026-11-01'],
      ['POST', '/nutrition/water'],
    ];
    for (const [method, url] of routes) {
      assert.equal((await call(h, null, method, url, {})).statusCode, 401, `${method} ${url}`);
      assert.equal((await call(h, 'garbage', method, url, {})).statusCode, 401, `${method} ${url} (bad token)`);
    }
  });
});

describe('profile', () => {
  it('creates a default profile on register, named after the account', async () => {
    const h = await setup();
    const a = await signUp(h, 'a@example.com');
    const row = await h.db.get('SELECT onboarding_complete FROM profiles WHERE user_id = ?', [a.id]);
    assert.ok(row, 'profile row exists right after register');
    const res = await call(h, a.token, 'GET', '/profile');
    assert.equal(res.statusCode, 200);
    const p = res.json();
    assert.equal(p.identity.name, 'Test User');
    assert.equal(p.onboardingComplete, false);
    assert.equal(p.profile.goal, 'muscle');
  });

  it('PUT saves the profile and completes onboarding; a changed weight becomes a weigh-in', async () => {
    const h = await setup();
    const a = await signUp(h, 'a@example.com');
    const res = await call(h, a.token, 'PUT', '/profile', body.profile);
    assert.equal(res.statusCode, 200);
    assert.equal(res.json().onboardingComplete, true);
    assert.equal(res.json().profile.weightKg, 62);
    const weights = (await call(h, a.token, 'GET', '/profile/weights')).json();
    assert.deepEqual(weights.map((w: { kg: number; dateKey: string }) => [w.dateKey, w.kg]), [['2026-11-01', 62]]);
  });

  it('PATCH merges fields without touching the onboarding flag', async () => {
    const h = await setup();
    const a = await signUp(h, 'a@example.com');
    const res = await call(h, a.token, 'PATCH', '/profile', { daysPerWeek: 5 });
    assert.equal(res.statusCode, 200);
    assert.equal(res.json().profile.daysPerWeek, 5);
    assert.equal(res.json().profile.goal, 'muscle');
    assert.equal(res.json().onboardingComplete, false);
    // Onboarding stays complete once finished.
    await call(h, a.token, 'PUT', '/profile', body.profile);
    assert.equal((await call(h, a.token, 'PATCH', '/profile', { targetKg: 60 })).json().onboardingComplete, true);
  });

  it('validates input with field errors and rejects unknown fields', async () => {
    const h = await setup();
    const a = await signUp(h, 'a@example.com');
    const bad = await call(h, a.token, 'PUT', '/profile', { ...body.profile, heightCm: 10, daysPerWeek: 9 });
    assert.equal(bad.statusCode, 400);
    assert.equal(bad.json().code, 'validation_error');
    assert.ok(bad.json().fieldErrors.heightCm);
    assert.ok(bad.json().fieldErrors.daysPerWeek);
    assert.equal((await call(h, a.token, 'PATCH', '/profile', { userId: 'x' })).statusCode, 400);
    assert.equal((await call(h, a.token, 'PATCH', '/profile', { onboardingComplete: true })).statusCode, 400);
  });

  it('keeps one weight per day and makes the newest entry the current weight', async () => {
    const h = await setup();
    const a = await signUp(h, 'a@example.com');
    await call(h, a.token, 'POST', '/profile/weights', { id: 'wa', dateKey: '2026-10-30', kg: 70 });
    await call(h, a.token, 'POST', '/profile/weights', { id: 'wb', dateKey: '2026-10-31', kg: 69 });
    const list = (await call(h, a.token, 'POST', '/profile/weights', { id: 'wc', dateKey: '2026-10-31', kg: 68.5, bodyFatPercent: 18 })).json();
    assert.deepEqual(list.map((w: { id: string }) => w.id), ['wa', 'wc']);
    assert.equal(list[1].bodyFatPercent, 18);
    assert.equal((await call(h, a.token, 'GET', '/profile')).json().profile.weightKg, 68.5);
    // Retrying the same request changes nothing.
    const again = (await call(h, a.token, 'POST', '/profile/weights', { id: 'wc', dateKey: '2026-10-31', kg: 68.5, bodyFatPercent: 18 })).json();
    assert.deepEqual(again, list);
  });

  it('rejects impossible weights and bad dates', async () => {
    const h = await setup();
    const a = await signUp(h, 'a@example.com');
    assert.equal((await call(h, a.token, 'POST', '/profile/weights', { kg: 5 })).statusCode, 400);
    assert.equal((await call(h, a.token, 'POST', '/profile/weights', { kg: 70, dateKey: '2026-02-31' })).statusCode, 400);
  });

  it('creates the profile lazily for accounts that predate it', async () => {
    const h = await setup();
    const a = await signUp(h, 'a@example.com');
    await h.db.run('DELETE FROM profiles WHERE user_id = ?', [a.id]);
    assert.equal((await call(h, a.token, 'GET', '/profile')).statusCode, 200);
  });
});

describe('workouts', () => {
  it('stores a workout, is idempotent by id, and lists oldest first', async () => {
    const h = await setup();
    const a = await signUp(h, 'a@example.com');
    assert.equal((await call(h, a.token, 'POST', '/workouts', body.workout('w1'))).statusCode, 201);
    assert.equal((await call(h, a.token, 'POST', '/workouts', body.workout('w1'))).statusCode, 201);
    await call(h, a.token, 'POST', '/workouts', { ...body.workout('w0'), startedAt: NOW - 90_000_000, endedAt: NOW - 86_400_000 });
    const list = (await call(h, a.token, 'GET', '/workouts/history')).json();
    assert.deepEqual(list.map((w: { id: string }) => w.id), ['w0', 'w1']);
    assert.deepEqual(list[1], body.workout('w1'));
  });

  it('validates shape and bounds', async () => {
    const h = await setup();
    const a = await signUp(h, 'a@example.com');
    const post = (payload: unknown) => call(h, a.token, 'POST', '/workouts', payload);
    assert.equal((await post({ ...body.workout(), id: 'bad id!' })).statusCode, 400);
    assert.equal((await post({ ...body.workout(), endedAt: 1, startedAt: 2 })).statusCode, 400);
    assert.equal((await post({ ...body.workout(), extra: 1 })).statusCode, 400);
    assert.equal((await post({ ...body.workout(), exercises: Array.from({ length: 51 }, () => body.workout().exercises[0]) })).statusCode, 400);
    assert.equal((await post({ ...body.workout(), userId: 'someone-else' })).statusCode, 400);
  });
});

describe('activities', () => {
  it('stores an activity idempotently and bounds the route to 200 points', async () => {
    const h = await setup();
    const a = await signUp(h, 'a@example.com');
    assert.equal((await call(h, a.token, 'POST', '/activities', body.activity('a1'))).statusCode, 201);
    assert.equal((await call(h, a.token, 'POST', '/activities', body.activity('a1'))).statusCode, 201);
    assert.equal((await call(h, a.token, 'POST', '/activities', body.activity('a2', 200))).statusCode, 201);
    const tooLong = await call(h, a.token, 'POST', '/activities', body.activity('a3', 201));
    assert.equal(tooLong.statusCode, 400);
    const list = (await call(h, a.token, 'GET', '/activities')).json();
    assert.deepEqual(list.map((x: { id: string }) => x.id).sort(), ['a1', 'a2']);
  });

  it('rejects out-of-range coordinates', async () => {
    const h = await setup();
    const a = await signUp(h, 'a@example.com');
    const bad = { ...body.activity(), route: [{ lat: 91, lng: 0 }] };
    assert.equal((await call(h, a.token, 'POST', '/activities', bad)).statusCode, 400);
  });
});

describe('nutrition', () => {
  it('returns an empty day, logs meals, and removes them', async () => {
    const h = await setup();
    const a = await signUp(h, 'a@example.com');
    assert.deepEqual((await call(h, a.token, 'GET', '/nutrition/daily?date=2026-11-01')).json(), {
      dateKey: '2026-11-01',
      meals: [],
      hydrationMl: 0,
    });
    const logged = await call(h, a.token, 'POST', '/nutrition/foods', body.meal({ id: 'm1', loggedAt: NOW }));
    assert.equal(logged.statusCode, 201);
    assert.equal(logged.json().meals.length, 1);
    assert.equal(logged.json().meals[0].id, 'm1');
    // Same id again: no duplicate.
    assert.equal((await call(h, a.token, 'POST', '/nutrition/foods', body.meal({ id: 'm1', loggedAt: NOW }))).json().meals.length, 1);
    // Server assigns an id and timestamp when the client sends none.
    const second = (await call(h, a.token, 'POST', '/nutrition/foods', body.meal({ category: 'dinner' }))).json();
    assert.equal(second.meals.length, 2);
    assert.equal(second.meals[1].loggedAt, NOW);
    const removed = await call(h, a.token, 'DELETE', '/nutrition/foods/m1?date=2026-11-01');
    assert.equal(removed.json().meals.length, 1);
    assert.equal((await call(h, a.token, 'DELETE', '/nutrition/foods/m1?date=2026-11-01')).statusCode, 200);
  });

  it('adds water and clamps it between 0 and 10 L', async () => {
    const h = await setup();
    const a = await signUp(h, 'a@example.com');
    const add = (ml: number) => call(h, a.token, 'POST', '/nutrition/water', { date: '2026-11-01', ml });
    assert.equal((await add(250)).json().hydrationMl, 250);
    assert.equal((await add(-1000)).json().hydrationMl, 0);
    for (let i = 0; i < 3; i++) await add(5000);
    assert.equal((await add(0)).json().hydrationMl, 10_000);
    assert.equal((await add(6000)).statusCode, 400);
  });

  it('validates the date and meal fields, and caps meals per day', async () => {
    const h = await setup();
    const a = await signUp(h, 'a@example.com');
    assert.equal((await call(h, a.token, 'GET', '/nutrition/daily?date=tomorrow')).statusCode, 400);
    assert.equal((await call(h, a.token, 'GET', '/nutrition/daily')).statusCode, 400);
    assert.equal((await call(h, a.token, 'POST', '/nutrition/foods', body.meal({ kcal: -1 }))).statusCode, 400);
    assert.equal((await call(h, a.token, 'POST', '/nutrition/foods', body.meal({ category: 'brunch' }))).statusCode, 400);
    for (let i = 0; i < 50; i++) await call(h, a.token, 'POST', '/nutrition/foods', body.meal({ id: `m${i}` }));
    const full = await call(h, a.token, 'POST', '/nutrition/foods', body.meal({ id: 'one-too-many' }));
    assert.equal(full.statusCode, 409);
    assert.equal(full.json().code, 'day_full');
  });
});

describe('nutrition: offline replays and catch-up', () => {
  it('counts a repeated water event once, so a retried request is safe', async () => {
    const h = await setup();
    const a = await signUp(h, 'a@example.com');
    const add = (ml: number, id?: string) => call(h, a.token, 'POST', '/nutrition/water', { date: '2026-11-01', ml, ...(id && { id }) });
    assert.equal((await add(250, 'evt-1')).json().hydrationMl, 250);
    assert.equal((await add(250, 'evt-1')).json().hydrationMl, 250, 'same event id: applied once');
    assert.equal((await add(250, 'evt-2')).json().hydrationMl, 500);
    assert.equal((await add(100)).json().hydrationMl, 600, 'no id keeps the old behaviour');
    assert.equal((await add(100)).json().hydrationMl, 700);
    // Another user may reuse the same event id.
    const b = await signUp(h, 'b@example.com');
    const other = await call(h, b.token, 'POST', '/nutrition/water', { date: '2026-11-01', ml: 300, id: 'evt-1' });
    assert.equal(other.json().hydrationMl, 300);
  });

  it('returns every day with food or water in a date range, oldest first', async () => {
    const h = await setup();
    const a = await signUp(h, 'a@example.com');
    const b = await signUp(h, 'b@example.com');
    await call(h, a.token, 'POST', '/nutrition/foods', body.meal({ id: 'm1', date: '2026-10-30', loggedAt: NOW - 2 * 86_400_000 }));
    await call(h, a.token, 'POST', '/nutrition/foods', body.meal({ id: 'm2', date: '2026-11-01', loggedAt: NOW }));
    await call(h, a.token, 'POST', '/nutrition/water', { date: '2026-10-31', ml: 500 });
    await call(h, a.token, 'POST', '/nutrition/foods', body.meal({ id: 'old', date: '2026-08-01', loggedAt: 1 }));
    await call(h, b.token, 'POST', '/nutrition/foods', body.meal({ id: 'b1', date: '2026-11-01', loggedAt: NOW }));

    const res = await call(h, a.token, 'GET', '/nutrition/range?from=2026-10-30&to=2026-11-01');
    assert.equal(res.statusCode, 200);
    const days = res.json();
    assert.deepEqual(days.map((d: { dateKey: string }) => d.dateKey), ['2026-10-30', '2026-10-31', '2026-11-01']);
    assert.equal(days[0].meals[0].id, 'm1');
    assert.deepEqual([days[1].meals.length, days[1].hydrationMl], [0, 500]);
    assert.equal(days[2].meals.length, 1, "B's meal is not included");
  });

  it('validates the range', async () => {
    const h = await setup();
    const a = await signUp(h, 'a@example.com');
    const get = (q: string) => call(h, a.token, 'GET', `/nutrition/range${q}`);
    assert.equal((await get('')).statusCode, 400);
    assert.equal((await get('?from=2026-11-02&to=2026-11-01')).statusCode, 400);
    assert.equal((await get('?from=2026-01-01&to=2026-11-01')).statusCode, 400);
    assert.equal((await get('?from=2026-10-01&to=2026-11-01')).statusCode, 200);
  });
});

const routine = (id = 'r1', extra: object = {}) => ({
  id,
  name: 'Push A',
  exercises: [
    { exerciseId: 'bench-press', sets: 4 },
    { exerciseId: 'custom-e1', sets: 3 },
  ],
  createdAt: NOW,
  updatedAt: NOW,
  ...extra,
});

const customExercise = (id = 'custom-e1', extra: object = {}) => ({
  id,
  name: 'Landmine Press',
  muscleGroup: 'shoulders',
  muscles: 'Anterior Deltoid · Triceps',
  equipment: 'barbell',
  category: 'Shoulder Compound',
  repRange: [8, 12],
  incrementKg: 2.5,
  startKg: 20,
  ...extra,
});

describe('routines and custom exercises', () => {
  it('saves, lists (newest first), updates in place, and deletes routines', async () => {
    const h = await setup();
    const a = await signUp(h, 'a@example.com');
    assert.equal((await call(h, a.token, 'POST', '/routines', routine('r1', { updatedAt: NOW }))).statusCode, 201);
    await call(h, a.token, 'POST', '/routines', routine('r2', { name: 'Pull A', updatedAt: NOW + 1000 }));
    assert.deepEqual((await call(h, a.token, 'GET', '/routines')).json().map((r: { id: string }) => r.id), ['r2', 'r1']);
    // Same id again replaces it (idempotent retry or an edit).
    await call(h, a.token, 'POST', '/routines', routine('r1', { name: 'Push A v2', updatedAt: NOW + 2000 }));
    const list = (await call(h, a.token, 'GET', '/routines')).json();
    assert.equal(list.length, 2);
    assert.equal(list[0].name, 'Push A v2');
    assert.equal((await call(h, a.token, 'DELETE', '/routines/r1')).statusCode, 204);
    assert.equal((await call(h, a.token, 'DELETE', '/routines/r1')).statusCode, 204, 'deleting again is fine');
    assert.equal((await call(h, a.token, 'GET', '/routines')).json().length, 1);
  });

  it('validates routines', async () => {
    const h = await setup();
    const a = await signUp(h, 'a@example.com');
    const post = (b: unknown) => call(h, a.token, 'POST', '/routines', b);
    assert.equal((await post(routine('r1', { name: '  ' }))).statusCode, 400);
    assert.equal((await post(routine('r1', { exercises: [] }))).statusCode, 400);
    assert.equal((await post(routine('r1', { exercises: [{ exerciseId: 'x', sets: 0 }] }))).statusCode, 400);
    assert.equal((await post(routine('r1', { exercises: [{ exerciseId: 'x', sets: 11 }] }))).statusCode, 400);
    assert.equal((await post(routine('bad id!'))).statusCode, 400);
    assert.equal((await post(routine('r1', { userId: 'other' }))).statusCode, 400);
    const many = Array.from({ length: 31 }, (_, i) => ({ exerciseId: `e${i}`, sets: 3 }));
    assert.equal((await post(routine('r1', { exercises: many }))).statusCode, 400);
  });

  it('stops at 50 routines but still lets existing ones be edited', async () => {
    const h = await setup();
    const a = await signUp(h, 'a@example.com');
    for (let i = 0; i < 50; i++) await call(h, a.token, 'POST', '/routines', routine(`r${i}`));
    const over = await call(h, a.token, 'POST', '/routines', routine('one-too-many'));
    assert.equal(over.statusCode, 409);
    assert.equal(over.json().code, 'limit_reached');
    assert.equal((await call(h, a.token, 'POST', '/routines', routine('r0', { name: 'Edited' }))).statusCode, 201);
  });

  it('saves, validates and deletes custom exercises', async () => {
    const h = await setup();
    const a = await signUp(h, 'a@example.com');
    assert.equal((await call(h, a.token, 'POST', '/exercises/custom', customExercise())).statusCode, 201);
    assert.equal((await call(h, a.token, 'GET', '/exercises/custom')).json()[0].name, 'Landmine Press');
    const post = (b: unknown) => call(h, a.token, 'POST', '/exercises/custom', b);
    assert.equal((await post(customExercise('x1', { name: '' }))).statusCode, 400);
    assert.equal((await post(customExercise('x1', { muscleGroup: 'wings' }))).statusCode, 400);
    assert.equal((await post(customExercise('x1', { equipment: 'jetpack' }))).statusCode, 400);
    assert.equal((await post(customExercise('x1', { repRange: [12, 8] }))).statusCode, 400);
    assert.equal((await post(customExercise('x1', { startKg: -1 }))).statusCode, 400);
    assert.equal((await post(customExercise('x1', { video: { youtubeId: 'aaaaaaaaaaa', title: 'x' } }))).statusCode, 400);
    assert.equal((await call(h, a.token, 'DELETE', '/exercises/custom/custom-e1')).statusCode, 204);
    assert.deepEqual((await call(h, a.token, 'GET', '/exercises/custom')).json(), []);
  });

  it("never shows or changes another user's routines and exercises", async () => {
    const h = await setup();
    const a = await signUp(h, 'a@example.com');
    const b = await signUp(h, 'b@example.com');
    await call(h, b.token, 'POST', '/routines', routine('shared', { name: "B's routine" }));
    await call(h, b.token, 'POST', '/exercises/custom', customExercise('shared-ex', { name: "B's move" }));
    assert.deepEqual((await call(h, a.token, 'GET', '/routines')).json(), []);
    assert.deepEqual((await call(h, a.token, 'GET', '/exercises/custom')).json(), []);
    await call(h, a.token, 'DELETE', '/routines/shared');
    await call(h, a.token, 'DELETE', '/exercises/custom/shared-ex');
    assert.equal((await call(h, b.token, 'GET', '/routines')).json().length, 1);
    assert.equal((await call(h, b.token, 'GET', '/exercises/custom')).json().length, 1);
    // A reusing B's ids makes A's own copies.
    await call(h, a.token, 'POST', '/routines', routine('shared', { name: "A's routine" }));
    assert.equal((await call(h, b.token, 'GET', '/routines')).json()[0].name, "B's routine");
  });

  it('removes them with the account', async () => {
    const h = await setup();
    const a = await signUp(h, 'a@example.com');
    await call(h, a.token, 'POST', '/routines', routine());
    await call(h, a.token, 'POST', '/exercises/custom', customExercise());
    await h.db.run('DELETE FROM users WHERE id = ?', [a.id]);
    for (const table of ['routines', 'custom_exercises']) {
      assert.equal((await h.db.get<{ n: number }>(`SELECT COUNT(*) AS n FROM ${table}`))!.n, 0);
    }
  });
});

describe('per-user isolation', () => {
  it("user A can never read or modify user B's data", async () => {
    const h = await setup();
    const a = await signUp(h, 'a@example.com');
    const b = await signUp(h, 'b@example.com');

    await call(h, b.token, 'PUT', '/profile', body.profile);
    await call(h, b.token, 'POST', '/profile/weights', { id: 'bw', dateKey: '2026-10-30', kg: 61 });
    await call(h, b.token, 'POST', '/workouts', body.workout('shared-id'));
    await call(h, b.token, 'POST', '/activities', body.activity('shared-id'));
    await call(h, b.token, 'POST', '/nutrition/foods', body.meal({ id: 'shared-id', title: "B's lunch" }));
    await call(h, b.token, 'POST', '/nutrition/water', { date: '2026-11-01', ml: 500 });

    // A sees none of it.
    assert.equal((await call(h, a.token, 'GET', '/profile')).json().onboardingComplete, false);
    assert.deepEqual((await call(h, a.token, 'GET', '/workouts/history')).json(), []);
    assert.deepEqual((await call(h, a.token, 'GET', '/activities')).json(), []);
    assert.deepEqual((await call(h, a.token, 'GET', '/profile/weights')).json(), []);
    const day = (await call(h, a.token, 'GET', '/nutrition/daily?date=2026-11-01')).json();
    assert.deepEqual([day.meals, day.hydrationMl], [[], 0]);

    // A cannot delete B's meal by id.
    await call(h, a.token, 'DELETE', '/nutrition/foods/shared-id?date=2026-11-01');
    assert.equal((await call(h, b.token, 'GET', '/nutrition/daily?date=2026-11-01')).json().meals.length, 1);

    // Reusing B's ids creates A's own records and leaves B's untouched.
    await call(h, a.token, 'POST', '/workouts', { ...body.workout('shared-id'), title: "A's workout" });
    await call(h, a.token, 'POST', '/activities', { ...body.activity('shared-id'), title: "A's run" });
    await call(h, a.token, 'POST', '/nutrition/foods', body.meal({ id: 'shared-id', title: "A's lunch" }));
    assert.equal((await call(h, b.token, 'GET', '/workouts/history')).json()[0].title, 'Push day');
    assert.equal((await call(h, b.token, 'GET', '/activities')).json()[0].title, 'Morning run');
    assert.equal((await call(h, b.token, 'GET', '/nutrition/daily?date=2026-11-01')).json().meals[0].title, "B's lunch");
    assert.equal((await call(h, a.token, 'GET', '/nutrition/daily?date=2026-11-01')).json().meals[0].title, "A's lunch");

    // A's profile edits do not leak to B.
    await call(h, a.token, 'PATCH', '/profile', { goal: 'endurance' });
    assert.equal((await call(h, b.token, 'GET', '/profile')).json().profile.goal, 'fat_loss');
  });

  it('removes a user’s data when the account is deleted', async () => {
    const h = await setup();
    const a = await signUp(h, 'a@example.com');
    await call(h, a.token, 'POST', '/workouts', body.workout());
    await h.db.run('DELETE FROM users WHERE id = ?', [a.id]);
    assert.equal((await h.db.get<{ n: number }>('SELECT COUNT(*) AS n FROM workouts'))!.n, 0);
  });
});

describe('migrations', () => {
  it('keeps data across restarts and is safe to run again', async () => {
    const { mkdtempSync } = await import('node:fs');
    const { tmpdir } = await import('node:os');
    const { join } = await import('node:path');
    const path = join(mkdtempSync(join(tmpdir(), 'fitsphere-')), 'pglite');

    const first = await openDatabase({ path });
    await first.run('INSERT INTO users (id, email, name, password_hash, created_at) VALUES (?, ?, ?, ?, ?)', ['u1', 'old@example.com', 'Old User', 'x', 1_793_542_000_000]);
    await first.close();

    const second = await openDatabase({ path }); // runs the migration check again
    assert.equal((await second.get<{ n: number }>('SELECT COUNT(*) AS n FROM users'))!.n, 1);
    assert.equal((await second.get<{ n: number }>('SELECT COUNT(*) AS n FROM schema_migrations'))!.n, 6);
    // Timestamps are far beyond 32 bits and come back as plain numbers.
    assert.equal((await second.get<{ created_at: number }>('SELECT created_at FROM users'))!.created_at, 1_793_542_000_000);
    await second.close();
  });

  it('converts ? placeholders to $n', async () => {
    const { toPositional } = await import('../src/db.js');
    assert.equal(toPositional('SELECT * FROM t WHERE a = ? AND b = ? LIMIT ?'), 'SELECT * FROM t WHERE a = $1 AND b = $2 LIMIT $3');
  });
});
