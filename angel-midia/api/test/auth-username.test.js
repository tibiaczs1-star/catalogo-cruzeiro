import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeLoginIdentifier } from '../src/routes/auth.js';

test('normalizes the superadmin username', () => {
  assert.equal(normalizeLoginIdentifier(' Admin '), 'admin');
  assert.equal(normalizeLoginIdentifier(''), null);
});
