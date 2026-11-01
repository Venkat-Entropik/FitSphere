import type { Db } from '../db.js';
import { LIST_LIMIT } from './schemas.js';

/**
 * Workouts and activities are stored as validated JSON documents, with the columns we filter and
 * sort on kept as real columns. Writes are upserts keyed by (user, id), so retries are harmless.
 */
function createRecordStore<T extends { id: string; startedAt: number }>(db: Db, table: 'workouts' | 'activities') {
  return {
    async list(userId: string): Promise<T[]> {
      const rows = await db.all<{ data: string }>(
        `SELECT data FROM ${table} WHERE user_id = ? ORDER BY started_at ASC, id ASC LIMIT ?`,
        [userId, LIST_LIMIT],
      );
      return rows.map((r) => JSON.parse(r.data) as T);
    },
    async upsert(userId: string, record: T): Promise<T> {
      await db.run(
        `INSERT INTO ${table} (user_id, id, started_at, data) VALUES (?, ?, ?, ?)
         ON CONFLICT (user_id, id) DO UPDATE SET started_at = excluded.started_at, data = excluded.data`,
        [userId, record.id, record.startedAt, JSON.stringify(record)],
      );
      return record;
    },
  };
}

export type RecordStore<T extends { id: string; startedAt: number }> = ReturnType<typeof createRecordStore<T>>;

export const createWorkoutRepository = <T extends { id: string; startedAt: number }>(db: Db) =>
  createRecordStore<T>(db, 'workouts');
export const createActivityRepository = <T extends { id: string; startedAt: number }>(db: Db) =>
  createRecordStore<T>(db, 'activities');
