import { googleSynthesize } from './google-tts.mjs';
import { NAIRA_REF_TEXT, NAIRA_REF_WAV, NAIRA_STUDY_MP3, synthesizeClonedVoice } from './omnivoice-clone.mjs';
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

let active = 0;
const inflight = new Map();

// Edge Cinema TTS (único backend além do OmniVoice Clone da Profª Naira).
const EDGE_CINEMA_SCRIPT = resolve(import.meta.dirname, '..', 'tools', 'edge_cinema_tts.py');
const HAS_EDGE_CINEMA = existsSync(EDGE_CINEMA_SCRIPT);

const CACHE_DIR = resolve(process.env.ESCOLA_DATA_DIR || join(import.meta.dirname, '..', 'local-data'), 'tts-cache');
try { mkdirSync(CACHE_DIR, { recursive: true }); } catch {}

export const VOICE_CATALOG = [
  { id: 'prof_naira', label: 'Profª Naira (Língua Portuguesa · Voz Clonada Real)', gender: 'F', cloned: true, backend: 'omnivoice-clone', sapiVoice: 'Microsoft Maria Desktop', rate: 0, cinema: { voice: 'pt-BR-ThalitaMultilingualNeural', rate: '+2%', pitch: '+2Hz', eq: 'gentle_warm', pitchFactor: 1.01, tempoFactor: 1.0 } },
  { id: 'prof_fallback', label: 'Voz Padrão (Edge Cinema)', gender: 'M', backend: 'edge-cinema', sapiVoice: 'Microsoft Daniel', rate: 0, cinema: { voice: 'pt-BR-AntonioNeural', rate: '+0%', pitch: '-10Hz', eq: 'warm_baritone', pitchFactor: 0.97, tempoFactor: 1.0 } },
];

const VOICE_MAP = Object.fromEntries(VOICE_CATALOG.map(v => [v.id, v]));

export function resolveVoicePreset(voice) {
  const raw = String(voice || '').trim();
  if (VOICE_MAP[raw]) return VOICE_MAP[raw];
  const low = raw.toLowerCase();
  if (['naira', 'prof_naira', 'naira_costa', 'portugues', 'português', 'língua portuguesa', 'lingua portuguesa', 'redacao', 'redação'].includes(low)) return VOICE_MAP.prof_naira;
  // Qualquer outra voz (incluindo IDs legados) vai para o fallback Edge Cinema.
  return VOICE_MAP.prof_fallback;
}

/**
 * Sintetiza fala em português priorizando clonagem zero-shot OmniVoice (para Profª Naira)
 * e Edge Cinema como fallback universal. Google TTS é tentado apenas como opção remota
 * com fallback automático para o pipeline local.
 */
export async function synthesize(text, options = {}) {
  const preset = resolveVoicePreset(options.voice);
  const wantsClone = (preset.id === 'prof_naira' || Boolean(options.refWav)) && process.env.OFFLINE_TTS_ONLY !== '1';

  // Profª Naira sempre passa pelo pipeline local (OmniVoice Clone), nunca pelo Google TTS genérico.
  if (wantsClone) return synthesizeLocal(text, options);

  // Para vozes não-clonadas, tentar Google TTS se configurado; fallback para Edge Cinema.
  if (!options.localOnly && process.env.VOICE_PROVIDER === 'google') {
    try {
      return await googleSynthesize(text, options);
    } catch (err) {
      console.warn('[TTS] Google TTS falhou, usando fallback Edge Cinema:', err.message);
    }
  }

  if (process.env.VOICE_PROVIDER && !['local', 'google'].includes(process.env.VOICE_PROVIDER)) {
    throw new Error('Provedor de voz inválido.');
  }
  return synthesizeLocal(text, options);
}

async function synthesizeLocal(text, { voice = 'prof_naira', rate = null, fullLesson = false, dynamicText = '', refWav = null, refText = null } = {}) {
  const clean = String(text || '');
  if (clean.length > 14000) throw new Error('Texto longo demais para síntese.');
  if (!clean.trim()) throw new Error('Texto vazio para síntese.');

  const preset = resolveVoicePreset(voice);
  const effectiveRate = rate !== null && Number.isFinite(Number(rate)) ? Number(rate) : preset.rate;
  const shouldClone = (preset.id === 'prof_naira' || Boolean(refWav)) && process.env.OFFLINE_TTS_ONLY !== '1';
  const useCinema = HAS_EDGE_CINEMA && process.env.FORCE_SAPI !== '1' && process.env.OFFLINE_TTS_ONLY !== '1' && Boolean(preset.cinema);
  const modeTag = shouldClone ? `clone-v1|${fullLesson ? 'full' : 'step'}|${refWav || 'naira'}` : (useCinema ? 'edge' : 'sapi');
  const hashPayload = shouldClone && fullLesson && dynamicText ? dynamicText : clean;
  const cacheKey = createHash('sha256')
    .update(`cinema-v3|${preset.id}|${modeTag}|${effectiveRate}|${hashPayload}`)
    .digest('hex');

  const cachedFile = join(CACHE_DIR, `${cacheKey}.wav`);
  if (existsSync(cachedFile)) {
    try { return readFileSync(cachedFile); } catch {}
  }

  if (inflight.has(cacheKey)) {
    return inflight.get(cacheKey);
  }

  const job = (async () => {
    if (active >= 4) throw new Error('Voz ocupada. Tente novamente em instantes.');
    let wavBuf = null;

    if (shouldClone) {
      active++;
      try {
        const useStudyConcat = !refWav && fullLesson && dynamicText && existsSync(NAIRA_STUDY_MP3);
        const cloneText = useStudyConcat ? dynamicText : clean;
        wavBuf = await synthesizeClonedVoice(cloneText, {
          refWav: refWav || NAIRA_REF_WAV,
          refText: refText ?? (refWav ? '' : NAIRA_REF_TEXT),
          appendMp3: useStudyConcat ? NAIRA_STUDY_MP3 : null
        });
      } catch (err) {
        console.warn('[TTS] Clone OmniVoice indisponível, aplicando fallback neural:', err.message);
        wavBuf = null;
      } finally {
        active--;
      }
    }

    if (!wavBuf) {
      const work = mkdtempSync(join(tmpdir(), 'dpii-tts-'));
      const out = join(work, 'voz.wav');
      const input = join(work, 'texto.txt');
      writeFileSync(input, clean, 'utf8');

      try {
        if (useCinema) {
          try {
            wavBuf = await synthesizeEdgeCinema(input, out, preset.cinema);
          } catch {
            wavBuf = null;
          }
        }
        if (!wavBuf) {
          if (process.platform === 'win32') {
            wavBuf = await synthesizeWindowsSapi(input, out, preset.sapiVoice, effectiveRate);
          } else {
            throw new Error('Configure Edge Cinema ou OmniVoice Clone neste servidor.');
          }
        }
      } finally {
        rmSync(work, { recursive: true, force: true });
      }
    }

    try { writeFileSync(cachedFile, wavBuf); } catch {}
    return wavBuf;
  })();

  inflight.set(cacheKey, job);
  try {
    return await job;
  } finally {
    inflight.delete(cacheKey);
  }
}

function synthesizeEdgeCinema(input, out, cinema, extra = {}) {
  active++;
  return new Promise((resolvePromise, reject) => {
    const args = [
      EDGE_CINEMA_SCRIPT,
      '--input', input,
      '--output', out,
      '--voice', cinema.voice || 'pt-BR-AntonioNeural',
      '--rate', cinema.rate || '+6%',
      '--pitch', cinema.pitch || '+8Hz',
      '--eq', cinema.eq || 'youth_hero',
      '--pitch-factor', String(cinema.pitchFactor || 1.0),
      '--tempo-factor', String(cinema.tempoFactor || 1.0),
      '--sample-rate', String(extra.sampleRate || 24000),
      '--channels', String(extra.channels || 1)
    ];
    if (extra.wordsJson) args.push('--words-json', extra.wordsJson);
    const child = spawn(process.env.EDGE_PYTHON || 'python', args, { windowsHide: true });
    const timer = setTimeout(() => child.kill(), 90000);
    let stderr = '';
    let error;
    child.stderr.on('data', chunk => { stderr += chunk.toString(); });
    child.on('error', err => { error = err; });
    child.on('close', code => {
      try {
        if (error) throw error;
        if (code !== 0) throw new Error(stderr.trim() || `Síntese Cinema falhou (código ${code}).`);
        resolvePromise(readFileSync(out));
      } catch (err) { reject(err); }
      finally { clearTimeout(timer); active--; }
    });
  });
}

export async function synthesizeWithTimings(text, { voice = 'prof_naira', sampleRate = 48000, channels = 2 } = {}) {
  const clean = String(text || '').trim();
  if (!clean) throw new Error('Texto vazio para síntese.');
  const preset = resolveVoicePreset(voice);
  if (HAS_EDGE_CINEMA && process.env.OFFLINE_TTS_ONLY !== '1' && preset.cinema) {
    const work = mkdtempSync(join(tmpdir(), 'dpii-ttsw-'));
    const input = join(work, 'texto.txt');
    const out = join(work, 'voz.wav');
    const wordsJson = join(work, 'words.json');
    writeFileSync(input, clean, 'utf8');
    try {
      const wav = await synthesizeEdgeCinema(input, out, preset.cinema, { sampleRate, channels, wordsJson });
      let words = [];
      try { words = JSON.parse(readFileSync(wordsJson, 'utf8')); } catch {}
      return { wav, words, preset };
    } finally {
      rmSync(work, { recursive: true, force: true });
    }
  }
  const wav = await synthesize(clean, { voice });
  return { wav, words: [], preset };
}

function synthesizeWindowsSapi(input, out, voiceName, appliedRate = 0) {
  active++;
  const script = `
Add-Type -AssemblyName System.Speech
$s = New-Object System.Speech.Synthesis.SpeechSynthesizer
$ErrorActionPreference = 'Stop'
$voiceName = '${String(voiceName).replace(/'/g, "''")}'
$voices = @($s.GetInstalledVoices() | Where-Object Enabled | ForEach-Object VoiceInfo)
$preferred = $voices | Where-Object { $_.Name -eq $voiceName -and $_.Culture.Name -eq 'pt-BR' } | Select-Object -First 1
if (-not $preferred) { $preferred = $voices | Where-Object { $_.Culture.Name -eq 'pt-BR' } | Select-Object -First 1 }
if (-not $preferred) { throw 'Nenhuma voz pt-BR instalada no servidor.' }
$s.SelectVoice($preferred.Name)
$s.Rate = ${Math.max(-10, Math.min(10, Number(appliedRate) || 0))}
$s.SetOutputToWaveFile('${out.replace(/'/g, "''")}')
$s.Speak([IO.File]::ReadAllText('${input.replace(/'/g, "''")}', [Text.Encoding]::UTF8))
$s.Dispose()
`;
  return new Promise((resolvePromise, reject) => {
    const child = spawn('powershell', ['-NoProfile', '-NonInteractive', '-EncodedCommand', Buffer.from(script, 'utf16le').toString('base64')], { windowsHide: true });
    const timer = setTimeout(() => child.kill(), 180000);
    let stderr = '';
    let error;
    child.stderr.on('data', chunk => { stderr += chunk.toString(); });
    child.on('error', err => { error = err; });
    child.on('close', code => {
      try {
        if (error) throw error;
        if (code !== 0) throw new Error(stderr.trim() || `Síntese local falhou (código ${code}).`);
        resolvePromise(readFileSync(out));
      } catch (err) { reject(err); }
      finally { clearTimeout(timer); active--; }
    });
  });
}

export function availableVoices() {
  return VOICE_CATALOG.map(v => ({
    id: v.id,
    label: v.label,
    gender: v.gender,
    cloned: Boolean(v.cloned),
    engine: v.backend
  }));
}
