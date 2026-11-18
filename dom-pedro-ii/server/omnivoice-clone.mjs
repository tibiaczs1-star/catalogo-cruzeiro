import { spawn } from 'node:child_process';
import { FFMPEG_BIN } from './ffmpeg-bin.mjs';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, join, resolve } from 'node:path';
import { createInterface } from 'node:readline';

const ROOT = resolve(import.meta.dirname, '..');
export const NAIRA_REF_WAV = resolve(ROOT, 'assets', 'audio', 'naira-ref.wav');
export const NAIRA_REF_TEXT = 'Quando explicamos o motivo de uma opinião, os outros entendem melhor nosso ponto de vista e podem concordar ou apresentar outra razão.';
export const NAIRA_STUDY_MP3 = resolve(ROOT, 'assets', 'audio', 'naira-estudo-guiado.mp3');

const OMNIVOICE_PYTHON = process.env.OMNIVOICE_PYTHON || 'C:\\Users\\junio\\tts_env\\Scripts\\python.exe';
const OMNIVOICE_REPO = process.env.OMNIVOICE_REPO || 'C:\\tools\\VoiceStudio';
const OMNIVOICE_SCRIPT = resolve(ROOT, 'tools', 'omnivoice_clone.py');
const PROMPT_CACHE_DIR = resolve(process.env.ESCOLA_DATA_DIR || join(ROOT, 'local-data'), 'tts-cache');

const UPLOAD_CACHE = new Map();
const UPLOAD_TTL_MS = 20 * 60 * 1000;
const WORKER_IDLE_MS = 180 * 1000;

export function hasLocalOmniVoice() {
  return (
    process.platform === 'win32' &&
    existsSync(OMNIVOICE_PYTHON) &&
    existsSync(join(OMNIVOICE_REPO, 'omnivoice')) &&
    existsSync(OMNIVOICE_SCRIPT)
  );
}

export function splitCloneChunks(text, target = 220) {
  const clean = String(text || '').replace(/\s+/g, ' ').trim();
  if (!clean) return [];
  if (clean.length <= target + 30) return [clean];
  const sentences = clean.split(/(?<=[.!?])\s+/).map(s => s.trim()).filter(Boolean);
  const parts = [];
  for (const s of sentences) {
    if (s.length > target + 30) {
      const clauses = s.split(/(?<=[,;:])\s+/).map(c => c.trim()).filter(Boolean);
      let buf = '';
      for (const c of clauses) {
        if (buf && buf.length + 1 + c.length > target && buf.length >= 45) {
          parts.push(buf);
          buf = c;
        } else {
          buf = buf ? `${buf} ${c}` : c;
        }
      }
      if (buf) parts.push(buf);
    } else {
      parts.push(s);
    }
  }
  const chunks = [];
  let cur = '';
  for (const p of parts) {
    if (cur && cur.length + 1 + p.length > target) {
      chunks.push(cur);
      cur = p;
    } else {
      cur = cur ? `${cur} ${p}` : p;
    }
  }
  if (cur) chunks.push(cur);
  return chunks;
}

function runFfmpeg(args, timeoutMs = 60000) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(FFMPEG_BIN, args, { windowsHide: true });
    const timer = setTimeout(() => child.kill(), timeoutMs);
    let stderr = '';
    let errObj;
    child.stderr.on('data', d => { stderr += d.toString(); });
    child.on('error', e => { errObj = e; });
    child.on('close', code => {
      clearTimeout(timer);
      if (errObj) return reject(errObj);
      if (code !== 0) return reject(new Error(stderr.trim() || `FFmpeg falhou (${code})`));
      resolvePromise();
    });
  });
}

let localWorker = null;
let localWorkerStarting = null;
let nextReqId = 1;
const pendingWorkerReqs = new Map();
let workerIdleTimer = null;
let workerStderrTail = '';

export function shutdownLocalWorker() {
  if (workerIdleTimer) { clearTimeout(workerIdleTimer); workerIdleTimer = null; }
  const proc = localWorker;
  localWorker = null;
  localWorkerStarting = null;
  if (proc && !proc.killed) {
    try { proc.kill(); } catch {}
  }
}

let exitHooked = false;
function scheduleWorkerIdle() {
  if (workerIdleTimer) clearTimeout(workerIdleTimer);
  workerIdleTimer = setTimeout(() => {
    if (pendingWorkerReqs.size === 0) shutdownLocalWorker();
  }, WORKER_IDLE_MS);
  workerIdleTimer.unref?.();
}

function ensureLocalWorker() {
  if (localWorker && !localWorker.killed) {
    scheduleWorkerIdle();
    return Promise.resolve(localWorker);
  }
  if (localWorkerStarting) return localWorkerStarting;

  if (!exitHooked) {
    exitHooked = true;
    process.once('exit', shutdownLocalWorker);
  }

  localWorkerStarting = new Promise((resolvePromise, reject) => {
    const args = [
      OMNIVOICE_SCRIPT,
      '--worker',
      '--cache-dir', PROMPT_CACHE_DIR,
      '--ref-audio', NAIRA_REF_WAV,
      '--ref-text', NAIRA_REF_TEXT
    ];
    const child = spawn(OMNIVOICE_PYTHON, args, {
      windowsHide: true,
      env: { ...process.env, OMNIVOICE_REPO, PYTHONUTF8: '1' },
      stdio: ['pipe', 'pipe', 'pipe']
    });
    workerStderrTail = '';
    let settled = false;
    const bootTimer = setTimeout(() => {
      if (!settled) {
        settled = true;
        try { child.kill(); } catch {}
        localWorkerStarting = null;
        reject(new Error(`Timeout ao iniciar worker OmniVoice. ${workerStderrTail.slice(-300)}`));
      }
    }, 95000);

    child.stderr.on('data', chunk => {
      workerStderrTail = (workerStderrTail + chunk.toString()).slice(-2000);
    });

    const failAll = reason => {
      clearTimeout(bootTimer);
      if (localWorker === child) localWorker = null;
      if (!settled) {
        settled = true;
        localWorkerStarting = null;
        reject(new Error(reason));
      }
      for (const [id, entry] of pendingWorkerReqs.entries()) {
        clearTimeout(entry.timer);
        pendingWorkerReqs.delete(id);
        entry.reject(new Error(reason));
      }
    };

    const rl = createInterface({ input: child.stdout });
    rl.on('line', line => {
      const s = line.trim();
      if (!s) return;
      let msg;
      try { msg = JSON.parse(s); } catch { return; }
      if (msg.ready) {
        clearTimeout(bootTimer);
        if (!settled) {
          settled = true;
          localWorker = child;
          localWorkerStarting = null;
          scheduleWorkerIdle();
          resolvePromise(child);
        }
        return;
      }
      if (msg.id != null && pendingWorkerReqs.has(msg.id)) {
        const entry = pendingWorkerReqs.get(msg.id);
        pendingWorkerReqs.delete(msg.id);
        clearTimeout(entry.timer);
        scheduleWorkerIdle();
        if (msg.ok) entry.resolve(msg);
        else entry.reject(new Error(msg.error || 'Falha no worker OmniVoice'));
      }
    });

    child.on('error', err => failAll(err.message));
    child.on('close', code => failAll(`Worker OmniVoice encerrado (${code ?? 'sinal'}). ${workerStderrTail.slice(-250)}`));
  });

  return localWorkerStarting;
}

export async function synthesizeOmniVoiceLocal(text, { refWav = NAIRA_REF_WAV, refText = NAIRA_REF_TEXT } = {}) {
  const work = mkdtempSync(join(tmpdir(), 'dpii-omni-local-'));
  const inTxt = join(work, 'texto.txt');
  const outWav = join(work, 'out.wav');
  writeFileSync(inTxt, String(text || '').trim(), 'utf8');
  try {
    const child = await ensureLocalWorker();
    if (workerIdleTimer) { clearTimeout(workerIdleTimer); workerIdleTimer = null; }
    const reqId = nextReqId++;
    await new Promise((resolvePromise, reject) => {
      const timer = setTimeout(() => {
        pendingWorkerReqs.delete(reqId);
        shutdownLocalWorker();
        reject(new Error('Timeout na síntese local OmniVoice.'));
      }, 90000);
      pendingWorkerReqs.set(reqId, { resolve: resolvePromise, reject, timer });
      child.stdin.write(JSON.stringify({
        id: reqId,
        input: inTxt,
        output: outWav,
        ref_audio: refWav,
        ref_text: refText || '',
        num_step: 20
      }) + '\n');
    });
    return readFileSync(outWav);
  } finally {
    scheduleWorkerIdle();
    rmSync(work, { recursive: true, force: true });
  }
}

function spaceHeaders(extra = {}) {
  const headers = { ...extra };
  const hfToken = process.env.HF_TOKEN?.trim();
  if (hfToken) headers.Authorization = `Bearer ${hfToken}`;
  return headers;
}

async function uploadRefToSpace(base, refWav, force = false) {
  const cached = UPLOAD_CACHE.get(refWav);
  if (!force && cached && Date.now() - cached.at < UPLOAD_TTL_MS) {
    return cached.remotePath;
  }
  const wavBuf = readFileSync(refWav);
  const fd = new FormData();
  fd.append('files', new Blob([wavBuf], { type: 'audio/wav' }), basename(refWav));
  const res = await fetch(`${base}/gradio_api/upload`, {
    method: 'POST',
    headers: spaceHeaders(),
    body: fd,
    signal: AbortSignal.timeout(30000)
  });
  if (!res.ok) throw new Error(`Upload de referência falhou (${res.status}).`);
  const arr = await res.json();
  const remotePath = Array.isArray(arr) ? arr[0] : null;
  if (!remotePath) throw new Error('Resposta de upload inválida no OmniVoice.');
  UPLOAD_CACHE.set(refWav, { remotePath, at: Date.now() });
  return remotePath;
}

function parseSseComplete(sseText) {
  const lines = String(sseText || '').split(/\r?\n/);
  let currentEvent = '';
  for (const line of lines) {
    if (line.startsWith('event:')) {
      currentEvent = line.slice(6).trim();
    } else if (line.startsWith('data:')) {
      const raw = line.slice(5).trim();
      if (currentEvent === 'error') {
        throw new Error(`Erro remoto no OmniVoice: ${raw}`);
      }
      if (currentEvent === 'complete') {
        return JSON.parse(raw);
      }
    }
  }
  throw new Error('Stream SSE terminou sem evento complete.');
}

async function cloneChunkOnline(base, chunk, refWav, refText) {
  let remotePath = await uploadRefToSpace(base, refWav, false);
  for (let attempt = 0; attempt < 2; attempt++) {
    const callRes = await fetch(`${base}/gradio_api/call/_clone_fn`, {
      method: 'POST',
      headers: spaceHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({
        data: [
          chunk,
          'Auto',
          { path: remotePath, meta: { _type: 'gradio.FileData' } },
          refText || '',
          '',
          20,
          2.0,
          true,
          1.0,
          null,
          true,
          true
        ]
      }),
      signal: AbortSignal.timeout(30000)
    });
    if (!callRes.ok) {
      if (attempt === 0) {
        UPLOAD_CACHE.delete(refWav);
        remotePath = await uploadRefToSpace(base, refWav, true);
        continue;
      }
      throw new Error(`Chamada OmniVoice falhou (${callRes.status}).`);
    }
    const callJson = await callRes.json();
    const eventId = callJson?.event_id;
    if (!eventId) throw new Error('event_id ausente na resposta do OmniVoice.');

    const sseRes = await fetch(`${base}/gradio_api/call/_clone_fn/${encodeURIComponent(eventId)}`, {
      headers: spaceHeaders(),
      signal: AbortSignal.timeout(65000)
    });
    if (!sseRes.ok) throw new Error(`Stream OmniVoice falhou (${sseRes.status}).`);
    const sseText = await sseRes.text();
    let payload;
    try {
      payload = parseSseComplete(sseText);
    } catch (err) {
      if (attempt === 0) {
        UPLOAD_CACHE.delete(refWav);
        remotePath = await uploadRefToSpace(base, refWav, true);
        continue;
      }
      throw err;
    }
    const fileInfo = Array.isArray(payload) ? payload[0] : null;
    const audioUrl = fileInfo?.url || (fileInfo?.path ? `${base}/gradio_api/file=${fileInfo.path}` : null);
    if (!audioUrl) throw new Error('URL de áudio ausente na resposta do OmniVoice.');

    const wavRes = await fetch(audioUrl, { headers: spaceHeaders(), signal: AbortSignal.timeout(30000) });
    if (!wavRes.ok) throw new Error(`Download de áudio OmniVoice falhou (${wavRes.status}).`);
    return Buffer.from(await wavRes.arrayBuffer());
  }
  throw new Error('Falha após retentativa no OmniVoice online.');
}

async function runPool(items, concurrency, worker) {
  const results = new Array(items.length);
  let nextIdx = 0;
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (nextIdx < items.length) {
      const idx = nextIdx++;
      results[idx] = await worker(items[idx], idx);
    }
  });
  await Promise.all(workers);
  return results;
}

export async function synthesizeOmniVoiceOnline(text, { refWav = NAIRA_REF_WAV, refText = NAIRA_REF_TEXT } = {}) {
  const base = (process.env.OMNIVOICE_SPACE_URL || 'https://k2-fsa-omnivoice.hf.space').replace(/\/$/, '');
  const chunks = splitCloneChunks(text, 220);
  if (!chunks.length) throw new Error('Texto vazio para clonagem online.');

  const wavBuffers = await runPool(chunks, 2, chunk => cloneChunkOnline(base, chunk, refWav, refText));
  if (wavBuffers.length === 1) {
    const work = mkdtempSync(join(tmpdir(), 'dpii-omni-norm-'));
    try {
      const inWav = join(work, 'in.wav');
      const outWav = join(work, 'out.wav');
      writeFileSync(inWav, wavBuffers[0]);
      await runFfmpeg(['-y', '-i', inWav, '-af', 'alimiter=limit=0.92', '-ar', '24000', '-ac', '1', '-c:a', 'pcm_s16le', outWav]);
      return readFileSync(outWav);
    } finally {
      rmSync(work, { recursive: true, force: true });
    }
  }

  const work = mkdtempSync(join(tmpdir(), 'dpii-omni-cat-'));
  try {
    const args = ['-y'];
    const filterInputs = [];
    wavBuffers.forEach((buf, idx) => {
      const p = join(work, `c_${idx}.wav`);
      writeFileSync(p, buf);
      args.push('-i', p);
      filterInputs.push(`[${idx}:a]aresample=24000,aformat=channel_layouts=mono,apad=pad_dur=0.14[a${idx}]`);
    });
    const concatRefs = wavBuffers.map((_, idx) => `[a${idx}]`).join('');
    const outWav = join(work, 'merged.wav');
    args.push(
      '-filter_complex', `${filterInputs.join(';')};${concatRefs}concat=n=${wavBuffers.length}:v=0:a=1,alimiter=limit=0.92[out]`,
      '-map', '[out]', '-ar', '24000', '-ac', '1', '-c:a', 'pcm_s16le', outWav
    );
    await runFfmpeg(args, 90000);
    return readFileSync(outWav);
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
}

async function concatWithAudioFile(wavBuffer, appendPath) {
  const work = mkdtempSync(join(tmpdir(), 'dpii-omni-join-'));
  try {
    const dynWav = join(work, 'dyn.wav');
    const outWav = join(work, 'full.wav');
    writeFileSync(dynWav, wavBuffer);
    await runFfmpeg([
      '-y', '-i', dynWav, '-i', appendPath,
      '-filter_complex', '[0:a]aresample=24000,aformat=channel_layouts=mono,apad=pad_dur=0.35[a0];[1:a]aresample=24000,aformat=channel_layouts=mono[a1];[a0][a1]concat=n=2:v=0:a=1,alimiter=limit=0.92[out]',
      '-map', '[out]', '-ar', '24000', '-ac', '1', '-c:a', 'pcm_s16le', outWav
    ], 90000);
    return readFileSync(outWav);
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
}

export async function synthesizeClonedVoice(text, { refWav = NAIRA_REF_WAV, refText = NAIRA_REF_TEXT, appendMp3 = null } = {}) {
  if (!existsSync(refWav)) throw new Error(`Áudio de referência ausente: ${refWav}`);
  const useLocal = hasLocalOmniVoice() && process.env.FORCE_CLOUD_CLONE !== '1';
  let dynBuf;
  if (useLocal) {
    try {
      dynBuf = await synthesizeOmniVoiceLocal(text, { refWav, refText });
    } catch (err) {
      console.warn('[OmniVoice local] Falhou, tentando motor online:', err.message);
      dynBuf = await synthesizeOmniVoiceOnline(text, { refWav, refText });
    }
  } else {
    dynBuf = await synthesizeOmniVoiceOnline(text, { refWav, refText });
  }
  if (appendMp3 && existsSync(appendMp3)) {
    return concatWithAudioFile(dynBuf, appendMp3);
  }
  return dynBuf;
}
