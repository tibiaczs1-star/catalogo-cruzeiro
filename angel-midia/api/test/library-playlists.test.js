import test from 'node:test';
import assert from 'node:assert/strict';
import { validatePlaylist } from '../src/routes/playlists.js';
import { validLibraryMetadata } from '../src/routes/library.js';

const image = '11111111-1111-4111-8111-111111111111';
const video = '22222222-2222-4222-8222-222222222222';

test('library metadata requires a display name', () => {
  assert.equal(validLibraryMetadata({ name: 'Oferta Agosto', durationSeconds: '12' }), true);
  assert.equal(validLibraryMetadata({ name: '', durationSeconds: '' }), false);
});

test('playlist preserves explicit item order and image duration', () => {
  const result = validatePlaylist({ name: 'Grade principal', items: [
    { assetId: image, type: 'image/png', position: 0, imageDurationSeconds: 8 },
    { assetId: video, type: 'video/mp4', position: 1, imageDurationSeconds: null },
  ] });
  assert.equal(result.ok, true);
  assert.deepEqual(result.value.items.map((item) => item.position), [0, 1]);
});

test('playlist rejects an image without duration and duplicate positions', () => {
  assert.equal(validatePlaylist({ name: 'Inválida', items: [{ assetId: image, type: 'image/png', position: 0, imageDurationSeconds: null }] }).ok, false);
  assert.equal(validatePlaylist({ name: 'Inválida', items: [{ assetId: image, type: 'image/png', position: 0, imageDurationSeconds: 5 }, { assetId: video, type: 'video/mp4', position: 0, imageDurationSeconds: null }] }).ok, false);
});
