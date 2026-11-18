import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

let transcriber = null;
let loading = null;

const LOW_RAM = Boolean(process.env.RENDER) || os.totalmem() < 2.5 * 1024 * 1024 * 1024;
const MODEL = process.env.WHISPER_MODEL || (LOW_RAM ? 'onnx-community/whisper-tiny' : 'onnx-community/whisper-small');
const CACHE_DIR = process.env.WHISPER_CACHE || path.join(import.meta.dirname, '..', 'local-data', 'whisper-cache');

export async function ensureTranscriber(onLog = () => {}) {
  if (transcriber) return transcriber;
  if (loading) return loading;

  loading = (async () => {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
    const { pipeline, env } = await import('@huggingface/transformers');
    env.cacheDir = CACHE_DIR;
    env.allowRemoteModels = true;
    onLog(`Carregando ${MODEL} (primeira vez baixa o modelo)…`);

    const reported = new Map();
    transcriber = await pipeline('automatic-speech-recognition', MODEL, {
      dtype: 'q8',
      progress_callback: info => {
        if (info.status === 'progress' && info.file && info.progress) {
          const percent = Math.round(info.progress);
          if (reported.get(info.file) !== percent) {
            reported.set(info.file, percent);
            onLog(`${info.file}: ${percent}%`);
          }
        }
      }
    });
    onLog('Modelo local pronto.');
    return transcriber;
  })().catch(error => {
    loading = null;
    throw error;
  });

  return loading;
}

export async function transcribeWav(audioInput, language = 'portuguese') {
  const asr = await ensureTranscriber();
  const audio = audioInput instanceof Float32Array
    ? audioInput
    : new Float32Array(audioInput.buffer, audioInput.byteOffset, audioInput.byteLength / 4);
  const result = await asr(audio, { language, task: 'transcribe', chunk_length_s: 30, stride_length_s: 5 });
  const text = Array.isArray(result) ? result.map(r => r.text).join(' ') : result.text;
  return String(text || '').trim();
}

export function isReady() {
  return Boolean(transcriber);
}
