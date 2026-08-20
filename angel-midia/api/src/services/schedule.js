import { createHash } from 'node:crypto';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ownKeys = (value, keys) => value && typeof value === 'object' && !Array.isArray(value)
  && Object.keys(value).length === keys.length && Object.keys(value).every((key) => keys.includes(key));
const allowedKeys = (value, keys) => value && typeof value === 'object' && !Array.isArray(value)
  && Object.keys(value).every((key) => keys.includes(key));

const PRIORITIES = Object.freeze({ normal: 10, alta: 50, urgente: 100 });

export function normalizePriority(value) {
  return typeof value === 'string' ? PRIORITIES[value.toLowerCase()] : undefined;
}

function normalizeScheduleWindow(body) {
  if (body.mode === 'continuous') {
    if (Object.hasOwn(body, 'startsAt') || Object.hasOwn(body, 'endsAt')) return { ok: false };
    return { ok: true, value: { mode: 'continuous', startsAt: null, endsAt: null } };
  }
  if (body.mode !== 'scheduled' || !Object.hasOwn(body, 'startsAt') || !Object.hasOwn(body, 'endsAt')) return { ok: false };
  if (typeof body.startsAt !== 'string' || body.startsAt.trim() === ''
      || typeof body.endsAt !== 'string' || body.endsAt.trim() === '') return { ok: false };
  const startsAt = new Date(body.startsAt); const endsAt = new Date(body.endsAt);
  if (!Number.isFinite(startsAt.getTime()) || !Number.isFinite(endsAt.getTime()) || endsAt <= startsAt) return { ok: false };
  return { ok: true, value: { mode: 'scheduled', startsAt: startsAt.toISOString(), endsAt: endsAt.toISOString() } };
}

export function validatePlaylistScheduleInput(body) {
  if (!allowedKeys(body, ['playlistId', 'target', 'mode', 'startsAt', 'endsAt', 'priority'])
      || !['playlistId', 'target', 'mode', 'priority'].every((key) => Object.hasOwn(body, key))
      || !UUID.test(body.playlistId ?? '')) return { ok: false };
  if (!ownKeys(body.target, ['type', 'id']) || !['device', 'group', 'all'].includes(body.target.type)) return { ok: false };
  if (body.target.type === 'all' ? body.target.id !== null : !UUID.test(body.target.id ?? '')) return { ok: false };
  const window = normalizeScheduleWindow(body);
  const priority = normalizePriority(body.priority);
  if (!window.ok || priority === undefined) return { ok: false };
  return { ok: true, value: { ...body, ...window.value, priority } };
}

export function validateScheduleInput(body) {
  if (!allowedKeys(body, ['campaignId', 'target', 'mode', 'startsAt', 'endsAt', 'priority'])
      || !['campaignId', 'target', 'mode', 'priority'].every((key) => Object.hasOwn(body, key))
      || !UUID.test(body.campaignId ?? '')) return { ok: false };
  if (!ownKeys(body.target, ['type', 'id']) || !['device', 'group', 'all'].includes(body.target.type)) return { ok: false };
  if (body.target.type === 'all' ? body.target.id !== null : !UUID.test(body.target.id ?? '')) return { ok: false };
  const window = normalizeScheduleWindow(body);
  if (!window.ok) return { ok: false };
  if (!Number.isInteger(body.priority) || body.priority < 0 || body.priority > 100) return { ok: false };
  return { ok: true, value: { ...body, ...window.value } };
}

export async function resolveSchedule(db, device) {
  const { rows } = await db.query(
    `with matched_targets as (
       select st.* from schedule_targets st where st.target_type = 'all' or st.device_id = $1
       union
       select st.* from schedule_targets st join group_devices gd on gd.group_id = st.group_id where gd.device_id = $1
     ), winning as (
       select s.* from schedules s join matched_targets st on st.schedule_id=s.id
        where s.mode = 'continuous' or (s.starts_at <= now() and s.ends_at > now())
        order by s.priority desc, coalesce(s.starts_at, s.created_at) desc, s.id desc limit 1
     )
     select d.schedule_version, w.playlist_id, p.name as playlist_name, w.mode,
            coalesce(pi.asset_id, legacy.id) as asset_id,
            coalesce(pi.position, (row_number() over(order by legacy.id)) - 1) as position,
            coalesce(pi.image_duration_seconds, asset.duration_seconds, legacy.duration_seconds) as duration_seconds,
            coalesce(asset.content_type, legacy.content_type) as content_type,
            coalesce(asset.sha256, legacy.sha256) as sha256,
            coalesce(asset.fit_mode, legacy.fit_mode, 'contain') as fit_mode,
            coalesce(asset.focal_x, legacy.focal_x, 50) as focal_x,
            coalesce(asset.focal_y, legacy.focal_y, 50) as focal_y,
            coalesce(asset.zoom, legacy.zoom, 1) as zoom,
            coalesce(asset.rotation, legacy.rotation, 0) as rotation,
            coalesce(asset.background_color, legacy.background_color, '#000000') as background_color,
            pi.trim_start_seconds,pi.trim_end_seconds,coalesce(pi.volume,1) as volume,coalesce(pi.transition_name,'cut') as transition_name,
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
    scheduleRevision: first?.schedule_version,
    mode: first?.mode ?? null,
    loop: true,
    items: rows.filter((row) => row.asset_id).map((row) => ({
      assetId: row.asset_id,
      type: row.content_type,
      sha256: row.sha256,
      position: Number(row.position),
      durationSeconds: row.duration_seconds == null ? null : Number(row.duration_seconds),
      startsAt: row.starts_at == null ? null : new Date(row.starts_at).toISOString(),
      endsAt: row.ends_at == null ? null : new Date(row.ends_at).toISOString(),
      priority: row.priority,
      presentation: {
        fitMode: row.fit_mode ?? 'contain', focalX: Number(row.focal_x ?? 50), focalY: Number(row.focal_y ?? 50),
        zoom: Number(row.zoom ?? 1), rotation: Number(row.rotation ?? 0), backgroundColor: row.background_color ?? '#000000',
      },
      playback: {
        trimStartSeconds: row.trim_start_seconds == null ? null : Number(row.trim_start_seconds),
        trimEndSeconds: row.trim_end_seconds == null ? null : Number(row.trim_end_seconds),
        volume: Number(row.volume ?? 1), transition: row.transition_name ?? 'cut',
      },
    })),
  };
  if (first?.playlist_id) schedule.playlist = { id: first.playlist_id, name: first.playlist_name };
  schedule.version = createHash('sha256').update(JSON.stringify(schedule)).digest('hex');
  return schedule;
}
