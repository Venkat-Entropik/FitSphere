import { mkdirSync, statSync } from 'node:fs';

import { PGlite, types as pgliteTypes } from '@electric-sql/pglite';
import pg from 'pg';

/**
 * One small async interface over PostgreSQL, so the same SQL runs on a hosted database (the `pg` driver,
 * e.g. Neon) and on PGlite (Postgres compiled to WebAssembly) for local development and tests.
 * Write `?` placeholders; they are converted to `$1, $2, …` here.
 */
export interface Db {
  /** Every row of a query. */
  all<T = Record<string, unknown>>(sql: string, params?: readonly unknown[]): Promise<T[]>;
  /** The first row, or undefined. */
  get<T = Record<string, unknown>>(sql: string, params?: readonly unknown[]): Promise<T | undefined>;
  /** Runs a statement and returns how many rows it changed. */
  run(sql: string, params?: readonly unknown[]): Promise<number>;
  /** Runs one or more statements with no parameters (schema changes). */
  exec(sql: string): Promise<void>;
  /** Runs `work` atomically; rolls back and rethrows on error. */
  transaction<T>(work: (tx: Db) => Promise<T>): Promise<T>;
  close(): Promise<void>;
}

export interface DatabaseOptions {
  /** A Postgres connection string. When set, a real server is used. */
  url?: string;
  /** Otherwise PGlite is used: a directory to keep data in, or ':memory:' for a throwaway database. */
  path?: string;
}

/** `?` → `$n`. Our SQL never contains a literal question mark. */
export function toPositional(sql: string): string {
  let n = 0;
  return sql.replace(/\?/g, () => `$${++n}`);
}

// Epoch milliseconds and counts are BIGINT; return them as numbers (they are far below 2^53).
pg.types.setTypeParser(pg.types.builtins.INT8, (value) => Number(value));

type Queryable = { query: (text: string, params?: unknown[]) => Promise<{ rows: unknown[]; rowCount?: number | null; affectedRows?: number }> };

function wrap(
  q: Queryable,
  exec: (sql: string) => Promise<unknown>,
  transaction: Db['transaction'],
  close: () => Promise<void>,
): Db {
  return {
    async all(sql, params = []) {
      return (await q.query(toPositional(sql), [...params])).rows as never;
    },
    async get(sql, params = []) {
      return (await q.query(toPositional(sql), [...params])).rows[0] as never;
    },
    async run(sql, params = []) {
      const result = await q.query(toPositional(sql), [...params]);
      return result.rowCount ?? result.affectedRows ?? 0;
    },
    async exec(sql) {
      await exec(sql);
    },
    transaction,
    close,
  };
}

function fromPool(pool: pg.Pool): Db {
  const onClient = (client: pg.PoolClient): Db => {
    const tx: Db = wrap(
      client,
      (sql) => client.query(sql),
      () => {
        throw new Error('Transactions cannot be nested');
      },
      async () => {},
    );
    return tx;
  };
  return wrap(
    pool,
    (sql) => pool.query(sql),
    async (work) => {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const result = await work(onClient(client));
        await client.query('COMMIT');
        return result;
      } catch (error) {
        await client.query('ROLLBACK').catch(() => {});
        throw error;
      } finally {
        client.release();
      }
    },
    () => pool.end(),
  );
}

function fromPglite(lite: PGlite): Db {
  return wrap(
    lite,
    (sql) => lite.exec(sql),
    (work) =>
      lite.transaction((tx) =>
        work(
          wrap(
            tx,
            (sql) => tx.exec(sql),
            () => {
              throw new Error('Transactions cannot be nested');
            },
            async () => {},
          ),
        ),
      ),
    () => lite.close(),
  );
}

/** Opens (and migrates) the database. */
export async function openDatabase(options: DatabaseOptions = {}): Promise<Db> {
  let db: Db;
  if (options.url) {
    const pool = new pg.Pool({
      connectionString: options.url,
      max: 5,
      // Serverless Postgres drops idle connections; retire ours first and never crash on a stray error.
      idleTimeoutMillis: 10_000,
      keepAlive: true,
    });
    pool.on('error', () => {});
    db = fromPool(pool);
  } else {
    const path = options.path ?? ':memory:';
    if (path !== ':memory:') {
      if (statSync(path, { throwIfNoEntry: false })?.isFile()) {
        throw new Error(
          `DATABASE_PATH (${path}) is a file, probably an old SQLite database. The embedded Postgres needs a folder: set DATABASE_PATH=./data/pglite.`,
        );
      }
      mkdirSync(path, { recursive: true });
    }
    const lite = new PGlite(path === ':memory:' ? undefined : path, {
      parsers: { [pgliteTypes.INT8]: (value: string) => Number(value) },
    });
    await lite.waitReady;
    db = fromPglite(lite);
  }
  try {
    await migrate(db);
  } catch (error) {
    await db.close();
    throw error;
  }
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
        created_at    BIGINT NOT NULL
      );

      CREATE TABLE refresh_tokens (
        id          TEXT PRIMARY KEY,
        user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token_hash  TEXT NOT NULL UNIQUE,
        expires_at  BIGINT NOT NULL,
        created_at  BIGINT NOT NULL,
        revoked_at  BIGINT,
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
        height_cm           DOUBLE PRECISION NOT NULL,
        weight_kg           DOUBLE PRECISION NOT NULL,
        target_kg           DOUBLE PRECISION NOT NULL,
        experience          TEXT NOT NULL,
        days_per_week       INTEGER NOT NULL,
        onboarding_complete INTEGER NOT NULL DEFAULT 0,
        updated_at          BIGINT NOT NULL
      );

      CREATE TABLE weights (
        user_id      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        id           TEXT NOT NULL,
        date_key     TEXT NOT NULL,
        kg           DOUBLE PRECISION NOT NULL,
        body_fat     DOUBLE PRECISION,
        muscle_kg    DOUBLE PRECISION,
        PRIMARY KEY (user_id, id),
        UNIQUE (user_id, date_key)
      );

      CREATE TABLE workouts (
        user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        id         TEXT NOT NULL,
        started_at BIGINT NOT NULL,
        data       TEXT NOT NULL,
        PRIMARY KEY (user_id, id)
      );
      CREATE INDEX idx_workouts_user_started ON workouts(user_id, started_at);

      CREATE TABLE activities (
        user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        id         TEXT NOT NULL,
        started_at BIGINT NOT NULL,
        data       TEXT NOT NULL,
        PRIMARY KEY (user_id, id)
      );
      CREATE INDEX idx_activities_user_started ON activities(user_id, started_at);

      CREATE TABLE nutrition_foods (
        user_id   TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        id        TEXT NOT NULL,
        date_key  TEXT NOT NULL,
        logged_at BIGINT NOT NULL,
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
        seq        BIGSERIAL,
        role       TEXT NOT NULL,
        text       TEXT NOT NULL,
        plan       TEXT,
        reply_to   TEXT,
        created_at BIGINT NOT NULL,
        PRIMARY KEY (user_id, id)
      );
      CREATE INDEX idx_coach_messages_user_created ON coach_messages(user_id, created_at);

      CREATE TABLE ai_cache (
        user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        kind       TEXT NOT NULL,
        data       TEXT NOT NULL,
        created_at BIGINT NOT NULL,
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
        expires_at BIGINT NOT NULL,
        attempts   INTEGER NOT NULL DEFAULT 0,
        created_at BIGINT NOT NULL
      );
    `,
  },
];

const MIGRATION_LOCK = 727_274;

async function migrate(db: Db): Promise<void> {
  await db.transaction(async (tx) => {
    // Serialises concurrent starts (e.g. two instances booting during a deploy).
    await tx.get('SELECT pg_advisory_xact_lock(?)', [MIGRATION_LOCK]);
    await tx.exec('CREATE TABLE IF NOT EXISTS schema_migrations (id INTEGER PRIMARY KEY, applied_at BIGINT NOT NULL)');
    const applied = new Set((await tx.all<{ id: number }>('SELECT id FROM schema_migrations')).map((r) => r.id));
    for (const migration of MIGRATIONS) {
      if (applied.has(migration.id)) continue;
      await tx.exec(migration.sql);
      await tx.run('INSERT INTO schema_migrations (id, applied_at) VALUES (?, ?)', [migration.id, Date.now()]);
    }
  });
}

/** Test helper: removes every user (and, by cascade, all their data) but keeps the schema. */
export async function resetDatabase(db: Db): Promise<void> {
  await db.exec('TRUNCATE users CASCADE');
}
