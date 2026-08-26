import assert from 'node:assert/strict';
import test from 'node:test';
import deviceRoutes, { activationResponse, validActivation } from '../src/routes/devices.js';

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

test('admin device list includes company and location bindings for safe network linking', async () => {
  const routes = new Map();
  let query;
  await deviceRoutes({
    get: (path, _options, handler) => routes.set(path, handler),
    post() {},
    patch() {},
    db: { query: async (sql) => {
      query = sql;
      return { rows: [
        { id: 'linked-tv', name: 'Recepcao', organization_id: 'company-1', location_id: 'location-1' },
        { id: 'free-tv', name: 'Nova TV', organization_id: null, location_id: 'location-2' },
      ] };
    } },
  }, {});
  const devices = await routes.get('/api/admin/devices')({}, { send: (body) => body });
  assert.deepEqual(devices.map(({ id, organizationId, locationId }) => ({ id, organizationId, locationId })), [
    { id: 'linked-tv', organizationId: 'company-1', locationId: 'location-1' },
    { id: 'free-tv', organizationId: null, locationId: 'location-2' },
  ]);
  assert.match(query, /d\.organization_id/);
  assert.match(query, /d\.location_id/);
});
