import pg from 'pg';

const { Pool } = pg;

export function createDatabase({ databaseUrl }) {
  if (!databaseUrl) {
    throw new Error('databaseUrl is required to create the database pool');
  }

  return new Pool({ connectionString: databaseUrl });
}
