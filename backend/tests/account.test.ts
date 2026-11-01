import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';

import type { FastifyInstance } from 'fastify';

import { buildApp } from '../src/app.js';
import { loadConfig } from '../src/config.js';
import { openDatabase } from '../src/db.js';
import { createFallbackMailer, createResendMailer, type Email, type Mailer } from '../src/mail/mailer.js';

const SECRET = 'test-secret-test-secret-test-secret-1234';
const NOW = Date.parse('2026-11-01T12:00:00Z');
const PASSWORD = 'Passw0rdOK';

class FakeMailer implements Mailer {
  sent: Email[] = [];
  fail = false;
  async send(email: Email) {
    if (this.fail) throw new Error('provider down');
    this.sent.push(email);
  }
  /** The 6-digit code from the most recent message to this address. */
  codeFor(to: string): string {
    const message = [...this.sent].reverse().find((m) => m.to === to && /\d{6}/.test(m.text));
    return /(\d{6})/.exec(message?.text ?? '')?.[1] ?? '';
  }
}

interface Harness {
  app: FastifyInstance;
  db: ReturnType<typeof openDatabase>;
  mail: FakeMailer;
  clock: { now: number };
}
const open: Harness[] = [];

async function setup(): Promise<Harness> {
  const db = openDatabase(':memory:');
  const mail = new FakeMailer();
  const clock = { now: NOW };
  const app = await buildApp({ config: loadConfig({ NODE_ENV: 'test', JWT_SECRET: SECRET }), db, now: () => clock.now, ai: null, mailer: mail });
  const h = { app, db, mail, clock };
  open.push(h);
  return h;
}

afterEach(async () => {
  for (const h of open.splice(0)) {
    await h.app.close();
    h.db.close();
  }
});

const post = (h: Harness, url: string, payload: unknown, token?: string) =>
  h.app.inject({ method: 'POST', url, payload: payload as object, headers: token ? { authorization: `Bearer ${token}` } : {} });

async function signUp(h: Harness, email: string) {
  const res = await post(h, '/auth/register', { name: 'Test User', email, password: PASSWORD });
  return { token: res.json().tokens.accessToken as string, refresh: res.json().tokens.refreshToken as string, id: res.json().user.id as string };
}

const count = (h: Harness, table: string, userId: string) =>
  (h.db.prepare(`SELECT COUNT(*) AS n FROM ${table} WHERE user_id = ?`).get(userId) as { n: number }).n;

describe('POST /auth/forgot-password', () => {
  it('emails a 6-digit code to a registered address', async () => {
    const h = await setup();
    await signUp(h, 'a@example.com');
    const res = await post(h, '/auth/forgot-password', { email: 'A@Example.com' });
    assert.equal(res.statusCode, 202);
    assert.equal(h.mail.sent.length, 1);
    assert.equal(h.mail.sent[0]!.to, 'a@example.com');
    assert.match(h.mail.sent[0]!.text, /\b\d{6}\b/);
  });

  it('answers identically and sends nothing for an unknown address', async () => {
    const h = await setup();
    await signUp(h, 'a@example.com');
    const known = await post(h, '/auth/forgot-password', { email: 'a@example.com' });
    const unknown = await post(h, '/auth/forgot-password', { email: 'nobody@example.com' });
    assert.equal(unknown.statusCode, known.statusCode);
    assert.deepEqual(unknown.json(), known.json());
    assert.equal(h.mail.sent.length, 1);
  });

  it('stores only a hash of the code', async () => {
    const h = await setup();
    const a = await signUp(h, 'a@example.com');
    await post(h, '/auth/forgot-password', { email: 'a@example.com' });
    const row = h.db.prepare('SELECT code_hash FROM password_resets WHERE user_id = ?').get(a.id) as { code_hash: string };
    assert.ok(!row.code_hash.includes(h.mail.codeFor('a@example.com')));
    assert.equal(row.code_hash.length, 64);
  });

  it('rejects malformed email and rate limits per address', async () => {
    const h = await setup();
    assert.equal((await post(h, '/auth/forgot-password', { email: 'not-an-email' })).statusCode, 400);
    for (let i = 0; i < 3; i++) assert.equal((await post(h, '/auth/forgot-password', { email: 'x@example.com' })).statusCode, 202);
    const blocked = await post(h, '/auth/forgot-password', { email: 'x@example.com' });
    assert.equal(blocked.statusCode, 429);
    assert.ok(Number(blocked.headers['retry-after']) > 0);
  });

  it('still answers 202 when the email provider fails', async () => {
    const h = await setup();
    await signUp(h, 'a@example.com');
    h.mail.fail = true;
    assert.equal((await post(h, '/auth/forgot-password', { email: 'a@example.com' })).statusCode, 202);
  });
});

describe('POST /auth/reset-password', () => {
  const reset = (h: Harness, code: string, password = 'NewPassw0rd', email = 'a@example.com') =>
    post(h, '/auth/reset-password', { email, code, password });

  it('changes the password with a valid code, signs out every session, and burns the code', async () => {
    const h = await setup();
    const a = await signUp(h, 'a@example.com');
    await post(h, '/auth/forgot-password', { email: 'a@example.com' });
    const code = h.mail.codeFor('a@example.com');

    assert.equal((await reset(h, code)).statusCode, 204);
    assert.equal((await post(h, '/auth/login', { email: 'a@example.com', password: PASSWORD })).statusCode, 401);
    assert.equal((await post(h, '/auth/login', { email: 'a@example.com', password: 'NewPassw0rd' })).statusCode, 200);
    // The old refresh token no longer works.
    assert.equal((await post(h, '/auth/refresh', { refreshToken: a.refresh })).statusCode, 401);
    // The code cannot be reused.
    assert.equal((await reset(h, code, 'Another1Pass')).statusCode, 400);
    // A "password changed" notice goes out.
    assert.match(h.mail.sent.at(-1)!.subject, /changed/i);
  });

  it('rejects a wrong code, and burns the code after five misses', async () => {
    const h = await setup();
    await signUp(h, 'a@example.com');
    await post(h, '/auth/forgot-password', { email: 'a@example.com' });
    const code = h.mail.codeFor('a@example.com');
    const wrong = code === '000000' ? '111111' : '000000';

    const first = await reset(h, wrong);
    assert.equal(first.statusCode, 400);
    assert.equal(first.json().code, 'invalid_code');
    for (let i = 0; i < 4; i++) await reset(h, wrong);
    // The code itself is gone, independent of the client-side lockout.
    assert.equal(h.db.prepare('SELECT COUNT(*) AS n FROM password_resets').get()?.n, 0);
    h.clock.now += 16 * 60_000; // past the lockout window, so only the burned code can fail
    assert.equal((await reset(h, code)).statusCode, 400);
    assert.equal((await post(h, '/auth/login', { email: 'a@example.com', password: PASSWORD })).statusCode, 200);
  });

  it('expires codes after 15 minutes', async () => {
    const h = await setup();
    await signUp(h, 'a@example.com');
    await post(h, '/auth/forgot-password', { email: 'a@example.com' });
    const code = h.mail.codeFor('a@example.com');
    h.clock.now += 16 * 60_000;
    assert.equal((await reset(h, code)).statusCode, 400);
  });

  it('uses the newest code when one is requested again', async () => {
    const h = await setup();
    await signUp(h, 'a@example.com');
    await post(h, '/auth/forgot-password', { email: 'a@example.com' });
    const first = h.mail.codeFor('a@example.com');
    await post(h, '/auth/forgot-password', { email: 'a@example.com' });
    const second = h.mail.codeFor('a@example.com');
    if (first !== second) assert.equal((await reset(h, first)).statusCode, 400);
    assert.equal((await reset(h, second)).statusCode, 204);
  });

  it('does not accept one account’s code for another', async () => {
    const h = await setup();
    await signUp(h, 'a@example.com');
    await signUp(h, 'b@example.com');
    await post(h, '/auth/forgot-password', { email: 'a@example.com' });
    const code = h.mail.codeFor('a@example.com');
    assert.equal((await reset(h, code, 'NewPassw0rd', 'b@example.com')).statusCode, 400);
    assert.equal((await post(h, '/auth/login', { email: 'b@example.com', password: PASSWORD })).statusCode, 200);
  });

  it('gives the same error for an unknown account and validates the new password', async () => {
    const h = await setup();
    await signUp(h, 'a@example.com');
    assert.equal((await reset(h, '123456', 'NewPassw0rd', 'ghost@example.com')).json().code, 'invalid_code');
    await post(h, '/auth/forgot-password', { email: 'a@example.com' });
    const code = h.mail.codeFor('a@example.com');
    const weak = await reset(h, code, 'short');
    assert.equal(weak.statusCode, 400);
    assert.ok(weak.json().fieldErrors.password);
    assert.equal((await reset(h, 'abc', 'NewPassw0rd')).statusCode, 400);
    // A weak password does not consume the code.
    assert.equal((await reset(h, code)).statusCode, 204);
  });

  it('rate limits repeated failures from one client', async () => {
    const h = await setup();
    await signUp(h, 'a@example.com');
    for (let i = 0; i < 5; i++) await reset(h, '000000');
    const blocked = await reset(h, '000000');
    assert.equal(blocked.statusCode, 429);
  });
});

describe('POST /auth/delete-account', () => {
  async function populate(h: Harness, token: string) {
    const auth = { authorization: `Bearer ${token}` };
    const inject = (method: 'POST' | 'PUT', url: string, payload: object) => h.app.inject({ method, url, payload, headers: auth });
    await inject('PUT', '/profile', { goal: 'muscle', sex: 'male', heightCm: 175, weightKg: 70, targetKg: 72, experience: 'beginner', daysPerWeek: 3 });
    await inject('POST', '/profile/weights', { kg: 70 });
    await inject('POST', '/nutrition/water', { date: '2026-11-01', ml: 250 });
    await inject('POST', '/nutrition/foods', { date: '2026-11-01', category: 'lunch', title: 'Bowl', kcal: 500, protein: 30, carbs: 50, fat: 15 });
    await inject('POST', '/coach/messages', { text: 'hello' });
  }

  it('requires a signed-in user', async () => {
    const h = await setup();
    assert.equal((await post(h, '/auth/delete-account', { password: PASSWORD })).statusCode, 401);
  });

  it('refuses a wrong password with 403 (not 401) and keeps everything', async () => {
    const h = await setup();
    const a = await signUp(h, 'a@example.com');
    await populate(h, a.token);
    const res = await post(h, '/auth/delete-account', { password: 'WrongPass1' }, a.token);
    assert.equal(res.statusCode, 403);
    assert.equal(res.json().code, 'invalid_credentials');
    assert.equal(count(h, 'profiles', a.id), 1);
    assert.equal((await post(h, '/auth/login', { email: 'a@example.com', password: PASSWORD })).statusCode, 200);
  });

  it('erases the account and all its data, and invalidates its tokens', async () => {
    const h = await setup();
    const a = await signUp(h, 'a@example.com');
    const b = await signUp(h, 'b@example.com');
    await populate(h, a.token);
    await populate(h, b.token);
    await post(h, '/auth/forgot-password', { email: 'a@example.com' });

    const res = await post(h, '/auth/delete-account', { password: PASSWORD }, a.token);
    assert.equal(res.statusCode, 204);
    for (const table of ['users', 'profiles', 'weights', 'nutrition_foods', 'nutrition_water', 'coach_messages', 'refresh_tokens', 'password_resets']) {
      const column = table === 'users' ? 'id' : 'user_id';
      const n = (h.db.prepare(`SELECT COUNT(*) AS n FROM ${table} WHERE ${column} = ?`).get(a.id) as { n: number }).n;
      assert.equal(n, 0, `${table} still has rows for the deleted user`);
    }
    assert.equal((await post(h, '/auth/login', { email: 'a@example.com', password: PASSWORD })).statusCode, 401);
    assert.equal((await h.app.inject({ method: 'GET', url: '/profile', headers: { authorization: `Bearer ${a.token}` } })).statusCode, 401);
    assert.equal((await post(h, '/auth/refresh', { refreshToken: a.refresh })).statusCode, 401);
    // The email can be registered again, and the other user is untouched.
    assert.equal((await post(h, '/auth/register', { name: 'New A', email: 'a@example.com', password: PASSWORD })).statusCode, 201);
    assert.equal(count(h, 'profiles', b.id), 1);
    assert.equal(count(h, 'coach_messages', b.id), 2);
  });

  it('rate limits wrong-password attempts', async () => {
    const h = await setup();
    const a = await signUp(h, 'a@example.com');
    for (let i = 0; i < 5; i++) await post(h, '/auth/delete-account', { password: 'WrongPass1' }, a.token);
    assert.equal((await post(h, '/auth/delete-account', { password: PASSWORD }, a.token)).statusCode, 429);
  });
});

describe('mailers', () => {
  it('Resend mailer posts the documented request and hides provider details on failure', async () => {
    const calls: { url: string; init: RequestInit }[] = [];
    const original = globalThis.fetch;
    globalThis.fetch = (async (url: string, init: RequestInit) => {
      calls.push({ url, init });
      return new Response('{"message":"secret detail for a@example.com 123456"}', { status: calls.length === 1 ? 200 : 422 });
    }) as typeof fetch;
    try {
      const mailer = createResendMailer({ apiKey: 're_test', from: 'FitSphere <no-reply@example.com>' });
      await mailer.send({ to: 'a@example.com', subject: 'Hi', text: 'Code 123456' });
      assert.equal(calls[0]!.url, 'https://api.resend.com/emails');
      assert.equal((calls[0]!.init.headers as Record<string, string>).Authorization, 'Bearer re_test');
      assert.deepEqual(JSON.parse(calls[0]!.init.body as string), {
        from: 'FitSphere <no-reply@example.com>',
        to: ['a@example.com'],
        subject: 'Hi',
        text: 'Code 123456',
      });
      await assert.rejects(mailer.send({ to: 'a@example.com', subject: 'Hi', text: 'Code 123456' }), (e: Error) => /422/.test(e.message) && !/123456|a@example/.test(e.message));
    } finally {
      globalThis.fetch = original;
    }
  });

  it('fallback mailer prints the message only in development', async () => {
    const lines: string[] = [];
    const message = { to: 'a@example.com', subject: 'Code', text: 'Your code is 123456' };
    await createFallbackMailer({ development: true, log: (l) => lines.push(l) }).send(message);
    assert.match(lines[0]!, /123456/);
    lines.length = 0;
    await createFallbackMailer({ development: false, log: (l) => lines.push(l) }).send(message);
    assert.match(lines[0]!, /not configured/);
    assert.doesNotMatch(lines[0]!, /123456|a@example/);
  });
});
