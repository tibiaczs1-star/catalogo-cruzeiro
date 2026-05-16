import { GAME_HEIGHT, GAME_WIDTH } from "../config/gameConfig.js";
import { gameState, updateGameState } from "../core/gameState.js";
import { fitImageToHeight } from "../core/assetRegistry.js";

const TABLE = {
  x: 512,
  y: 166,
  width: 616,
  height: 308
};

const BALL_RADIUS = 13;
const TABLE_CROP = { x: 118, y: 126, width: 228, height: 126 };
const PLAYFIELD = {
  x: TABLE.x + 48,
  y: TABLE.y + 42,
  width: TABLE.width - 96,
  height: TABLE.height - 84
};

const POCKETS = [
  { id: "top-left", x: TABLE.x + 34, y: TABLE.y + 34 },
  { id: "top-center", x: TABLE.x + TABLE.width / 2, y: TABLE.y + 22 },
  { id: "top-right", x: TABLE.x + TABLE.width - 34, y: TABLE.y + 34 },
  { id: "bottom-left", x: TABLE.x + 34, y: TABLE.y + TABLE.height - 34 },
  { id: "bottom-center", x: TABLE.x + TABLE.width / 2, y: TABLE.y + TABLE.height - 22 },
  { id: "bottom-right", x: TABLE.x + TABLE.width - 34, y: TABLE.y + TABLE.height - 34 }
];

const TABLE_DIAMONDS = [
  { x: TABLE.x + 130, y: TABLE.y + 24 },
  { x: TABLE.x + 246, y: TABLE.y + 24 },
  { x: TABLE.x + 370, y: TABLE.y + 24 },
  { x: TABLE.x + 486, y: TABLE.y + 24 },
  { x: TABLE.x + 130, y: TABLE.y + TABLE.height - 24 },
  { x: TABLE.x + 246, y: TABLE.y + TABLE.height - 24 },
  { x: TABLE.x + 370, y: TABLE.y + TABLE.height - 24 },
  { x: TABLE.x + 486, y: TABLE.y + TABLE.height - 24 }
];

const POOL_ACTOR_SPOTS = {
  player: { x: TABLE.x + 42, y: TABLE.y + TABLE.height + 116, facing: "north-east" },
  opponent: { x: TABLE.x + TABLE.width + 70, y: TABLE.y + 260, facing: "west" }
};

const SHOT_PLANS = [
  {
    label: "Bola 3 no canto alto",
    cue: { x: 646, y: 400 },
    object: { x: 800, y: 306 },
    pocket: POCKETS[2],
    aim: 0.58,
    power: 0.58,
    color: 0xff4f7d
  },
  {
    label: "Bola 7 no meio",
    cue: { x: 664, y: 330 },
    object: { x: 942, y: 374 },
    pocket: POCKETS[4],
    aim: 0.42,
    power: 0.48,
    color: 0xffd06d
  },
  {
    label: "Bola 11 na lateral",
    cue: { x: 720, y: 410 },
    object: { x: 918, y: 268 },
    pocket: POCKETS[1],
    aim: 0.66,
    power: 0.68,
    color: 0x50efff
  },
  {
    label: "Preta segura no canto",
    cue: { x: 638, y: 278 },
    object: { x: 900, y: 408 },
    pocket: POCKETS[5],
    aim: 0.53,
    power: 0.62,
    color: 0x10131a
  }
];

const AI_SHOT_PATTERN = [
  { score: 1, label: "encaixou uma defesa curta" },
  { score: 2, label: "matou a bola no canto" },
  { score: 0, label: "errou por pouco" },
  { score: 1, label: "fechou uma bola simples" }
];

export class PoolGameScene extends Phaser.Scene {
  constructor() {
    super("pool-game-scene");
    this.stake = 10;
    this.opponent = { name: "Nando Giz Azul", rating: 760, style: "controle de mesa" };
    this.round = 1;
    this.maxRounds = SHOT_PLANS.length;
    this.playerScore = 0;
    this.aiScore = 0;
    this.phase = "aim";
    this.lockStage = "aim";
    this.currentAim = 0.34;
    this.currentPower = 0.44;
    this.aimDirection = 1;
    this.powerDirection = 1;
    this.lastPlayerShot = null;
    this.lastAiShot = null;
    this.layer = null;
    this.ballLayer = null;
    this.hud = {};
    this.cueBall = null;
    this.objectBall = null;
    this.objectBallMark = null;
    this.targetRing = null;
    this.ghostLine = null;
    this.cueStick = null;
    this.cueTip = null;
    this.powerFill = null;
    this.settlement = null;
    this.poolWarnings = [];
  }

  init(data = {}) {
    this.stake = Number(data.stake || 10);
    this.opponent = data.opponent || this.opponent;
    this.round = 1;
    this.playerScore = 0;
    this.aiScore = 0;
    this.phase = "aim";
    this.lockStage = "aim";
    this.currentAim = 0.32;
    this.currentPower = 0.46;
    this.aimDirection = 1;
    this.powerDirection = 1;
    this.lastPlayerShot = null;
    this.lastAiShot = null;
    this.settlement = null;
    this.aiResolveAt = 0;
    this.roundResolveAt = 0;
    this.poolWarnings = [];
  }

  create() {
    this.game.events.emit("pubpaid:music-zone", "game");
    this.textures.get("interior-bg")?.setFilter?.(Phaser.Textures.FilterMode.NEAREST);
    this.textures.get("ppg-player-sprite")?.setFilter?.(Phaser.Textures.FilterMode.NEAREST);
    this.textures.get("ppg-waiter-hero-sprite")?.setFilter?.(Phaser.Textures.FilterMode.NEAREST);
    this.game.events.on("pubpaid:pool-dom-shot", this.handleDomShot, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.game.events.off("pubpaid:pool-dom-shot", this.handleDomShot, this);
    });
    this.layer = this.add.container(0, 0).setDepth(1);
    this.ballLayer = this.add.container(0, 0).setDepth(4);
    this.drawBackdrop();
    this.drawTable();
    this.drawHud();
    this.renderShotLayout();
    this.validatePoolLayout();
    this.syncState("Trave a mira e a força para fazer a tacada.");
  }

  drawBackdrop() {
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x02050d, 1);
    if (this.textures.exists("interior-bg")) {
      this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, "interior-bg")
        .setDisplaySize(GAME_WIDTH, GAME_HEIGHT)
        .setAlpha(0.58);
      this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x02050d, 0.48);
    }
    this.add.rectangle(284, 372, 388, 520, 0x05070d, 0.72)
      .setStrokeStyle(2, 0xffd06d, 0.18);
    this.add.rectangle(TABLE.x + TABLE.width / 2, TABLE.y + TABLE.height / 2 + 38, TABLE.width + 118, TABLE.height + 106, 0x05070d, 0.3)
      .setStrokeStyle(2, 0xc48b3a, 0.22);
    this.add.rectangle(TABLE.x + TABLE.width / 2, 88, 518, 46, 0x160b08, 0.78)
      .setStrokeStyle(3, 0xffd06d, 0.34);
    this.add.text(TABLE.x + TABLE.width / 2, 88, "MESA RESERVADA / SINUCA DEMO", this.textStyle(16, "#ffd06d"))
      .setOrigin(0.5)
      .setLetterSpacing(2);
    this.add.rectangle(TABLE.x + TABLE.width / 2, TABLE.y + 10, TABLE.width - 128, 18, 0xffd06d, 0.1)
      .setBlendMode(Phaser.BlendModes.SCREEN);
    this.add.rectangle(TABLE.x + TABLE.width / 2, TABLE.y + TABLE.height + 32, TABLE.width - 80, 12, 0x50efff, 0.08)
      .setBlendMode(Phaser.BlendModes.SCREEN);
    this.drawPoolActors();
  }

  drawTable() {
    const cx = TABLE.x + TABLE.width / 2;
    const cy = TABLE.y + TABLE.height / 2;
    this.add.ellipse(cx, cy + TABLE.height / 2 + 42, TABLE.width * 0.98, 42, 0x000000, 0.34)
      .setBlendMode(Phaser.BlendModes.MULTIPLY)
      .setDepth(1.2);
    this.add.rectangle(cx, cy, TABLE.width + 72, TABLE.height + 68, 0x24100a, 1)
      .setStrokeStyle(6, 0xffd06d, 0.2)
      .setDepth(1.5);
    this.add.rectangle(cx, cy, TABLE.width + 46, TABLE.height + 42, 0x5a2714, 1)
      .setStrokeStyle(3, 0xc48b3a, 0.5)
      .setDepth(1.6);
    this.add.rectangle(cx, cy, TABLE.width + 16, TABLE.height + 12, 0x130705, 1)
      .setDepth(1.65);
    this.add.rectangle(cx, cy, TABLE.width, TABLE.height, 0x0d5b3d, 1)
      .setStrokeStyle(4, 0x07101c, 0.86)
      .setDepth(1.7);

    if (this.textures.exists("interior-bg")) {
      this.add.image(cx, cy, "interior-bg")
        .setCrop(TABLE_CROP.x, TABLE_CROP.y, TABLE_CROP.width, TABLE_CROP.height)
        .setDisplaySize(TABLE.width - 84, TABLE.height - 64)
        .setAlpha(0.44)
        .setDepth(1.74);
      this.add.rectangle(cx, cy, TABLE.width - 84, TABLE.height - 64, 0x0a6a47, 0.48)
        .setDepth(1.76);
    }

    this.add.rectangle(cx, TABLE.y + 38, TABLE.width - 88, 22, 0x0a2f25, 0.9)
      .setDepth(1.82);
    this.add.rectangle(cx, TABLE.y + TABLE.height - 38, TABLE.width - 88, 22, 0x0a2f25, 0.9)
      .setDepth(1.82);
    this.add.rectangle(TABLE.x + 38, cy, 22, TABLE.height - 88, 0x0a2f25, 0.9)
      .setDepth(1.82);
    this.add.rectangle(TABLE.x + TABLE.width - 38, cy, 22, TABLE.height - 88, 0x0a2f25, 0.9)
      .setDepth(1.82);
    this.add.rectangle(cx, TABLE.y + 48, TABLE.width - 108, 2, 0x8ef0a3, 0.18)
      .setBlendMode(Phaser.BlendModes.SCREEN)
      .setDepth(1.9);
    this.add.rectangle(cx, TABLE.y + TABLE.height - 48, TABLE.width - 108, 2, 0xffd06d, 0.16)
      .setBlendMode(Phaser.BlendModes.SCREEN)
      .setDepth(1.9);
    TABLE_DIAMONDS.forEach((diamond) => {
      this.add.rectangle(diamond.x, diamond.y, 9, 9, 0xffe6a2, 0.9)
        .setAngle(45)
        .setStrokeStyle(1, 0x3a1a0f, 0.8)
        .setDepth(2.08);
    });
    POCKETS.forEach((pocket, index) => {
      const rim = this.add.circle(pocket.x, pocket.y, index % 3 === 1 ? 18 : 23, 0x090403, 1)
        .setStrokeStyle(5, 0xc48b3a, 0.72)
        .setDepth(2);
      const throat = this.add.circle(pocket.x, pocket.y, index % 3 === 1 ? 11 : 14, 0x000000, 0.92)
        .setDepth(2.2);
      const glow = this.add.circle(pocket.x, pocket.y, index % 3 === 1 ? 24 : 30, 0xffd06d, 0.05)
        .setBlendMode(Phaser.BlendModes.SCREEN)
        .setDepth(1.85);
      this.tweens.add({
        targets: glow,
        alpha: { from: 0.03, to: 0.12 },
        duration: 1600 + index * 90,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut"
      });
      this.layer.add([rim, throat, glow]);
    });
    this.ghostLine = this.add.line(0, 0, 0, 0, 0, 0, 0xfff6dc, 0.35)
      .setLineWidth(2)
      .setDepth(3);
    this.targetRing = this.add.circle(0, 0, 18, 0x8ef0a3, 0.08)
      .setStrokeStyle(3, 0x8ef0a3, 0.76)
      .setDepth(4);
    this.cueStick = this.add.rectangle(0, 0, 152, 7, 0xc58a42, 0.96)
      .setStrokeStyle(1, 0x4b2110, 0.9)
      .setDepth(4.2);
    this.cueTip = this.add.rectangle(0, 0, 22, 5, 0xf6dfb0, 1)
      .setStrokeStyle(1, 0x4b2110, 0.8)
      .setDepth(4.3);
  }

  drawPoolActors() {
    const playerKey = gameState.selectedCharacter?.spriteKey || "ppg-player-sprite";
    this.drawActor(playerKey, POOL_ACTOR_SPOTS.player.x, POOL_ACTOR_SPOTS.player.y, 124, 1, "VOCÊ");
    this.drawActor("ppg-guest-a-sprite", POOL_ACTOR_SPOTS.opponent.x, POOL_ACTOR_SPOTS.opponent.y, 116, -1, "NANDO", 0xffdba0);
  }

  drawActor(textureKey, x, y, displayHeight, flipX, label, tint = 0xffffff) {
    this.add.ellipse(x, y + 28, 58, 18, 0x000000, 0.3)
      .setBlendMode(Phaser.BlendModes.MULTIPLY)
      .setDepth(2.55);
    if (this.textures.exists(textureKey)) {
      const sprite = this.add.image(x, y, textureKey)
        .setOrigin(0.5, 1)
        .setFlipX(flipX < 0)
        .setTint(tint)
        .setDepth(2.65);
      fitImageToHeight(sprite, displayHeight);
    }
    this.add.text(x, y + 46, label, {
      fontFamily: "Courier New, Lucida Console, monospace",
      fontSize: "11px",
      fontStyle: "bold",
      color: "#ffd06d",
      stroke: "#05070d",
      strokeThickness: 3
    }).setOrigin(0.5).setDepth(3);
  }

  drawHud() {
    this.add.text(84, 74, "SINUCA", this.textStyle(42, "#fff6dc")).setLetterSpacing(5);
    this.hud.subtitle = this.add.text(88, 132, `Você x ${this.opponent.name} / entrada ${this.stake}`, this.textStyle(15, "#d5dff2"));
    this.hud.score = this.add.text(100, 204, "", this.textStyle(24, "#ffd06d")).setLetterSpacing(1);
    this.hud.round = this.add.text(102, 252, "", this.textStyle(16, "#d5dff2"));
    this.hud.target = this.add.text(102, 282, "", this.textStyle(17, "#8ef0a3"));
    this.hud.status = this.add.text(102, 314, "", this.textStyle(15, "#fff6dc"))
      .setWordWrapWidth(350);
    this.hud.last = this.add.text(102, 430, "", this.textStyle(13, "#d5dff2"))
      .setWordWrapWidth(350);
    this.add.rectangle(102, 528, 260, 18, 0x07101c, 0.96)
      .setOrigin(0, 0.5)
      .setStrokeStyle(2, 0x50efff, 0.22);
    this.powerFill = this.add.rectangle(106, 528, 1, 10, 0xffd06d, 0.9)
      .setOrigin(0, 0.5);
    this.add.text(102, 552, "Tacada: clique uma vez para mira, outra para força.", this.textStyle(11, "#9fb0ca"))
      .setWordWrapWidth(340);
    this.makeButton(744, 626, 210, 44, "VOLTAR LOBBY", () => this.backToLobby(), false);
    this.makeButton(982, 626, 190, 44, "SAIR SALAO", () => this.backToSalon(), false);
    this.updateHud("Mira em movimento. Use o botão Tacada no painel.");
  }

  renderShotLayout() {
    this.ballLayer.removeAll(true);
    const plan = this.getPlan();
    this.cueBall = this.createBall(plan.cue.x, plan.cue.y, 0xf4ead8, "");
    this.objectBall = this.createBall(
      plan.object.x,
      plan.object.y,
      plan.color,
      String(this.round === this.maxRounds ? 8 : this.round * 2 + 1)
    );
    this.objectBallMark = null;
    this.ballLayer.add([this.cueBall, this.objectBall]);
    this.positionAimVisual();
  }

  createBall(x, y, color, label) {
    const container = this.add.container(x, y).setDepth(5);
    const shadow = this.add.ellipse(3, 7, BALL_RADIUS * 2.1, 7, 0x000000, 0.3)
      .setBlendMode(Phaser.BlendModes.MULTIPLY);
    const core = this.add.circle(0, 0, BALL_RADIUS, color, 1)
      .setStrokeStyle(3, 0x06101a, 0.88);
    const shine = this.add.circle(-4, -5, 4, 0xffffff, color === 0x10131a ? 0.18 : 0.42);
    const band = this.add.rectangle(0, 0, BALL_RADIUS * 1.35, 6, 0xfff6dc, label ? 0.84 : 0)
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
      this.updateHud("Mira travada. Toque em Tacada de novo para soltar a força.");
      this.syncState("Mira travada. Agora escolha a força.");
      return;
    }
    this.resolvePlayerShot();
  }

  resolvePlayerShot() {
    this.phase = "resolving";
    this.aiResolveAt = this.time.now + 840;
    this.roundResolveAt = 0;
    const plan = this.getPlan();
    const aimError = Math.abs(this.currentAim - plan.aim);
    const powerError = Math.abs(this.currentPower - plan.power);
    const quality = Math.max(0, 1 - aimError * 2.6 - powerError * 1.4);
    const score = quality >= 0.74 ? 2 : quality >= 0.48 ? 1 : 0;
    const label = score === 2 ? "encaçapou limpa" : score === 1 ? "deixou bola segura" : "raspou a caçapa";
    this.lastPlayerShot = {
      round: this.round,
      label,
      score,
      quality: Number(quality.toFixed(2)),
      aim: Number(this.currentAim.toFixed(2)),
      power: Number(this.currentPower.toFixed(2))
    };
    this.playerScore += score;
    this.animatePlayerShot(plan, score);
    this.updateHud(`Você ${label}: +${score}. ${this.opponent.name} responde.`);
    this.syncState(`Tacada feita: ${label}.`);
  }

  animatePlayerShot(plan, score) {
    const objectTarget = score > 0 ? plan.pocket : {
      x: plan.object.x + (plan.pocket.x - plan.object.x) * 0.38,
      y: plan.object.y + (plan.pocket.y - plan.object.y) * 0.38
    };
    this.tweens.add({
      targets: this.cueBall,
      x: plan.object.x - 26,
      y: plan.object.y + 12,
      duration: 260,
      ease: "Cubic.easeOut"
    });
    this.tweens.add({
      targets: this.objectBall,
      x: objectTarget.x,
      y: objectTarget.y,
      scale: score > 0 ? 0.44 : 1,
      alpha: score > 0 ? 0.24 : 1,
      duration: score > 0 ? 620 : 420,
      ease: "Cubic.easeInOut"
    });
    this.spawnPixelBurst(plan.object.x, plan.object.y, score > 0 ? 0x8ef0a3 : 0xffd06d);
    this.cameras.main.shake(80, 0.0018);
  }

  resolveAiShot() {
    const pattern = AI_SHOT_PATTERN[(this.round + Number(this.opponent.rating || 0)) % AI_SHOT_PATTERN.length];
    this.lastAiShot = { round: this.round, ...pattern };
    this.aiScore += pattern.score;
    this.spawnPixelBurst(TABLE.x + TABLE.width - 140, TABLE.y + 120 + this.round * 38, pattern.score ? 0xff4fb8 : 0x50efff);
    this.updateHud(`${this.opponent.name} ${pattern.label}: +${pattern.score}.`);
    this.syncState(`${this.opponent.name} respondeu a rodada.`);
    this.roundResolveAt = this.time.now + 760;
  }

  finishRound() {
    this.aiResolveAt = 0;
    this.roundResolveAt = 0;
    if (this.round >= this.maxRounds) {
      this.finishMatch();
      return;
    }
    this.round += 1;
    this.phase = "aim";
    this.lockStage = "aim";
    this.currentAim = 0.24 + this.round * 0.08;
    this.currentPower = 0.34 + this.round * 0.05;
    this.renderShotLayout();
    this.updateHud("Nova bola marcada. Trave a mira.");
    this.syncState("Nova rodada de Sinuca aberta.");
  }

  finishMatch() {
    if (this.phase === "finished") return;
    this.aiResolveAt = 0;
    this.roundResolveAt = 0;
    this.phase = "finished";
    const result = this.playerScore > this.aiScore ? "win" : this.aiScore > this.playerScore ? "loss" : "draw";
    const headline = result === "win" ? "VITÓRIA" : result === "loss" ? "DERROTA" : "EMPATE";
    const color = result === "win" ? 0x8ef0a3 : result === "loss" ? 0xff4fb8 : 0x50efff;
    this.add.rectangle(TABLE.x + TABLE.width / 2, TABLE.y + TABLE.height / 2, 440, 188, 0x05070d, 0.88)
      .setStrokeStyle(5, color, 0.62)
      .setDepth(9);
    this.add.text(TABLE.x + TABLE.width / 2, TABLE.y + TABLE.height / 2 - 48, headline, this.textStyle(36, result === "win" ? "#8ef0a3" : result === "loss" ? "#ff8abf" : "#50efff"))
      .setOrigin(0.5)
      .setDepth(10)
      .setLetterSpacing(4);
    this.add.text(TABLE.x + TABLE.width / 2, TABLE.y + TABLE.height / 2 + 8, `${this.playerScore} x ${this.aiScore}`, this.textStyle(17, "#fff6dc"))
      .setOrigin(0.5)
      .setDepth(10)
      .setWordWrapWidth(380);
    this.makeButton(TABLE.x + TABLE.width / 2 - 110, TABLE.y + TABLE.height / 2 + 82, 190, 40, "JOGAR DE NOVO", () => this.restartMatch(), true);
    this.makeButton(TABLE.x + TABLE.width / 2 + 110, TABLE.y + TABLE.height / 2 + 82, 170, 40, "VOLTAR LOBBY", () => this.backToLobby(), false);
    this.updateHud(`Partida fechada: ${headline.toLowerCase()} por ${this.playerScore} x ${this.aiScore}.`);
    this.syncState(`Partida fechada: ${headline}.`);
    this.game.events.emit("pubpaid:pool-result", {
      result,
      settlement: this.settlement,
      body: `${headline}: ${this.playerScore} x ${this.aiScore}.`
    });
  }

  getPlan() {
    return SHOT_PLANS[this.round - 1] || SHOT_PLANS[0];
  }

  positionAimVisual() {
    const plan = this.getPlan();
    const aimX = plan.object.x + (this.currentAim - plan.aim) * 170;
    const aimY = plan.object.y + Math.sin(this.currentAim * Math.PI * 2) * 22;
    this.targetRing?.setPosition(aimX, aimY);
    this.ghostLine?.setTo(plan.cue.x, plan.cue.y, aimX, aimY);
    const angle = Phaser.Math.Angle.Between(plan.cue.x, plan.cue.y, aimX, aimY);
    this.cueStick?.setPosition(
      plan.cue.x - Math.cos(angle) * 92,
      plan.cue.y - Math.sin(angle) * 92
    ).setRotation(angle);
    this.cueTip?.setPosition(
      plan.cue.x - Math.cos(angle) * 18,
      plan.cue.y - Math.sin(angle) * 18
    ).setRotation(angle);
    if (this.powerFill) {
      this.powerFill.width = 252 * this.currentPower;
    }
  }

  validatePoolLayout() {
    const warnings = [];
    const tableRatio = Number((TABLE.width / TABLE.height).toFixed(2));
    if (Math.abs(tableRatio - 2) > 0.08) warnings.push(`pool-table-ratio:${tableRatio}`);
    SHOT_PLANS.forEach((plan, index) => {
      [
        ["cue", plan.cue],
        ["object", plan.object]
      ].forEach(([kind, point]) => {
        const insideX = point.x >= PLAYFIELD.x + BALL_RADIUS && point.x <= PLAYFIELD.x + PLAYFIELD.width - BALL_RADIUS;
        const insideY = point.y >= PLAYFIELD.y + BALL_RADIUS && point.y <= PLAYFIELD.y + PLAYFIELD.height - BALL_RADIUS;
        if (!insideX || !insideY) warnings.push(`round-${index + 1}-${kind}-outside-playfield`);
      });
      if (!plan.pocket?.id) warnings.push(`round-${index + 1}-pocket-missing-id`);
    });
    Object.entries(POOL_ACTOR_SPOTS).forEach(([id, spot]) => {
      const insideTable = spot.x > TABLE.x - 38
        && spot.x < TABLE.x + TABLE.width + 38
        && spot.y > TABLE.y - 38
        && spot.y < TABLE.y + TABLE.height + 38;
      if (insideTable) warnings.push(`${id}-inside-table-zone`);
    });
    this.poolWarnings = warnings;
  }

  getPoolMapSnapshot() {
    return {
      table: { ...TABLE, ratio: Number((TABLE.width / TABLE.height).toFixed(2)) },
      playfield: { ...PLAYFIELD },
      ballRadius: BALL_RADIUS,
      pockets: POCKETS.map((pocket) => ({ ...pocket })),
      actorSpots: {
        player: { ...POOL_ACTOR_SPOTS.player },
        opponent: { ...POOL_ACTOR_SPOTS.opponent }
      },
      blockedZones: [
        { id: "pool-table-body", x: TABLE.x - 36, y: TABLE.y - 34, width: TABLE.width + 72, height: TABLE.height + 68 },
        { id: "left-hud-safe-zone", x: 66, y: 52, width: 398, height: 552 }
      ],
      lightingZones: [
        { id: "table-top-warm", x: TABLE.x + 64, y: TABLE.y - 8, width: TABLE.width - 128, height: 36 },
        { id: "felt-cool-rim", x: TABLE.x + 44, y: TABLE.y + TABLE.height + 22, width: TABLE.width - 88, height: 22 }
      ]
    };
  }

  spawnPixelBurst(x, y, color) {
    for (let index = 0; index < 10; index += 1) {
      const pixel = this.add.rectangle(
        x + (index % 5 - 2) * 4,
        y + Math.floor(index / 5) * 4,
        4,
        4,
        index % 3 ? color : 0xffd06d,
        0.86
      ).setDepth(8).setBlendMode(Phaser.BlendModes.SCREEN);
      this.tweens.add({
        targets: pixel,
        x: pixel.x + (index % 2 ? 28 : -28),
        y: pixel.y - 34 - index * 2,
        alpha: 0,
        duration: 520 + index * 20,
        ease: "Sine.easeOut",
        onComplete: () => pixel.destroy()
      });
    }
  }

  updateHud(message = "") {
    this.hud.score?.setText(`VOCÊ ${this.playerScore}  /  IA ${this.aiScore}`);
    this.hud.round?.setText(`Rodada ${Math.min(this.round, this.maxRounds)} de ${this.maxRounds}`);
    this.hud.target?.setText(this.getPlan()?.label || "Bola marcada");
    if (message) this.hud.status?.setText(message);
    const player = this.lastPlayerShot ? `Você: ${this.lastPlayerShot.label} (+${this.lastPlayerShot.score})` : "Você: aguardando";
    const ai = this.lastAiShot ? `IA: ${this.lastAiShot.label} (+${this.lastAiShot.score})` : "IA: aguardando";
    this.hud.last?.setText(`${player}\n${ai}`);
    this.positionAimVisual();
  }

  syncState(prompt) {
    updateGameState({
      currentScene: "pool-game",
      activeGameId: "pool",
      dartsGame: null,
      lobbyPhase: this.phase === "finished" ? "finished" : "playing",
      objective: "Vencer a mesa de Sinuca",
      focus: "mesa de sinuca",
      poolGame: {
        round: this.round,
        maxRounds: this.maxRounds,
        playerScore: this.playerScore,
        aiScore: this.aiScore,
        phase: this.phase,
        lockStage: this.lockStage,
        target: this.getPlan()?.label || "",
        lastPlayerShot: this.lastPlayerShot,
        lastAiShot: this.lastAiShot,
        settlement: this.settlement,
        balls: {
          cue: this.getPlan()?.cue,
          object: this.getPlan()?.object,
          radius: BALL_RADIUS
        },
        poolMap: this.getPoolMapSnapshot(),
        poolWarnings: this.poolWarnings
      },
      prompt
    });
  }

  restartMatch() {
    this.scene.restart({ stake: this.stake, opponent: this.opponent });
  }

  backToLobby() {
    this.scene.start("game-lobby-scene", {
      gameId: "pool",
      stake: this.stake,
      opponent: this.opponent
    });
  }

  backToSalon() {
    updateGameState({
      currentScene: "interior",
      activeGameId: "",
      poolGame: null,
      lobbyPhase: "hub",
      objective: "Falar com o garçom para escolher jogo",
      prompt: "Voltando ao salão. Escolha outro jogo pelo garçom."
    });
    this.scene.start("interior-scene");
  }

  makeButton(x, y, width, height, label, onClick, primary = false) {
    const container = this.add.container(x, y).setDepth(10);
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

  textStyle(size, color) {
    return {
      fontFamily: "Georgia, Times New Roman, serif",
      fontSize: `${size}px`,
      fontStyle: "bold",
      color,
      stroke: "#05070d",
      strokeThickness: 3
    };
  }

  update() {
    if (this.phase === "resolving") {
      if (this.aiResolveAt && this.time.now >= this.aiResolveAt) {
        this.aiResolveAt = 0;
        this.resolveAiShot();
        return;
      }
      if (this.roundResolveAt && this.time.now >= this.roundResolveAt) {
        this.roundResolveAt = 0;
        this.finishRound();
      }
      return;
    }
    if (this.phase !== "aim") return;
    if (this.lockStage === "aim") {
      this.currentAim += this.aimDirection * 0.0065;
      if (this.currentAim >= 0.88 || this.currentAim <= 0.16) {
        this.aimDirection *= -1;
        this.currentAim = Phaser.Math.Clamp(this.currentAim, 0.16, 0.88);
      }
    } else {
      this.currentPower += this.powerDirection * 0.009;
      if (this.currentPower >= 0.92 || this.currentPower <= 0.2) {
        this.powerDirection *= -1;
        this.currentPower = Phaser.Math.Clamp(this.currentPower, 0.2, 0.92);
      }
    }
    this.positionAimVisual();
  }
}
