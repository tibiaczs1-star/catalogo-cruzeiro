function normalizeQuery(value) {
  return typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : '';
}

function normalizeResult(item) {
  const label = item?.label ?? item?.display_name;
  const latitude = Number(item?.latitude ?? item?.lat);
  const longitude = Number(item?.longitude ?? item?.lon);
  if (typeof label !== 'string' || !label.trim() || !Number.isFinite(latitude) || latitude < -90 || latitude > 90
    || !Number.isFinite(longitude) || longitude < -180 || longitude > 180) return null;
  return { label: label.trim(), latitude, longitude };
}

async function defaultGeocoder(query, { limit, signal }) {
  const url = new URL('https://nominatim.openstreetmap.org/search');
  url.searchParams.set('q', query);
  url.searchParams.set('format', 'jsonv2');
  url.searchParams.set('limit', String(limit));
  const response = await fetch(url, { signal, headers: { 'user-agent': 'Angel-Midia-Play-AppStation/1.0' } });
  if (!response.ok) throw new Error(`geocoder HTTP ${response.status}`);
  return response.json();
}

export function createLocationLimiter({ maxClients = 500, limit = 20, windowMs = 60_000, now = Date.now } = {}) {
  const windows = new Map();
  return {
    consume(request) {
      const timestamp = now(); const key = request.ip;
      for (const [client, entries] of windows) if (!entries.some((time) => timestamp - time < windowMs)) windows.delete(client);
      if (!windows.has(key) && windows.size >= maxClients) windows.delete(windows.keys().next().value);
      const recent = (windows.get(key) ?? []).filter((time) => timestamp - time < windowMs);
      if (recent.length >= limit) return false;
      recent.push(timestamp); windows.set(key, recent); return true;
    },
    size: () => windows.size,
  };
}

export function setBoundedCache(cache, key, value, { maxEntries = 500, now = Date.now } = {}) {
  const timestamp = now();
  for (const [cachedKey, cached] of cache) if (cached?.expiresAt && cached.expiresAt <= timestamp) cache.delete(cachedKey);
  if (!cache.has(key) && cache.size >= maxEntries) cache.delete(cache.keys().next().value);
  cache.set(key, value);
}

export default async function locationRoutes(app, options) {
  const geocoder = options.geocoder ?? defaultGeocoder;
  const cache = options.locationCache ?? new Map();
  const timeoutMs = options.locationSearchTimeoutMs ?? 4000;
  const limiter = options.locationRateLimiter ?? createLocationLimiter();
  app.get('/api/locations/search', async (request, reply) => {
    const query = normalizeQuery(request.query?.q);
    if (query.length < 3 || query.length > 160) return reply.code(400).send({ error: 'invalid_query' });
    if (!limiter.consume(request)) return reply.code(429).send({ error: 'rate_limited' });
    const key = query.toLocaleLowerCase('pt-BR');
    const cached = cache.get(key);
    if (cached && (!cached.expiresAt || cached.expiresAt > Date.now())) return reply.send(cached.results ?? cached);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(new Error('location search timeout')), timeoutMs);
    try {
      const results = await geocoder(query, { limit: 5, signal: controller.signal });
      const normalizedResults = (Array.isArray(results) ? results : []).map(normalizeResult).filter(Boolean).slice(0, 5);
      setBoundedCache(cache, key, { results: normalizedResults, expiresAt: Date.now() + 300_000 });
      return reply.send(normalizedResults);
    } catch {
      return reply.code(503).send({ error: 'location_search_unavailable' });
    } finally {
      clearTimeout(timeout);
    }
  });
}
