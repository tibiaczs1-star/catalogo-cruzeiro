import { createHash, randomUUID } from 'node:crypto';
import { requireAdmin } from '../auth.js';
import { authenticateDevice } from '../services/device-token.js';
import { validateScheduleInput } from '../services/schedule.js';
import { inTransaction } from './devices.js';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const EVENT_TYPE = /^[a-z][a-z0-9_]{0,63}$/;
const EVENT_MAX_AGE_MS = 90 * 24 * 60 * 60 * 1000;
const EVENT_MAX_FUTURE_MS = 24 * 60 * 60 * 1000;
async function requireActiveDevice(request, reply) {
  const device = await authenticateDevice(request);
  if (!device) return reply.code(401).send({ error: 'invalid_device_credential' });
  if (device.status !== 'active') return reply.code(403).send({ error: device.status === 'pending' ? 'pending_approval' : 'device_blocked' });
  if (device.credential_expires_at) return reply.code(403).send({ error: 'credential_claim_required' });
  request.device = device;
}

export default async function scheduleRoutes(app) {
  app.post('/api/admin/schedules', { preHandler: requireAdmin }, async (request, reply) => {
    const parsed = validateScheduleInput(request.body);
    if (!parsed.ok) return reply.code(400).send({ error: 'invalid_request' });
    const body = parsed.value;
    const canonical = JSON.stringify([body.campaignId, body.target.type, body.target.id, body.startsAt, body.endsAt, body.priority]);
    const requestHash = createHash('sha256').update(canonical).digest('hex');
    const result = await inTransaction(app.db, async (db) => {
      await db.query('select pg_advisory_xact_lock(hashtext($1))', [requestHash]);
      const campaign = await db.query('select id, status from campaigns where id = $1 for key share', [body.campaignId]);
      if (!campaign.rows[0]) return { error: 'campaign_not_found', status: 404 };
      if (campaign.rows[0].status !== 'approved') return { error: 'campaign_not_approved', status: 409 };
      const existing = await db.query(`select s.id from schedules s join schedule_targets st on st.schedule_id=s.id where s.campaign_id=$1 and s.starts_at=$2 and s.ends_at=$3 and s.priority=$4 and st.target_type=$5 and st.device_id is not distinct from $6 and st.group_id is not distinct from $7 limit 1`, [body.campaignId, body.startsAt, body.endsAt, body.priority, body.target.type, body.target.type === 'device' ? body.target.id : null, body.target.type === 'group' ? body.target.id : null]);
      if (existing.rows[0]) return { id: existing.rows[0].id, duplicate: true };
      if (body.target.type !== 'all') {
        const table = body.target.type === 'device' ? 'devices' : 'groups';
        const target = await db.query(`select id from ${table} where id=$1 for key share`, [body.target.id]);
        if (!target.rows[0]) return { error: 'target_not_found', status: 404 };
      }
      const id = randomUUID();
      await db.query('insert into schedules (id,campaign_id,starts_at,ends_at,priority,created_by) values ($1,$2,$3,$4,$5,$6)', [id, body.campaignId, body.startsAt, body.endsAt, body.priority, request.admin.id]);
      await db.query('insert into schedule_targets (id,schedule_id,target_type,device_id,group_id) values ($1,$2,$3,$4,$5)', [randomUUID(), id, body.target.type, body.target.type === 'device' ? body.target.id : null, body.target.type === 'group' ? body.target.id : null]);
      const affected = await db.query(`update devices d set schedule_version=d.schedule_version+1, updated_at=now() where ($1='all') or ($1='device' and d.id=$2) or ($1='group' and exists(select 1 from group_devices gd where gd.device_id=d.id and gd.group_id=$2)) returning d.id,d.schedule_version`, [body.target.type, body.target.id]);
      for (const device of affected.rows) await db.query('insert into device_commands (id,device_id,version,command_type,payload) values ($1,$2,$3,$4,$5)', [randomUUID(), device.id, device.schedule_version, 'schedule_changed', JSON.stringify({ scheduleId: id })]);
      return { id, duplicate: false, affectedDevices: affected.rows.length };
    });
    if (result.error) return reply.code(result.status).send({ error: result.error });
    return reply.code(result.duplicate ? 200 : 201).send(result);
  });

  app.post('/api/device/events', { preHandler: requireActiveDevice }, async (request, reply) => {
    const events = request.body;
    if (!Array.isArray(events) || events.length < 1 || events.length > 100) return reply.code(400).send({ error: 'invalid_request' });
    for (const event of events) {
      const occurredAt = new Date(event?.occurredAt).getTime();
      if (!event || Object.keys(event).some((key) => !['eventId', 'assetId', 'type', 'occurredAt', 'detail'].includes(key)) || !UUID.test(event.eventId ?? '') || (event.assetId !== null && !UUID.test(event.assetId ?? '')) || typeof event.type !== 'string' || !EVENT_TYPE.test(event.type) || !Number.isFinite(occurredAt) || occurredAt < Date.now() - EVENT_MAX_AGE_MS || occurredAt > Date.now() + EVENT_MAX_FUTURE_MS || !event.detail || typeof event.detail !== 'object' || Array.isArray(event.detail)) return reply.code(400).send({ error: 'invalid_request' });
    }
    let accepted = 0;
    await inTransaction(app.db, async (db) => {
      for (const event of events) {
        const inserted = await db.query(`insert into playback_events (id,event_id,device_id,asset_id,event_type,occurred_at,detail) values ($1,$2,$3,$4,$5,$6,$7) on conflict (event_id) do nothing returning event_id`, [randomUUID(), event.eventId, request.device.id, event.assetId, event.type.trim(), new Date(event.occurredAt).toISOString(), JSON.stringify(event.detail)]);
        accepted += inserted.rows.length;
      }
    });
    return reply.code(202).send({ accepted, duplicates: events.length - accepted });
  });
}
