import { GAME_HEIGHT, GAME_WIDTH } from "../config/gameConfig.js";
import { gameState, updateGameState } from "../core/gameState.js";
import { fitImageToHeight } from "../core/assetRegistry.js";

const TABLE = {
  x: 452,
  y: 150,
  width: 668,
  height: 334
};

const BALL_RADIUS = 11.5;
const POCKET_RADIUS = 22;
const WALL_RESTITUTION = 0.88;
const BALL_RESTITUTION = 0.94;
const FRICTION = 0.987;
const STOP_SPEED = 9;
const MAX_SHOTS = 12;

const PLAYFIELD = {
  x: TABLE.x + 50,
  y: TABLE.y + 44,
  width: TABLE.width - 100,
  height: TABLE.height - 88
};

const CUE_START = {
  x: PLAYFIELD.x + PLAYFIELD.width * 0.27,
  y: PLAYFIELD.y + PLAYFIELD.height * 0.5
};

const RACK_APEX = {
  x: PLAYFIELD.x + PLAYFIELD.width * 0.67,
  y: PLAYFIELD.y + PLAYFIELD.height * 0.5
};

const POCKETS = [
  { id: "top-left", x: PLAYFIELD.x - 12, y: PLAYFIELD.y - 10 },
  { id: "top-center", x: PLAYFIELD.x + PLAYFIELD.width / 2, y: PLAYFIELD.y - 18 },
  { id: "top-right", x: PLAYFIELD.x + PLAYFIELD.width + 12, y: PLAYFIELD.y - 10 },
  { id: "bottom-left", x: PLAYFIELD.x - 12, y: PLAYFIELD.y + PLAYFIELD.height + 10 },
  { id: "bottom-center", x: PLAYFIELD.x + PLAYFIELD.width / 2, y: PLAYFIELD.y + PLAYFIELD.height + 18 },
  { id: "bottom-right", x: PLAYFIELD.x + PLAYFIELD.width + 12, y: PLAYFIELD.y + PLAYFIELD.height + 10 }
];

const BALL_COLORS = [
  0xf0c742, 0x1f6ad4, 0xc93645, 0x6b49ba, 0xe17a2d,
  0x2d8f72, 0x7a2238, 0x10131a, 0xf0c742, 0x1f6ad4,
  0xc93645, 0x6b49ba, 0xe17a2d, 0x2d8f72, 0x7a2238
];

function textStyle(size, color, family = "Georgia, Times New Roman, serif") {
  return {
    fontFamily: family,
    fontSize: `${size}px`,
    fontStyle: "bold",
    color,
    stroke: "#05070d",
    strokeThickness: 3
  };
}

export class PoolGameScene extends Phaser.Scene {
  constructor() {
    super("pool-game-scene");
    this.stake = 10;
    this.phase = "aim";
    this.lockStage = "aim";
    this.aimAngle = 0;
    this.aimDirection = 1;
    this.currentPower = 0.42;
    this.powerDirection = 1;
    this.shotCount = 0;
    this.playerScore = 0;
    this.aiScore = 15;
    this.balls = [];
    this.ballLayer = null;
    this.hud = {};
    this.aimLine = null;
    this.ghostLine = null;
    this.cueStick = null;
    this.powerFill = null;
    this.pocketedThisShot = [];
    this.settleSince = 0;
    this.lastShotSummary = "";
  }

  init(data = {}) {
    this.stake = Number(data.stake || 10);
    this.phase = "aim";
    this.lockStage = "aim";
    this.aimAngle = 0;
    this.aimDirection = 1;
    this.currentPower = 0.42;
    this.powerDirection = 1;
    this.shotCount = 0;
    this.playerScore = 0;
    this.aiScore = 15;
    this.balls = [];
    this.pocketedThisShot = [];
    this.settleSince = 0;
    this.lastShotSummary = "";
  }

  create() {
    this.game.events.emit("pubpaid:music-zone", "game");
    this.game.events.on("pubpaid:pool-dom-shot", this.handleDomShot, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.game.events.off("pubpaid:pool-dom-shot", this.handleDomShot, this);
    });
    this.drawBackdrop();
    this.drawTable();
    this.drawHud();
    this.ballLayer = this.add.container(0, 0).setDepth(5);
    this.createRack();
    this.updateAimVisual();
    this.syncState("Trave a mira, depois trave a força.");
  }

  drawBackdrop() {
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x02050d, 1);
    if (this.textures.exists("interior-bg")) {
      this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, "interior-bg")
        .setDisplaySize(GAME_WIDTH, GAME_HEIGHT)
        .setAlpha(0.48);
      this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x02050d, 0.52);
    }
    this.add.rectangle(TABLE.x + TABLE.width / 2, 82, 560, 46, 0x120907, 0.78)
      .setStrokeStyle(3, 0xffd06d, 0.34);
    this.add.text(TABLE.x + TABLE.width / 2, 82, "SINUCA BRASILEIRA", textStyle(17, "#ffd06d", "Courier New, Lucida Console, monospace"))
      .setOrigin(0.5)
      .setLetterSpacing(3);
    this.drawPoolActors();
  }

  drawPoolActors() {
    const playerKey = gameState.selectedCharacter?.spriteKey || "ppg-player-sprite";
    this.drawActor(playerKey, 214, 590, 122, 1, "VOCE");
    this.drawActor("ppg-guest-a-sprite", 1134, 574, 112, -1, "MESA");
  }

  drawActor(textureKey, x, y, displayHeight, flipX, label) {
    this.add.ellipse(x, y + 20, 64, 18, 0x000000, 0.28)
      .setBlendMode(Phaser.BlendModes.MULTIPLY)
      .setDepth(2);
    if (this.textures.exists(textureKey)) {
      const sprite = this.add.image(x, y, textureKey)
        .setOrigin(0.5, 1)
        .setFlipX(flipX < 0)
        .setDepth(2.1);
      fitImageToHeight(sprite, displayHeight);
    }
    this.add.text(x, y + 40, label, textStyle(11, "#ffd06d", "Courier New, Lucida Console, monospace"))
      .setOrigin(0.5)
      .setDepth(2.3);
  }

  drawTable() {
    const cx = TABLE.x + TABLE.width / 2;
    const cy = TABLE.y + TABLE.height / 2;
    this.add.ellipse(cx, cy + TABLE.height / 2 + 44, TABLE.width, 42, 0x000000, 0.34)
      .setBlendMode(Phaser.BlendModes.MULTIPLY)
      .setDepth(1);
    this.add.rectangle(cx, cy, TABLE.width + 86, TABLE.height + 82, 0x261107, 1)
      .setStrokeStyle(6, 0xffd06d, 0.22)
      .setDepth(1.1);
    this.add.rectangle(cx, cy, TABLE.width + 54, TABLE.height + 50, 0x6a3519, 1)
      .setStrokeStyle(3, 0xc48b3a, 0.58)
      .setDepth(1.2);
    this.add.rectangle(cx, cy, TABLE.width, TABLE.height, 0x0d6a43, 1)
      .setStrokeStyle(4, 0x05100b, 0.9)
      .setDepth(1.3);
    this.add.rectangle(cx, PLAYFIELD.y - 12, PLAYFIELD.width + 38, 24, 0x0a3026, 0.94).setDepth(1.4);
    this.add.rectangle(cx, PLAYFIELD.y + PLAYFIELD.height + 12, PLAYFIELD.width + 38, 24, 0x0a3026, 0.94).setDepth(1.4);
    this.add.rectangle(PLAYFIELD.x - 12, cy, 24, PLAYFIELD.height + 18, 0x0a3026, 0.94).setDepth(1.4);
    this.add.rectangle(PLAYFIELD.x + PLAYFIELD.width + 12, cy, 24, PLAYFIELD.height + 18, 0x0a3026, 0.94).setDepth(1.4);
    this.add.rectangle(cx, cy, PLAYFIELD.width, PLAYFIELD.height, 0x118155, 0.52)
      .setDepth(1.45);
    for (let index = 1; index < 5; index += 1) {
      this.add.rectangle(PLAYFIELD.x + (PLAYFIELD.width / 5) * index, PLAYFIELD.y - 28, 9, 9, 0xffe4a5, 0.92)
        .setAngle(45)
        .setDepth(1.6);
      this.add.rectangle(PLAYFIELD.x + (PLAYFIELD.width / 5) * index, PLAYFIELD.y + PLAYFIELD.height + 28, 9, 9, 0xffe4a5, 0.92)
        .setAngle(45)
        .setDepth(1.6);
    }
    POCKETS.forEach((pocket, index) => {
      const radius = index === 1 || index === 4 ? 18 : 24;
      this.add.circle(pocket.x, pocket.y, radius + 6, 0x2a1208, 1)
        .setStrokeStyle(4, 0xc48b3a, 0.65)
        .setDepth(1.7);
      this.add.circle(pocket.x, pocket.y, radius, 0x000000, 0.96).setDepth(1.8);
    });
    this.ghostLine = this.add.line(0, 0, 0, 0, 0, 0, 0xfff6dc, 0.28)
      .setLineWidth(2)
      .setDepth(6);
    this.aimLine = this.add.line(0, 0, 0, 0, 0, 0, 0x8ef0a3, 0.62)
      .setLineWidth(3)
      .setDepth(6.1);
    this.cueStick = this.add.rectangle(0, 0, 168, 7, 0xc58a42, 0.98)
      .setStrokeStyle(1, 0x4b2110, 0.92)
      .setDepth(6.2);
  }

  drawHud() {
    this.add.text(76, 70, "SINUCA", textStyle(44, "#fff6dc")).setLetterSpacing(5);
    this.hud.subtitle = this.add.text(80, 130, `entrada ${this.stake} / mesa fisica`, textStyle(15, "#d5dff2"));
    this.hud.score = this.add.text(92, 202, "", textStyle(24, "#ffd06d")).setLetterSpacing(1);
    this.hud.round = this.add.text(94, 248, "", textStyle(16, "#d5dff2"));
    this.hud.target = this.add.text(94, 284, "", textStyle(17, "#8ef0a3"));
    this.hud.status = this.add.text(94, 318, "", textStyle(15, "#fff6dc")).setWordWrapWidth(340);
    this.hud.last = this.add.text(94, 424, "", textStyle(13, "#d5dff2")).setWordWrapWidth(340);
    this.add.rectangle(94, 526, 270, 18, 0x07101c, 0.96)
      .setOrigin(0, 0.5)
      .setStrokeStyle(2, 0x50efff, 0.22);
    this.powerFill = this.add.rectangle(99, 526, 1, 10, 0xffd06d, 0.92)
      .setOrigin(0, 0.5);
    this.add.text(94, 552, "Botao Tacada: mira, depois força. Bolas colidem em tempo real.", textStyle(11, "#9fb0ca", "Courier New, Lucida Console, monospace"))
      .setWordWrapWidth(350);
    this.makeButton(748, 626, 210, 44, "VOLTAR LOBBY", () => this.backToLobby(), false);
    this.makeButton(986, 626, 190, 44, "SAIR SALAO", () => this.backToSalon(), false);
    this.updateHud("Trave a mira para quebrar o triangulo.");
  }

  createRack() {
    this.ballLayer.removeAll(true);
    this.balls = [];
    this.addBall({ id: "cue", label: "", color: 0xf4ead8, x: CUE_START.x, y: CUE_START.y, cue: true });
    let number = 1;
    const gap = BALL_RADIUS * 2.08;
    for (let row = 0; row < 5; row += 1) {
      for (let col = 0; col <= row; col += 1) {
        const x = RACK_APEX.x + row * gap * 0.88;
        const y = RACK_APEX.y + (col - row / 2) * gap;
        this.addBall({
          id: `ball-${number}`,
          label: String(number),
          color: BALL_COLORS[number - 1] || 0xffd06d,
          x,
          y,
          cue: false
        });
        number += 1;
      }
    }
  }

  addBall({ id, label, color, x, y, cue }) {
    const sprite = this.createBallSprite(x, y, color, label, cue);
    const ball = {
      id,
      label,
      color,
      cue,
      x,
      y,
      vx: 0,
      vy: 0,
      pocketed: false,
      sprite
    };
    this.balls.push(ball);
    this.ballLayer.add(sprite);
    return ball;
  }

  createBallSprite(x, y, color, label, cue) {
    const container = this.add.container(x, y).setDepth(5);
    const shadow = this.add.ellipse(3, 7, BALL_RADIUS * 2.2, 7, 0x000000, 0.32)
      .setBlendMode(Phaser.BlendModes.MULTIPLY);
    const core = this.add.circle(0, 0, BALL_RADIUS, color, 1)
      .setStrokeStyle(3, 0x06101a, 0.88);
    const shine = this.add.circle(-4, -5, 4, 0xffffff, cue ? 0.52 : 0.38);
    const band = this.add.rectangle(0, 0, BALL_RADIUS * 1.34, 6, 0xfff6dc, label ? 0.86 : 0)
      .setStrokeStyle(label ? 1 : 0, 0x07101c, 0.42);
    const number = this.add.text(0, 0, label, {
      fontFamily: "Courier New, Lucida Console, monospace",
      fontSize: "9px",
      fontStyle: "bold",
      color: color === 0x10131a ? "#fff6dc" : "#07101c",
      stroke: color === 0x10131a ? "#07101c" : "#fff6dc",
      strokeThickness: 1
    }).setOrigin(0.5);
    container.add([shadow, core, band, shine, number]);
    return container;
  }

  handleDomShot() {
    if (this.phase !== "aim") return;
    if (this.lockStage === "aim") {
      this.lockStage = "power";
      this.updateHud("Mira travada. Toque de novo para soltar a força.");
      this.syncState("Mira travada. Agora escolha a força.");
      return;
    }
    this.shootCueBall();
  }

  shootCueBall() {
    const cue = this.getCueBall();
    if (!cue) return;
    this.phase = "rolling";
    this.lockStage = "rolling";
    this.pocketedThisShot = [];
    this.settleSince = 0;
    this.shotCount += 1;
    const speed = 420 + this.currentPower * 720;
    cue.vx = Math.cos(this.aimAngle) * speed;
    cue.vy = Math.sin(this.aimAngle) * speed;
    this.updateHud("Tacada solta. As bolas estao em movimento.");
    this.syncState("Tacada solta. Calculando colisões.");
  }

  getCueBall() {
    return this.balls.find((ball) => ball.cue);
  }

  activeBalls() {
    return this.balls.filter((ball) => !ball.pocketed);
  }

  simulate(delta) {
    const step = Math.min(2, Math.max(0.5, delta / 16.67));
    const dt = step / 60;
    this.activeBalls().forEach((ball) => {
      ball.x += ball.vx * dt;
      ball.y += ball.vy * dt;
      ball.vx *= Math.pow(FRICTION, step);
      ball.vy *= Math.pow(FRICTION, step);
      if (Math.hypot(ball.vx, ball.vy) < STOP_SPEED) {
        ball.vx = 0;
        ball.vy = 0;
      }
      this.resolveWall(ball);
    });
    this.resolveBallCollisions();
    this.resolvePockets();
    this.syncBallSprites();
  }

  resolveWall(ball) {
    const minX = PLAYFIELD.x + BALL_RADIUS;
    const maxX = PLAYFIELD.x + PLAYFIELD.width - BALL_RADIUS;
    const minY = PLAYFIELD.y + BALL_RADIUS;
    const maxY = PLAYFIELD.y + PLAYFIELD.height - BALL_RADIUS;
    if (ball.x < minX) {
      ball.x = minX;
      ball.vx = Math.abs(ball.vx) * WALL_RESTITUTION;
    } else if (ball.x > maxX) {
      ball.x = maxX;
      ball.vx = -Math.abs(ball.vx) * WALL_RESTITUTION;
    }
    if (ball.y < minY) {
      ball.y = minY;
      ball.vy = Math.abs(ball.vy) * WALL_RESTITUTION;
    } else if (ball.y > maxY) {
      ball.y = maxY;
      ball.vy = -Math.abs(ball.vy) * WALL_RESTITUTION;
    }
  }

  resolveBallCollisions() {
    const balls = this.activeBalls();
    for (let leftIndex = 0; leftIndex < balls.length; leftIndex += 1) {
      for (let rightIndex = leftIndex + 1; rightIndex < balls.length; rightIndex += 1) {
        const a = balls[leftIndex];
        const b = balls[rightIndex];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const distance = Math.hypot(dx, dy) || 0.001;
        const minDistance = BALL_RADIUS * 2;
        if (distance >= minDistance) continue;
        const nx = dx / distance;
        const ny = dy / distance;
        const overlap = minDistance - distance;
        a.x -= nx * overlap * 0.5;
        a.y -= ny * overlap * 0.5;
        b.x += nx * overlap * 0.5;
        b.y += ny * overlap * 0.5;
        const dvx = b.vx - a.vx;
        const dvy = b.vy - a.vy;
        const impulse = dvx * nx + dvy * ny;
        if (impulse > 0) continue;
        const j = -(1 + BALL_RESTITUTION) * impulse / 2;
        a.vx -= j * nx;
        a.vy -= j * ny;
        b.vx += j * nx;
        b.vy += j * ny;
      }
    }
  }

  resolvePockets() {
    this.activeBalls().forEach((ball) => {
      const pocket = POCKETS.find((entry) => Math.hypot(ball.x - entry.x, ball.y - entry.y) < POCKET_RADIUS);
      if (!pocket) return;
      ball.pocketed = true;
      ball.vx = 0;
      ball.vy = 0;
      ball.sprite.setVisible(false);
      if (ball.cue) {
        this.pocketedThisShot.push({ cue: true, label: "branca" });
      } else {
        this.pocketedThisShot.push({ cue: false, label: ball.label });
        this.playerScore += 1;
      }
    });
  }

  syncBallSprites() {
    this.balls.forEach((ball) => {
      if (ball.pocketed) return;
      ball.sprite.setPosition(ball.x, ball.y);
      const speed = Math.hypot(ball.vx, ball.vy);
      if (speed > 0) ball.sprite.rotation += speed * 0.0009;
    });
  }

  allStopped() {
    return this.activeBalls().every((ball) => Math.hypot(ball.vx, ball.vy) === 0);
  }

  settleShot(delta) {
    if (!this.allStopped()) {
      this.settleSince = 0;
      return;
    }
    this.settleSince += delta;
    if (this.settleSince < 260) return;
    this.afterShotSettled();
  }

  afterShotSettled() {
    const cueFell = this.pocketedThisShot.some((entry) => entry.cue);
    const objects = this.pocketedThisShot.filter((entry) => !entry.cue);
    if (cueFell) this.respotCueBall();
    const left = this.balls.filter((ball) => !ball.cue && !ball.pocketed).length;
    this.aiScore = left;
    this.lastShotSummary = objects.length
      ? `Bolas ${objects.map((entry) => entry.label).join(", ")} cairam.`
      : "Nenhuma bola caiu.";
    if (cueFell) this.lastShotSummary += " Branca recolocada.";
    if (left <= 0 || this.shotCount >= MAX_SHOTS) {
      this.finishMatch(left <= 0 ? "win" : "draw");
      return;
    }
    this.phase = "aim";
    this.lockStage = "aim";
    this.currentPower = 0.34;
    this.aimAngle = Phaser.Math.Clamp(this.aimAngle + 0.18, -0.82, 0.82);
    this.updateHud(this.lastShotSummary);
    this.syncState(this.lastShotSummary);
  }

  respotCueBall() {
    const cue = this.getCueBall();
    if (!cue) return;
    cue.pocketed = false;
    cue.x = CUE_START.x;
    cue.y = CUE_START.y;
    cue.vx = 0;
    cue.vy = 0;
    cue.sprite.setVisible(true);
    cue.sprite.setPosition(cue.x, cue.y);
  }

  finishMatch(result = "draw") {
    if (this.phase === "finished") return;
    this.phase = "finished";
    const headline = result === "win" ? "MESA LIMPA" : "FIM DA SERIE";
    const color = result === "win" ? 0x8ef0a3 : 0x50efff;
    this.add.rectangle(TABLE.x + TABLE.width / 2, TABLE.y + TABLE.height / 2, 450, 190, 0x05070d, 0.9)
      .setStrokeStyle(5, color, 0.62)
      .setDepth(12);
    this.add.text(TABLE.x + TABLE.width / 2, TABLE.y + TABLE.height / 2 - 48, headline, textStyle(34, result === "win" ? "#8ef0a3" : "#50efff"))
      .setOrigin(0.5)
      .setDepth(13)
      .setLetterSpacing(4);
    this.add.text(TABLE.x + TABLE.width / 2, TABLE.y + TABLE.height / 2 + 4, `${this.playerScore} bolas em ${this.shotCount} tacadas`, textStyle(17, "#fff6dc"))
      .setOrigin(0.5)
      .setDepth(13);
    this.makeButton(TABLE.x + TABLE.width / 2 - 110, TABLE.y + TABLE.height / 2 + 82, 188, 40, "JOGAR DE NOVO", () => this.restartMatch(), true);
    this.makeButton(TABLE.x + TABLE.width / 2 + 112, TABLE.y + TABLE.height / 2 + 82, 174, 40, "VOLTAR LOBBY", () => this.backToLobby(), false);
    this.updateHud(`${headline}: ${this.playerScore} bolas.`);
    this.syncState(`${headline}: ${this.playerScore} bolas.`);
    this.game.events.emit("pubpaid:pool-result", {
      result,
      body: `${headline}: ${this.playerScore} bolas em ${this.shotCount} tacadas.`
    });
  }

  updateAimVisual() {
    const cue = this.getCueBall();
    if (!cue || cue.pocketed) return;
    const lineLength = 244;
    const targetX = cue.x + Math.cos(this.aimAngle) * lineLength;
    const targetY = cue.y + Math.sin(this.aimAngle) * lineLength;
    this.aimLine?.setTo(cue.x, cue.y, targetX, targetY);
    this.ghostLine?.setTo(cue.x, cue.y, cue.x + Math.cos(this.aimAngle) * 460, cue.y + Math.sin(this.aimAngle) * 460);
    this.cueStick?.setPosition(
      cue.x - Math.cos(this.aimAngle) * 96,
      cue.y - Math.sin(this.aimAngle) * 96
    ).setRotation(this.aimAngle);
    if (this.powerFill) this.powerFill.width = 260 * this.currentPower;
  }

  updateHud(message = "") {
    const left = this.balls.filter((ball) => !ball.cue && !ball.pocketed).length;
    this.hud.score?.setText(`BOLAS ${this.playerScore} / RESTAM ${left}`);
    this.hud.round?.setText(`Tacada ${Math.min(this.shotCount + 1, MAX_SHOTS)} de ${MAX_SHOTS}`);
    this.hud.target?.setText(this.lockStage === "power" ? "Força" : "Mira");
    if (message) this.hud.status?.setText(message);
    this.hud.last?.setText(this.lastShotSummary || "Triangulo montado. Quebre a mesa.");
    this.updateAimVisual();
  }

  syncState(prompt) {
    const left = this.balls.filter((ball) => !ball.cue && !ball.pocketed).length;
    updateGameState({
      currentScene: "pool-game",
      activeGameId: "pool",
      lobbyPhase: this.phase === "finished" ? "finished" : "playing",
      objective: "Vencer a mesa de Sinuca",
      focus: "mesa de sinuca",
      poolGame: {
        round: Math.min(this.shotCount + 1, MAX_SHOTS),
        maxRounds: MAX_SHOTS,
        playerScore: this.playerScore,
        aiScore: left,
        phase: this.phase,
        lockStage: this.lockStage,
        aimAngle: Number(this.aimAngle.toFixed(3)),
        power: Number(this.currentPower.toFixed(2)),
        balls: this.balls.map((ball) => ({
          id: ball.id,
          label: ball.label,
          cue: ball.cue,
          x: Math.round(ball.x),
          y: Math.round(ball.y),
          pocketed: ball.pocketed
        })),
        poolMap: {
          table: TABLE,
          playfield: PLAYFIELD,
          pockets: POCKETS,
          ballRadius: BALL_RADIUS
        },
        poolWarnings: []
      },
      prompt
    });
  }

  restartMatch() {
    this.scene.restart({ stake: this.stake });
  }

  backToLobby() {
    this.scene.start("game-lobby-scene", {
      gameId: "pool",
      stake: this.stake
    });
  }

  backToSalon() {
    updateGameState({
      currentScene: "interior",
      activeGameId: "",
      poolGame: null,
      lobbyPhase: "hub",
      objective: "Falar com o garcom para escolher jogo",
      prompt: "Voltando ao salao. Escolha outro jogo pelo garcom."
    });
    this.scene.start("interior-scene");
  }

  makeButton(x, y, width, height, label, onClick, primary = false) {
    const container = this.add.container(x, y).setDepth(14);
    const bg = this.add.rectangle(0, 0, width, height, primary ? 0xffd06d : 0x0b1220, primary ? 0.94 : 0.9)
      .setStrokeStyle(2, primary ? 0xfff6dc : 0x50efff, primary ? 0.55 : 0.34);
    const text = this.add.text(0, 0, label, {
      fontFamily: "Courier New, Lucida Console, monospace",
      fontSize: "12px",
      fontStyle: "bold",
      color: primary ? "#07101c" : "#fff6dc",
      stroke: primary ? "#fff6dc" : "#05070d",
      strokeThickness: primary ? 1 : 3
    }).setOrigin(0.5).setLetterSpacing(1);
    container.add([bg, text]);
    container.setSize(width, height);
    container.setInteractive(new Phaser.Geom.Rectangle(-width / 2, -height / 2, width, height), Phaser.Geom.Rectangle.Contains);
    container.on("pointerdown", onClick);
    return container;
  }

  update(_time, delta) {
    if (this.phase === "rolling") {
      this.simulate(delta);
      this.settleShot(delta);
      return;
    }
    if (this.phase !== "aim") return;
    if (this.lockStage === "aim") {
      this.aimAngle += this.aimDirection * 0.0095;
      if (this.aimAngle >= 0.74 || this.aimAngle <= -0.74) {
        this.aimDirection *= -1;
        this.aimAngle = Phaser.Math.Clamp(this.aimAngle, -0.74, 0.74);
      }
    } else if (this.lockStage === "power") {
      this.currentPower += this.powerDirection * 0.012;
      if (this.currentPower >= 0.96 || this.currentPower <= 0.18) {
        this.powerDirection *= -1;
        this.currentPower = Phaser.Math.Clamp(this.currentPower, 0.18, 0.96);
      }
    }
    this.updateAimVisual();
    if (this.phase === "aim") this.updateHud();
  }
}
