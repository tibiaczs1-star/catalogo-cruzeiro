import { randomUUID } from 'node:crypto';
import { requireAdmin } from '../auth.js';
import { inTransaction } from './devices.js';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function validateVideoPlayback(item, durationSeconds) {
  const start = item.trimStartSeconds == null ? null : Number(item.trimStartSeconds);
  const end = item.trimEndSeconds == null ? null : Number(item.trimEndSeconds);
  const volume = item.volume == null ? 1 : Number(item.volume);
  if (start !== null && (!Number.isFinite(start) || start < 0)) return { ok: false, error: 'invalid_trim_start' };
  if (end !== null && (!Number.isFinite(end) || end <= (start ?? 0))) return { ok: false, error: 'invalid_trim_range' };
  if (end !== null && Number.isFinite(Number(durationSeconds)) && end > Number(durationSeconds)) return { ok: false, error: 'trim_exceeds_duration' };
  if (!Number.isFinite(volume) || volume < 0 || volume > 1) return { ok: false, error: 'invalid_volume' };
  return { ok: true, value: { start, end, volume } };
}

export function validatePlaylist(body) {
  if (!body || typeof body.name !== 'string' || !body.name.trim() || body.name.trim().length > 160 || !Array.isArray(body.items) || body.items.length < 1 || body.items.length > 250) return { ok: false };
  const positions = new Set();
  for (const item of body.items) {
    const image = typeof item?.type === 'string' && item.type.startsWith('image/');
    if (!UUID.test(item?.assetId ?? '') || !Number.isInteger(item.position) || item.position < 0 || positions.has(item.position)) return { ok: false };
    if (image && (!Number.isInteger(item.imageDurationSeconds) || item.imageDurationSeconds < 1 || item.imageDurationSeconds > 86400)) return { ok: false };
    if (!image && item.imageDurationSeconds !== null) return { ok: false };
    if (!image) {
      const playback = validateVideoPlayback(item, item.durationSeconds);
      if (!playback.ok) return playback;
      item.trimStartSeconds = playback.value.start; item.trimEndSeconds = playback.value.end; item.volume = playback.value.volume;
    }
    positions.add(item.position);
  }
  if (![...positions].every((position) => position < body.items.length)) return { ok: false };
  return { ok: true, value: { name: body.name.trim(), description: typeof body.description === 'string' ? body.description.trim().slice(0, 500) : null, items: [...body.items].sort((a, b) => a.position - b.position) } };
}

export default async function playlistRoutes(app) {
  app.get('/api/admin/playlists', { preHandler: requireAdmin }, async () => {
    const { rows } = await app.db.query(`select p.id,p.name,p.description,p.status,p.created_at,coalesce(json_agg(json_build_object('id',pi.id,'assetId',ma.id,'name',coalesce(ma.display_name,ma.original_name),'type',ma.content_type,'position',pi.position,'imageDurationSeconds',pi.image_duration_seconds,'trimStartSeconds',pi.trim_start_seconds,'trimEndSeconds',pi.trim_end_seconds,'volume',pi.volume,'durationSeconds',ma.duration_seconds,'sha256',ma.sha256) order by pi.position) filter (where pi.id is not null),'[]') as items from playlists p left join playlist_items pi on pi.playlist_id=p.id left join media_assets ma on ma.id=pi.asset_id group by p.id order by p.created_at desc`);
    return rows;
  });

  app.post('/api/admin/playlists', { preHandler: requireAdmin }, async (request, reply) => {
    const parsed = validatePlaylist(request.body);
    if (!parsed.ok) return reply.code(400).send({ error: parsed.error || 'invalid_request' });
    const body = parsed.value;
    const result = await inTransaction(app.db, async (db) => {
      const assets = await db.query('select id,content_type,duration_seconds from media_assets where id=any($1::uuid[])', [body.items.map((item) => item.assetId)]);
      if (assets.rows.length !== new Set(body.items.map((item) => item.assetId)).size) return null;
      const types = new Map(assets.rows.map((asset) => [asset.id, asset.content_type]));
      if (body.items.some((item) => types.get(item.assetId) !== item.type)) return null;
      const durations = new Map(assets.rows.map((asset) => [asset.id, asset.duration_seconds]));
      const invalidPlayback = body.items.map((item) => ({ item, result: item.type.startsWith('image/') ? { ok: true } : validateVideoPlayback(item, durations.get(item.assetId)) })).find(({ result: playback }) => !playback.ok);
      if (invalidPlayback) return { error: invalidPlayback.result.error };
      const id = randomUUID();
      await db.query('insert into playlists (id,name,description,created_by) values ($1,$2,$3,$4)', [id, body.name, body.description, request.admin.id]);
      for (const item of body.items) await db.query('insert into playlist_items (id,playlist_id,asset_id,position,image_duration_seconds,trim_start_seconds,trim_end_seconds,volume) values ($1,$2,$3,$4,$5,$6,$7,$8)', [randomUUID(), id, item.assetId, item.position, item.imageDurationSeconds, item.trimStartSeconds ?? null, item.trimEndSeconds ?? null, item.volume ?? 1]);
      return { id, ...body, status: 'active' };
    });
    if (!result) return reply.code(400).send({ error: 'invalid_media' });
    if (result.error) return reply.code(400).send(result);
    return reply.code(201).send(result);
  });
}
