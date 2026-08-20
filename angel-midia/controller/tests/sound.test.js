// @vitest-environment jsdom
import { beforeEach, expect, it, vi } from 'vitest';
import { getSoundPreferences, playUiSound, setSoundPreferences } from '../src/sound.js';

beforeEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

it('usa preferências acessíveis por padrão', () => {
  expect(getSoundPreferences(localStorage)).toEqual({ muted: false, volume: 0.35 });
});

it('não toca som da interface enquanto uma mídia está tocando', () => {
  const play = vi.fn().mockResolvedValue(undefined);
  vi.stubGlobal('Audio', vi.fn(function Audio() { this.play = play; this.volume = 1; }));
  expect(playUiSound('success', { mediaIsPlaying: true })).toBe(false);
  expect(play).not.toHaveBeenCalled();
});

it('persiste silêncio e volume definidos pelo administrador', () => {
  setSoundPreferences({ muted: true, volume: 0.2 }, localStorage);
  expect(localStorage.getItem('angel-sound')).toContain('"muted":true');
  expect(getSoundPreferences(localStorage)).toEqual({ muted: true, volume: 0.2 });
});
