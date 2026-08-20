import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizePriority, validatePlaylistScheduleInput, resolveSchedule } from '../src/services/schedule.js';

const id = '11111111-1111-4111-8111-111111111111';

test('normalizes named schedule priorities deterministically', () => {
  assert.equal(normalizePriority('normal'), 10);
  assert.equal(normalizePriority('alta'), 50);
  assert.equal(normalizePriority('urgente'), 100);
});

test('accepts playlist schedules for all target types', () => {
  for (const target of [{ type: 'all', id: null }, { type: 'device', id }, { type: 'group', id }]) {
    const result = validatePlaylistScheduleInput({ playlistId: id, target, mode: 'scheduled', startsAt: '2026-08-19T10:00:00Z', endsAt: '2026-08-20T10:00:00Z', priority: 'urgente' });
    assert.equal(result.ok, true);
    assert.equal(result.value.priority, 100);
  }
});

test('accepts a continuous playlist schedule without dates', () => {
  const result = validatePlaylistScheduleInput({ playlistId: id, target: { type: 'all', id: null }, mode: 'continuous', priority: 'normal' });
  assert.equal(result.ok, true);
  assert.equal(result.value.mode, 'continuous');
  assert.equal(result.value.startsAt, null);
  assert.equal(result.value.endsAt, null);
});

test('rejects a scheduled playlist without a complete valid interval', () => {
  const common = { playlistId: id, target: { type: 'all', id: null }, mode: 'scheduled', priority: 'normal' };
  assert.equal(validatePlaylistScheduleInput({ ...common, startsAt: '2026-08-19T10:00:00Z' }).ok, false);
  assert.equal(validatePlaylistScheduleInput({ ...common, startsAt: 'invalid', endsAt: '2026-08-20T10:00:00Z' }).ok, false);
  assert.equal(validatePlaylistScheduleInput({ ...common, startsAt: '2026-08-20T10:00:00Z', endsAt: '2026-08-19T10:00:00Z' }).ok, false);
});

test('rejects unsupported priority labels', () => {
  assert.equal(validatePlaylistScheduleInput({ playlistId: id, target: { type: 'all', id: null }, mode: 'scheduled', startsAt: '2026-08-19T10:00:00Z', endsAt: '2026-08-20T10:00:00Z', priority: 'imediata' }).ok, false);
});

test('manifest preserves the winning playlist order and playback metadata', async () => {
  const db = { query: async () => ({ rows: [
    { schedule_version: 12, playlist_id: '11111111-1111-4111-8111-111111111111', playlist_name: 'Principal', mode: 'continuous', asset_id: '22222222-2222-4222-8222-222222222222', content_type: 'image/jpeg', sha256: 'abc', position: 0, duration_seconds: 8, starts_at: null, ends_at: null, priority: 100, fit_mode: 'cover', focal_x: 25, focal_y: 70, zoom: 1.2, rotation: 0, background_color: '#000000', trim_start_seconds: 2, trim_end_seconds: 12, volume: 0.8, transition_name: 'fade' },
    { schedule_version: 12, playlist_id: '11111111-1111-4111-8111-111111111111', playlist_name: 'Principal', mode: 'continuous', asset_id: '33333333-3333-4333-8333-333333333333', content_type: 'video/mp4', sha256: 'def', position: 1, duration_seconds: null, starts_at: null, ends_at: null, priority: 100 },
  ] }) };
  const manifest = await resolveSchedule(db, { id: '44444444-4444-4444-8444-444444444444' });
  assert.equal(manifest.scheduleRevision, 12);
  assert.match(manifest.version, /^[a-f0-9]{64}$/);
  assert.equal(manifest.playlist.name, 'Principal');
  assert.equal(manifest.mode, 'continuous');
  assert.equal(manifest.loop, true);
  assert.deepEqual(manifest.items.map((item) => [item.position, item.durationSeconds]), [[0, 8], [1, null]]);
  assert.deepEqual(manifest.items.map((item) => [item.startsAt, item.endsAt]), [[null, null], [null, null]]);
  assert.deepEqual(manifest.items[0].presentation, { fitMode: 'cover', focalX: 25, focalY: 70, zoom: 1.2, rotation: 0, backgroundColor: '#000000' });
  assert.deepEqual(manifest.items[0].playback, { trimStartSeconds: 2, trimEndSeconds: 12, volume: 0.8, transition: 'fade' });
});
