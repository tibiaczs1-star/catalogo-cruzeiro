import { randomUUID } from 'node:crypto';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildApp } from './app.js';
import { hashPassword } from './auth.js';
import { createDatabase } from './db.js';
import { applyMigrations, loadMigrations } from './migrate.js';

const databaseUrl = process.env.ANGEL_DATABASE_URL;
const adminPassword = process.env.ANGEL_ADMIN_PASSWORD || process.env.CZS_ADMIN_PASSWORD || process.env.FULL_ADMIN_PASSWORD;
const adminEmail = (process.env.ANGEL_ADMIN_EMAIL || 'admin@angelmidia.app').trim().toLowerCase();
const port = Number(process.env.ANGEL_INTERNAL_PORT || 3101);

if (!databaseUrl) throw new Error('ANGEL_DATABASE_URL is required');
if (!adminPassword) throw new Error('ANGEL_ADMIN_PASSWORD, CZS_ADMIN_PASSWORD or FULL_ADMIN_PASSWORD is required');

const here = path.dirname(fileURLToPath(import.meta.url));
const mediaDir = path.join(process.env.DATA_DIR || path.resolve('render-data'), 'angel-midia');
const db = createDatabase({ databaseUrl });

await mkdir(mediaDir, { recursive: true });
await applyMigrations({ db, migrations: await loadMigrations(path.join(here, '..', 'migrations')) });
await db.query(
  `INSERT INTO admins (id, email, password_hash, name)
   VALUES ($1, $2, $3, $4)
   ON CONFLICT (lower(email)) DO NOTHING`,
  [randomUUID(), adminEmail, await hashPassword(adminPassword), 'Administrador Angel Mídia'],
);

const app = buildApp({ db, logger: true, secureCookies: true, mediaDir });
await app.listen({ host: '127.0.0.1', port });

let closing;
async function shutdown() {
  if (!closing) closing = Promise.allSettled([app.close(), db.end()]);
  await closing;
}
process.once('SIGTERM', shutdown);
process.once('SIGINT', shutdown);
