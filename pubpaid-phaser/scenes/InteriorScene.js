import { GAME_HEIGHT, GAME_WIDTH, INTERIOR_BOUNDS } from "../config/gameConfig.js";
import { INTERIOR_SCENE_MAP, isPointWalkable } from "../config/sceneMap.js";
import { addBitmapWalkCycle, addIdleSpriteActor, ensureCoreSprites, TEXTURE_KEYS, updateContainerWalkPose } from "../core/spriteFactory.js";
import { closePanel, openPanel } from "../ui/panelActions.js";
import { gameState, updateGameState } from "../core/gameState.js";

const INTERIOR_PANELS = {
  waiter: {
    kicker: "garçom",
    title: "Garçom dos jogos",
    body: "Ele abre o lobby próprio. Na próxima tela você escolhe o jogo, acha oponente, define aposta e confirma a partida.",
    chips: ["hub", "lobby separado", "garçom"],
    actions: [{ id: "close-panel", label: "Fechar" }]
  },
  stage: {
    kicker: "palco",
    title: "Cantora ao vivo",
    body: "O palco agora é um nó de evento do salão. Ele pode ativar clima de noite, buff visual e chamadas para mesas ou torneios.",
    chips: ["evento", "buff visual", "crowd mood"],
    actions: [{ id: "toggle-stage-event", label: "Ativar evento", primary: true }]
  }
};

export class InteriorScene extends Phaser.Scene {
  constructor() {
    super("interior-scene");
    this.player = null;
    this.targetPoint = null;
    this.targetMarker = null;
    this.cursors = null;
    this.interactionCooldown = 0;
    this.stageGlow = null;
    this.isTransitioning = false;
    this.transitionVeil = null;
    this.transitionLabel = null;
    this.exitPulse = null;
    this.zones = [];
    this.zoneHotspots = [];
    this.activeZone = null;
    this.stageBeams = [];
    this.floorReflections = [];
    this.floorReflectionLayer = null;
    this.ambientBands = [];
    this.stageOrb = null;
    this.loungeMist = null;
    this.actors = [];
    this.neonSigns = [];
    this.machineGlows = [];
    this.sparkles = [];
    this.sparkleLayer = null;
    this.barGlow = null;
    this.jukeboxGlow = null;
    this.scanLight = null;
    this.stageLaserLayer = null;
    this.pvpDecor = {};
    this.pvpSyncAt = 0;
    this.dartsStage = null;
    this.checkersStage = null;
    this.resultFxLayer = null;
    this.resultParticles = [];
    this.resultFxState = {
      darts: { signature: "" },
      checkers: { signature: "" }
    };
    this.resultFloatTexts = [];
    this.actionFxState = {
      darts: { signature: "" },
      checkers: { signature: "" }
    };
  }

  create() {
    ensureCoreSprites(this);
    this.game.events.emit("pubpaid:music-zone", "salon");
    this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, "interior-bg").setDisplaySize(GAME_WIDTH, GAME_HEIGHT);
    this.buildAmbientFx();

    this.actors = [];

    this.player = this.buildPlayer(640, 608);
    this.targetMarker = this.add.circle(this.player.x, this.player.y, 10, 0x50efff, 0.25).setVisible(false);
    this.transitionVeil = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x04060d, 0)
      .setDepth(20)
      .setScrollFactor(0);
    this.transitionLabel = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 14, "VOLTANDO PARA A RUA", {
      fontFamily: "Courier New, Lucida Console, monospace",
      fontSize: "20px",
      fontStyle: "bold",
      color: "#dffff0",
      stroke: "#05070d",
      strokeThickness: 5
    }).setOrigin(0.5).setLetterSpacing(4).setDepth(21).setScrollFactor(0).setAlpha(0);
    this.exitPulse = this.add.ellipse(640, 588, 170, 38, 0x8ef0a3, 0.04)
      .setBlendMode(Phaser.BlendModes.SCREEN)
      .setDepth(1.4);

    this.zones = [
      { id: "waiter", x: 306, y: 438, radius: 72, color: 0xffd06d, label: "GARÇOM", objective: "Falar com o garçom", mapRef: "interior_waiter_hub" },
      { id: "stage", x: 1060, y: 242, radius: 84, color: 0xff4fb8, label: "PALCO", objective: "Ativar o palco", mapRef: "interior_stage_trigger" },
      { id: "exit", x: 640, y: 580, radius: 96, color: 0x8ef0a3, label: "SAIDA", objective: "Voltar para a rua", mapRef: "interior_exit_to_street" }
    ];
    this.zoneHotspots = this.zones.map((zone) => this.buildZoneHotspot(zone));

    this.cameras.main.setBounds(0, 0, GAME_WIDTH, GAME_HEIGHT);
    this.cursors = this.input.keyboard.createCursorKeys();
    this.input.keyboard.on("keydown-W", () => this.nudgePlayer(0, -40));
    this.input.keyboard.on("keydown-A", () => this.nudgePlayer(-40, 0));
    this.input.keyboard.on("keydown-S", () => this.nudgePlayer(0, 40));
    this.input.keyboard.on("keydown-D", () => this.nudgePlayer(40, 0));
    this.input.keyboard.on("keydown-ENTER", () => this.tryInteraction());

    this.input.on("pointerdown", (pointer) => {
      if (this.isTransitioning) return;
      const worldPoint = pointer.positionToCamera(this.cameras.main);
      const clickedZone = this.getZoneAt(worldPoint.x, worldPoint.y);
      if (clickedZone) {
        this.moveToZone(clickedZone);
        return;
      }
      this.targetPoint = new Phaser.Math.Vector2(
        Phaser.Math.Clamp(worldPoint.x, INTERIOR_BOUNDS.minX, INTERIOR_BOUNDS.maxX),
        Phaser.Math.Clamp(worldPoint.y, INTERIOR_BOUNDS.minY, INTERIOR_BOUNDS.maxY)
      );
      this.targetMarker.setPosition(this.targetPoint.x, this.targetPoint.y).setVisible(true);
      updateGameState({
        currentScene: "interior",
        focus: "salão",
        objective: "Explorar pontos ativos do salão",
                prompt: "Destino marcado. Aproxime-se do garçom e aperte Enter para abrir o lobby."
      });
    });

    updateGameState({
      currentScene: "interior",
      focus: "salão",
      objective: "Falar com o garçom para escolher jogo",
      prompt: `Mapa interno carregado: balcao, arcade, palco e saida identificados. Interacoes: ${INTERIOR_SCENE_MAP.interactionPoints.length} pontos ativos.`
    });
  }

  buildAmbientFx() {
    this.add.rectangle(640, 164, 1220, 230, 0x2c0f28, 0.12)
      .setBlendMode(Phaser.BlendModes.MULTIPLY)
      .setDepth(0.92);

    this.stageGlow = this.add.rectangle(1046, 226, 240, 190, 0xff4fb8, 0.18)
      .setBlendMode(Phaser.BlendModes.SCREEN)
      .setDepth(1.08);
    const stageAura = this.add.ellipse(1034, 222, 340, 230, 0x50efff, 0.1)
      .setBlendMode(Phaser.BlendModes.SCREEN)
      .setDepth(1.05);
    this.stageOrb = this.add.ellipse(1038, 194, 128, 128, 0xffd06d, 0.1)
      .setBlendMode(Phaser.BlendModes.SCREEN)
      .setDepth(1.09);
    this.loungeMist = this.add.rectangle(610, 512, 820, 170, 0x6f3eff, 0.03)
      .setBlendMode(Phaser.BlendModes.SCREEN)
      .setDepth(1.02);

    this.ambientBands = [
      this.add.rectangle(280, 604, 290, 18, 0xffd06d, 0.08).setBlendMode(Phaser.BlendModes.SCREEN).setDepth(1.03),
      this.add.rectangle(644, 610, 248, 14, 0x50efff, 0.08).setBlendMode(Phaser.BlendModes.SCREEN).setDepth(1.03),
      this.add.rectangle(892, 598, 282, 16, 0xff4fb8, 0.08).setBlendMode(Phaser.BlendModes.SCREEN).setDepth(1.03)
    ];

    this.stageBeams = [
      this.add.triangle(962, 322, 0, 0, 28, -132, 96, 40, 0xff4fb8, 0.18).setBlendMode(Phaser.BlendModes.SCREEN).setDepth(1.01),
      this.add.triangle(1064, 328, 0, 0, -24, -142, -92, 32, 0x50efff, 0.18).setBlendMode(Phaser.BlendModes.SCREEN).setDepth(1.01),
      this.add.triangle(1118, 334, 0, 0, -18, -124, -86, 26, 0xffd06d, 0.15).setBlendMode(Phaser.BlendModes.SCREEN).setDepth(1.01)
    ];
    this.stageLaserLayer = this.add.graphics()
      .setBlendMode(Phaser.BlendModes.SCREEN)
      .setDepth(1.12);

    this.floorReflections = [
      { x: 288, y: 606, width: 126, height: 10, color: 0xffd06d, alpha: 0.14, speed: 0.017 },
      { x: 520, y: 620, width: 160, height: 12, color: 0xff4fb8, alpha: 0.12, speed: 0.015 },
      { x: 668, y: 612, width: 138, height: 10, color: 0x50efff, alpha: 0.14, speed: 0.019 },
      { x: 874, y: 604, width: 168, height: 12, color: 0xffd06d, alpha: 0.12, speed: 0.014 },
      { x: 1048, y: 560, width: 118, height: 9, color: 0xff4fb8, alpha: 0.18, speed: 0.021 },
      { x: 180, y: 330, width: 150, height: 8, color: 0xffd06d, alpha: 0.16, speed: 0.018 },
      { x: 1112, y: 626, width: 116, height: 10, color: 0xffd06d, alpha: 0.18, speed: 0.017 }
    ];
    this.floorReflectionLayer = this.add.graphics().setDepth(1.04);
    this.sparkleLayer = this.add.graphics()
      .setBlendMode(Phaser.BlendModes.SCREEN)
      .setDepth(2.05);
    this.resultFxLayer = this.add.graphics()
      .setBlendMode(Phaser.BlendModes.SCREEN)
      .setDepth(2.08);
    this.barGlow = this.add.rectangle(390, 170, 500, 170, 0xffd06d, 0.11)
      .setBlendMode(Phaser.BlendModes.SCREEN)
      .setDepth(1.06);
    this.jukeboxGlow = this.add.ellipse(1180, 585, 190, 190, 0xffd06d, 0.16)
      .setBlendMode(Phaser.BlendModes.SCREEN)
      .setDepth(1.08);
    this.scanLight = this.add.rectangle(640, 386, 1100, 24, 0x50efff, 0.065)
      .setBlendMode(Phaser.BlendModes.SCREEN)
      .setDepth(2.02);

    this.neonSigns = [
      this.add.ellipse(116, 62, 120, 34, 0x50efff, 0.3).setBlendMode(Phaser.BlendModes.SCREEN).setDepth(1.1),
      this.add.ellipse(176, 62, 126, 34, 0xff4fb8, 0.26).setBlendMode(Phaser.BlendModes.SCREEN).setDepth(1.1),
      this.add.ellipse(620, 104, 126, 42, 0xffd06d, 0.2).setBlendMode(Phaser.BlendModes.SCREEN).setDepth(1.1),
      this.add.ellipse(1044, 150, 220, 82, 0xff4fb8, 0.16).setBlendMode(Phaser.BlendModes.SCREEN).setDepth(1.1)
    ];
    this.machineGlows = [700, 780, 858, 936, 1018, 1096, 1168].map((x, index) => (
      this.add.rectangle(x, index < 4 ? 92 : 294, 70, 70, index % 2 ? 0xff4fb8 : 0x50efff, 0.16)
        .setBlendMode(Phaser.BlendModes.SCREEN)
        .setDepth(1.09)
    ));
    for (let index = 0; index < 70; index += 1) {
      this.sparkles.push({
        x: Phaser.Math.Between(70, GAME_WIDTH - 70),
        y: Phaser.Math.Between(70, 620),
        size: Phaser.Math.FloatBetween(1.1, 2.7),
        alpha: Phaser.Math.FloatBetween(0.08, 0.34),
        speed: Phaser.Math.FloatBetween(0.18, 0.58),
        phase: Phaser.Math.FloatBetween(0, Math.PI * 2),
        color: [0xffd06d, 0xff4fb8, 0x50efff, 0x8ef0a3][index % 4]
      });
    }

    this.tweens.add({
      targets: [this.stageGlow, stageAura, this.stageOrb],
      alpha: { from: 0.1, to: 0.3 },
      duration: 1800,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut"
    });
    this.tweens.add({
      targets: this.loungeMist,
      alpha: { from: 0.02, to: 0.07 },
      duration: 2200,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut"
    });
    this.tweens.add({
      targets: this.stageBeams,
      alpha: { from: 0.08, to: 0.24 },
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
      stagger: 140
    });
    this.tweens.add({
      targets: this.ambientBands,
      alpha: { from: 0.03, to: 0.14 },
      duration: 1600,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
      stagger: 120
    });
    this.tweens.add({
      targets: this.neonSigns,
      alpha: { from: 0.14, to: 0.38 },
      scaleX: { from: 0.92, to: 1.08 },
      duration: 1300,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
      stagger: 90
    });
    this.tweens.add({
      targets: this.machineGlows,
      alpha: { from: 0.08, to: 0.28 },
      duration: 780,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
      stagger: 65
    });
    this.tweens.add({
      targets: [this.barGlow, this.jukeboxGlow],
      alpha: { from: 0.08, to: 0.28 },
      duration: 1550,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut"
    });
    this.tweens.add({
      targets: this.scanLight,
      y: { from: 150, to: 610 },
      alpha: { from: 0.035, to: 0.12 },
      duration: 3600,
      repeat: -1,
      ease: "Sine.easeInOut"
    });
  }

  buildPvpDecor() {
    const createSign = (x, y, label, color) => {
      const glow = this.add.ellipse(x, y, 126, 28, color, 0.12)
        .setBlendMode(Phaser.BlendModes.SCREEN)
        .setDepth(1.16);
      const plate = this.add.rectangle(x, y, 112, 20, 0x0a0f1a, 0.92)
        .setStrokeStyle(2, color, 0.75)
        .setDepth(1.17);
      const text = this.add.text(x, y, label, {
        fontFamily: "Courier New, Lucida Console, monospace",
        fontSize: "10px",
        fontStyle: "bold",
        color: "#fff6dc",
        stroke: "#05070d",
        strokeThickness: 3
      }).setOrigin(0.5).setLetterSpacing(2).setDepth(1.18);
      return { glow, plate, text, baseColor: color, baseLabel: label };
    };

    const createLamp = (x, y, color) => {
      const light = this.add.ellipse(x, y, 88, 18, color, 0.12)
        .setBlendMode(Phaser.BlendModes.SCREEN)
        .setDepth(1.14);
      const dot = this.add.rectangle(x, y, 10, 10, color, 0.95)
        .setDepth(1.19)
        .setStrokeStyle(2, 0x07101c, 0.7);
      return { light, dot, baseColor: color };
    };

    this.pvpDecor.darts = {
      sign: createSign(860, 404, "DARDOS", 0xffd06d),
      lamp: createLamp(860, 438, 0xffd06d),
      shards: [
        this.add.rectangle(818, 450, 26, 4, 0x50efff, 0.22).setDepth(1.15).setRotation(-0.28),
        this.add.rectangle(900, 450, 22, 4, 0xff4fb8, 0.22).setDepth(1.15).setRotation(0.24)
      ],
      target: this.createDartsStage(860, 516)
    };
    this.pvpDecor.checkers = {
      sign: createSign(318, 414, "DAMA", 0x50efff),
      lamp: createLamp(318, 448, 0x50efff),
      shards: [
        this.add.rectangle(278, 460, 26, 4, 0xffd06d, 0.22).setDepth(1.15).setRotation(-0.24),
        this.add.rectangle(356, 460, 22, 4, 0x8ef0a3, 0.22).setDepth(1.15).setRotation(0.2)
      ],
      board: this.createCheckersStage(318, 520)
    };
  }

  createDartsStage(x, y) {
    const base = this.add.container(x, y).setDepth(1.2);
    const shadow = this.add.ellipse(0, 70, 168, 26, 0x000000, 0.2)
      .setBlendMode(Phaser.BlendModes.MULTIPLY);
    const floorPad = this.add.rectangle(0, 78, 196, 34, 0x0b1220, 0.92)
      .setStrokeStyle(2, 0xffd06d, 0.16);
    const floorStripeA = this.add.rectangle(-46, 78, 56, 4, 0x50efff, 0.16)
      .setBlendMode(Phaser.BlendModes.SCREEN);
    const floorStripeB = this.add.rectangle(46, 78, 56, 4, 0xff4fb8, 0.16)
      .setBlendMode(Phaser.BlendModes.SCREEN);
    const backPanel = this.add.rectangle(0, -4, 178, 190, 0x070a14, 0.72)
      .setStrokeStyle(2, 0x50efff, 0.1);
    const leftColumn = this.add.rectangle(-86, 6, 12, 162, 0x23111f, 1)
      .setStrokeStyle(2, 0xffd06d, 0.2);
    const rightColumn = this.add.rectangle(86, 6, 12, 162, 0x23111f, 1)
      .setStrokeStyle(2, 0xffd06d, 0.2);
    const cableA = this.add.rectangle(-70, 54, 46, 3, 0x50efff, 0.22)
      .setRotation(0.26)
      .setBlendMode(Phaser.BlendModes.SCREEN);
    const cableB = this.add.rectangle(70, 48, 48, 3, 0xff4fb8, 0.22)
      .setRotation(-0.24)
      .setBlendMode(Phaser.BlendModes.SCREEN);
    const cabinet = this.add.rectangle(0, 0, 156, 172, 0x160c15, 1)
      .setStrokeStyle(3, 0xffd06d, 0.28);
    const cabinetSideLeft = this.add.rectangle(-66, 4, 18, 152, 0x2b1526, 0.92)
      .setStrokeStyle(1, 0x07101c, 0.54);
    const cabinetSideRight = this.add.rectangle(66, 4, 18, 152, 0x0c1726, 0.92)
      .setStrokeStyle(1, 0x07101c, 0.54);
    const cabinetGlow = this.add.rectangle(0, 0, 148, 164, 0xff4fb8, 0.05)
      .setBlendMode(Phaser.BlendModes.SCREEN);
    const marquee = this.add.rectangle(0, -68, 88, 18, 0xffd06d, 0.94)
      .setStrokeStyle(2, 0x07101c, 0.8);
    const marqueeText = this.add.text(0, -68, "180", {
      fontFamily: "Courier New, Lucida Console, monospace",
      fontSize: "10px",
      fontStyle: "bold",
      color: "#07101c",
      stroke: "#fff6dc",
      strokeThickness: 1
    }).setOrigin(0.5);
    const targetGlow = this.add.ellipse(0, -2, 112, 112, 0x50efff, 0.12)
      .setBlendMode(Phaser.BlendModes.SCREEN);
    const targetFrame = this.add.circle(0, -2, 50, 0x0b1220, 1)
      .setStrokeStyle(4, 0xffd06d, 0.24);
    const targetR1 = this.add.circle(0, -2, 46, 0xff4fb8, 0.18)
      .setStrokeStyle(2, 0x07101c, 0.65);
    const targetR2 = this.add.circle(0, -2, 32, 0x50efff, 0.16)
      .setStrokeStyle(2, 0x07101c, 0.65);
    const targetR3 = this.add.circle(0, -2, 16, 0xffd06d, 0.22)
      .setStrokeStyle(2, 0x07101c, 0.65);
    const bull = this.add.circle(0, -2, 6, 0x8ef0a3, 0.92)
      .setStrokeStyle(2, 0xfff6dc, 0.8);
    const impactRing = this.add.circle(0, -2, 8, 0xfff6dc, 0)
      .setStrokeStyle(3, 0xfff6dc, 0)
      .setScale(0.4);
    const railLeft = this.add.rectangle(-52, -2, 8, 116, 0x50efff, 0.18)
      .setBlendMode(Phaser.BlendModes.SCREEN);
    const railRight = this.add.rectangle(52, -2, 8, 116, 0xff4fb8, 0.18)
      .setBlendMode(Phaser.BlendModes.SCREEN);
    const scorePlate = this.add.rectangle(0, 58, 112, 24, 0x08101d, 0.94)
      .setStrokeStyle(2, 0x50efff, 0.34);
    const coinTray = this.add.rectangle(0, 94, 82, 12, 0x0b1220, 0.96)
      .setStrokeStyle(2, 0xffd06d, 0.28);
    const coinA = this.add.circle(-22, 94, 4, 0xffd06d, 0.9)
      .setStrokeStyle(1, 0x07101c, 0.65);
    const coinB = this.add.circle(-8, 94, 4, 0xffd06d, 0.8)
      .setStrokeStyle(1, 0x07101c, 0.65);
    const coinC = this.add.circle(8, 94, 4, 0x50efff, 0.76)
      .setStrokeStyle(1, 0x07101c, 0.65);
    const scoreText = this.add.text(0, 58, "0  X  0", {
      fontFamily: "Courier New, Lucida Console, monospace",
      fontSize: "12px",
      fontStyle: "bold",
      color: "#fff6dc",
      stroke: "#05070d",
      strokeThickness: 3
    }).setOrigin(0.5);
    const roundText = this.add.text(0, 78, "ROUND 1", {
      fontFamily: "Courier New, Lucida Console, monospace",
      fontSize: "9px",
      fontStyle: "bold",
      color: "#d5dff2",
      stroke: "#05070d",
      strokeThickness: 3
    }).setOrigin(0.5);

    const pinA = this.add.rectangle(-8, -8, 6, 6, 0x50efff, 0.96)
      .setStrokeStyle(1, 0x07101c, 0.8)
      .setRotation(Math.PI / 4)
      .setVisible(false);
    const pinB = this.add.rectangle(8, 8, 6, 6, 0xff4fb8, 0.96)
      .setStrokeStyle(1, 0x07101c, 0.8)
      .setRotation(Math.PI / 4)
      .setVisible(false);
    const resultFlash = this.add.rectangle(0, -2, 124, 124, 0x8ef0a3, 0.01)
      .setBlendMode(Phaser.BlendModes.SCREEN);
    const resultLabel = this.add.text(0, 18, "", {
      fontFamily: "Courier New, Lucida Console, monospace",
      fontSize: "10px",
      fontStyle: "bold",
      color: "#fff6dc",
      stroke: "#05070d",
      strokeThickness: 4
    }).setOrigin(0.5).setAlpha(0);
    const payoutText = this.add.text(0, 96, "", {
      fontFamily: "Courier New, Lucida Console, monospace",
      fontSize: "8px",
      fontStyle: "bold",
      color: "#dfffe7",
      stroke: "#05070d",
      strokeThickness: 3
    }).setOrigin(0.5).setAlpha(0);

    base.add([
      shadow,
      floorPad,
      floorStripeA,
      floorStripeB,
      backPanel,
      leftColumn,
      rightColumn,
      cableA,
      cableB,
      cabinet,
      cabinetSideLeft,
      cabinetSideRight,
      cabinetGlow,
      marquee,
      marqueeText,
      targetGlow,
      targetFrame,
      targetR1,
      targetR2,
      targetR3,
      bull,
      impactRing,
      railLeft,
      railRight,
      scorePlate,
      coinTray,
      coinA,
      coinB,
      coinC,
      scoreText,
      roundText,
      resultFlash,
      pinA,
      pinB,
      resultLabel,
      payoutText
    ]);

    this.tweens.add({
      targets: [targetGlow, cabinetGlow],
      alpha: { from: 0.06, to: 0.18 },
      duration: 1400,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut"
    });
    this.tweens.add({
      targets: [railLeft, railRight],
      alpha: { from: 0.1, to: 0.28 },
      duration: 900,
      yoyo: true,
      repeat: -1,
      stagger: 140,
      ease: "Sine.easeInOut"
    });
    this.tweens.add({
      targets: [floorStripeA, floorStripeB, coinA, coinB, coinC],
      alpha: { from: 0.12, to: 0.42 },
      duration: 1180,
      yoyo: true,
      repeat: -1,
      stagger: 90,
      ease: "Sine.easeInOut"
    });

    return {
      base,
      marqueeText,
      targetGlow,
      impactRing,
      cabinetGlow,
      scoreText,
      roundText,
      resultFlash,
      resultLabel,
      payoutText,
      pinA,
      pinB,
      railLeft,
      railRight,
      floorStripeA,
      floorStripeB,
      coinA,
      coinB,
      coinC
    };
  }

  createCheckersStage(x, y) {
    const base = this.add.container(x, y).setDepth(1.2);
    const shadow = this.add.ellipse(0, 68, 182, 28, 0x000000, 0.22)
      .setBlendMode(Phaser.BlendModes.MULTIPLY);
    const rug = this.add.rectangle(0, 78, 206, 38, 0x08101d, 0.9)
      .setStrokeStyle(2, 0x50efff, 0.18);
    const rugLineA = this.add.rectangle(-52, 78, 58, 4, 0xffd06d, 0.14)
      .setBlendMode(Phaser.BlendModes.SCREEN);
    const rugLineB = this.add.rectangle(52, 78, 58, 4, 0x8ef0a3, 0.14)
      .setBlendMode(Phaser.BlendModes.SCREEN);
    const chairLeft = this.add.rectangle(-102, 18, 26, 62, 0x21111f, 0.96)
      .setStrokeStyle(2, 0xffd06d, 0.18);
    const chairRight = this.add.rectangle(102, 18, 26, 62, 0x131b22, 0.96)
      .setStrokeStyle(2, 0x50efff, 0.18);
    const table = this.add.rectangle(0, 0, 168, 154, 0x140b12, 1)
      .setStrokeStyle(3, 0x50efff, 0.24);
    const tableBevelTop = this.add.rectangle(0, -70, 152, 8, 0xffd06d, 0.14)
      .setBlendMode(Phaser.BlendModes.SCREEN);
    const tableBevelBottom = this.add.rectangle(0, 70, 152, 8, 0x50efff, 0.12)
      .setBlendMode(Phaser.BlendModes.SCREEN);
    const tableLegA = this.add.rectangle(-68, 62, 14, 30, 0x0a0710, 0.95);
    const tableLegB = this.add.rectangle(68, 62, 14, 30, 0x0a0710, 0.95);
    const felt = this.add.rectangle(0, 0, 140, 126, 0x131b22, 1)
      .setStrokeStyle(2, 0xffd06d, 0.18);
    const lampGlow = this.add.ellipse(0, -6, 154, 140, 0x8ef0a3, 0.08)
      .setBlendMode(Phaser.BlendModes.SCREEN);
    const labelPlate = this.add.rectangle(0, -62, 98, 18, 0x50efff, 0.92)
      .setStrokeStyle(2, 0x07101c, 0.8);
    const labelText = this.add.text(0, -62, "CHECK", {
      fontFamily: "Courier New, Lucida Console, monospace",
      fontSize: "9px",
      fontStyle: "bold",
      color: "#07101c",
      stroke: "#fff6dc",
      strokeThickness: 1
    }).setOrigin(0.5);
    const turnPlate = this.add.rectangle(0, 66, 110, 22, 0x08101d, 0.94)
      .setStrokeStyle(2, 0x8ef0a3, 0.28);
    const cupLeft = this.add.rectangle(-78, -44, 14, 18, 0xffd06d, 0.78)
      .setStrokeStyle(2, 0x07101c, 0.6);
    const cupRight = this.add.rectangle(78, -42, 14, 18, 0x50efff, 0.72)
      .setStrokeStyle(2, 0x07101c, 0.6);
    const chipStack = this.add.rectangle(80, 48, 22, 10, 0xff4fb8, 0.76)
      .setStrokeStyle(2, 0x07101c, 0.6);
    const turnText = this.add.text(0, 66, "TURN P1", {
      fontFamily: "Courier New, Lucida Console, monospace",
      fontSize: "10px",
      fontStyle: "bold",
      color: "#fff6dc",
      stroke: "#05070d",
      strokeThickness: 3
    }).setOrigin(0.5);
    const moveText = this.add.text(0, 84, "MOVE 0", {
      fontFamily: "Courier New, Lucida Console, monospace",
      fontSize: "9px",
      fontStyle: "bold",
      color: "#d5dff2",
      stroke: "#05070d",
      strokeThickness: 3
    }).setOrigin(0.5);
    const resultGlow = this.add.rectangle(0, 0, 128, 112, 0x8ef0a3, 0.01)
      .setBlendMode(Phaser.BlendModes.SCREEN);
    const scanBeam = this.add.rectangle(0, -48, 118, 12, 0x50efff, 0.01)
      .setBlendMode(Phaser.BlendModes.SCREEN);
    const resultLabel = this.add.text(0, 0, "", {
      fontFamily: "Courier New, Lucida Console, monospace",
      fontSize: "10px",
      fontStyle: "bold",
      color: "#fff6dc",
      stroke: "#05070d",
      strokeThickness: 4
    }).setOrigin(0.5).setAlpha(0);
    const payoutText = this.add.text(0, 100, "", {
      fontFamily: "Courier New, Lucida Console, monospace",
      fontSize: "8px",
      fontStyle: "bold",
      color: "#dfffe7",
      stroke: "#05070d",
      strokeThickness: 3
    }).setOrigin(0.5).setAlpha(0);

    const tiles = [];
    const pieces = [];
    const boardSize = 112;
    const cell = boardSize / 8;
    const boardOriginX = -boardSize / 2 + cell / 2;
    const boardOriginY = -boardSize / 2 + cell / 2;

    for (let row = 0; row < 8; row += 1) {
      for (let col = 0; col < 8; col += 1) {
        const dark = (row + col) % 2 === 1;
        const tile = this.add.rectangle(
          boardOriginX + col * cell,
          boardOriginY + row * cell,
          cell,
          cell,
          dark ? 0x2a1523 : 0xc49a64,
          1
        ).setStrokeStyle(1, 0x07101c, 0.12);
        tiles.push(tile);
      }
    }

    for (let index = 0; index < 24; index += 1) {
      const piece = this.add.circle(0, 0, 5, index < 12 ? 0x50efff : 0xff4fb8, 0.96)
        .setStrokeStyle(2, 0x07101c, 0.55)
        .setVisible(false);
      const crown = this.add.text(0, 0, "K", {
        fontFamily: "Courier New, Lucida Console, monospace",
        fontSize: "7px",
        fontStyle: "bold",
        color: "#fff6dc",
        stroke: "#05070d",
        strokeThickness: 2
      }).setOrigin(0.5).setVisible(false);
      pieces.push({ piece, crown });
    }

    base.add([
      shadow,
      rug,
      rugLineA,
      rugLineB,
      chairLeft,
      chairRight,
      tableLegA,
      tableLegB,
      table,
      tableBevelTop,
      tableBevelBottom,
      felt,
      lampGlow,
      resultGlow,
      scanBeam,
      labelPlate,
      labelText,
      cupLeft,
      cupRight,
      chipStack,
      ...tiles,
      ...pieces.flatMap((entry) => [entry.piece, entry.crown]),
      turnPlate,
      turnText,
      moveText,
      resultLabel,
      payoutText
    ]);

    this.tweens.add({
      targets: lampGlow,
      alpha: { from: 0.05, to: 0.16 },
      duration: 1700,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut"
    });
    this.tweens.add({
      targets: [rugLineA, rugLineB, cupLeft, cupRight, chipStack],
      alpha: { from: 0.12, to: 0.36 },
      duration: 1450,
      yoyo: true,
      repeat: -1,
      stagger: 110,
      ease: "Sine.easeInOut"
    });

    return {
      base,
      lampGlow,
      resultGlow,
      scanBeam,
      labelText,
      turnText,
      moveText,
      resultLabel,
      payoutText,
      tiles,
      pieces,
      rugLineA,
      rugLineB,
      cupLeft,
      cupRight,
      chipStack,
      boardOriginX,
      boardOriginY,
      cell
    };
  }

  applyStageResultFx(stage, match, seat, speed = 120) {
    if (!stage?.resultLabel || !stage?.payoutText) return;
    const tone = match?.winner
      ? match.winner === seat
        ? "win"
        : "loss"
      : "draw";
    const payout = Number(match?.settlement?.payout ?? 0);
    const houseFee = Number(match?.settlement?.houseFee ?? 0);
    const palette = tone === "win"
      ? { color: 0x8ef0a3, label: "WIN", payout: `+${payout}` }
      : tone === "loss"
        ? { color: 0xff4fb8, label: "LOSS", payout: payout ? `RIVAL +${payout}` : "RIVAL" }
        : { color: 0x50efff, label: "DRAW", payout: "REFUND" };

    stage.resultLabel.setText(palette.label).setAlpha(0.9);
    stage.payoutText.setText(`${palette.payout}${houseFee ? `  HOUSE ${houseFee}` : ""}`).setAlpha(0.84);
    if (stage.resultFlash) {
      stage.resultFlash.setFillStyle(palette.color, 0.12 + (Math.sin(this.time.now / speed) + 1) * 0.08);
    }
    if (stage.resultGlow) {
      stage.resultGlow.setFillStyle(palette.color, 0.12 + (Math.sin(this.time.now / speed) + 1) * 0.08);
    }
    if (stage.scanBeam) {
      stage.scanBeam.setFillStyle(palette.color, 0.16 + (Math.sin(this.time.now / speed) + 1) * 0.06);
      stage.scanBeam.y = -48 + Math.sin(this.time.now / (speed * 1.2)) * 42;
    }
    if (stage.impactRing) {
      const pulse = (Math.sin(this.time.now / speed) + 1) * 0.5;
      stage.impactRing.setStrokeStyle(3, palette.color, 0.18 + pulse * 0.52);
      stage.impactRing.setScale(0.7 + pulse * 1.5);
    }
  }

  spawnResultBurst(kind, stage, match, seat) {
    if (!stage || !match) return;
    const tone = match?.winner
      ? match.winner === seat
        ? "win"
        : "loss"
      : "draw";
    const config = tone === "win"
      ? { color: 0x8ef0a3, accent: 0xffd06d, amount: 18, label: `+${Number(match?.settlement?.payout ?? 0)}` }
      : tone === "loss"
        ? { color: 0xff4fb8, accent: 0xffd06d, amount: 14, label: "DOWN" }
        : { color: 0x50efff, accent: 0xffd06d, amount: 16, label: "REFUND" };
    const origin = kind === "darts"
      ? { x: 860, y: 514 }
      : { x: 318, y: 520 };

    for (let index = 0; index < config.amount; index += 1) {
      this.resultParticles.push({
        x: origin.x + Phaser.Math.Between(-18, 18),
        y: origin.y + Phaser.Math.Between(-24, 12),
        vx: kind === "darts" ? Phaser.Math.FloatBetween(-2.6, 2.6) : Phaser.Math.FloatBetween(-1.6, 1.6),
        vy: kind === "darts" ? Phaser.Math.FloatBetween(-2.9, -0.9) : Phaser.Math.FloatBetween(-2.1, -0.6),
        life: Phaser.Math.Between(22, 40),
        maxLife: Phaser.Math.Between(22, 40),
        size: Phaser.Math.Between(3, 6),
        color: index % 3 === 0 ? config.accent : config.color,
        kind:
          kind === "darts"
            ? index % 4 === 0 ? "spark" : "pixel"
            : index % 5 === 0 ? "diamond" : "pixel"
      });
    }

    this.resultParticles.push({
      x: origin.x,
      y: origin.y - 14,
      vx: 0,
      vy: -0.45,
      life: 42,
      maxLife: 42,
      size: 1,
      color: config.color,
      kind: "label"
    });
    const textNode = this.add.text(origin.x, origin.y - 14, config.label, {
      fontFamily: "Courier New, Lucida Console, monospace",
      fontSize: "10px",
      fontStyle: "bold",
      color: "#fff6dc",
      stroke: "#05070d",
      strokeThickness: 4
    }).setOrigin(0.5).setDepth(2.09);
    this.resultFloatTexts.push({
      node: textNode,
      x: origin.x,
      y: origin.y - 14,
      vx: 0,
      vy: -0.45,
      life: 42,
      maxLife: 42
    });
  }

  spawnDartThrowFx(stage, throwEntry) {
    if (!stage || !throwEntry) return;
    const x = 860 + (Number(throwEntry.x ?? throwEntry.aimX ?? 50) - 50) * 0.9;
    const y = 514 + (Number(throwEntry.y ?? throwEntry.aimY ?? 50) - 50) * 0.9 - 2;
    const dart = this.add.rectangle(860, 610, 24, 4, throwEntry.seat === "playerTwo" ? 0xff4fb8 : 0x50efff, 0.98)
      .setStrokeStyle(1, 0x07101c, 0.85)
      .setRotation(-0.55)
      .setDepth(2.1);
    const trail = this.add.rectangle(860, 610, 38, 2, 0xffd06d, 0.32)
      .setBlendMode(Phaser.BlendModes.SCREEN)
      .setRotation(-0.55)
      .setDepth(2.09);

    this.tweens.add({
      targets: [dart, trail],
      x,
      y,
      duration: 360,
      ease: "Cubic.easeOut",
      onComplete: () => {
        dart.destroy();
        trail.destroy();
        this.cameras.main.shake(90, 0.0025);
        stage.impactRing?.setStrokeStyle(3, 0xffd06d, 0.78);
        stage.scoreText?.setScale(1.16);
        this.tweens.add({
          targets: stage.scoreText,
          scale: 1,
          duration: 180,
          ease: "Back.easeOut"
        });
        for (let index = 0; index < 8; index += 1) {
          this.resultParticles.push({
            x,
            y,
            vx: Phaser.Math.FloatBetween(-1.3, 1.3),
            vy: Phaser.Math.FloatBetween(-1.8, -0.4),
            life: Phaser.Math.Between(14, 24),
            maxLife: Phaser.Math.Between(14, 24),
            size: Phaser.Math.Between(2, 4),
            color: index % 2 ? 0xffd06d : 0x50efff,
            kind: "spark"
          });
        }
      }
    });
  }

  spawnCheckersMoveFx(stage, moveEntry) {
    if (!stage || !moveEntry?.from || !moveEntry?.to) return;
    const fromX = 318 + stage.boardOriginX + moveEntry.from.col * stage.cell;
    const fromY = 520 + stage.boardOriginY + moveEntry.from.row * stage.cell;
    const toX = 318 + stage.boardOriginX + moveEntry.to.col * stage.cell;
    const toY = 520 + stage.boardOriginY + moveEntry.to.row * stage.cell;
    const color = moveEntry.seat === "playerTwo" ? 0xff4fb8 : 0x50efff;
    const ghost = this.add.circle(fromX, fromY, 7, color, 0.98)
      .setStrokeStyle(2, 0xffd06d, 0.72)
      .setDepth(2.12);
    const halo = this.add.circle(fromX, fromY, 12, color, 0.16)
      .setBlendMode(Phaser.BlendModes.SCREEN)
      .setDepth(2.11);

    this.tweens.add({
      targets: [ghost, halo],
      x: toX,
      y: toY,
      duration: 420,
      ease: "Cubic.easeInOut",
      onComplete: () => {
        ghost.destroy();
        halo.destroy();
        if (moveEntry.capture) {
          const captureX = 318 + stage.boardOriginX + moveEntry.capture.col * stage.cell;
          const captureY = 520 + stage.boardOriginY + moveEntry.capture.row * stage.cell;
          for (let index = 0; index < 10; index += 1) {
            this.resultParticles.push({
              x: captureX,
              y: captureY,
              vx: Phaser.Math.FloatBetween(-1.1, 1.1),
              vy: Phaser.Math.FloatBetween(-1.5, -0.3),
              life: Phaser.Math.Between(16, 28),
              maxLife: Phaser.Math.Between(16, 28),
              size: Phaser.Math.Between(2, 4),
              color: index % 2 ? 0xff4fb8 : 0xffd06d,
              kind: "diamond"
            });
          }
        }
        stage.turnText?.setScale(1.12);
        this.tweens.add({
          targets: stage.turnText,
          scale: 1,
          duration: 180,
          ease: "Back.easeOut"
        });
      }
    });
  }

  syncActionFxTriggers() {
    const dartsMatch = gameState.pvpGameId === "darts" ? gameState.pvpMatch : null;
    const dart = dartsMatch?.lastThrow || null;
    const dartSignature = dart ? `${dartsMatch.id}:${dart.seat}:${dart.at || dartsMatch.updatedAt || ""}:${dart.x}:${dart.y}` : "";
    if (dartSignature && this.actionFxState.darts.signature !== dartSignature) {
      this.actionFxState.darts.signature = dartSignature;
      this.spawnDartThrowFx(this.pvpDecor?.darts?.target, dart);
    }
    if (!dartSignature) this.actionFxState.darts.signature = "";

    const checkersMatch = gameState.pvpGameId === "checkers" ? gameState.pvpMatch : null;
    const move = checkersMatch?.lastMove || null;
    const moveSignature = move ? `${checkersMatch.id}:${move.seat}:${move.at || checkersMatch.updatedAt || ""}:${move.from?.row}:${move.from?.col}:${move.to?.row}:${move.to?.col}` : "";
    if (moveSignature && this.actionFxState.checkers.signature !== moveSignature) {
      this.actionFxState.checkers.signature = moveSignature;
      this.spawnCheckersMoveFx(this.pvpDecor?.checkers?.board, move);
    }
    if (!moveSignature) this.actionFxState.checkers.signature = "";
  }

  syncResultFxTriggers() {
    const checkTrigger = (kind, match) => {
      const cache = this.resultFxState[kind];
      if (!match || match.state !== "finished") {
        cache.signature = "";
        return;
      }
      const signature = `${match.id || kind}:${match.state}:${match.winner || "draw"}:${match.updatedAt || match.finishedAt || ""}`;
      if (cache.signature === signature) return;
      cache.signature = signature;
      this.spawnResultBurst(kind, kind === "darts" ? this.pvpDecor?.darts?.target : this.pvpDecor?.checkers?.board, match, gameState.pvpSeat);
    };

    checkTrigger("darts", gameState.pvpGameId === "darts" ? gameState.pvpMatch : null);
    checkTrigger("checkers", gameState.pvpGameId === "checkers" ? gameState.pvpMatch : null);
  }

  updateResultFxParticles() {
    if (!this.resultFxLayer) return;
    this.resultFxLayer.clear();
    this.resultFloatTexts = this.resultFloatTexts.filter((entry) => {
      entry.life -= 1;
      if (entry.life <= 0) {
        entry.node.destroy();
        return false;
      }
      entry.x += entry.vx;
      entry.y += entry.vy;
      entry.vy -= 0.002;
      entry.node.setPosition(entry.x, entry.y).setAlpha(entry.life / entry.maxLife);
      return true;
    });
    this.resultParticles = this.resultParticles.filter((particle) => {
      particle.life -= 1;
      if (particle.life <= 0) return false;
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.vy += 0.03;
      const alpha = particle.life / particle.maxLife;

      this.resultFxLayer.fillStyle(particle.color, alpha * 0.9);
      if (particle.kind === "spark") {
        this.resultFxLayer.fillRect(particle.x - particle.size, particle.y, particle.size * 2, 1);
        this.resultFxLayer.fillRect(particle.x, particle.y - particle.size, 1, particle.size * 2);
      } else if (particle.kind === "diamond") {
        this.resultFxLayer.fillRect(particle.x, particle.y - particle.size, 1, particle.size);
        this.resultFxLayer.fillRect(particle.x - particle.size / 2, particle.y, particle.size, 1);
        this.resultFxLayer.fillRect(particle.x, particle.y, 1, particle.size);
      } else {
        this.resultFxLayer.fillRect(particle.x, particle.y, particle.size, particle.size);
      }
      return true;
    });
  }

  updateCheckersStageVisual() {
    const decor = this.pvpDecor?.checkers;
    const stage = decor?.board;
    if (!stage) return;

    const isCheckers = gameState.pvpGameId === "checkers";
    const state = isCheckers ? gameState.pvpStatus : "idle";
    const match = isCheckers ? gameState.pvpMatch : null;
    const board = Array.isArray(match?.board) ? match.board : [];
    const moveCount = Number(match?.moveCount || 0);
    const turn = match?.turn || "";
    const legalMoves = turn && board.length ? this.getStageLegalCheckersMoves(board, turn).slice(0, 10) : [];
    const hintKeys = new Set(legalMoves.flatMap((move) => [
      `${move.from.row}:${move.from.col}:from`,
      `${move.to.row}:${move.to.col}:to`
    ]));

    stage.labelText.setText(
      state === "active" ? "LIVE" :
      state === "waiting" ? "QUEUE" :
      state === "abandoned" ? "BACK" :
      "CHECK"
    );
    stage.turnText.setText(`TURN ${turn === "playerTwo" ? "P2" : "P1"}`);
    stage.moveText.setText(`MOVE ${moveCount}`);
    stage.resultLabel.setAlpha(0);
    stage.payoutText.setAlpha(0);
    if (stage.scanBeam) {
      stage.scanBeam.setFillStyle(0x50efff, 0.01);
      stage.scanBeam.y = -48;
    }

    stage.tiles.forEach((tile, index) => {
      const row = Math.floor(index / 8);
      const col = index % 8;
      const dark = (row + col) % 2 === 1;
      tile.fillColor = dark ? 0x2a1523 : 0xc49a64;
      tile.fillAlpha = 1;
      tile.setStrokeStyle(1, 0x07101c, 0.12);
      if (hintKeys.has(`${row}:${col}:from`)) {
        tile.setStrokeStyle(2, 0xffd06d, 0.88);
      } else if (hintKeys.has(`${row}:${col}:to`)) {
        tile.fillColor = 0x8ef0a3;
        tile.fillAlpha = 0.9;
      }
    });

    stage.pieces.forEach((entry) => {
      entry.piece.setVisible(false);
      entry.crown.setVisible(false);
    });

    let pieceIndex = 0;
    for (let row = 0; row < 8; row += 1) {
      for (let col = 0; col < 8; col += 1) {
        const token = board?.[row]?.[col];
        if (!token) continue;
        const slot = stage.pieces[pieceIndex];
        if (!slot) continue;
        const x = stage.boardOriginX + col * stage.cell;
        const y = stage.boardOriginY + row * stage.cell;
        const isPlayerOne = String(token).toLowerCase() === "p";
        const isKing = token === String(token).toUpperCase();
        slot.piece
          .setPosition(x, y)
          .setFillStyle(isPlayerOne ? 0x50efff : 0xff4fb8, 0.96)
          .setVisible(true);
        slot.crown
          .setPosition(x, y)
          .setVisible(Boolean(isKing));
        pieceIndex += 1;
      }
    }

    if (state === "active") {
      stage.lampGlow.setFillStyle(0x8ef0a3, 0.12 + (Math.sin(this.time.now / 180) + 1) * 0.03);
    } else if (state === "waiting") {
      stage.lampGlow.setFillStyle(0x50efff, 0.11 + (Math.sin(this.time.now / 220) + 1) * 0.03);
    } else if (state === "abandoned") {
      stage.lampGlow.setFillStyle(0xff4fb8, 0.12 + (Math.sin(this.time.now / 120) + 1) * 0.04);
    } else if (state === "finished") {
      this.applyStageResultFx(stage, match, gameState.pvpSeat, 100);
      stage.lampGlow.setFillStyle(match?.winner === gameState.pvpSeat ? 0x8ef0a3 : match?.winner ? 0xff4fb8 : 0x50efff, 0.16);
    } else {
      stage.lampGlow.setFillStyle(0x8ef0a3, 0.08);
      if (stage.resultGlow) stage.resultGlow.setFillStyle(0x8ef0a3, 0.01);
      if (stage.scanBeam) stage.scanBeam.setFillStyle(0x50efff, 0.01);
    }
  }

  getStageCheckersOwner(piece = "") {
    if (!piece) return "";
    return piece.toLowerCase() === "p" ? "playerOne" : "playerTwo";
  }

  getStageCheckersDirections(piece = "") {
    if (!piece) return [];
    if (piece === piece.toUpperCase()) return [[-1, -1], [-1, 1], [1, -1], [1, 1]];
    return piece.toLowerCase() === "p" ? [[-1, -1], [-1, 1]] : [[1, -1], [1, 1]];
  }

  getStageLegalCheckersMoves(board = [], owner = "playerOne") {
    const moves = [];
    for (let row = 0; row < 8; row += 1) {
      for (let col = 0; col < 8; col += 1) {
        const piece = board?.[row]?.[col];
        if (this.getStageCheckersOwner(piece) !== owner) continue;
        const enemy = owner === "playerOne" ? "playerTwo" : "playerOne";
        this.getStageCheckersDirections(piece).forEach(([rowStep, colStep]) => {
          const nextRow = row + rowStep;
          const nextCol = col + colStep;
          if (!board?.[nextRow] || nextCol < 0 || nextCol > 7) return;
          if (!board[nextRow][nextCol]) {
            moves.push({ from: { row, col }, to: { row: nextRow, col: nextCol }, capture: null });
            return;
          }
          const jumpRow = nextRow + rowStep;
          const jumpCol = nextCol + colStep;
          if (
            this.getStageCheckersOwner(board[nextRow][nextCol]) === enemy &&
            board?.[jumpRow] &&
            jumpCol >= 0 &&
            jumpCol <= 7 &&
            !board[jumpRow][jumpCol]
          ) {
            moves.push({
              from: { row, col },
              to: { row: jumpRow, col: jumpCol },
              capture: { row: nextRow, col: nextCol }
            });
          }
        });
      }
    }
    const captures = moves.filter((move) => move.capture);
    return captures.length ? captures : moves;
  }

  updateDartsStageVisual() {
    const decor = this.pvpDecor?.darts;
    const stage = decor?.target;
    if (!stage) return;

    const isDarts = gameState.pvpGameId === "darts";
    const state = isDarts ? gameState.pvpStatus : "idle";
    const match = isDarts ? gameState.pvpMatch : null;
    const darts = match?.dartsState || null;
    const p1 = Number(darts?.playerOneScore || 0);
    const p2 = Number(darts?.playerTwoScore || 0);
    const round = Number(darts?.round || 1);
    stage.scoreText.setText(`${p1}  X  ${p2}`);
    stage.roundText.setText(`ROUND ${round}`);
    stage.marqueeText.setText(
      state === "active" ? "LIVE" :
      state === "waiting" ? "QUEUE" :
      state === "abandoned" ? "BACK" :
      "180"
    );

    const pinFor = (pin, throwEntry, fallbackX, fallbackY) => {
      if (!throwEntry) {
        pin.setVisible(false);
        return;
      }
      const x = Number(throwEntry.x ?? throwEntry.aimX ?? fallbackX);
      const y = Number(throwEntry.y ?? throwEntry.aimY ?? fallbackY);
      pin.setPosition((x - 50) * 0.9, (y - 50) * 0.9 - 2).setVisible(true);
    };
    pinFor(stage.pinA, darts?.lastPlayerOne || darts?.playerOneThrow || null, 42, 42);
    pinFor(stage.pinB, darts?.lastPlayerTwo || darts?.playerTwoThrow || null, 58, 58);
    stage.resultLabel.setAlpha(0);
    stage.payoutText.setAlpha(0);
    if (stage.impactRing) {
      stage.impactRing.setStrokeStyle(3, 0xfff6dc, 0);
      stage.impactRing.setScale(0.4);
    }

    if (state === "active") {
      stage.targetGlow.setFillStyle(0x50efff, 0.18 + (Math.sin(this.time.now / 160) + 1) * 0.04);
      stage.cabinetGlow.setFillStyle(0xffd06d, 0.08 + (Math.sin(this.time.now / 140) + 1) * 0.03);
      stage.railLeft.fillAlpha = 0.24 + (Math.sin(this.time.now / 110) + 1) * 0.06;
      stage.railRight.fillAlpha = 0.24 + (Math.sin(this.time.now / 150) + 1) * 0.06;
    } else if (state === "waiting") {
      stage.targetGlow.setFillStyle(0xff4fb8, 0.12 + (Math.sin(this.time.now / 240) + 1) * 0.04);
      stage.cabinetGlow.setFillStyle(0x50efff, 0.06);
      stage.railLeft.fillAlpha = 0.16;
      stage.railRight.fillAlpha = 0.16;
    } else if (state === "abandoned") {
      stage.targetGlow.setFillStyle(0xff4fb8, 0.16 + (Math.sin(this.time.now / 90) + 1) * 0.05);
      stage.cabinetGlow.setFillStyle(0xff4fb8, 0.1);
      stage.railLeft.fillAlpha = 0.28;
      stage.railRight.fillAlpha = 0.28;
    } else if (state === "finished") {
      this.applyStageResultFx(stage, match, gameState.pvpSeat, 90);
      stage.targetGlow.setFillStyle(match?.winner === gameState.pvpSeat ? 0x8ef0a3 : match?.winner ? 0xff4fb8 : 0x50efff, 0.18);
      stage.cabinetGlow.setFillStyle(match?.winner === gameState.pvpSeat ? 0x8ef0a3 : match?.winner ? 0xff4fb8 : 0x50efff, 0.12);
      stage.railLeft.fillAlpha = 0.3;
      stage.railRight.fillAlpha = 0.3;
    } else {
      stage.targetGlow.setFillStyle(0x50efff, 0.1);
      stage.cabinetGlow.setFillStyle(0xff4fb8, 0.05);
      stage.railLeft.fillAlpha = 0.18;
      stage.railRight.fillAlpha = 0.18;
      if (stage.resultFlash) stage.resultFlash.setFillStyle(0x8ef0a3, 0.01);
      if (stage.impactRing) {
        stage.impactRing.setStrokeStyle(3, 0xfff6dc, 0);
      }
    }
  }

  syncPvpDecorVisuals() {
    const applyState = (decor, state, activeColor, waitingColor) => {
      if (!decor) return;
      const color =
        state === "active" ? activeColor :
        state === "waiting" ? waitingColor :
        state === "finished" ? 0x8ef0a3 :
        state === "abandoned" ? 0xff4fb8 :
        decor.sign.baseColor;
      const label =
        state === "active" ? "AO VIVO" :
        state === "waiting" ? "FILA" :
        state === "finished" ? "FINAL" :
        state === "abandoned" ? "RETORNE" :
        decor.sign.baseLabel;

      decor.sign.glow.fillColor = color;
      decor.sign.plate.setStrokeStyle(2, color, 0.85);
      decor.sign.text.setText(label);
      decor.lamp.light.fillColor = color;
      decor.lamp.dot.fillColor = color;
      decor.shards.forEach((shard, index) => {
        shard.fillColor = index % 2 === 0 ? color : 0xffd06d;
        shard.alpha = state === "active" ? 0.4 : state === "finished" ? 0.34 : state === "waiting" ? 0.28 : 0.18;
      });
    };

    const checkersState = gameState.pvpGameId === "checkers" ? gameState.pvpStatus : "idle";
    const dartsState = gameState.pvpGameId === "darts" ? gameState.pvpStatus : "idle";
    applyState(this.pvpDecor.checkers, checkersState, 0x8ef0a3, 0x50efff);
    applyState(this.pvpDecor.darts, dartsState, 0xffd06d, 0xff4fb8);
  }

  buildZoneHotspot(zone) {
    const container = this.add.container(zone.x, zone.y).setDepth(2.1);
    const baseGlow = this.add.ellipse(0, 0, zone.radius * 1.9, zone.radius * 1.35, zone.color, 0.03)
      .setBlendMode(Phaser.BlendModes.SCREEN);
    const shell = this.add.ellipse(0, 0, zone.radius * 1.45, zone.radius * 1.1, zone.color, 0.05)
      .setBlendMode(Phaser.BlendModes.SCREEN);
    const frame = this.add.graphics();
    this.drawZoneFrame(frame, zone.radius, zone.color, 0.4);
    const pulse = this.add.ellipse(0, 0, zone.radius * 1.15, zone.radius * 0.88, zone.color, 0.02)
      .setBlendMode(Phaser.BlendModes.SCREEN);
    const text = this.add.text(0, -zone.radius * 0.88, zone.label, {
      fontFamily: "Courier New, Lucida Console, monospace",
      fontSize: "12px",
      fontStyle: "bold",
      color: "#fff5de",
      stroke: "#04060b",
      strokeThickness: 4
    }).setOrigin(0.5).setLetterSpacing(3).setAlpha(0.9);
    const chip = this.add.text(0, zone.radius * 0.62, "ENTER", {
      fontFamily: "Courier New, Lucida Console, monospace",
      fontSize: "10px",
      fontStyle: "bold",
      color: "#d5dff2",
      stroke: "#04060b",
      strokeThickness: 3
    }).setOrigin(0.5).setLetterSpacing(2).setAlpha(0.82);

    container.add([baseGlow, shell, pulse, frame, text, chip]);
    container.ppgZone = { ...zone, baseGlow, shell, pulse, frame, text, chip };
    container.setSize(zone.radius * 2, zone.radius * 2);
    container.setInteractive(new Phaser.Geom.Circle(0, 0, zone.radius), Phaser.Geom.Circle.Contains);
    container.on("pointerover", () => this.setActiveZone(zone.id));
    container.on("pointerout", () => {
      if (this.activeZone?.id === zone.id) this.setActiveZone(null);
    });
    container.on("pointerdown", (_pointer, _localX, _localY, event) => {
      event?.stopPropagation?.();
      this.moveToZone(zone);
    });
    return container;
  }

  drawZoneFrame(graphics, radius, color, alpha) {
    graphics.clear();
    graphics.lineStyle(2, color, alpha);
    graphics.strokeEllipse(0, 0, radius * 1.25, radius * 0.92);
    graphics.lineStyle(1, color, alpha * 0.65);
    graphics.strokeEllipse(0, 0, radius * 0.95, radius * 0.7);
    graphics.lineBetween(-radius * 0.55, 0, -radius * 0.28, 0);
    graphics.lineBetween(radius * 0.28, 0, radius * 0.55, 0);
    graphics.lineBetween(0, -radius * 0.38, 0, -radius * 0.2);
    graphics.lineBetween(0, radius * 0.2, 0, radius * 0.38);
  }

  buildPlayer(x, y) {
    const player = this.add.container(x, y).setDepth(2.55);
    const shadow = this.add.ellipse(0, 2, 48, 11, 0x000000, 0)
      .setBlendMode(Phaser.BlendModes.MULTIPLY);
    const sprite = this.add.image(0, 0, TEXTURE_KEYS.player)
      .setOrigin(0.5, 1)
      .setScale(0.083)
      .setAlpha(0);
    player.add([shadow, sprite]);
    player.ppgSprite = sprite;
    player.ppgShadow = shadow;
    return player;
  }

  addActor(textureKey, x, y, scale, pulseDuration, glowColor, options = {}) {
    const glow = this.add.ellipse(x, y - 8, Math.max(34, 680 * scale), Math.max(10, 150 * scale), glowColor, 0.1)
      .setBlendMode(Phaser.BlendModes.SCREEN)
      .setDepth(2.36);
    const actor = addIdleSpriteActor(this, textureKey, x, y, scale, {
      frameDuration: 220,
      delay: Math.floor((x + y) % 170),
      staticBitmap: Boolean(options.staticBitmap)
    });
    actor.setDepth(options.depth || 2.45);
    if (options.alpha) actor.setAlpha(options.alpha);
    addBitmapWalkCycle(this, actor, glow, {
      stepHeight: options.stepHeight || 4,
      duration: Math.max(420, pulseDuration * 0.22),
      delay: Math.floor((x * 3 + y) % 260)
    });
    this.tweens.add({
      targets: glow,
      alpha: { from: 0.04, to: 0.14 },
      scaleX: { from: 0.9, to: 1.08 },
      duration: pulseDuration,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut"
    });
    return actor;
  }

  moveToZone(zone) {
    this.targetPoint = new Phaser.Math.Vector2(
      Phaser.Math.Clamp(zone.x, INTERIOR_BOUNDS.minX, INTERIOR_BOUNDS.maxX),
      Phaser.Math.Clamp(zone.y + (zone.id === "exit" ? 20 : 42), INTERIOR_BOUNDS.minY, INTERIOR_BOUNDS.maxY)
    );
    this.targetMarker.setPosition(this.targetPoint.x, this.targetPoint.y).setVisible(true);
    updateGameState({
      currentScene: "interior",
      focus: this.getZoneLabel(zone.id),
      objective: zone.id === "exit" ? "Voltar para a rua" : zone.objective,
            prompt:
        zone.id === "exit"
          ? "Saída marcada. Chegue perto e aperte Enter."
          : `${zone.label} marcado. Chegue perto e aperte Enter.`
    });
  }

  nudgePlayer(dx, dy) {
    const nextX = Phaser.Math.Clamp(this.player.x + dx, INTERIOR_BOUNDS.minX, INTERIOR_BOUNDS.maxX);
    const nextY = Phaser.Math.Clamp(this.player.y + dy, INTERIOR_BOUNDS.minY, INTERIOR_BOUNDS.maxY);
    this.targetPoint = new Phaser.Math.Vector2(nextX, nextY);
    this.targetMarker.setPosition(this.targetPoint.x, this.targetPoint.y).setVisible(true);
  }

  tryMovePlayer(dx, dy) {
    const tryX = Phaser.Math.Clamp(this.player.x + dx, INTERIOR_BOUNDS.minX, INTERIOR_BOUNDS.maxX);
    const tryY = Phaser.Math.Clamp(this.player.y + dy, INTERIOR_BOUNDS.minY, INTERIOR_BOUNDS.maxY);
    if (isPointWalkable(INTERIOR_SCENE_MAP, tryX, tryY)) {
      this.player.x = tryX;
      this.player.y = tryY;
      return true;
    }

    const axisX = Phaser.Math.Clamp(this.player.x + dx, INTERIOR_BOUNDS.minX, INTERIOR_BOUNDS.maxX);
    if (isPointWalkable(INTERIOR_SCENE_MAP, axisX, this.player.y)) {
      this.player.x = axisX;
      return true;
    }
    const axisY = Phaser.Math.Clamp(this.player.y + dy, INTERIOR_BOUNDS.minY, INTERIOR_BOUNDS.maxY);
    if (isPointWalkable(INTERIOR_SCENE_MAP, this.player.x, axisY)) {
      this.player.y = axisY;
      return true;
    }
    return false;
  }

  getNearestZone() {
    let nearest = null;
    let bestDistance = Infinity;
    this.zones.forEach((zone) => {
      const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, zone.x, zone.y);
      if (distance < zone.radius && distance < bestDistance) {
        bestDistance = distance;
        nearest = zone;
      }
    });
    return nearest;
  }

  getZoneAt(x, y) {
    return this.zones.find((zone) => Phaser.Math.Distance.Between(x, y, zone.x, zone.y) < zone.radius) || null;
  }

  getZoneLabel(zoneId) {
    if (zoneId === "waiter") return "garçom dos jogos";
    if (zoneId === "stage") return "palco da cantora";
    if (zoneId === "exit") return "saída para rua";
    return "salão";
  }

  setActiveZone(zoneId) {
    this.activeZone = zoneId ? this.zones.find((zone) => zone.id === zoneId) || null : null;
    this.zoneHotspots.forEach((hotspot) => {
      const active = hotspot.ppgZone.id === zoneId;
      hotspot.ppgZone.baseGlow.setAlpha(active ? 0.12 : 0.03);
      hotspot.ppgZone.shell.setAlpha(active ? 0.18 : 0.05);
      hotspot.ppgZone.pulse.setAlpha(active ? 0.16 : 0.02);
      hotspot.ppgZone.text.setAlpha(active ? 1 : 0.9);
      hotspot.ppgZone.chip.setAlpha(active ? 1 : 0.82);
    });
  }

  tryInteraction() {
    const now = this.time.now;
    if (this.isTransitioning || now < this.interactionCooldown) return;
    this.interactionCooldown = now + 250;

    const zone = this.getNearestZone();
    if (!zone) {
      updateGameState({
        prompt: "Chegue perto do garçom no centro do salão ou da saída."
      });
      return;
    }

    if (zone.id === "exit") {
      this.exitToStreet();
      return;
    }

    if (zone.id === "waiter") {
      updateGameState({
        currentScene: "game-lobby",
        activeGameId: "",
        lobbyPhase: "selecting",
        objective: "Escolher jogo no lobby",
        focus: "lobby dos jogos",
                prompt: "Garçom abriu o lobby separado. Escolha o jogo na próxima tela."
      });
      this.scene.start("game-lobby-scene", { gameId: "" });
      return;
    }

    openPanel(INTERIOR_PANELS[zone.id]);
    updateGameState({
      focus: this.getZoneLabel(zone.id),
      objective: "Escolher ação no painel",
      systemStatus: zone.id === "stage" ? "Palco ativo" : "Painel aberto"
    });
  }

  update() {
    if (this.isTransitioning) {
      return;
    }

    let playerMoving = false;
    const keyboardVector = new Phaser.Math.Vector2(0, 0);
    if (this.cursors.left.isDown) keyboardVector.x -= 1;
    if (this.cursors.right.isDown) keyboardVector.x += 1;
    if (this.cursors.up.isDown) keyboardVector.y -= 1;
    if (this.cursors.down.isDown) keyboardVector.y += 1;

    if (keyboardVector.lengthSq() > 0) {
      keyboardVector.normalize().scale(2.6);
      this.player.ppgSprite?.setFlipX(keyboardVector.x < 0);
      this.targetPoint = null;
      this.targetMarker.setVisible(false);
      playerMoving = this.tryMovePlayer(keyboardVector.x, keyboardVector.y);
    } else if (this.targetPoint) {
      const dx = this.targetPoint.x - this.player.x;
      const dy = this.targetPoint.y - this.player.y;
      const distance = Math.hypot(dx, dy);
      if (distance < 3) {
        this.player.setPosition(this.targetPoint.x, this.targetPoint.y);
        this.targetPoint = null;
        this.targetMarker.setVisible(false);
      } else {
        const speed = 2.8;
        const moveX = (dx / distance) * speed;
        const moveY = (dy / distance) * speed;
        playerMoving = this.tryMovePlayer(moveX, moveY);
        this.player.ppgSprite?.setFlipX(dx < 0);
      }
    }
    updateContainerWalkPose(this, this.player, playerMoving, { stepHeight: 5, speed: 110 });

    const zone = this.getNearestZone();
    this.setActiveZone(zone?.id || null);

    this.stageGlow.alpha = gameState.stageEventActive
      ? 0.26 + (Math.sin(this.time.now / 150) + 1) * 0.09
      : 0.12 + (Math.sin(this.time.now / 240) + 1) * 0.03;
    if (this.stageOrb) {
      this.stageOrb.alpha = gameState.stageEventActive
        ? 0.18 + (Math.sin(this.time.now / 110) + 1) * 0.07
        : 0.05 + (Math.sin(this.time.now / 260) + 1) * 0.02;
    }
    if (this.loungeMist) {
      this.loungeMist.alpha = 0.03 + (Math.sin(this.time.now / 400) + 1) * 0.02;
    }
    this.stageBeams.forEach((beam, index) => {
      beam.rotation = Math.sin(this.time.now / 1000 + index) * 0.06;
      beam.scaleX = 1 + Math.sin(this.time.now / 700 + index) * 0.04;
    });
    this.ambientBands.forEach((band, index) => {
      band.x += Math.sin(this.time.now / 900 + index) * 0.08;
    });
    this.zoneHotspots.forEach((hotspot, index) => {
      hotspot.ppgZone.pulse.setScale(1 + Math.sin(this.time.now / 220 + index) * 0.04);
    });
    if (this.floorReflectionLayer) {
      this.floorReflectionLayer.clear();
      this.floorReflections.forEach((reflection, index) => {
        const pulse = (Math.sin(this.time.now * reflection.speed + index) + 1) * 0.5;
        this.floorReflectionLayer.fillStyle(reflection.color, reflection.alpha * (0.45 + pulse * 0.75));
        this.floorReflectionLayer.fillRoundedRect(
          reflection.x - reflection.width / 2 + Math.sin(this.time.now / 1100 + index) * 6,
          reflection.y,
          reflection.width,
          reflection.height,
          3
        );
      });
    }
    if (this.stageLaserLayer) {
      const t = this.time.now;
      this.stageLaserLayer.clear();
      const laserAlpha = gameState.stageEventActive ? 0.48 : 0.24;
      [
        { color: 0xff4fb8, offset: 0, y: 286 },
        { color: 0x50efff, offset: 1.8, y: 312 },
        { color: 0xffd06d, offset: 3.4, y: 338 }
      ].forEach((laser, index) => {
        const wobble = Math.sin(t / 600 + laser.offset) * 46;
        this.stageLaserLayer.lineStyle(3, laser.color, laserAlpha * (0.55 + index * 0.15));
        this.stageLaserLayer.lineBetween(1062, 214, 850 + wobble - index * 80, laser.y + Math.sin(t / 430 + index) * 20);
        this.stageLaserLayer.lineStyle(2, laser.color, laserAlpha * 0.55);
        this.stageLaserLayer.lineBetween(1062, 214, 1180 - wobble + index * 26, laser.y + 42);
      });
    }
    if (this.sparkleLayer) {
      this.sparkleLayer.clear();
      this.sparkles.forEach((spark, index) => {
        spark.y -= spark.speed;
        spark.x += Math.sin(this.time.now / 800 + spark.phase) * 0.15;
        if (spark.y < 48) {
          spark.y = Phaser.Math.Between(530, 650);
          spark.x = Phaser.Math.Between(70, GAME_WIDTH - 70);
        }
        const twinkle = (Math.sin(this.time.now / 210 + spark.phase + index) + 1) * 0.5;
        this.sparkleLayer.fillStyle(spark.color, spark.alpha * (0.35 + twinkle));
        this.sparkleLayer.fillRect(spark.x, spark.y, spark.size, spark.size);
        if (twinkle > 0.82) {
          this.sparkleLayer.fillRect(spark.x - spark.size, spark.y, spark.size * 3, 1);
          this.sparkleLayer.fillRect(spark.x, spark.y - spark.size, 1, spark.size * 3);
        }
      });
    }

    this.exitPulse.setAlpha(
      zone?.id === "exit"
        ? 0.18 + (Math.sin(this.time.now / 140) + 1) * 0.04
        : 0.04 + (Math.sin(this.time.now / 220) + 1) * 0.01
    );

    this.updateResultFxParticles();

    updateGameState({
      currentScene: "interior",
      focus: zone ? this.getZoneLabel(zone.id) : "salão",
      objective: zone
        ? zone.id === "exit"
          ? "Voltar para a rua"
          : zone.id === "waiter"
            ? "Apertar Enter para abrir o lobby"
            : "Apertar Enter para interagir"
        : "Falar com o garçom no centro",
            prompt: zone
        ? zone.id === "exit"
          ? "Saída localizada. Aperte Enter para voltar para a rua."
          : zone.id === "waiter"
            ? "Garçom localizado. Aperte Enter para abrir o lobby de jogos."
            : `${zone.label} ativo. Aperte Enter para interagir.`
        : "Explore o salão. O garçom no centro abre todos os jogos."
    });
  }

  exitToStreet() {
    if (this.isTransitioning) return;
    this.isTransitioning = true;
    this.targetPoint = null;
    this.targetMarker?.setVisible(false);
    this.input.enabled = false;
    this.player.setTint(0xb8ffd0);
    this.transitionLabel?.setAlpha(1);
    this.tweens.add({
      targets: [this.transitionVeil, this.transitionLabel],
      alpha: { from: 0, to: 1 },
      duration: 420,
      ease: "Sine.easeInOut"
    });
    this.tweens.add({
      targets: this.player,
      y: this.player.y + 10,
      duration: 180,
      yoyo: true,
      ease: "Sine.easeInOut"
    });
    this.cameras.main.once("camerafadeoutcomplete", () => {
      this.player.clearTint();
      closePanel();
      this.scene.start("street-scene");
    });
    this.cameras.main.fadeOut(460, 5, 12, 8);
    updateGameState({
      currentScene: "interior",
      focus: "saida para rua",
      objective: "Transicao para a rua",
            prompt: "Voltando para a rua..."
    });
  }
}
