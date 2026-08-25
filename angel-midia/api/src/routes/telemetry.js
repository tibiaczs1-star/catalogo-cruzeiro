import { authenticateDevice } from '../services/device-token.js';
import { requireAdmin } from '../auth.js';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const DOWNLOAD_STATES = new Set(['idle', 'downloading', 'ready', 'failed']);

export function isDeviceOnline(lastSeenAt, now = new Date()) {
  const seen = new Date(lastSeenAt).getTime();
  return Number.isFinite(seen) && now.getTime() - seen <= 90_000;
}

export function validateTelemetry(body) {
  const keys = ['currentAssetId', 'nextAssetId', 'playlistPosition', 'playbackStartedAt', 'downloadState', 'errorMessage', 'freeStorageBytes', 'appVersion'];
  if (!body || typeof body !== 'object' || Array.isArray(body) || Object.keys(body).some((key) => !keys.includes(key))) return { ok: false };
  if (![body.currentAssetId, body.nextAssetId].every((value) => value === null || UUID.test(value ?? ''))) return { ok: false };
  if (!Number.isInteger(body.playlistPosition) || body.playlistPosition < 0 || !DOWNLOAD_STATES.has(body.downloadState)) return { ok: false };
  if (body.playbackStartedAt !== null && !Number.isFinite(new Date(body.playbackStartedAt).getTime())) return { ok: false };
  if (body.errorMessage !== null && (typeof body.errorMessage !== 'string' || body.errorMessage.length > 1000)) return { ok: false };
  if (!Number.isSafeInteger(body.freeStorageBytes) || body.freeStorageBytes < 0 || typeof body.appVersion !== 'string' || body.appVersion.length > 40) return { ok: false };
  return { ok: true, value: body };
}

async function requireDevice(request, reply) {
  const device = await authenticateDevice(request);
  if (!device) return reply.code(401).send({ error: 'invalid_device_credential' });
  if (device.status !== 'active') return reply.code(403).send({ error: 'device_not_active' });
  request.device = device;
}

export default async function telemetryRoutes(app) {
  app.put('/api/device/telemetry', { preHandler: requireDevice }, async (request, reply) => {
    const parsed = validateTelemetry(request.body);
    if (!parsed.ok) return reply.code(400).send({ error: 'invalid_request' });
    const body = parsed.value;
    await app.db.query(`insert into playback_status (device_id,current_asset_id,next_asset_id,playlist_position,playback_started_at,error_message,updated_at)
      values ($1,$2,$3,$4,$5,$6,now()) on conflict (device_id) do update set current_asset_id=excluded.current_asset_id,next_asset_id=excluded.next_asset_id,playlist_position=excluded.playlist_position,playback_started_at=excluded.playback_started_at,error_message=excluded.error_message,updated_at=now()`, [request.device.id, body.currentAssetId, body.nextAssetId, body.playlistPosition, body.playbackStartedAt, body.errorMessage]);
    if (body.currentAssetId) {
      await app.db.query(`insert into download_status (device_id,asset_id,state,error_message,updated_at)
        values ($1,$2,$3,$4,now()) on conflict (device_id,asset_id) do update set state=excluded.state,error_message=excluded.error_message,updated_at=now()`,
      [request.device.id, body.currentAssetId, body.downloadState, body.errorMessage]);
    }
    await app.db.query('update devices set last_seen_at=now(),free_storage_bytes=$2,app_version=$3,updated_at=now() where id=$1', [request.device.id, body.freeStorageBytes, body.appVersion]);
    return reply.code(204).send();
  });

  app.get('/api/admin/live', { preHandler: requireAdmin }, async () => {
    const { rows } = await app.db.query(`select d.id,d.name,d.status,d.last_seen_at,d.free_storage_bytes,d.app_version,l.label as location,l.latitude,l.longitude,
      p.current_asset_id,current_media.display_name as current_media_name,p.next_asset_id,next_media.display_name as next_media_name,
      p.playlist_position,p.playback_started_at,p.error_message,p.updated_at,downloads.state as download_status
      from devices d
      left join locations l on l.id=d.location_id
      left join playback_status p on p.device_id=d.id
      left join media_assets current_media on current_media.id=p.current_asset_id
      left join media_assets next_media on next_media.id=p.next_asset_id
      left join lateral (select state from download_status where device_id=d.id order by updated_at desc limit 1) downloads on true
      order by d.name`);
    const now = new Date();
    return rows.map((row) => ({ ...row, online: isDeviceOnline(row.last_seen_at, now), stale: !isDeviceOnline(row.last_seen_at, now) }));
  });
}
