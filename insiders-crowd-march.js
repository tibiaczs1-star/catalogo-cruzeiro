(() => {
  const crowdStage = document.querySelector("[data-insiders-crowd-stage]");
  const chantTrack = document.querySelector("[data-insiders-chant-track]");

  if (!crowdStage) {
    return;
  }

  const marchChants = [
    "NOS SOMOS OS INSIDERS",
    "QUEREMOS LIBERDADE",
    "QUEREMOS VERDADE",
    "VOZ NAS RUAS",
    "SEM MEDO DA VERDADE",
    "JORNALISMO VIVO"
  ];

  const placardLabels = [
    "INSIDERS",
    "LIBERDADE",
    "VERDADE",
    "VOZ PUBLICA",
    "SEM MEDO",
    "RUA VIVA"
  ];

  const leadBanners = [
    ["NOS SOMOS", "INSIDERS"],
    ["QUEREMOS", "VERDADE"],
    ["QUEREMOS", "LIBERDADE"]
  ];

  const paletteBank = [
    { coat: "#2f6ea5", accent: "#97d8ff", pants: "#17314b", hair: "#10151d", skin: "#c5885b" },
    { coat: "#8b3749", accent: "#ffc1c8", pants: "#251327", hair: "#121114", skin: "#d8a27e" },
    { coat: "#c07e2f", accent: "#ffe0a1", pants: "#3a2414", hair: "#21160f", skin: "#e0b38d" },
    { coat: "#2d7b65", accent: "#98ffe2", pants: "#163428", hair: "#0e1613", skin: "#b67850" },
    { coat: "#6b59ae", accent: "#ddd2ff", pants: "#231f43", hair: "#171424", skin: "#d0a17f" },
    { coat: "#4c5665", accent: "#f7f6ef", pants: "#1a2232", hair: "#10161f", skin: "#8a5c44" }
  ];

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const lerp = (start, end, amount) => start + (end - start) * amount;
  const mixAlpha = (hex, alpha) => {
    const normalized = hex.replace("#", "");
    const value = normalized.length === 3
      ? normalized
          .split("")
          .map((char) => char + char)
          .join("")
      : normalized;
    const channels = [0, 2, 4].map((offset) => Number.parseInt(value.slice(offset, offset + 2), 16));
    return `rgba(${channels[0]}, ${channels[1]}, ${channels[2]}, ${alpha})`;
  };
  const hash = (value) => {
    const seed = Math.sin(value * 127.1 + 311.7) * 43758.5453123;
    return seed - Math.floor(seed);
  };

  const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const canvas = document.createElement("canvas");
  const state = {
    width: 0,
    height: 0,
    dpr: 1,
    marchers: [],
    banners: [],
    frameId: 0,
    visible: false,
    driftX: 0,
    targetDriftX: 0
  };

  canvas.className = "insiders-crowd-canvas";
  canvas.setAttribute("aria-hidden", "true");
  crowdStage.textContent = "";
  crowdStage.appendChild(canvas);

  const context = canvas.getContext("2d");

  if (!context) {
    return;
  }

  const buildChantTrack = () => {
    if (!chantTrack) {
      return;
    }

    chantTrack.textContent = "";
    [...marchChants, ...marchChants].forEach((label) => {
      const item = document.createElement("span");
      item.className = "insiders-crowd-chant-pill";
      item.textContent = label;
      chantTrack.appendChild(item);
    });
  };

  const splitLabel = (label) => {
    const words = String(label || "").trim().split(/\s+/);
    if (words.length < 2) {
      return [label];
    }
    const pivot = Math.ceil(words.length / 2);
    return [words.slice(0, pivot).join(" "), words.slice(pivot).join(" ")];
  };

  const setCanvasSize = () => {
    const rect = crowdStage.getBoundingClientRect();
    const width = Math.max(320, Math.round(rect.width));
    const height = Math.max(420, Math.round(rect.height));
    const dpr = clamp(window.devicePixelRatio || 1, 1, 2);

    state.width = width;
    state.height = height;
    state.dpr = dpr;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    context.imageSmoothingEnabled = false;
  };

  const buildMarchers = () => {
    const compact = state.width < 720;
    const rowCount = compact ? 5 : 6;
    const marchers = [];
    const stagePadding = compact ? state.width * 0.04 : state.width * 0.055;
    const usableWidth = state.width - stagePadding * 2;

    for (let row = 0; row < rowCount; row += 1) {
      const depth = row / Math.max(1, rowCount - 1);
      const density = 1 - depth;
      const count = compact
        ? Math.round(lerp(12, 6, depth))
        : Math.round(lerp(16, 8, depth));
      const baseY = lerp(state.height * 0.43, state.height * 0.9, Math.pow(depth, 1.02));
      const scale = lerp(0.22, compact ? 0.84 : 1.06, Math.pow(depth, 1.16));
      const rowOffset = ((row % 2 === 0 ? -1 : 1) * usableWidth) / Math.max(28, compact ? 20 : 24);

      for (let index = 0; index < count; index += 1) {
        const seed = row * 101 + index * 13.17;
        const offset = hash(seed + 0.4) - 0.5;
        const slotX = stagePadding + ((index + 0.5) / count) * usableWidth;
        const jitterX = offset * lerp(state.width * 0.012, state.width * 0.034, density);
        const jitterY = (hash(seed + 0.8) - 0.5) * lerp(10, 22, depth);
        const x = clamp(slotX + jitterX + rowOffset, stagePadding, state.width - stagePadding);
        const y = baseY + jitterY;
        const palette = paletteBank[Math.floor(hash(seed + 1.2) * paletteBank.length)];
        const holdPlacard = depth > 0.2 && hash(seed + 2.1) > (depth > 0.72 ? 0.56 : 0.76);
        const widePlacard = holdPlacard && depth > 0.58 && hash(seed + 2.8) > 0.7;

        marchers.push({
          x,
          y,
          depth,
          scale,
          alpha: lerp(0.34, 0.96, Math.pow(depth, 0.72)),
          speed: lerp(0.7, 1.18, depth),
          phase: hash(seed + 3.3) * Math.PI * 2,
          drift: lerp(0.3, 1.2, depth),
          palette,
          holdPlacard,
          widePlacard,
          placardLabel: placardLabels[Math.floor(hash(seed + 4.9) * placardLabels.length)],
          placardLift: lerp(2.6, 4.8, hash(seed + 5.3)),
          placardSide: hash(seed + 5.7) > 0.5 ? 1 : -1,
          placardTilt: (hash(seed + 6.1) - 0.5) * lerp(0.8, 2.2, depth),
          cap: hash(seed + 6.2) > 0.72,
          backpack: hash(seed + 7.7) > 0.78
        });
      }
    }

    state.marchers = marchers.sort((left, right) => left.depth - right.depth);
    state.banners = [
      {
        x: state.width * 0.23,
        y: state.height * (compact ? 0.72 : 0.75),
        width: state.width * (compact ? 0.28 : 0.24),
        label: leadBanners[0],
        tone: "#ffd375"
      },
      {
        x: state.width * 0.56,
        y: state.height * (compact ? 0.79 : 0.81),
        width: state.width * (compact ? 0.3 : 0.26),
        label: leadBanners[1],
        tone: "#89d8ff"
      },
      {
        x: state.width * 0.82,
        y: state.height * (compact ? 0.68 : 0.71),
        width: state.width * (compact ? 0.22 : 0.2),
        label: leadBanners[2],
        tone: "#ffb984"
      }
    ];
  };

  const drawAtmosphere = () => {
    const sky = context.createLinearGradient(0, 0, 0, state.height);
    sky.addColorStop(0, "rgba(6, 14, 28, 0.1)");
    sky.addColorStop(0.5, "rgba(12, 17, 28, 0)");
    sky.addColorStop(1, "rgba(5, 8, 14, 0.22)");
    context.fillStyle = sky;
    context.fillRect(0, 0, state.width, state.height);

    const roadGlow = context.createRadialGradient(
      state.width * 0.5,
      state.height * 0.82,
      0,
      state.width * 0.5,
      state.height * 0.82,
      state.width * 0.42
    );
    roadGlow.addColorStop(0, "rgba(255, 185, 108, 0.18)");
    roadGlow.addColorStop(0.4, "rgba(255, 185, 108, 0.08)");
    roadGlow.addColorStop(1, "rgba(255, 185, 108, 0)");
    context.fillStyle = roadGlow;
    context.fillRect(0, state.height * 0.5, state.width, state.height * 0.5);

    context.fillStyle = "rgba(255, 234, 202, 0.09)";
    for (let index = 0; index < 18; index += 1) {
      const seed = index * 12.7;
      const x = hash(seed + 0.2) * state.width;
      const y = lerp(state.height * 0.36, state.height * 0.68, hash(seed + 0.4));
      const width = lerp(80, 220, hash(seed + 0.6));
      const height = lerp(10, 26, hash(seed + 0.8));
      context.fillRect(Math.round(x), Math.round(y), Math.round(width), Math.round(height));
    }
  };

  const drawLeadBanner = (banner, time) => {
    const wave = motionQuery.matches ? 0 : Math.sin(time * 0.0016 + banner.x * 0.002) * 6;
    const bannerHeight = Math.max(28, Math.round(banner.width * 0.18));
    const left = Math.round(banner.x - banner.width / 2 + state.driftX * 0.35);
    const top = Math.round(banner.y + wave);
    const fold = Math.round(Math.max(4, bannerHeight * 0.16));

    context.fillStyle = "rgba(31, 22, 18, 0.24)";
    context.fillRect(left + 10, top + bannerHeight + 12, Math.round(banner.width * 0.82), 12);

    context.fillStyle = "rgba(244, 236, 214, 0.9)";
    context.fillRect(left, top, Math.round(banner.width), bannerHeight);
    context.fillStyle = "rgba(19, 27, 42, 0.12)";
    context.fillRect(left, top + bannerHeight - fold, Math.round(banner.width), fold);
    context.fillStyle = mixAlpha(banner.tone, 0.82);
    context.fillRect(left, top, Math.round(banner.width), 4);
    context.fillStyle = "rgba(91, 65, 39, 0.72)";
    context.fillRect(left + 8, top, 3, bannerHeight + 22);
    context.fillRect(left + Math.round(banner.width) - 11, top, 3, bannerHeight + 22);

    context.fillStyle = "#162031";
    context.font = `900 ${Math.max(13, Math.round(bannerHeight * 0.44))}px Outfit, sans-serif`;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(banner.label[0], left + banner.width / 2, top + bannerHeight * 0.34);
    context.fillText(banner.label[1], left + banner.width / 2, top + bannerHeight * 0.72);
  };

  const drawPlacard = (marcher, baseX, headTop, pixel) => {
    if (!marcher.holdPlacard) {
      return;
    }

    const placardWidth = marcher.widePlacard ? pixel * 21 : pixel * 15;
    const placardHeight = marcher.widePlacard ? pixel * 10 : pixel * 8;
    const top = Math.round(headTop - placardHeight - pixel * marcher.placardLift);
    const left = Math.round(baseX - placardWidth / 2 + marcher.placardSide * pixel * 0.9);
    const stakeHeight = marcher.widePlacard ? pixel * 7 : pixel * 6;

    context.fillStyle = "rgba(9, 12, 18, 0.16)";
    context.fillRect(left + pixel, top + placardHeight + stakeHeight + pixel, placardWidth - pixel * 2, pixel * 2);
    context.fillStyle = "rgba(246, 239, 220, 0.94)";
    context.fillRect(left, top, placardWidth, placardHeight);
    context.fillStyle = "rgba(148, 101, 57, 0.7)";
    context.fillRect(left, top, placardWidth, pixel);
    context.fillStyle = "rgba(208, 178, 129, 0.9)";
    context.fillRect(left + pixel * 0.8, top + pixel * 0.8, placardWidth - pixel * 1.6, placardHeight - pixel * 1.6);
    context.fillStyle = "rgba(148, 101, 57, 0.78)";
    context.fillRect(left + pixel * 2, top + placardHeight, pixel, stakeHeight);
    context.fillRect(left + placardWidth - pixel * 3, top + placardHeight, pixel, stakeHeight);

    context.fillStyle = marcher.palette.accent;
    context.fillRect(left, top, placardWidth, Math.max(pixel, 2));
    context.fillStyle = "#141b28";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.font = `900 ${Math.max(8, Math.round(pixel * 2.45))}px "IBM Plex Mono", monospace`;

    const lines = marcher.widePlacard ? splitLabel(marcher.placardLabel) : [marcher.placardLabel];
    lines.slice(0, 2).forEach((line, index) => {
      const lineY = top + placardHeight * (lines.length === 1 ? 0.55 : index === 0 ? 0.38 : 0.72);
      context.fillText(line, left + placardWidth / 2, lineY);
    });
  };

  const drawMarcher = (marcher, time) => {
    const pixel = Math.max(1, Math.round(marcher.scale * 4));
    const bob = motionQuery.matches ? 0 : Math.sin(time * 0.005 * marcher.speed + marcher.phase) * pixel;
    const stride = motionQuery.matches ? 0 : Math.sin(time * 0.009 * marcher.speed + marcher.phase);
    const armLift = Math.round(stride * pixel * 1.5);
    const legLift = Math.round(stride * pixel * 1.8);
    const baseX = Math.round(marcher.x + state.driftX * marcher.drift);
    const footY = Math.round(marcher.y + bob);
    const hipY = footY - pixel * 8;
    const torsoTop = footY - pixel * 17;
    const headTop = footY - pixel * 24;

    context.globalAlpha = marcher.alpha;

    context.fillStyle = "rgba(3, 6, 12, 0.28)";
    context.fillRect(baseX - pixel * 6, footY + pixel * 2, pixel * 12, Math.max(2, pixel * 2));

    drawPlacard(marcher, baseX, headTop, pixel);

    context.fillStyle = marcher.palette.pants;
    context.fillRect(baseX - pixel * 3 + legLift, hipY, pixel * 2, pixel * 8);
    context.fillRect(baseX + pixel - legLift, hipY, pixel * 2, pixel * 8);

    context.fillStyle = marcher.palette.coat;
    context.fillRect(baseX - pixel * 4, torsoTop, pixel * 8, pixel * 9);

    context.fillStyle = mixAlpha(marcher.palette.accent, 0.84);
    context.fillRect(baseX - pixel, torsoTop + pixel * 2, pixel * 2, pixel * 4);

    context.fillStyle = marcher.palette.coat;
    context.fillRect(baseX - pixel * 6 + armLift, torsoTop + pixel, pixel * 2, pixel * 8);
    context.fillRect(baseX + pixel * 4 - armLift, torsoTop + pixel, pixel * 2, pixel * 8);

    context.fillStyle = marcher.palette.skin;
    context.fillRect(baseX - pixel * 3, headTop, pixel * 6, pixel * 5);

    if (marcher.cap) {
      context.fillStyle = marcher.palette.hair;
      context.fillRect(baseX - pixel * 4, headTop - pixel, pixel * 8, pixel * 2);
    } else {
      context.fillStyle = marcher.palette.hair;
      context.fillRect(baseX - pixel * 3, headTop, pixel * 6, pixel * 2);
    }

    if (marcher.backpack) {
      context.fillStyle = mixAlpha(marcher.palette.accent, 0.48);
      context.fillRect(baseX - pixel * 5, torsoTop + pixel, pixel, pixel * 6);
    }

    context.globalAlpha = 1;
  };

  const renderFrame = (time = 0) => {
    if (!state.width || !state.height) {
      return;
    }

    context.clearRect(0, 0, state.width, state.height);
    drawAtmosphere();

    state.driftX += (state.targetDriftX - state.driftX) * 0.08;

    state.marchers.forEach((marcher) => {
      if (marcher.depth < 0.58) {
        drawMarcher(marcher, time);
      }
    });

    state.banners.forEach((banner) => drawLeadBanner(banner, time));

    state.marchers.forEach((marcher) => {
      if (marcher.depth >= 0.58) {
        drawMarcher(marcher, time);
      }
    });

    const fog = context.createLinearGradient(0, state.height * 0.56, 0, state.height);
    fog.addColorStop(0, "rgba(18, 20, 30, 0)");
    fog.addColorStop(0.55, "rgba(9, 12, 19, 0.08)");
    fog.addColorStop(1, "rgba(5, 7, 12, 0.3)");
    context.fillStyle = fog;
    context.fillRect(0, state.height * 0.56, state.width, state.height * 0.44);
  };

  const tick = (time) => {
    renderFrame(time);
    if (!motionQuery.matches && state.visible) {
      state.frameId = window.requestAnimationFrame(tick);
    } else {
      state.frameId = 0;
    }
  };

  const stopAnimation = () => {
    if (state.frameId) {
      window.cancelAnimationFrame(state.frameId);
      state.frameId = 0;
    }
  };

  const startAnimation = () => {
    renderFrame(performance.now());
    if (motionQuery.matches || !state.visible || state.frameId) {
      return;
    }
    state.frameId = window.requestAnimationFrame(tick);
  };

  const rebuildScene = () => {
    setCanvasSize();
    buildMarchers();
    startAnimation();
  };

  crowdStage.addEventListener("pointermove", (event) => {
    const rect = crowdStage.getBoundingClientRect();
    if (!rect.width) {
      return;
    }
    const relativeX = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
    state.targetDriftX = clamp(relativeX * 16, -16, 16);
  });

  crowdStage.addEventListener("pointerleave", () => {
    state.targetDriftX = 0;
  });

  if ("ResizeObserver" in window) {
    const resizeObserver = new ResizeObserver(() => {
      rebuildScene();
    });
    resizeObserver.observe(crowdStage);
  } else {
    window.addEventListener("resize", rebuildScene);
  }

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          state.visible = entry.isIntersecting;
          if (state.visible) {
            startAnimation();
          } else {
            stopAnimation();
          }
        });
      },
      { rootMargin: "200px 0px", threshold: 0.05 }
    );
    observer.observe(crowdStage);
  } else {
    state.visible = true;
  }

  const handleMotionChange = () => {
    stopAnimation();
    startAnimation();
  };

  if (typeof motionQuery.addEventListener === "function") {
    motionQuery.addEventListener("change", handleMotionChange);
  } else if (typeof motionQuery.addListener === "function") {
    motionQuery.addListener(handleMotionChange);
  }

  buildChantTrack();
  state.visible = true;
  rebuildScene();
})();
