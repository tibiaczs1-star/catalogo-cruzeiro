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
    const result = validatePlaylistScheduleInput({ playlistId: id, target, startsAt: '2026-08-19T10:00:00Z', endsAt: '2026-08-20T10:00:00Z', priority: 'urgente' });
    assert.equal(result.ok, true);
    assert.equal(result.value.priority, 100);
  }
});

test('rejects unsupported priority labels', () => {
  assert.equal(validatePlaylistScheduleInput({ playlistId: id, target: { type: 'all', id: null }, startsAt: '2026-08-19T10:00:00Z', endsAt: '2026-08-20T10:00:00Z', priority: 'imediata' }).ok, false);
});

test('manifest preserves the winning playlist order and playback metadata', async () => {
  const db = { query: async () => ({ rows: [
    { schedule_version: 12, playlist_id: '11111111-1111-4111-8111-111111111111', playlist_name: 'Principal', asset_id: '22222222-2222-4222-8222-222222222222', content_type: 'image/jpeg', sha256: 'abc', position: 0, duration_seconds: 8, starts_at: '2026-08-19T12:00:00.000Z', ends_at: '2026-08-20T12:00:00.000Z', priority: 100 },
    { schedule_version: 12, playlist_id: '11111111-1111-4111-8111-111111111111', playlist_name: 'Principal', asset_id: '33333333-3333-4333-8333-333333333333', content_type: 'video/mp4', sha256: 'def', position: 1, duration_seconds: null, starts_at: '2026-08-19T12:00:00.000Z', ends_at: '2026-08-20T12:00:00.000Z', priority: 100 },
  ] }) };
  const manifest = await resolveSchedule(db, { id: '44444444-4444-4444-8444-444444444444' });
  assert.equal(manifest.version, 12);
  assert.equal(manifest.playlist.name, 'Principal');
  assert.deepEqual(manifest.items.map((item) => [item.position, item.durationSeconds]), [[0, 8], [1, null]]);
});
