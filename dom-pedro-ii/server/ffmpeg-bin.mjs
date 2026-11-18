import { existsSync } from 'node:fs';

let resolved = 'ffmpeg';
try {
  const mod = await import('ffmpeg-static');
  if (mod?.default && existsSync(mod.default)) resolved = mod.default;
} catch {}
export const FFMPEG_BIN = process.env.FFMPEG_PATH || resolved;
