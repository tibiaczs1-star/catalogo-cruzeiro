import assert from 'node:assert/strict';
import test from 'node:test';
import { activationResponse, validActivation } from '../src/routes/devices.js';

const base = { installationId: 'install-1', name: 'TV Recepcao', address: 'Recepcao principal' };

test('first-run activation accepts a named location without GPS coordinates', () => {
  assert.equal(validActivation(base), true);
  assert.equal(validActivation({ ...base, latitude: -7.63, longitude: -72.67 }), true);
});

test('first-run activation rejects blank names and incomplete coordinates', () => {
  assert.equal(validActivation({ ...base, name: ' ' }), false);
  assert.equal(validActivation({ ...base, latitude: -7.63 }), false);
});

test('first-run confirmation activates the TV without per-device admin approval', () => {
  assert.deepEqual(
    activationResponse({ linkCode: 'AMP-ABC123', deviceToken: 'permanent-token' }),
    { status: 'active', linkCode: 'AMP-ABC123', deviceToken: 'permanent-token' },
  );
});
