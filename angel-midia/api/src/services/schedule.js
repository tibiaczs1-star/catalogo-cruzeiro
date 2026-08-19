const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ownKeys = (value, keys) => value && typeof value === 'object' && !Array.isArray(value)
  && Object.keys(value).length === keys.length && Object.keys(value).every((key) => keys.includes(key));

export function validateScheduleInput(body) {
  if (!ownKeys(body, ['campaignId', 'target', 'startsAt', 'endsAt', 'priority']) || !UUID.test(body.campaignId ?? '')) return { ok: false };
  if (!ownKeys(body.target, ['type', 'id']) || !['device', 'group', 'all'].includes(body.target.type)) return { ok: false };
  if (body.target.type === 'all' ? body.target.id !== null : !UUID.test(body.target.id ?? '')) return { ok: false };
  const startsAt = new Date(body.startsAt); const endsAt = new Date(body.endsAt);
  if (!Number.isFinite(startsAt.getTime()) || !Number.isFinite(endsAt.getTime()) || endsAt <= startsAt) return { ok: false };
  if (!Number.isInteger(body.priority) || body.priority < 0 || body.priority > 100) return { ok: false };
  return { ok: true, value: { ...body, startsAt: startsAt.toISOString(), endsAt: endsAt.toISOString() } };
}

export async function resolveSchedule(db, device) {
  const { rows } = await db.query(
    `with matched_targets as (
       select st.* from schedule_targets st where st.target_type = 'all' or st.device_id = $1
       union
       select st.* from schedule_targets st join group_devices gd on gd.group_id = st.group_id where gd.device_id = $1
     )
     select distinct d.schedule_version, ma.id as asset_id, ma.content_type, ma.sha256, s.starts_at, s.ends_at, s.priority
       from devices d
       left join matched_targets st on true
       left join schedules s on s.id = st.schedule_id and s.starts_at <= now() and s.ends_at > now()
       left join campaigns c on c.id = s.campaign_id and c.status = 'approved'
       left join media_assets ma on ma.campaign_id = c.id
      where d.id = $1
      order by s.priority desc, s.starts_at, ma.id`, [device.id]);
  return { version: rows[0]?.schedule_version, items: rows.filter((row) => row.asset_id).map((row) => ({ assetId: row.asset_id, type: row.content_type, sha256: row.sha256, startsAt: new Date(row.starts_at).toISOString(), endsAt: new Date(row.ends_at).toISOString(), priority: row.priority })) };
}
