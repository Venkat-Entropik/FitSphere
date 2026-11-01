import { buildApp } from './app.js';
import { loadConfig } from './config.js';
import { openDatabase } from './db.js';

const config = loadConfig();
if (config.NODE_ENV === 'production' && !config.DATABASE_URL) {
  // The embedded database lives on the container's disk, which hosts like Render's free tier wipe on every restart.
  throw new Error('DATABASE_URL is required in production (a Postgres connection string, e.g. from Neon).');
}
const db = await openDatabase({ url: config.DATABASE_URL, path: config.DATABASE_PATH });
const app = await buildApp({ config, db });

const shutdown = async () => {
  await app.close();
  await db.close();
  process.exit(0);
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

await app.listen({ host: config.HOST, port: config.PORT });
