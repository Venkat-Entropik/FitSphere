import type { Db } from '../db.js';

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
export function createAuthRepository(db: Db) {
  return {
    /** Returns null when the email is already registered. */
    async createUser(user: { id: string; email: string; name: string; passwordHash: string; now: number }): Promise<UserRow | null> {
      const inserted = await db.run(
        'INSERT INTO users (id, email, name, password_hash, created_at) VALUES (?, ?, ?, ?, ?) ON CONFLICT (email) DO NOTHING',
        [user.id, user.email, user.name, user.passwordHash, user.now],
      );
      if (inserted === 0) return null;
      return (await this.findUserById(user.id)) ?? null;
    },

    async findUserByEmail(email: string): Promise<UserRow | undefined> {
      return toUser(await db.get<RawUser>('SELECT * FROM users WHERE email = ?', [email]));
    },

    async findUserById(id: string): Promise<UserRow | undefined> {
      return toUser(await db.get<RawUser>('SELECT * FROM users WHERE id = ?', [id]));
    },

    async insertRefreshToken(token: { id: string; userId: string; tokenHash: string; expiresAt: number; now: number }): Promise<void> {
      await db.run('INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at, created_at) VALUES (?, ?, ?, ?, ?)', [
        token.id,
        token.userId,
        token.tokenHash,
        token.expiresAt,
        token.now,
      ]);
    },

    async findRefreshToken(tokenHash: string): Promise<RefreshTokenRow | undefined> {
      return toRefresh(await db.get<RawRefresh>('SELECT * FROM refresh_tokens WHERE token_hash = ?', [tokenHash]));
    },

    async revokeRefreshToken(id: string, now: number, replacedBy: string | null = null): Promise<void> {
      await db.run('UPDATE refresh_tokens SET revoked_at = ?, replaced_by = ? WHERE id = ? AND revoked_at IS NULL', [now, replacedBy, id]);
    },

    /** Used when a revoked refresh token is replayed: assume theft and end every session. */
    async revokeAllForUser(userId: string, now: number): Promise<void> {
      await db.run('UPDATE refresh_tokens SET revoked_at = ? WHERE user_id = ? AND revoked_at IS NULL', [now, userId]);
    },

    /** Cascades to every table that references the user: profile, workouts, meals, coach chat, tokens. */
    async deleteUser(userId: string): Promise<void> {
      await db.run('DELETE FROM users WHERE id = ?', [userId]);
    },

    async setPassword(userId: string, passwordHash: string): Promise<void> {
      await db.run('UPDATE users SET password_hash = ? WHERE id = ?', [passwordHash, userId]);
    },

    /** One active reset code per user; asking again replaces it and resets the attempt counter. */
    async putResetCode(reset: { userId: string; codeHash: string; expiresAt: number; now: number }): Promise<void> {
      await db.run(
        `INSERT INTO password_resets (user_id, code_hash, expires_at, attempts, created_at) VALUES (?, ?, ?, 0, ?)
         ON CONFLICT (user_id) DO UPDATE SET code_hash = excluded.code_hash, expires_at = excluded.expires_at,
           attempts = 0, created_at = excluded.created_at`,
        [reset.userId, reset.codeHash, reset.expiresAt, reset.now],
      );
    },

    async findResetCode(userId: string): Promise<{ code_hash: string; expires_at: number; attempts: number } | undefined> {
      return db.get('SELECT code_hash, expires_at, attempts FROM password_resets WHERE user_id = ?', [userId]);
    },

    async addResetAttempt(userId: string): Promise<void> {
      await db.run('UPDATE password_resets SET attempts = attempts + 1 WHERE user_id = ?', [userId]);
    },

    async deleteResetCode(userId: string): Promise<void> {
      await db.run('DELETE FROM password_resets WHERE user_id = ?', [userId]);
    },

    async pruneExpired(now: number): Promise<void> {
      await db.run('DELETE FROM refresh_tokens WHERE expires_at < ?', [now]);
    },
  };
}
