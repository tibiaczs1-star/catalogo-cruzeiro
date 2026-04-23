(function () {
  const canvas = document.querySelector("#cheffeCallGameCanvas");
  const theaterStack = document.querySelector(".theater-stack");
  if (!canvas || !theaterStack) return;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const particles = Array.from({ length: 60 }, (_, index) => ({
    x: (index * 37) % 1000,
    y: (index * 61) % 700,
    speed: 0.12 + (index % 7) * 0.03,
    radius: 1 + (index % 3),
    alpha: 0.16 + (index % 4) * 0.08
  }));
  const shafts = [0.22, 0.5, 0.78];
  let width = 0;
  let height = 0;
  let frame = 0;
  let hudHidden = false;
  let lowerDecksOpen = false;
  let speakerPulse = 0;

  function resize() {
    const rect = theaterStack.getBoundingClientRect();
    width = Math.max(1, Math.round(rect.width));
    height = Math.max(1, Math.round(rect.height));
    canvas.width = width;
    canvas.height = height;
  }

  function drawBackdrop() {
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, "rgba(8,14,24,0.08)");
    gradient.addColorStop(0.58, "rgba(8,14,24,0)");
    gradient.addColorStop(1, "rgba(3,7,12,0.42)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    const leftGlow = ctx.createRadialGradient(width * 0.14, height * 0.26, 0, width * 0.14, height * 0.26, width * 0.28);
    leftGlow.addColorStop(0, "rgba(127,231,255,0.16)");
    leftGlow.addColorStop(1, "rgba(127,231,255,0)");
    ctx.fillStyle = leftGlow;
    ctx.fillRect(0, 0, width, height);

    const rightGlow = ctx.createRadialGradient(width * 0.86, height * 0.24, 0, width * 0.86, height * 0.24, width * 0.24);
    rightGlow.addColorStop(0, "rgba(244,201,107,0.12)");
    rightGlow.addColorStop(1, "rgba(244,201,107,0)");
    ctx.fillStyle = rightGlow;
    ctx.fillRect(0, 0, width, height);
  }

  function drawShafts() {
    shafts.forEach((position, index) => {
      const x = width * position;
      const pulse = Math.sin(frame * 0.02 + index * 1.8) * 0.5 + 0.5;
      ctx.fillStyle = `rgba(127,231,255,${0.1 + pulse * 0.12})`;
      ctx.fillRect(x - 2, height * 0.58, 4, height * 0.34);
      ctx.fillStyle = `rgba(127,231,255,${0.18 + pulse * 0.12})`;
      ctx.fillRect(x - 1, height * 0.58, 2, height * 0.34);
    });
  }

  function drawTraffic() {
    particles.forEach((particle, index) => {
      particle.y += particle.speed;
      if (particle.y > height * 0.98) {
        particle.y = height * 0.58;
        particle.x = (index * 53 + frame * 3) % width;
      }
      ctx.beginPath();
      ctx.fillStyle = `rgba(127,231,255,${particle.alpha})`;
      ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function drawStagePulse() {
    const y = height * 0.66;
    const pulse = Math.sin(frame * 0.04) * 0.5 + 0.5;
    const active = 0.18 + speakerPulse * 0.2;
    ctx.fillStyle = `rgba(244,201,107,${active * (0.6 + pulse * 0.4)})`;
    ctx.fillRect(width * 0.34, y, width * 0.32, 3);
    ctx.fillStyle = `rgba(127,231,255,${0.12 + pulse * 0.08})`;
    ctx.fillRect(width * 0.28, y + 16, width * 0.44, 2);
  }

  function drawDatacenterWave() {
    const baseY = height * 0.88;
    for (let index = 0; index < 3; index += 1) {
      const waveOffset = frame * 0.04 + index * 1.6;
      ctx.strokeStyle = `rgba(127,231,255,${0.14 + index * 0.05})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let step = 0; step <= width; step += 12) {
        const y = baseY + Math.sin(step * 0.01 + waveOffset) * (6 + index * 2);
        if (step === 0) ctx.moveTo(step, y);
        else ctx.lineTo(step, y);
      }
      ctx.stroke();
    }
  }

  function render() {
    frame += 1;
    speakerPulse = Math.max(0, speakerPulse - 0.01);
    ctx.clearRect(0, 0, width, height);
    drawBackdrop();
    if (!hudHidden) drawShafts();
    drawTraffic();
    drawStagePulse();
    drawDatacenterWave();
    if (lowerDecksOpen) {
      ctx.fillStyle = "rgba(8,14,24,0.16)";
      ctx.fillRect(0, height * 0.76, width, height * 0.24);
    }
    requestAnimationFrame(render);
  }

  window.addEventListener("resize", resize);
  window.addEventListener("cheffe-call:scene-state", (event) => {
    hudHidden = Boolean(event.detail?.hudHidden);
    lowerDecksOpen = Boolean(event.detail?.lowerDecksOpen);
    if (event.detail?.speaker) {
      speakerPulse = 1;
    }
  });

  resize();
  render();
})();
