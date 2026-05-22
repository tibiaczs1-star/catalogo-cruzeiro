(() => {
  "use strict";

  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");

  const W = canvas.width;
  const H = canvas.height;
  const HUD_H = 96;
  const BALL_R = 10;
  const INTRO_DURATION = 2.05;
  const query = new URLSearchParams(window.location.search);
  const embeddedMode = query.get("mode") === "pvp" ? "pvp" : "demo";
  const table = { x: 58, y: 124, w: 844, h: 354 };
  const field = { x: 102, y: 156, w: 756, h: 286 };
  const POCKET = { railOffset: 14, rim: 13, throat: 9, catch: 46 };
  const TOUCH_AIM_MOVE_THRESHOLD = 12;
  const TOUCH_AIM_HOLD_MS = 240;
  const pockets = [
    { name: "sup-esq", x: field.x - POCKET.railOffset, y: field.y - POCKET.railOffset },
    { name: "sup", x: field.x + field.w / 2, y: field.y - POCKET.railOffset },
    { name: "sup-dir", x: field.x + field.w + POCKET.railOffset, y: field.y - POCKET.railOffset },
    { name: "inf-esq", x: field.x - POCKET.railOffset, y: field.y + field.h + POCKET.railOffset },
    { name: "inf", x: field.x + field.w / 2, y: field.y + field.h + POCKET.railOffset },
    { name: "inf-dir", x: field.x + field.w + POCKET.railOffset, y: field.y + field.h + POCKET.railOffset },
  ];

  const spinStates = [
    { id: "CENTRO", label: "CENTRO", vx: 0, vy: 0, turn: 0 },
    { id: "SEGUE", label: "SEGUE", vx: 0, vy: -0.58, turn: 0 },
    { id: "PUXA", label: "PUXA", vx: 0, vy: 0.58, turn: 0 },
    { id: "ESQ", label: "ESQ", vx: -0.58, vy: 0, turn: -0.010 },
    { id: "DIR", label: "DIR", vx: 0.58, vy: 0, turn: 0.010 },
  ];

  const spinControls = [
    { index: 0, key: "1", label: "•", title: "CENTRO", x: 425, y: 56, w: 18, h: 18 },
    { index: 1, key: "2", label: "↑", title: "SEGUE", x: 425, y: 34, w: 18, h: 18 },
    { index: 2, key: "3", label: "↓", title: "PUXA", x: 425, y: 78, w: 18, h: 18 },
    { index: 3, key: "4", label: "←", title: "ESQ", x: 403, y: 56, w: 18, h: 18 },
    { index: 4, key: "5", label: "→", title: "DIR", x: 447, y: 56, w: 18, h: 18 },
  ];
  const spinBallHud = { x: 384, y: 60, r: 22 };

  const ballPalette = {
    1: "#f0b12d",
    2: "#2a63c7",
    3: "#c8242c",
    4: "#742db6",
    5: "#e26a19",
    6: "#1f8c4f",
    7: "#8d1c22",
    8: "#181819",
    9: "#efc84b",
    10: "#306fdc",
    11: "#d13442",
    12: "#7c4ac8",
    13: "#e88924",
    14: "#2c9b5d",
    15: "#7a2a2f",
  };
  const brazilianPalette = {
    1: "#c8242c",
    2: "#f0b12d",
    3: "#1f8c4f",
    4: "#7a4b29",
    5: "#2a63c7",
    6: "#d766aa",
    7: "#181819",
  };
  const ruleModes = {
    livre: { id: "livre", label: "LIVRE", scoreLabel: "BOLAS", short: "LIVRE" },
    brasileira: { id: "brasileira", label: "BRASILEIRA", scoreLabel: "PONTOS", short: "BR" },
    parimpar: { id: "parimpar", label: "PAR/IMPAR", scoreLabel: "BOLAS", short: "P/I" },
  };
  const ruleTutorials = {
    livre: {
      title: "MODO LIVRE",
      lines: [
        "Branca + bolas 1 a 9 em formato de diamante.",
        "Vale encaçapar qualquer bola de jogo.",
        "Vence quem derrubar mais bolas ate a mesa acabar."
      ],
    },
    brasileira: {
      title: "SINUCA BRASILEIRA",
      lines: [
        "Branca + sete bolas coloridas de 1 a 7.",
        "A bola da vez e sempre a menor bola ainda na mesa.",
        "Cada bola vale seu numero; falta entrega 7 pontos."
      ],
    },
    parimpar: {
      title: "PAR OU IMPAR",
      lines: [
        "Branca + bolas 2 a 15.",
        "Primeira bola valida define grupo: PAR ou IMPAR.",
        "Depois de limpar seu grupo, a bola 15 fecha a partida."
      ],
    },
  };

  const palette = {
    gold: "#f5b544",
    goldHi: "#ffe39d",
    goldDark: "#7e4e18",
    panel: "#07131a",
    panel2: "#101b20",
    felt: "#006b3e",
    feltDark: "#00482e",
    feltHi: "#12945a",
    wood: "#6c3517",
    woodDark: "#2c130b",
    rail: "#271006",
    metal: "#b7b5a7",
    red: "#d33328",
    greenText: "#8fff5b",
    white: "#f8ebd5",
  };

  let state;
  let mouse = { x: 0, y: 0, inside: false };
  let lastTime = performance.now();
  let rafId = 0;
  let audioCtx = null;
  let musicStarted = false;
  let musicTimer = 0;
  let musicStep = 0;
  let lastDemoStatePost = 0;
  let touchAim = {
    id: 0,
    active: false,
    moved: false,
    suppressNextClick: false,
    startX: 0,
    startY: 0,
    startTime: 0,
  };
  let lockedShotAim = null;

  function reset() {
    lockedShotAim = null;
    const rackY = field.y + field.h / 2;
    state = {
      mode: "MOEDA",
      aim: 0,
      power: 0.72,
      powerDir: 1,
      shotStage: "aim",
      spinIndex: 0,
      shots: 0,
      next: 1,
      message: "JOGUE A MOEDA",
      introTimer: embeddedMode === "pvp" ? 0 : INTRO_DURATION,
      turn: "player",
      currentShooter: "player",
      ruleMode: "livre",
      setupPhase: embeddedMode === "pvp" ? "done" : "coin",
      coinFace: "",
      coinWinner: "",
      coinTimer: 0,
      coinSpin: 0,
      setupWinnerChoice: "",
      setupAiTask: "",
      pendingStarter: "",
      tutorialStarter: "",
      modeRevealTimer: 0,
      modeRevealStarter: "",
      modeRevealMessage: "",
      revealedTutorialKey: "",
      playerBalls: 0,
      aiBalls: 0,
      playerGroup: "",
      aiGroup: "",
      winner: "",
      aiTimer: 0,
      rollingTimer: 0,
      strikeTimer: 0,
      fx: [],
      shake: 0,
      lastPocket: null,
      pocketedLog: [],
      shotHistory: [],
      cueImpactCooldown: 0,
      cuePocketedThisTurn: false,
      ballInHandFor: "",
      externalControlled: embeddedMode === "pvp",
      balls: buildRack("livre", rackY),
    };
  }

  function currentRule() {
    return ruleModes[state?.ruleMode] || ruleModes.livre;
  }

  function ballColor(number, ruleMode = state?.ruleMode || "livre") {
    if (ruleMode === "brasileira") return brazilianPalette[number] || ballPalette[number] || "#f0b12d";
    return ballPalette[number] || "#f0b12d";
  }

  function rackRows(rowCounts, rackX, rackY) {
    const gapX = Math.round(BALL_R * 1.72);
    const gapY = BALL_R * 2;
    const positions = [];
    rowCounts.forEach((rowCount, column) => {
      for (let row = 0; row < rowCount; row += 1) {
        positions.push({
          x: rackX + gapX * column,
          y: rackY + (row - (rowCount - 1) / 2) * gapY,
        });
      }
    });
    return positions;
  }

  function rackOrder(ruleMode) {
    if (ruleMode === "brasileira") return [1, 2, 3, 4, 7, 5, 6];
    if (ruleMode === "parimpar") return [2, 3, 4, 5, 15, 6, 7, 8, 9, 10, 11, 12, 13, 14];
    return [1, 2, 3, 4, 9, 5, 6, 7, 8];
  }

  function rackPositionsForMode(ruleMode, rackX, rackY) {
    if (ruleMode === "livre") return rackRows([1, 2, 3, 2, 1], rackX, rackY);
    if (ruleMode === "parimpar") return rackRows([1, 2, 3, 4, 4], rackX, rackY);
    return rackRows([1, 2, 3, 1], rackX, rackY);
  }

  function buildRack(ruleMode = "livre", rackY = field.y + field.h / 2) {
    const rackX = field.x + 520;
    const numbers = rackOrder(ruleMode);
    const positions = rackPositionsForMode(ruleMode, rackX, rackY);
    return [
      ball("branca", 0, field.x + 175, rackY, "#eee4c8", true),
      ...numbers.map((number, index) => ball(String(number), number, positions[index].x, positions[index].y, ballColor(number, ruleMode))),
    ];
  }

  function ball(id, number, x, y, color, cue = false) {
    return {
      id,
      number,
      x,
      y,
      vx: 0,
      vy: 0,
      r: BALL_R,
      color,
      cue,
      pocketed: false,
      spinWake: 0,
    };
  }

  function cueBall() {
    return state.balls.find((b) => b.cue);
  }

  function liveBalls() {
    return state.balls.filter((b) => !b.pocketed);
  }

  function allStopped() {
    return liveBalls().every((b) => Math.hypot(b.vx, b.vy) < 8);
  }

  function cycleSpin(delta) {
    if (state.mode !== "MIRANDO" || state.turn !== "player") return;
    setSpin((state.spinIndex + delta + spinStates.length) % spinStates.length);
  }

  function setSpin(index, options = {}) {
    if (state.mode !== "MIRANDO" || state.turn !== "player") return;
    if (index === 0 && !options.keepFree) {
      spinStates[0].label = "CENTRO";
      spinStates[0].vx = 0;
      spinStates[0].vy = 0;
      spinStates[0].turn = 0;
    }
    state.spinIndex = index;
    state.message = `EFEITO ${spinStates[state.spinIndex].label}`;
    burst(spinBallHud.x + (spinStates[index].vx * spinBallHud.r * 0.72), spinBallHud.y + (spinStates[index].vy * spinBallHud.r * 0.72), "#ffe39d", 8, 70);
    playTone(420 + index * 55, 0.045, "square", 0.025);
  }

  function resetFreeSpin() {
    spinStates[0].label = "CENTRO";
    spinStates[0].vx = 0;
    spinStates[0].vy = 0;
    spinStates[0].turn = 0;
  }

  function setSpinFromPoint(x, y) {
    if (state.mode !== "MIRANDO" || state.turn !== "player") return false;
    const dx = x - spinBallHud.x;
    const dy = y - spinBallHud.y;
    const distance = Math.hypot(dx, dy);
    if (distance > spinBallHud.r + 5) return false;
    const nx = distance ? dx / spinBallHud.r : 0;
    const ny = distance ? dy / spinBallHud.r : 0;
    if (distance < 7) {
      setSpin(0);
      return true;
    }
    const clamped = Math.min(0.88, distance / spinBallHud.r);
    const free = spinStates[0];
    free.vx = Math.max(-0.88, Math.min(0.88, nx * clamped));
    free.vy = Math.max(-0.88, Math.min(0.88, ny * clamped));
    free.label = Math.abs(free.vx) > Math.abs(free.vy)
      ? free.vx < 0 ? "ESQ" : "DIR"
      : free.vy < 0 ? "SEGUE" : "PUXA";
    setSpin(0, { keepFree: true });
    return true;
  }

  function shoot(actor = "player") {
    if (state.mode !== "MIRANDO") return;
    if (actor !== "ia" && lockedShotAim !== null) state.aim = lockedShotAim;
    if (!setupComplete()) return;
    if (state.winner || objectBallsLeft() <= 0) {
      finalizeTableIfComplete();
      return;
    }
    if (actor !== "ia" && state.ballInHandFor === "player") {
      state.message = "BOLA NA MAO: CLIQUE NA MESA";
      return;
    }
    if (state.externalControlled) return;
    if (actor !== "ia" && state.turn !== "player") return;
    const cue = cueBall();
    if (!cue || cue.pocketed) return;
    state.currentShooter = actor;
    state.mode = "TACANDO";
    state.shotStage = "aim";
    if (actor !== "ia") lockedShotAim = null;
    state.cuePocketedThisTurn = false;
    state.strikeTimer = 0.34;
    state.shots += 1;
    state.shotHistory.push({
      n: state.shots,
      jogador: actor === "ia" ? "IA" : "VOCE",
      mira: Number(state.aim.toFixed(3)),
      forca: Number(state.power.toFixed(2)),
      efeito: spinStates[state.spinIndex].label,
    });
    state.message = actor === "ia" ? "IA TACANDO" : "TACO!";
    state.shake = 2;
    playTone(160, 0.055, "square", 0.035);
  }

  function applyShotVelocity() {
    const cue = cueBall();
    const spin = spinStates[state.spinIndex];
    const speed = 380 + state.power * 980;
    const ax = Math.cos(state.aim);
    const ay = Math.sin(state.aim);
    const sidePush = spin.vx * 170;
    cue.vx = ax * speed + -ay * sidePush;
    cue.vy = ay * speed + ax * sidePush;
    cue.spinWake = state.spinIndex;
    state.mode = "ROLANDO";
    state.message = "BOLAS EM MOVIMENTO";
    state.rollingTimer = 0;
    burst(cue.x, cue.y, "#fff0b5", 10, 140);
    playTone(280, 0.07, "triangle", 0.04);
  }

  function update(dt) {
    dt = Math.min(dt, 1 / 20);
    if (state.introTimer > 0) state.introTimer = Math.max(0, state.introTimer - dt);

    if (state.mode === "MOEDA" && state.setupPhase === "coin-flip") {
      state.coinTimer -= dt;
      state.coinSpin += dt * 14;
      if (state.coinTimer <= 0) revealCoinResult();
    }

    if (state.mode === "MOEDA" && state.setupPhase === "ia-thinking") {
      state.aiTimer -= dt;
      if (state.aiTimer <= 0) resolveAiSetupChoice();
    }

    if (state.mode === "MOEDA" && state.setupPhase === "mode-reveal") {
      state.modeRevealTimer -= dt;
      state.coinSpin += dt * 9;
      if (state.modeRevealTimer <= 0) continueModeReveal();
    }

    if (state.mode === "MIRANDO" && !state.externalControlled && state.turn === "player" && state.shotStage === "power") {
      state.power += state.powerDir * dt * 0.65;
      if (state.power >= 1) {
        state.power = 1;
        state.powerDir = -1;
      } else if (state.power <= 0.08) {
        state.power = 0.08;
        state.powerDir = 1;
      }
    }

    if (state.mode === "MIRANDO" && !state.externalControlled && state.turn === "ia") {
      state.aiTimer -= dt;
      if (state.aiTimer <= 0) shoot("ia");
    }

    if (state.mode === "TACANDO") {
      state.strikeTimer -= dt;
      if (state.strikeTimer <= 0) applyShotVelocity();
    }

    if (state.mode === "ROLANDO") {
      state.rollingTimer += dt;
      stepPhysics(dt);
      const softStop = state.rollingTimer > 4.5 && liveBalls().every((b) => Math.hypot(b.vx, b.vy) < 26);
      const hardStop = state.rollingTimer > 7.5;
      if (allStopped() || softStop || hardStop) {
        for (const b of liveBalls()) {
          b.vx = 0;
          b.vy = 0;
        }
        if (cueBall().pocketed) respawnCue();
        finishRollingTurn();
      }
    }

    state.shake *= Math.pow(0.55, dt * 60);
    for (const fx of state.fx) {
      fx.life -= dt;
      fx.x += fx.vx * dt;
      fx.y += fx.vy * dt;
      fx.vx *= Math.pow(0.92, dt * 60);
      fx.vy *= Math.pow(0.92, dt * 60);
    }
    state.fx = state.fx.filter((fx) => fx.life > 0);
  }

  function stepPhysics(dt) {
    const balls = liveBalls();
    const cue = cueBall();
    const spin = spinStates[cue?.spinWake || 0];

    for (const b of balls) {
      if (b.cue && Math.hypot(b.vx, b.vy) > 80 && spin.turn) {
        const a = Math.atan2(b.vy, b.vx) + spin.turn * dt * 60;
        const s = Math.hypot(b.vx, b.vy);
        b.vx = Math.cos(a) * s;
        b.vy = Math.sin(a) * s;
      }

      b.prevX = b.x;
      b.prevY = b.y;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.vx *= Math.pow(0.96, dt * 60);
      b.vy *= Math.pow(0.96, dt * 60);

      if (Math.hypot(b.vx, b.vy) < 3) {
        b.vx = 0;
        b.vy = 0;
      }

      checkPocket(b);
      if (!b.pocketed) bounceRails(b);
    }

    for (let i = 0; i < balls.length; i += 1) {
      for (let j = i + 1; j < balls.length; j += 1) {
        collideBalls(balls[i], balls[j]);
      }
    }
  }

  function bounceRails(b) {
    const damp = 0.86;
    if (b.x - b.r < field.x) {
      b.x = field.x + b.r;
      b.vx = Math.abs(b.vx) * damp;
    }
    if (b.x + b.r > field.x + field.w) {
      b.x = field.x + field.w - b.r;
      b.vx = -Math.abs(b.vx) * damp;
    }
    if (b.y - b.r < field.y) {
      b.y = field.y + b.r;
      b.vy = Math.abs(b.vy) * damp;
    }
    if (b.y + b.r > field.y + field.h) {
      b.y = field.y + field.h - b.r;
      b.vy = -Math.abs(b.vy) * damp;
    }
  }

  function collideBalls(a, b) {
    if (a.pocketed || b.pocketed) return;
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const dist = Math.hypot(dx, dy);
    const minDist = a.r + b.r;
    if (!dist || dist >= minDist) return;

    const nx = dx / dist;
    const ny = dy / dist;
    const overlap = (minDist - dist) / 2;
    a.x -= nx * overlap;
    a.y -= ny * overlap;
    b.x += nx * overlap;
    b.y += ny * overlap;

    const tx = -ny;
    const ty = nx;
    const dpTanA = a.vx * tx + a.vy * ty;
    const dpTanB = b.vx * tx + b.vy * ty;
    const dpNormA = a.vx * nx + a.vy * ny;
    const dpNormB = b.vx * nx + b.vy * ny;

    a.vx = tx * dpTanA + nx * dpNormB;
    a.vy = ty * dpTanA + ny * dpNormB;
    b.vx = tx * dpTanB + nx * dpNormA;
    b.vy = ty * dpTanB + ny * dpNormA;

    const hitSpeed = Math.abs(dpNormA - dpNormB);
    if (hitSpeed > 80) {
      burst(a.x + nx * a.r, a.y + ny * a.r, "#f7e9c7", 8, Math.min(180, hitSpeed));
      state.shake = Math.max(state.shake, 1.7);
      playTone(520 + Math.min(260, hitSpeed), 0.035, "square", 0.02);
    }

    if (a.cue || b.cue) {
      const cue = a.cue ? a : b;
      const spin = spinStates[cue.spinWake || 0];
      cue.vx -= nx * spin.vy * 150;
      cue.vy -= ny * spin.vy * 150;
      cue.vx += tx * spin.vx * 120;
      cue.vy += ty * spin.vx * 120;
    }
  }

  function distancePointToSegment(px, py, ax, ay, bx, by) {
    const abx = bx - ax;
    const aby = by - ay;
    const len2 = abx * abx + aby * aby;
    if (len2 <= 0.0001) return Math.hypot(px - bx, py - by);
    const t = Math.max(0, Math.min(1, ((px - ax) * abx + (py - ay) * aby) / len2));
    return Math.hypot(px - (ax + abx * t), py - (ay + aby * t));
  }

  function ballReachedPocket(b, p) {
    if (Math.hypot(b.x - p.x, b.y - p.y) < POCKET.catch) return true;
    if (!Number.isFinite(b.prevX) || !Number.isFinite(b.prevY)) return false;
    return distancePointToSegment(p.x, p.y, b.prevX, b.prevY, b.x, b.y) < POCKET.catch;
  }

  function checkPocket(b) {
    for (const p of pockets) {
      if (ballReachedPocket(b, p)) {
        b.pocketed = true;
        b.x = p.x;
        b.y = p.y;
        b.vx = 0;
        b.vy = 0;
        state.lastPocket = b.cue ? "BRANCA" : b.number;
        state.shake = Math.max(state.shake, 3.2);
        burst(p.x, p.y, b.cue ? "#fff2ca" : b.color, 22, 230);
        playTone(b.cue ? 190 : 760, 0.12, "square", 0.045);
        if (b.cue) state.cuePocketedThisTurn = true;
        if (!b.cue) {
          const target = state.next;
          state.pocketedLog.push({
            n: b.number,
            color: b.color,
            shot: state.shots,
            jogador: state.currentShooter === "ia" ? "IA" : "VOCE",
          });
          scorePocketedBall(b, target);
          state.next = nextLiveNumber();
        }
        return;
      }
    }
  }

  function nextLiveNumber() {
    const live = state.balls.filter((b) => !b.cue && !b.pocketed).map((b) => b.number).sort((a, b) => a - b);
    return live[0] || "-";
  }

  function respawnCue() {
    const cue = cueBall();
    cue.pocketed = false;
    cue.x = field.x + 185;
    cue.y = field.y + field.h * 0.58;
    cue.vx = 0;
    cue.vy = 0;
    state.message = "BRANCA REPOSTA";
  }

  function pointInField(x, y) {
    return x >= field.x + BALL_R && x <= field.x + field.w - BALL_R
      && y >= field.y + BALL_R && y <= field.y + field.h - BALL_R;
  }

  function cuePlacementIsClear(x, y) {
    return state.balls.every((b) => b.cue || b.pocketed || Math.hypot(b.x - x, b.y - y) >= BALL_R * 2.25);
  }

  function placeCueAtCanvas(x, y, owner = "player", notifyParent = true) {
    const cue = cueBall();
    if (!cue) return false;
    const px = Math.max(field.x + BALL_R, Math.min(field.x + field.w - BALL_R, x));
    const py = Math.max(field.y + BALL_R, Math.min(field.y + field.h - BALL_R, y));
    if (!pointInField(px, py) || !cuePlacementIsClear(px, py)) {
      state.message = owner === "ia" ? "IA PROCURA ESPACO" : "POSICAO OCUPADA";
      return false;
    }
    cue.pocketed = false;
    cue.x = px;
    cue.y = py;
    cue.vx = 0;
    cue.vy = 0;
    state.ballInHandFor = "";
    state.message = owner === "ia" ? "IA POSICIONOU A BRANCA" : "BRANCA POSICIONADA";
    if (notifyParent && state.externalControlled && owner === "player") {
      window.parent.postMessage({
        type: "vale-pool:cue-place",
        x: Number((((px - field.x) / field.w) * 100).toFixed(2)),
        y: Number((((py - field.y) / field.h) * 50).toFixed(2)),
      }, window.location.origin);
    }
    syncAimFromMouse();
    return true;
  }

  function autoPlaceCueForAi(target) {
    const candidates = [
      [target.x - 220, target.y],
      [target.x - 190, target.y - 48],
      [target.x - 190, target.y + 48],
      [field.x + 170, field.y + field.h * 0.42],
      [field.x + 170, field.y + field.h * 0.66],
      [field.x + field.w * 0.42, field.y + field.h * 0.5],
    ];
    for (const [x, y] of candidates) {
      if (placeCueAtCanvas(x, y, "ia")) return true;
    }
    const cue = cueBall();
    cue.x = field.x + 185;
    cue.y = field.y + field.h * 0.58;
    cue.pocketed = false;
    cue.vx = 0;
    cue.vy = 0;
    state.ballInHandFor = "";
    return true;
  }

  function objectBallsLeft() {
    return state.balls.filter((b) => !b.cue && !b.pocketed).length;
  }

  function setupComplete() {
    return state.externalControlled || state.setupPhase === "done";
  }

  function scoreKeyFor(actor) {
    return actor === "ia" ? "aiBalls" : "playerBalls";
  }

  function opponentFor(actor) {
    return actor === "ia" ? "player" : "ia";
  }

  function groupKeyFor(actor) {
    return actor === "ia" ? "aiGroup" : "playerGroup";
  }

  function groupForNumber(number) {
    return number % 2 === 0 ? "PAR" : "IMPAR";
  }

  function scorePocketedBall(b, target) {
    const actor = state.currentShooter;
    const opponent = opponentFor(actor);
    const actorScore = scoreKeyFor(actor);
    const opponentScore = scoreKeyFor(opponent);
    if (state.ruleMode === "brasileira") {
      const legal = b.number === target;
      if (legal) {
        state[actorScore] += b.number;
        state.message = `${actor === "ia" ? "IA" : "VOCE"} FEZ ${b.number} PONTO(S)`;
      } else {
        state[opponentScore] += b.number;
        state.message = `FALTA: BOLA DA VEZ ERA ${target}`;
      }
      return;
    }
    if (state.ruleMode === "parimpar") {
      const actorName = actor === "ia" ? "IA" : "VOCE";
      if (b.number === 15) {
        if (groupCleared(actor)) {
          state.winner = actor;
          state.message = `${actorName} FECHOU NA 15`;
        } else {
          state.winner = opponent;
          state.message = "15 ANTES DA HORA";
        }
        return;
      }
      const groupMessage = assignGroupsIfNeeded(actor, b.number);
      const ownGroup = state[groupKeyFor(actor)];
      if (!ownGroup || groupForNumber(b.number) === ownGroup) {
        state[actorScore] += 1;
        state.message = `${groupMessage ? `${groupMessage} | ` : ""}${actorName} FEZ ${ownGroup || groupForNumber(b.number)}`;
      } else {
        state[opponentScore] += 1;
        state.message = `${groupMessage ? `${groupMessage} | ` : ""}FALTA: BOLA ${groupForNumber(b.number)}`;
      }
      return;
    }
    state[actorScore] += 1;
    state.message = `${actor === "ia" ? "IA" : "VOCE"} FEZ BOLA`;
  }

  function assignGroupsIfNeeded(actor, number) {
    if (state.playerGroup || state.aiGroup || number === 15) return "";
    const group = groupForNumber(number);
    const other = group === "PAR" ? "IMPAR" : "PAR";
    if (actor === "ia") {
      state.aiGroup = group;
      state.playerGroup = other;
      return `GRUPOS: IA ${group} | VOCE ${other}`;
    } else {
      state.playerGroup = group;
      state.aiGroup = other;
      return `GRUPOS: VOCE ${group} | IA ${other}`;
    }
  }

  function groupCleared(actor) {
    const group = state[groupKeyFor(actor)];
    if (!group) return false;
    return state.balls
      .filter((b) => !b.cue && b.number !== 15 && groupForNumber(b.number) === group)
      .every((b) => b.pocketed);
  }

  function winnerMessage() {
    if (state.winner === "draw") return "EMPATE";
    if (state.winner === "ia") return state.ruleMode === "parimpar" ? "IA VENCEU NA 15" : "IA VENCEU";
    if (state.winner === "player") return state.ruleMode === "parimpar" ? "VOCE VENCEU NA 15" : "VOCE VENCEU";
    if (state.playerBalls === state.aiBalls) return "EMPATE";
    return state.playerBalls > state.aiBalls ? "VOCE VENCEU" : "IA VENCEU";
  }

  function finalizeTableIfComplete() {
    if (!state.winner && objectBallsLeft() <= 0) {
      state.winner = state.playerBalls === state.aiBalls
        ? "draw"
        : state.playerBalls > state.aiBalls ? "player" : "ia";
    }
    if (!state.winner) return false;
    state.mode = "FIM";
    state.turn = state.winner === "ia" ? "ia" : "player";
    state.currentShooter = state.turn;
    state.message = winnerMessage();
    state.cuePocketedThisTurn = false;
    return true;
  }

  function prepareAiTurn(message = "") {
    if (!setupComplete() || state.externalControlled) {
      return;
    }
    if (finalizeTableIfComplete()) {
      return;
    }
    chooseAiShot();
    state.turn = "ia";
    state.mode = "MIRANDO";
    state.shotStage = "aim";
    state.aiTimer = 0.76;
    state.message = message || (state.lastPocket ? `BOLA ${state.lastPocket} CAIU | IA` : "IA MIRANDO");
  }

  function preparePlayerTurn(message = "") {
    resetFreeSpin();
    state.turn = "player";
    state.currentShooter = "player";
    state.mode = "MIRANDO";
    state.shotStage = "aim";
    state.power = 0.18;
    state.powerDir = 1;
    state.message = message || (state.lastPocket ? `BOLA ${state.lastPocket} CAIU` : "SUA VEZ");
  }

  function setRuleMode(ruleMode) {
    state.ruleMode = ruleModes[ruleMode] ? ruleMode : "livre";
    state.playerBalls = 0;
    state.aiBalls = 0;
    state.playerGroup = "";
    state.aiGroup = "";
    state.winner = "";
    state.pocketedLog = [];
    state.balls = buildRack(state.ruleMode);
    state.next = nextLiveNumber();
  }

  function actorLabel(actor) {
    if (actor === "rival") return "RIVAL";
    return actor === "ia" ? "IA" : "VOCE";
  }

  function aiRuleChoice() {
    const options = ["livre", "brasileira", "parimpar"];
    return options[Math.floor(Math.random() * options.length)] || "livre";
  }

  function tossCoin() {
    state.coinFace = Math.random() < 0.5 ? "CARA" : "COROA";
    state.coinWinner = Math.random() < 0.5 ? "player" : "ia";
    state.coinTimer = 1.05;
    state.coinSpin = 0;
    state.setupWinnerChoice = "";
    state.setupAiTask = "";
    state.pendingStarter = "";
    state.tutorialStarter = "";
    state.setupPhase = "coin-flip";
    state.message = "MOEDA GIRANDO";
    playTone(540, 0.09, "square", 0.04);
  }

  function revealCoinResult() {
    state.coinTimer = 0;
    state.setupPhase = state.coinWinner === "player" ? "player-choice" : "ia-thinking";
    state.setupAiTask = state.coinWinner === "ia" ? "winner-choice" : "";
    state.aiTimer = 0.72;
    state.message = state.coinWinner === "player"
      ? `MOEDA ${state.coinFace}: VOCE ESCOLHE`
      : `MOEDA ${state.coinFace}: IA ESCOLHE`;
    playTone(state.coinWinner === "player" ? 620 : 360, 0.09, "square", 0.04);
  }

  function startAfterSetup(starter, message) {
    const normalizedStarter = starter === "ia" ? "ia" : starter === "rival" ? "rival" : "player";
    state.setupPhase = "done";
    state.mode = "MIRANDO";
    state.turn = normalizedStarter;
    state.currentShooter = normalizedStarter === "ia" ? "ia" : normalizedStarter === "rival" ? "rival" : "player";
    state.shotStage = "aim";
    state.power = 0.18;
    state.powerDir = 1;
    state.message = message;
    if (normalizedStarter === "ia") {
      chooseAiShot();
      state.aiTimer = 0.92;
    }
  }

  function startTutorial(starter, message) {
    state.tutorialStarter = starter === "ia" ? "ia" : starter === "rival" ? "rival" : "player";
    state.pendingStarter = state.tutorialStarter;
    state.setupPhase = "tutorial";
    state.mode = "MOEDA";
    state.message = message || `${actorLabel(state.tutorialStarter)} COMECA | ${currentRule().label}`;
  }

  function startModeReveal(starter, message) {
    state.modeRevealStarter = starter === "ia" ? "ia" : starter === "rival" ? "rival" : "player";
    state.modeRevealMessage = message || `${actorLabel(state.modeRevealStarter)} COMECA | ${currentRule().label}`;
    state.tutorialStarter = state.modeRevealStarter;
    state.pendingStarter = state.modeRevealStarter;
    state.modeRevealTimer = 1.35;
    state.setupPhase = "mode-reveal";
    state.mode = "MOEDA";
    state.message = `MODO ESCOLHIDO: ${currentRule().label}`;
    playTone(720, 0.1, "square", 0.04);
  }

  function continueModeReveal() {
    startTutorial(
      state.modeRevealStarter || state.tutorialStarter || state.pendingStarter || "player",
      state.modeRevealMessage || `${actorLabel(state.pendingStarter || "player")} COMECA | ${currentRule().label}`
    );
  }

  function resolveAiSetupChoice() {
    if (state.setupPhase !== "ia-thinking") return;
    if (state.setupAiTask === "winner-choice") {
      const chooseMode = Math.random() < 0.5;
      if (chooseMode) {
        const ruleMode = aiRuleChoice();
        setRuleMode(ruleMode);
        state.setupWinnerChoice = "mode";
        state.setupAiTask = "";
        state.setupPhase = "starter-choice";
        state.message = `IA ESCOLHEU ${currentRule().label} | VOCE ESCOLHE SAIDA`;
        return;
      }
      state.setupWinnerChoice = "start";
      state.pendingStarter = "ia";
      state.setupAiTask = "";
      state.setupPhase = "mode-choice";
      state.message = "IA ESCOLHEU COMECAR | VOCE ESCOLHE MODO";
      return;
    }
      if (state.setupAiTask === "loser-mode") {
      const ruleMode = aiRuleChoice();
      setRuleMode(ruleMode);
      const starter = state.pendingStarter || "player";
      startModeReveal(starter, `IA ESCOLHEU ${currentRule().label} | ${actorLabel(starter)} COMECA`);
      return;
    }
    if (state.setupAiTask === "loser-starter") {
      startModeReveal("ia", `IA ESCOLHEU COMECAR | ${currentRule().label}`);
    }
  }

  function setupButtons() {
    if (setupComplete()) return [];
    if (state.setupPhase === "coin") {
      return [{ action: "coin", label: "JOGAR MOEDA", x: 380, y: 278, w: 200, h: 34 }];
    }
    if (state.setupPhase === "player-choice") {
      return [
        { action: "start", label: "COMEÇAR", x: 260, y: 286, w: 170, h: 34 },
        { action: "choose-mode", label: "ESCOLHER MODALIDADE", x: 446, y: 286, w: 250, h: 34 },
      ];
    }
    if (state.setupPhase === "mode-choice") {
      return [
        { action: "mode:livre", label: "LIVRE", x: 242, y: 286, w: 140, h: 34 },
        { action: "mode:brasileira", label: "BRASILEIRA", x: 410, y: 286, w: 160, h: 34 },
        { action: "mode:parimpar", label: "PAR/IMPAR", x: 598, y: 286, w: 150, h: 34 },
      ];
    }
    if (state.setupPhase === "starter-choice") {
      return [
        { action: "starter:player", label: "EU COMECO", x: 304, y: 286, w: 150, h: 34 },
        { action: "starter:ia", label: "IA COMECA", x: 504, y: 286, w: 150, h: 34 },
      ];
    }
    if (state.setupPhase === "tutorial") {
      return [{ action: "tutorial-start", label: "COMEÇAR PARTIDA", x: 368, y: 382, w: 224, h: 34 }];
    }
    return [];
  }

  function handleSetupClick(x, y) {
    const button = setupButtons().find((item) => hit(x, y, item));
    if (!button) return !setupComplete();
    unlockAudio();
    if (button.action === "coin") tossCoin();
    if (button.action === "start") {
      state.setupWinnerChoice = "start";
      state.pendingStarter = "player";
      state.setupAiTask = "loser-mode";
      state.setupPhase = "ia-thinking";
      state.aiTimer = 0.72;
      state.message = "VOCE ESCOLHEU COMECAR | IA ESCOLHE MODO";
    }
    if (button.action === "choose-mode") {
      state.setupWinnerChoice = "mode";
      state.setupPhase = "mode-choice";
      state.message = "ESCOLHA A MODALIDADE";
    }
    if (button.action.startsWith("mode:")) {
      const ruleMode = button.action.slice(5);
      setRuleMode(ruleMode);
      if (state.setupWinnerChoice === "mode" && state.coinWinner === "player") {
        state.setupAiTask = "loser-starter";
        state.setupPhase = "ia-thinking";
        state.aiTimer = 0.72;
        state.message = `VOCE ESCOLHEU ${currentRule().label} | IA ESCOLHE SAIDA`;
      } else {
        const starter = state.pendingStarter || "ia";
        startModeReveal(starter, `VOCE ESCOLHEU ${currentRule().label} | ${actorLabel(starter)} COMECA`);
      }
    }
    if (button.action.startsWith("starter:")) {
      const starter = button.action.slice(8) === "ia" ? "ia" : "player";
      startModeReveal(starter, `${actorLabel(starter)} COMECA | ${currentRule().label}`);
    }
    if (button.action === "tutorial-start") {
      const starter = state.tutorialStarter || state.pendingStarter || "player";
      startAfterSetup(starter, `${actorLabel(starter)} COMECA | ${currentRule().label}`);
    }
    return true;
  }

  function finishRollingTurn() {
    const cueFoul = state.cuePocketedThisTurn;
    if (finalizeTableIfComplete()) {
      return;
    }
    if (!state.externalControlled && state.currentShooter === "player") {
      if (cueFoul) state.ballInHandFor = "ia";
      prepareAiTurn(cueFoul ? "FALTA: BRANCA CAIU | BOLA NA MAO DA IA" : "");
      state.cuePocketedThisTurn = false;
      return;
    }
    if (cueFoul) state.ballInHandFor = "player";
    preparePlayerTurn(cueFoul ? "FALTA DA IA: BOLA NA MAO | CLIQUE NA MESA" : "");
    state.cuePocketedThisTurn = false;
  }

  function chooseAiShot() {
    resetFreeSpin();
    const cue = cueBall();
    if (!cue || cue.pocketed) {
      respawnCue();
      return;
    }
    const target = state.balls
      .filter((b) => !b.cue && !b.pocketed)
      .sort((a, b) => Math.abs(a.number - state.next) - Math.abs(b.number - state.next))[0];
    if (!target) {
      preparePlayerTurn("SEM ALVO");
      return;
    }
    if (state.ballInHandFor === "ia") {
      autoPlaceCueForAi(target);
    }
    const placedCue = cueBall();
    const wobble = ((state.shots % 5) - 2) * 0.035;
    state.aim = Math.atan2(target.y - placedCue.y, target.x - placedCue.x) + wobble;
    state.power = 0.42 + (state.shots % 3) * 0.08;
    state.spinIndex = 0;
  }

  function canvasXFromServer(x) {
    return field.x + (Number(x || 0) / 100) * field.w;
  }

  function canvasYFromServer(y) {
    return field.y + (Number(y || 0) / 50) * field.h;
  }

  function normalizeSpinId(value) {
    const id = String(value || "centro").toUpperCase();
    return Math.max(0, spinStates.findIndex((spin) => spin.id === id));
  }

  function applyExternalState(payload = {}) {
    if (!state) reset();
    const pool = payload.poolState || {};
    const balls = Array.isArray(pool.balls) ? pool.balls : [];
    state.externalControlled = true;
    state.ruleMode = ruleModes[pool.ruleMode || payload.ruleMode] ? (pool.ruleMode || payload.ruleMode) : "livre";
    const incomingSetupPhase = payload.setupPhase || pool.setup?.phase || "done";
    const previousSetupPhase = state.setupPhase;
    state.setupPhase = incomingSetupPhase;
    if (state.setupPhase === "mode-reveal" && previousSetupPhase !== "mode-reveal") {
      state.modeRevealTimer = 1.35;
      state.modeRevealStarter = pool.setup?.starterSeat === payload.seat ? "player" : "rival";
      state.modeRevealMessage = `MODO ESCOLHIDO: ${currentRule().label}`;
      state.coinSpin = 0;
    }
    state.mode = state.setupPhase === "done" ? (payload.canAct ? "MIRANDO" : "AGUARDANDO") : "MOEDA";
    state.turn = payload.canAct ? "player" : "rival";
    state.message = payload.message || (payload.canAct ? "SUA VEZ" : "VEZ DO RIVAL");
    state.playerBalls = Number(payload.ownScore || 0);
    state.aiBalls = Number(payload.rivalScore || 0);
    const seat = payload.seat || "playerOne";
    const rivalSeat = seat === "playerOne" ? "playerTwo" : "playerOne";
    state.playerGroup = pool[`${seat}Group`] || "";
    state.aiGroup = pool[`${rivalSeat}Group`] || "";
    state.ballInHandFor = pool.ballInHandSeat
      ? pool.ballInHandSeat === seat ? "player" : "rival"
      : "";
    state.shots = Number(payload.moveCount || pool.shot || 0);
    state.power = Math.max(0.08, Math.min(1, Number(payload.power || state.power || 0.56)));
    state.aim = (Number(payload.aim || 0) * Math.PI) / 180;
    state.spinIndex = normalizeSpinId(payload.spin || "centro");
    state.pocketedLog = balls
      .filter((b) => Boolean(b.pocketed) && !Boolean(b.cue) && Number(b.id) !== 0)
      .map((b) => ({ n: Number(b.id), color: b.color || ballPalette[Number(b.id)] || "#f0b12d", shot: b.shot || "" }));
    state.balls = balls.length
      ? balls.map((b) => {
          const number = Number(b.id || 0);
          return ball(
            number === 0 ? "branca" : String(number),
            number,
            canvasXFromServer(b.x),
            canvasYFromServer(b.y),
            number === 0 ? "#eee4c8" : (b.color || ballPalette[number] || "#f0b12d"),
            number === 0 || Boolean(b.cue)
          );
        })
      : state.balls;
    state.balls.forEach((b, index) => {
      const source = balls[index] || {};
      b.vx = 0;
      b.vy = 0;
      b.pocketed = Boolean(source.pocketed);
    });
    if (state.ballInHandFor === "player" && payload.cuePlace) {
      placeCueAtCanvas(canvasXFromServer(payload.cuePlace.x), canvasYFromServer(payload.cuePlace.y), "player", false);
      state.ballInHandFor = "player";
    }
    state.next = nextLiveNumber();
    render();
  }

  function render() {
    ctx.imageSmoothingEnabled = false;
    const sx = Math.round((Math.random() - 0.5) * state.shake);
    const sy = Math.round((Math.random() - 0.5) * state.shake);
    ctx.save();
    ctx.translate(sx, sy);
    drawBack();
    drawHud();
    drawTable();
    drawTableLights();
    drawGameplay();
    ctx.restore();
    drawIntroOverlay();
    postDemoState();
  }

  function postDemoState() {
    if (embeddedMode !== "demo" || window.parent === window) return;
    const now = performance.now();
    if (now - lastDemoStatePost < 180) return;
    lastDemoStatePost = now;
    window.parent.postMessage({
      type: "vale-pool:demo-state",
      playerScore: state.playerBalls,
      aiScore: state.aiBalls,
      playerBalls: state.playerBalls,
      aiBalls: state.aiBalls,
      scoreLabel: currentRule().scoreLabel,
      ruleModeId: currentRule().id,
      ruleMode: currentRule().label,
      playerGroup: state.playerGroup,
      aiGroup: state.aiGroup,
      setupPhase: state.setupPhase,
      tutorial: state.setupPhase === "tutorial" ? currentRule().label : "",
      tutorialStarter: state.tutorialStarter,
      turn: state.turn,
      mode: state.mode,
      ballInHandFor: state.ballInHandFor,
      shots: state.shots,
      ballsInside: objectBallsLeft(),
      ballsOutside: state.pocketedLog.length,
      liveNumbers: state.balls.filter((b) => !b.cue && !b.pocketed).map((b) => b.number).sort((a, b) => a - b),
      next: state.next,
      message: state.message,
      winner: state.winner || (objectBallsLeft() <= 0
        ? state.playerBalls === state.aiBalls ? "draw" : state.playerBalls > state.aiBalls ? "player" : "ia"
        : ""),
    }, window.location.origin);
  }

  function drawBack() {
    ctx.fillStyle = "#040403";
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#07131b";
    ctx.fillRect(0, 0, W, HUD_H + 10);
    ctx.fillStyle = "#120b07";
    ctx.fillRect(0, HUD_H + 10, W, H - HUD_H - 10);

    for (let y = HUD_H + 10; y < H; y += 22) {
      const row = Math.floor((y - HUD_H - 10) / 22);
      ctx.fillStyle = row % 2 === 0 ? "#22120a" : "#190d08";
      ctx.fillRect(0, y, W, 20);
      ctx.fillStyle = "#070403";
      ctx.fillRect(0, y + 20, W, 2);
      for (let x = (row % 3) * -34; x < W; x += 126) {
        ctx.fillStyle = "rgba(0,0,0,.35)";
        ctx.fillRect(x, y + 2, 3, 17);
        ctx.fillStyle = "rgba(255,190,86,.08)";
        ctx.fillRect(x + 9, y + 5, 38, 2);
      }
    }
    for (let x = 0; x < W; x += 48) {
      ctx.fillStyle = x % 96 === 0 ? "rgba(255,154,52,.04)" : "rgba(0,0,0,.08)";
      ctx.fillRect(x, HUD_H + 10, 24, H - HUD_H - 10);
    }
    for (let i = 0; i < 60; i += 1) {
      const x = (i * 73) % W;
      const y = HUD_H + 18 + ((i * 41) % (H - HUD_H - 28));
      ctx.fillStyle = i % 3 === 0 ? "rgba(255,189,87,.13)" : "rgba(0,0,0,.22)";
      ctx.fillRect(x, y, 2 + (i % 2), 1);
    }

    ctx.fillStyle = "rgba(0,0,0,.32)";
    ctx.fillRect(table.x + 28, table.y + table.h + 4, table.w - 56, 12);
    ctx.fillStyle = "rgba(255,174,70,.06)";
    ctx.fillRect(table.x + 20, table.y - 10, table.w - 40, 4);
    drawRoomLights();

    for (let y = 12; y < HUD_H; y += 18) {
      ctx.fillStyle = y % 36 === 12 ? "#06111a" : "#071722";
      ctx.fillRect(0, y, W, 15);
      ctx.fillStyle = "rgba(0,0,0,.28)";
      ctx.fillRect(0, y + 15, W, 3);
    }
  }

  function radialGlow(x, y, inner, outer, center, edge) {
    const grad = ctx.createRadialGradient(x, y, inner, x, y, outer);
    if (grad && typeof grad.addColorStop === "function") {
      grad.addColorStop(0, center);
      grad.addColorStop(1, edge);
      ctx.fillStyle = grad;
    } else {
      ctx.fillStyle = center;
    }
    ctx.beginPath();
    ctx.arc(x, y, outer, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawRoomLights() {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    radialGlow(180, 146, 16, 118, "rgba(255,183,70,.18)", "rgba(255,183,70,0)");
    radialGlow(500, 142, 20, 140, "rgba(255,212,108,.14)", "rgba(255,212,108,0)");
    radialGlow(780, 146, 16, 118, "rgba(255,183,70,.18)", "rgba(255,183,70,0)");
    ctx.restore();
  }

  function drawTableLights() {
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    radialGlow(field.x + field.w * 0.48, field.y + field.h * 0.32, 20, 260, "rgba(255,238,179,.085)", "rgba(255,238,179,0)");
    radialGlow(field.x + field.w * 0.72, field.y + field.h * 0.62, 12, 170, "rgba(70,255,181,.055)", "rgba(70,255,181,0)");
    ctx.restore();
  }

  function drawHud() {
    panel(10, 10, 152, 76, "VEZ");
    text(turnHudLabel(), 28, 56, 22, turnHudColor());
    text(state.ruleMode === "brasileira" ? "VEZ" : "MODO", 120, 35, 10, palette.goldHi);
    if (state.ruleMode === "brasileira" && state.next !== "-") {
      smallBall(137, 58, ballColor(state.next, state.ruleMode), state.next);
    } else {
      text(groupStatusText(), 116, 62, state.ruleMode === "parimpar" && (state.playerGroup || state.aiGroup) ? 8 : 13, palette.goldHi);
    }

    panel(172, 10, 120, 76, "TACADAS");
    text(String(state.shots).padStart(2, "0"), 212, 63, 31, palette.white);

    panel(302, 10, 180, 76, "EFEITO");
    drawSpinHud(spinBallHud.x, spinBallHud.y);

    panel(492, 10, 276, 76, "FORCA");
    drawPowerHud(516, 44, 220, 18);

    panel(778, 10, 172, 76, "BOLAS FORA");
    drawPocketedHud(800, 47);
  }

  function turnHudLabel() {
    if (!setupComplete()) return "MOEDA";
    if (state.mode === "ROLANDO") return state.currentShooter === "ia" ? "IA" : "JOGADA";
    if (state.mode === "TACANDO") return state.currentShooter === "ia" ? "IA" : "TACO";
    if (state.turn === "ia") return "IA";
    if (state.turn === "rival") return "RIVAL";
    return "SUA VEZ";
  }

  function turnHudColor() {
    if (state.turn === "ia" || state.turn === "rival") return palette.goldHi;
    return palette.greenText;
  }

  function ruleActionText() {
    if (state.ruleMode === "brasileira") {
      return state.next && state.next !== "-" ? `ALVO BOLA ${state.next}` : "MESA LIMPA";
    }
    if (state.ruleMode === "parimpar") {
      const actor = state.turn === "ia" || state.turn === "rival" ? "rival" : "player";
      const group = actor === "rival" ? state.aiGroup : state.playerGroup;
      const owner = actor === "rival" ? (embeddedMode === "pvp" ? "RIVAL" : "IA") : "VOCE";
      if (!group) return "1a BOLA DEFINE PAR/IMPAR";
      const left = state.balls
        .filter((b) => !b.cue && !b.pocketed && b.number !== 15 && groupForNumber(b.number) === group)
        .map((b) => b.number)
        .sort((a, b) => a - b);
      return left.length ? `${owner} ${group}: ${left.join(",")}` : `${owner} ${group} LIMPO: MIRE 15`;
    }
    return "LIVRE: QUALQUER BOLA 1-9";
  }

  function groupStatusText() {
    if (state.ruleMode !== "parimpar") return currentRule().short;
    if (!state.playerGroup && !state.aiGroup) return "DEFINE";
    const rivalLabel = embeddedMode === "pvp" ? "RIVAL" : "IA";
    return `VOCE ${state.playerGroup || "?"} | ${rivalLabel} ${state.aiGroup || "?"}`;
  }

  function panel(x, y, w, h, title) {
    ctx.fillStyle = palette.panel;
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = palette.goldDark;
    ctx.lineWidth = 4;
    ctx.strokeRect(x + 2, y + 2, w - 4, h - 4);
    ctx.strokeStyle = palette.goldHi;
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 8, y + 8, w - 16, h - 16);
    text(title, x + 16, y + 24, 14, palette.goldHi);
  }

  function drawSpinHud(cx, cy) {
    const spin = spinStates[state.spinIndex];
    ctx.fillStyle = "#d9c58e";
    ctx.beginPath();
    ctx.arc(cx, cy, spinBallHud.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ba1412";
    ctx.beginPath();
    ctx.arc(cx + spin.vx * spinBallHud.r * 0.72, cy + spin.vy * spinBallHud.r * 0.72, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = palette.goldDark;
    ctx.setLineDash([3, 4]);
    ctx.beginPath();
    ctx.arc(cx, cy, 29, -0.4, Math.PI * 1.4);
    ctx.stroke();
    ctx.setLineDash([]);
    text(spin.label, 318, 56, 13, palette.greenText);
    text("1-5", 318, 73, 10, palette.white);
    for (const control of spinControls) {
      const active = control.index === state.spinIndex;
      ctx.fillStyle = active ? "#d22f26" : "#15222c";
      ctx.fillRect(control.x, control.y, control.w, control.h);
      ctx.strokeStyle = active ? palette.goldHi : "#6a4924";
      ctx.strokeRect(control.x + 0.5, control.y + 0.5, control.w - 1, control.h - 1);
      text(control.label, control.x + 4, control.y + 12, 11, active ? "#fff3ca" : "#d7b36a");
    }
  }

  function drawPocketedHud(x, y) {
    const out = state.pocketedLog || [];
    if (!out.length) {
      text("NENHUMA", x, y + 8, 15, palette.greenText);
      text(`DENTRO ${objectBallsLeft()} JOG ${state.shots}`, x, y + 29, 10, palette.white);
      return;
    }
    out.slice(-7).forEach((entry, index) => {
      smallBall(x + index * 20, y + 5, entry.color, entry.n);
    });
    text(`FORA ${out.length} DENTRO ${objectBallsLeft()}`, x, y + 36, 10, palette.white);
  }

  function drawPowerHud(x, y, w, h) {
    ctx.fillStyle = "#05080b";
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = "#7b5525";
    ctx.strokeRect(x - 4, y - 4, w + 8, h + 8);
    const segs = 16;
    const gap = 3;
    const segW = Math.floor((w - gap * (segs - 1)) / segs);
    for (let i = 0; i < segs; i += 1) {
      const sx = x + i * (segW + gap);
      const on = (i + 1) / segs <= state.power + 0.001;
      ctx.fillStyle = on ? (i < 10 ? "#ffb11c" : i < 13 ? "#db5242" : "#5c8df1") : "#16202a";
      ctx.fillRect(sx, y, segW, h);
      if (on) {
        ctx.fillStyle = "rgba(255,255,255,.35)";
        ctx.fillRect(sx + 2, y + 2, Math.max(2, segW - 5), 3);
      }
    }
    text("MIN", x, y + 39, 12, palette.white);
    text("MAX", x + w - 30, y + 39, 12, palette.white);
    const markerX = x + Math.round(w * state.power);
    ctx.fillStyle = palette.goldHi;
    triangle(markerX, y + h + 15, 7, -Math.PI / 2);
  }

  function drawTable() {
    ctx.fillStyle = palette.rail;
    ctx.fillRect(table.x, table.y, table.w, table.h);
    ctx.fillStyle = palette.wood;
    ctx.fillRect(table.x + 16, table.y + 12, table.w - 32, 38);
    ctx.fillRect(table.x + 16, table.y + table.h - 50, table.w - 32, 38);
    ctx.fillRect(table.x + 12, table.y + 16, 42, table.h - 32);
    ctx.fillRect(table.x + table.w - 54, table.y + 16, 42, table.h - 32);

    for (let x = table.x + 28; x < table.x + table.w - 28; x += 28) {
      ctx.fillStyle = "rgba(255,221,140,.28)";
      ctx.fillRect(x, table.y + 24, 14, 2);
      ctx.fillRect(x, table.y + table.h - 28, 14, 2);
    }
    for (let y = table.y + 32; y < table.y + table.h - 32; y += 32) {
      ctx.fillStyle = "rgba(255,221,140,.18)";
      ctx.fillRect(table.x + 24, y, 2, 12);
      ctx.fillRect(table.x + table.w - 26, y, 2, 12);
    }

    ctx.fillStyle = palette.feltDark;
    ctx.fillRect(field.x - 8, field.y - 8, field.w + 16, field.h + 16);
    ctx.fillStyle = palette.felt;
    ctx.fillRect(field.x, field.y, field.w, field.h);
    ctx.fillStyle = "rgba(255,255,255,.025)";
    for (let y = field.y + 8; y < field.y + field.h; y += 7) ctx.fillRect(field.x, y, field.w, 1);
    ctx.strokeStyle = "rgba(0,0,0,.28)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(field.x + field.w * 0.77, field.y + 18);
    ctx.lineTo(field.x + field.w * 0.77, field.y + field.h - 18);
    ctx.stroke();

    for (const p of pockets) drawPocket(p);
  }

  function drawPocket(p) {
    pixelOctagon(p.x + 2, p.y + 3, POCKET.rim + 4, "rgba(0,0,0,.42)");
    pixelOctagon(p.x, p.y, POCKET.rim + 3, palette.woodDark);
    pixelOctagon(p.x, p.y, POCKET.rim + 1, "#9b6828");
    pixelOctagon(p.x, p.y, POCKET.rim - 3, "#150906");
    pixelOctagon(p.x, p.y, POCKET.throat + 1, "#010202");

    const dx = p.x < field.x ? 1 : p.x > field.x + field.w ? -1 : 0;
    const dy = p.y < field.y ? 1 : p.y > field.y + field.h ? -1 : 0;
    const notch = 6;
    ctx.fillStyle = "#010202";
    if (dx && dy) {
      const x = dx > 0 ? p.x + POCKET.throat - 3 : p.x - POCKET.throat - 3;
      const y = dy > 0 ? p.y + POCKET.throat - 3 : p.y - POCKET.throat - 3;
      ctx.fillRect(Math.round(x), Math.round(y), notch, notch);
    } else if (dy) {
      const y = dy > 0 ? p.y + POCKET.throat - 3 : p.y - POCKET.throat - 3;
      ctx.fillRect(Math.round(p.x - notch), Math.round(y), notch * 2, notch);
    } else if (dx) {
      const x = dx > 0 ? p.x + POCKET.throat - 3 : p.x - POCKET.throat - 3;
      ctx.fillRect(Math.round(x), Math.round(p.y - notch), notch, notch * 2);
    }
    ctx.fillStyle = "rgba(255,255,255,.2)";
    ctx.fillRect(Math.round(p.x - 6), Math.round(p.y - 10), 3, 1);
  }

  function drawGameplay() {
    if (setupComplete() && (state.mode === "MIRANDO" || state.mode === "TACANDO")) {
      drawAimDots();
      drawCueSprite();
    }
    for (const b of state.balls) {
      if (!b.pocketed) drawBall(b);
    }
    drawFx();
    if (state.winner) {
      ctx.fillStyle = "rgba(2,6,10,.78)";
      ctx.fillRect(304, 224, 352, 92);
      ctx.strokeStyle = palette.goldDark;
      ctx.lineWidth = 4;
      ctx.strokeRect(306, 226, 348, 88);
      ctx.strokeStyle = palette.goldHi;
      ctx.lineWidth = 1;
      ctx.strokeRect(318.5, 238.5, 323, 63);
      text("FIM DA MESA", 394, 260, 18, palette.goldHi);
      text(winnerMessage(), 386, 292, 22, state.winner === "draw" ? palette.white : palette.greenText);
    } else if (state.ballInHandFor) {
      const label = state.ballInHandFor === "player"
        ? "BOLA NA MAO: CLIQUE NA MESA"
        : state.ballInHandFor === "ia" ? "BOLA NA MAO DA IA" : "BOLA NA MAO";
      ctx.fillStyle = "rgba(2,6,10,.68)";
      ctx.fillRect(318, 224, 324, 50);
      ctx.strokeStyle = palette.goldHi;
      ctx.lineWidth = 1;
      ctx.strokeRect(318.5, 224.5, 323, 49);
      text(label, 344, 256, 16, palette.greenText);
    }
    drawSetupOverlay();
    ctx.fillStyle = "rgba(5,12,17,.86)";
    ctx.fillRect(70, 490, 820, 38);
    ctx.strokeStyle = palette.goldDark;
    ctx.strokeRect(70.5, 490.5, 819, 37);
    text("ESTADO", 92, 513, 13, palette.goldHi);
    const shotHint = state.mode === "MIRANDO" && state.turn === "player" && !state.ballInHandFor
      ? state.shotStage === "power" ? "TOQUE PARA TACAR" : "MIRE E TOQUE PARA FORCA"
      : "";
    const info = `${state.message}${shotHint ? ` | ${shotHint}` : ""} | ${currentRule().label} | ${ruleActionText()} | DENTRO ${objectBallsLeft()} FORA ${state.pocketedLog.length} JOGADAS ${state.shots}`;
    text(info.slice(0, 78), 170, 514, 14, state.mode === "MIRANDO" ? palette.greenText : palette.goldHi);
  }

  function drawIntroOverlay() {
    if (!state?.introTimer) return;
    const t = Math.max(0, Math.min(1, 1 - state.introTimer / INTRO_DURATION));
    const hitT = Math.max(0, Math.min(1, (t - 0.38) / 0.18));
    const revealT = Math.max(0, Math.min(1, (t - 0.62) / 0.38));
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = `rgba(1, 5, 8, ${Math.max(0, 0.94 - revealT * 0.94).toFixed(3)})`;
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = Math.max(0, 1 - revealT * 0.85);
    const ballX = 530;
    const ballY = 280;
    const cueTipX = 110 + 350 * Math.min(1, t / 0.38);
    const cueTipY = ballY + 52 - 52 * Math.min(1, t / 0.38);
    drawPixelLine(cueTipX - 240, cueTipY + 66, cueTipX, cueTipY, 8, "#3a1b0d");
    drawPixelLine(cueTipX - 236, cueTipY + 63, cueTipX - 2, cueTipY - 1, 4, "#b86c24");
    drawPixelLine(cueTipX - 14, cueTipY + 3, cueTipX + 16, cueTipY - 5, 3, "#efe1c0");
    ctx.fillStyle = "#f4e5c4";
    ctx.beginPath();
    ctx.arc(ballX + hitT * 42, ballY - hitT * 20, 22 - hitT * 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(ballX - 8 + hitT * 42, ballY - 12 - hitT * 20, 7, 4);
    const burstPower = Math.max(0, Math.min(1, (t - 0.42) / 0.3));
    for (let i = 0; i < 34; i += 1) {
      const a = i * 2.399 + 0.4;
      const d = burstPower * (18 + (i % 7) * 11);
      const s = 2 + (i % 3) * 2;
      const x = ballX + Math.cos(a) * d;
      const y = ballY + Math.sin(a) * d;
      ctx.fillStyle = i % 4 === 0 ? "#fff0b5" : i % 3 === 0 ? "#f5b544" : "#8fff5b";
      ctx.fillRect(Math.round(x), Math.round(y), s, s);
    }
    ctx.globalAlpha = Math.max(0, 1 - revealT);
    text("VALE POOL", 330, 188, 46, palette.goldHi);
    text("CLUBE DE SINUCA", 354, 222, 18, palette.greenText);
    text("toque para pular", 410, 438, 13, palette.white);
    ctx.restore();
  }

  function drawSetupCoin(cx, cy) {
    const spinning = state.setupPhase === "coin-flip";
    const phase = spinning ? Math.abs(Math.cos(state.coinSpin)) : 1;
    const w = Math.max(5, Math.round(34 * phase));
    ctx.fillStyle = "#2b1608";
    ctx.fillRect(cx - Math.round(w / 2) + 2, cy - 16 + 3, w, 32);
    ctx.fillStyle = palette.gold;
    ctx.fillRect(cx - Math.round(w / 2), cy - 16, w, 32);
    ctx.strokeStyle = palette.goldHi;
    ctx.strokeRect(cx - Math.round(w / 2) + 0.5, cy - 15.5, Math.max(4, w - 1), 31);
    const mark = spinning
      ? (Math.floor(state.coinSpin * 2) % 2 ? "C" : "K")
      : state.coinFace === "COROA" ? "K" : "C";
    if (w > 18) text(mark, cx - 5, cy + 7, 18, "#2b1608");
  }

  function drawSetupOverlay() {
    if (setupComplete()) return;
    const tutorial = state.setupPhase === "tutorial";
    const reveal = state.setupPhase === "mode-reveal";
    const panel = tutorial
      ? { x: 150, y: 140, w: 660, h: 300 }
      : reveal
        ? { x: 170, y: 160, w: 620, h: 236 }
        : { x: 190, y: 198, w: 580, h: 152 };
    ctx.fillStyle = "rgba(2,6,10,.82)";
    ctx.fillRect(panel.x, panel.y, panel.w, panel.h);
    ctx.strokeStyle = palette.goldDark;
    ctx.lineWidth = 4;
    ctx.strokeRect(panel.x + 2, panel.y + 2, panel.w - 4, panel.h - 4);
    ctx.strokeStyle = palette.goldHi;
    ctx.lineWidth = 1;
    ctx.strokeRect(panel.x + 14, panel.y + 14, panel.w - 28, panel.h - 28);

    if (reveal) {
      const pulse = 0.5 + Math.sin(state.coinSpin * 2.4) * 0.5;
      text("MODO ESCOLHIDO", panel.x + 178, panel.y + 48, 18, palette.greenText);
      const revealTitle = (ruleTutorials[state.ruleMode]?.title || currentRule().label || "MODO").toUpperCase();
      text(revealTitle, panel.x + 86, panel.y + 104, 32, palette.goldHi);
      text(`SAIDA: ${actorLabel(state.modeRevealStarter || state.tutorialStarter || state.pendingStarter || "player")}`, panel.x + 232, panel.y + 146, 17, palette.white);
      for (let index = 0; index < 9; index += 1) {
        const x = panel.x + 142 + index * 42;
        const y = panel.y + 184 + Math.sin(state.coinSpin + index) * 6;
        smallBall(x, y, ballColor(index + 1, state.ruleMode), state.ruleMode === "parimpar" ? index + 2 : index + 1);
      }
      ctx.strokeStyle = `rgba(255, 208, 109, ${0.35 + pulse * 0.45})`;
      ctx.strokeRect(panel.x + 42.5, panel.y + 70.5, panel.w - 85, 58);
      text("Abrindo tutorial...", panel.x + 244, panel.y + 216, 13, palette.greenText);
    } else if (tutorial) {
      const tutorialInfo = ruleTutorials[state.ruleMode] || ruleTutorials.livre;
      text(tutorialInfo.title, panel.x + 36, panel.y + 52, 23, palette.goldHi);
      text(`SAIDA: ${actorLabel(state.tutorialStarter || state.pendingStarter || "player")}`, panel.x + 410, panel.y + 52, 16, palette.greenText);
      tutorialInfo.lines.forEach((line, index) => {
        text(line, panel.x + 44, panel.y + 98 + index * 32, 16, palette.white);
      });
      text("Leia o modo antes da mesa. A partida so libera depois de COMEÇAR.", panel.x + 44, panel.y + 226, 13, palette.greenText);
    } else {
      text("MOEDA", 412, 234, 22, palette.goldHi);
      drawSetupCoin(228, 306);
      const line = state.setupPhase === "coin-flip"
        ? "MOEDA GIRANDO..."
        : state.setupPhase === "ia-thinking"
      ? `${state.coinFace || "MOEDA"}: IA DECIDINDO`
      : state.setupPhase === "mode-choice"
          ? state.setupWinnerChoice === "start"
            ? "VOCE ESCOLHE A MODALIDADE QUE FALTOU"
            : "QUEM ESCOLHE MODALIDADE NAO ESCOLHE SAIDA"
          : state.setupPhase === "starter-choice"
            ? "VOCE ESCOLHE QUEM COMECA A PARTIDA"
            : state.setupPhase === "player-choice"
              ? `${state.coinFace}: VOCE GANHOU A ESCOLHA`
              : "JOGUE A MOEDA PARA DEFINIR A ESCOLHA";
      text(line, 248, 264, 13, palette.greenText);
    }
    for (const button of setupButtons()) {
      ctx.fillStyle = "#0b1821";
      ctx.fillRect(button.x, button.y, button.w, button.h);
      ctx.strokeStyle = palette.goldHi;
      ctx.strokeRect(button.x + 0.5, button.y + 0.5, button.w - 1, button.h - 1);
      text(button.label, button.x + 12, button.y + 23, 13, palette.white);
    }
  }

  function drawAimDots() {
    const cue = cueBall();
    if (!cue || cue.pocketed) return;
    const max = 420;
    for (let d = 26; d < max; d += 18) {
      const x = cue.x + Math.cos(state.aim) * d;
      const y = cue.y + Math.sin(state.aim) * d;
      if (x < field.x || x > field.x + field.w || y < field.y || y > field.y + field.h) break;
      const fade = 1 - d / max;
      ctx.fillStyle = d % 36 === 0 ? `rgba(255,181,68,${fade})` : `rgba(255,245,218,${fade})`;
      ctx.fillRect(Math.round(x) - 2, Math.round(y) - 2, 4, 4);
    }
  }

  function drawCueSprite() {
    const cue = cueBall();
    if (!cue || cue.pocketed) return;
    const pull = state.mode === "TACANDO" ? Math.sin((0.34 - state.strikeTimer) / 0.34 * Math.PI) * 32 : 16;
    const ax = Math.cos(state.aim);
    const ay = Math.sin(state.aim);
    const start = cue.r + 18 + pull;
    const end = cue.r + 138 + pull;
    const tipX = cue.x - ax * start;
    const tipY = cue.y - ay * start;
    const buttX = cue.x - ax * end;
    const buttY = cue.y - ay * end;

    drawPixelLine(buttX, buttY, tipX, tipY, 7, "#3a1b0d");
    drawPixelLine(buttX + ay * 1.5, buttY - ax * 1.5, tipX + ay, tipY - ax, 4, "#a55d20");
    drawPixelLine(buttX - ay * 1.5, buttY + ax * 1.5, tipX - ay, tipY + ax, 2, "#f0b64c");
    drawPixelLine(tipX - ax * 16, tipY - ay * 16, tipX, tipY, 3, "#efe1c0");

  }

  function drawFx() {
    for (const fx of state.fx) {
      const alpha = Math.max(0, Math.min(1, fx.life / fx.maxLife));
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.globalCompositeOperation = "lighter";
      if (fx.kind === "ring") {
        ctx.strokeStyle = fx.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(fx.x, fx.y, fx.size * (1 + (1 - alpha) * 3), 0, Math.PI * 2);
        ctx.stroke();
      } else {
        radialGlow(fx.x, fx.y, 0, fx.size * 3, fx.color, "rgba(255,255,255,0)");
        drawPixelBlock(fx.x, fx.y, fx.size, fx.color);
      }
      ctx.restore();
    }
  }

  function drawBall(b) {
    ctx.fillStyle = "rgba(0,0,0,.38)";
    ctx.beginPath();
    ctx.ellipse(b.x + 6, b.y + 8, b.r + 3, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = b.color;
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
    ctx.fill();
    if (b.number === 9) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r - 1, 0, Math.PI * 2);
      ctx.clip();
      ctx.fillStyle = "#fff0c9";
      ctx.fillRect(Math.round(b.x - b.r), Math.round(b.y - 4), b.r * 2, 8);
      ctx.restore();
      ctx.strokeStyle = "#2f1b08";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r - 1, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.fillStyle = "rgba(255,255,255,.55)";
    ctx.beginPath();
    ctx.arc(b.x - 4, b.y - 5, 4, 0, Math.PI * 2);
    ctx.fill();
    if (!b.cue) {
      ctx.fillStyle = "#f8efd5";
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.number === 9 ? 6 : 5, 0, Math.PI * 2);
      ctx.fill();
      text(String(b.number), b.x - 3.5, b.y + 4, b.number === 9 ? 10 : 8, "#121212");
    }
  }

  function smallBall(x, y, color, number) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, 10, 0, Math.PI * 2);
    ctx.fill();
    if (Number(number) === 9) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(x, y, 9, 0, Math.PI * 2);
      ctx.clip();
      ctx.fillStyle = "#fff0c9";
      ctx.fillRect(Math.round(x - 10), Math.round(y - 4), 20, 8);
      ctx.restore();
    }
    ctx.fillStyle = "#f8efd5";
    ctx.beginPath();
    ctx.arc(x, y, Number(number) === 9 ? 6 : 5, 0, Math.PI * 2);
    ctx.fill();
    text(String(number), x - 4, y + 4, Number(number) === 9 ? 10 : 9, "#15110a");
  }

  function text(value, x, y, size, color) {
    ctx.fillStyle = color;
    ctx.font = `700 ${size}px Consolas, Courier New, monospace`;
    ctx.textBaseline = "alphabetic";
    ctx.fillText(value, x, y);
  }

  function padScore(value) {
    return String(value).padStart(5, "0");
  }

  function triangle(x, y, r, rot) {
    ctx.beginPath();
    for (let i = 0; i < 3; i += 1) {
      const a = rot + i * Math.PI * 2 / 3;
      const px = x + Math.cos(a) * r;
      const py = y + Math.sin(a) * r;
      if (i) ctx.lineTo(px, py);
      else ctx.moveTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
  }

  function pixelOctagon(cx, cy, r, color) {
    const s = Math.round(r);
    const cut = Math.round(s * 0.42);
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(cx - s + cut), Math.round(cy - s), Math.round((s - cut) * 2), Math.round(s * 2));
    ctx.fillRect(Math.round(cx - s), Math.round(cy - s + cut), Math.round(s * 2), Math.round((s - cut) * 2));
  }

  function drawPixelBlock(x, y, size, color) {
    ctx.fillStyle = color;
    const s = Math.max(2, Math.round(size));
    ctx.fillRect(Math.round(x - s / 2), Math.round(y - s / 2), s, s);
  }

  function drawPixelLine(x1, y1, x2, y2, width, color) {
    let x = Math.round(x1);
    let y = Math.round(y1);
    const tx = Math.round(x2);
    const ty = Math.round(y2);
    const dx = Math.abs(tx - x);
    const dy = Math.abs(ty - y);
    const sx = x < tx ? 1 : -1;
    const sy = y < ty ? 1 : -1;
    let err = dx - dy;
    while (true) {
      drawPixelBlock(x, y, width, color);
      if (x === tx && y === ty) break;
      const e2 = 2 * err;
      if (e2 > -dy) {
        err -= dy;
        x += sx;
      }
      if (e2 < dx) {
        err += dx;
        y += sy;
      }
    }
  }

  function burst(x, y, color, count, power) {
    if (!state?.fx) return;
    state.fx.push({
      x,
      y,
      vx: 0,
      vy: 0,
      color,
      kind: "ring",
      size: 6,
      life: 0.28,
      maxLife: 0.28,
    });
    for (let i = 0; i < count; i += 1) {
      const a = Math.random() * Math.PI * 2;
      const speed = (0.25 + Math.random() * 0.75) * power;
      state.fx.push({
        x,
        y,
        vx: Math.cos(a) * speed,
        vy: Math.sin(a) * speed,
        color,
        size: 2 + Math.random() * 4,
        life: 0.16 + Math.random() * 0.22,
        maxLife: 0.38,
      });
    }
  }

  function ensureAudio() {
    const Audio = window.AudioContext || window.webkitAudioContext;
    if (!Audio) return null;
    try {
      if (!audioCtx) audioCtx = new Audio();
      if (audioCtx.state === "suspended") audioCtx.resume();
      return audioCtx;
    } catch (error) {
      audioCtx = null;
      return null;
    }
  }

  function playTone(freq, duration, type, gain) {
    const context = ensureAudio();
    if (!context) return;
    try {
      const osc = audioCtx.createOscillator();
      const amp = audioCtx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      amp.gain.setValueAtTime(gain, audioCtx.currentTime);
      amp.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
      osc.connect(amp);
      amp.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch (error) {
      audioCtx = null;
    }
  }

  function playMusicNote(freq, start, length, type, gain) {
    const context = ensureAudio();
    if (!context) return;
    const osc = context.createOscillator();
    const amp = context.createGain();
    const filter = context.createBiquadFilter();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(1450, start);
    amp.gain.setValueAtTime(0.0001, start);
    amp.gain.linearRampToValueAtTime(gain, start + 0.025);
    amp.gain.exponentialRampToValueAtTime(0.0001, start + length);
    osc.connect(filter);
    filter.connect(amp);
    amp.connect(context.destination);
    osc.start(start);
    osc.stop(start + length + 0.04);
  }

  function scheduleMusicBar() {
    const context = ensureAudio();
    if (!context) return;
    const scale = [196, 220, 247, 294, 330, 370, 392, 440];
    const melody = [0, 2, 4, 5, 4, 2, 1, 2, 0, 2, 4, 7, 5, 4, 2, 1];
    const bass = [98, 98, 147, 147, 110, 110, 165, 147];
    const start = context.currentTime + 0.035;
    for (let i = 0; i < 8; i += 1) {
      const t = start + i * 0.42;
      const note = scale[melody[(musicStep + i) % melody.length]];
      playMusicNote(note, t, 0.26, i % 2 ? "triangle" : "square", 0.012);
      playMusicNote(note * 2, t + 0.21, 0.12, "triangle", 0.0045);
      if (i % 2 === 0) playMusicNote(bass[((musicStep / 2) + i / 2) % bass.length], t, 0.36, "square", 0.006);
    }
    musicStep = (musicStep + 8) % melody.length;
  }

  function startRelaxingMusic() {
    if (musicStarted) return;
    if (!ensureAudio()) return;
    musicStarted = true;
    scheduleMusicBar();
    musicTimer = window.setInterval(scheduleMusicBar, 3300);
  }

  function unlockAudio() {
    ensureAudio();
    startRelaxingMusic();
  }

  function syncAimFromMouse() {
    if (!mouse.inside || state.mode !== "MIRANDO" || state.turn !== "player" || state.ballInHandFor === "player" || state.shotStage === "power") return;
    const cue = cueBall();
    state.aim = Math.atan2(mouse.y - cue.y, mouse.x - cue.x);
  }

  function startPlayerPowerStage() {
    if (state.mode !== "MIRANDO" || state.turn !== "player" || state.externalControlled) return false;
    if (state.ballInHandFor === "player") {
      state.message = "BOLA NA MAO: CLIQUE NA MESA";
      return true;
    }
    if (state.winner || objectBallsLeft() <= 0) {
      finalizeTableIfComplete();
      return true;
    }
    lockedShotAim = state.aim;
    state.shotStage = "power";
    state.power = 0.08;
    state.powerDir = 1;
    state.message = "FORCA ABRINDO | TOQUE PARA TACAR";
    playTone(520, 0.045, "square", 0.025);
    return true;
  }

  function handlePlayerShotPress() {
    if (state.shotStage !== "power") {
      startPlayerPowerStage();
      return;
    }
    if (lockedShotAim !== null) state.aim = lockedShotAim;
    shoot();
  }

  canvas.setAttribute("tabindex", "0");

  function updatePointer(event) {
    const rect = canvas.getBoundingClientRect();
    mouse.x = (event.clientX - rect.left) * canvas.width / rect.width;
    mouse.y = (event.clientY - rect.top) * canvas.height / rect.height;
    mouse.inside = true;
    syncAimFromMouse();
  }

  canvas.addEventListener("mousemove", updatePointer);
  canvas.addEventListener("pointermove", updatePointer);
  canvas.addEventListener("pointermove", (event) => {
    if (!touchAim.active || event.pointerId !== touchAim.id) return;
    const dx = event.clientX - touchAim.startX;
    const dy = event.clientY - touchAim.startY;
    if (Math.hypot(dx, dy) >= TOUCH_AIM_MOVE_THRESHOLD) {
      touchAim.moved = true;
    }
  });
  canvas.addEventListener("pointerdown", (event) => {
    canvas.focus({ preventScroll: true });
    if (event.pointerType === "touch" || event.pointerType === "pen") {
      touchAim = {
        id: event.pointerId,
        active: true,
        moved: false,
        suppressNextClick: false,
        startX: event.clientX,
        startY: event.clientY,
        startTime: performance.now(),
      };
      try {
        canvas.setPointerCapture?.(event.pointerId);
      } catch {
        // Some synthetic touch events do not have an active pointer capture target.
      }
    }
    updatePointer(event);
  });
  canvas.addEventListener("pointerup", (event) => {
    if (!touchAim.active || event.pointerId !== touchAim.id) return;
    const heldLongEnough = performance.now() - touchAim.startTime >= TOUCH_AIM_HOLD_MS;
    touchAim.suppressNextClick = touchAim.moved || heldLongEnough;
    touchAim.active = false;
    try {
      canvas.releasePointerCapture?.(event.pointerId);
    } catch {
      // Some synthetic touch events do not have an active pointer capture target.
    }
  });
  canvas.addEventListener("pointercancel", (event) => {
    if (!touchAim.active || event.pointerId !== touchAim.id) return;
    touchAim.suppressNextClick = true;
    touchAim.active = false;
  });

  canvas.addEventListener("mouseleave", () => { mouse.inside = false; });
  canvas.addEventListener("click", (event) => {
    unlockAudio();
    canvas.focus({ preventScroll: true });
    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) * canvas.width / rect.width;
    const y = (event.clientY - rect.top) * canvas.height / rect.height;
    if (touchAim.suppressNextClick) {
      touchAim.suppressNextClick = false;
      if (state.mode === "MIRANDO" && state.turn === "player") {
        state.message = state.shotStage === "power" ? "MIRA TRAVADA | TOQUE PARA TACAR" : "MIRA AJUSTADA | TOQUE PARA FORCA";
      }
      return;
    }
    if (state.introTimer > 0) {
      state.introTimer = 0;
      return;
    }
    if (handleSetupClick(x, y)) return;
    const control = spinControls.find((item) => hit(x, y, item));
    if (control) {
      setSpin(control.index);
      return;
    }
    if (setSpinFromPoint(x, y)) return;
    if (y < HUD_H) return;
    if (state.mode === "MIRANDO" && state.turn === "player" && state.ballInHandFor === "player") {
      placeCueAtCanvas(x, y, "player");
      return;
    }
    handlePlayerShotPress();
  });

  window.addEventListener("keydown", (event) => {
    unlockAudio();
    if (state.introTimer > 0 && (event.code === "Space" || event.key === "Enter")) {
      event.preventDefault();
      state.introTimer = 0;
      return;
    }
    if (!setupComplete()) {
      if (event.code === "Space" || event.key === "Enter") {
        event.preventDefault();
        if (state.setupPhase === "coin") tossCoin();
        else if (state.setupPhase === "player-choice") {
          state.setupWinnerChoice = "start";
          state.pendingStarter = "player";
          state.setupAiTask = "loser-mode";
          state.setupPhase = "ia-thinking";
          state.aiTimer = 0.72;
          state.message = "VOCE ESCOLHEU COMECAR | IA ESCOLHE MODO";
        } else if (state.setupPhase === "tutorial") {
          const starter = state.tutorialStarter || state.pendingStarter || "player";
          startAfterSetup(starter, `${actorLabel(starter)} COMECA | ${currentRule().label}`);
        } else if (state.setupPhase === "mode-reveal") {
          continueModeReveal();
        }
      }
      return;
    }
    if (event.key === "ArrowLeft" && state.shotStage !== "power") state.aim -= 0.08;
    else if (event.key === "ArrowRight" && state.shotStage !== "power") state.aim += 0.08;
    else if (event.key === "ArrowUp") state.power = Math.min(1, state.power + 0.08);
    else if (event.key === "ArrowDown") state.power = Math.max(0.08, state.power - 0.08);
    else if (event.key.toLowerCase() === "e") cycleSpin(1);
    else if (["1", "2", "3", "4", "5"].includes(event.key)) setSpin(Number(event.key) - 1);
    else if (event.code === "Space") {
      event.preventDefault();
      handlePlayerShotPress();
    } else if (event.key.toLowerCase() === "r") reset();
  });

  window.addEventListener("pointerdown", unlockAudio, { passive: true });

  window.addEventListener("message", (event) => {
    if (event.origin !== window.location.origin) return;
    if (event.data?.type !== "vale-pool:state") return;
    applyExternalState(event.data);
  });

  function hit(x, y, rect) {
    return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
  }

  function frame(now) {
    const dt = (now - lastTime) / 1000;
    lastTime = now;
    update(dt);
    render();
    rafId = requestAnimationFrame(frame);
  }

  window.advanceTime = (ms) => {
    const steps = Math.max(1, Math.round(ms / (1000 / 60)));
    for (let i = 0; i < steps; i += 1) update(1 / 60);
    render();
  };

  window.render_game_to_text = () => JSON.stringify({
    coord: "origem no canto superior esquerdo; x direita; y baixo",
    mode: state.mode,
    mesa: {
      table,
      field,
      cacapas: pockets.map((p) => ({
        name: p.name,
        x: p.x,
        y: p.y,
        parte: "marrom-interna",
      })),
    },
    hud: {
      regra: "Moeda inicial: vencedor escolhe uma categoria; perdedor escolhe a outra; tutorial abre antes da mesa.",
      modalidade: currentRule().label,
      regraViva: ruleActionText(),
      faseMoeda: state.setupPhase,
      escolhaVencedorMoeda: state.setupWinnerChoice,
      tutorialStarter: state.tutorialStarter,
      tacadas: state.shots,
      etapaTacada: state.shotStage === "power" ? "forca" : "mira",
      intro: state.introTimer > 0 ? "abertura" : "",
      proxima: state.next,
      forca: Number(state.power.toFixed(2)),
      efeito: spinStates[state.spinIndex].label,
      efeitosDisponiveis: spinStates.map((spin, index) => ({ tecla: String(index + 1), nome: spin.label })),
      bolasFora: state.pocketedLog.map((entry) => ({ n: entry.n, tacada: entry.shot })),
      bolasDentro: objectBallsLeft(),
      jogadas: state.shots,
      mensagem: state.message,
      bolaNaMao: state.ballInHandFor,
    },
    demo: {
      jogador: "VOCE",
      ia: "ROBO IA",
      turno: state.turn,
      placar: {
        jogador: state.playerBalls,
        ia: state.aiBalls,
        tipo: currentRule().scoreLabel,
      },
      grupos: {
        jogador: state.playerGroup,
        ia: state.aiGroup,
      },
      historicoJogadas: state.shotHistory.slice(-8),
    },
    audio: {
      musica: musicStarted ? "tocando" : "aguardando-interacao",
      estilo: "16-bit relaxante",
    },
    controle: state.externalControlled ? "pvp-pubpaid" : "local-demo",
    mira: Number(state.aim.toFixed(3)),
    bolas: state.balls.map((b) => ({
      id: b.id,
      n: b.number,
      r: b.r,
      x: Number(b.x.toFixed(1)),
      y: Number(b.y.toFixed(1)),
      vx: Number(b.vx.toFixed(1)),
      vy: Number(b.vy.toFixed(1)),
      pocketed: b.pocketed,
    })),
    bolasFora: state.pocketedLog.map((entry) => ({ n: entry.n, color: entry.color, tacada: entry.shot })),
  });

  reset();
  render();
  rafId = requestAnimationFrame(frame);
})();
