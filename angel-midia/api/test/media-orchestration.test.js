import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('migration creates the complete media orchestration model', async () => {
  const sql = await readFile(new URL('../migrations/003_media_orchestration.sql', import.meta.url), 'utf8');
  for (const table of ['playlists', 'playlist_items', 'playback_status', 'download_status']) {
    assert.match(sql, new RegExp(`create table ${table}`, 'i'));
  }
  assert.match(sql, /playlist_id uuid/i);
  assert.match(sql, /image_duration_seconds integer/i);
  assert.match(sql, /unique\s*\(playlist_id,\s*position\)/i);
  assert.match(sql, /drop not null/i);
});
