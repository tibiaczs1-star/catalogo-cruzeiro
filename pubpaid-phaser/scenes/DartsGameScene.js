import { GAME_HEIGHT, GAME_WIDTH } from "../config/gameConfig.js";
import { updateGameState } from "../core/gameState.js";

const TARGET = {
  x: 930,
  y: 220,
  radius: 92
};

const SECTOR_ORDER = [20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5];

const OBJECTIVES = [
  { label: "Centro exato", sector: null, ring: "bull" },
  { label: "Bull externo", sector: null, ring: "outerBull" },
  { label: "Triplo 20", sector: 20, ring: "triple" },
  { label: "Triplo 19", sector: 19, ring: "triple" },
  { label: "Duplo 18", sector: 18, ring: "double" },
  { label: "Duplo 16", sector: 16, ring: "double" },
  { label: "Simples 14", sector: 14, ring: "singleOuter" },
  { label: "Simples 11", sector: 11, ring: "singleInner" }
];

export class DartsGameScene extends Phaser.Scene {
  constructor() {
    super("darts-game-scene");
    this.stake = 10;
    this.opponent = { name: "Rafa Mira Fina", rating: 760, style: "mira agressiva" };
    this.round = 1;
    this.maxRounds = 3;
    this.playerScore = 0;
    this.aiScore = 0;
    this.turn = "player";
    this.phase = "aim";
    this.lastPlayerThrow = null;
    this.lastAiThrow = null;
    this.buttons = [];
    this.layer = null;
    this.hud = {};
    this.aimReticle = null;
    this.objective = null;
    this.currentAngle = 0;
    this.currentPower = 0.5;
    this.angleDirection = 1;
    this.powerDirection = 1;
    this.lockStage = "angle";
    this.objectiveMarker = null;
    this.guideLine = null;
  }

  init(data = {}) {
    this.stake = Number(data.stake || 10);
    this.opponent = data.opponent || this.opponent;
    this.round = 1;
    this.playerScore = 0;
    this.aiScore = 0;
    this.turn = "player";
    this.phase = "aim";
    this.lastPlayerThrow = null;
    this.lastAiThrow = null;
    this.buttons = [];
    this.objective = this.createObjective();
    this.currentAngle = Phaser.Math.Between(0, 359);
    this.currentPower = 0.35;
    this.angleDirection = 1;
    this.powerDirection = 1;
    this.lockStage = "angle";
  }

  create() {
    this.game.events.emit("pubpaid:music-zone", "game");
    this.game.events.on("pubpaid:darts-dom-throw", this.handleDomThrow, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.game.events.off("pubpaid:darts-dom-throw", this.handleDomThrow, this);
    });
    this.layer = this.add.container(0, 0);
    this.drawBackdrop();
    this.drawHud();
    this.drawBoard();
    this.bindAim();
    this.syncState("Trave angulo e forca para acertar o alvo da parede.");
  }

  handleDomThrow() {
    if (this.phase !== "aim") return;
    if (this.lockStage === "angle") {
      this.lockStage = "power";
      this.updateHud("Angulo travado. Toque em Arremessar de novo para soltar.");
      this.syncState("Angulo travado. Agora escolha a força.");
      return;
    }
    this.playerThrowFromMeters();
  }

  drawBackdrop() {
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x02050d, 1);
    if (this.textures.exists("game-darts-room")) {
      this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, "game-darts-room")
        .setDisplaySize(GAME_WIDTH, GAME_HEIGHT)
        .setAlpha(0.98);
      this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x02050d, 0.18);
    }
    this.add.rectangle(300, 370, 470, 500, 0x05070d, 0.64)
      .setStrokeStyle(2, 0xffd06d, 0.18);
  }

  drawHud() {
    this.add.text(84, 74, "DARDOS", this.textStyle(42, "#fff6dc")).setLetterSpacing(5);
    this.hud.subtitle = this.add.text(88, 132, `Você x ${this.opponent.name} / aposta ${this.stake}`, this.textStyle(15, "#d5dff2"));
    this.hud.score = this.add.text(100, 204, "", this.textStyle(26, "#ffd06d")).setLetterSpacing(2);
    this.hud.round = this.add.text(102, 254, "", this.textStyle(16, "#d5dff2"));
    this.hud.objective = this.add.text(102, 280, "", this.textStyle(18, "#8ef0a3"));
    this.hud.status = this.add.text(102, 304, "", this.textStyle(15, "#fff6dc"))
      .setWordWrapWidth(370);
    this.hud.last = this.add.text(102, 430, "", this.textStyle(13, "#d5dff2"))
      .setWordWrapWidth(360);
    this.makeButton(208, 626, 210, 44, "VOLTAR ÀS MESAS", () => this.backToLobby(), false);
    this.makeButton(454, 626, 190, 44, "SAIR DO SALÃO", () => this.backToSalon(), false);
    this.updateHud();
  }

  drawBoard() {
    this.add.circle(TARGET.x, TARGET.y, TARGET.radius + 18, 0xffd06d, 0.03)
      .setStrokeStyle(3, 0xffd06d, 0.22);
    this.guideLine = this.add.line(0, 0, TARGET.x, TARGET.y, TARGET.x, TARGET.y - TARGET.radius, 0x8ef0a3, 0.38)
      .setLineWidth(2)
      .setDepth(4);
    this.aimReticle = this.add.container(TARGET.x, TARGET.y).setDepth(4);
    this.aimReticle.add([
      this.add.circle(0, 0, 12, 0x50efff, 0.1).setStrokeStyle(2, 0x50efff, 0.82),
      this.add.line(0, 0, -14, 0, 14, 0, 0xfff6dc, 0.75).setLineWidth(2),
      this.add.line(0, 0, 0, -14, 0, 14, 0xfff6dc, 0.75).setLineWidth(2)
    ]);
    this.objectiveMarker = this.add.circle(TARGET.x, TARGET.y, 10, 0xff4fb8, 0.08)
      .setStrokeStyle(3, 0x8ef0a3, 0.82)
      .setDepth(4);
    this.positionObjectiveMarker();
  }

  bindAim() {
    this.input.on("pointerdown", (pointer) => {
      if (this.isDomUiPointer(pointer)) return;
      if (this.phase !== "aim") return;
      if (pointer.worldX < 640) return;
      if (this.lockStage === "angle") {
        this.lockStage = "power";
        this.updateHud("Angulo travado. Clique de novo para travar a forca.");
        return;
      }
      this.playerThrowFromMeters();
    });
  }

  playerThrowFromMeters() {
    this.phase = "resolving";
    const point = this.metersToPoint(this.currentAngle, this.currentPower, 0.025);
    const throwResult = this.scoreThrow(point.x, point.y, "Você");
    this.lastPlayerThrow = throwResult;
    this.playerScore += throwResult.score;
    this.spawnDartFx(throwResult, 0x50efff);
    this.updateHud(`${throwResult.label}: +${throwResult.score}. ${this.opponent.name} responde.`);
    this.time.delayedCall(760, () => this.aiThrow());
  }

  aiThrow() {
    const accuracy = Phaser.Math.Clamp((Number(this.opponent.rating || 760) - 520) / 600, 0.2, 0.82);
    const objectivePolar = this.getObjectivePolar(this.objective);
    const angle = objectivePolar.angle + Phaser.Math.FloatBetween(-18, 18) * (1 - accuracy);
    const power = Phaser.Math.Clamp(objectivePolar.power + Phaser.Math.FloatBetween(-0.24, 0.24) * (1 - accuracy), 0.03, 0.96);
    const { x, y } = this.metersToPoint(angle, power, 0.016);
    const throwResult = this.scoreThrow(x, y, this.opponent.name);
    this.lastAiThrow = throwResult;
    this.aiScore += throwResult.score;
    this.spawnDartFx(throwResult, 0xff4fb8);
    this.updateHud(`${this.opponent.name}: ${throwResult.label}, +${throwResult.score}.`);
    this.time.delayedCall(880, () => this.finishRound());
  }

  finishRound() {
    if (this.round >= this.maxRounds) {
      this.finishMatch();
      return;
    }
    this.round += 1;
    this.phase = "aim";
    this.objective = this.createObjective();
    this.lockStage = "angle";
    this.positionObjectiveMarker();
    this.updateHud("Nova rodada. Mire e clique no alvo.");
    this.syncState("Nova rodada de dardos aberta.");
  }

  finishMatch() {
    this.phase = "finished";
    const result = this.playerScore > this.aiScore ? "win" : this.aiScore > this.playerScore ? "loss" : "draw";
    const headline = result === "win" ? "VITÓRIA" : result === "loss" ? "DERROTA" : "EMPATE";
    const color = result === "win" ? 0x8ef0a3 : result === "loss" ? 0xff4fb8 : 0x50efff;
    this.add.rectangle(850, 374, 440, 188, 0x05070d, 0.82).setStrokeStyle(4, color, 0.54).setDepth(8);
    this.add.text(850, 330, headline, this.textStyle(34, result === "win" ? "#8ef0a3" : result === "loss" ? "#ff8abf" : "#50efff"))
      .setOrigin(0.5)
      .setDepth(9)
      .setLetterSpacing(4);
    this.add.text(850, 392, `${this.playerScore} x ${this.aiScore}`, this.textStyle(24, "#fff6dc"))
      .setOrigin(0.5)
      .setDepth(9);
    this.makeButton(742, 458, 180, 38, "JOGAR DE NOVO", () => this.restartMatch(), true);
    this.makeButton(940, 458, 160, 38, "VOLTAR ÀS MESAS", () => this.backToLobby(), false);
    this.makeButton(850, 506, 160, 34, "SAIR DO SALÃO", () => this.backToSalon(), false);
    this.updateHud(`Partida fechada: ${headline.toLowerCase()} por ${this.playerScore} x ${this.aiScore}.`);
    this.syncState(`Partida fechada: ${headline}.`);
  }

  restartMatch() {
    this.scene.restart({ stake: this.stake, opponent: this.opponent });
  }

  scoreThrow(x, y, actor) {
    const distance = Phaser.Math.Distance.Between(x, y, TARGET.x, TARGET.y);
    let score = 0;
    let label = "fora";
    if (distance > TARGET.radius * 0.95) {
      score = 0;
      label = "fora";
    } else if (distance <= TARGET.radius * 0.06) {
      score = 50;
      label = "centro exato";
    } else if (distance <= TARGET.radius * 0.12) {
      score = 25;
      label = "bull externo";
    } else {
      const sector = this.getSectorValue(x, y);
      const ring = this.getRingType(distance);
      score =
        ring === "double" ? sector * 2 :
        ring === "triple" ? sector * 3 :
        sector;
      label =
        ring === "double" ? `duplo ${sector}` :
        ring === "triple" ? `triplo ${sector}` :
        `simples ${sector}`;
    }
    const angle = Phaser.Math.RadToDeg(Phaser.Math.Angle.Between(TARGET.x, TARGET.y, x, y));
    if (this.matchesObjective(x, y)) {
      score += 12;
      label += " + alvo";
    }
    return { actor, x, y, distance, score, label, angle };
  }

  spawnDartFx(throwResult, color) {
    const dart = this.add.rectangle(TARGET.x - 250, TARGET.y + 230, 34, 5, color, 0.96).setDepth(7);
    const glow = this.add.circle(throwResult.x, throwResult.y, 22, color, 0).setDepth(6);
    this.tweens.add({
      targets: dart,
      x: throwResult.x,
      y: throwResult.y,
      angle: throwResult.angle,
      duration: 260,
      ease: "Cubic.easeOut",
      onComplete: () => {
        dart.setPosition(throwResult.x, throwResult.y).setAngle(throwResult.angle);
        glow.setAlpha(0.3);
        this.tweens.add({ targets: glow, alpha: 0, scale: 2.2, duration: 500, ease: "Sine.easeOut" });
      }
    });
  }

  updateHud(message = "") {
    if (this.hud.score) {
      this.hud.score.setText(`VOCÊ ${this.playerScore}  /  IA ${this.aiScore}`);
    }
    if (this.hud.round) {
      this.hud.round.setText(`Rodada ${Math.min(this.round, this.maxRounds)} de ${this.maxRounds}`);
    }
    if (this.hud.objective) {
      this.hud.objective.setText(`ALVO: ${this.objective?.label || "-"}`);
    }
    if (this.hud.status && message) {
      this.hud.status.setText(message);
    }
    if (this.hud.last) {
      const player = this.lastPlayerThrow ? `Você: ${this.lastPlayerThrow.label} (+${this.lastPlayerThrow.score})` : "Você: aguardando";
      const ai = this.lastAiThrow ? `IA: ${this.lastAiThrow.label} (+${this.lastAiThrow.score})` : "IA: aguardando";
      this.hud.last.setText(`${player}\n${ai}`);
    }
  }

  syncState(prompt) {
    updateGameState({
      currentScene: "darts-game",
      activeGameId: "darts",
      lobbyPhase: this.phase === "finished" ? "finished" : "playing",
      objective: "Vencer a IA em 3 rodadas de Dardos",
      focus: "alvo de dardos",
      dartsGame: {
        round: this.round,
        maxRounds: this.maxRounds,
        playerScore: this.playerScore,
        aiScore: this.aiScore,
        phase: this.phase,
        objective: this.objective?.label || "",
        lastPlayerThrow: this.lastPlayerThrow,
        lastAiThrow: this.lastAiThrow
      },
      prompt
    });
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
    container.on("pointerdown", (pointer) => {
      if (this.isDomUiPointer(pointer)) return;
      onClick();
    });
    this.buttons.push(container);
    return container;
  }

  isDomUiPointer(pointer) {
    const target = pointer?.event?.target;
    return Boolean(target?.closest?.("[data-dom-game-ui]"));
  }

  backToLobby() {
    this.scene.start("game-lobby-scene", {
      gameId: "darts",
      stake: this.stake,
      opponent: this.opponent
    });
  }

  backToSalon() {
    updateGameState({
      currentScene: "interior",
      activeGameId: "",
      lobbyPhase: "hub",
      objective: "Falar com o garçom para escolher jogo",
      prompt: "Voltando ao salão. Escolha outro jogo pelo garçom."
    });
    this.scene.start("interior-scene");
  }

  clampToTarget(x, y) {
    const angle = Phaser.Math.Angle.Between(TARGET.x, TARGET.y, x, y);
    const distance = Math.min(Phaser.Math.Distance.Between(x, y, TARGET.x, TARGET.y), TARGET.radius);
    return {
      x: TARGET.x + Math.cos(angle) * distance,
      y: TARGET.y + Math.sin(angle) * distance
    };
  }

  createObjective() {
    return Phaser.Utils.Array.GetRandom(OBJECTIVES);
  }

  getObjectivePolar(objective) {
    if (!objective || objective.ring === "bull") return { angle: 0, power: 0.03 };
    if (!objective || objective.ring === "outerBull") return { angle: 0, power: 0.09 };
    const sectorIndex = SECTOR_ORDER.indexOf(objective.sector);
    const angle = sectorIndex < 0 ? 0 : sectorIndex * 18;
    const power =
      objective.ring === "triple" ? 0.49 :
      objective.ring === "double" ? 0.88 :
      objective.ring === "singleInner" ? 0.3 :
      0.66;
    return { angle, power };
  }

  positionObjectiveMarker() {
    if (!this.objectiveMarker || !this.objective) return;
    const polar = this.getObjectivePolar(this.objective);
    const point = this.metersToPoint(polar.angle, polar.power, 0);
    this.objectiveMarker.setPosition(point.x, point.y);
  }

  metersToPoint(angleDeg, powerNorm, jitter = 0) {
    const angle = Phaser.Math.DegToRad(angleDeg - 90 + Phaser.Math.FloatBetween(-jitter * 360, jitter * 360));
    const radius = Phaser.Math.Clamp(powerNorm + Phaser.Math.FloatBetween(-jitter, jitter), 0.01, 0.96) * TARGET.radius;
    return {
      x: TARGET.x + Math.cos(angle) * radius,
      y: TARGET.y + Math.sin(angle) * radius
    };
  }

  getSectorValue(x, y) {
    const angle = (Phaser.Math.RadToDeg(Phaser.Math.Angle.Between(TARGET.x, TARGET.y, x, y)) + 450) % 360;
    const sectorIndex = Math.floor(angle / 18) % 20;
    return SECTOR_ORDER[sectorIndex];
  }

  getRingType(distance) {
    const normalized = distance / TARGET.radius;
    if (normalized >= 0.82) return "double";
    if (normalized >= 0.44 && normalized <= 0.54) return "triple";
    return normalized < 0.44 ? "singleInner" : "singleOuter";
  }

  matchesObjective(x, y) {
    if (!this.objective) return false;
    if (this.objective.ring === "bull") return Phaser.Math.Distance.Between(x, y, TARGET.x, TARGET.y) <= TARGET.radius * 0.06;
    if (this.objective.ring === "outerBull") {
      const normalized = Phaser.Math.Distance.Between(x, y, TARGET.x, TARGET.y) / TARGET.radius;
      return normalized > 0.06 && normalized <= 0.12;
    }
    return this.getSectorValue(x, y) === this.objective.sector && this.getRingType(Phaser.Math.Distance.Between(x, y, TARGET.x, TARGET.y)) === this.objective.ring;
  }

  drawWedge(x, y, radius, start, end, color, alpha) {
    const graphics = this.add.graphics();
    graphics.fillStyle(color, alpha);
    graphics.beginPath();
    graphics.moveTo(x, y);
    for (let step = 0; step <= 5; step += 1) {
      const angle = Phaser.Math.Linear(start, end, step / 5);
      graphics.lineTo(x + Math.cos(angle) * radius, y + Math.sin(angle) * radius);
    }
    graphics.closePath();
    graphics.fillPath();
    return graphics;
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
    if (this.phase !== "aim") return;
    if (this.lockStage === "angle") {
      this.currentAngle += this.angleDirection * 2.1;
      if (this.currentAngle >= 359 || this.currentAngle <= 0) {
        this.angleDirection *= -1;
        this.currentAngle = Phaser.Math.Clamp(this.currentAngle, 0, 359);
      }
    } else {
      this.currentPower += this.powerDirection * 0.012;
      if (this.currentPower >= 0.96 || this.currentPower <= 0.03) {
        this.powerDirection *= -1;
        this.currentPower = Phaser.Math.Clamp(this.currentPower, 0.03, 0.96);
      }
    }
    const point = this.metersToPoint(this.currentAngle, this.currentPower, 0);
    this.aimReticle?.setPosition(point.x, point.y);
    this.guideLine?.setTo(TARGET.x, TARGET.y, point.x, point.y);
  }
}
