import assert from 'node:assert/strict';
import { createServer } from 'node:net';
import { describe, it } from 'node:test';

import { PGlite } from '@electric-sql/pglite';
import { PGLiteSocketServer } from '@electric-sql/pglite-socket';

import { buildApp } from '../src/app.js';
import { loadConfig } from '../src/config.js';
import { openDatabase } from '../src/db.js';

/**
 * Production talks to Postgres through the `pg` driver; the other tests use PGlite directly. This serves
 * PGlite over the real Postgres wire protocol so the `pg` code path (placeholders, bigint parsing,
 * pooled transactions) is exercised too, with no external database.
 */
const freePort = () =>
  new Promise<number>((resolve, reject) => {
    const probe = createServer();
    probe.once('error', reject);
    probe.listen(0, '127.0.0.1', () => {
      const { port } = probe.address() as { port: number };
      probe.close(() => resolve(port));
    });
  });

describe('pg driver against a Postgres server', () => {
  it('migrates, serves the API, keeps bigints numeric, and rolls back failed transactions', async () => {
    const lite = new PGlite();
    await lite.waitReady;
    const port = await freePort();
    const server = new PGLiteSocketServer({ db: lite, port, host: '127.0.0.1' });
    await server.start();
    const db = await openDatabase({ url: `postgresql://postgres:postgres@127.0.0.1:${port}/postgres?sslmode=disable` });
    const app = await buildApp({
      config: loadConfig({ NODE_ENV: 'test', JWT_SECRET: 'test-secret-test-secret-test-secret-1234' }),
      db,
      ai: null,
    });
    try {
      const signUp = await app.inject({
        method: 'POST',
        url: '/auth/register',
        payload: { name: 'Pg User', email: 'pg@example.com', password: 'Passw0rdOK' },
      });
      assert.equal(signUp.statusCode, 201);
      const auth = { authorization: `Bearer ${signUp.json().tokens.accessToken}` };

      const profile = await app.inject({
        method: 'PUT',
        url: '/profile',
        headers: auth,
        payload: { goal: 'muscle', sex: 'male', heightCm: 175, weightKg: 72.5, targetKg: 75, experience: 'beginner', daysPerWeek: 3 },
      });
      assert.equal(profile.statusCode, 200);
      assert.equal(typeof profile.json().updatedAt, 'number');
      assert.equal(profile.json().onboardingComplete, true);

      const workout = {
        id: 'w1',
        planId: null,
        title: 'Push',
        startedAt: 1_793_542_000_000,
        endedAt: 1_793_545_600_000,
        durationSec: 3600,
        volumeKg: 1000,
        setsCompleted: 3,
        prCount: 0,
        kcal: 300,
        exercises: [],
        source: 'user',
      };
      assert.equal((await app.inject({ method: 'POST', url: '/workouts', headers: auth, payload: workout })).statusCode, 201);
      assert.deepEqual((await app.inject({ method: 'GET', url: '/workouts/history', headers: auth })).json(), [workout]);

      await app.inject({ method: 'POST', url: '/nutrition/water', headers: auth, payload: { date: '2026-11-01', ml: 500 } });
      const day = (
        await app.inject({ method: 'POST', url: '/nutrition/water', headers: auth, payload: { date: '2026-11-01', ml: 250 } })
      ).json();
      assert.equal(day.hydrationMl, 750);

      const weights = (await app.inject({ method: 'GET', url: '/profile/weights', headers: auth })).json();
      assert.equal(weights[0].kg, 72.5); // the profile weight became a weigh-in

      const count = async () => (await db.get<{ n: number }>('SELECT COUNT(*) AS n FROM users'))!.n;
      const before = await count();
      await assert.rejects(
        db.transaction(async (tx) => {
          await tx.run('DELETE FROM users');
          throw new Error('abort');
        }),
        /abort/,
      );
      assert.equal(await count(), before);
      assert.equal(typeof before, 'number');
    } finally {
      await app.close();
      await db.close();
      await server.stop();
      await lite.close();
    }
  });
});
