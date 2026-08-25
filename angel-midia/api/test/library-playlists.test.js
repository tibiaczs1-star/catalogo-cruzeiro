import test from 'node:test';
import assert from 'node:assert/strict';
import Fastify from 'fastify';
import cookie from '@fastify/cookie';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { validatePlaylist } from '../src/routes/playlists.js';
import libraryRoutes, { validLibraryMetadata, validatePresentation } from '../src/routes/library.js';
import playlistRoutes from '../src/routes/playlists.js';

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

test('playlist validates and preserves video playback metadata', () => {
  const valid = validatePlaylist({ name: 'Vídeos', items: [{ assetId: video, type: 'video/mp4', position: 0, imageDurationSeconds: null, trimStartSeconds: 2, trimEndSeconds: 12, volume: .7 }] });
  assert.equal(valid.ok, true); assert.deepEqual(valid.value.items[0], { assetId: video, type: 'video/mp4', position: 0, imageDurationSeconds: null, trimStartSeconds: 2, trimEndSeconds: 12, volume: .7 });
  const invalid = [
    [{ trimStartSeconds: -1, trimEndSeconds: 5, volume: 1 }, 'invalid_trim_start'],
    [{ trimStartSeconds: 5, trimEndSeconds: 5, volume: 1 }, 'invalid_trim_range'],
    [{ trimStartSeconds: 0, trimEndSeconds: 31, volume: 1 }, 'trim_exceeds_duration'],
    [{ trimStartSeconds: 30, trimEndSeconds: null, volume: 1 }, 'trim_exceeds_duration'],
    [{ trimStartSeconds: '', trimEndSeconds: null, volume: 1 }, 'invalid_trim_start'],
    [{ trimStartSeconds: false, trimEndSeconds: null, volume: 1 }, 'invalid_trim_start'],
    [{ trimStartSeconds: 0, trimEndSeconds: null, volume: '' }, 'invalid_volume'],
    [{ trimStartSeconds: 0, trimEndSeconds: 5, volume: 2 }, 'invalid_volume'],
  ];
  for (const [playback, error] of invalid) {
    assert.deepEqual(validatePlaylist({ name: 'Inválida', items: [{ assetId: video, type: 'video/mp4', position: 0, imageDurationSeconds: null, durationSeconds: 30, ...playback }] }), { ok: false, error });
  }
});

test('playlist accepts global image duration and rejects duplicate positions', () => {
  assert.equal(validatePlaylist({ name: 'Padrão global', items: [{ assetId: image, type: 'image/png', position: 0, imageDurationSeconds: null }] }).ok, true);
  assert.equal(validatePlaylist({ name: 'Inválida', items: [{ assetId: image, type: 'image/png', position: 0, imageDurationSeconds: 5 }, { assetId: video, type: 'video/mp4', position: 0, imageDurationSeconds: null }] }).ok, false);
});

test('admin updates an existing playlist item and reads playback metadata back', async () => {
  const playlist='33333333-3333-4333-8333-333333333333'; const queries=[];
  const db={query:async(sql,params=[])=>{queries.push({sql,params});
    if(sql.includes('from sessions'))return{rows:[{id:image,name:'Admin'}]};
    if(sql.startsWith('select id,content_type'))return{rows:[{id:video,content_type:'video/mp4',duration_seconds:30}]};
    if(sql.startsWith('update playlists'))return{rows:[{id:playlist,status:'active'}]};
    if(sql.startsWith('select p.id'))return{rows:[{id:playlist,name:'Shopping',items:[{assetId:video,trimStartSeconds:2,trimEndSeconds:20,volume:.65}]}]};
    return{rows:[]};}};
  const app=Fastify();app.decorate('db',db);await app.register(cookie);await app.register(playlistRoutes);const headers={cookie:'amp_session=test'};
  const payload={name:'Shopping',items:[{assetId:video,type:'video/mp4',position:0,imageDurationSeconds:null,durationSeconds:30,trimStartSeconds:2,trimEndSeconds:20,volume:.65}]};
  const updated=await app.inject({method:'PUT',url:`/api/admin/playlists/${playlist}`,headers,payload}); assert.equal(updated.statusCode,200);
  const insert=queries.find((q)=>q.sql.startsWith('insert into playlist_items'));assert.deepEqual(insert.params.slice(4),[null,2,20,.65]);
  const readback=await app.inject({method:'GET',url:'/api/admin/playlists',headers});assert.deepEqual(readback.json()[0].items[0],{assetId:video,trimStartSeconds:2,trimEndSeconds:20,volume:.65}); await app.close();
});

test('admin refuses a global image duration when the library default is missing', async () => {
  const db={query:async(sql)=>{
    if(sql.includes('from sessions'))return{rows:[{id:image,name:'Admin'}]};
    if(sql.startsWith('select id,content_type'))return{rows:[{id:image,content_type:'image/png',duration_seconds:null}]};
    return{rows:[]};
  }};
  const app=Fastify();app.decorate('db',db);await app.register(cookie);await app.register(playlistRoutes);
  const response=await app.inject({method:'POST',url:'/api/admin/playlists',headers:{cookie:'amp_session=test'},payload:{name:'Sem padrão',items:[{assetId:image,type:'image/png',position:0,imageDurationSeconds:null}]}});
  assert.equal(response.statusCode,400);assert.deepEqual(response.json(),{error:'missing_image_duration'});await app.close();
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

test('media library resolves group markers through schedule targets', async () => {
  let librarySql = '';
  const db = { query: async (sql) => {
    if (sql.includes('from sessions')) return { rows: [{ id: image, name: 'Admin', email: 'admin@angel.local' }] };
    librarySql = sql;
    return { rows: [] };
  } };
  const app = Fastify();
  app.decorate('db', db);
  await app.register(cookie);
  await app.register(libraryRoutes, { mediaDir: './var/media' });
  const response = await app.inject({ method: 'GET', url: '/api/admin/media', headers: { cookie: 'amp_session=test' } });
  assert.equal(response.statusCode, 200);
  assert.match(librarySql, /join schedule_targets st on st\.schedule_id=s\.id/);
  assert.match(librarySql, /join groups g on g\.id=st\.group_id/);
  await app.close();
});

test('admin updates media presentation and invalid values are rejected', async () => {
  const mediaId = '33333333-3333-4333-8333-333333333333';
  const db = { query: async (sql, params) => {
    if (sql.includes('from sessions')) return { rows: [{ id: image, name: 'Admin', email: 'admin@angel.local' }] };
    if (sql.startsWith('select content_type')) return { rows: [{ content_type: 'image/png', duration_seconds: 8 }] };
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

test('admin persists and reads back image duration and rejects invalid playback fields', async () => {
  const mediaId = '33333333-3333-4333-8333-333333333333'; let updateParams;
  const db = { query: async (sql, params) => {
    if (sql.includes('from sessions')) return { rows: [{ id: image, name: 'Admin', email: 'admin@angel.local' }] };
    if (sql.startsWith('select content_type')) return { rows: [{ content_type: 'image/png', duration_seconds: 8 }] };
    if (sql.startsWith('update media_assets')) { updateParams = params; return { rows: [{ id: mediaId, name: 'Foto', original_name: 'foto.png', content_type: 'image/png', size_bytes: 900, sha256: 'b'.repeat(64), duration_seconds: params[7], processing_status: 'ready', fit_mode: params[1], focal_x: params[2], focal_y: params[3], zoom: params[4], rotation: params[5], background_color: params[6] }] }; }
    return { rows: [] };
  } };
  const app = Fastify(); app.decorate('db', db); await app.register(cookie); await app.register(libraryRoutes, { mediaDir: './var/media' }); const headers = { cookie: 'amp_session=test' };
  const payload = { fitMode: 'contain', focalX: 50, focalY: 50, zoom: 1, rotation: 0, backgroundColor: '#000000', durationSeconds: 17 };
  const response = await app.inject({ method: 'PATCH', url: `/api/admin/media/${mediaId}`, headers, payload });
  assert.equal(response.statusCode, 200); assert.equal(updateParams[7], 17); assert.equal(response.json().durationSeconds, 17);
  for (const invalid of [{ ...payload, durationSeconds: -1 }, { ...payload, trimStartSeconds: 2 }, { ...payload, volume: .5 }]) assert.equal((await app.inject({ method: 'PATCH', url: `/api/admin/media/${mediaId}`, headers, payload: invalid })).statusCode, 400);
  await app.close();
});

test('admin can stream the original media for preview', async () => {
  const mediaId = '33333333-3333-4333-8333-333333333333';
  const storageKey = `${mediaId}.png`;
  const mediaDir = await mkdtemp(join(tmpdir(), 'angel-preview-'));
  const bytes = Buffer.from([0x89, 0x50, 0x4e, 0x47, 1, 2, 3, 4]);
  await writeFile(join(mediaDir, storageKey), bytes);
  const db = { query: async (sql) => {
    if (sql.includes('from sessions')) return { rows: [{ id: image, name: 'Admin', email: 'admin@angel.local' }] };
    if (sql.includes('storage_key')) return { rows: [{ id: mediaId, storage_key: storageKey, content_type: 'image/png', size_bytes: bytes.length }] };
    return { rows: [] };
  } };
  const app = Fastify();
  app.decorate('db', db);
  await app.register(cookie);
  await app.register(libraryRoutes, { mediaDir });
  const response = await app.inject({ method: 'GET', url: `/api/admin/media/${mediaId}/content`, headers: { cookie: 'amp_session=test' } });
  assert.equal(response.statusCode, 200);
  assert.equal(response.headers['content-type'], 'image/png');
  assert.deepEqual(response.rawPayload, bytes);
  const partial = await app.inject({ method: 'GET', url: `/api/admin/media/${mediaId}/content`, headers: { cookie: 'amp_session=test', range: 'bytes=1-3' } });
  assert.equal(partial.statusCode, 206);
  assert.equal(partial.headers['content-range'], `bytes 1-3/${bytes.length}`);
  assert.deepEqual(partial.rawPayload, bytes.subarray(1, 4));
  await app.close();
  await rm(mediaDir, { recursive: true, force: true });
});
