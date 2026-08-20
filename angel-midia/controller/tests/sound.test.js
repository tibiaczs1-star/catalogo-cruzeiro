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

it('mantém a preferência em memória quando o armazenamento recusa a escrita', () => {
  const storage = {
    getItem: vi.fn(() => null),
    setItem: vi.fn(() => { throw new Error('quota'); }),
  };
  expect(() => setSoundPreferences({ muted: true, volume: 0.22 }, storage)).not.toThrow();
  expect(setSoundPreferences({ muted: true, volume: 0.22 }, storage)).toEqual({ muted: true, volume: 0.22 });
});

it('não cria Audio quando os efeitos estão silenciados', () => {
  const AudioSpy = vi.fn(function Audio() { this.play = vi.fn(); });
  vi.stubGlobal('Audio', AudioSpy);
  setSoundPreferences({ muted: true, volume: 0.18 }, localStorage);
  expect(playUiSound('selection')).toBe(false);
  expect(AudioSpy).not.toHaveBeenCalled();
  expect(getSoundPreferences(localStorage)).toEqual({ muted: true, volume: 0.18 });
});

it('toca seleção sem alterar o volume ou silêncio persistidos', () => {
  const play = vi.fn().mockResolvedValue(undefined);
  const AudioSpy = vi.fn(function Audio() { this.play = play; this.volume = 1; });
  vi.stubGlobal('Audio', AudioSpy);
  setSoundPreferences({ muted: false, volume: 0.18 }, localStorage);
  expect(playUiSound('selection')).toBe(true);
  expect(AudioSpy).toHaveBeenCalledOnce();
  expect(AudioSpy.mock.instances[0].volume).toBe(0.18);
  expect(getSoundPreferences(localStorage)).toEqual({ muted: false, volume: 0.18 });
});
