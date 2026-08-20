import test from 'node:test';
import assert from 'node:assert/strict';
import { validateGroup } from '../src/routes/groups.js';

const tv1 = '11111111-1111-4111-8111-111111111111';
const tv2 = '22222222-2222-4222-8222-222222222222';

test('validates a named group with unique selected TVs', () => {
  assert.deepEqual(validateGroup({ name: 'Lojas Centro', deviceIds: [tv1, tv2] }), {
    ok: true,
    value: { name: 'Lojas Centro', deviceIds: [tv1, tv2] },
  });
});

test('rejects empty, duplicate or malformed TV selections', () => {
  assert.equal(validateGroup({ name: 'Centro', deviceIds: [] }).ok, false);
  assert.equal(validateGroup({ name: 'Centro', deviceIds: [tv1, tv1] }).ok, false);
  assert.equal(validateGroup({ name: 'Centro', deviceIds: ['tv-1'] }).ok, false);
});
