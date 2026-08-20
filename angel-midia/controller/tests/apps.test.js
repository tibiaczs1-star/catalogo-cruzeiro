import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import { renderApps } from '../src/apps.js';

const release = JSON.parse(readFileSync(new URL('../release.json', import.meta.url), 'utf8'));

it('publica os dois APKs com detalhes completos', () => {
  expect(release.apps.admin.path).toBe('./downloads/angel-midia-admin.apk');
  expect(release.apps.tv.path).toBe('./downloads/angel-midia-tv.apk');
  expect(release.apps.admin.sha256).toMatch(/^[a-f0-9]{64}$/);
  expect(renderApps(release)).toContain('Angel Mídia Admin');
  expect(renderApps(release)).toContain('Angel Mídia TV');
});

it.each(['admin', 'tv'])('mantém o hash real do APK %s', (kind) => {
  const app = release.apps[kind];
  const bytes = readFileSync(new URL(`../${app.path.replace('./', '')}`, import.meta.url));
  expect(createHash('sha256').update(bytes).digest('hex')).toBe(app.sha256);
  expect(bytes.length).toBe(app.sizeBytes);
});
