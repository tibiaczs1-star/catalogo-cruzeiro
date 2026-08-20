const SOUND_KEY = 'angel-sound';
const DEFAULTS = Object.freeze({ muted: false, volume: 0.35 });
const SOUND_URLS = Object.freeze({
  selection: './assets/sounds/start.ogg',
  success: './assets/sounds/success.ogg',
  alert: './assets/sounds/alert.ogg',
  error: './assets/sounds/error.ogg',
  start: './assets/sounds/start.ogg',
});

const clampVolume = (value) => Math.min(1, Math.max(0, Number.isFinite(Number(value)) ? Number(value) : DEFAULTS.volume));

export function getSoundPreferences(storage = globalThis.localStorage) {
  try {
    const saved = JSON.parse(storage?.getItem(SOUND_KEY) || 'null');
    return { muted: Boolean(saved?.muted), volume: clampVolume(saved?.volume ?? DEFAULTS.volume) };
  } catch {
    return { ...DEFAULTS };
  }
}

export function setSoundPreferences(preferences, storage = globalThis.localStorage) {
  const current = getSoundPreferences(storage);
  const next = { muted: preferences?.muted ?? current.muted, volume: clampVolume(preferences?.volume ?? current.volume) };
  storage?.setItem(SOUND_KEY, JSON.stringify(next));
  return next;
}

export function playUiSound(kind, { mediaIsPlaying = false, storage = globalThis.localStorage } = {}) {
  const prefs = getSoundPreferences(storage);
  if (prefs.muted || mediaIsPlaying || !SOUND_URLS[kind] || typeof Audio === 'undefined') return false;
  if (typeof HTMLMediaElement !== 'undefined' && Audio.prototype instanceof HTMLMediaElement && /jsdom/i.test(globalThis.navigator?.userAgent || '')) return false;
  const audio = new Audio(SOUND_URLS[kind]);
  audio.volume = prefs.volume;
  void Promise.resolve(audio.play()).catch(() => {});
  return true;
}

export function toggleUiSounds(storage = globalThis.localStorage) {
  const current = getSoundPreferences(storage);
  return setSoundPreferences({ muted: !current.muted }, storage);
}
