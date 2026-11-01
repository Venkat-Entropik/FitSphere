import { randomBytes, scrypt, timingSafeEqual, type ScryptOptions } from 'node:crypto';

const KEY_LENGTH = 64;
const PARAMS = { N: 16384, r: 8, p: 1 } as const;

function derive(password: string, salt: Buffer, options: ScryptOptions): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, KEY_LENGTH, options, (error, key) => (error ? reject(error) : resolve(key)));
  });
}

/** Self-describing hash: `scrypt$N$r$p$salt$hash` (base64), so parameters can change over time. */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await derive(password, salt, PARAMS);
  return ['scrypt', PARAMS.N, PARAMS.r, PARAMS.p, salt.toString('base64'), key.toString('base64')].join('$');
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [scheme, n, r, p, salt, hash] = stored.split('$');
  if (scheme !== 'scrypt' || !n || !r || !p || !salt || !hash) return false;
  const params = { N: Number(n), r: Number(r), p: Number(p) };
  // Fail closed on corrupt or absurd parameters instead of throwing (or burning CPU).
  if (!Number.isInteger(params.N) || params.N < 2 || params.N > 1 << 20 || (params.N & (params.N - 1)) !== 0) return false;
  if (!Number.isInteger(params.r) || params.r < 1 || params.r > 32 || !Number.isInteger(params.p) || params.p < 1 || params.p > 16) return false;
  try {
    const expected = Buffer.from(hash, 'base64');
    const actual = await derive(password, Buffer.from(salt, 'base64'), params);
    return expected.length === actual.length && timingSafeEqual(expected, actual);
  } catch {
    return false;
  }
}

let decoy: Promise<string> | null = null;

/**
 * Burns the same time as a real check when the account doesn't exist, so response timing
 * doesn't reveal which emails are registered.
 */
export async function verifyAgainstDecoy(password: string): Promise<false> {
  decoy ??= hashPassword('decoy-password-for-timing');
  await verifyPassword(password, await decoy);
  return false;
}
