import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';

import type { FastifyInstance } from 'fastify';

import { buildApp } from '../src/app.js';
import { loadConfig } from '../src/config.js';
import { openDatabase } from '../src/db.js';

const SECRET = 'test-secret-test-secret-test-secret-1234';
const open: { app: FastifyInstance; db: ReturnType<typeof openDatabase> }[] = [];

async function setup(env: Record<string, string> = {}) {
  const db = openDatabase(':memory:');
  const app = await buildApp({ config: loadConfig({ NODE_ENV: 'test', JWT_SECRET: SECRET, ...env }), db, ai: null });
  open.push({ app, db });
  return app;
}

afterEach(async () => {
  for (const h of open.splice(0)) {
    await h.app.close();
    h.db.close();
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
