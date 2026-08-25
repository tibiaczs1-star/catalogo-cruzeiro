import { createHash } from 'node:crypto';

export const DEFAULT_DYNAMIC_POLICY = Object.freeze({
  enabled: false,
  intervalItems: 4,
  maxDynamicPercent: 20,
  allowDirectAds: true,
  allowProgrammaticAds: false,
  allowNews: true,
  allowMemes: true,
  transition: 'fade',
  effectIntensity: 'balanced',
  overlayEnabled: true,
  tickerEnabled: true,
  tickerMode: 'live-news',
  tickerText: 'Acompanhe o Catálogo CZS',
  tickerSpeed: 'normal',
  tickerPosition: 'bottom',
  newsSourceUrl: 'https://catalogo-cruzeiro-web.onrender.com/',
  newsFeedUrl: 'https://catalogo-cruzeiro-web.onrender.com/api/news',
  newsQrEnabled: true,
  scheduleDays: 'all',
  windowStart: '00:00',
  windowEnd: '23:59',
  priorityMode: 'balanced',
  directCpmCents: 2500,
  programmaticFloorCpmCents: 1200,
  estimatedDailyCycles: 120,
});

const BOOLEAN_KEYS = ['enabled', 'allowDirectAds', 'allowProgrammaticAds', 'allowNews', 'allowMemes', 'overlayEnabled', 'tickerEnabled', 'newsQrEnabled'];
const INTEGER_LIMITS = {
  intervalItems: [2, 20],
  maxDynamicPercent: [5, 40],
  directCpmCents: [0, 1_000_000],
  programmaticFloorCpmCents: [0, 1_000_000],
  estimatedDailyCycles: [0, 10_000],
};
const TRANSITIONS = new Set(['none', 'fade', 'slide', 'zoom', 'wipe', 'rise', 'flip', 'blur', 'impact']);
const INTENSITIES = new Set(['subtle', 'balanced', 'strong']);
const TICKER_MODES = new Set(['live-news', 'custom']);
const TICKER_SPEEDS = new Set(['calm', 'normal', 'fast']);
const TICKER_POSITIONS = new Set(['top', 'bottom']);
const SCHEDULE_DAYS = new Set(['all', 'weekdays', 'weekends']);
const PRIORITY_MODES = new Set(['balanced', 'revenue', 'editorial']);
const CZS_ORIGIN = 'https://catalogo-cruzeiro-web.onrender.com/';
const CZS_FEED = 'https://catalogo-cruzeiro-web.onrender.com/api/news';
const TIME_PATTERN = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

const validCzsUrl = (value, expected) => {
  if (typeof value !== 'string') return false;
  try { return new URL(value).href === expected; } catch { return false; }
};

export function validateDynamicPolicy(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return { ok: false };
  const allowed = new Set([
    ...BOOLEAN_KEYS, ...Object.keys(INTEGER_LIMITS), 'transition', 'effectIntensity',
    'tickerMode', 'tickerText', 'tickerSpeed', 'tickerPosition', 'newsSourceUrl', 'newsFeedUrl',
    'scheduleDays', 'windowStart', 'windowEnd', 'priorityMode',
  ]);
  if (Object.keys(body).some((key) => !allowed.has(key))) return { ok: false };
  const value = { ...DEFAULT_DYNAMIC_POLICY, ...body };
  if (BOOLEAN_KEYS.some((key) => typeof value[key] !== 'boolean')) return { ok: false };
  for (const [key, [min, max]] of Object.entries(INTEGER_LIMITS)) {
    if (!Number.isInteger(value[key]) || value[key] < min || value[key] > max) return { ok: false };
  }
  if (!TRANSITIONS.has(value.transition) || !INTENSITIES.has(value.effectIntensity)) return { ok: false };
  if (!TICKER_MODES.has(value.tickerMode) || !TICKER_SPEEDS.has(value.tickerSpeed) || !TICKER_POSITIONS.has(value.tickerPosition)) return { ok: false };
  if (typeof value.tickerText !== 'string' || value.tickerText.trim().length < 1 || value.tickerText.trim().length > 180) return { ok: false };
  if (!validCzsUrl(value.newsSourceUrl, CZS_ORIGIN) || !validCzsUrl(value.newsFeedUrl, CZS_FEED)) return { ok: false };
  if (!SCHEDULE_DAYS.has(value.scheduleDays) || !PRIORITY_MODES.has(value.priorityMode)) return { ok: false };
  if (!TIME_PATTERN.test(value.windowStart) || !TIME_PATTERN.test(value.windowEnd)) return { ok: false };
  value.tickerText = value.tickerText.trim();
  return { ok: true, value };
}

const lane = (item) => {
  if (item.sourceType === 'direct' && item.contentKind === 'advertisement') return 'direct';
  if (item.sourceType === 'editorial' && item.contentKind === 'news') return 'news';
  if (item.sourceType === 'editorial' && item.contentKind === 'meme') return 'meme';
  if (item.sourceType === 'programmatic' && item.contentKind === 'advertisement') return 'programmatic';
  return null;
};

function isAllowed(kind, policy) {
  return (kind === 'direct' && policy.allowDirectAds)
    || (kind === 'programmatic' && policy.allowProgrammaticAds)
    || (kind === 'news' && policy.allowNews)
    || (kind === 'meme' && policy.allowMemes);
}

const localClock = (date) => {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Rio_Branco', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(date).filter((part) => part.type !== 'literal').map((part) => [part.type, part.value]));
  return { weekday: parts.weekday, minutes: (Number(parts.hour) * 60) + Number(parts.minute) };
};

const minutesFromClock = (value) => {
  const [hours, minutes] = value.split(':').map(Number);
  return (hours * 60) + minutes;
};

function isPolicyActive(policy, now) {
  const clock = localClock(now);
  const weekend = clock.weekday === 'Sat' || clock.weekday === 'Sun';
  if ((policy.scheduleDays === 'weekdays' && weekend) || (policy.scheduleDays === 'weekends' && !weekend)) return false;
  const start = minutesFromClock(policy.windowStart);
  const end = minutesFromClock(policy.windowEnd);
  return start <= end ? clock.minutes >= start && clock.minutes <= end : clock.minutes >= start || clock.minutes <= end;
}

const priorityFor = (mode) => mode === 'revenue'
  ? ['direct', 'programmatic', 'news', 'meme']
  : mode === 'editorial' ? ['news', 'direct', 'meme', 'programmatic'] : ['direct', 'news', 'meme', 'programmatic'];

const tickerFor = (candidate, kind, policy, latestNews) => {
  const liveTitle = kind === 'news' && policy.tickerMode === 'live-news' ? latestNews?.title : '';
  return {
    enabled: policy.tickerEnabled,
    text: liveTitle || policy.tickerText || candidate.displayName || '',
    speed: policy.tickerSpeed,
    position: policy.tickerPosition,
    source: kind === 'news' ? 'Catálogo CZS' : kind === 'meme' ? 'Angel Mídia' : 'Publicidade',
  };
};

export function composeDynamicCycle(baseItems, candidates, requestedPolicy, now = new Date(), runtime = {}) {
  const parsed = validateDynamicPolicy(requestedPolicy);
  const policy = parsed.ok ? parsed.value : DEFAULT_DYNAMIC_POLICY;
  if (!policy.enabled || !Array.isArray(baseItems) || baseItems.length === 0 || !isPolicyActive(policy, now)) return baseItems;
  const priority = priorityFor(policy.priorityMode);
  const eligible = (Array.isArray(candidates) ? candidates : [])
    .map((item) => ({ item, lane: lane(item) }))
    .filter(({ lane: kind }) => kind && isAllowed(kind, policy))
    .sort((a, b) => priority.indexOf(a.lane) - priority.indexOf(b.lane) || String(a.item.assetId).localeCompare(String(b.item.assetId)));
  const selected = [];
  for (const kind of priority) {
    const found = eligible.find((entry) => entry.lane === kind && !selected.includes(entry));
    if (found) selected.push(found);
  }
  const desired = Math.floor(baseItems.length / policy.intervalItems);
  const maxByShare = Math.floor((baseItems.length * policy.maxDynamicPercent) / (100 - policy.maxDynamicPercent));
  const insertions = selected.slice(0, Math.min(desired, maxByShare));
  if (!insertions.length) return baseItems.map((item, position) => ({ ...item, position }));
  const result = [];
  let insertionIndex = 0;
  baseItems.forEach((item, index) => {
    result.push({ ...item });
    if ((index + 1) % policy.intervalItems === 0 && insertionIndex < insertions.length) {
      const { item: candidate, lane: kind } = insertions[insertionIndex++];
      result.push({
        ...candidate,
        playback: { ...(candidate.playback ?? {}), transition: policy.transition },
        insertion: {
          kind: candidate.contentKind,
          sourceType: candidate.sourceType,
          label: candidate.contentKind === 'advertisement' ? 'PUBLICIDADE' : candidate.contentKind === 'news' ? 'NOTÍCIA LOCAL' : 'MOMENTO LEVE',
          billable: kind === 'direct' || kind === 'programmatic',
        },
        visualEffect: {
          transition: policy.transition,
          intensity: policy.effectIntensity,
          overlay: policy.overlayEnabled,
          ticker: tickerFor(candidate, kind, policy, runtime.latestNews),
          qrCode: {
            enabled: kind === 'news' && policy.newsQrEnabled,
            url: policy.newsSourceUrl,
            label: 'SIGA O CATÁLOGO CZS',
          },
        },
      });
    }
  });
  return result.map((item, position) => ({ ...item, position }));
}

export function estimateMonthlyRevenueCents({ activeTvs, paidSlotsPerCycle, policy }) {
  const impressions = Math.max(0, Number(activeTvs) || 0)
    * Math.max(0, Number(paidSlotsPerCycle) || 0)
    * Math.max(0, Number(policy?.estimatedDailyCycles) || 0) * 30;
  return Math.round((impressions / 1000) * Math.max(0, Number(policy?.directCpmCents) || 0));
}

const camelPolicy = (row = {}) => ({
  enabled: Boolean(row.enabled), intervalItems: Number(row.interval_items ?? DEFAULT_DYNAMIC_POLICY.intervalItems),
  maxDynamicPercent: Number(row.max_dynamic_percent ?? DEFAULT_DYNAMIC_POLICY.maxDynamicPercent),
  allowDirectAds: row.allow_direct_ads ?? DEFAULT_DYNAMIC_POLICY.allowDirectAds,
  allowProgrammaticAds: row.allow_programmatic_ads ?? DEFAULT_DYNAMIC_POLICY.allowProgrammaticAds,
  allowNews: row.allow_news ?? DEFAULT_DYNAMIC_POLICY.allowNews, allowMemes: row.allow_memes ?? DEFAULT_DYNAMIC_POLICY.allowMemes,
  transition: row.transition_name ?? DEFAULT_DYNAMIC_POLICY.transition,
  effectIntensity: row.effect_intensity ?? DEFAULT_DYNAMIC_POLICY.effectIntensity,
  overlayEnabled: row.overlay_enabled ?? DEFAULT_DYNAMIC_POLICY.overlayEnabled,
  tickerEnabled: row.ticker_enabled ?? DEFAULT_DYNAMIC_POLICY.tickerEnabled,
  tickerMode: row.ticker_mode ?? DEFAULT_DYNAMIC_POLICY.tickerMode,
  tickerText: row.ticker_text ?? DEFAULT_DYNAMIC_POLICY.tickerText,
  tickerSpeed: row.ticker_speed ?? DEFAULT_DYNAMIC_POLICY.tickerSpeed,
  tickerPosition: row.ticker_position ?? DEFAULT_DYNAMIC_POLICY.tickerPosition,
  newsSourceUrl: row.news_source_url ?? DEFAULT_DYNAMIC_POLICY.newsSourceUrl,
  newsFeedUrl: row.news_feed_url ?? DEFAULT_DYNAMIC_POLICY.newsFeedUrl,
  newsQrEnabled: row.news_qr_enabled ?? DEFAULT_DYNAMIC_POLICY.newsQrEnabled,
  scheduleDays: row.schedule_days ?? DEFAULT_DYNAMIC_POLICY.scheduleDays,
  windowStart: row.window_start ?? DEFAULT_DYNAMIC_POLICY.windowStart,
  windowEnd: row.window_end ?? DEFAULT_DYNAMIC_POLICY.windowEnd,
  priorityMode: row.priority_mode ?? DEFAULT_DYNAMIC_POLICY.priorityMode,
  directCpmCents: Number(row.direct_cpm_cents ?? DEFAULT_DYNAMIC_POLICY.directCpmCents),
  programmaticFloorCpmCents: Number(row.programmatic_floor_cpm_cents ?? DEFAULT_DYNAMIC_POLICY.programmaticFloorCpmCents),
  estimatedDailyCycles: Number(row.estimated_daily_cycles ?? DEFAULT_DYNAMIC_POLICY.estimatedDailyCycles),
});

export function parseLatestCzsNews(payload) {
  const items = Array.isArray(payload) ? payload : payload?.items;
  const news = Array.isArray(items) ? items
    .filter((item) => typeof item?.title === 'string' && item.title.trim())
    .sort((left, right) => {
      const rightDate = Date.parse(right?.publishedAt ?? right?.published_at ?? right?.date ?? '') || 0;
      const leftDate = Date.parse(left?.publishedAt ?? left?.published_at ?? left?.date ?? '') || 0;
      return rightDate - leftDate;
    })[0] : null;
  const title = news?.title.trim() ?? '';
  return title ? { title, url: CZS_ORIGIN } : null;
}

let newsCache = { expiresAt: 0, value: null };

export async function loadLatestCzsNews(feedUrl = CZS_FEED, fetcher = globalThis.fetch) {
  if (Date.now() < newsCache.expiresAt) return newsCache.value;
  if (!validCzsUrl(feedUrl, CZS_FEED) || typeof fetcher !== 'function') return null;
  try {
    const response = await fetcher(feedUrl, { headers: { accept: 'application/json' }, signal: AbortSignal.timeout(2500) });
    if (!response.ok) return null;
    newsCache = { expiresAt: Date.now() + 300_000, value: parseLatestCzsNews(await response.json()) };
    return newsCache.value;
  } catch { return null; }
}

export async function loadDynamicPlaybackContext(db, latestNewsLoader = loadLatestCzsNews) {
  const policyResult = await db.query('select * from dynamic_playback_policy where id=1');
  const policy = policyResult.rows[0] ? camelPolicy(policyResult.rows[0]) : DEFAULT_DYNAMIC_POLICY;
  if (!policy.enabled) return { policy, candidates: [], latestNews: null };
  const { rows } = await db.query(
    `select id as asset_id,coalesce(display_name,original_name) as display_name,content_type,sha256,duration_seconds,fit_mode,focal_x,focal_y,zoom,rotation,background_color,source_type,content_kind
       from media_assets where processing_status='ready' and (
         (source_type='direct' and content_kind='advertisement') or
         (source_type='programmatic' and content_kind='advertisement') or
         (source_type='editorial' and content_kind in ('news','meme'))
       ) order by created_at desc,id`,
  );
  const latestNews = policy.allowNews && policy.tickerEnabled && policy.tickerMode === 'live-news'
    ? await latestNewsLoader(policy.newsFeedUrl) : null;
  return { policy, latestNews, candidates: rows.map((row) => ({
    assetId: row.asset_id, type: row.content_type, sha256: row.sha256,
    displayName: row.display_name,
    durationSeconds: row.duration_seconds == null ? null : Number(row.duration_seconds),
    sourceType: row.source_type, contentKind: row.content_kind,
    presentation: { fitMode: row.fit_mode ?? 'contain', focalX: Number(row.focal_x ?? 50), focalY: Number(row.focal_y ?? 50), zoom: Number(row.zoom ?? 1), rotation: Number(row.rotation ?? 0), backgroundColor: row.background_color ?? '#000000' },
    playback: { trimStartSeconds: null, trimEndSeconds: null, volume: 1, transition: policy.transition },
  })) };
}

export function applyDynamicContext(schedule, context) {
  const composed = { ...schedule, items: composeDynamicCycle(
    schedule.items, context?.candidates ?? [], context?.policy ?? DEFAULT_DYNAMIC_POLICY, new Date(), { latestNews: context?.latestNews },
  ) };
  delete composed.version;
  composed.version = createHash('sha256').update(JSON.stringify(composed)).digest('hex');
  return composed;
}

export { camelPolicy as mapDynamicPolicy };
