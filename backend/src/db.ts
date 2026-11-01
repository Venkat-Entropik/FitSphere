import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

/**
 * Opens (and migrates) the SQLite database. Pass ':memory:' for tests.
 * Uses Node's built-in `node:sqlite`; the SQL below is plain ANSI so a move to Postgres is mechanical.
 */
export function openDatabase(path: string): DatabaseSync {
  if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true });
  const db = new DatabaseSync(path);
  db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
  migrate(db);
  return db;
}

/** Ordered, append-only. Each entry runs once and is recorded in `schema_migrations`. */
const MIGRATIONS: { id: number; sql: string }[] = [
  {
    id: 1,
    sql: `
      CREATE TABLE users (
        id            TEXT PRIMARY KEY,
        email         TEXT NOT NULL UNIQUE,
        name          TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        created_at    INTEGER NOT NULL
      );

      CREATE TABLE refresh_tokens (
        id          TEXT PRIMARY KEY,
        user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token_hash  TEXT NOT NULL UNIQUE,
        expires_at  INTEGER NOT NULL,
        created_at  INTEGER NOT NULL,
        revoked_at  INTEGER,
        replaced_by TEXT
      );

      CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);
    `,
  },
  {
    id: 2,
    sql: `
      CREATE TABLE profiles (
        user_id             TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        age                 INTEGER NOT NULL,
        goal                TEXT NOT NULL,
        sex                 TEXT NOT NULL,
        height_cm           REAL NOT NULL,
        weight_kg           REAL NOT NULL,
        target_kg           REAL NOT NULL,
        experience          TEXT NOT NULL,
        days_per_week       INTEGER NOT NULL,
        onboarding_complete INTEGER NOT NULL DEFAULT 0,
        updated_at          INTEGER NOT NULL
      );

      CREATE TABLE weights (
        user_id      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        id           TEXT NOT NULL,
        date_key     TEXT NOT NULL,
        kg           REAL NOT NULL,
        body_fat     REAL,
        muscle_kg    REAL,
        PRIMARY KEY (user_id, id),
        UNIQUE (user_id, date_key)
      );

      CREATE TABLE workouts (
        user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        id         TEXT NOT NULL,
        started_at INTEGER NOT NULL,
        data       TEXT NOT NULL,
        PRIMARY KEY (user_id, id)
      );
      CREATE INDEX idx_workouts_user_started ON workouts(user_id, started_at);

      CREATE TABLE activities (
        user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        id         TEXT NOT NULL,
        started_at INTEGER NOT NULL,
        data       TEXT NOT NULL,
        PRIMARY KEY (user_id, id)
      );
      CREATE INDEX idx_activities_user_started ON activities(user_id, started_at);

      CREATE TABLE nutrition_foods (
        user_id   TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        id        TEXT NOT NULL,
        date_key  TEXT NOT NULL,
        logged_at INTEGER NOT NULL,
        data      TEXT NOT NULL,
        PRIMARY KEY (user_id, id)
      );
      CREATE INDEX idx_nutrition_foods_user_date ON nutrition_foods(user_id, date_key);

      CREATE TABLE nutrition_water (
        user_id  TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        date_key TEXT NOT NULL,
        ml       INTEGER NOT NULL,
        PRIMARY KEY (user_id, date_key)
      );
    `,
  },
  {
    id: 3,
    sql: `
      CREATE TABLE coach_messages (
        user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        id         TEXT NOT NULL,
        role       TEXT NOT NULL,
        text       TEXT NOT NULL,
        plan       TEXT,
        reply_to   TEXT,
        created_at INTEGER NOT NULL,
        PRIMARY KEY (user_id, id)
      );
      CREATE INDEX idx_coach_messages_user_created ON coach_messages(user_id, created_at);

      CREATE TABLE ai_cache (
        user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        kind       TEXT NOT NULL,
        data       TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        PRIMARY KEY (user_id, kind)
      );
    `,
  },
  {
    id: 4,
    sql: `
      CREATE TABLE password_resets (
        user_id    TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        code_hash  TEXT NOT NULL,
        expires_at INTEGER NOT NULL,
        attempts   INTEGER NOT NULL DEFAULT 0,
        created_at INTEGER NOT NULL
      );
    `,
  },
];

function migrate(db: DatabaseSync): void {
  db.exec('CREATE TABLE IF NOT EXISTS schema_migrations (id INTEGER PRIMARY KEY, applied_at INTEGER NOT NULL)');
  // Databases created before migrations were tracked already have migration 1's tables.
  const hasUsers = db.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'users'").get();
  const applied = new Set((db.prepare('SELECT id FROM schema_migrations').all() as { id: number }[]).map((r) => r.id));
  if (hasUsers && applied.size === 0) {
    db.prepare('INSERT INTO schema_migrations (id, applied_at) VALUES (1, ?)').run(Date.now());
    applied.add(1);
  }
  for (const migration of MIGRATIONS) {
    if (applied.has(migration.id)) continue;
    transaction(db, () => {
      db.exec(migration.sql);
      db.prepare('INSERT INTO schema_migrations (id, applied_at) VALUES (?, ?)').run(migration.id, Date.now());
    });
  }
}

/** Runs `work` atomically; rolls back and rethrows on error. Not re-entrant. */
export function transaction<T>(db: DatabaseSync, work: () => T): T {
  db.exec('BEGIN');
  try {
    const result = work();
    db.exec('COMMIT');
    return result;
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}
