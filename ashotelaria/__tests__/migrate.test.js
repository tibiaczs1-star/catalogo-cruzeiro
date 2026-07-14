"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const { runMigrations } = require("../migrate");

function migrationPool({ alreadyApplied = false } = {}) {
  const queries = [];
  const client = {
    released: false,
    async query(text, values = []) {
      const sql = String(text);
      queries.push({ text: sql, values });
      if (/SELECT 1 FROM ashotelaria_migrations/.test(sql)) {
        return { rows: alreadyApplied ? [{ exists: 1 }] : [], rowCount: alreadyApplied ? 1 : 0 };
      }
      return { rows: [], rowCount: 0 };
    },
    release() { this.released = true; },
  };
  return { queries, client, pool: { connect: async () => client } };
}

test("runMigrations reports zero when every migration is already recorded", async () => {
  const { pool, client, queries } = migrationPool({ alreadyApplied: true });
  const result = await runMigrations({ pool, bootstrap: false });

  assert.deepEqual(result, { applied: 0 });
  assert.equal(client.released, true);
  assert.equal(queries.some(({ text }) => /CREATE TABLE tenants/.test(text)), false);
});

test("runMigrations applies SQL and records its name in the same transaction", async () => {
  const { pool, queries } = migrationPool();
  const result = await runMigrations({ pool, bootstrap: false });

  assert.deepEqual(result, { applied: 2 });
  const migrationSqlIndexes = queries
    .map(({ text }, index) => (/CREATE TABLE tenants|CREATE TABLE credential_profiles/.test(text) ? index : -1))
    .filter((index) => index >= 0);
  assert.equal(migrationSqlIndexes.length, 2);
  for (const sqlIndex of migrationSqlIndexes) {
    const beginIndex = queries.map(({ text }) => text).lastIndexOf("BEGIN", sqlIndex);
    const recordIndex = queries.findIndex(({ text }, index) => index > sqlIndex && /INSERT INTO ashotelaria_migrations/.test(text));
    const commitIndex = queries.findIndex(({ text }, index) => index > recordIndex && text === "COMMIT");
    assert.ok(beginIndex >= 0 && beginIndex < sqlIndex);
    assert.ok(recordIndex > sqlIndex);
    assert.ok(commitIndex > recordIndex);
    assert.doesNotMatch(queries[sqlIndex].text, /^\s*BEGIN\s*;/i);
    assert.doesNotMatch(queries[sqlIndex].text, /COMMIT\s*;\s*$/i);
  }
  assert.equal(queries.filter(({ text }) => /pg_advisory_xact_lock/.test(text)).length, 2);
});
