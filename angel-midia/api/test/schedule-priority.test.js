import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizePriority, validatePlaylistScheduleInput, validateScheduleInput, resolveSchedule } from '../src/services/schedule.js';
import scheduleRoutes from '../src/routes/schedules.js';
import mediaRoutes from '../src/routes/media.js';

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

test('rejects null or empty scheduled dates for playlist and campaign schedules', () => {
  const target = { type: 'all', id: null };
  const playlist = { playlistId: id, target, mode: 'scheduled', priority: 'normal' };
  const campaign = { campaignId: id, target, mode: 'scheduled', priority: 10 };
  for (const window of [
    { startsAt: null, endsAt: '2026-08-20T10:00:00Z' },
    { startsAt: '2026-08-19T10:00:00Z', endsAt: null },
    { startsAt: '', endsAt: '2026-08-20T10:00:00Z' },
    { startsAt: '2026-08-19T10:00:00Z', endsAt: '' },
  ]) {
    assert.equal(validatePlaylistScheduleInput({ ...playlist, ...window }).ok, false);
    assert.equal(validateScheduleInput({ ...campaign, ...window }).ok, false);
  }
});

test('rejects date properties on continuous playlist and campaign schedules', () => {
  const target = { type: 'all', id: null };
  const playlist = { playlistId: id, target, mode: 'continuous', priority: 'normal' };
  const campaign = { campaignId: id, target, mode: 'continuous', priority: 10 };
  for (const dates of [{ startsAt: null }, { endsAt: null }, { startsAt: null, endsAt: null }]) {
    assert.equal(validatePlaylistScheduleInput({ ...playlist, ...dates }).ok, false);
    assert.equal(validateScheduleInput({ ...campaign, ...dates }).ok, false);
  }
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

function replyRecorder() {
  return {
    statusCode: 200,
    code(statusCode) { this.statusCode = statusCode; return this; },
    send(payload) { this.payload = payload; return payload; },
  };
}

test('schedule routes expose mode and persist continuous schedules with nullable dates', async () => {
  const queries = [];
  const handlers = new Map();
  const db = {
    async query(sql, params = []) {
      queries.push({ sql, params });
      if (sql.includes('select id,status from playlists')) return { rows: [{ id, status: 'active' }] };
      if (sql.includes('select s.id from schedules')) return { rows: [] };
      if (sql.includes('update devices')) return { rows: [] };
      return { rows: [] };
    },
  };
  const app = {
    db,
    get(path, _options, handler) { handlers.set(`GET ${path}`, handler); },
    post(path, _options, handler) { handlers.set(`POST ${path}`, handler); },
  };
  await scheduleRoutes(app);

  await handlers.get('GET /api/admin/schedules')();
  assert.match(queries.at(-1).sql, /select\s+s\.id,s\.mode,/i);

  const reply = replyRecorder();
  await handlers.get('POST /api/admin/schedules')({
    body: { playlistId: id, target: { type: 'all', id: null }, mode: 'continuous', priority: 'normal' },
    admin: { id: '22222222-2222-4222-8222-222222222222' },
  }, reply);

  const duplicate = queries.find(({ sql }) => sql.includes('select s.id from schedules'));
  assert.match(duplicate.sql, /s\.mode=\$2/i);
  assert.match(duplicate.sql, /s\.starts_at is not distinct from \$3/i);
  assert.match(duplicate.sql, /s\.ends_at is not distinct from \$4/i);
  assert.deepEqual(duplicate.params.slice(0, 5), [id, 'continuous', null, null, 10]);

  const insert = queries.find(({ sql }) => sql.includes('insert into schedules'));
  assert.match(insert.sql, /\(id,campaign_id,playlist_id,mode,starts_at,ends_at,priority,created_by\)/i);
  assert.deepEqual(insert.params.slice(1), [null, id, 'continuous', null, null, 10, '22222222-2222-4222-8222-222222222222']);
});

test('media authorization treats continuous and scheduled agendas as active', async () => {
  const queries = [];
  let handler;
  const app = {
    db: { async query(sql) { queries.push(sql); return { rows: [] }; } },
    get(path, _options, routeHandler) {
      if (path === '/api/device/media/:id') handler = routeHandler;
    },
  };
  await mediaRoutes(app, { mediaDir: '.' });
  await handler({ params: { id }, device: { id } }, replyRecorder());

  const sql = queries[0];
  const activePredicates = sql.match(/s\.mode\s*=\s*'continuous'\s+or\s+\(s\.starts_at\s*<=\s*now\(\)\s+and\s+s\.ends_at\s*>\s*now\(\)\)/gi) ?? [];
  assert.equal(activePredicates.length, 2);
});
