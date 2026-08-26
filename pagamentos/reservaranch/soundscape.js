(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.ArizonaSoundscape = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const SOURCES = {
    wind: "/pagamentos/reservaranch/assets/sfx/wind.mp3",
    cow: "/pagamentos/reservaranch/assets/sfx/cow.mp3",
    horse: "/pagamentos/reservaranch/assets/sfx/horse.mp3",
    gun: "/pagamentos/reservaranch/assets/sfx/gun.mp3",
    gate: "/pagamentos/reservaranch/assets/sfx/gate.mp3",
    boots: "/pagamentos/reservaranch/assets/sfx/boots.mp3",
    night: "/pagamentos/reservaranch/assets/sfx/night.mp3",
    fire: "/pagamentos/reservaranch/assets/sfx/fire.mp3",
    saloon: "/pagamentos/reservaranch/assets/sfx/saloon.mp3",
    coin: "/pagamentos/reservaranch/assets/sfx/coin.mp3",
  };
  // Sons ambientes do rancho: mugido, cavalo, noite e disparo distante.
  const DEFAULT_SOUNDS = ["cow", "horse", "night", "gun"];
  const SCENE_SOUND_LAYERS = {
    gate: ["gate", "horse"],
    trail: ["boots", "night"],
    saloon: ["saloon", "fire"],
    stage: ["saloon", "coin"],
    finale: ["saloon", "fire"],
  };
  const VOLUMES = {
    wind: 0.035,
    cow: 0.06,
    horse: 0.055,
    gun: 0.025,
    gate: 0.08,
    boots: 0.05,
    night: 0.035,
    fire: 0.04,
    saloon: 0.07,
    coin: 0.1,
  };

  function pickNonRepeating(items, last, random = Math.random) {
    const choices = items.filter((item) => item !== last);
    return choices[Math.floor(random() * choices.length)] || items[0];
  }

  function createSoundscape({ voice, random = Math.random } = {}) {
    let timer;
    let last;
    let started = false;
    let introPlayed = false;
    let activeCue = null;
    let activeNarration = null;
    const narrationsPlayed = new Set();
    const sceneSoundsPlayed = new Set();
    const wind = typeof Audio !== "undefined" ? new Audio(SOURCES.wind) : null;

    if (wind) {
      wind.loop = true;
      wind.volume = VOLUMES.wind;
      wind.preload = "auto";
    }

    function play(category, { exclusive = false } = {}) {
      if (typeof Audio === "undefined" || !SOURCES[category]) return;
      if (exclusive && activeCue) {
        activeCue.pause();
        activeCue.currentTime = 0;
      }
      const sound = new Audio(SOURCES[category]);
      sound.volume = VOLUMES[category] ?? 0.06;
      if (exclusive) {
        activeCue = sound;
        sound.addEventListener("ended", () => {
          if (activeCue === sound) activeCue = null;
        }, { once: true });
      }
      sound.play().catch(() => {});
    }

    function schedule() {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        last = pickNonRepeating(DEFAULT_SOUNDS, last, random);
        play(last);
        schedule();
      }, 10000 + random() * 11000);
    }

    function playScene(scene) {
      if (!started || !scene || sceneSoundsPlayed.has(scene)) return;
      const layers = SCENE_SOUND_LAYERS[scene] || [];
      if (!layers.length) return;
      sceneSoundsPlayed.add(scene);
      play(layers[0], { exclusive: true });
      if (layers[1]) window.setTimeout(() => play(layers[1]), 650);
    }

    function playSceneNarration(scene, source) {
      if (!started || !scene || !source || narrationsPlayed.has(scene) || typeof Audio === "undefined") return;
      narrationsPlayed.add(scene);
      activeNarration?.pause();
      const narration = new Audio(source);
      activeNarration = narration;
      narration.preload = "auto";
      narration.volume = 0.86;
      if (wind) wind.volume = 0.018;
      const restore = () => {
        if (activeNarration === narration) activeNarration = null;
        if (wind) wind.volume = VOLUMES.wind;
      };
      narration.addEventListener("ended", restore, { once: true });
      narration.addEventListener("error", restore, { once: true });
      narration.play().catch(restore);
    }

    return {
      hasPlayedIntro() {
        return introPlayed;
      },
      async start() {
        if (started) return;
        started = true;
        if (voice && !introPlayed) {
          introPlayed = true;
          voice.currentTime = 0;
          voice.volume = 0.9;
          await voice.play().catch(() => {});
        }
        wind?.play().catch(() => {});
        schedule();
      },
      cue(category) {
        play(category, { exclusive: ["gate", "boots", "saloon", "fire"].includes(category) });
      },
      playScene,
      playSceneNarration,
      stop() {
        window.clearTimeout(timer);
        activeCue?.pause();
        activeNarration?.pause();
        activeCue = null;
        activeNarration = null;
        if (wind) {
          wind.pause();
          wind.currentTime = 0;
        }
        started = false;
      },
    };
  }

  return { SOURCES, pickNonRepeating, createSoundscape };
});
