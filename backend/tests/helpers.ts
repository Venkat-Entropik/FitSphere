import { after } from 'node:test';

import { openDatabase, resetDatabase, type Db } from '../src/db.js';

let shared: Db | undefined;

// Registered when a test file imports this module, so it runs once after that file's last test.
after(async () => {
  await shared?.close();
  shared = undefined;
});

/**
 * One in-memory Postgres (PGlite) per test file, emptied before each test. Starting a database takes
 * about a second, so it is reused instead of rebuilt for every test.
 */
export async function testDb(): Promise<Db> {
  shared ??= await openDatabase();
  await resetDatabase(shared);
  return shared;
}

/** A separate throwaway database, for tests that damage the schema. The caller closes it. */
export const freshDb = (): Promise<Db> => openDatabase();
