import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';

import type { FastifyInstance } from 'fastify';

import { buildApp } from '../src/app.js';
import { loadConfig } from '../src/config.js';
import type { Db } from '../src/db.js';
import { testDb } from './helpers.js';

const SECRET = 'test-secret-test-secret-test-secret-1234';
const open: { app: FastifyInstance }[] = [];

async function setup(env: Record<string, string> = {}) {
  const db = await testDb();
  const app = await buildApp({ config: loadConfig({ NODE_ENV: 'test', JWT_SECRET: SECRET, ...env }), db, ai: null });
  open.push({ app });
  return app;
}

afterEach(async () => {
  for (const h of open.splice(0)) {
    await h.app.close();
  }
});

const badLogin = (app: FastifyInstance, ip: string) =>
  app.inject({
    method: 'POST',
    url: '/auth/login',
    payload: { email: 'victim@example.com', password: 'wrong-password' },
    headers: { 'x-forwarded-for': ip },
  });

describe('behind a reverse proxy', () => {
  it('defaults to ignoring X-Forwarded-For, so a client cannot dodge the lockout by spoofing it', async () => {
    const app = await setup();
    for (let i = 0; i < 5; i++) await badLogin(app, `10.0.0.${i}`);
    assert.equal((await badLogin(app, '10.9.9.9')).statusCode, 429);
  });

  it('with TRUST_PROXY=true, limits each real client separately instead of lumping everyone together', async () => {
    const app = await setup({ TRUST_PROXY: 'true' });
    for (let i = 0; i < 5; i++) await badLogin(app, '203.0.113.7');
    assert.equal((await badLogin(app, '203.0.113.7')).statusCode, 429);
    assert.equal((await badLogin(app, '198.51.100.9')).statusCode, 401);
  });

  it('parses TRUST_PROXY and defaults it to off', () => {
    assert.equal(loadConfig({ JWT_SECRET: SECRET }).TRUST_PROXY, false);
    assert.equal(loadConfig({ JWT_SECRET: SECRET, TRUST_PROXY: 'true' }).TRUST_PROXY, true);
    assert.throws(() => loadConfig({ JWT_SECRET: SECRET, TRUST_PROXY: 'yes' }), /TRUST_PROXY/);
  });
});

describe('API hygiene', () => {
  it('answers unknown routes with a JSON 404 and never caches or sniffs responses', async () => {
    const app = await setup();
    const res = await app.inject({ method: 'GET', url: '/does-not-exist' });
    assert.equal(res.statusCode, 404);
    assert.deepEqual(res.json(), { message: 'Not found.', code: 'not_found' });
    assert.equal(res.headers['cache-control'], 'no-store');
    assert.equal(res.headers['x-content-type-options'], 'nosniff');
    assert.equal(res.headers['referrer-policy'], 'no-referrer');
    assert.equal(res.headers['strict-transport-security'], undefined, 'only in production');
  });

  it('adds HSTS in production', async () => {
    const db = await testDb();
    const app = await buildApp({
      config: loadConfig({ NODE_ENV: 'production', JWT_SECRET: SECRET, DATABASE_URL: 'postgres://unused' }),
      db,
      ai: null,
    });
    open.push({ app });
    const res = await app.inject({ method: 'GET', url: '/health' });
    assert.match(String(res.headers['strict-transport-security']), /max-age=31536000/);
  });

  it('limits how fast one client can call the API, but not health checks or other clients', async () => {
    const app = await setup({ RATE_LIMIT_PER_MIN: '5' });
    const hit = (ip: string) =>
      app.inject({ method: 'GET', url: '/profile', headers: { 'x-forwarded-for': ip } });
    // trustProxy is off in tests, so every request comes from the same address.
    for (let i = 0; i < 5; i++) assert.equal((await hit('1.1.1.1')).statusCode, 401);
    const blocked = await hit('1.1.1.1');
    assert.equal(blocked.statusCode, 429);
    assert.equal(blocked.json().code, 'rate_limited');
    assert.ok(Number(blocked.headers['retry-after']) > 0);
    assert.equal((await app.inject({ method: 'GET', url: '/health' })).statusCode, 200);
  });

  it('limits each real client separately behind a trusted proxy', async () => {
    const app = await setup({ RATE_LIMIT_PER_MIN: '3', TRUST_PROXY: 'true' });
    const hit = (ip: string) =>
      app.inject({ method: 'GET', url: '/profile', headers: { 'x-forwarded-for': ip } });
    for (let i = 0; i < 3; i++) await hit('2.2.2.2');
    assert.equal((await hit('2.2.2.2')).statusCode, 429);
    assert.equal((await hit('3.3.3.3')).statusCode, 401);
  });
});

describe('food search proxy', () => {
  it('requires a signed-in user', async () => {
    const app = await setup();
    const res = await app.inject({ method: 'GET', url: '/foods/search?q=yogurt' });
    assert.equal(res.statusCode, 401);
  });
});
