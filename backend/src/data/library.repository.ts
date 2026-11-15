import type { Db } from '../db.js';

type Table = 'routines' | 'custom_exercises';

/**
 * Small per-user collections stored as validated JSON documents (routines, custom exercises).
 * Writes are upserts by (user, id); a new id is refused once the user is at `limit`.
 */
function createDocStore<T extends { id: string }>(db: Db, table: Table, limit: number) {
  return {
    async list(userId: string): Promise<T[]> {
      const rows = await db.all<{ data: string }>(
        `SELECT data FROM ${table} WHERE user_id = ? ORDER BY updated_at DESC, id ASC LIMIT ?`,
        [userId, limit],
      );
      return rows.map((r) => JSON.parse(r.data) as T);
    },

    /** Returns null when the user is at their limit and this is a new document. */
    async upsert(userId: string, doc: T, updatedAt: number): Promise<T | null> {
      return db.transaction(async (tx) => {
        const existing = await tx.get(
          `SELECT 1 AS one FROM ${table} WHERE user_id = ? AND id = ?`,
          [userId, doc.id],
        );
        if (!existing) {
          const row = await tx.get<{ n: number }>(
            `SELECT COUNT(*) AS n FROM ${table} WHERE user_id = ?`,
            [userId],
          );
          if ((row?.n ?? 0) >= limit) return null;
        }
        await tx.run(
          `INSERT INTO ${table} (user_id, id, updated_at, data) VALUES (?, ?, ?, ?)
           ON CONFLICT (user_id, id) DO UPDATE SET updated_at = excluded.updated_at, data = excluded.data`,
          [userId, doc.id, updatedAt, JSON.stringify(doc)],
        );
        return doc;
      });
    },

    /** Deleting something already gone is fine. */
    async remove(userId: string, id: string): Promise<void> {
      await db.run(`DELETE FROM ${table} WHERE user_id = ? AND id = ?`, [userId, id]);
    },
  };
}

export type DocStore<T extends { id: string }> = ReturnType<typeof createDocStore<T>>;

export const createRoutineStore = <T extends { id: string }>(db: Db, limit: number) =>
  createDocStore<T>(db, 'routines', limit);
export const createCustomExerciseStore = <T extends { id: string }>(db: Db, limit: number) =>
  createDocStore<T>(db, 'custom_exercises', limit);
