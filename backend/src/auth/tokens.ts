import { createHash, randomBytes } from 'node:crypto';

import { jwtVerify, SignJWT } from 'jose';

const ISSUER = 'fitsphere';
const AUDIENCE = 'fitsphere-app';

export interface TokenService {
  signAccessToken(userId: string): Promise<string>;
  /** Returns the user id for a valid, unexpired access token, otherwise null. */
  verifyAccessToken(token: string): Promise<string | null>;
  accessTtlSec: number;
}

export function createTokenService(secret: string, accessTtlSec: number): TokenService {
  const key = new TextEncoder().encode(secret);
  return {
    accessTtlSec,
    signAccessToken: (userId) =>
      new SignJWT({})
        .setProtectedHeader({ alg: 'HS256' })
        .setSubject(userId)
        .setIssuer(ISSUER)
        .setAudience(AUDIENCE)
        .setIssuedAt()
        .setExpirationTime(`${accessTtlSec}s`)
        .sign(key),
    verifyAccessToken: async (token) => {
      try {
        const { payload } = await jwtVerify(token, key, {
          issuer: ISSUER,
          audience: AUDIENCE,
          algorithms: ['HS256'],
        });
        return typeof payload.sub === 'string' ? payload.sub : null;
      } catch {
        return null;
      }
    },
  };
}

/** Refresh tokens are opaque random strings; only their SHA-256 hash is stored. */
export const newRefreshToken = (): string => randomBytes(32).toString('base64url');
export const hashRefreshToken = (token: string): string => createHash('sha256').update(token).digest('hex');
