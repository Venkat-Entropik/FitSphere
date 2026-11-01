import type { DatabaseSync } from 'node:sqlite';

import { LIST_LIMIT } from './schemas.js';

/**
 * Workouts and activities are stored as validated JSON documents, with the columns we filter and
 * sort on kept as real columns. Writes are upserts keyed by (user, id), so retries are harmless.
 */
function createRecordStore<T extends { id: string; startedAt: number }>(db: DatabaseSync, table: 'workouts' | 'activities') {
  return {
    list(userId: string): T[] {
      const rows = db
        .prepare(`SELECT data FROM ${table} WHERE user_id = ? ORDER BY started_at ASC, id ASC LIMIT ?`)
        .all(userId, LIST_LIMIT) as { data: string }[];
      return rows.map((r) => JSON.parse(r.data) as T);
    },
    upsert(userId: string, record: T): T {
      db.prepare(
        `INSERT INTO ${table} (user_id, id, started_at, data) VALUES (?, ?, ?, ?)
         ON CONFLICT (user_id, id) DO UPDATE SET started_at = excluded.started_at, data = excluded.data`,
      ).run(userId, record.id, record.startedAt, JSON.stringify(record));
      return record;
    },
  };
}

export type RecordStore<T extends { id: string; startedAt: number }> = ReturnType<typeof createRecordStore<T>>;

export const createWorkoutRepository = <T extends { id: string; startedAt: number }>(db: DatabaseSync) =>
  createRecordStore<T>(db, 'workouts');
export const createActivityRepository = <T extends { id: string; startedAt: number }>(db: DatabaseSync) =>
  createRecordStore<T>(db, 'activities');
