import multipart from '@fastify/multipart';
import { randomUUID } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { join } from 'node:path';
import { requireAdmin } from '../auth.js';
import { MAX_MEDIA_BYTES, removeStoredMedia, storeMedia } from '../services/storage.js';
import { parseByteRange } from './media.js';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const STORAGE_KEY = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(?:mp4|jpg|png|webp)$/i;
const ALLOWED_TYPES = new Set(['video/mp4', 'image/jpeg', 'image/png', 'image/webp']);

export function validLibraryMetadata(fields) {
  if (!fields || typeof fields.name !== 'string' || !fields.name.trim() || fields.name.trim().length > 160) return false;
  if (fields.durationSeconds === undefined || fields.durationSeconds === '') return true;
  const duration = Number(fields.durationSeconds);
  return Number.isFinite(duration) && duration > 0 && duration <= 86400;
}

export function validatePresentation(fields = {}) {
  const value = {
    fitMode: fields.fitMode ?? 'contain',
    focalX: Number(fields.focalX ?? 50),
    focalY: Number(fields.focalY ?? 50),
    zoom: Number(fields.zoom ?? 1),
    rotation: Number(fields.rotation ?? 0),
    backgroundColor: fields.backgroundColor ?? '#000000',
  };
  const valid = ['contain', 'cover', 'fill'].includes(value.fitMode)
    && Number.isFinite(value.focalX) && value.focalX >= 0 && value.focalX <= 100
    && Number.isFinite(value.focalY) && value.focalY >= 0 && value.focalY <= 100
    && Number.isFinite(value.zoom) && value.zoom >= 0.25 && value.zoom <= 4
    && [0, 90, 180, 270].includes(value.rotation)
    && /^#[0-9a-f]{6}$/i.test(value.backgroundColor);
  return valid ? { ok: true, value } : { ok: false };
}

function mediaDetail(row) {
  return {
    id: row.id,
    name: row.name,
    originalName: row.original_name,
    type: row.content_type,
    sizeBytes: Number(row.size_bytes),
    sha256: row.sha256,
    durationSeconds: row.duration_seconds === null ? null : Number(row.duration_seconds),
    status: row.processing_status,
    width: row.width,
    height: row.height,
    hasAudio: row.has_audio,
    originalFilename: row.original_filename,
    thumbnailKey: row.thumbnail_key,
    presentation: {
      fitMode: row.fit_mode,
      focalX: Number(row.focal_x),
      focalY: Number(row.focal_y),
      zoom: Number(row.zoom),
      rotation: Number(row.rotation),
      backgroundColor: row.background_color,
    },
  };
}

export default async function libraryRoutes(app, { mediaDir, removeMedia = removeStoredMedia } = {}) {
  await app.register(multipart, { limits: { files: 1, fileSize: MAX_MEDIA_BYTES, fields: 2, parts: 3 } });

  app.get('/api/admin/media', { preHandler: requireAdmin }, async () => {
    const { rows } = await app.db.query(`select id,coalesce(display_name,original_name) as name,original_name,content_type,size_bytes,sha256,duration_seconds,processing_status,created_at from media_assets order by created_at desc`);
    return rows;
  });

  app.get('/api/admin/media/:id', { preHandler: requireAdmin }, async (request, reply) => {
    const detail = await app.db.query(`select ma.id,coalesce(ma.display_name,ma.original_name) as name,ma.original_name,ma.content_type,ma.size_bytes,ma.sha256,ma.duration_seconds,ma.processing_status,ma.width,ma.height,ma.has_audio,ma.thumbnail_key,ma.original_filename,ma.fit_mode,ma.focal_x,ma.focal_y,ma.zoom,ma.rotation,ma.background_color from media_assets ma where ma.id=$1`, [request.params.id]);
    if (!detail.rows[0]) return reply.code(404).send({ error: 'media_not_found' });
    const playlists = await app.db.query(`select p.id,p.name,pi.position from playlist_items pi join playlists p on p.id=pi.playlist_id where pi.asset_id=$1 order by p.name,pi.position`, [request.params.id]);
    const playingNow = await app.db.query(`select d.id as device_id,d.name as device_name,l.label as location_name from playback_status ps join devices d on d.id=ps.device_id left join locations l on l.id=d.location_id where ps.current_asset_id=$1 order by d.name`, [request.params.id]);
    return {
      ...mediaDetail(detail.rows[0]),
      usage: {
        playlists: playlists.rows,
        playingNow: playingNow.rows.map((row) => ({ deviceId: row.device_id, deviceName: row.device_name, locationName: row.location_name })),
      },
    };
  });

  app.get('/api/admin/media/:id/content', { preHandler: requireAdmin }, async (request, reply) => {
    if (!UUID.test(request.params.id ?? '')) return reply.code(400).send({ error: 'invalid_request' });
    const { rows } = await app.db.query('select id,storage_key,content_type,size_bytes from media_assets where id=$1', [request.params.id]);
    const media = rows[0];
    if (!media || !STORAGE_KEY.test(media.storage_key ?? '') || !ALLOWED_TYPES.has(media.content_type)) return reply.code(404).send({ error: 'media_not_found' });
    const path = join(mediaDir, media.storage_key);
    let info;
    try { info = await stat(path); } catch { return reply.code(404).send({ error: 'media_not_found' }); }
    const declaredSize = Number(media.size_bytes);
    if (!info.isFile() || !Number.isSafeInteger(declaredSize) || declaredSize < 1 || info.size !== declaredSize) return reply.code(404).send({ error: 'media_not_found' });
    const range = parseByteRange(request.headers.range, info.size);
    reply.header('Accept-Ranges', 'bytes').header('Cache-Control', 'private, no-transform').type(media.content_type);
    if (range === false) return reply.header('Content-Range', `bytes */${info.size}`).code(416).send();
    if (range) {
      const length = range.end - range.start + 1;
      return reply.header('Content-Range', `bytes ${range.start}-${range.end}/${info.size}`).header('Content-Length', length).code(206).send(createReadStream(path, range));
    }
    return reply.header('Content-Length', info.size).send(createReadStream(path));
  });

  app.patch('/api/admin/media/:id', { preHandler: requireAdmin }, async (request, reply) => {
    const presentation = validatePresentation(request.body);
    if (!presentation.ok) return reply.code(400).send({ error: 'invalid_presentation' });
    const value = presentation.value;
    const updated = await app.db.query(`update media_assets set fit_mode=$2,focal_x=$3,focal_y=$4,zoom=$5,rotation=$6,background_color=$7 where id=$1 returning id,coalesce(display_name,original_name) as name,original_name,content_type,size_bytes,sha256,duration_seconds,processing_status,width,height,has_audio,thumbnail_key,original_filename,fit_mode,focal_x,focal_y,zoom,rotation,background_color`, [request.params.id, value.fitMode, value.focalX, value.focalY, value.zoom, value.rotation, value.backgroundColor]);
    if (!updated.rows[0]) return reply.code(404).send({ error: 'media_not_found' });
    return mediaDetail(updated.rows[0]);
  });

  app.post('/api/admin/media', { preHandler: requireAdmin }, async (request, reply) => {
    const fields = {}; let stored;
    try {
      for await (const part of request.parts()) {
        if (part.type === 'file') {
          if (stored) throw Object.assign(new Error('INVALID_REQUEST'), { code: 'INVALID_REQUEST' });
          stored = await storeMedia({ stream: part.file, contentType: part.mimetype, originalName: part.filename, mediaDir });
        } else if (['name', 'durationSeconds'].includes(part.fieldname)) fields[part.fieldname] = part.value;
        else throw Object.assign(new Error('INVALID_REQUEST'), { code: 'INVALID_REQUEST' });
      }
      if (!stored || !validLibraryMetadata(fields)) throw Object.assign(new Error('INVALID_REQUEST'), { code: 'INVALID_REQUEST' });
      const id = randomUUID();
      const duration = fields.durationSeconds ? Number(fields.durationSeconds) : null;
      await app.db.query(`insert into media_assets (id,campaign_id,storage_key,original_name,display_name,content_type,size_bytes,sha256,duration_seconds) values ($1,null,$2,$3,$4,$5,$6,$7,$8)`, [id, stored.storageKey, stored.originalName, fields.name.trim(), stored.contentType, stored.sizeBytes, stored.sha256, duration]);
      return reply.code(201).send({ id, name: fields.name.trim(), type: stored.contentType, sizeBytes: stored.sizeBytes, sha256: stored.sha256, durationSeconds: duration, status: 'ready' });
    } catch (error) {
      if (stored) await removeMedia({ mediaDir, storageKey: stored.storageKey }).catch(() => {});
      const statuses = { INVALID_REQUEST: 400, UNSUPPORTED_MEDIA_TYPE: 415, INVALID_MEDIA_FORMAT: 415, EMPTY_MEDIA: 400, MEDIA_TOO_LARGE: 413, FST_REQ_FILE_TOO_LARGE: 413 };
      if (statuses[error.code]) return reply.code(statuses[error.code]).send({ error: error.code.toLowerCase() });
      throw error;
    }
  });

  app.delete('/api/admin/media/:id', { preHandler: requireAdmin }, async (request, reply) => {
    const used = await app.db.query('select 1 from playlist_items where asset_id=$1 limit 1', [request.params.id]);
    if (used.rows[0]) return reply.code(409).send({ error: 'media_in_use' });
    const deleted = await app.db.query('delete from media_assets where id=$1 returning storage_key', [request.params.id]);
    if (!deleted.rows[0]) return reply.code(404).send({ error: 'media_not_found' });
    await removeMedia({ mediaDir, storageKey: deleted.rows[0].storage_key });
    return reply.code(204).send();
  });
}
