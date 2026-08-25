import assert from 'node:assert/strict';
import test from 'node:test';
import { buildApp } from '../src/app.js';
import { hashDeviceToken } from '../src/services/device-token.js';

const ADMIN_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const ORGANIZATION_A = '44444444-4444-4444-8444-444444444444';
const ORGANIZATION_B = '55555555-5555-4555-8555-555555555555';
const DEVICE_A = '11111111-1111-4111-8111-111111111111';
const DEVICE_B = '22222222-2222-4222-8222-222222222222';
const DEVICE_C = '33333333-3333-4333-8333-333333333333';
const DEVICE_FOREIGN = '66666666-6666-4666-8666-666666666666';
const TOKEN_A = 'A'.repeat(40);
const TOKEN_B = 'B'.repeat(40);

function createDb(clock) {
  const devices = [
    {
      id: DEVICE_A,
      organization_id: ORGANIZATION_A,
      name: 'TV Mercado Centro',
      status: 'active',
      address: 'Centro',
      latitude: -7.6276,
      longitude: -72.6756,
      app_version: '2.1.0',
      free_storage_bytes: 2_000_000_000,
      last_seen_at: new Date(clock().getTime() - 30_000),
      current_media_name: 'Oferta do dia',
      next_media_name: 'Noticias locais',
      download_status: 'ready',
      error_message: null,
      playback_started_at: new Date(clock().getTime() - 60_000),
    },
    {
      id: DEVICE_B,
      organization_id: ORGANIZATION_A,
      name: 'TV Farmacia',
      status: 'active',
      address: 'Avenida Principal',
      latitude: -7.63,
      longitude: -72.67,
      app_version: '2.0.9',
      free_storage_bytes: 300_000_000,
      last_seen_at: new Date(clock().getTime() - 5 * 60_000),
      current_media_name: null,
      next_media_name: null,
      download_status: 'failed',
      error_message: 'download_timeout',
      playback_started_at: null,
    },
    {
      id: DEVICE_C,
      organization_id: ORGANIZATION_A,
      name: 'TV Academia',
      status: 'active',
      address: 'Bairro Aeroporto Velho',
      latitude: -7.64,
      longitude: -72.66,
      app_version: null,
      free_storage_bytes: null,
      last_seen_at: new Date(clock().getTime() - 20 * 60_000),
      current_media_name: null,
      next_media_name: null,
      download_status: null,
      error_message: null,
      playback_started_at: null,
    },
    {
      id: DEVICE_FOREIGN,
      organization_id: ORGANIZATION_B,
      name: 'TV Fora da Rede',
      status: 'active',
      address: 'Outra organização',
      latitude: -7.7,
      longitude: -72.7,
      app_version: '2.1.0',
      free_storage_bytes: 2_000_000_000,
      last_seen_at: new Date(clock().getTime() - 30_000),
      current_media_name: 'Conteúdo externo',
      next_media_name: null,
      download_status: 'ready',
      error_message: null,
      playback_started_at: new Date(clock().getTime() - 30_000),
    },
  ];
  const commands = [];

  return {
    devices,
    commands,
    async query(sql, params = []) {
      const normalized = sql.replace(/\s+/g, ' ').trim();
      if (normalized.includes('from sessions s join admins')) {
        return { rows: [{ id: ADMIN_ID, name: 'Admin', email: 'admin@example.test' }] };
      }
      if (normalized.includes('from device_credentials c join devices d')) {
        const tokenHash = params[0];
        const id = tokenHash === hashDeviceToken(TOKEN_A) ? DEVICE_A
          : tokenHash === hashDeviceToken(TOKEN_B) ? DEVICE_B : null;
        const device = devices.find((item) => item.id === id);
        return { rows: device ? [{ ...device, credential_expires_at: null }] : [] };
      }
      if (normalized.includes('with recursive ancestors as')) {
        const organizationId = params[0];
        return {
          rows: organizationId === ORGANIZATION_A
            ? [{ id: ORGANIZATION_A, effectiveRole: 'operator', membershipOrganizationId: ORGANIZATION_A }]
            : [],
        };
      }
      if (normalized.includes('/* noc_snapshot */')) {
        const [organizationId, checkedAt] = params;
        return {
          rows: devices.filter((device) => device.organization_id === organizationId).map((device) => {
            const latest = commands.filter((command) => command.device_id === device.id)
              .sort((a, b) => b.requested_at - a.requested_at)[0];
            const pendingCommandCount = commands.filter((command) => command.device_id === device.id
              && ['queued', 'leased'].includes(command.status) && command.expires_at > checkedAt).length;
            return {
              ...device,
              pending_command_count: pendingCommandCount,
              command_id: latest?.id ?? null,
              command_type: latest?.command_type ?? null,
              command_status: latest?.status ?? null,
              command_requested_at: latest?.requested_at ?? null,
              command_acknowledged_at: latest?.acknowledged_at ?? null,
              command_outcome: latest?.outcome ?? null,
              command_error_code: latest?.error_code ?? null,
            };
          }),
        };
      }
      if (normalized.includes('/* noc_device_exists */')) {
        const [deviceId, organizationId] = params;
        return {
          rows: devices.some((device) => device.id === deviceId && device.organization_id === organizationId)
            ? [{ id: deviceId }] : [],
        };
      }
      if (normalized.includes('/* noc_enqueue */')) {
        const [id, deviceId, commandType, idempotencyKey, requestedAt, expiresAt, requestedBy] = params;
        let command = commands.find((item) => item.device_id === deviceId && item.idempotency_key === idempotencyKey);
        if (!command) {
          command = {
            id,
            device_id: deviceId,
            command_type: commandType,
            idempotency_key: idempotencyKey,
            status: 'queued',
            requested_at: requestedAt,
            expires_at: expiresAt,
            requested_by: requestedBy,
            acknowledged_at: null,
            outcome: null,
            error_code: null,
            attempt_count: 0,
            lease_token: null,
            lease_generation: 0,
          };
          commands.push(command);
        }
        return { rows: [{ ...command }] };
      }
      if (normalized.includes('/* noc_lease */')) {
        const [deviceId, checkedAt, leaseExpiresAt, leaseToken] = params;
        for (const command of commands) {
          if (command.device_id === deviceId && ['queued', 'leased'].includes(command.status)
              && command.expires_at <= checkedAt) command.status = 'expired';
        }
        const command = commands.find((item) => item.device_id === deviceId
          && (item.status === 'queued' || (item.status === 'leased' && item.lease_expires_at <= checkedAt))
          && item.expires_at > checkedAt);
        if (!command) return { rows: [] };
        command.status = 'leased';
        command.lease_expires_at = leaseExpiresAt;
        command.lease_token = leaseToken;
        command.lease_generation = (command.lease_generation ?? 0) + 1;
        command.delivered_at = checkedAt;
        command.attempt_count += 1;
        return { rows: [{ ...command }] };
      }
      if (normalized.includes('/* noc_ack_lookup */')) {
        const command = commands.find((item) => item.id === params[0] && item.device_id === params[1]);
        return { rows: command ? [{ ...command }] : [] };
      }
      if (normalized.includes('/* noc_ack_update */')) {
        const [status, outcome, errorCode, acknowledgedAt, id, deviceId, leaseToken] = params;
        const command = commands.find((item) => item.id === id && item.device_id === deviceId
          && item.lease_token === leaseToken && item.status === 'leased');
        if (!command) return { rows: [] };
        Object.assign(command, { status, outcome, error_code: errorCode, acknowledged_at: acknowledgedAt });
        return { rows: [{ ...command }] };
      }
      if (normalized.startsWith('with matched_targets as')) return { rows: [{ schedule_version: 1 }] };
      if (normalized.includes('from emergency_broadcasts')) return { rows: [] };
      return { rows: [] };
    },
  };
}

async function setup() {
  let current = new Date('2026-08-25T12:00:00.000Z');
  const clock = () => new Date(current);
  const db = createDb(clock);
  const app = buildApp({ db, now: clock, secureCookies: false });
  await app.ready();
  return {
    app,
    db,
    admin: { cookie: 'amp_session=test-session' },
    deviceA: { authorization: `Bearer ${TOKEN_A}` },
    deviceB: { authorization: `Bearer ${TOKEN_B}` },
    advance(milliseconds) { current = new Date(current.getTime() + milliseconds); },
  };
}

async function enqueue(app, headers, deviceId, commandType, idempotencyKey, organizationId = ORGANIZATION_A) {
  return app.inject({
    method: 'POST',
    url: `/api/admin/devices/${deviceId}/remote-commands`,
    headers,
    payload: { organizationId, commandType, idempotencyKey },
  });
}

test('NOC snapshot requires an accessible organization and isolates its TVs', async (t) => {
  const { app, admin } = await setup();
  t.after(() => app.close());

  assert.equal((await app.inject({ method: 'GET', url: `/api/admin/noc?organizationId=${ORGANIZATION_A}` })).statusCode, 401);
  const missingScope = await app.inject({ method: 'GET', url: '/api/admin/noc', headers: admin });
  assert.equal(missingScope.statusCode, 400);
  assert.deepEqual(missingScope.json(), { error: 'invalid_organization_id' });
  const forbidden = await app.inject({ method: 'GET', url: `/api/admin/noc?organizationId=${ORGANIZATION_B}`, headers: admin });
  assert.equal(forbidden.statusCode, 403);
  assert.deepEqual(forbidden.json(), { error: 'organization_access_denied' });

  const response = await app.inject({ method: 'GET', url: `/api/admin/noc?organizationId=${ORGANIZATION_A}`, headers: admin });

  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.json().summary, {
    total: 3,
    online: 1,
    unstable: 1,
    offline: 1,
    lowStorage: 1,
    pendingCommands: 0,
    failedCommands: 0,
  });
  assert.deepEqual(response.json().devices.map((device) => device.health), ['online', 'unstable', 'offline']);
  assert.deepEqual(response.json().devices.map((device) => device.id), [DEVICE_A, DEVICE_B, DEVICE_C]);
  assert.equal(response.json().devices[0].playbackStartedAt, '2026-08-25T11:59:00.000Z');
  assert.equal(response.json().devices[0].pendingCommandCount, 0);
  assert.deepEqual(response.json().devices[0].alerts, []);
  assert.deepEqual(response.json().devices[1].alerts, [
    'heartbeat_stale',
    'low_storage',
    'playback_error',
    'download_failed',
  ]);
  assert.deepEqual(response.json().devices[2].alerts, ['offline']);
});

test('NOC snapshot counts every pending command and treats downloading as unstable', async (t) => {
  const { app, db, admin } = await setup();
  t.after(() => app.close());
  await enqueue(app, admin, DEVICE_A, 'refresh_sync', 'pending-snapshot');

  const pending = await app.inject({ method: 'GET', url: `/api/admin/noc?organizationId=${ORGANIZATION_A}`, headers: admin });
  assert.equal(pending.statusCode, 200);
  assert.equal(pending.json().summary.pendingCommands, 1);
  assert.equal(pending.json().devices.find((device) => device.id === DEVICE_A).pendingCommandCount, 1);

  db.devices.find((device) => device.id === DEVICE_A).download_status = 'downloading';
  const downloading = await app.inject({ method: 'GET', url: `/api/admin/noc?organizationId=${ORGANIZATION_A}`, headers: admin });
  const device = downloading.json().devices.find((item) => item.id === DEVICE_A);
  assert.equal(device.health, 'unstable');
  assert.ok(device.alerts.includes('download_in_progress'));
});

test('remote command endpoint enforces organization scope, exact allowlist and deterministic errors', async (t) => {
  const { app, admin } = await setup();
  t.after(() => app.close());

  const invalidId = await enqueue(app, admin, 'not-a-uuid', 'refresh_sync', 'request-123');
  assert.equal(invalidId.statusCode, 400);
  assert.deepEqual(invalidId.json(), { error: 'invalid_request' });

  const missingScope = await app.inject({
    method: 'POST',
    url: `/api/admin/devices/${DEVICE_A}/remote-commands`,
    headers: admin,
    payload: { commandType: 'refresh_sync', idempotencyKey: 'request-123' },
  });
  assert.equal(missingScope.statusCode, 400);
  assert.deepEqual(missingScope.json(), { error: 'invalid_organization_id' });

  const invalidCommand = await enqueue(app, admin, DEVICE_A, 'open_shell', 'request-123');
  assert.equal(invalidCommand.statusCode, 400);
  assert.deepEqual(invalidCommand.json(), { error: 'invalid_command_type' });

  const missingDevice = await enqueue(app, admin, '99999999-9999-4999-8999-999999999999', 'refresh_sync', 'request-123');
  assert.equal(missingDevice.statusCode, 404);
  assert.deepEqual(missingDevice.json(), { error: 'device_not_found' });

  const foreignDevice = await enqueue(app, admin, DEVICE_FOREIGN, 'refresh_sync', 'foreign-device');
  assert.equal(foreignDevice.statusCode, 404);
  assert.deepEqual(foreignDevice.json(), { error: 'device_not_found' });

  const forbiddenOrganization = await enqueue(
    app,
    admin,
    DEVICE_FOREIGN,
    'refresh_sync',
    'forbidden-organization',
    ORGANIZATION_B,
  );
  assert.equal(forbiddenOrganization.statusCode, 403);
  assert.deepEqual(forbiddenOrganization.json(), { error: 'organization_access_denied' });
});

test('enqueue is idempotent per TV and reports pending instead of executed', async (t) => {
  const { app, db, admin } = await setup();
  t.after(() => app.close());

  for (const commandType of ['refresh_sync', 'restart_player', 'clear_media_cache']) {
    const response = await enqueue(app, admin, DEVICE_A, commandType, `request-${commandType}`);
    assert.equal(response.statusCode, 202);
    assert.equal(response.json().execution, 'pending');
    assert.equal(response.json().command.commandType, commandType);
  }
  const first = await enqueue(app, admin, DEVICE_B, 'refresh_sync', 'same-request');
  const repeated = await enqueue(app, admin, DEVICE_B, 'refresh_sync', 'same-request');
  assert.equal(first.statusCode, 202);
  assert.equal(repeated.json().command.id, first.json().command.id);
  assert.equal(db.commands.filter((command) => command.device_id === DEVICE_B).length, 1);
});

test('device sync leases only that TV command and isolates devices', async (t) => {
  const { app, admin, deviceA, deviceB } = await setup();
  t.after(() => app.close());
  await enqueue(app, admin, DEVICE_A, 'restart_player', 'isolation-a');
  await enqueue(app, admin, DEVICE_B, 'clear_media_cache', 'isolation-b');

  const syncA = await app.inject({ method: 'GET', url: '/api/device/sync', headers: deviceA });
  const syncB = await app.inject({ method: 'GET', url: '/api/device/sync', headers: deviceB });

  assert.equal(syncA.statusCode, 200);
  assert.equal(syncA.json().remoteCommand.commandType, 'restart_player');
  assert.equal(syncA.json().remoteCommand.status, 'leased');
  assert.match(syncA.json().remoteCommand.leaseToken, /^[0-9a-f-]{36}$/i);
  assert.equal(syncA.json().remoteCommand.leaseGeneration, 1);
  assert.equal(syncB.json().remoteCommand.commandType, 'clear_media_cache');
  assert.notEqual(syncA.json().remoteCommand.id, syncB.json().remoteCommand.id);
});

test('device ACK is isolated, idempotent and rejects a conflicting terminal outcome', async (t) => {
  const { app, admin, deviceA, deviceB } = await setup();
  t.after(() => app.close());
  await enqueue(app, admin, DEVICE_A, 'refresh_sync', 'ack-command');
  const sync = await app.inject({ method: 'GET', url: '/api/device/sync', headers: deviceA });
  const id = sync.json().remoteCommand.id;
  const leaseToken = sync.json().remoteCommand.leaseToken;

  const foreign = await app.inject({ method: 'POST', url: `/api/device/remote-commands/${id}/ack`, headers: deviceB, payload: { outcome: 'succeeded', leaseToken } });
  assert.equal(foreign.statusCode, 404);
  assert.deepEqual(foreign.json(), { error: 'command_not_found' });

  const first = await app.inject({ method: 'POST', url: `/api/device/remote-commands/${id}/ack`, headers: deviceA, payload: { outcome: 'succeeded', leaseToken } });
  const repeated = await app.inject({ method: 'POST', url: `/api/device/remote-commands/${id}/ack`, headers: deviceA, payload: { outcome: 'succeeded', leaseToken } });
  assert.equal(first.statusCode, 200);
  assert.equal(first.json().command.status, 'succeeded');
  assert.deepEqual(repeated.json(), first.json());

  const conflict = await app.inject({ method: 'POST', url: `/api/device/remote-commands/${id}/ack`, headers: deviceA, payload: { outcome: 'failed', errorCode: 'player_timeout', leaseToken } });
  assert.equal(conflict.statusCode, 409);
  assert.deepEqual(conflict.json(), { error: 'command_already_acknowledged' });
});

test('terminal ACK stays idempotent after expiry and rejects a stale lease token', async (t) => {
  const { app, admin, deviceA, advance } = await setup();
  t.after(() => app.close());
  await enqueue(app, admin, DEVICE_A, 'restart_player', 'lease-race');

  const firstSync = await app.inject({ method: 'GET', url: '/api/device/sync', headers: deviceA });
  const firstLease = firstSync.json().remoteCommand;
  advance(46_000);
  const secondSync = await app.inject({ method: 'GET', url: '/api/device/sync', headers: deviceA });
  const secondLease = secondSync.json().remoteCommand;
  assert.equal(secondLease.leaseGeneration, 2);
  assert.notEqual(secondLease.leaseToken, firstLease.leaseToken);

  const stale = await app.inject({
    method: 'POST',
    url: `/api/device/remote-commands/${firstLease.id}/ack`,
    headers: deviceA,
    payload: { outcome: 'succeeded', leaseToken: firstLease.leaseToken },
  });
  assert.equal(stale.statusCode, 409);
  assert.deepEqual(stale.json(), { error: 'stale_command_lease' });

  const accepted = await app.inject({
    method: 'POST',
    url: `/api/device/remote-commands/${secondLease.id}/ack`,
    headers: deviceA,
    payload: { outcome: 'succeeded', leaseToken: secondLease.leaseToken },
  });
  assert.equal(accepted.statusCode, 200);
  advance(16 * 60_000);
  const repeatedAfterExpiry = await app.inject({
    method: 'POST',
    url: `/api/device/remote-commands/${secondLease.id}/ack`,
    headers: deviceA,
    payload: { outcome: 'succeeded', leaseToken: secondLease.leaseToken },
  });
  assert.equal(repeatedAfterExpiry.statusCode, 200);
  assert.deepEqual(repeatedAfterExpiry.json(), accepted.json());
});

test('expired commands are never delivered and cannot be acknowledged', async (t) => {
  const { app, db, admin, deviceA, advance } = await setup();
  t.after(() => app.close());
  const queued = await enqueue(app, admin, DEVICE_A, 'refresh_sync', 'expires');
  const id = queued.json().command.id;
  advance(16 * 60_000);

  const sync = await app.inject({ method: 'GET', url: '/api/device/sync', headers: deviceA });
  assert.equal(sync.statusCode, 200);
  assert.equal(sync.json().remoteCommand, null);
  assert.equal(db.commands.find((command) => command.id === id).status, 'expired');

  const ack = await app.inject({
    method: 'POST',
    url: `/api/device/remote-commands/${id}/ack`,
    headers: deviceA,
    payload: { outcome: 'succeeded', leaseToken: '77777777-7777-4777-8777-777777777777' },
  });
  assert.equal(ack.statusCode, 409);
  assert.deepEqual(ack.json(), { error: 'command_expired' });
});
