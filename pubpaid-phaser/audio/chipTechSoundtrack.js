const AudioContextClass = window.AudioContext || window.webkitAudioContext;

const NOTE = {
  C2: 65.41,
  D2: 73.42,
  E2: 82.41,
  F2: 87.31,
  G2: 98.0,
  A2: 110.0,
  B2: 123.47,
  C3: 130.81,
  D3: 146.83,
  E3: 164.81,
  F3: 174.61,
  G3: 196.0,
  A3: 220.0,
  B3: 246.94,
  C4: 261.63,
  D4: 293.66,
  E4: 329.63,
  F4: 349.23,
  G4: 392.0,
  A4: 440.0,
  B4: 493.88,
  C5: 523.25,
  D5: 587.33,
  E5: 659.25,
  F5: 698.46,
  G5: 783.99,
  A5: 880.0,
  B5: 987.77
};

const STEPS_PER_BAR = 16;
const TEMPO = 132;
const STEP_SECONDS = 60 / TEMPO / 4;
const LOOKAHEAD_MS = 80;
const SCHEDULE_AHEAD = 0.24;

const ARP_PATTERNS = [
  [NOTE.E4, NOTE.G4, NOTE.B4, NOTE.D5, NOTE.G5, NOTE.E5, NOTE.B4, NOTE.G4],
  [NOTE.C4, NOTE.E4, NOTE.G4, NOTE.B4, NOTE.E5, NOTE.C5, NOTE.G4, NOTE.E4],
  [NOTE.D4, NOTE.F4, NOTE.A4, NOTE.C5, NOTE.F5, NOTE.D5, NOTE.A4, NOTE.F4],
  [NOTE.B3, NOTE.D4, NOTE.F4, NOTE.A4, NOTE.D5, NOTE.B4, NOTE.F4, NOTE.D4]
];

const BASS_PATTERNS = [
  [NOTE.E2, null, NOTE.E2, NOTE.B2, NOTE.G2, null, NOTE.E2, NOTE.D2],
  [NOTE.C2, null, NOTE.C3, NOTE.G2, NOTE.E2, null, NOTE.C2, NOTE.D2],
  [NOTE.D2, null, NOTE.D3, NOTE.A2, NOTE.F2, null, NOTE.D2, NOTE.C2],
  [NOTE.B2, null, NOTE.B2, NOTE.F2, NOTE.A2, null, NOTE.B2, NOTE.D3]
];

const PAD_CHORDS = [
  [NOTE.E3, NOTE.B3, NOTE.G4],
  [NOTE.C3, NOTE.G3, NOTE.E4],
  [NOTE.D3, NOTE.A3, NOTE.F4],
  [NOTE.B2, NOTE.F3, NOTE.D4]
];

const SAMBA_BASS_PATTERNS = [
  [NOTE.A2, null, NOTE.E2, NOTE.A2, null, NOTE.G2, NOTE.A2, NOTE.C3],
  [NOTE.F2, null, NOTE.C3, NOTE.F2, null, NOTE.E2, NOTE.F2, NOTE.A2],
  [NOTE.G2, null, NOTE.D3, NOTE.G2, null, NOTE.F2, NOTE.G2, NOTE.B2],
  [NOTE.E2, null, NOTE.B2, NOTE.E2, null, NOTE.D2, NOTE.E2, NOTE.G2]
];

const SAMBA_CHORDS = [
  [NOTE.A3, NOTE.C4, NOTE.E4],
  [NOTE.F3, NOTE.A3, NOTE.C4],
  [NOTE.G3, NOTE.B3, NOTE.D4],
  [NOTE.E3, NOTE.G3, NOTE.B3]
];

const SAMBA_PLUCKS = [
  [NOTE.C4, NOTE.E4, NOTE.A4, NOTE.C5, NOTE.E5, NOTE.C5, NOTE.A4, NOTE.E4],
  [NOTE.A3, NOTE.C4, NOTE.F4, NOTE.A4, NOTE.C5, NOTE.A4, NOTE.F4, NOTE.C4],
  [NOTE.B3, NOTE.D4, NOTE.G4, NOTE.B4, NOTE.D5, NOTE.B4, NOTE.G4, NOTE.D4],
  [NOTE.G3, NOTE.B3, NOTE.E4, NOTE.G4, NOTE.B4, NOTE.G4, NOTE.E4, NOTE.B3]
];

const GAME_THEMES = {
  "game-pool": {
    label: "32-bit sinuca brasileira com samba-rock e pagode neon",
    bass: [
      [NOTE.A2, null, NOTE.E2, NOTE.A2, null, NOTE.G2, NOTE.C3, null],
      [NOTE.F2, null, NOTE.C3, NOTE.F2, null, NOTE.E2, NOTE.A2, NOTE.C3]
    ],
    lead: [
      [NOTE.C4, NOTE.E4, NOTE.A4, NOTE.C5, NOTE.B4, NOTE.A4, NOTE.E4, NOTE.C4],
      [NOTE.A3, NOTE.C4, NOTE.F4, NOTE.A4, NOTE.G4, NOTE.F4, NOTE.E4, NOTE.C4]
    ],
    chords: [[NOTE.A3, NOTE.C4, NOTE.E4], [NOTE.F3, NOTE.A3, NOTE.C4], [NOTE.G3, NOTE.B3, NOTE.D4]],
    accent: NOTE.C5,
    filter: 6800,
    swing: 0.94
  },
  "game-checkers": {
    label: "32-bit damas brasileira com forró eletrônico e axé tático",
    bass: [
      [NOTE.D2, null, NOTE.A2, NOTE.D3, null, NOTE.C3, NOTE.A2, null],
      [NOTE.G2, null, NOTE.D3, NOTE.G2, null, NOTE.F2, NOTE.B2, null]
    ],
    lead: [
      [NOTE.F4, NOTE.A4, NOTE.D5, NOTE.C5, NOTE.A4, NOTE.G4, NOTE.F4, NOTE.D4],
      [NOTE.G4, NOTE.B4, NOTE.D5, NOTE.B4, NOTE.A4, NOTE.G4, NOTE.E4, NOTE.D4]
    ],
    chords: [[NOTE.D3, NOTE.F3, NOTE.A3], [NOTE.G3, NOTE.B3, NOTE.D4], [NOTE.C3, NOTE.E3, NOTE.G3]],
    accent: NOTE.D5,
    filter: 6400,
    swing: 0.82
  },
  "game-chess": {
    label: "32-bit xadrez brasileiro com bossa, funk leve e tensão elegante",
    bass: [
      [NOTE.C2, null, NOTE.G2, NOTE.B2, null, NOTE.A2, NOTE.G2, null],
      [NOTE.E2, null, NOTE.B2, NOTE.D3, null, NOTE.C3, NOTE.B2, null]
    ],
    lead: [
      [NOTE.E4, NOTE.G4, NOTE.B4, NOTE.D5, NOTE.C5, NOTE.B4, NOTE.G4, NOTE.E4],
      [NOTE.G3, NOTE.B3, NOTE.E4, NOTE.G4, NOTE.F4, NOTE.E4, NOTE.D4, NOTE.B3]
    ],
    chords: [[NOTE.C3, NOTE.E3, NOTE.B3], [NOTE.E3, NOTE.G3, NOTE.D4], [NOTE.A2, NOTE.E3, NOTE.C4]],
    accent: NOTE.B4,
    filter: 5600,
    swing: 0.68
  },
  "game-cards21": {
    label: "21 neon com batida curta de cassino",
    bass: [[NOTE.A2, null, NOTE.A2, NOTE.E3, null, NOTE.G2, NOTE.A2, NOTE.C3]],
    lead: [[NOTE.C4, NOTE.E4, NOTE.A4, NOTE.B4, NOTE.C5, NOTE.B4, NOTE.A4, NOTE.E4]],
    chords: [[NOTE.A3, NOTE.C4, NOTE.E4], [NOTE.G3, NOTE.B3, NOTE.D4]],
    accent: NOTE.C5,
    filter: 6900,
    swing: 0.84
  },
  "game-poker": {
    label: "pôquer noturno com baixo e tensão",
    bass: [[NOTE.E2, null, NOTE.B2, null, NOTE.D3, null, NOTE.B2, NOTE.G2]],
    lead: [[NOTE.G3, NOTE.B3, NOTE.D4, NOTE.F4, NOTE.G4, NOTE.F4, NOTE.D4, NOTE.B3]],
    chords: [[NOTE.E3, NOTE.G3, NOTE.B3], [NOTE.D3, NOTE.F3, NOTE.A3]],
    accent: NOTE.G5,
    filter: 5200,
    swing: 0.64
  },
  "game-truco": {
    label: "truco brasileiro com síncope de mesa",
    bass: [[NOTE.G2, null, NOTE.D3, NOTE.G2, null, NOTE.F2, NOTE.G2, NOTE.B2]],
    lead: [[NOTE.B3, NOTE.D4, NOTE.G4, NOTE.B4, NOTE.D5, NOTE.B4, NOTE.G4, NOTE.D4]],
    chords: [[NOTE.G3, NOTE.B3, NOTE.D4], [NOTE.E3, NOTE.G3, NOTE.B3]],
    accent: NOTE.D5,
    filter: 7200,
    swing: 0.96
  },
  "game-dicecups": {
    label: "dados com copos, metal e pulso de sorte",
    bass: [[NOTE.B2, null, NOTE.F2, NOTE.B2, null, NOTE.A2, NOTE.B2, NOTE.D3]],
    lead: [[NOTE.D4, NOTE.F4, NOTE.B4, NOTE.D5, NOTE.F5, NOTE.D5, NOTE.B4, NOTE.F4]],
    chords: [[NOTE.B2, NOTE.F3, NOTE.D4], [NOTE.A2, NOTE.E3, NOTE.C4]],
    accent: NOTE.B5,
    filter: 8000,
    swing: 1.08
  }
};

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function createNoiseBuffer(ctx) {
  const length = Math.floor(ctx.sampleRate * 0.18);
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  let seed = 0x2f6e2b1;
  for (let index = 0; index < length; index += 1) {
    seed ^= seed << 13;
    seed ^= seed >>> 17;
    seed ^= seed << 5;
    data[index] = ((seed >>> 0) / 0xffffffff) * 2 - 1;
  }
  return buffer;
}

function setEnvelope(gain, when, attack, decay, peak, sustain = 0.0001) {
  gain.gain.cancelScheduledValues(when);
  gain.gain.setValueAtTime(0.0001, when);
  gain.gain.linearRampToValueAtTime(peak, when + attack);
  gain.gain.exponentialRampToValueAtTime(sustain, when + attack + decay);
}

export function createPubPaidSoundtrack() {
  let ctx = null;
  let master = null;
  let compressor = null;
  let delay = null;
  let delayGain = null;
  let filter = null;
  let noiseBuffer = null;
  let timer = null;
  let enabled = false;
  let muted = false;
  let introSynced = false;
  let step = 0;
  let nextNoteTime = 0;
  let musicZone = "street";

  function ensureContext() {
    if (!AudioContextClass) return null;
    if (ctx) {
      if (ctx.state === "suspended") void ctx.resume();
      return ctx;
    }

    ctx = new AudioContextClass();
    compressor = ctx.createDynamicsCompressor();
    compressor.threshold.setValueAtTime(-20, ctx.currentTime);
    compressor.knee.setValueAtTime(18, ctx.currentTime);
    compressor.ratio.setValueAtTime(4.5, ctx.currentTime);
    compressor.attack.setValueAtTime(0.006, ctx.currentTime);
    compressor.release.setValueAtTime(0.18, ctx.currentTime);

    filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(8200, ctx.currentTime);
    filter.Q.setValueAtTime(0.7, ctx.currentTime);

    delay = ctx.createDelay(0.42);
    delay.delayTime.setValueAtTime(0.185, ctx.currentTime);
    delayGain = ctx.createGain();
    delayGain.gain.setValueAtTime(0.115, ctx.currentTime);

    master = ctx.createGain();
    master.gain.setValueAtTime(0.34, ctx.currentTime);

    delay.connect(delayGain);
    delayGain.connect(filter);
    filter.connect(compressor);
    compressor.connect(master);
    master.connect(ctx.destination);

    noiseBuffer = createNoiseBuffer(ctx);
    return ctx;
  }

  function connectVoice(node, sendDelay = 0.16) {
    const dry = ctx.createGain();
    const wet = ctx.createGain();
    dry.gain.setValueAtTime(1, ctx.currentTime);
    wet.gain.setValueAtTime(sendDelay, ctx.currentTime);
    node.connect(dry);
    node.connect(wet);
    dry.connect(filter);
    wet.connect(delay);
  }

  function playTone(frequency, when, duration, type, volume, detune = 0, sendDelay = 0.12) {
    if (!frequency) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, when);
    osc.detune.setValueAtTime(detune, when);
    setEnvelope(gain, when, 0.006, duration, volume);
    osc.connect(gain);
    connectVoice(gain, sendDelay);
    osc.start(when);
    osc.stop(when + duration + 0.04);
  }

  function playPad(chord, when, bar) {
    chord.forEach((frequency, index) => {
      playTone(frequency, when, 0.82, index % 2 ? "triangle" : "sawtooth", 0.026, bar % 2 ? 3 : -4, 0.24);
      playTone(frequency * 2, when + 0.015, 0.42, "square", 0.01, index * 5, 0.2);
    });
  }

  function playKick(when, accent = 1) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(94, when);
    osc.frequency.exponentialRampToValueAtTime(42, when + 0.1);
    setEnvelope(gain, when, 0.004, 0.17, 0.2 * accent);
    osc.connect(gain);
    gain.connect(filter);
    osc.start(when);
    osc.stop(when + 0.19);
  }

  function playNoise(when, duration, volume, highpass = 1800) {
    const source = ctx.createBufferSource();
    const gain = ctx.createGain();
    const noiseFilter = ctx.createBiquadFilter();
    source.buffer = noiseBuffer;
    noiseFilter.type = "highpass";
    noiseFilter.frequency.setValueAtTime(highpass, when);
    setEnvelope(gain, when, 0.003, duration, volume);
    source.connect(noiseFilter);
    noiseFilter.connect(gain);
    connectVoice(gain, 0.08);
    source.start(when);
    source.stop(when + duration + 0.02);
  }

  function playGlitch(when, bar, stepInBar) {
    const amount = (bar + stepInBar) % 3 === 0 ? 1 : 0.72;
    playTone(NOTE.B5 + stepInBar * 3, when, 0.035, "square", 0.018 * amount, 0, 0.26);
    playTone(NOTE.E5 * 1.5, when + 0.025, 0.028, "sawtooth", 0.012 * amount, 18, 0.3);
  }

  function playRim(when, volume = 0.05) {
    playTone(NOTE.C5, when, 0.035, "square", volume, -18, 0.12);
    playTone(NOTE.G5, when + 0.012, 0.026, "triangle", volume * 0.5, 4, 0.18);
  }

  function playSambaKick(when, accent = 1) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(88, when);
    osc.frequency.exponentialRampToValueAtTime(46, when + 0.12);
    setEnvelope(gain, when, 0.004, 0.18, 0.17 * accent);
    osc.connect(gain);
    gain.connect(filter);
    osc.start(when);
    osc.stop(when + 0.2);
  }

  function playSambaStep(when) {
    const stepInBar = step % STEPS_PER_BAR;
    const bar = Math.floor(step / STEPS_PER_BAR);
    const phrase = Math.floor(bar / 2) % SAMBA_CHORDS.length;
    const bass = SAMBA_BASS_PATTERNS[phrase];
    const plucks = SAMBA_PLUCKS[phrase];

    if ([0, 7, 10].includes(stepInBar)) playSambaKick(when, stepInBar === 0 ? 1.12 : 0.78);
    if ([4, 12].includes(stepInBar)) {
      playNoise(when, 0.08, 0.05, 1700);
      playRim(when + 0.012, 0.038);
    }
    if ([2, 5, 8, 11, 14].includes(stepInBar)) playRim(when, stepInBar === 11 ? 0.052 : 0.034);
    if (stepInBar % 2 === 1 || stepInBar === 6) playNoise(when, 0.026, 0.015, 5800);

    if ([0, 3, 6, 10, 13].includes(stepInBar)) {
      const chord = SAMBA_CHORDS[phrase];
      chord.forEach((frequency, index) => {
        playTone(frequency, when + index * 0.006, 0.075, "square", 0.018, index * 4 - 5, 0.22);
      });
    }

    const bassNote = bass[stepInBar % bass.length];
    if (bassNote) {
      playTone(bassNote, when, 0.16, "triangle", stepInBar === 0 ? 0.06 : 0.043, 0, 0.04);
      playTone(bassNote * 2, when + 0.012, 0.08, "square", 0.014, -10, 0.08);
    }

    const pluckNote = plucks[stepInBar % plucks.length];
    if (![4, 12].includes(stepInBar)) {
      playTone(pluckNote, when, 0.07, stepInBar % 3 === 0 ? "triangle" : "square", 0.026, stepInBar % 2 ? 8 : -8, 0.28);
    }

    if (bar % 4 === 3 && stepInBar > 11) {
      playTone(NOTE.A4 + stepInBar * 4, when, 0.04, "square", 0.016, 16, 0.24);
    }

    filter.frequency.setTargetAtTime(6400 + Math.sin(step / 9) * 1200, when, 0.05);
    step += 1;
  }

  function playStreetStep(when) {
    const stepInBar = step % STEPS_PER_BAR;
    const bar = Math.floor(step / STEPS_PER_BAR);
    const phrase = Math.floor(bar / 2) % ARP_PATTERNS.length;
    const arp = ARP_PATTERNS[phrase];
    const bass = BASS_PATTERNS[phrase];

    if (stepInBar === 0) playPad(PAD_CHORDS[phrase], when, bar);
    if ([0, 6, 10].includes(stepInBar)) playKick(when, stepInBar === 0 ? 1.1 : 0.82);
    if ([4, 12].includes(stepInBar)) playNoise(when, 0.09, 0.062, 2300);
    if (stepInBar % 2 === 1) playNoise(when, 0.032, 0.018, 5400);

    const bassNote = bass[stepInBar % bass.length];
    if (bassNote) {
      playTone(bassNote, when, 0.18, "square", stepInBar === 0 ? 0.07 : 0.048, -8, 0.05);
      playTone(bassNote / 2, when, 0.2, "triangle", 0.025, 0, 0.02);
    }

    const arpNote = arp[stepInBar % arp.length];
    const octaveBoost = bar % 4 === 3 && stepInBar > 9 ? 2 : 1;
    playTone(arpNote * octaveBoost, when, 0.105, stepInBar % 4 === 0 ? "sawtooth" : "square", 0.034, stepInBar % 2 ? 7 : -7, 0.32);

    if (stepInBar === 14 || (bar % 4 === 3 && stepInBar > 11)) {
      playGlitch(when, bar, stepInBar);
    }

    const sweep = 5600 + Math.sin(step / 12) * 1800;
    filter.frequency.setTargetAtTime(clamp(sweep, 3400, 9200), when, 0.04);
    step += 1;
  }

  function playGameStep(when) {
    const theme = GAME_THEMES[musicZone] || GAME_THEMES["game-pool"];
    const stepInBar = step % STEPS_PER_BAR;
    const bar = Math.floor(step / STEPS_PER_BAR);
    const phrase = Math.floor(bar / 2) % theme.lead.length;
    const lead = theme.lead[phrase];
    const bass = theme.bass[phrase % theme.bass.length];
    const chord = theme.chords[bar % theme.chords.length];
    const swingOffset = stepInBar % 2 ? theme.swing * 0.012 : 0;
    const hitTime = when + swingOffset;

    if (stepInBar === 0) {
      playPad(chord, hitTime, bar);
      playKick(hitTime, 1.05);
      playTone(theme.accent, hitTime + 0.026, 0.065, "square", 0.022, bar % 2 ? 9 : -6, 0.28);
    }
    if ([4, 12].includes(stepInBar)) playNoise(hitTime, 0.075, 0.045, 2600 + theme.swing * 900);
    if ([2, 6, 10, 14].includes(stepInBar)) playRim(hitTime, 0.028 + theme.swing * 0.008);
    if (musicZone === "game-dicecups" && [3, 7, 11, 15].includes(stepInBar)) playNoise(hitTime, 0.025, 0.022, 7200);
    if (musicZone === "game-truco" && [5, 13].includes(stepInBar)) playTone(NOTE.G5, hitTime, 0.04, "triangle", 0.026, 24, 0.2);

    const bassNote = bass[stepInBar % bass.length];
    if (bassNote) {
      playTone(bassNote, hitTime, 0.15, musicZone === "game-chess" ? "triangle" : "square", 0.045, -4, 0.06);
      if (stepInBar === 0 || stepInBar === 8) playTone(bassNote / 2, hitTime, 0.18, "sine", 0.024, 0, 0.03);
    }

    const leadNote = lead[stepInBar % lead.length];
    if (leadNote && ![4, 12].includes(stepInBar)) {
      const type = musicZone === "game-poker" || musicZone === "game-chess" ? "triangle" : "square";
      playTone(leadNote, hitTime, 0.082, type, 0.024, stepInBar % 3 ? 7 : -9, 0.26);
    }

    filter.frequency.setTargetAtTime(clamp(theme.filter + Math.sin(step / 8) * 900, 3200, 9200), hitTime, 0.04);
    step += 1;
  }

  function scheduleStep(when) {
    if (musicZone === "salon") {
      playSambaStep(when);
    } else if (GAME_THEMES[musicZone]) {
      playGameStep(when);
    } else {
      playStreetStep(when);
    }
  }

  function scheduler() {
    if (!ctx || !enabled || muted) return;
    while (nextNoteTime < ctx.currentTime + SCHEDULE_AHEAD) {
      scheduleStep(nextNoteTime);
      nextNoteTime += STEP_SECONDS;
    }
  }

  function scheduleIntroDownbeat(when) {
    playKick(when, 1.25);
    playPad(PAD_CHORDS[0], when, 0);
    playTone(NOTE.E5, when + 0.02, 0.12, "square", 0.04, -6, 0.34);
    playTone(NOTE.B4, when + 0.085, 0.1, "sawtooth", 0.03, 8, 0.28);
  }

  function start(options = {}) {
    const audio = ensureContext();
    if (!audio) return false;
    const shouldRestart = Boolean(options.restart);
    enabled = true;
    muted = false;
    if (shouldRestart) {
      step = 0;
      introSynced = true;
      nextNoteTime = audio.currentTime + 0.035;
      scheduleIntroDownbeat(nextNoteTime);
      nextNoteTime += STEP_SECONDS;
    } else if (!timer || nextNoteTime <= audio.currentTime) {
      nextNoteTime = audio.currentTime + 0.05;
    }
    if (!timer) timer = window.setInterval(scheduler, LOOKAHEAD_MS);
    scheduler();
    return true;
  }

  function startIntro() {
    musicZone = "street";
    return start({ restart: true });
  }

  function setZone(zone) {
    const nextZone = zone === "salon" ? "salon" : GAME_THEMES[zone] ? zone : "street";
    if (musicZone === nextZone) return;
    musicZone = nextZone;
    step = 0;
    if (ctx && enabled && !muted) {
      nextNoteTime = ctx.currentTime + 0.045;
      if (GAME_THEMES[nextZone]) {
        const theme = GAME_THEMES[nextZone];
        playKick(nextNoteTime, 1.16);
        playTone(theme.accent, nextNoteTime + 0.025, 0.11, "square", 0.036, 0, 0.28);
        playNoise(nextNoteTime + 0.06, 0.08, 0.04, 3600);
      } else if (nextZone === "salon") {
        playSambaKick(nextNoteTime, 1.18);
        playRim(nextNoteTime + 0.05, 0.052);
      } else {
        scheduleIntroDownbeat(nextNoteTime);
      }
      nextNoteTime += STEP_SECONDS;
    }
  }

  function accentFrame(frameIndex, totalFrames) {
    if (!ctx || !enabled || muted) return;
    const when = ctx.currentTime + 0.018;
    const isMajor = frameIndex === 0 || frameIndex === totalFrames - 1 || frameIndex % 3 === 0;
    if (isMajor) {
      playTone(NOTE.E5 + frameIndex * 2, when, 0.05, "square", 0.022, frameIndex % 2 ? 10 : -10, 0.34);
    }
    if (frameIndex === 9 || frameIndex === 12 || frameIndex === totalFrames - 1) {
      playGlitch(when + 0.02, Math.floor(step / STEPS_PER_BAR), frameIndex);
    }
    if (frameIndex === totalFrames - 1) {
      playKick(when, 0.88);
      playNoise(when + 0.04, 0.11, 0.045, 2600);
    }
  }

  function playCue(cue = "select", gameId = "") {
    const audio = ensureContext();
    if (!audio) return false;
    if (!enabled || muted) {
      return false;
    }
    const theme = GAME_THEMES[`game-${gameId}`] || GAME_THEMES[musicZone] || GAME_THEMES["game-pool"];
    const when = audio.currentTime + 0.012;
    if (cue === "dice") {
      playNoise(when, 0.065, 0.075, 6200);
      playTone(NOTE.B4, when + 0.018, 0.05, "square", 0.028, 0, 0.16);
      playTone(NOTE.D5, when + 0.054, 0.055, "square", 0.026, 8, 0.18);
    } else if (cue === "card") {
      playNoise(when, 0.028, 0.038, 4800);
      playTone(theme.accent, when + 0.018, 0.05, "triangle", 0.022, -10, 0.18);
    } else if (cue === "win") {
      playKick(when, 1.12);
      playTone(theme.accent, when + 0.02, 0.09, "square", 0.036, 0, 0.28);
      playTone(theme.accent * 1.25, when + 0.08, 0.11, "triangle", 0.03, 6, 0.32);
    } else if (cue === "pvp") {
      playKick(when, 1.22);
      playRim(when + 0.05, 0.052);
      playTone(theme.accent, when + 0.09, 0.08, "sawtooth", 0.03, 12, 0.28);
    } else if (cue === "launch" || cue === "ready") {
      playKick(when, cue === "launch" ? 1.02 : 0.88);
      playTone(theme.accent, when + 0.025, 0.075, "square", 0.026, cue === "ready" ? 12 : -8, 0.24);
      playNoise(when + 0.05, 0.055, 0.026, 3600);
    } else if (cue === "chess-move") {
      playTone(NOTE.E4, when, 0.038, "triangle", 0.024, -6, 0.08);
      playTone(NOTE.B4, when + 0.038, 0.042, "sine", 0.018, 4, 0.12);
    } else if (cue === "chess-capture") {
      playNoise(when, 0.055, 0.052, 2100);
      playKick(when + 0.018, 0.62);
      playTone(NOTE.E3, when + 0.052, 0.05, "triangle", 0.022, -8, 0.08);
    } else if (cue === "chess-check" || cue === "chess-mate") {
      playTone(theme.accent, when, 0.06, "triangle", 0.03, cue === "chess-mate" ? 12 : 0, 0.24);
      playTone(theme.accent * 1.25, when + 0.062, 0.075, "square", cue === "chess-mate" ? 0.034 : 0.024, 6, 0.28);
      if (cue === "chess-mate") playKick(when + 0.09, 0.95);
    } else if (cue === "action") {
      playTone(theme.accent * 0.75, when, 0.055, "square", 0.026, -5, 0.16);
      playTone(theme.accent, when + 0.045, 0.045, "triangle", 0.02, 7, 0.2);
    } else {
      playTone(theme.accent, when, 0.042, "square", 0.018, 0, 0.18);
    }
    scheduler();
    return true;
  }

  function stop() {
    enabled = false;
    muted = true;
    if (timer) {
      window.clearInterval(timer);
      timer = null;
    }
  }

  function toggle(force) {
    if (force === true) return start();
    if (force === false) {
      stop();
      return false;
    }
    if (enabled && !muted) {
      stop();
      return false;
    }
    return start();
  }

  function isPlaying() {
    return Boolean(enabled && !muted);
  }

  return {
    start,
    startIntro,
    setZone,
    stop,
    toggle,
    accentFrame,
    playCue,
    isPlaying,
    getState: () => ({
      available: Boolean(AudioContextClass),
      playing: isPlaying(),
      introSynced,
      zone: musicZone,
      step,
      tempo: TEMPO,
      style: GAME_THEMES[musicZone]?.label || (musicZone === "salon" ? "32-bit samba brasileiro hip-hop" : "32-bit techno layered")
    })
  };
}
