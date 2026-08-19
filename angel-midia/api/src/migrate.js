import { createHash } from 'node:crypto';
import { randomUUID } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadConfig } from './config.js';
import { createDatabase } from './db.js';

const LOCK_ID = 71020260818;

export async function loadMigrations(directory) {
  const names = (await readdir(directory))
    .filter((name) => /^\d+.*\.sql$/.test(name))
    .sort((left, right) => left.localeCompare(right));

  return Promise.all(names.map(async (name) => {
    const sql = await readFile(path.join(directory, name), 'utf8');
    return {
      name,
      sql,
      checksum: createHash('sha256').update(sql).digest('hex'),
    };
  }));
}

export async function applyMigrations({ db, migrations }) {
  const client = typeof db.connect === 'function' ? await db.connect() : db;
  let locked = false;
  let primaryError;

  try {
    await client.query(`SELECT pg_advisory_lock(${LOCK_ID})`);
    locked = true;
    await client.query(`
      CREATE TABLE IF NOT EXISTS appstation_schema_migrations (
        name text PRIMARY KEY,
        checksum char(64) NOT NULL,
        applied_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    const result = await client.query(
      'SELECT name, checksum FROM appstation_schema_migrations ORDER BY name',
    );
    const applied = new Map(result.rows.map((row) => [row.name, row.checksum]));

    for (const migration of [...migrations].sort((left, right) => left.name.localeCompare(right.name))) {
      if (applied.has(migration.name)) {
        if (applied.get(migration.name) !== migration.checksum) {
          throw new Error(`checksum mismatch for migration ${migration.name}`);
        }
        continue;
      }

      await client.query('BEGIN');
      try {
        await client.query(migration.sql);
        await client.query(
          'INSERT INTO appstation_schema_migrations (name, checksum) VALUES ($1, $2)',
          [migration.name, migration.checksum],
        );
        await client.query('COMMIT');
      } catch (error) {
        try {
          await client.query('ROLLBACK');
        } catch {
          // The migration failure is the actionable error; cleanup must not mask it.
        }
        throw error;
      }
    }
  } catch (error) {
    primaryError = error;
    throw error;
  } finally {
    let cleanupError;
    try {
      if (locked) {
        await client.query(`SELECT pg_advisory_unlock(${LOCK_ID})`);
      }
    } catch (error) {
      cleanupError = error;
    }
    try {
      client.release?.();
    } catch (error) {
      cleanupError ??= error;
    }
    if (!primaryError && cleanupError) {
      throw cleanupError;
    }
  }
}

export async function provisionSuperadmin({ db, passwordHash }) {
  if (!passwordHash) return false;
  if (!/^[a-f0-9]{32}:[a-f0-9]{128}$/i.test(passwordHash)) {
    throw new Error('ANGEL_ADMIN_PASSWORD_HASH must be a valid scrypt hash');
  }
  await db.query(
    `insert into admins (id,email,password_hash,name)
     values ($1,'admin@angelmidia.app',$2,'admin')
     on conflict ((lower(email))) do update
       set name='admin', password_hash=excluded.password_hash, updated_at=now()`,
    [randomUUID(), passwordHash],
  );
  return true;
}

export async function main() {
  const config = loadConfig();
  const db = createDatabase(config);
  try {
    const directory = fileURLToPath(new URL('../migrations/', import.meta.url));
    const migrations = await loadMigrations(directory);
    await applyMigrations({ db, migrations });
    await provisionSuperadmin({ db, passwordHash: process.env.ANGEL_ADMIN_PASSWORD_HASH });
  } finally {
    await db.end();
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main();
}
