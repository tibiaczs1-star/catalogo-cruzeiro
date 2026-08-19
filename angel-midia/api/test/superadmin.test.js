import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { provisionSuperadmin } from '../src/migrate.js';

describe('superadmin provisioning', () => {
  it('does nothing without a deployment secret', async () => {
    let called = false;
    const db = { query: async () => { called = true; } };
    assert.equal(await provisionSuperadmin({ db }), false);
    assert.equal(called, false);
  });

  it('upserts admin from a valid deployment hash', async () => {
    let call;
    const db = { query: async (...args) => { call = args; return { rows: [] }; } };
    const hash = `${'a'.repeat(32)}:${'b'.repeat(128)}`;
    assert.equal(await provisionSuperadmin({ db, passwordHash: hash }), true);
    assert.match(call[0], /name='admin'/);
    assert.equal(call[1][1], hash);
  });

  it('rejects plaintext passwords and malformed hashes', async () => {
    await assert.rejects(() => provisionSuperadmin({ db: { query: async () => {} }, passwordHash: 'plaintext' }), /scrypt hash/);
  });
});
