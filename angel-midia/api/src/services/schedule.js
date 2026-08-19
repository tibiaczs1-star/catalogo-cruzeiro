const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ownKeys = (value, keys) => value && typeof value === 'object' && !Array.isArray(value)
  && Object.keys(value).length === keys.length && Object.keys(value).every((key) => keys.includes(key));

const PRIORITIES = Object.freeze({ normal: 10, alta: 50, urgente: 100 });

export function normalizePriority(value) {
  return typeof value === 'string' ? PRIORITIES[value.toLowerCase()] : undefined;
}

export function validatePlaylistScheduleInput(body) {
  if (!ownKeys(body, ['playlistId', 'target', 'startsAt', 'endsAt', 'priority']) || !UUID.test(body.playlistId ?? '')) return { ok: false };
  if (!ownKeys(body.target, ['type', 'id']) || !['device', 'group', 'all'].includes(body.target.type)) return { ok: false };
  if (body.target.type === 'all' ? body.target.id !== null : !UUID.test(body.target.id ?? '')) return { ok: false };
  const startsAt = new Date(body.startsAt); const endsAt = new Date(body.endsAt);
  const priority = normalizePriority(body.priority);
  if (!Number.isFinite(startsAt.getTime()) || !Number.isFinite(endsAt.getTime()) || endsAt <= startsAt || priority === undefined) return { ok: false };
  return { ok: true, value: { ...body, startsAt: startsAt.toISOString(), endsAt: endsAt.toISOString(), priority } };
}

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
     ), winning as (
       select s.* from schedules s join matched_targets st on st.schedule_id=s.id
        where s.starts_at <= now() and s.ends_at > now()
        order by s.priority desc, s.starts_at desc, s.id desc limit 1
     )
     select d.schedule_version, w.playlist_id, p.name as playlist_name,
            coalesce(pi.asset_id, legacy.id) as asset_id,
            coalesce(pi.position, (row_number() over(order by legacy.id)) - 1) as position,
            coalesce(pi.image_duration_seconds, legacy.duration_seconds) as duration_seconds,
            coalesce(asset.content_type, legacy.content_type) as content_type,
            coalesce(asset.sha256, legacy.sha256) as sha256,
            w.starts_at, w.ends_at, w.priority
       from devices d
       left join winning w on true
       left join playlists p on p.id=w.playlist_id
       left join playlist_items pi on pi.playlist_id=p.id
       left join media_assets asset on asset.id=pi.asset_id
       left join campaigns c on c.id=w.campaign_id and c.status='approved'
       left join media_assets legacy on legacy.campaign_id=c.id and w.playlist_id is null
      where d.id=$1
      order by position nulls last`, [device.id]);
  const first = rows[0];
  const schedule = {
    version: first?.schedule_version,
    items: rows.filter((row) => row.asset_id).map((row) => ({
      assetId: row.asset_id,
      type: row.content_type,
      sha256: row.sha256,
      position: Number(row.position),
      durationSeconds: row.duration_seconds == null ? null : Number(row.duration_seconds),
      startsAt: new Date(row.starts_at).toISOString(),
      endsAt: new Date(row.ends_at).toISOString(),
      priority: row.priority,
    })),
  };
  if (first?.playlist_id) schedule.playlist = { id: first.playlist_id, name: first.playlist_name };
  return schedule;
}
