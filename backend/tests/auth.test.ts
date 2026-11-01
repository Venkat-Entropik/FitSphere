import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';

import type { FastifyInstance } from 'fastify';
import { SignJWT } from 'jose';

import { buildApp } from '../src/app.js';
import { hashPassword, verifyPassword } from '../src/auth/passwords.js';
import { createLoginLimiter } from '../src/auth/rate-limit.js';
import { loadConfig, type Config } from '../src/config.js';
import { openDatabase } from '../src/db.js';

const SECRET = 'test-secret-test-secret-test-secret-1234';
const ok = { name: 'Alex Chen', email: 'alex@example.com', password: 'Passw0rdOK' };

interface Harness {
  app: FastifyInstance;
  db: ReturnType<typeof openDatabase>;
  clock: { now: number };
}

const open: Harness[] = [];

async function setup(overrides: Partial<Record<string, string>> = {}): Promise<Harness> {
  const config: Config = loadConfig({ NODE_ENV: 'test', JWT_SECRET: SECRET, ...overrides });
  const db = openDatabase(':memory:');
  const clock = { now: Date.parse('2026-11-01T12:00:00Z') };
  const app = await buildApp({ config, db, now: () => clock.now });
  const harness = { app, db, clock };
  open.push(harness);
  return harness;
}

afterEach(async () => {
  for (const h of open.splice(0)) {
    await h.app.close();
    h.db.close();
  }
});

const post = (h: Harness, url: string, payload: unknown, headers: Record<string, string> = {}) =>
  h.app.inject({ method: 'POST', url, payload: payload as object, headers });

const register = (h: Harness, body: Partial<typeof ok> = {}) => post(h, '/auth/register', { ...ok, ...body });
const login = (h: Harness, body: object = { email: ok.email, password: ok.password }) => post(h, '/auth/login', body);

describe('config', () => {
  it('requires a strong JWT secret', () => {
    assert.throws(() => loadConfig({}), /JWT_SECRET/);
    assert.throws(() => loadConfig({ JWT_SECRET: 'short' }), /at least 32/);
    assert.equal(loadConfig({ JWT_SECRET: SECRET }).PORT, 3000);
  });
});

describe('POST /auth/register', () => {
  it('creates an account and returns a session', async () => {
    const h = await setup();
    const res = await register(h);
    assert.equal(res.statusCode, 201);
    const body = res.json();
    assert.deepEqual(body.user, { id: body.user.id, name: 'Alex Chen', email: 'alex@example.com' });
    assert.ok(body.tokens.accessToken.split('.').length === 3);
    assert.ok(body.tokens.refreshToken.length >= 40);
    assert.equal(body.tokens.expiresIn, 900);
    assert.equal(body.user.passwordHash, undefined);
  });

  it('stores a salted hash, never the password or the raw refresh token', async () => {
    const h = await setup();
    const { tokens } = (await register(h)).json();
    const row = h.db.prepare('SELECT password_hash FROM users').get() as { password_hash: string };
    assert.match(row.password_hash, /^scrypt\$16384\$8\$1\$/);
    assert.ok(!row.password_hash.includes(ok.password));
    const refresh = h.db.prepare('SELECT token_hash FROM refresh_tokens').get() as { token_hash: string };
    assert.notEqual(refresh.token_hash, tokens.refreshToken);
    assert.equal(refresh.token_hash.length, 64);
  });

  it('normalises the email and trims the name', async () => {
    const h = await setup();
    const res = await register(h, { email: '  Alex@Example.COM ', name: '  Alex Chen  ' });
    assert.equal(res.json().user.email, 'alex@example.com');
    assert.equal(res.json().user.name, 'Alex Chen');
  });

  it('rejects duplicate emails regardless of case', async () => {
    const h = await setup();
    assert.equal((await register(h)).statusCode, 201);
    const dup = await register(h, { email: 'ALEX@example.com' });
    assert.equal(dup.statusCode, 409);
    assert.equal(dup.json().code, 'email_taken');
    assert.ok(dup.json().fieldErrors.email);
  });

  it('validates every field and reports them per field', async () => {
    const h = await setup();
    const res = await post(h, '/auth/register', { name: 'A', email: 'nope', password: 'short' });
    assert.equal(res.statusCode, 400);
    const { fieldErrors, code } = res.json();
    assert.equal(code, 'validation_error');
    assert.ok(fieldErrors.name && fieldErrors.email && fieldErrors.password);
    for (const bad of ['alllettersnodigits', '12345678', 'a1'.repeat(70)]) {
      assert.equal((await register(h, { password: bad })).statusCode, 400, bad.slice(0, 12));
    }
  });

  it('rejects missing or non-object bodies without crashing', async () => {
    const h = await setup();
    assert.equal((await post(h, '/auth/register', undefined)).statusCode, 400);
    assert.equal((await post(h, '/auth/register', 'text')).statusCode, 415); // not JSON
    assert.equal((await post(h, '/auth/register', [])).statusCode, 400);
  });
});

describe('POST /auth/login', () => {
  it('signs in with the right password (email case-insensitive)', async () => {
    const h = await setup();
    await register(h);
    const res = await login(h, { email: 'ALEX@example.com', password: ok.password });
    assert.equal(res.statusCode, 200);
    assert.equal(res.json().user.name, 'Alex Chen');
    assert.ok(res.json().tokens.accessToken);
  });

  it('gives the same generic error for a wrong password and an unknown email', async () => {
    const h = await setup();
    await register(h);
    const wrong = await login(h, { email: ok.email, password: 'WrongPass1' });
    const unknown = await login(h, { email: 'ghost@example.com', password: 'WrongPass1' });
    assert.equal(wrong.statusCode, 401);
    assert.equal(unknown.statusCode, 401);
    assert.deepEqual(wrong.json(), unknown.json());
    assert.equal(wrong.json().message, 'Invalid email or password.');
  });

  it('validates the body', async () => {
    const h = await setup();
    assert.equal((await login(h, { email: 'bad', password: '' })).statusCode, 400);
  });

  it('locks out after repeated failures, then recovers when the window passes', async () => {
    const h = await setup({ LOGIN_MAX_ATTEMPTS: '3', LOGIN_WINDOW_SEC: '600' });
    await register(h);
    for (let i = 0; i < 3; i++) {
      assert.equal((await login(h, { email: ok.email, password: 'WrongPass1' })).statusCode, 401);
    }
    const blocked = await login(h, { email: ok.email, password: ok.password });
    assert.equal(blocked.statusCode, 429);
    assert.equal(blocked.json().code, 'rate_limited');
    assert.ok(Number(blocked.headers['retry-after']) > 0);

    h.clock.now += 601_000;
    assert.equal((await login(h)).statusCode, 200);
  });

  it('a successful sign-in clears the failure count', async () => {
    const h = await setup({ LOGIN_MAX_ATTEMPTS: '3' });
    await register(h);
    for (let i = 0; i < 2; i++) await login(h, { email: ok.email, password: 'WrongPass1' });
    assert.equal((await login(h)).statusCode, 200);
    for (let i = 0; i < 2; i++) assert.equal((await login(h, { email: ok.email, password: 'WrongPass1' })).statusCode, 401);
  });
});

describe('GET /auth/me and token validation', () => {
  it('returns the signed-in user for a valid access token', async () => {
    const h = await setup();
    const { tokens } = (await register(h)).json();
    const res = await h.app.inject({ method: 'GET', url: '/auth/me', headers: { authorization: `Bearer ${tokens.accessToken}` } });
    assert.equal(res.statusCode, 200);
    assert.equal(res.json().user.email, 'alex@example.com');
  });

  it('rejects missing, malformed, wrongly signed and expired tokens', async () => {
    const h = await setup();
    const { user } = (await register(h)).json();
    const get = (authorization?: string) =>
      h.app.inject({ method: 'GET', url: '/auth/me', headers: authorization ? { authorization } : {} });

    assert.equal((await get()).statusCode, 401);
    assert.equal((await get('Bearer garbage')).statusCode, 401);
    assert.equal((await get('Basic abc')).statusCode, 401);

    const sign = (secret: string, expires: string | number) =>
      new SignJWT({}).setProtectedHeader({ alg: 'HS256' }).setSubject(user.id).setIssuer('fitsphere').setAudience('fitsphere-app').setIssuedAt().setExpirationTime(expires).sign(new TextEncoder().encode(secret));
    assert.equal((await get(`Bearer ${await sign('x'.repeat(40), '5m')}`)).statusCode, 401, 'wrong secret');
    assert.equal((await get(`Bearer ${await sign(SECRET, Math.floor(Date.now() / 1000) - 60)}`)).statusCode, 401, 'expired');
    assert.equal((await get(`Bearer ${await sign(SECRET, '5m')}`)).statusCode, 200, 'control: valid');
  });

  it('rejects a valid token whose user no longer exists', async () => {
    const h = await setup();
    const { tokens } = (await register(h)).json();
    h.db.exec('DELETE FROM users');
    const res = await h.app.inject({ method: 'GET', url: '/auth/me', headers: { authorization: `Bearer ${tokens.accessToken}` } });
    assert.equal(res.statusCode, 401);
  });
});

describe('POST /auth/refresh', () => {
  it('rotates: returns new tokens and retires the old refresh token', async () => {
    const h = await setup();
    const { tokens } = (await register(h)).json();
    const res = await post(h, '/auth/refresh', { refreshToken: tokens.refreshToken });
    assert.equal(res.statusCode, 200);
    const next = res.json().tokens;
    assert.notEqual(next.refreshToken, tokens.refreshToken);
    const me = await h.app.inject({ method: 'GET', url: '/auth/me', headers: { authorization: `Bearer ${next.accessToken}` } });
    assert.equal(me.statusCode, 200);
    assert.equal((await post(h, '/auth/refresh', { refreshToken: next.refreshToken })).statusCode, 200);
  });

  it('treats replay of a used refresh token as theft and ends every session', async () => {
    const h = await setup();
    const { tokens } = (await register(h)).json();
    const rotated = (await post(h, '/auth/refresh', { refreshToken: tokens.refreshToken })).json().tokens;

    const replay = await post(h, '/auth/refresh', { refreshToken: tokens.refreshToken });
    assert.equal(replay.statusCode, 401);
    // The legitimate, newer token is dead too.
    assert.equal((await post(h, '/auth/refresh', { refreshToken: rotated.refreshToken })).statusCode, 401);
  });

  it('rejects unknown, malformed and expired refresh tokens', async () => {
    const h = await setup({ REFRESH_TOKEN_TTL_DAYS: '1' });
    const { tokens } = (await register(h)).json();
    assert.equal((await post(h, '/auth/refresh', { refreshToken: 'x'.repeat(43) })).statusCode, 401);
    assert.equal((await post(h, '/auth/refresh', { refreshToken: 'short' })).statusCode, 401);
    assert.equal((await post(h, '/auth/refresh', {})).statusCode, 401);

    h.clock.now += 2 * 86_400_000;
    assert.equal((await post(h, '/auth/refresh', { refreshToken: tokens.refreshToken })).statusCode, 401);
  });
});

describe('POST /auth/logout', () => {
  it('revokes the refresh token and always answers 204', async () => {
    const h = await setup();
    const { tokens } = (await register(h)).json();
    assert.equal((await post(h, '/auth/logout', { refreshToken: tokens.refreshToken })).statusCode, 204);
    assert.equal((await post(h, '/auth/refresh', { refreshToken: tokens.refreshToken })).statusCode, 401);
    assert.equal((await post(h, '/auth/logout', { refreshToken: tokens.refreshToken })).statusCode, 204);
    assert.equal((await post(h, '/auth/logout', {})).statusCode, 204);
  });

  it("only signs out that device: other sessions keep working", async () => {
    const h = await setup();
    await register(h);
    const phone = (await login(h)).json().tokens;
    const tablet = (await login(h)).json().tokens;
    await post(h, '/auth/logout', { refreshToken: phone.refreshToken });
    assert.equal((await post(h, '/auth/refresh', { refreshToken: tablet.refreshToken })).statusCode, 200);
  });
});

describe('passwords and limiter units', () => {
  it('hashes with a fresh salt each time and verifies correctly', async () => {
    const a = await hashPassword('Secret123');
    const b = await hashPassword('Secret123');
    assert.notEqual(a, b);
    assert.ok(await verifyPassword('Secret123', a));
    assert.ok(!(await verifyPassword('secret123', a)));
    assert.ok(!(await verifyPassword('Secret123', 'not-a-hash')));
    assert.ok(!(await verifyPassword('Secret123', 'scrypt$1$1$1$AA$AA')));
    assert.ok(!(await verifyPassword('Secret123', 'scrypt$1048576$32$16$AA$AA'.replace('1048576', '99999999'))));
  });

  it('limiter counts failures per key within a window', () => {
    const limiter = createLoginLimiter(2, 60);
    limiter.recordFailure('a', 0);
    assert.equal(limiter.retryAfterSec('a', 1000), 0);
    limiter.recordFailure('a', 1000);
    assert.equal(limiter.retryAfterSec('a', 2000), 58);
    assert.equal(limiter.retryAfterSec('b', 2000), 0);
    assert.equal(limiter.retryAfterSec('a', 61_000), 0);
    limiter.recordFailure('a', 62_000);
    limiter.reset('a');
    assert.equal(limiter.retryAfterSec('a', 62_001), 0);
  });
});

describe('GET /health and error handling', () => {
  it('reports ok and hides internals on server errors', async () => {
    const h = await setup();
    assert.deepEqual((await h.app.inject({ method: 'GET', url: '/health' })).json(), { status: 'ok' });
    h.db.exec('DROP TABLE users');
    const res = await register(h);
    assert.equal(res.statusCode, 500);
    assert.equal(res.json().code, 'internal_error');
    assert.ok(!/users|sqlite|SQL/i.test(res.body));
  });
});
