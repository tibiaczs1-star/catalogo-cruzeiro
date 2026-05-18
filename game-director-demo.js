(() => {
  "use strict";

  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d", { alpha: false });
  const W = canvas.width;
  const H = canvas.height;

  const keys = new Set();
  const particles = [];
  const telemetry = [];
  const hostSprite = new Image();
  hostSprite.src = "assets/game-director-demo/realistic-host-spritesheet-clean.png";
  const HOST_SHEET = { cell: 418, drawW: 82, drawH: 118 };

  const COLORS = {
    sky: "#1d3143",
    river: "#24384a",
    asphalt: "#34414a",
    asphalt2: "#3b4c55",
    sidewalk: "#68787d",
    sidewalk2: "#586970",
    wallBlue: "#4277a8",
    wallRed: "#b94e45",
    wallGreen: "#4f9b58",
    wallCream: "#c99355",
    roof: "#793f36",
    roofDark: "#4b2a2d",
    light: "#f0c85a",
    orange: "#d98236",
    leaf: "#2f6241",
    leafLight: "#4f9b58",
    text: "#fff4cf",
    ink: "#1a2028",
    paper: "#e8c98a",
    paperDark: "#c99355",
    playerSkin: "#d79a72",
    playerHair: "#34231d",
    playerShirt: "#f7d86a",
    playerVest: "#c84f4f",
    playerPants: "#2f4a63",
    package: "#c99355",
    danger: "#d94f4f",
    puddle: "#4277a8",
    goal: "#79e1a6",
    shadow: "rgba(18, 22, 28, 0.36)"
  };

  const state = {
    mode: "loading",
    loading: 0,
    loadingLabel: "dobrando jornal",
    time: 0,
    timer: 78,
    confidence: 3,
    wet: 0,
    score: 0,
    totalClues: 3,
    message: "Leve a pauta ate a banca antes da chuva apertar.",
    shake: 0,
    reducedMotion: false,
    player: {
      x: 58,
      y: 266,
      w: HOST_SHEET.drawW,
      h: HOST_SHEET.drawH,
      speed: 172,
      dir: "south",
      step: 0,
      invuln: 0
    },
    cart: {
      x: 475,
      y: 256,
      w: 70,
      h: 34,
      vx: 96,
      minX: 340,
      maxX: 680,
      warning: 0
    },
    clues: [],
    puddles: [],
    solids: [],
    goal: { x: 858, y: 220, w: 58, h: 88 },
    lastTile: "asfalto"
  };

  function log(event, data = {}) {
    telemetry.push({ t: Number(state.time.toFixed(2)), event, ...data });
    if (telemetry.length > 24) telemetry.shift();
  }

  function rect(x, y, w, h) {
    return { x, y, w, h };
  }

  function hit(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function playerFeet() {
    return {
      x: state.player.x + 26,
      y: state.player.y + 101,
      w: state.player.w - 52,
      h: 14
    };
  }

  function playerBody() {
    return {
      x: state.player.x + 24,
      y: state.player.y + 30,
      w: state.player.w - 48,
      h: 78
    };
  }

  function setupLevel() {
    state.time = 0;
    state.timer = 78;
    state.confidence = 3;
    state.wet = 0;
    state.score = 0;
    state.message = "Pegue 3 pistas e entregue na banca.";
    state.shake = 0;
    state.player.x = 58;
    state.player.y = 266;
    state.player.dir = "east";
    state.player.invuln = 0;
    state.cart.x = 475;
    state.cart.vx = 96;
    state.clues = [
      { ...rect(250, 318, 28, 24), label: "fonte", taken: false },
      { ...rect(548, 198, 28, 24), label: "foto", taken: false },
      { ...rect(732, 368, 28, 24), label: "nota", taken: false }
    ];
    state.puddles = [
      rect(190, 378, 92, 36),
      rect(604, 308, 100, 40),
      rect(778, 252, 70, 34)
    ];
    state.solids = [
      rect(0, 0, W, 156),
      rect(0, 462, W, 78),
      rect(150, 216, 72, 54),
      rect(338, 176, 96, 58),
      rect(464, 392, 92, 54),
      rect(684, 174, 92, 58),
      rect(822, 354, 70, 52),
      rect(30, 218, 36, 130),
      rect(924, 188, 36, 260)
    ];
    particles.length = 0;
    log("level_reset");
  }

  function setMode(mode) {
    state.mode = mode;
    log("mode", { mode });
  }

  function emit(x, y, color, count = 8, lift = 1) {
    if (state.reducedMotion) return;
    for (let i = 0; i < count; i += 1) {
      particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 90,
        vy: (Math.random() - 0.8 * lift) * 90,
        life: 0.35 + Math.random() * 0.35,
        color,
        size: 2 + Math.floor(Math.random() * 4)
      });
    }
  }

  function moveEntity(entity, dx, dy) {
    entity.x += dx;
    let feet = playerFeet();
    for (const solid of state.solids) {
      if (!hit(feet, solid)) continue;
      if (dx > 0) entity.x = solid.x - entity.w + 5;
      if (dx < 0) entity.x = solid.x + solid.w - 5;
      feet = playerFeet();
    }

    entity.y += dy;
    feet = playerFeet();
    for (const solid of state.solids) {
      if (!hit(feet, solid)) continue;
      if (dy > 0) entity.y = solid.y - entity.h;
      if (dy < 0) entity.y = solid.y + solid.h - 25;
      feet = playerFeet();
    }
  }

  function beginPlay() {
    setupLevel();
    setMode("playing");
  }

  function updateLoading(dt) {
    state.loading = Math.min(1, state.loading + dt * 0.54);
    if (state.loading < 0.25) state.loadingLabel = "dobrando jornal";
    else if (state.loading < 0.52) state.loadingLabel = "marcando colisao da rua";
    else if (state.loading < 0.78) state.loadingLabel = "ouvindo a feira";
    else state.loadingLabel = "chamando Lia";
    if (state.loading >= 1) setMode("intro");
  }

  function updatePlaying(dt) {
    state.time += dt;
    state.timer = Math.max(0, state.timer - dt);
    state.player.invuln = Math.max(0, state.player.invuln - dt);
    state.shake = Math.max(0, state.shake - dt * 7);
    state.cart.warning = Math.max(0, state.cart.warning - dt);

    let ix = 0;
    let iy = 0;
    if (keys.has("ArrowLeft") || keys.has("a")) ix -= 1;
    if (keys.has("ArrowRight") || keys.has("d")) ix += 1;
    if (keys.has("ArrowUp") || keys.has("w")) iy -= 1;
    if (keys.has("ArrowDown") || keys.has("s")) iy += 1;
    if (Math.abs(ix) > Math.abs(iy)) state.player.dir = ix < 0 ? "west" : "east";
    else if (iy !== 0) state.player.dir = iy < 0 ? "north" : "south";

    let slow = 1;
    const feet = playerFeet();
    state.lastTile = "asfalto";
    for (const puddle of state.puddles) {
      if (hit(feet, puddle)) {
        slow = 0.56;
        state.wet = Math.min(100, state.wet + dt * 9);
        state.lastTile = "poca";
      }
    }

    const len = Math.hypot(ix, iy) || 1;
    if (ix || iy) {
      state.player.step += dt * 11;
      moveEntity(state.player, (ix / len) * state.player.speed * slow * dt, (iy / len) * state.player.speed * slow * dt);
      if (!state.reducedMotion && Math.floor(state.player.step * 2) % 13 === 0) {
        emit(state.player.x + 13, state.player.y + 40, state.lastTile === "poca" ? COLORS.puddle : "#b08862", 1, 0.2);
      }
    }

    state.cart.x += state.cart.vx * dt;
    if (state.cart.x < state.cart.minX || state.cart.x > state.cart.maxX) {
      state.cart.vx *= -1;
      state.cart.x = Math.max(state.cart.minX, Math.min(state.cart.maxX, state.cart.x));
      state.cart.warning = 0.8;
    }

    const body = playerBody();
    if (hit(body, state.cart) && state.player.invuln <= 0) {
      state.confidence -= 1;
      state.player.invuln = 1.1;
      state.shake = 1;
      state.message = "Trombada no carrinho. Retome a rota.";
      emit(state.player.x + 13, state.player.y + 28, COLORS.danger, 12);
      log("hit_cart", { confidence: state.confidence });
      if (state.confidence <= 0) setMode("lose");
    }

    for (const clue of state.clues) {
      if (clue.taken || !hit(body, clue)) continue;
      clue.taken = true;
      state.score += 1;
      state.message = `${clue.label} confirmada (${state.score}/3).`;
      emit(clue.x + clue.w / 2, clue.y + clue.h / 2, COLORS.light, 12);
      log("collect_clue", { label: clue.label, score: state.score });
    }

    if (hit(body, state.goal)) {
      if (state.score >= state.totalClues) {
        setMode("win");
        emit(state.goal.x + 30, state.goal.y + 54, COLORS.goal, 22);
        log("win", { wet: Math.round(state.wet), timeLeft: Math.round(state.timer) });
      } else {
        state.message = `Faltam ${state.totalClues - state.score} pista(s) antes da banca.`;
      }
    }

    if (state.timer <= 0 || state.wet >= 100) {
      state.message = state.timer <= 0 ? "A chuva fechou a rua." : "A pauta molhou demais.";
      setMode("lose");
      log("lose", { reason: state.timer <= 0 ? "timer" : "wet" });
    }

    updateParticles(dt);
  }

  function updateParticles(dt) {
    for (let i = particles.length - 1; i >= 0; i -= 1) {
      const p = particles[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 120 * dt;
      if (p.life <= 0) particles.splice(i, 1);
    }
  }

  function update(dt) {
    if (state.mode === "loading") updateLoading(dt);
    else if (state.mode === "playing") updatePlaying(dt);
    else updateParticles(dt);
  }

  function px(x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  }

  function text(label, x, y, size = 18, color = COLORS.text, align = "left") {
    ctx.fillStyle = color;
    ctx.font = `700 ${size}px Arial, Helvetica, sans-serif`;
    ctx.textAlign = align;
    ctx.textBaseline = "top";
    ctx.fillText(label, x, y);
  }

  function drawFacade(x, y, w, h, wall, sign, signColor) {
    px(x, y + 20, w, h, wall);
    px(x - 4, y + 8, w + 8, 18, COLORS.roofDark);
    for (let i = 0; i < w; i += 18) px(x + i, y, 14, 10, COLORS.roof);
    px(x + 12, y + 42, w - 24, 24, signColor);
    text(sign, x + w / 2, y + 47, 13, COLORS.ink, "center");
    px(x + 18, y + 82, 24, 36, "#20303e");
    px(x + w - 44, y + 82, 24, 36, "#20303e");
    px(x + 22, y + 88, 16, 10, "#6da9c7");
    px(x + w - 40, y + 88, 16, 10, "#6da9c7");
  }

  function drawStreet() {
    px(0, 0, W, H, COLORS.river);
    px(0, 0, W, 126, COLORS.sky);
    px(0, 132, W, 52, COLORS.sidewalk);
    px(0, 184, W, 278, COLORS.asphalt);
    px(0, 462, W, 78, COLORS.sidewalk2);

    for (let x = 0; x < W; x += 64) {
      px(x, 175, 38, 5, "#d6c38a");
      px(x + 28, 430, 38, 5, "#d6c38a");
    }

    drawFacade(38, 30, 150, 116, COLORS.wallCream, "RADIO", COLORS.light);
    drawFacade(210, 20, 170, 126, COLORS.wallGreen, "MERCADO", "#e6d28a");
    drawFacade(408, 36, 150, 110, COLORS.wallBlue, "FARMA", "#dde7eb");
    drawFacade(600, 24, 170, 122, COLORS.wallRed, "LANCHES", COLORS.light);
    drawFacade(804, 42, 118, 104, "#8c6a46", "BANCA", COLORS.goal);

    px(32, 188, 34, 156, "#2d3c44");
    px(922, 178, 32, 260, "#2d3c44");
    drawTree(76, 454);
    drawTree(894, 454);
    drawStall(150, 216);
    drawStall(338, 176);
    drawMoto(684, 174);
    drawBoxes(464, 392);
    drawPost(822, 354);

    for (const p of state.puddles) drawPuddle(p);
    drawGoal();
  }

  function drawTree(x, y) {
    px(x - 7, y - 48, 14, 50, "#5d3b28");
    px(x - 34, y - 82, 70, 38, COLORS.leaf);
    px(x - 20, y - 96, 52, 32, COLORS.leafLight);
    px(x + 6, y - 76, 36, 28, "#397b4a");
  }

  function drawStall(x, y) {
    px(x, y + 22, 72, 32, "#72513d");
    px(x - 6, y + 8, 84, 16, COLORS.orange);
    for (let i = 0; i < 5; i += 1) px(x - 4 + i * 17, y + 8, 9, 16, i % 2 ? COLORS.light : COLORS.wallRed);
    px(x + 12, y + 32, 14, 12, COLORS.leafLight);
    px(x + 35, y + 31, 18, 13, COLORS.wallCream);
  }

  function drawMoto(x, y) {
    px(x, y + 28, 92, 26, "#222a32");
    px(x + 16, y + 12, 40, 20, COLORS.danger);
    px(x + 58, y + 4, 18, 24, COLORS.ink);
    px(x + 8, y + 48, 20, 20, "#111820");
    px(x + 62, y + 48, 20, 20, "#111820");
    px(x + 12, y + 52, 12, 12, "#7f8a92");
    px(x + 66, y + 52, 12, 12, "#7f8a92");
  }

  function drawBoxes(x, y) {
    px(x, y, 46, 34, COLORS.paperDark);
    px(x + 48, y + 9, 44, 26, COLORS.paper);
    px(x + 8, y + 12, 26, 5, "#8a5f3f");
    px(x + 60, y + 19, 18, 5, "#8a5f3f");
  }

  function drawPost(x, y) {
    px(x + 30, y - 52, 8, 94, "#3d4650");
    px(x + 8, y - 50, 52, 16, COLORS.light);
    px(x + 14, y - 46, 40, 8, "#7d5b26");
    px(x, y + 34, 70, 18, "#3b4750");
  }

  function drawPuddle(p) {
    px(p.x, p.y + 9, p.w, p.h - 16, "rgba(66,119,168,0.58)");
    px(p.x + 14, p.y + 4, p.w - 28, 8, "rgba(107,169,199,0.5)");
    px(p.x + 22, p.y + 18, 18, 4, "rgba(230,246,255,0.55)");
  }

  function drawGoal() {
    const g = state.goal;
    px(g.x, g.y, g.w, g.h, "#274a38");
    px(g.x + 6, g.y + 8, g.w - 12, 20, state.score >= state.totalClues ? COLORS.goal : "#7e8f84");
    text("BANCA", g.x + g.w / 2, g.y + 12, 12, COLORS.ink, "center");
    px(g.x + 18, g.y + 42, 22, 38, "#17251d");
    if (state.score >= state.totalClues) px(g.x + 22, g.y + 46, 14, 28, COLORS.light);
  }

  function drawClues() {
    for (const clue of state.clues) {
      if (clue.taken) continue;
      px(clue.x + 3, clue.y + 5, clue.w, clue.h, COLORS.shadow);
      px(clue.x, clue.y, clue.w, clue.h, COLORS.paper);
      px(clue.x + 4, clue.y + 5, clue.w - 8, 4, COLORS.wallBlue);
      px(clue.x + 5, clue.y + 13, clue.w - 10, 3, "#8a5f3f");
      px(clue.x + clue.w - 7, clue.y - 4, 8, 8, COLORS.light);
    }
  }

  function drawCart() {
    const c = state.cart;
    if (c.warning > 0) {
      px(c.x - 12, c.y - 22, c.w + 24, 8, COLORS.light);
      text("olha o carrinho", c.x + c.w / 2, c.y - 43, 13, COLORS.text, "center");
    }
    px(c.x, c.y + 6, c.w, c.h, "#825b3b");
    px(c.x + 8, c.y, c.w - 16, 14, COLORS.orange);
    px(c.x + 11, c.y + 18, 16, 16, COLORS.leafLight);
    px(c.x + 34, c.y + 18, 14, 16, COLORS.paper);
    px(c.x + 8, c.y + 34, 12, 12, COLORS.ink);
    px(c.x + 50, c.y + 34, 12, 12, COLORS.ink);
  }

  function drawLia() {
    const p = state.player;
    const moving = keys.has("ArrowLeft") || keys.has("ArrowRight") || keys.has("ArrowUp") || keys.has("ArrowDown") ||
      keys.has("a") || keys.has("d") || keys.has("w") || keys.has("s");
    const bob = state.mode === "playing" && moving && !state.reducedMotion ? Math.sin(state.player.step) * 1.5 : 0;
    const x = Math.round(p.x);
    const y = Math.round(p.y + bob);
    const blink = p.invuln > 0 && Math.floor(state.time * 18) % 2 === 0;
    if (blink) return;

    px(x + 18, y + 105, 48, 9, COLORS.shadow);

    if (!hostSprite.complete || !hostSprite.naturalWidth) {
      px(x + 24, y + 20, 34, 74, COLORS.ink);
      px(x + 30, y + 6, 24, 24, COLORS.playerSkin);
      return;
    }

    let row = 0;
    if (p.dir === "east") row = 1;
    if (p.dir === "west") row = 2;
    if (p.dir === "north") row = 0;
    const col = moving ? Math.abs(Math.floor(p.step * 0.9)) % 3 : 1;
    ctx.drawImage(
      hostSprite,
      col * HOST_SHEET.cell,
      row * HOST_SHEET.cell,
      HOST_SHEET.cell,
      HOST_SHEET.cell,
      x,
      y,
      HOST_SHEET.drawW,
      HOST_SHEET.drawH
    );
  }

  function drawParticles() {
    for (const p of particles) {
      ctx.globalAlpha = Math.max(0, Math.min(1, p.life / 0.5));
      px(p.x, p.y, p.size, p.size, p.color);
    }
    ctx.globalAlpha = 1;
  }

  function drawHud() {
    px(16, 14, 324, 74, "rgba(26,32,40,0.82)");
    px(24, 22, 158, 58, COLORS.paper);
    px(36, 34, 56, 6, COLORS.paperDark);
    text("RONDA", 38, 45, 15, COLORS.ink);
    text(`${state.score}/3 pistas`, 104, 45, 16, COLORS.ink);
    text(`tempo ${Math.ceil(state.timer)}`, 198, 27, 17);
    text(`conf. ${state.confidence}`, 198, 51, 17);
    px(360, 18, 210, 34, "rgba(26,32,40,0.72)");
    text(state.message, 372, 25, 15, COLORS.text);
    px(694, 18, 220, 22, "rgba(26,32,40,0.62)");
    px(700, 24, Math.max(0, 208 - state.wet * 2.08), 10, state.wet > 65 ? COLORS.danger : COLORS.goal);
    text("encomenda seca", 704, 43, 13, COLORS.text);
  }

  function drawLoading() {
    px(0, 0, W, H, COLORS.sky);
    drawStreet();
    px(0, 0, W, H, "rgba(18,24,31,0.68)");
    px(268, 142, 424, 250, COLORS.paper);
    px(290, 166, 382, 28, COLORS.ink);
    text("Correio do Jurua", W / 2, 168, 28, COLORS.light, "center");
    text("Rua Viva", W / 2, 214, 42, COLORS.ink, "center");
    px(326, 300, 308, 18, "#9b7649");
    px(330, 304, 300 * state.loading, 10, COLORS.wallBlue);
    text(state.loadingLabel, W / 2, 332, 18, COLORS.ink, "center");
  }

  function drawIntro() {
    drawStreet();
    drawClues();
    drawCart();
    drawLia();
    px(0, 0, W, H, "rgba(17,24,30,0.48)");
    px(190, 96, 580, 334, COLORS.paper);
    px(214, 120, 532, 54, COLORS.ink);
    text("Correio do Jurua: Rua Viva", W / 2, 132, 30, COLORS.light, "center");
    text("Uma ronda, tres pistas, um homem na rua e uma banca esperando.", W / 2, 206, 22, COLORS.ink, "center");
    text("WASD/setas movem. Pegue as pistas e evite o carrinho.", W / 2, 252, 19, COLORS.ink, "center");
    text("R reinicia. F tela cheia. M reduz movimento.", W / 2, 286, 17, "#5c4934", "center");
    drawButton("Enter / clique: começar ronda", 314, 340, 332, 56);
  }

  function drawButton(label, x, y, w, h) {
    px(x, y, w, h, COLORS.light);
    px(x + 5, y + 5, w - 10, h - 10, "#e4b64e");
    text(label, x + w / 2, y + 17, 20, COLORS.ink, "center");
  }

  function drawPlaying() {
    const sx = state.shake > 0 && !state.reducedMotion ? (Math.random() - 0.5) * state.shake * 8 : 0;
    const sy = state.shake > 0 && !state.reducedMotion ? (Math.random() - 0.5) * state.shake * 8 : 0;
    ctx.save();
    ctx.translate(sx, sy);
    drawStreet();
    drawClues();
    drawCart();
    drawLia();
    drawParticles();
    ctx.restore();
    drawHud();
  }

  function drawEnd(title, detail, color) {
    drawPlaying();
    px(0, 0, W, H, "rgba(18,24,31,0.64)");
    px(236, 146, 488, 260, COLORS.paper);
    px(260, 170, 440, 54, COLORS.ink);
    text(title, W / 2, 181, 34, color, "center");
    text(detail, W / 2, 250, 20, COLORS.ink, "center");
    text(`Pistas ${state.score}/3  |  Chuva ${Math.round(state.wet)}%`, W / 2, 290, 18, "#5c4934", "center");
    drawButton("R / clique: refazer ronda", 318, 330, 324, 54);
  }

  function render() {
    ctx.imageSmoothingEnabled = false;
    if (state.mode === "loading") drawLoading();
    else if (state.mode === "intro") drawIntro();
    else if (state.mode === "playing") drawPlaying();
    else if (state.mode === "win") drawEnd("Banca fechada com sucesso", "A rua reagiu: a pauta chegou antes da chuva.", COLORS.goal);
    else if (state.mode === "lose") drawEnd("Ronda interrompida", state.message || "A pauta nao chegou inteira.", COLORS.danger);
  }

  function confirmAction() {
    if (state.mode === "intro" || state.mode === "win" || state.mode === "lose") beginPlay();
  }

  window.addEventListener("keydown", (event) => {
    const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
    keys.add(key);
    if (key === "Enter" || key === " ") confirmAction();
    if (key === "r") beginPlay();
    if (key === "m") state.reducedMotion = !state.reducedMotion;
    if (key === "f") {
      if (!document.fullscreenElement) canvas.requestFullscreen?.();
      else document.exitFullscreen?.();
    }
  });

  window.addEventListener("keyup", (event) => {
    keys.delete(event.key.length === 1 ? event.key.toLowerCase() : event.key);
  });

  canvas.addEventListener("pointerdown", confirmAction);

  function renderGameToText() {
    return JSON.stringify({
      coordinateSystem: "origin top-left, x right, y down, canvas 960x540",
      mode: state.mode,
      objective: "collect 3 clues and reach BANCA",
      player: {
        x: Math.round(state.player.x),
        y: Math.round(state.player.y),
        dir: state.player.dir,
        spriteAnchor: "realistic-host-spritesheet-clean.png",
        confidence: state.confidence,
        wet: Math.round(state.wet)
      },
      cart: { x: Math.round(state.cart.x), y: state.cart.y, vx: Math.round(state.cart.vx) },
      score: state.score,
      totalClues: state.totalClues,
      timer: Math.ceil(state.timer),
      remainingClues: state.clues.filter((c) => !c.taken).map((c) => ({ label: c.label, x: c.x, y: c.y })),
      goalOpen: state.score >= state.totalClues,
      lastTile: state.lastTile,
      message: state.message,
      solids: state.solids.length,
      puddles: state.puddles.length,
      telemetry: telemetry.slice(-8)
    });
  }

  window.render_game_to_text = renderGameToText;
  window.advanceTime = (ms) => {
    const steps = Math.max(1, Math.round(ms / (1000 / 60)));
    for (let i = 0; i < steps; i += 1) update(1 / 60);
    render();
  };

  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.033, (now - last) / 1000);
    last = now;
    update(dt);
    render();
    requestAnimationFrame(frame);
  }

  setupLevel();
  requestAnimationFrame(frame);
})();
