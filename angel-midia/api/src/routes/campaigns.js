import multipart from '@fastify/multipart';
import { randomUUID } from 'node:crypto';
import { requireAdmin } from '../auth.js';
import { MAX_MEDIA_BYTES, removeStoredMedia, storeMedia } from '../services/storage.js';
import { inTransaction } from './devices.js';

export default async function campaignRoutes(app, options) {
  const removeMedia = options.removeMedia ?? removeStoredMedia;
  await app.register(multipart, { limits: { files: 1, fileSize: MAX_MEDIA_BYTES, fields: 2, parts: 3 } });
  app.post('/api/admin/campaigns', { preHandler: requireAdmin }, async (request, reply) => {
    let stored; const fields = {};
    try {
      for await (const part of request.parts()) {
        if (part.type === 'file') {
          if (stored || !validMetadata(fields)) {
            part.file.resume?.();
            throw Object.assign(new Error('INVALID_REQUEST'), { code: 'INVALID_REQUEST' });
          }
          stored = await storeMedia({ stream: part.file, contentType: part.mimetype, originalName: part.filename, mediaDir: options.mediaDir });
        }
        else {
          if (stored || !['name', 'status'].includes(part.fieldname) || Object.hasOwn(fields, part.fieldname)) throw Object.assign(new Error('INVALID_REQUEST'), { code: 'INVALID_REQUEST' });
          fields[part.fieldname] = part.value;
        }
      }
      if (!stored || !validMetadata(fields)) return reply.code(400).send({ error: 'invalid_request' });
      const result = await inTransaction(app.db, async (db) => {
        const campaignId = randomUUID(); const assetId = randomUUID();
        await db.query(`insert into campaigns (id, name, status, approved_by, approved_at) values ($1,$2,$3,$4,case when $3 = 'approved' then now() end)`, [campaignId, fields.name.trim(), fields.status, fields.status === 'approved' ? request.admin.id : null]);
        await db.query(`insert into media_assets (id,campaign_id,storage_key,original_name,content_type,size_bytes,sha256) values ($1,$2,$3,$4,$5,$6,$7)`, [assetId, campaignId, stored.storageKey, stored.originalName, stored.contentType, stored.sizeBytes, stored.sha256]);
        return { id: campaignId, name: fields.name.trim(), status: fields.status, asset: { id: assetId, type: stored.contentType, sha256: stored.sha256, sizeBytes: stored.sizeBytes } };
      });
      return reply.code(201).send(result);
    } catch (error) {
      if (stored) {
        try { await removeMedia({ mediaDir: options.mediaDir, storageKey: stored.storageKey }); }
        catch { /* A falha original continua sendo a resposta da operacao. */ }
      }
      const map = { INVALID_REQUEST: 400, UNSUPPORTED_MEDIA_TYPE: 415, INVALID_MEDIA_FORMAT: 415, EMPTY_MEDIA: 400, MEDIA_TOO_LARGE: 413, FST_REQ_FILE_TOO_LARGE: 413 };
      if (map[error.code]) return reply.code(map[error.code]).send({ error: error.code.toLowerCase() });
      throw error;
    }
  });
}

function validMetadata(fields) {
  return Object.keys(fields).length === 2 && typeof fields.name === 'string' && Boolean(fields.name.trim()) && fields.name.trim().length <= 160 && ['draft', 'approved'].includes(fields.status);
}
