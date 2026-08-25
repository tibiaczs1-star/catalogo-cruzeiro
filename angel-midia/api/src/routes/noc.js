import { randomUUID } from 'node:crypto';
import { requireAdmin } from '../auth.js';
import { authenticateDevice } from '../services/device-token.js';
import { findOrganizationAccess, UUID } from '../services/organization-access.js';

const COMMAND_TYPES = new Set(['refresh_sync', 'restart_player', 'clear_media_cache']);
const OUTCOMES = new Set(['succeeded', 'failed']);
const IDEMPOTENCY_KEY_PATTERN = /^[A-Za-z0-9._:-]{1,128}$/;
const ERROR_CODE_PATTERN = /^[a-z0-9._:-]{1,120}$/;
const COMMAND_TTL_MS = 15 * 60_000;
const COMMAND_LEASE_MS = 45_000;
const ONLINE_WINDOW_MS = 90_000;
const OFFLINE_WINDOW_MS = 10 * 60_000;
const LOW_STORAGE_BYTES = 512 * 1024 * 1024;

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isUuid(value) {
  return typeof value === 'string' && UUID.test(value);
}

function commandResponse(row) {
  return {
    id: row.id,
    deviceId: row.device_id,
    commandType: row.command_type,
    status: row.status,
    requestedAt: new Date(row.requested_at).toISOString(),
    expiresAt: new Date(row.expires_at).toISOString(),
    deliveredAt: row.delivered_at ? new Date(row.delivered_at).toISOString() : null,
    acknowledgedAt: row.acknowledged_at ? new Date(row.acknowledged_at).toISOString() : null,
    outcome: row.outcome ?? null,
    errorCode: row.error_code ?? null,
    attemptCount: Number(row.attempt_count ?? 0),
    leaseToken: row.lease_token ?? null,
    leaseGeneration: Number(row.lease_generation ?? 0),
  };
}

async function requireDevice(request, reply) {
  const device = await authenticateDevice(request);
  if (!device) return reply.code(401).send({ error: 'invalid_device_credential' });
  if (device.status !== 'active') return reply.code(403).send({ error: 'device_not_active' });
  if (device.credential_expires_at) return reply.code(403).send({ error: 'credential_claim_required' });
  request.device = device;
}

function classifyHealth(row, checkedAt) {
  const lastSeenAt = row.last_seen_at ? new Date(row.last_seen_at) : null;
  const lastSeenAge = lastSeenAt && Number.isFinite(lastSeenAt.getTime())
    ? checkedAt.getTime() - lastSeenAt.getTime()
    : Number.POSITIVE_INFINITY;
  if (row.status !== 'active' || lastSeenAge > OFFLINE_WINDOW_MS) return 'offline';
  const lowStorage = row.free_storage_bytes !== null
    && row.free_storage_bytes !== undefined
    && Number(row.free_storage_bytes) < LOW_STORAGE_BYTES;
  if (lastSeenAge > ONLINE_WINDOW_MS
    || lowStorage
    || row.error_message
    || row.download_status === 'failed'
    || row.download_status === 'downloading') {
    return 'unstable';
  }
  return 'online';
}

function snapshotDevice(row, checkedAt) {
  const health = classifyHealth(row, checkedAt);
  const lastSeenAt = row.last_seen_at ? new Date(row.last_seen_at) : null;
  const lastSeenAge = lastSeenAt && Number.isFinite(lastSeenAt.getTime())
    ? checkedAt.getTime() - lastSeenAt.getTime()
    : Number.POSITIVE_INFINITY;
  const alerts = [];
  if (health === 'offline') {
    alerts.push('offline');
  } else {
    if (lastSeenAge > ONLINE_WINDOW_MS) alerts.push('heartbeat_stale');
    if (row.free_storage_bytes !== null
      && row.free_storage_bytes !== undefined
      && Number(row.free_storage_bytes) < LOW_STORAGE_BYTES) alerts.push('low_storage');
    if (row.playback_error_message ?? row.error_message) alerts.push('playback_error');
    if (row.download_status === 'failed') alerts.push('download_failed');
    if (row.download_status === 'downloading') alerts.push('download_in_progress');
    if (['failed', 'expired'].includes(row.command_status)) alerts.push('command_failed');
  }
  return {
    id: row.id,
    name: row.name,
    status: row.status,
    address: row.address ?? row.location ?? null,
    latitude: row.latitude == null ? null : Number(row.latitude),
    longitude: row.longitude == null ? null : Number(row.longitude),
    appVersion: row.app_version ?? null,
    freeStorageBytes: row.free_storage_bytes == null ? null : Number(row.free_storage_bytes),
    lastSeenAt: row.last_seen_at ? new Date(row.last_seen_at).toISOString() : null,
    health,
    online: health === 'online',
    currentMediaName: row.current_media_name ?? null,
    nextMediaName: row.next_media_name ?? null,
    downloadStatus: row.download_status ?? null,
    errorMessage: row.error_message ?? null,
    playbackStartedAt: row.playback_started_at ? new Date(row.playback_started_at).toISOString() : null,
    pendingCommandCount: Number(row.pending_command_count ?? 0),
    alerts,
    latestCommand: row.command_id ? {
      id: row.command_id,
      commandType: row.command_type,
      status: row.command_status,
      requestedAt: row.command_requested_at ? new Date(row.command_requested_at).toISOString() : null,
      acknowledgedAt: row.command_acknowledged_at ? new Date(row.command_acknowledged_at).toISOString() : null,
      outcome: row.command_outcome ?? null,
      errorCode: row.command_error_code ?? null,
    } : null,
  };
}

export async function leaseNextRemoteCommand(db, deviceId, checkedAt = new Date()) {
  const leaseExpiresAt = new Date(checkedAt.getTime() + COMMAND_LEASE_MS);
  const leaseToken = randomUUID();
  const { rows } = await db.query(
    `/* noc_lease */
     with expired as (
       update device_remote_commands
          set status = 'expired', lease_expires_at = null
        where device_id = $1
          and status in ('queued', 'leased')
          and expires_at <= $2
     ), candidate as (
       select id
         from device_remote_commands
        where device_id = $1
          and expires_at > $2
          and (status = 'queued' or (status = 'leased' and lease_expires_at <= $2))
        order by requested_at, id
        for update skip locked
        limit 1
     )
     update device_remote_commands command
        set status = 'leased',
            lease_expires_at = $3,
            lease_token = $4,
            lease_generation = command.lease_generation + 1,
            delivered_at = coalesce(command.delivered_at, $2),
            attempt_count = command.attempt_count + 1
       from candidate
      where command.id = candidate.id
      returning command.*`,
    [deviceId, checkedAt, leaseExpiresAt, leaseToken],
  );
  return rows[0] ? commandResponse(rows[0]) : null;
}

export default async function nocRoutes(app, options = {}) {
  const now = options.now ?? (() => new Date());

  app.get('/api/admin/noc', { preHandler: requireAdmin }, async (request, reply) => {
    const organizationId = request.query?.organizationId;
    if (!isUuid(organizationId)) return reply.code(400).send({ error: 'invalid_organization_id' });
    const access = await findOrganizationAccess(app.db, request.admin.id, organizationId);
    if (!access) return reply.code(403).send({ error: 'organization_access_denied' });
    const checkedAt = now();
    const { rows } = await app.db.query(
      `/* noc_snapshot */
       with recursive organization_tree as (
         select id from organizations where id = $1 and status = 'active'
         union all
         select child.id
           from organizations child
           join organization_tree parent on child.parent_id = parent.id
          where child.status = 'active'
       )
       select d.id, d.name, d.status, d.last_seen_at, d.free_storage_bytes, d.app_version,
              l.address, l.latitude, l.longitude,
              current_media.display_name as current_media_name,
              next_media.display_name as next_media_name,
              playback.playback_started_at,
              playback.error_message as playback_error_message,
              coalesce(playback.error_message, downloads.error_message) as error_message,
              downloads.state as download_status,
              coalesce(pending_commands.count, 0)::int as pending_command_count,
              command.id as command_id,
              command.command_type,
              command.status as command_status,
              command.requested_at as command_requested_at,
              command.acknowledged_at as command_acknowledged_at,
              command.outcome as command_outcome,
              command.error_code as command_error_code
         from devices d
         join organization_tree scope on scope.id = d.organization_id
         left join locations l on l.id = d.location_id
         left join playback_status playback on playback.device_id = d.id
         left join media_assets current_media on current_media.id = playback.current_asset_id
         left join media_assets next_media on next_media.id = playback.next_asset_id
         left join lateral (
           select state, error_message from download_status where device_id = d.id order by updated_at desc limit 1
         ) downloads on true
         left join lateral (
           select id, command_type, status, requested_at, acknowledged_at, outcome, error_code
             from device_remote_commands
            where device_id = d.id
            order by requested_at desc, id desc
            limit 1
         ) command on true
         left join lateral (
           select count(*)::int as count
             from device_remote_commands pending
            where pending.device_id = d.id
              and pending.status in ('queued', 'leased')
              and pending.expires_at > $2
         ) pending_commands on true
        order by d.name, d.id`,
      [organizationId, checkedAt],
    );
    const devices = rows.map((row) => snapshotDevice(row, checkedAt));
    const summary = {
      total: devices.length,
      online: devices.filter((device) => device.health === 'online').length,
      unstable: devices.filter((device) => device.health === 'unstable').length,
      offline: devices.filter((device) => device.health === 'offline').length,
      lowStorage: devices.filter((device) => device.freeStorageBytes !== null && device.freeStorageBytes < LOW_STORAGE_BYTES).length,
      pendingCommands: devices.reduce((total, device) => total + device.pendingCommandCount, 0),
      failedCommands: devices.filter((device) => ['failed', 'expired'].includes(device.latestCommand?.status)).length,
    };
    return reply.send({ generatedAt: checkedAt.toISOString(), summary, devices });
  });

  app.post('/api/admin/devices/:id/remote-commands', { preHandler: requireAdmin }, async (request, reply) => {
    if (!isUuid(request.params.id)) return reply.code(400).send({ error: 'invalid_request' });
    const body = request.body;
    if (!isObject(body)
      || !Object.keys(body).every((key) => ['organizationId', 'commandType', 'idempotencyKey'].includes(key))
      || typeof body.commandType !== 'string'
      || typeof body.idempotencyKey !== 'string') {
      return reply.code(400).send({ error: 'invalid_request' });
    }
    if (!isUuid(body.organizationId)) return reply.code(400).send({ error: 'invalid_organization_id' });
    if (!COMMAND_TYPES.has(body.commandType)) return reply.code(400).send({ error: 'invalid_command_type' });
    if (!IDEMPOTENCY_KEY_PATTERN.test(body.idempotencyKey ?? '')) {
      return reply.code(400).send({ error: 'invalid_request' });
    }
    const access = await findOrganizationAccess(app.db, request.admin.id, body.organizationId);
    if (!access) return reply.code(403).send({ error: 'organization_access_denied' });
    const found = await app.db.query(
      `/* noc_device_exists */
       with recursive organization_tree as (
         select id from organizations where id = $2 and status = 'active'
         union all
         select child.id
           from organizations child
           join organization_tree parent on child.parent_id = parent.id
          where child.status = 'active'
       )
       select device.id
         from devices device
         join organization_tree scope on scope.id = device.organization_id
        where device.id = $1`,
      [request.params.id, body.organizationId],
    );
    if (!found.rows[0]) return reply.code(404).send({ error: 'device_not_found' });

    const requestedAt = now();
    const expiresAt = new Date(requestedAt.getTime() + COMMAND_TTL_MS);
    const { rows } = await app.db.query(
      `/* noc_enqueue */
       insert into device_remote_commands
         (id, device_id, command_type, idempotency_key, requested_at, expires_at, requested_by)
       values ($1, $2, $3, $4, $5, $6, $7)
       on conflict (device_id, idempotency_key) do update
         set idempotency_key = excluded.idempotency_key
       returning *`,
      [randomUUID(), request.params.id, body.commandType, body.idempotencyKey, requestedAt, expiresAt, request.admin.id],
    );
    if (rows[0].command_type !== body.commandType) {
      return reply.code(409).send({ error: 'idempotency_conflict' });
    }
    return reply.code(202).send({ execution: 'pending', command: commandResponse(rows[0]) });
  });

  app.post('/api/device/remote-commands/:id/ack', { preHandler: requireDevice }, async (request, reply) => {
    if (!isUuid(request.params.id)) return reply.code(400).send({ error: 'invalid_request' });
    const body = request.body;
    if (!isObject(body)
      || !Object.keys(body).every((key) => ['outcome', 'errorCode', 'leaseToken'].includes(key))
      || !OUTCOMES.has(body.outcome)
      || !isUuid(body.leaseToken)) {
      return reply.code(400).send({ error: 'invalid_request' });
    }
    const normalizedErrorCode = body.errorCode ?? null;
    if ((body.outcome === 'succeeded' && normalizedErrorCode !== null)
      || (body.outcome === 'failed' && !ERROR_CODE_PATTERN.test(normalizedErrorCode ?? ''))) {
      return reply.code(400).send({ error: 'invalid_request' });
    }
    const lookup = await app.db.query(
      '/* noc_ack_lookup */ select * from device_remote_commands where id = $1 and device_id = $2',
      [request.params.id, request.device.id],
    );
    const command = lookup.rows[0];
    if (!command) return reply.code(404).send({ error: 'command_not_found' });
    const acknowledgedAt = now();
    if (command.status === 'succeeded' || command.status === 'failed') {
      if (command.lease_token !== body.leaseToken) {
        return reply.code(409).send({ error: 'stale_command_lease' });
      }
      if (command.outcome === body.outcome && (command.error_code ?? null) === normalizedErrorCode) {
        return reply.send({ command: commandResponse(command) });
      }
      return reply.code(409).send({ error: 'command_already_acknowledged' });
    }
    if (command.status === 'expired' || new Date(command.expires_at) <= acknowledgedAt) {
      if (command.status !== 'expired') {
        await app.db.query(
          `update device_remote_commands
              set status = 'expired', lease_expires_at = null
            where id = $1 and device_id = $2 and status in ('queued', 'leased')`,
          [request.params.id, request.device.id],
        );
      }
      return reply.code(409).send({ error: 'command_expired' });
    }
    if (command.lease_token !== body.leaseToken) {
      return reply.code(409).send({ error: 'stale_command_lease' });
    }
    if (command.status !== 'leased') return reply.code(409).send({ error: 'command_not_delivered' });

    const updated = await app.db.query(
      `/* noc_ack_update */
       update device_remote_commands
          set status = $1, outcome = $2, error_code = $3, acknowledged_at = $4, lease_expires_at = null
        where id = $5 and device_id = $6 and status = 'leased' and lease_token = $7
        returning *`,
      [body.outcome, body.outcome, normalizedErrorCode, acknowledgedAt, request.params.id, request.device.id, body.leaseToken],
    );
    if (!updated.rows[0]) return reply.code(409).send({ error: 'command_state_changed' });
    return reply.send({ command: commandResponse(updated.rows[0]) });
  });
}
