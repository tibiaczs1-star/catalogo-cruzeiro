export function createTrafficNoise() {
  let context = null;
  let master = null;
  let carGain = null;
  let motoGain = null;
  let tireGain = null;
  let carOsc = null;
  let carSub = null;
  let motoOsc = null;
  let motoLfo = null;
  let motoLfoGain = null;
  let noiseSource = null;
  let started = false;
  let lastHornAt = 0;

  function makeNoiseBuffer(ctx) {
    const length = Math.max(1, Math.floor(ctx.sampleRate * 1.2));
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let index = 0; index < length; index += 1) {
      data[index] = (Math.random() * 2 - 1) * 0.22;
    }
    return buffer;
  }

  function start() {
    if (started) return true;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return false;
    try {
      context = context || new AudioContext();
      master = context.createGain();
      carGain = context.createGain();
      motoGain = context.createGain();
      tireGain = context.createGain();
      carOsc = context.createOscillator();
      carSub = context.createOscillator();
      motoOsc = context.createOscillator();
      motoLfo = context.createOscillator();
      motoLfoGain = context.createGain();
      noiseSource = context.createBufferSource();

      master.gain.value = 0.0001;
      carGain.gain.value = 0.0001;
      motoGain.gain.value = 0.0001;
      tireGain.gain.value = 0.0001;

      carOsc.type = "sawtooth";
      carOsc.frequency.value = 72;
      carSub.type = "sine";
      carSub.frequency.value = 38;
      motoOsc.type = "sawtooth";
      motoOsc.frequency.value = 144;
      motoLfo.type = "triangle";
      motoLfo.frequency.value = 7.5;
      motoLfoGain.gain.value = 18;

      noiseSource.buffer = makeNoiseBuffer(context);
      noiseSource.loop = true;

      motoLfo.connect(motoLfoGain);
      motoLfoGain.connect(motoOsc.frequency);
      carOsc.connect(carGain);
      carSub.connect(carGain);
      motoOsc.connect(motoGain);
      noiseSource.connect(tireGain);
      carGain.connect(master);
      motoGain.connect(master);
      tireGain.connect(master);
      master.connect(context.destination);

      carOsc.start();
      carSub.start();
      motoOsc.start();
      motoLfo.start();
      noiseSource.start();
      started = true;
      if (context.state === "suspended") {
        void context.resume();
      }
      return true;
    } catch (_error) {
      return false;
    }
  }

  function setIntensity({ car = 0, moto = 0, tire = 0 } = {}) {
    if (!started && (car > 0 || moto > 0 || tire > 0)) start();
    if (!started || !context) return;
    const now = context.currentTime;
    const safeCar = Math.max(0, Math.min(1, car));
    const safeMoto = Math.max(0, Math.min(1, moto));
    const safeTire = Math.max(0, Math.min(1, tire));
    master.gain.cancelScheduledValues(now);
    carGain.gain.cancelScheduledValues(now);
    motoGain.gain.cancelScheduledValues(now);
    tireGain.gain.cancelScheduledValues(now);
    master.gain.setTargetAtTime(Math.max(0.0001, Math.max(safeCar, safeMoto, safeTire) * 0.055), now, 0.08);
    carGain.gain.setTargetAtTime(Math.max(0.0001, safeCar * 0.24), now, 0.1);
    motoGain.gain.setTargetAtTime(Math.max(0.0001, safeMoto * 0.16), now, 0.06);
    tireGain.gain.setTargetAtTime(Math.max(0.0001, safeTire * 0.05), now, 0.12);
    if (carOsc) carOsc.frequency.setTargetAtTime(68 + safeCar * 24, now, 0.15);
    if (carSub) carSub.frequency.setTargetAtTime(34 + safeCar * 10, now, 0.15);
    if (motoOsc) motoOsc.frequency.setTargetAtTime(132 + safeMoto * 52, now, 0.08);
  }

  function accent(kind = "car") {
    if (!started) start();
    if (!started || !context) return;
    const now = context.currentTime;
    const target = kind === "moto" ? motoGain : carGain;
    const amount = kind === "moto" ? 0.3 : 0.22;
    target?.gain.cancelScheduledValues(now);
    target?.gain.setValueAtTime(amount, now);
    target?.gain.exponentialRampToValueAtTime(0.035, now + 0.28);
  }

  function honk(kind = "car") {
    if (!started) start();
    if (!started || !context) return;
    const now = context.currentTime;
    if (now - lastHornAt < 0.65) return;
    lastHornAt = now;
    const output = master || context.destination;
    const gain = context.createGain();
    const toneA = context.createOscillator();
    const toneB = context.createOscillator();
    const base = kind === "moto" ? 430 : 310;

    toneA.type = "square";
    toneB.type = "triangle";
    toneA.frequency.setValueAtTime(base, now);
    toneB.frequency.setValueAtTime(base * 1.18, now);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(kind === "moto" ? 0.105 : 0.135, now + 0.018);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.19);

    toneA.connect(gain);
    toneB.connect(gain);
    gain.connect(output);
    toneA.start(now);
    toneB.start(now);
    toneA.stop(now + 0.22);
    toneB.stop(now + 0.22);
  }

  function stop() {
    setIntensity({ car: 0, moto: 0, tire: 0 });
  }

  function destroy() {
    try {
      carOsc?.stop();
      carSub?.stop();
      motoOsc?.stop();
      motoLfo?.stop();
      noiseSource?.stop();
    } catch (_error) {
      // Audio nodes may already be stopped.
    }
    carOsc = null;
    carSub = null;
    motoOsc = null;
    motoLfo = null;
    motoLfoGain = null;
    noiseSource = null;
    master = null;
    carGain = null;
    motoGain = null;
    tireGain = null;
    started = false;
  }

  return {
    start,
    setIntensity,
    accent,
    honk,
    stop,
    destroy
  };
}
