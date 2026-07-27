(() => {
  const overlay = document.querySelector("#intro-experience");
  const hold = document.querySelector("#intro-hold");
  const skip = document.querySelector("#intro-skip");
  const progress = overlay?.querySelector(".intro-progress span");
  const cosmosCanvas = document.querySelector("#intro-cosmos");

  if (!overlay || !hold || !skip || !progress) return;

  const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  const duration = 1850;
  let animationFrame = 0;
  let startedAt = 0;
  let pointerId = null;
  let completed = false;

  const createCosmos = (canvas, shouldReduceMotion) => {
    if (!canvas || shouldReduceMotion) {
      return { draw: () => {}, burst: () => {}, clear: () => {} };
    }

    const context = canvas.getContext("2d");
    const stars = Array.from({ length: 118 }, (_, index) => ({
      angle: Math.random() * Math.PI * 2,
      distance: 36 + Math.pow(Math.random(), 0.44) * 650,
      speed: 0.42 + Math.random() * 1.38,
      size: 0.35 + Math.random() * 1.75,
      tone: index % 3,
      seed: Math.random() * Math.PI * 2,
    }));
    let width = 0;
    let height = 0;
    let pixelRatio = 1;
    let burstFrame = 0;

    const resize = () => {
      const bounds = canvas.getBoundingClientRect();
      width = Math.max(1, bounds.width);
      height = Math.max(1, bounds.height);
      pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * pixelRatio);
      canvas.height = Math.round(height * pixelRatio);
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    };

    const clear = () => context.clearRect(0, 0, width, height);

    const render = (charge = 0, blast = 0) => {
      clear();
      const originX = width * 0.675;
      const originY = height * 0.505;
      const energy = Math.max(charge, blast);
      const vortexRadius = Math.min(width, height) * (0.08 + energy * 0.47);

      const aura = context.createRadialGradient(originX, originY, 0, originX, originY, vortexRadius);
      aura.addColorStop(0, `rgba(222, 255, 170, ${0.08 + energy * 0.34})`);
      aura.addColorStop(0.26, `rgba(102, 255, 184, ${energy * 0.17})`);
      aura.addColorStop(0.63, `rgba(38, 163, 255, ${energy * 0.09})`);
      aura.addColorStop(1, "rgba(0, 0, 0, 0)");
      context.fillStyle = aura;
      context.fillRect(0, 0, width, height);

      context.globalCompositeOperation = "lighter";
      stars.forEach((star) => {
        const contraction = charge * charge * 0.74;
        const expansion = blast * 2.15;
        const radius = Math.max(4, star.distance * (1 - contraction + expansion));
        const angle = star.angle + star.seed + charge * star.speed * 9 - blast * star.speed * 4;
        const x = originX + Math.cos(angle) * radius;
        const y = originY + Math.sin(angle) * radius * 0.62;
        const tail = 3 + charge * 22 + blast * 42;
        const alpha = Math.min(0.88, 0.08 + charge * 0.72 + blast * 0.85);
        const palette = ["194, 255, 88", "95, 235, 214", "126, 190, 255"];
        const tone = palette[star.tone];

        context.beginPath();
        context.moveTo(x, y);
        context.lineTo(
          originX + Math.cos(angle - 0.12 - star.speed * 0.02) * Math.max(0, radius - tail),
          originY + Math.sin(angle - 0.12 - star.speed * 0.02) * Math.max(0, radius - tail) * 0.62,
        );
        context.strokeStyle = `rgba(${tone}, ${alpha})`;
        context.lineWidth = Math.max(0.45, star.size * (0.55 + energy));
        context.stroke();

        context.beginPath();
        context.arc(x, y, star.size * (0.5 + energy * 0.9), 0, Math.PI * 2);
        context.fillStyle = `rgba(247, 255, 232, ${Math.min(0.98, alpha + 0.2)})`;
        context.fill();
      });
      context.globalCompositeOperation = "source-over";
    };

    const draw = (percent) => render(percent / 100);

    const burst = () => {
      window.cancelAnimationFrame(burstFrame);
      const begunAt = performance.now();
      const animateBurst = (now) => {
        const value = Math.min(1, (now - begunAt) / 720);
        render(1, value);
        if (value < 1) burstFrame = window.requestAnimationFrame(animateBurst);
        else clear();
      };
      burstFrame = window.requestAnimationFrame(animateBurst);
    };

    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();

    return { draw, burst, clear };
  };

  const createAudioEngine = (shouldReduceMotion) => {
    let audioContext;
    let masterGain;
    let chargeGain;
    let oscillators = [];

    const wake = () => {
      if (shouldReduceMotion) return false;
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return false;
      if (!audioContext) audioContext = new AudioContextClass();
      if (!masterGain) {
        masterGain = audioContext.createGain();
        masterGain.gain.value = 0.12;
        masterGain.connect(audioContext.destination);
      }
      audioContext.resume?.();
      return true;
    };

    const releaseCharge = () => {
      if (!audioContext || !chargeGain) return;
      const now = audioContext.currentTime;
      chargeGain.gain.cancelScheduledValues(now);
      chargeGain.gain.setValueAtTime(Math.max(0.0001, chargeGain.gain.value), now);
      chargeGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.1);
      window.setTimeout(() => {
        oscillators.forEach((oscillator) => {
          try { oscillator.stop(); } catch { /* oscillator already stopped */ }
        });
        oscillators = [];
        chargeGain?.disconnect();
        chargeGain = undefined;
      }, 150);
    };

    const startCharge = () => {
      if (!wake()) return;
      releaseCharge();
      const now = audioContext.currentTime;
      chargeGain = audioContext.createGain();
      chargeGain.gain.setValueAtTime(0.0001, now);
      chargeGain.gain.exponentialRampToValueAtTime(0.045, now + 0.26);
      chargeGain.connect(masterGain);

      const low = audioContext.createOscillator();
      low.type = "sine";
      low.frequency.setValueAtTime(78, now);
      low.connect(chargeGain);

      const air = audioContext.createOscillator();
      air.type = "triangle";
      air.frequency.setValueAtTime(236, now);
      air.connect(chargeGain);

      low.start(now);
      air.start(now);
      oscillators = [low, air];
    };

    const update = (percent) => {
      if (!audioContext || !chargeGain) return;
      const value = percent / 100;
      const now = audioContext.currentTime;
      chargeGain.gain.cancelScheduledValues(now);
      chargeGain.gain.setTargetAtTime(0.025 + value * 0.085, now, 0.04);
      oscillators[0]?.frequency.setTargetAtTime(78 + value * 116, now, 0.05);
      oscillators[1]?.frequency.setTargetAtTime(236 + value * 680, now, 0.05);
    };

    const burst = () => {
      if (!wake()) return;
      releaseCharge();
      const now = audioContext.currentTime;
      const hitGain = audioContext.createGain();
      hitGain.gain.setValueAtTime(0.0001, now);
      hitGain.gain.exponentialRampToValueAtTime(0.16, now + 0.018);
      hitGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.48);
      hitGain.connect(masterGain);

      const impact = audioContext.createOscillator();
      impact.type = "sine";
      impact.frequency.setValueAtTime(680, now);
      impact.frequency.exponentialRampToValueAtTime(54, now + 0.42);
      impact.connect(hitGain);
      impact.start(now);
      impact.stop(now + 0.5);

      const noiseBuffer = audioContext.createBuffer(1, audioContext.sampleRate * 0.35, audioContext.sampleRate);
      const data = noiseBuffer.getChannelData(0);
      for (let index = 0; index < data.length; index += 1) data[index] = (Math.random() * 2 - 1) * (1 - index / data.length);
      const noise = audioContext.createBufferSource();
      noise.buffer = noiseBuffer;
      noise.connect(hitGain);
      noise.start(now);
    };

    return { startCharge, update, stop: releaseCharge, burst };
  };

  const cosmos = createCosmos(cosmosCanvas, reducedMotion);
  const audio = createAudioEngine(reducedMotion);

  const resetParallax = () => {
    overlay.style.setProperty("--intro-parallax-x", "0");
    overlay.style.setProperty("--intro-parallax-y", "0");
    overlay.style.setProperty("--intro-parallax-shift-x", "0%");
    overlay.style.setProperty("--intro-parallax-shift-y", "0%");
    overlay.style.setProperty("--intro-parallax-tilt-x", "0deg");
    overlay.style.setProperty("--intro-parallax-tilt-y", "0deg");
  };

  const updateParallax = (event) => {
    if (reducedMotion || !event || !overlay.isConnected) return;
    if (!Number.isFinite(event.clientX) || !Number.isFinite(event.clientY)) return;
    const bounds = overlay.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;
    const x = Math.max(-1, Math.min(1, ((event.clientX - bounds.left) / bounds.width - .5) * 2));
    const y = Math.max(-1, Math.min(1, ((event.clientY - bounds.top) / bounds.height - .5) * 2));
    overlay.style.setProperty("--intro-parallax-x", x.toFixed(3));
    overlay.style.setProperty("--intro-parallax-y", y.toFixed(3));
    overlay.style.setProperty("--intro-parallax-shift-x", `${(x * -1.45).toFixed(2)}%`);
    overlay.style.setProperty("--intro-parallax-shift-y", `${(y * -1.2).toFixed(2)}%`);
    overlay.style.setProperty("--intro-parallax-tilt-x", `${(y * -4.5).toFixed(2)}deg`);
    overlay.style.setProperty("--intro-parallax-tilt-y", `${(x * 5.5).toFixed(2)}deg`);
  };

  const setProgress = (value) => {
    const safeValue = Math.max(0, Math.min(100, value));
    const unit = safeValue / 100;
    const shake = Math.pow(unit, 2) * 5.25;
    progress.textContent = `${Math.round(safeValue)}%`;
    hold.style.setProperty("--intro-progress", `${safeValue}%`);
    overlay.style.setProperty("--intro-progress-unit", String(unit));
    overlay.style.setProperty("--intro-shake-x", `${shake.toFixed(2)}px`);
    overlay.style.setProperty("--intro-shake-x-negative", `-${shake.toFixed(2)}px`);
    overlay.style.setProperty("--intro-shake-y", `${(shake * .58).toFixed(2)}px`);
    overlay.style.setProperty("--intro-shake-y-negative", `-${(shake * .58).toFixed(2)}px`);
    cosmos.draw(safeValue);
    audio.update(safeValue);
  };

  const removeOverlay = () => window.setTimeout(() => overlay.remove(), 1050);

  const finish = () => {
    if (completed) return;
    completed = true;
    window.cancelAnimationFrame(animationFrame);
    setProgress(100);
    cosmos.burst();
    audio.burst();
    overlay.classList.remove("is-pressing");
    overlay.classList.add("is-exploding");
    overlay.classList.add("is-revealing", "is-complete");
    document.body.classList.remove("intro-ready");
    hold.disabled = true;
    removeOverlay();
  };

  const skipIntro = () => {
    if (completed) return;
    completed = true;
    window.cancelAnimationFrame(animationFrame);
    audio.stop();
    cosmos.clear();
    overlay.classList.remove("is-pressing");
    overlay.classList.add("is-complete");
    document.body.classList.remove("intro-ready");
    hold.disabled = true;
    removeOverlay();
  };

  const reset = () => {
    if (completed) return;
    window.cancelAnimationFrame(animationFrame);
    animationFrame = 0;
    startedAt = 0;
    audio.stop();
    cosmos.clear();
    overlay.classList.remove("is-pressing");
    resetParallax();
    setProgress(0);
  };

  const tick = (now) => {
    const value = Math.min(1, (now - startedAt) / duration);
    setProgress(value * 100);
    if (value >= 1) {
      finish();
      return;
    }
    animationFrame = window.requestAnimationFrame(tick);
  };

  const start = (event) => {
    if (completed || hold.disabled) return;
    if (event?.pointerId != null) {
      pointerId = event.pointerId;
      hold.setPointerCapture?.(event.pointerId);
    }
    window.cancelAnimationFrame(animationFrame);
    updateParallax(event);
    setProgress(0);
    audio.startCharge();
    startedAt = performance.now();
    overlay.classList.add("is-pressing");
    animationFrame = window.requestAnimationFrame(tick);
  };

  const stop = (event) => {
    if (event?.pointerId != null && pointerId !== null && event.pointerId !== pointerId) return;
    pointerId = null;
    if (!completed) reset();
  };

  document.body.classList.add("intro-ready");
  setProgress(0);

  if (reducedMotion) overlay.classList.add("is-static");

  hold.addEventListener("pointerdown", (event) => { event.preventDefault(); start(event); });
  hold.addEventListener("pointermove", updateParallax);
  window.addEventListener("pointerup", stop);
  window.addEventListener("pointercancel", stop);
  hold.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    start(event);
  });
  hold.addEventListener("keyup", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    stop(event);
  });
  skip.addEventListener("click", skipIntro);
})();
