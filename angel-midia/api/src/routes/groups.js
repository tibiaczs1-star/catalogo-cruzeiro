import { randomUUID } from 'node:crypto';
import { requireAdmin } from '../auth.js';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function validateGroup(body) {
  const name = typeof body?.name === 'string' ? body.name.trim() : '';
  const deviceIds = Array.isArray(body?.deviceIds) ? body.deviceIds : [];
  if (!name || name.length > 120 || !deviceIds.length || deviceIds.length > 500
    || deviceIds.some((id) => !UUID.test(id)) || new Set(deviceIds).size !== deviceIds.length) return { ok: false };
  return { ok: true, value: { name, deviceIds } };
}

export default async function groupRoutes(app) {
  app.get('/api/admin/groups', { preHandler: requireAdmin }, async () => {
    const { rows } = await app.db.query(`select g.id,g.name,g.created_at,count(gd.device_id)::int as device_count,
      coalesce(json_agg(json_build_object('id',d.id,'name',d.name,'status',d.status) order by d.name)
      filter (where d.id is not null),'[]'::json) as devices
      from groups g left join group_devices gd on gd.group_id=g.id left join devices d on d.id=gd.device_id
      group by g.id order by g.name`);
    return { groups: rows };
  });

  app.post('/api/admin/groups', { preHandler: requireAdmin }, async (request, reply) => {
    const parsed = validateGroup(request.body);
    if (!parsed.ok) return reply.code(400).send({ error: 'invalid_request' });
    const client = await app.db.connect();
    try {
      await client.query('begin');
      const found = await client.query('select id from devices where id=any($1::uuid[]) and status=$2', [parsed.value.deviceIds, 'active']);
      if (found.rows.length !== parsed.value.deviceIds.length) { await client.query('rollback'); return reply.code(400).send({ error: 'invalid_or_inactive_devices' }); }
      const id = randomUUID();
      await client.query('insert into groups(id,name) values($1,$2)', [id, parsed.value.name]);
      for (const deviceId of parsed.value.deviceIds) await client.query('insert into group_devices(group_id,device_id) values($1,$2)', [id, deviceId]);
      await client.query('commit');
      return reply.code(201).send({ id, ...parsed.value });
    } catch (error) {
      await client.query('rollback');
      if (error?.code === '23505') return reply.code(409).send({ error: 'group_name_in_use' });
      throw error;
    } finally { client.release(); }
  });
}
