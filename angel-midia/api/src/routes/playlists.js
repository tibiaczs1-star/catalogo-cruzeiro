import { randomUUID } from 'node:crypto';
import { requireAdmin } from '../auth.js';
import { inTransaction } from './devices.js';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function validatePlaylist(body) {
  if (!body || typeof body.name !== 'string' || !body.name.trim() || body.name.trim().length > 160 || !Array.isArray(body.items) || body.items.length < 1 || body.items.length > 250) return { ok: false };
  const positions = new Set();
  for (const item of body.items) {
    const image = typeof item?.type === 'string' && item.type.startsWith('image/');
    if (!UUID.test(item?.assetId ?? '') || !Number.isInteger(item.position) || item.position < 0 || positions.has(item.position)) return { ok: false };
    if (image && (!Number.isInteger(item.imageDurationSeconds) || item.imageDurationSeconds < 1 || item.imageDurationSeconds > 86400)) return { ok: false };
    if (!image && item.imageDurationSeconds !== null) return { ok: false };
    positions.add(item.position);
  }
  if (![...positions].every((position) => position < body.items.length)) return { ok: false };
  return { ok: true, value: { name: body.name.trim(), description: typeof body.description === 'string' ? body.description.trim().slice(0, 500) : null, items: [...body.items].sort((a, b) => a.position - b.position) } };
}

export default async function playlistRoutes(app) {
  app.get('/api/admin/playlists', { preHandler: requireAdmin }, async () => {
    const { rows } = await app.db.query(`select p.id,p.name,p.description,p.status,p.created_at,coalesce(json_agg(json_build_object('id',pi.id,'assetId',ma.id,'name',coalesce(ma.display_name,ma.original_name),'type',ma.content_type,'position',pi.position,'imageDurationSeconds',pi.image_duration_seconds,'durationSeconds',ma.duration_seconds,'sha256',ma.sha256) order by pi.position) filter (where pi.id is not null),'[]') as items from playlists p left join playlist_items pi on pi.playlist_id=p.id left join media_assets ma on ma.id=pi.asset_id group by p.id order by p.created_at desc`);
    return rows;
  });

  app.post('/api/admin/playlists', { preHandler: requireAdmin }, async (request, reply) => {
    const parsed = validatePlaylist(request.body);
    if (!parsed.ok) return reply.code(400).send({ error: 'invalid_request' });
    const body = parsed.value;
    const result = await inTransaction(app.db, async (db) => {
      const assets = await db.query('select id,content_type from media_assets where id=any($1::uuid[])', [body.items.map((item) => item.assetId)]);
      if (assets.rows.length !== new Set(body.items.map((item) => item.assetId)).size) return null;
      const types = new Map(assets.rows.map((asset) => [asset.id, asset.content_type]));
      if (body.items.some((item) => types.get(item.assetId) !== item.type)) return null;
      const id = randomUUID();
      await db.query('insert into playlists (id,name,description,created_by) values ($1,$2,$3,$4)', [id, body.name, body.description, request.admin.id]);
      for (const item of body.items) await db.query('insert into playlist_items (id,playlist_id,asset_id,position,image_duration_seconds) values ($1,$2,$3,$4,$5)', [randomUUID(), id, item.assetId, item.position, item.imageDurationSeconds]);
      return { id, ...body, status: 'active' };
    });
    if (!result) return reply.code(400).send({ error: 'invalid_media' });
    return reply.code(201).send(result);
  });
}
