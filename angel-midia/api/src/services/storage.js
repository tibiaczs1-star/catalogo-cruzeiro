import { createHash, randomUUID } from 'node:crypto';
import { mkdir, open, rm } from 'node:fs/promises';
import { extname, join } from 'node:path';

export const MAX_MEDIA_BYTES = 500 * 1024 * 1024;
export const MEDIA_TYPES = Object.freeze({
  'video/mp4': '.mp4',
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
});

function storageError(code) {
  return Object.assign(new Error(code), { code });
}

const STORAGE_KEY_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(?:mp4|jpg|png|webp)$/i;

function validSignature(contentType, header) {
  if (contentType === 'video/mp4') return header.length >= 12 && header.subarray(4, 8).equals(Buffer.from('ftyp'));
  if (contentType === 'image/jpeg') return header.length >= 3 && header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff;
  if (contentType === 'image/png') return header.length >= 8 && header.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  if (contentType === 'image/webp') return header.length >= 12 && header.subarray(0, 4).equals(Buffer.from('RIFF')) && header.subarray(8, 12).equals(Buffer.from('WEBP'));
  return false;
}

export async function removeStoredMedia({ storageKey, mediaDir = process.env.MEDIA_DIR ?? './var/media' }) {
  if (typeof storageKey !== 'string' || !STORAGE_KEY_PATTERN.test(storageKey)) throw storageError('INVALID_STORAGE_KEY');
  await rm(join(mediaDir, storageKey), { force: true });
}

export async function writeAll(file, chunk) {
  let offset = 0;
  while (offset < chunk.length) {
    const { bytesWritten } = await file.write(chunk, offset, chunk.length - offset);
    if (bytesWritten < 1) throw storageError('MEDIA_WRITE_FAILED');
    offset += bytesWritten;
  }
}

export async function storeMedia({ stream, contentType, originalName, mediaDir = process.env.MEDIA_DIR ?? './var/media', maxBytes = MAX_MEDIA_BYTES }) {
  const extension = MEDIA_TYPES[contentType];
  if (!extension) throw storageError('UNSUPPORTED_MEDIA_TYPE');
  if (!stream || typeof stream[Symbol.asyncIterator] !== 'function') throw storageError('INVALID_MEDIA');
  await mkdir(mediaDir, { recursive: true });
  const storageKey = `${randomUUID()}${extension}`;
  const path = join(mediaDir, storageKey);
  const hash = createHash('sha256');
  let sizeBytes = 0;
  let header = Buffer.alloc(0);
  const file = await open(path, 'wx');
  try {
    for await (const chunkValue of stream) {
      const chunk = Buffer.isBuffer(chunkValue) ? chunkValue : Buffer.from(chunkValue);
      sizeBytes += chunk.length;
      if (sizeBytes > maxBytes) throw storageError('MEDIA_TOO_LARGE');
      if (header.length < 12) header = Buffer.concat([header, chunk.subarray(0, 12 - header.length)]);
      hash.update(chunk);
      await writeAll(file, chunk);
    }
    if (sizeBytes === 0) throw storageError('EMPTY_MEDIA');
    if (!validSignature(contentType, header)) throw storageError('INVALID_MEDIA_FORMAT');
  } catch (error) {
    await file.close();
    await rm(path, { force: true });
    throw error;
  }
  await file.close();
  return { storageKey, originalName: String(originalName ?? '').slice(0, 255) || `media${extname(storageKey)}`, contentType, sizeBytes, sha256: hash.digest('hex') };
}
