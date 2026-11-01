import type { DatabaseSync } from 'node:sqlite';

export interface UserRow {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  createdAt: number;
}

export interface RefreshTokenRow {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: number;
  revokedAt: number | null;
}

interface RawUser {
  id: string;
  email: string;
  name: string;
  password_hash: string;
  created_at: number;
}

interface RawRefresh {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: number;
  revoked_at: number | null;
}

const toUser = (r: RawUser | undefined): UserRow | undefined =>
  r && { id: r.id, email: r.email, name: r.name, passwordHash: r.password_hash, createdAt: r.created_at };

const toRefresh = (r: RawRefresh | undefined): RefreshTokenRow | undefined =>
  r && { id: r.id, userId: r.user_id, tokenHash: r.token_hash, expiresAt: r.expires_at, revokedAt: r.revoked_at };

export type AuthRepository = ReturnType<typeof createAuthRepository>;

/** All SQL for auth lives here; routes never touch the database directly. */
export function createAuthRepository(db: DatabaseSync) {
  return {
    /** Returns null when the email is already registered. */
    createUser(user: { id: string; email: string; name: string; passwordHash: string; now: number }): UserRow | null {
      try {
        db.prepare('INSERT INTO users (id, email, name, password_hash, created_at) VALUES (?, ?, ?, ?, ?)').run(
          user.id,
          user.email,
          user.name,
          user.passwordHash,
          user.now,
        );
      } catch (error) {
        if (error instanceof Error && /UNIQUE constraint failed: users\.email/.test(error.message)) return null;
        throw error;
      }
      return toUser(db.prepare('SELECT * FROM users WHERE id = ?').get(user.id) as RawUser | undefined) ?? null;
    },

    findUserByEmail: (email: string) =>
      toUser(db.prepare('SELECT * FROM users WHERE email = ?').get(email) as RawUser | undefined),

    findUserById: (id: string) => toUser(db.prepare('SELECT * FROM users WHERE id = ?').get(id) as RawUser | undefined),

    insertRefreshToken(token: { id: string; userId: string; tokenHash: string; expiresAt: number; now: number }): void {
      db.prepare(
        'INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at, created_at) VALUES (?, ?, ?, ?, ?)',
      ).run(token.id, token.userId, token.tokenHash, token.expiresAt, token.now);
    },

    findRefreshToken: (tokenHash: string) =>
      toRefresh(db.prepare('SELECT * FROM refresh_tokens WHERE token_hash = ?').get(tokenHash) as RawRefresh | undefined),

    revokeRefreshToken(id: string, now: number, replacedBy: string | null = null): void {
      db.prepare('UPDATE refresh_tokens SET revoked_at = ?, replaced_by = ? WHERE id = ? AND revoked_at IS NULL').run(
        now,
        replacedBy,
        id,
      );
    },

    /** Used when a revoked refresh token is replayed: assume theft and end every session. */
    revokeAllForUser(userId: string, now: number): void {
      db.prepare('UPDATE refresh_tokens SET revoked_at = ? WHERE user_id = ? AND revoked_at IS NULL').run(now, userId);
    },

    pruneExpired(now: number): void {
      db.prepare('DELETE FROM refresh_tokens WHERE expires_at < ?').run(now);
    },
  };
}
