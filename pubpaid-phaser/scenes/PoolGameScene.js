import { GAME_HEIGHT, GAME_WIDTH } from "../config/gameConfig.js";
import { gameState, updateGameState } from "../core/gameState.js";
import { fitImageToHeight } from "../core/assetRegistry.js";

const TABLE = { x: 77, y: 165, width: 1125, height: 472 };

const BALL_RADIUS = 13;
const POCKET_RADIUS = 39;
const OBJECT_BALL_COUNT = 9;
const WALL_RESTITUTION = 0.88;
const BALL_RESTITUTION = 0.94;
const FRICTION = 0.987;
const STOP_SPEED = 9;
const MAX_SHOTS = 12;

const PLAYFIELD = {
  x: TABLE.x + 59,
  y: TABLE.y + 43,
  width: TABLE.width - 117,
  height: TABLE.height - 91
};

const CUE_START = {
  x: PLAYFIELD.x + PLAYFIELD.width * 0.23,
  y: PLAYFIELD.y + PLAYFIELD.height * 0.5
};

const RACK_APEX = {
  x: PLAYFIELD.x + PLAYFIELD.width * 0.69,
  y: PLAYFIELD.y + PLAYFIELD.height * 0.5
};

const CORNER_POCKET_INSET = -19;
const SIDE_POCKET_INSET = -19;
const POCKETS = [
  { id: "top-left", x: PLAYFIELD.x + CORNER_POCKET_INSET, y: PLAYFIELD.y + CORNER_POCKET_INSET },
  { id: "top-center", x: PLAYFIELD.x + PLAYFIELD.width / 2, y: PLAYFIELD.y + SIDE_POCKET_INSET },
  { id: "top-right", x: PLAYFIELD.x + PLAYFIELD.width - CORNER_POCKET_INSET, y: PLAYFIELD.y + CORNER_POCKET_INSET },
  { id: "bottom-left", x: PLAYFIELD.x + CORNER_POCKET_INSET, y: PLAYFIELD.y + PLAYFIELD.height - CORNER_POCKET_INSET },
  { id: "bottom-center", x: PLAYFIELD.x + PLAYFIELD.width / 2, y: PLAYFIELD.y + PLAYFIELD.height - SIDE_POCKET_INSET },
  { id: "bottom-right", x: PLAYFIELD.x + PLAYFIELD.width - CORNER_POCKET_INSET, y: PLAYFIELD.y + PLAYFIELD.height - CORNER_POCKET_INSET }
];

const BALL_COLORS = [
  0xf0c742, 0x1f6ad4, 0xc93645, 0x6b49ba, 0xe17a2d,
  0x2d8f72, 0x7a2238, 0x10131a, 0xf0c742, 0x1f6ad4,
  0xc93645, 0x6b49ba, 0xe17a2d, 0x2d8f72, 0x7a2238
];

const HUD = {
  score: { x: 13, y: 13, w: 203, h: 101 },
  shots: { x: 229, y: 13, w: 160, h: 101 },
  spin: { x: 403, y: 13, w: 240, h: 101 },
  power: { x: 656, y: 13, w: 368, h: 101 },
  pocketed: { x: 1037, y: 13, w: 229, h: 101 },
  status: { x: 93, y: 653, w: 1094, h: 51 }
};

const POOL_SPINS = {
  centro: { label: "Centro", vx: 0, vy: 0, turn: 0 },
  segue: { label: "Segue", vx: 0, vy: 0.04, turn: 0 },
  puxa: { label: "Puxa", vx: 0, vy: -0.04, turn: 0 },
  esq: { label: "Esq", vx: -0.035, vy: 0, turn: -0.01 },
  dir: { label: "Dir", vx: 0.035, vy: 0, turn: 0.01 }
};

function normalizePoolSpin(value = "centro") {
  return Object.prototype.hasOwnProperty.call(POOL_SPINS, value) ? value : "centro";
}

function distancePointToSegment(px, py, ax, ay, bx, by) {
  const abx = bx - ax;
  const aby = by - ay;
  const lengthSquared = abx * abx + aby * aby;
  if (lengthSquared <= 0.0001) return Math.hypot(px - bx, py - by);
  const t = Math.max(0, Math.min(1, ((px - ax) * abx + (py - ay) * aby) / lengthSquared));
  return Math.hypot(px - (ax + abx * t), py - (ay + aby * t));
}

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

function colorToCss(value) {
  return `#${Number(value || 0).toString(16).padStart(6, "0").slice(-6)}`;
}

function padScore(value = 0) {
  return String(Math.max(0, Math.round(value || 0))).padStart(5, "0");
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
    this.powerSyncElapsed = 0;
    this.shotCount = 0;
    this.playerScore = 0;
    this.aiScore = OBJECT_BALL_COUNT;
    this.balls = [];
    this.ballLayer = null;
    this.effectsLayer = null;
    this.hud = {};
    this.aimLine = null;
    this.ghostLine = null;
    this.cueStick = null;
    this.powerFill = null;
    this.powerSegments = [];
    this.spinHotspots = [];
    this.pocketedThisShot = [];
    this.pocketedLog = [];
    this.poolSpin = "centro";
    this.settleSince = 0;
    this.lastShotSummary = "";
  }

  init(data = {}) {
    this.stake = Number(data.stake || 10);
    this.mode = data.mode || "demo";
    this.phase = "aim";
    this.lockStage = "aim";
    this.aimAngle = 0;
    this.aimDirection = 1;
    this.currentPower = 0.42;
    this.powerDirection = 1;
    this.powerSyncElapsed = 0;
    this.shotCount = 0;
    this.playerScore = 0;
    this.aiScore = OBJECT_BALL_COUNT;
    this.balls = [];
    this.pocketedThisShot = [];
    this.pocketedLog = [];
    this.poolSpin = "centro";
    this.settleSince = 0;
    this.lastShotSummary = "";
  }

  create() {
    this.game.events.emit("pubpaid:music-zone", "game");
    this.game.events.on("pubpaid:pool-dom-shot", this.handleDomShot, this);
    this.game.events.on("pubpaid:pool-dom-aim-step", this.handleDomAimStep, this);
    this.game.events.on("pubpaid:pool-dom-spin", this.handleDomSpin, this);
    this.input.keyboard?.on("keydown", this.handleKeyDown, this);
    this.input.on("pointermove", this.handlePointerMove, this);
    this.input.on("pointerdown", this.handlePointerDown, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.game.events.off("pubpaid:pool-dom-shot", this.handleDomShot, this);
      this.game.events.off("pubpaid:pool-dom-aim-step", this.handleDomAimStep, this);
      this.game.events.off("pubpaid:pool-dom-spin", this.handleDomSpin, this);
      this.input.keyboard?.off("keydown", this.handleKeyDown, this);
      this.input.off("pointermove", this.handlePointerMove, this);
      this.input.off("pointerdown", this.handlePointerDown, this);
    });
    this.drawBackdrop();
    this.drawTable();
    this.drawHud();
    this.effectsLayer = this.add.container(0, 0).setDepth(8);
    this.ballLayer = this.add.container(0, 0).setDepth(5);
    this.createRack();
    this.updateAimVisual();
    this.syncState("1: trave a mira. 2: inicie a barra. 3: toque no ponto certo para tacar.");
  }

  drawBackdrop() {
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x120b07, 1);
    for (let y = 38; y < GAME_HEIGHT; y += 32) {
      this.add.rectangle(GAME_WIDTH / 2, y, GAME_WIDTH, 22, y % 64 === 38 ? 0x211209 : 0x170c07, 1).setDepth(0.08);
      this.add.line(0, 0, 0, y + 12, GAME_WIDTH, y + 12, 0x05070d, 0.35).setDepth(0.09);
    }
    for (let x = 36; x < GAME_WIDTH; x += 112) {
      this.add.line(0, 0, x, 0, x, GAME_HEIGHT, 0xd39a4d, 0.08).setDepth(0.1);
    }
    [
      { x: TABLE.x + 120, y: TABLE.y - 20, w: 210, h: 154 },
      { x: TABLE.x + TABLE.width / 2, y: TABLE.y - 30, w: 250, h: 174 },
      { x: TABLE.x + TABLE.width - 120, y: TABLE.y - 20, w: 210, h: 154 }
    ].forEach((lamp) => {
      this.add.ellipse(lamp.x, lamp.y, lamp.w, lamp.h, 0xffd06d, 0.1)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setDepth(0.22);
      this.add.rectangle(lamp.x, lamp.y - 46, 90, 14, 0xd39a4d, 0.32)
        .setStrokeStyle(2, 0x4b2110, 0.8)
        .setDepth(0.23);
    });
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
    const g = this.add.graphics().setDepth(1.1);
    const octagon = (x, y, r, color, alpha = 1) => {
      g.fillStyle(color, alpha);
      g.beginPath();
      g.moveTo(x - r * 0.42, y - r);
      g.lineTo(x + r * 0.42, y - r);
      g.lineTo(x + r, y - r * 0.42);
      g.lineTo(x + r, y + r * 0.42);
      g.lineTo(x + r * 0.42, y + r);
      g.lineTo(x - r * 0.42, y + r);
      g.lineTo(x - r, y + r * 0.42);
      g.lineTo(x - r, y - r * 0.42);
      g.closePath();
      g.fillPath();
    };

    this.add.rectangle(TABLE.x + TABLE.width / 2, TABLE.y + TABLE.height + 42, TABLE.width + 110, 44, 0x000000, 0.32)
      .setBlendMode(Phaser.BlendModes.MULTIPLY)
      .setDepth(1);

    g.fillStyle(0x271006, 1);
    g.fillRect(TABLE.x, TABLE.y, TABLE.width, TABLE.height);
    g.fillStyle(0x6c3517, 1);
    g.fillRect(TABLE.x + 21, TABLE.y + 16, TABLE.width - 42, 51);
    g.fillRect(TABLE.x + 21, TABLE.y + TABLE.height - 67, TABLE.width - 42, 51);
    g.fillRect(TABLE.x + 16, TABLE.y + 21, 56, TABLE.height - 42);
    g.fillRect(TABLE.x + TABLE.width - 72, TABLE.y + 21, 56, TABLE.height - 42);
    g.fillStyle(0x2c130b, 1);
    g.fillRect(TABLE.x + 28, TABLE.y + 28, TABLE.width - 56, 10);
    g.fillRect(TABLE.x + 28, TABLE.y + TABLE.height - 38, TABLE.width - 56, 10);
    g.fillRect(TABLE.x + 28, TABLE.y + 34, 10, TABLE.height - 68);
    g.fillRect(TABLE.x + TABLE.width - 38, TABLE.y + 34, 10, TABLE.height - 68);

    for (let x = TABLE.x + 44; x < TABLE.x + TABLE.width - 44; x += 38) {
      g.fillStyle(0xffdd8c, 0.28);
      g.fillRect(x, TABLE.y + 32, 18, 3);
      g.fillRect(x, TABLE.y + TABLE.height - 36, 18, 3);
    }
    for (let y = TABLE.y + 46; y < TABLE.y + TABLE.height - 46; y += 43) {
      g.fillStyle(0xffdd8c, 0.18);
      g.fillRect(TABLE.x + 32, y, 3, 16);
      g.fillRect(TABLE.x + TABLE.width - 35, y, 3, 16);
    }

    g.fillStyle(0x00482e, 1);
    g.fillRect(PLAYFIELD.x - 11, PLAYFIELD.y - 11, PLAYFIELD.width + 22, PLAYFIELD.height + 22);
    g.fillStyle(0x006b3e, 1);
    g.fillRect(PLAYFIELD.x, PLAYFIELD.y, PLAYFIELD.width, PLAYFIELD.height);
    g.fillStyle(0x12945a, 0.16);
    for (let y = PLAYFIELD.y + 10; y < PLAYFIELD.y + PLAYFIELD.height; y += 9) {
      g.fillRect(PLAYFIELD.x, y, PLAYFIELD.width, 1);
    }
    g.lineStyle(4, 0x001f18, 0.28);
    g.beginPath();
    g.moveTo(PLAYFIELD.x + PLAYFIELD.width * 0.77, PLAYFIELD.y + 24);
    g.lineTo(PLAYFIELD.x + PLAYFIELD.width * 0.77, PLAYFIELD.y + PLAYFIELD.height - 24);
    g.strokePath();

    for (const pocket of POCKETS) {
      octagon(pocket.x + 3, pocket.y + 4, 25, 0x000000, 0.42);
      octagon(pocket.x, pocket.y, 24, 0x2c130b, 1);
      octagon(pocket.x, pocket.y, 21, 0x9b6828, 1);
      octagon(pocket.x, pocket.y, 15, 0x150906, 1);
      octagon(pocket.x, pocket.y, 12, 0x010202, 1);

      const dx = pocket.x < PLAYFIELD.x ? 1 : pocket.x > PLAYFIELD.x + PLAYFIELD.width ? -1 : 0;
      const dy = pocket.y < PLAYFIELD.y ? 1 : pocket.y > PLAYFIELD.y + PLAYFIELD.height ? -1 : 0;
      const notch = 8;
      g.fillStyle(0x010202, 1);
      if (dx && dy) {
        g.fillRect(Math.round(dx > 0 ? pocket.x + 9 : pocket.x - 17), Math.round(dy > 0 ? pocket.y + 9 : pocket.y - 17), notch, notch);
      } else if (dy) {
        g.fillRect(Math.round(pocket.x - notch), Math.round(dy > 0 ? pocket.y + 9 : pocket.y - 17), notch * 2, notch);
      } else if (dx) {
        g.fillRect(Math.round(dx > 0 ? pocket.x + 9 : pocket.x - 17), Math.round(pocket.y - notch), notch, notch * 2);
      }
      g.fillStyle(0xffffff, 0.2);
      g.fillRect(Math.round(pocket.x - 8), Math.round(pocket.y - 13), 4, 1);
    }

    this.ghostLine = this.add.line(0, 0, 0, 0, 0, 0, 0xfff6dc, 0.28)
      .setLineWidth(2)
      .setDepth(6);
    this.aimLine = this.add.line(0, 0, 0, 0, 0, 0, 0x8ef0a3, 0.62)
      .setLineWidth(3)
      .setDepth(6.1);
    this.cueStick = this.add.container(0, 0).setDepth(6.2);
    const shaft = this.add.rectangle(-98, 0, 210, 10, 0xc58a42, 0.98)
      .setStrokeStyle(2, 0x4b2110, 0.92);
    const butt = this.add.rectangle(-210, 0, 44, 12, 0x5f2d16, 1)
      .setStrokeStyle(2, 0x2a1208, 0.92);
    const ferrule = this.add.rectangle(12, 0, 16, 8, 0xf1ddae, 1)
      .setStrokeStyle(1, 0x8a5a2d, 0.72);
    const tip = this.add.rectangle(24, 0, 8, 9, 0x4d7f95, 1)
      .setStrokeStyle(1, 0x102531, 0.72);
    this.cueStick.add([butt, shaft, ferrule, tip]);
  }

  drawHud() {
    const g = this.add.graphics().setDepth(9);
    const panel = ({ x, y, w, h }, title) => {
      g.fillStyle(0x07131a, 0.96);
      g.fillRect(x, y, w, h);
      g.lineStyle(5, 0x7e4e18, 1);
      g.strokeRect(x + 3, y + 3, w - 6, h - 6);
      g.lineStyle(2, 0xffe39d, 0.86);
      g.strokeRect(x + 11, y + 11, w - 22, h - 22);
      this.add.text(x + 21, y + 31, title, textStyle(16, "#ffe39d", "Courier New, Lucida Console, monospace"))
        .setDepth(10);
    };
    panel(HUD.score, "PONTOS");
    panel(HUD.shots, "TACADAS");
    panel(HUD.spin, "EFEITO");
    panel(HUD.power, "FORCA");
    panel(HUD.pocketed, "BOLAS FORA");

    this.hud.score = this.add.text(HUD.score.x + 27, HUD.score.y + 62, "", textStyle(35, "#f8ebd5", "Courier New, Lucida Console, monospace"))
      .setDepth(10);
    this.hud.nextLabel = this.add.text(HUD.score.x + 147, HUD.score.y + 33, "PROX", textStyle(10, "#ffe39d", "Courier New, Lucida Console, monospace"))
      .setDepth(10);
    this.hud.nextBall = this.add.container(HUD.score.x + 174, HUD.score.y + 64).setDepth(10);
    this.hud.nextBallCore = this.add.circle(0, 0, 12, 0xf0b12d, 1)
      .setStrokeStyle(2, 0x07101c, 0.85);
    this.hud.nextBallText = this.add.text(0, 0, "1", textStyle(9, "#07101c", "Courier New, Lucida Console, monospace")).setOrigin(0.5);
    this.hud.nextBall.add([this.hud.nextBallCore, this.hud.nextBallText]);

    this.hud.round = this.add.text(HUD.shots.x + 52, HUD.shots.y + 62, "", textStyle(35, "#f8ebd5", "Courier New, Lucida Console, monospace"))
      .setDepth(10);

    this.hud.spinBall = this.add.container(HUD.spin.x + 122, HUD.spin.y + 64).setDepth(10);
    this.hud.spinBall.add([
      this.add.circle(0, 0, 25, 0xd9c58e, 1),
      this.add.circle(0, 0, 36, 0x000000, 0).setStrokeStyle(2, 0x7e4e18, 0.8),
      this.add.circle(0, 0, 6, 0xba1412, 1)
    ]);
    this.hud.spinMark = this.hud.spinBall.list[2];
    this.hud.spinName = this.add.text(HUD.spin.x + 22, HUD.spin.y + 56, "", textStyle(15, "#8fff5b", "Courier New, Lucida Console, monospace"))
      .setDepth(10);
    this.hud.spinHint = this.add.text(HUD.spin.x + 22, HUD.spin.y + 78, "1-5", textStyle(11, "#f8ebd5", "Courier New, Lucida Console, monospace"))
      .setDepth(10);
    this.spinHotspots = [
      { spin: "centro", label: "•", x: HUD.spin.x + 115, y: HUD.spin.y + 57, w: 20, h: 20 },
      { spin: "segue", label: "↑", x: HUD.spin.x + 115, y: HUD.spin.y + 35, w: 20, h: 20 },
      { spin: "puxa", label: "↓", x: HUD.spin.x + 115, y: HUD.spin.y + 79, w: 20, h: 20 },
      { spin: "esq", label: "←", x: HUD.spin.x + 93, y: HUD.spin.y + 57, w: 20, h: 20 },
      { spin: "dir", label: "→", x: HUD.spin.x + 137, y: HUD.spin.y + 57, w: 20, h: 20 }
    ];
    this.hud.spinButtons = this.spinHotspots.map((hotspot) => {
      const box = this.add.rectangle(hotspot.x, hotspot.y, hotspot.w, hotspot.h, 0x15222c, 1)
        .setOrigin(0, 0)
        .setStrokeStyle(1, 0x6a4924, 1)
        .setDepth(10);
      const label = this.add.text(hotspot.x + hotspot.w / 2, hotspot.y + hotspot.h / 2 + 1, hotspot.label, textStyle(13, "#d7b36a", "Courier New, Lucida Console, monospace"))
        .setOrigin(0.5)
        .setDepth(11);
      return { ...hotspot, box, label };
    });

    const segmentCount = 16;
    const segW = 19;
    const segGap = 4;
    const px = HUD.power.x + 35;
    const py = HUD.power.y + 45;
    g.fillStyle(0x05080b, 1);
    g.fillRect(px, py, 294, 24);
    g.lineStyle(2, 0x7b5525, 1);
    g.strokeRect(px - 5, py - 5, 304, 34);
    this.powerSegments = [];
    for (let index = 0; index < segmentCount; index += 1) {
      const rect = this.add.rectangle(px + index * (segW + segGap), py, segW, 24, 0x16202a, 1)
        .setOrigin(0, 0)
        .setDepth(10);
      this.powerSegments.push(rect);
    }
    this.hud.powerMin = this.add.text(px, py + 47, "MIN", textStyle(12, "#f8ebd5", "Courier New, Lucida Console, monospace")).setDepth(10);
    this.hud.powerMax = this.add.text(px + 258, py + 47, "MAX", textStyle(12, "#f8ebd5", "Courier New, Lucida Console, monospace")).setDepth(10);
    this.hud.powerMarker = this.add.triangle(px, py + 42, 0, 10, 9, -6, 18, 10, 0xffe39d, 1)
      .setDepth(10);

    this.hud.outBalls = this.add.text(HUD.pocketed.x + 30, HUD.pocketed.y + 59, "", textStyle(18, "#8fff5b", "Courier New, Lucida Console, monospace"))
      .setDepth(10)
      .setWordWrapWidth(HUD.pocketed.w - 52);

    g.fillStyle(0x050c11, 0.88);
    g.fillRect(HUD.status.x, HUD.status.y, HUD.status.w, HUD.status.h);
    g.lineStyle(2, 0x7e4e18, 1);
    g.strokeRect(HUD.status.x, HUD.status.y, HUD.status.w, HUD.status.h);
    this.add.text(HUD.status.x + 29, HUD.status.y + 28, "ESTADO", textStyle(14, "#ffe39d", "Courier New, Lucida Console, monospace"))
      .setDepth(10)
      .setOrigin(0, 0.5);
    this.hud.status = this.add.text(HUD.status.x + 130, HUD.status.y + 28, "", textStyle(18, "#8fff5b", "Courier New, Lucida Console, monospace"))
      .setDepth(10)
      .setOrigin(0, 0.5)
      .setWordWrapWidth(HUD.status.w - 160);
    this.hud.last = this.hud.status;
    this.hud.target = this.hud.spinName;
    this.updateHud("MIRE E TACO");
  }

  createRack() {
    this.ballLayer.removeAll(true);
    this.balls = [];
    this.addBall({ id: "cue", label: "", color: 0xf4ead8, x: CUE_START.x, y: CUE_START.y, cue: true });
    const gapX = Math.round(BALL_RADIUS * 1.72);
    const gapY = BALL_RADIUS * 2;
    [
      [1, 0, 0],
      [2, 1, -0.5],
      [3, 1, 0.5],
      [4, 2, -1],
      [9, 2, 0],
      [5, 2, 1],
      [6, 3, -1],
      [7, 3, 0],
      [8, 3, 1]
    ].forEach(([number, column, rowOffset]) => {
      this.addBall({
        id: `ball-${number}`,
        label: String(number),
        color: BALL_COLORS[number - 1] || 0xffd06d,
        x: RACK_APEX.x + column * gapX,
        y: RACK_APEX.y + rowOffset * gapY,
        cue: false
      });
    });
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
      this.lockStage = "locked";
      this.currentPower = 0.18;
      this.powerDirection = 1;
      this.updateHud("Mira travada. Aperte Iniciar força.");
      this.syncState("Mira travada. Aperte Iniciar força.");
      return;
    }
    if (this.lockStage === "locked") {
      this.lockStage = "power";
      this.currentPower = 0.18;
      this.powerDirection = 1;
      this.updateHud("Barra correndo. Aperte Tacar no ponto certo.");
      this.syncState("Barra correndo. Aperte Tacar no ponto certo.");
      return;
    }
    this.shootCueBall();
  }

  handleDomAimStep(step = 0) {
    if (this.phase !== "aim" || this.lockStage !== "aim") return;
    const amount = Phaser.Math.DegToRad(Number(step) || 0);
    if (!amount) return;
    this.aimAngle = Phaser.Math.Angle.Normalize(this.aimAngle + amount);
    this.updateAimVisual();
    this.syncState("Ajuste a mira e toque para travar.");
  }

  handleDomSpin(spin = "centro") {
    if (this.phase !== "aim" || this.lockStage !== "aim") return;
    const cue = this.getCueBall() || CUE_START;
    this.poolSpin = normalizePoolSpin(spin);
    this.emitPoolFx(cue.x, cue.y, 0xffd06d, 8, 90);
    this.updateHud(`Efeito ${POOL_SPINS[this.poolSpin].label} selecionado.`);
    this.syncState(`Efeito ${POOL_SPINS[this.poolSpin].label} selecionado.`);
  }

  handleKeyDown(event) {
    if (this.phase === "finished") return;
    const key = String(event.key || "").toLowerCase();
    if (event.code === "Space") {
      event.preventDefault();
      this.handleDomShot();
      return;
    }
    if (key === "arrowleft") this.handleDomAimStep(-5);
    else if (key === "arrowright") this.handleDomAimStep(5);
    else if (key === "arrowup") {
      this.currentPower = Math.min(1, this.currentPower + 0.08);
      this.updateHud("FORCA AJUSTADA");
    } else if (key === "arrowdown") {
      this.currentPower = Math.max(0.08, this.currentPower - 0.08);
      this.updateHud("FORCA AJUSTADA");
    } else if (["1", "2", "3", "4", "5"].includes(key)) {
      const spin = ["centro", "segue", "puxa", "esq", "dir"][Number(key) - 1];
      this.handleDomSpin(spin);
    } else if (key === "e") {
      const order = ["centro", "segue", "puxa", "esq", "dir"];
      const index = order.indexOf(this.poolSpin);
      this.handleDomSpin(order[(index + 1 + order.length) % order.length]);
    } else if (key === "r" && this.mode === "demo") {
      this.restartMatch();
    }
  }

  tryHandleHudPointer(pointer) {
    if (this.phase !== "aim" || this.lockStage !== "aim") return false;
    const x = Number(pointer.worldX);
    const y = Number(pointer.worldY);
    const hit = this.spinHotspots.find((item) =>
      x >= item.x && x <= item.x + item.w && y >= item.y && y <= item.y + item.h
    );
    if (!hit) return false;
    this.handleDomSpin(hit.spin);
    return true;
  }

  handlePointerMove(pointer) {
    if (this.phase !== "aim") return;
    if (this.lockStage === "aim") this.updateAimFromPointer(pointer);
  }

  handlePointerDown(pointer) {
    if (this.phase !== "aim") return;
    if (this.tryHandleHudPointer(pointer)) return;
    if (this.lockStage === "aim") this.updateAimFromPointer(pointer);
  }

  updateAimFromPointer(pointer) {
    const cue = this.getCueBall();
    if (!cue) return;
    const dx = Number(pointer.worldX) - cue.x;
    const dy = Number(pointer.worldY) - cue.y;
    if (Math.hypot(dx, dy) < 8) return;
    this.aimAngle = Phaser.Math.Angle.Normalize(Math.atan2(dy, dx));
    this.updateAimVisual();
  }

  shootCueBall() {
    const cue = this.getCueBall();
    if (!cue) return;
    this.phase = "rolling";
    this.lockStage = "rolling";
    this.cueStick?.setVisible(false);
    this.pocketedThisShot = [];
    this.settleSince = 0;
    this.shotCount += 1;
    const spin = POOL_SPINS[this.poolSpin] || POOL_SPINS.centro;
    const speed = 420 + this.currentPower * 720;
    cue.vx = Math.cos(this.aimAngle) * speed + spin.vx * 1900;
    cue.vy = Math.sin(this.aimAngle) * speed + spin.vy * 1900;
    cue.spin = this.poolSpin;
    this.emitPoolFx(cue.x, cue.y, 0xfff6dc, 14, 150);
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
    const fastest = this.activeBalls().reduce((max, ball) => Math.max(max, Math.hypot(ball.vx, ball.vy)), 0);
    const subSteps = Math.min(8, Math.max(1, Math.ceil((fastest * dt) / (POCKET_RADIUS * 0.35))));
    const subDt = dt / subSteps;
    const subFriction = Math.pow(FRICTION, step / subSteps);
    for (let subStep = 0; subStep < subSteps; subStep += 1) {
      this.activeBalls().forEach((ball) => {
        if (ball.cue && ball.spin && ball.spin !== "centro") {
          const spin = POOL_SPINS[ball.spin] || POOL_SPINS.centro;
          const speed = Math.hypot(ball.vx, ball.vy);
          if (speed > 80 && spin.turn) {
            const angle = Math.atan2(ball.vy, ball.vx) + spin.turn * subDt * 7;
            ball.vx = Math.cos(angle) * speed;
            ball.vy = Math.sin(angle) * speed;
          }
        }
        ball.prevX = ball.x;
        ball.prevY = ball.y;
        ball.x += ball.vx * subDt;
        ball.y += ball.vy * subDt;
        ball.vx *= subFriction;
        ball.vy *= subFriction;
        if (Math.hypot(ball.vx, ball.vy) < STOP_SPEED) {
          ball.vx = 0;
          ball.vy = 0;
        }
      });
      this.resolvePockets();
      this.activeBalls().forEach((ball) => this.resolveWall(ball));
      this.resolveBallCollisions();
      this.resolvePockets();
    }
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
      const pocket = POCKETS.find((entry) => this.ballReachedPocket(ball, entry));
      if (!pocket) return;
      ball.pocketed = true;
      ball.x = pocket.x;
      ball.y = pocket.y;
      ball.vx = 0;
      ball.vy = 0;
      ball.sprite.setVisible(false);
      this.emitPoolFx(pocket.x, pocket.y, ball.cue ? 0xfff6dc : ball.color, 18, 170);
      if (ball.cue) {
        this.pocketedThisShot.push({ cue: true, label: "branca" });
      } else {
        this.pocketedThisShot.push({ cue: false, label: ball.label });
        this.pocketedLog.push({ label: ball.label, color: colorToCss(ball.color), shot: this.shotCount });
        this.playerScore += 1;
      }
    });
  }

  ballReachedPocket(ball, pocket) {
    if (Math.hypot(ball.x - pocket.x, ball.y - pocket.y) <= POCKET_RADIUS) return true;
    if (!Number.isFinite(ball.prevX) || !Number.isFinite(ball.prevY)) return false;
    return distancePointToSegment(pocket.x, pocket.y, ball.prevX, ball.prevY, ball.x, ball.y) <= POCKET_RADIUS;
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
    this.poolSpin = "centro";
    this.currentPower = 0.34;
    this.powerDirection = 1;
    this.cueStick?.setVisible(true);
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
    cue.spin = "centro";
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
    const pullback = this.lockStage === "power" ? 34 + this.currentPower * 88 : 42;
    this.cueStick?.setVisible(this.phase === "aim")
      .setPosition(
        cue.x - Math.cos(this.aimAngle) * pullback,
        cue.y - Math.sin(this.aimAngle) * pullback
      )
      .setRotation(this.aimAngle);
    if (this.powerFill) this.powerFill.width = 260 * this.currentPower;
  }

  emitPoolFx(x, y, color = 0xffd06d, count = 10, power = 120) {
    if (!this.effectsLayer) return;
    const ring = this.add.circle(x, y, 8, color, 0)
      .setStrokeStyle(2, color, 0.74)
      .setBlendMode(Phaser.BlendModes.ADD);
    this.effectsLayer.add(ring);
    this.tweens.add({
      targets: ring,
      radius: 38,
      alpha: 0,
      duration: 480,
      ease: "Cubic.easeOut",
      onComplete: () => ring.destroy()
    });
    for (let i = 0; i < count; i += 1) {
      const angle = Math.random() * Math.PI * 2;
      const distance = 16 + Math.random() * power * 0.24;
      const spark = this.add.rectangle(x, y, 3, 3, color, 0.82)
        .setBlendMode(Phaser.BlendModes.ADD);
      this.effectsLayer.add(spark);
      this.tweens.add({
        targets: spark,
        x: x + Math.cos(angle) * distance,
        y: y + Math.sin(angle) * distance,
        alpha: 0,
        duration: 260 + Math.random() * 220,
        ease: "Quad.easeOut",
        onComplete: () => spark.destroy()
      });
    }
  }

  updateHud(message = "") {
    const left = this.balls.filter((ball) => !ball.cue && !ball.pocketed).length;
    const nextBall = this.balls.find((ball) => !ball.cue && !ball.pocketed);
    this.hud.score?.setText(padScore(this.playerScore * 700));
    this.hud.round?.setText(String(this.shotCount).padStart(2, "0"));
    if (this.hud.nextBallCore) this.hud.nextBallCore.setFillStyle(nextBall?.color || 0xead79a, 1);
    if (this.hud.nextBallText) this.hud.nextBallText.setText(nextBall?.label || "-");
    this.hud.target?.setText(
      this.lockStage === "power"
        ? "TACAR"
        : this.lockStage === "locked"
          ? "FORCA"
          : POOL_SPINS[this.poolSpin].label.toUpperCase()
    );
    const spin = POOL_SPINS[this.poolSpin] || POOL_SPINS.centro;
    this.hud.spinMark?.setPosition(spin.vx * 230, spin.vy * 230);
    this.hud.spinButtons?.forEach((button) => {
      const active = button.spin === this.poolSpin;
      button.box?.setFillStyle(active ? 0xd22f26 : 0x15222c, 1);
      button.box?.setStrokeStyle(1, active ? 0xffe39d : 0x6a4924, 1);
      button.label?.setColor(active ? "#fff3ca" : "#d7b36a");
    });
    this.powerSegments.forEach((segment, index) => {
      const active = (index + 1) / this.powerSegments.length <= this.currentPower + 0.001;
      segment.setFillStyle(
        active
          ? index < 10 ? 0xffb11c : index < 13 ? 0xdb5242 : 0x5c8df1
          : 0x16202a,
        1
      );
    });
    this.hud.powerMarker?.setX(HUD.power.x + 35 + Math.round(294 * this.currentPower));
    if (this.hud.outBalls) {
      this.hud.outBalls.setText(
        this.pocketedLog.length
          ? this.pocketedLog.slice(-7).map((entry) => entry.label).join("  ")
          : this.phase === "rolling" ? "ROLANDO" : "NENHUMA"
      );
    }
    if (message) this.hud.status?.setText(message);
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
        demo: this.mode === "demo",
        realPvp: false,
        round: Math.min(this.shotCount + 1, MAX_SHOTS),
        maxRounds: MAX_SHOTS,
        playerScore: this.playerScore,
        aiScore: left,
        phase: this.phase,
        lockStage: this.lockStage,
        aimAngle: Number(this.aimAngle.toFixed(3)),
        power: Number(this.currentPower.toFixed(2)),
        spin: this.poolSpin,
        spinLabel: POOL_SPINS[this.poolSpin].label,
        balls: this.balls.map((ball) => ({
          id: ball.id,
          label: ball.label,
          cue: ball.cue,
          color: colorToCss(ball.color),
          x: Math.round(ball.x),
          y: Math.round(ball.y),
          pocketed: ball.pocketed
        })),
        pocketedBalls: this.pocketedLog.slice(),
        lastShotPocketed: this.pocketedThisShot.filter((entry) => !entry.cue).map((entry) => entry.label),
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
    this.scene.restart({ stake: this.stake, mode: this.mode });
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
    if (this.lockStage === "power") {
      this.currentPower += this.powerDirection * delta * 0.00115;
      if (this.currentPower >= 0.96) {
        this.currentPower = 0.96;
        this.powerDirection = -1;
      } else if (this.currentPower <= 0.18) {
        this.currentPower = 0.18;
        this.powerDirection = 1;
      }
      this.powerSyncElapsed += delta;
      if (this.powerSyncElapsed >= 90) {
        this.powerSyncElapsed = 0;
        this.syncState("Barra correndo. Aperte Tacar no ponto certo.");
      }
    }
    this.updateAimVisual();
    if (this.phase === "aim") this.updateHud();
  }
}
