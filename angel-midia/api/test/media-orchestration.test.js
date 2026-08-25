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

test('migration persists technical metadata and non-destructive presentation', async () => {
  const sql = await readFile(new URL('../migrations/004_media_presentation.sql', import.meta.url), 'utf8');
  for (const column of ['width', 'height', 'has_audio', 'thumbnail_key', 'fit_mode', 'focal_x', 'focal_y', 'zoom', 'rotation', 'background_color']) {
    assert.match(sql, new RegExp(column, 'i'));
  }
  for (const column of ['trim_start_seconds', 'trim_end_seconds', 'volume', 'transition_name']) {
    assert.match(sql, new RegExp(column, 'i'));
  }
  assert.match(sql, /fit_mode IN \('contain','cover','fill'\)/i);
  assert.match(sql, /focal_x BETWEEN 0 AND 100/i);
  assert.match(sql, /volume BETWEEN 0 AND 1/i);
});
