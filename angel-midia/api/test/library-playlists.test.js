import test from 'node:test';
import assert from 'node:assert/strict';
import Fastify from 'fastify';
import cookie from '@fastify/cookie';
import { validatePlaylist } from '../src/routes/playlists.js';
import libraryRoutes, { validLibraryMetadata, validatePresentation } from '../src/routes/library.js';

const image = '11111111-1111-4111-8111-111111111111';
const video = '22222222-2222-4222-8222-222222222222';

test('library metadata requires a display name', () => {
  assert.equal(validLibraryMetadata({ name: 'Oferta Agosto', durationSeconds: '12' }), true);
  assert.equal(validLibraryMetadata({ name: '', durationSeconds: '' }), false);
});

test('playlist preserves explicit item order and image duration', () => {
  const result = validatePlaylist({ name: 'Grade principal', items: [
    { assetId: image, type: 'image/png', position: 0, imageDurationSeconds: 8 },
    { assetId: video, type: 'video/mp4', position: 1, imageDurationSeconds: null },
  ] });
  assert.equal(result.ok, true);
  assert.deepEqual(result.value.items.map((item) => item.position), [0, 1]);
});

test('playlist rejects an image without duration and duplicate positions', () => {
  assert.equal(validatePlaylist({ name: 'Inválida', items: [{ assetId: image, type: 'image/png', position: 0, imageDurationSeconds: null }] }).ok, false);
  assert.equal(validatePlaylist({ name: 'Inválida', items: [{ assetId: image, type: 'image/png', position: 0, imageDurationSeconds: 5 }, { assetId: video, type: 'video/mp4', position: 0, imageDurationSeconds: null }] }).ok, false);
});

test('presentation validates centering, zoom, rotation and color', () => {
  assert.deepEqual(validatePresentation({ fitMode: 'cover', focalX: 25, focalY: 70, zoom: 1.2, rotation: 90, backgroundColor: '#102030' }), {
    ok: true,
    value: { fitMode: 'cover', focalX: 25, focalY: 70, zoom: 1.2, rotation: 90, backgroundColor: '#102030' },
  });
  for (const invalid of [{ focalX: 101 }, { zoom: 5 }, { rotation: 45 }, { backgroundColor: 'navy' }]) {
    assert.equal(validatePresentation(invalid).ok, false);
  }
});

test('media detail reports presentation and where it is running', async () => {
  const mediaId = '33333333-3333-4333-8333-333333333333';
  const db = { query: async (sql) => {
    if (sql.includes('from sessions')) return { rows: [{ id: image, name: 'Admin', email: 'admin@angel.local' }] };
    if (sql.includes('from media_assets ma')) return { rows: [{ id: mediaId, name: 'Oferta', original_name: 'oferta.mp4', content_type: 'video/mp4', size_bytes: 1200, sha256: 'a'.repeat(64), duration_seconds: '12', processing_status: 'ready', width: 1920, height: 1080, has_audio: true, fit_mode: 'cover', focal_x: '25', focal_y: '70', zoom: '1.2', rotation: 0, background_color: '#000000' }] };
    if (sql.includes('from playlist_items')) return { rows: [{ id: image, name: 'Vitrine', position: 0 }] };
    if (sql.includes('from playback_status')) return { rows: [{ device_id: video, device_name: 'TV Recepção', location_name: 'Loja Centro' }] };
    return { rows: [] };
  } };
  const app = Fastify();
  app.decorate('db', db);
  await app.register(cookie);
  await app.register(libraryRoutes, { mediaDir: './var/media' });
  const detail = await app.inject({ method: 'GET', url: `/api/admin/media/${mediaId}`, headers: { cookie: 'amp_session=test' } });
  assert.equal(detail.statusCode, 200);
  assert.deepEqual(detail.json().presentation, { fitMode: 'cover', focalX: 25, focalY: 70, zoom: 1.2, rotation: 0, backgroundColor: '#000000' });
  assert.equal(detail.json().usage.playlists[0].name, 'Vitrine');
  assert.equal(detail.json().usage.playingNow[0].deviceName, 'TV Recepção');
  await app.close();
});

test('admin updates media presentation and invalid values are rejected', async () => {
  const mediaId = '33333333-3333-4333-8333-333333333333';
  const db = { query: async (sql, params) => {
    if (sql.includes('from sessions')) return { rows: [{ id: image, name: 'Admin', email: 'admin@angel.local' }] };
    if (sql.startsWith('update media_assets')) return { rows: [{ id: mediaId, name: 'Oferta', original_name: 'oferta.png', content_type: 'image/png', size_bytes: 900, sha256: 'b'.repeat(64), duration_seconds: '8', processing_status: 'ready', width: 1080, height: 1920, has_audio: false, fit_mode: params[1], focal_x: params[2], focal_y: params[3], zoom: params[4], rotation: params[5], background_color: params[6] }] };
    return { rows: [] };
  } };
  const app = Fastify();
  app.decorate('db', db);
  await app.register(cookie);
  await app.register(libraryRoutes, { mediaDir: './var/media' });
  const headers = { cookie: 'amp_session=test' };
  const updated = await app.inject({ method: 'PATCH', url: `/api/admin/media/${mediaId}`, headers, payload: { fitMode: 'cover', focalX: 40, focalY: 60, zoom: 1.5, rotation: 90, backgroundColor: '#112233' } });
  assert.equal(updated.statusCode, 200);
  assert.deepEqual(updated.json().presentation, { fitMode: 'cover', focalX: 40, focalY: 60, zoom: 1.5, rotation: 90, backgroundColor: '#112233' });
  const invalid = await app.inject({ method: 'PATCH', url: `/api/admin/media/${mediaId}`, headers, payload: { focalX: 200 } });
  assert.equal(invalid.statusCode, 400);
  await app.close();
});
