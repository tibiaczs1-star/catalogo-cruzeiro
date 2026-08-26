import { randomBytes, randomUUID } from 'node:crypto';
import { requireAdmin } from '../auth.js';
import { authenticateDevice, generateDeviceToken, hashDeviceToken, readBearer } from '../services/device-token.js';
import { resolveSchedule } from '../services/schedule.js';
import { applyDynamicContext, loadDynamicPlaybackContext } from '../services/dynamic-cycle.js';
import { leaseNextRemoteCommand } from './noc.js';

const ACTIVATION_TTL_MS = 24 * 60 * 60 * 1000;
const LINK_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const LINK_CODE_ATTEMPTS = 20;
const CLAIM_WINDOW_MS = 10 * 60 * 1000;

function defaultLinkCode() {
  const bytes = randomBytes(6);
  let suffix = '';
  for (const byte of bytes) suffix += LINK_ALPHABET[byte % LINK_ALPHABET.length];
  return `AMP-${suffix}`;
}

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function validText(value, max) {
  return typeof value === 'string' && value.trim().length > 0 && value.trim().length <= max;
}

function validCoordinates(latitude, longitude) {
  return typeof latitude === 'number' && Number.isFinite(latitude) && latitude >= -90 && latitude <= 90
    && typeof longitude === 'number' && Number.isFinite(longitude) && longitude >= -180 && longitude <= 180;
}

export function validActivation(body) {
  const hasLatitude = body?.latitude !== undefined && body?.latitude !== null;
  const hasLongitude = body?.longitude !== undefined && body?.longitude !== null;
  return isObject(body)
    && Object.keys(body).every((key) => ['installationId', 'name', 'address', 'latitude', 'longitude'].includes(key))
    && validText(body.installationId, 255)
    && validText(body.name, 160)
    && validText(body.address, 500)
    && (hasLatitude === hasLongitude)
    && (!hasLatitude || validCoordinates(body.latitude, body.longitude));
}

export function activationResponse({ linkCode, deviceToken }) {
  return { status: 'active', linkCode, deviceToken };
}

function nextLinkCode(generate) {
  const code = generate();
  if (!/^AMP-[A-Z0-9]{6}$/.test(code)) throw new Error('invalid link code generator output');
  return code;
}

const isUuid = (value) => typeof value === 'string' && UUID_PATTERN.test(value);

async function issueCredential(db, deviceId, { expiresAt = null } = {}) {
  const token = generateDeviceToken();
  await db.query(
    `insert into device_credentials (id, device_id, token_hash, expires_at)
     values ($1, $2, $3, $4)`,
    [randomUUID(), deviceId, hashDeviceToken(token), expiresAt],
  );
  return token;
}

async function requireDevice(request, reply) {
  const device = await authenticateDevice(request);
  if (!device) return reply.code(401).send({ error: 'invalid_device_credential' });
  request.device = device;
}

function publicDevice(device, now) {
  const lastSeen = device.last_seen_at ? new Date(device.last_seen_at) : null;
  return {
    id: device.id,
    name: device.name,
    organizationId: device.organization_id ?? null,
    locationId: device.location_id ?? null,
    address: device.address ?? device.location_label ?? null,
    latitude: device.latitude == null ? null : Number(device.latitude),
    longitude: device.longitude == null ? null : Number(device.longitude),
    status: device.status,
    linkCode: device.link_code,
    groupId: device.group_id ?? null,
    appVersion: device.app_version ?? null,
    freeStorageBytes: device.free_storage_bytes == null ? null : Number(device.free_storage_bytes),
    lastSeenAt: lastSeen?.toISOString() ?? null,
    online: Boolean(lastSeen && now.getTime() - lastSeen.getTime() <= 90_000),
  };
}

export async function inTransaction(db, operation) {
  if (typeof db.connect !== 'function') return operation(db);
  const client = await db.connect();
  try {
    await client.query('begin');
    const result = await operation(client);
    await client.query('commit');
    return result;
  } catch (error) {
    try { await client.query('rollback'); } catch { /* preserve the primary failure */ }
    throw error;
  } finally {
    client.release();
  }
}

export default async function deviceRoutes(app, options) {
  const now = options.now ?? (() => new Date());
  const linkCodeGenerator = options.linkCodeGenerator ?? defaultLinkCode;
  const activationRateLimiter = options.activationRateLimiter;

  app.post('/api/devices/activate', async (request, reply) => {
    if (!validActivation(request.body)) return reply.code(400).send({ error: 'invalid_request' });
    const body = request.body;
    const installationId = body.installationId.trim();
    if (activationRateLimiter && !(await activationRateLimiter.consume({ ip: request.ip, installationId }))) {
      return reply.code(429).send({ error: 'rate_limited' });
    }
    const authenticated = await authenticateDevice(request);

    let created;
    for (let attempt = 0; attempt < LINK_CODE_ATTEMPTS; attempt += 1) {
      try {
        created = await inTransaction(app.db, async (db) => {
          const found = await db.query(
            `select d.*, l.label as location_label, l.address, l.latitude, l.longitude
               from devices d left join locations l on l.id = d.location_id
              where d.installation_id = $1 for update of d`,
            [installationId],
          );
          const existing = found.rows[0];
          if (existing) {
            if (!authenticated || authenticated.id !== existing.id || existing.status !== 'pending') {
              const conflict = new Error('installation already registered');
              conflict.code = 'INSTALLATION_CONFLICT';
              throw conflict;
            }
            await db.query('select id from locations where id = $1 for update', [existing.location_id]);
            await db.query(
              `update locations set label = $2, address = $3, latitude = $4, longitude = $5, updated_at = now()
                where id = $1`,
              [existing.location_id, body.address.trim(), body.address.trim(), body.latitude ?? null, body.longitude ?? null],
            );
            await db.query('update devices set name = $2, location_id = $3, updated_at = now() where id = $1 returning *', [existing.id, body.name.trim(), existing.location_id]);
            return { existing: true, linkCode: existing.link_code };
          }
          const locationId = randomUUID();
          const deviceId = randomUUID();
          const linkCode = nextLinkCode(linkCodeGenerator);
          await db.query(
            `insert into locations (id, label, address, latitude, longitude)
             values ($1, $2, $3, $4, $5) returning id`,
            [locationId, body.address.trim(), body.address.trim(), body.latitude ?? null, body.longitude ?? null],
          );
          const inserted = await db.query(
            `insert into devices (id, installation_id, location_id, name, link_code, status, approved_at)
             values ($1, $2, $3, $4, $5, 'active', now())
             on conflict (installation_id) do nothing
             returning *`,
            [deviceId, installationId, locationId, body.name.trim(), linkCode],
          );
          if (!inserted.rows[0]) {
            const conflict = new Error('installation already registered');
            conflict.code = 'INSTALLATION_CONFLICT';
            throw conflict;
          }
          const deviceToken = await issueCredential(db, deviceId);
          return { linkCode, deviceToken };
        });
        break;
      } catch (error) {
        if (error?.code === '23505' && error.constraint === 'devices_link_code_key') continue;
        if (error?.code === 'INSTALLATION_CONFLICT'
          || (error?.code === '23505' && error.constraint === 'devices_installation_id_key')) {
          return reply.code(409).send({ error: 'installation_registered' });
        }
        throw error;
      }
    }
    if (!created) throw new Error('could not allocate link code');
    if (created.existing) return reply.send({ status: 'pending', linkCode: created.linkCode });
    return reply.code(201).send(activationResponse(created));
  });

  app.get('/api/admin/devices', { preHandler: requireAdmin }, async (_request, reply) => {
    const { rows } = await app.db.query(
      `select d.id, d.name, d.organization_id, d.location_id, d.status, d.link_code, d.app_version, d.free_storage_bytes,
              d.last_seen_at, l.address, l.label as location_label, l.latitude, l.longitude, gd.group_id
         from devices d left join locations l on l.id = d.location_id
         left join group_devices gd on gd.device_id = d.id
        order by (d.status = 'pending') desc, d.name`,
    );
    return reply.send(rows.map((device) => publicDevice(device, now())));
  });

  app.post('/api/admin/devices/:id/approve', { preHandler: requireAdmin }, async (request, reply) => {
    if (!isUuid(request.params.id)) return reply.code(400).send({ error: 'invalid_request' });
    const approved = await inTransaction(app.db, async (db) => {
      const { rows } = await db.query('select d.id, d.status from devices d where d.id = $1 for update', [request.params.id]);
      if (!rows[0]) return null;
      const credential = await db.query(
        'select id from device_credentials where device_id = $1 order by (revoked_at is null) desc, created_at desc, id desc limit 1 for update',
        [rows[0].id],
      );
      if (!credential.rows[0]) return false;
      await db.query(
        'update device_credentials set claim_authorized_until = $2 where id = $1',
        [credential.rows[0].id, new Date(now().getTime() + CLAIM_WINDOW_MS)],
      );
      await db.query("update devices set status = 'active', approved_at = now(), updated_at = now() where id = $1 returning *", [rows[0].id]);
      return true;
    });
    if (!approved) return reply.code(404).send({ error: 'device_not_found' });
    return reply.send({ status: 'active' });
  });

  app.post('/api/device/claim', async (request, reply) => {
    const presentedToken = readBearer(request);
    if (!presentedToken) return reply.code(401).send({ error: 'invalid_device_credential' });
    const result = await inTransaction(app.db, async (db) => {
      const locked = await db.query(
        `select d.id, d.status, c.id as credential_id, c.expires_at, c.revoked_at, c.claim_authorized_until
           from device_credentials c join devices d on d.id = c.device_id
          where c.token_hash = $1 for update of c, d`,
        [hashDeviceToken(presentedToken)],
      );
      const row = locked.rows[0];
      if (!row) return { error: 'invalid_device_credential', statusCode: 401 };
      const checkedAt = now();
      const authorizedUntil = row.claim_authorized_until && new Date(row.claim_authorized_until);
      // expires_at e relido sob o mesmo lock. Uma aprovacao posterior explicita
      // autoriza recuperacao inclusive do temporario expirado ou token bloqueado.
      const credentialExpired = row.expires_at && new Date(row.expires_at) <= checkedAt;
      const recoveryAuthorized = authorizedUntil && authorizedUntil > checkedAt;
      if (!recoveryAuthorized) {
        if (row.status === 'pending' && !row.revoked_at && !credentialExpired) {
          return { error: 'pending_approval', statusCode: 403 };
        }
        return { error: 'invalid_device_credential', statusCode: 401 };
      }
      if (row.status !== 'active') return { error: 'device_blocked', statusCode: 403 };
      const revoked = await db.query(
        'update device_credentials set revoked_at = now(), claim_authorized_until = null where id = $1 and claim_authorized_until > now() returning id',
        [row.credential_id],
      );
      if (!revoked.rows[0]) return { error: 'invalid_device_credential', statusCode: 401 };
      return { deviceToken: await issueCredential(db, row.id) };
    });
    if (result.error) return reply.code(result.statusCode).send({ error: result.error });
    return reply.send({ status: 'active', deviceToken: result.deviceToken });
  });

  app.post('/api/admin/devices/:id/block', { preHandler: requireAdmin }, async (request, reply) => {
    if (!isUuid(request.params.id)) return reply.code(400).send({ error: 'invalid_request' });
    const blocked = await inTransaction(app.db, async (db) => {
      const { rows } = await db.query('select d.id, d.status from devices d where d.id = $1 for update', [request.params.id]);
      if (!rows[0]) return false;
      await db.query('update device_credentials set revoked_at = now(), claim_authorized_until = null where device_id = $1 and revoked_at is null', [rows[0].id]);
      await db.query("update devices set status = 'blocked', updated_at = now() where id = $1 returning *", [rows[0].id]);
      return true;
    });
    if (!blocked) return reply.code(404).send({ error: 'device_not_found' });
    return reply.send({ status: 'blocked' });
  });

  app.patch('/api/admin/devices/:id', { preHandler: requireAdmin }, async (request, reply) => {
    if (!isUuid(request.params.id)) return reply.code(400).send({ error: 'invalid_request' });
    const body = request.body;
    const allowed = ['name', 'address', 'latitude', 'longitude', 'groupId'];
    if (!isObject(body) || Object.keys(body).length === 0 || !Object.keys(body).every((key) => allowed.includes(key))) {
      return reply.code(400).send({ error: 'invalid_request' });
    }
    if (body.groupId !== undefined && body.groupId !== null && !isUuid(body.groupId)) {
      return reply.code(400).send({ error: 'invalid_request' });
    }
    let result;
    try {
      result = await inTransaction(app.db, async (db) => {
        const { rows } = await db.query(
          `select d.*, l.label as location_label, l.address, l.latitude, l.longitude, gd.group_id
             from devices d left join locations l on l.id = d.location_id
             left join group_devices gd on gd.device_id = d.id
            where d.id = $1 for update of d`, [request.params.id]);
        const device = rows[0];
        if (!device) return { error: 'device_not_found', statusCode: 404 };
        await db.query('select id from locations where id = $1 for update', [device.location_id]);
        const name = body.name ?? device.name;
        const address = body.address ?? device.address ?? device.location_label;
        const latitude = body.latitude ?? device.latitude;
        const longitude = body.longitude ?? device.longitude;
        const hasLatitude = latitude !== undefined && latitude !== null;
        const hasLongitude = longitude !== undefined && longitude !== null;
        if (!validText(name, 160) || !validText(address, 500)
          || hasLatitude !== hasLongitude
          || (hasLatitude && !validCoordinates(Number(latitude), Number(longitude)))) {
          return { error: 'invalid_request', statusCode: 400 };
        }
        if (body.groupId !== undefined && body.groupId !== null) {
          const group = await db.query('select id from groups where id = $1 for key share', [body.groupId]);
          if (!group.rows[0]) return { error: 'invalid_group', statusCode: 400 };
        }
        await db.query(
          'update locations set label = $2, address = $3, latitude = $4, longitude = $5, updated_at = now() where id = $1',
          [device.location_id, address.trim(), address.trim(), hasLatitude ? Number(latitude) : null, hasLongitude ? Number(longitude) : null],
        );
        await db.query('update devices set name = $2, location_id = $3, updated_at = now() where id = $1 returning *', [device.id, name.trim(), device.location_id]);
        if (body.groupId !== undefined) {
          await db.query('delete from group_devices where device_id = $1', [device.id]);
          if (body.groupId !== null) await db.query('insert into group_devices (device_id, group_id) values ($1, $2)', [device.id, body.groupId]);
        }
        return { response: { id: device.id, name: name.trim(), address: address.trim(), latitude, longitude, groupId: body.groupId !== undefined ? body.groupId : (device.group_id ?? null) } };
      });
    } catch (error) {
      if (error?.code === '23503' && body.groupId !== undefined) return reply.code(400).send({ error: 'invalid_group' });
      throw error;
    }
    if (result.error) return reply.code(result.statusCode).send({ error: result.error });
    return reply.send(result.response);
  });

  app.post('/api/device/heartbeat', { preHandler: requireDevice }, async (request, reply) => {
    const body = request.body;
    if (!isObject(body) || !validText(body.appVersion, 80) || !Number.isSafeInteger(body.freeStorageBytes) || body.freeStorageBytes < 0
      || !Object.keys(body).every((key) => ['appVersion', 'freeStorageBytes'].includes(key))) {
      return reply.code(400).send({ error: 'invalid_request' });
    }
    if (request.device.status !== 'active') return reply.code(403).send({ error: request.device.status === 'pending' ? 'pending_approval' : 'device_blocked' });
    if (request.device.credential_expires_at) return reply.code(403).send({ error: 'credential_claim_required' });
    await app.db.query(
      'update devices set app_version = $2, free_storage_bytes = $3, last_seen_at = now(), updated_at = now() where id = $1',
      [request.device.id, body.appVersion.trim(), body.freeStorageBytes],
    );
    return reply.code(204).send();
  });

  app.get('/api/device/sync', { preHandler: requireDevice }, async (request, reply) => {
    if (request.device.status === 'pending') return reply.code(403).send({ error: 'pending_approval' });
    if (request.device.status !== 'active') return reply.code(403).send({ error: 'device_blocked' });
    if (request.device.credential_expires_at) return reply.code(403).send({ error: 'credential_claim_required' });
    const baseSchedule = await resolveSchedule(app.db, request.device);
    let schedule = baseSchedule;
    try {
      schedule = applyDynamicContext(baseSchedule, await loadDynamicPlaybackContext(app.db));
    } catch (error) {
      request.log?.warn?.({ error }, 'dynamic playback context unavailable');
    }
    const emergencyResult = await app.db.query(`select e.id,e.mode,e.title,e.message,e.asset_id,m.content_type,m.sha256,m.duration_seconds,m.fit_mode,m.focal_x,m.focal_y,m.zoom,m.rotation,m.background_color from emergency_broadcasts e left join media_assets m on m.id=e.asset_id where e.active order by e.activated_at desc limit 1`);
    const remoteCommand = await leaseNextRemoteCommand(app.db, request.device.id, now());
    return reply.send({
      status: 'active',
      schedule,
      emergency: emergencyResult.rows[0] ?? null,
      remoteCommand,
    });
  });
}
