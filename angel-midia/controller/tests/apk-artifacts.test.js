import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { describe, expect, test } from 'vitest';

const controllerRoot = resolve(import.meta.dirname, '..');
const projectRoot = resolve(controllerRoot, '..');

const sha256 = (buffer) => createHash('sha256').update(buffer).digest('hex');

describe('APK release artifacts', () => {
  test.each([
    ['admin', 'angel-midia-admin.apk', 'Angel-Midia-Admin.apk'],
    ['tv', 'angel-midia-tv.apk', 'Angel-Midia-TV.apk'],
  ])('%s is a real, mirrored and versioned APK', async (kind, controllerName, publicName) => {
    const release = JSON.parse(await readFile(resolve(controllerRoot, 'release.json'), 'utf8'));
    const controllerApk = await readFile(resolve(controllerRoot, 'downloads', controllerName));
    const publicApk = await readFile(resolve(projectRoot, 'downloads', publicName));

    expect(controllerApk.length).toBeGreaterThan(100_000);
    expect(controllerApk.equals(publicApk)).toBe(true);
    expect(controllerApk.includes(Buffer.from('AndroidManifest.xml'))).toBe(true);
    expect(controllerApk.includes(Buffer.from('classes.dex'))).toBe(true);
    expect(controllerApk.includes(Buffer.from('assets/angel-release.json'))).toBe(true);
    expect(sha256(controllerApk)).toBe(release.apps[kind].sha256);
    expect(controllerApk.length).toBe(release.apps[kind].sizeBytes);
  });

  test('Admin and TV are distinct applications', async () => {
    const admin = await readFile(resolve(controllerRoot, 'downloads', 'angel-midia-admin.apk'));
    const tv = await readFile(resolve(controllerRoot, 'downloads', 'angel-midia-tv.apk'));
    expect(sha256(admin)).not.toBe(sha256(tv));
  });
});
