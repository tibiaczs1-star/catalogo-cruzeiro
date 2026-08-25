import { requireAdmin } from '../auth.js';
import { DEFAULT_DYNAMIC_POLICY, mapDynamicPolicy, validateDynamicPolicy } from '../services/dynamic-cycle.js';

async function readPolicy(db) {
  const { rows } = await db.query('select * from dynamic_playback_policy where id=1');
  return rows[0] ? mapDynamicPolicy(rows[0]) : DEFAULT_DYNAMIC_POLICY;
}

export default async function dynamicRoutes(app) {
  app.get('/api/admin/dynamic-policy', { preHandler: requireAdmin }, async () => {
    const policy = await readPolicy(app.db);
    const { rows } = await app.db.query(
      `select
         count(*) filter (where source_type='direct' and content_kind='advertisement')::int as direct_ads,
         count(*) filter (where source_type='programmatic' and content_kind='advertisement')::int as programmatic_ads,
         count(*) filter (where source_type='editorial' and content_kind='news')::int as news,
         count(*) filter (where source_type='editorial' and content_kind='meme')::int as memes
       from media_assets where processing_status='ready'`,
    );
    const devices = await app.db.query("select count(*)::int as active_tvs from devices where status='active'");
    const proof = await app.db.query("select count(*)::int as proof_of_play_30d from playback_events where event_type='completed' and occurred_at>=now()-interval '30 days'");
    return {
      policy,
      inventory: {
        directAds: Number(rows[0]?.direct_ads ?? 0),
        programmaticAds: Number(rows[0]?.programmatic_ads ?? 0),
        news: Number(rows[0]?.news ?? 0),
        memes: Number(rows[0]?.memes ?? 0),
        activeTvs: Number(devices.rows[0]?.active_tvs ?? 0),
        proofOfPlay30d: Number(proof.rows[0]?.proof_of_play_30d ?? 0),
      },
    };
  });

  app.put('/api/admin/dynamic-policy', { preHandler: requireAdmin }, async (request, reply) => {
    const parsed = validateDynamicPolicy(request.body);
    if (!parsed.ok) return reply.code(400).send({ error: 'invalid_request' });
    const value = parsed.value;
    await app.db.query(
      `insert into dynamic_playback_policy
       (id,enabled,interval_items,max_dynamic_percent,allow_direct_ads,allow_programmatic_ads,allow_news,allow_memes,
        transition_name,effect_intensity,overlay_enabled,direct_cpm_cents,programmatic_floor_cpm_cents,estimated_daily_cycles,
        ticker_enabled,ticker_mode,ticker_text,ticker_speed,ticker_position,news_source_url,news_feed_url,news_qr_enabled,
        schedule_days,window_start,window_end,priority_mode,updated_by,updated_at)
       values (1,$1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,now())
       on conflict (id) do update set
       enabled=excluded.enabled,interval_items=excluded.interval_items,max_dynamic_percent=excluded.max_dynamic_percent,
       allow_direct_ads=excluded.allow_direct_ads,allow_programmatic_ads=excluded.allow_programmatic_ads,
       allow_news=excluded.allow_news,allow_memes=excluded.allow_memes,transition_name=excluded.transition_name,
       effect_intensity=excluded.effect_intensity,overlay_enabled=excluded.overlay_enabled,direct_cpm_cents=excluded.direct_cpm_cents,
       programmatic_floor_cpm_cents=excluded.programmatic_floor_cpm_cents,estimated_daily_cycles=excluded.estimated_daily_cycles,
       ticker_enabled=excluded.ticker_enabled,ticker_mode=excluded.ticker_mode,ticker_text=excluded.ticker_text,
       ticker_speed=excluded.ticker_speed,ticker_position=excluded.ticker_position,news_source_url=excluded.news_source_url,
       news_feed_url=excluded.news_feed_url,news_qr_enabled=excluded.news_qr_enabled,schedule_days=excluded.schedule_days,
       window_start=excluded.window_start,window_end=excluded.window_end,priority_mode=excluded.priority_mode,
       updated_by=excluded.updated_by,updated_at=now()`,
      [value.enabled, value.intervalItems, value.maxDynamicPercent, value.allowDirectAds, value.allowProgrammaticAds,
        value.allowNews, value.allowMemes, value.transition, value.effectIntensity, value.overlayEnabled,
        value.directCpmCents, value.programmaticFloorCpmCents, value.estimatedDailyCycles,
        value.tickerEnabled, value.tickerMode, value.tickerText, value.tickerSpeed, value.tickerPosition,
        value.newsSourceUrl, value.newsFeedUrl, value.newsQrEnabled, value.scheduleDays,
        value.windowStart, value.windowEnd, value.priorityMode, request.admin.id],
    );
    await app.db.query("update devices set schedule_version=schedule_version+1,updated_at=now() where status='active'");
    return reply.send({ policy: value, synchronized: true });
  });
}
