import { createHash } from 'node:crypto';
const endpoint = 'https://generativelanguage.googleapis.com/v1beta/interactions';
const male = new Set(['prof_fallback']);
const cache = new Map();
const pending = new Map();
const MAX_CACHE = 32 * 1024 * 1024;
let cacheBytes = 0;

// A chave e o texto ficam no servidor; nenhuma chamada ocorre sem seleção explícita.
export async function googleSynthesize(text, { voice = 'maria', rate = null, apiKey = process.env.GOOGLE_API_KEY, fetchImpl = fetch } = {}) {
  if (!apiKey || !String(apiKey).trim()) throw new Error('Voz Google selecionada, mas a chave não foi configurada no servidor.');
  const clean = String(text || '').trim();
  if (!clean) throw new Error('Texto vazio para síntese.');
  if (clean.length > 18000) throw new Error('Divida a explicação em etapas para ouvir.');
  const model = process.env.GOOGLE_TTS_MODEL || 'gemini-3.8-flash-tts';
  const speaker = male.has(voice) ? 'Puck' : 'Kore';
  const key = createHash('sha256').update(JSON.stringify([model, speaker, rate, clean])).digest('hex');
  const useCache = fetchImpl === fetch;
  for (const [id, item] of cache) {
    if (item.expires <= Date.now()) { cacheBytes -= item.wav.length; cache.delete(id); }
  }
  if (useCache && cache.has(key)) return cache.get(key).wav;
  if (useCache && pending.has(key)) return pending.get(key);
  if (useCache && pending.size >= 2) throw new Error('As vozes estão ocupadas. Tente novamente em instantes.');
  const job = (async () => {
  try {
    const response = await fetchImpl(endpoint, {
      method: 'POST', headers: { 'content-type': 'application/json', 'x-goog-api-key': String(apiKey) },
      signal: AbortSignal.timeout(120000),
      body: JSON.stringify({ model,
        input: [{ type: 'user_input', content: [{ type: 'text', text: clean,
          annotations: [{ type: 'speech_metadata', style: `Adult ${male.has(voice) ? 'male' : 'female'} teacher, warm and natural, speaking Brazilian Portuguese with a Brazilian accent. Read the provided text verbatim, clearly, at a calm conversational pace. No music or sound effects.` }] }] }],
        response_format: { type: 'audio' }, generation_config: { speech_config: [{ voice: speaker }] }
      })
    });
    if (!response.ok) throw new Error('upstream');
    const result = await response.json();
    const audio = result.steps?.flatMap(step => step.content || []).filter(item => item.type === 'audio').at(-1)
      || result.outputs?.find(item => item.type === 'audio');
    if (typeof audio?.data !== 'string' || audio.data.length > 40000000 || !/^[A-Za-z0-9+/]+={0,2}$/.test(audio.data)) throw new Error('audio');
    const wav = Buffer.from(audio.data, 'base64');
    if (wav.length <= 44 || wav.toString('ascii', 0, 4) !== 'RIFF' || wav.toString('ascii', 8, 12) !== 'WAVE') throw new Error('audio');
    if (useCache && wav.length <= MAX_CACHE) {
      while (cacheBytes + wav.length > MAX_CACHE && cache.size) {
        const oldest = cache.keys().next().value; cacheBytes -= cache.get(oldest).wav.length; cache.delete(oldest);
      }
      cache.set(key, { wav, expires: Date.now() + 15 * 60000 }); cacheBytes += wav.length;
    }
    return wav;
  } catch {
    throw new Error('A voz está temporariamente indisponível. Tente novamente; sua explicação continua salva.');
  }
  })();
  if (useCache) pending.set(key, job);
  try { return await job; } finally { if (useCache) pending.delete(key); }
}
