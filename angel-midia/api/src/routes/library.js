import multipart from '@fastify/multipart';
import { randomUUID } from 'node:crypto';
import { requireAdmin } from '../auth.js';
import { MAX_MEDIA_BYTES, removeStoredMedia, storeMedia } from '../services/storage.js';

export function validLibraryMetadata(fields) {
  if (!fields || typeof fields.name !== 'string' || !fields.name.trim() || fields.name.trim().length > 160) return false;
  if (fields.durationSeconds === undefined || fields.durationSeconds === '') return true;
  const duration = Number(fields.durationSeconds);
  return Number.isFinite(duration) && duration > 0 && duration <= 86400;
}

export default async function libraryRoutes(app, { mediaDir, removeMedia = removeStoredMedia } = {}) {
  await app.register(multipart, { limits: { files: 1, fileSize: MAX_MEDIA_BYTES, fields: 2, parts: 3 } });

  app.get('/api/admin/media', { preHandler: requireAdmin }, async () => {
    const { rows } = await app.db.query(`select id,coalesce(display_name,original_name) as name,original_name,content_type,size_bytes,sha256,duration_seconds,processing_status,created_at from media_assets order by created_at desc`);
    return rows;
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
