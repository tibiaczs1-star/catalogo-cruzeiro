import test from 'node:test';
import assert from 'node:assert/strict';
import { isDeviceOnline, validateTelemetry } from '../src/routes/telemetry.js';

test('device is online only inside the 90 second freshness window', () => {
  const now = new Date('2026-08-19T12:00:00Z');
  assert.equal(isDeviceOnline('2026-08-19T11:58:31Z', now), true);
  assert.equal(isDeviceOnline('2026-08-19T11:58:29Z', now), false);
});

test('telemetry validates playback, download and storage state', () => {
  const valid = validateTelemetry({ currentAssetId: null, nextAssetId: null, playlistPosition: 0, playbackStartedAt: null, downloadState: 'ready', errorMessage: null, freeStorageBytes: 5000, appVersion: '2.0.0' });
  assert.equal(valid.ok, true);
  assert.equal(validateTelemetry({ ...valid.value, downloadState: 'magic' }).ok, false);
});
