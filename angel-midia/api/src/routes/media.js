import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { join } from 'node:path';
import { authenticateDevice } from '../services/device-token.js';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const STORAGE_KEY = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(?:mp4|jpg|png|webp)$/i;
const ALLOWED_TYPES = new Set(['video/mp4', 'image/jpeg', 'image/png', 'image/webp']);

async function requireActiveDevice(request, reply) {
  const device = await authenticateDevice(request);
  if (!device) return reply.code(401).send({ error: 'invalid_device_credential' });
  if (device.status !== 'active') return reply.code(403).send({ error: device.status === 'pending' ? 'pending_approval' : 'device_blocked' });
  if (device.credential_expires_at) return reply.code(403).send({ error: 'credential_claim_required' });
  request.device = device;
}

export function parseByteRange(header, size) {
  if (header == null) return null;
  if (typeof header !== 'string' || !/^bytes=\d*-\d*$/.test(header)) return false;
  const [startText, endText] = header.slice(6).split('-');
  if (!startText && !endText) return false;
  let start; let end;
  if (!startText) {
    const suffix = Number(endText);
    if (!Number.isSafeInteger(suffix) || suffix <= 0) return false;
    start = Math.max(0, size - suffix); end = size - 1;
  } else {
    start = Number(startText); end = endText ? Number(endText) : size - 1;
    if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start > end || start >= size) return false;
    end = Math.min(end, size - 1);
  }
  return { start, end };
}

export default async function mediaRoutes(app, options) {
  const mediaDir = options.mediaDir;
  app.get('/api/device/media/:id', { preHandler: requireActiveDevice }, async (request, reply) => {
    if (!UUID.test(request.params.id ?? '')) return reply.code(400).send({ error: 'invalid_request' });
    const { rows } = await app.db.query(
      `with authorized_media as (
         select distinct ma.id, ma.storage_key, ma.content_type, ma.size_bytes
           from media_assets ma
           join campaigns c on c.id = ma.campaign_id and c.status = 'approved'
           join schedules s on s.campaign_id = c.id and s.starts_at <= now() and s.ends_at > now()
           join schedule_targets st on st.schedule_id = s.id
          where ma.id = $1 and (
            st.target_type = 'all'
            or (st.target_type = 'device' and st.device_id = $2)
            or (st.target_type = 'group' and exists (
              select 1 from group_devices gd where gd.group_id = st.group_id and gd.device_id = $2
            ))
          )
       ) select * from authorized_media limit 1`,
      [request.params.id, request.device.id],
    );
    const media = rows[0];
    if (!media || !STORAGE_KEY.test(media.storage_key ?? '') || !ALLOWED_TYPES.has(media.content_type)) {
      return reply.code(404).send({ error: 'media_not_found' });
    }
    const path = join(mediaDir, media.storage_key);
    let info;
    try { info = await stat(path); } catch { return reply.code(404).send({ error: 'media_not_found' }); }
    const declaredSize = Number(media.size_bytes);
    if (!info.isFile() || !Number.isSafeInteger(declaredSize) || declaredSize < 1 || info.size !== declaredSize) {
      return reply.code(404).send({ error: 'media_not_found' });
    }
    const range = parseByteRange(request.headers.range, info.size);
    reply.header('Accept-Ranges', 'bytes').header('Cache-Control', 'private, no-transform').type(media.content_type);
    if (range === false) return reply.header('Content-Range', `bytes */${info.size}`).code(416).send();
    if (range) {
      const length = range.end - range.start + 1;
      return reply.header('Content-Range', `bytes ${range.start}-${range.end}/${info.size}`).header('Content-Length', length).code(206)
        .send(createReadStream(path, range));
    }
    return reply.header('Content-Length', info.size).send(createReadStream(path));
  });
}
