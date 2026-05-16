import { GAME_HEIGHT, GAME_WIDTH, STREET_BOUNDS } from "../config/gameConfig.js";
import { PUBPAID_TEXTURE_KEYS, PUBPAID_WORLD_SCALE, fitImageToHeight } from "../core/assetRegistry.js";
import { NERD_TEAM, formatNerdAgent } from "../config/nerdTeam.js";
import { openPanel } from "../ui/panelActions.js";
import { gameState, updateGameState } from "../core/gameState.js";

const TERMINAL_PANEL = {
  kicker: "terminal",
  title: "Missões locais",
  body: "Terminal pronto para receber missões, contratos rápidos e chamadas de carteira. Por enquanto ele marca o ponto principal no mapa da rua.",
  chips: ["missoes", "atalho rapido", "carteira em seguida"],
  actions: [{ id: "close-panel", label: "Fechar", primary: true }]
};

const GOOGLE_PANEL = {
  kicker: "google port",
  title: "Login em espera",
  body: "Google Port está parado para os experimentos locais. Quando o modo real estiver ativo, este ponto abre a conexão da conta.",
  chips: ["google", "modo local", "sem bloqueio"],
  actions: [{ id: "close-panel", label: "Fechar", primary: true }]
};

const STREET_RAIN_DROPS = [
  { x: 72, y: 318, length: 30, speed: 7.2, alpha: 0.1 },
  { x: 156, y: 402, length: 36, speed: 8.4, alpha: 0.14 },
  { x: 238, y: 284, length: 24, speed: 6.8, alpha: 0.09 },
  { x: 326, y: 538, length: 38, speed: 9.6, alpha: 0.18 },
  { x: 412, y: 356, length: 28, speed: 7.8, alpha: 0.12 },
  { x: 504, y: 646, length: 40, speed: 10.2, alpha: 0.2 },
  { x: 590, y: 300, length: 26, speed: 7.1, alpha: 0.11 },
  { x: 676, y: 492, length: 34, speed: 8.9, alpha: 0.16 },
  { x: 758, y: 378, length: 32, speed: 8.1, alpha: 0.13 },
  { x: 842, y: 590, length: 38, speed: 9.9, alpha: 0.19 },
  { x: 926, y: 330, length: 24, speed: 6.9, alpha: 0.1 },
  { x: 1014, y: 454, length: 30, speed: 8.6, alpha: 0.15 },
  { x: 1098, y: 676, length: 36, speed: 10.5, alpha: 0.18 },
  { x: 1180, y: 416, length: 28, speed: 7.6, alpha: 0.12 },
  { x: 64, y: 628, length: 40, speed: 10.1, alpha: 0.17 },
  { x: 210, y: 520, length: 26, speed: 7.4, alpha: 0.11 },
  { x: 372, y: 692, length: 34, speed: 9.4, alpha: 0.16 },
  { x: 548, y: 448, length: 30, speed: 8.2, alpha: 0.13 },
  { x: 712, y: 632, length: 38, speed: 9.8, alpha: 0.18 },
  { x: 884, y: 280, length: 24, speed: 6.7, alpha: 0.09 },
  { x: 1048, y: 566, length: 36, speed: 9.2, alpha: 0.15 },
  { x: 1216, y: 352, length: 32, speed: 8.5, alpha: 0.14 }
];

const STREET_RAIN_RESET_POINTS = [
  { x: 86, y: 248 },
  { x: 244, y: 280 },
  { x: 402, y: 252 },
  { x: 560, y: 306 },
  { x: 718, y: 264 },
  { x: 876, y: 292 },
  { x: 1034, y: 244 },
  { x: 1192, y: 316 }
];

const STREET_MAP = {
  walkableAreas: [
    { id: "main-sidewalk", x: 34, y: 394, width: 1212, height: 168 },
    { id: "curb-lane-edge", x: 34, y: 562, width: 1212, height: 92 }
  ],
  blockedAreas: [
    { id: "building-front", kind: "building", x: 0, y: 0, width: 1280, height: 386 },
    { id: "terminal-kiosk", kind: "prop", x: 46, y: 386, width: 132, height: 118 },
    { id: "bus-shelter", kind: "prop", x: 936, y: 360, width: 226, height: 142 },
    { id: "door-threshold", kind: "door", x: 254, y: 398, width: 92, height: 116 }
  ],
  doors: [
    { id: "pubpaid-main-door", x: 300, y: 486, approach: { x: 300, y: 526 } }
  ],
  pedestrianRoutes: [],
  trafficLanes: [
    { id: "teal-hatch-east", y: 656, startX: -220, endX: 1460, direction: 1, frameStart: 0, width: 230, height: 116, duration: 9400, delay: 280, depth: 2.05 },
    { id: "amber-sedan-west", y: 610, startX: 1450, endX: -240, direction: -1, frameStart: 4, width: 236, height: 118, duration: 11200, delay: 3300, depth: 1.72 }
  ],
  lightingZones: [
    { id: "pub-neon", x: 474, y: 188, width: 388, height: 166, color: "cyan-magenta" },
    { id: "bus-stop-lamp", x: 944, y: 352, width: 212, height: 220, color: "warm" },
    { id: "wet-road-reflection", x: 0, y: 578, width: 1280, height: 132, color: "blue-pink" }
  ]
};

export class StreetScene extends Phaser.Scene {
  constructor() {
    super("street-scene");
    this.player = null;
    this.targetMarker = null;
    this.targetPoint = null;
    this.cursors = null;
    this.interactionCooldown = 0;
    this.googlePortSign = null;
    this.doorHotspot = null;
    this.terminalHotspot = null;
    this.activeHotspot = null;
    this.hotspots = [];
    this.neonWash = null;
    this.streetMist = null;
    this.rainLines = [];
    this.reflectionBands = [];
    this.sideGlow = null;
    this.isTransitioning = false;
    this.doorReadyGlow = null;
    this.transitionVeil = null;
    this.transitionLabel = null;
    this.pedestrians = [];
    this.vehicles = [];
    this.streetSfxTimer = null;
    this.pendingDoorEntry = false;
    this.streetMapWarnings = [];
    this.playerDirection = "down";
  }

  create() {
    this.game.events.emit("pubpaid:music-zone", "street");
    this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, "street-bg").setDisplaySize(GAME_WIDTH, GAME_HEIGHT);
    this.buildAmbientStreetFx();
    this.buildStreetLife();
    this.googlePortSign = this.buildGooglePortSign(1056, 512);
    this.transitionVeil = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x04060d, 0)
      .setDepth(20)
      .setScrollFactor(0);
    this.transitionLabel = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 16, "ENTRANDO NO SALAO", {
      fontFamily: "Courier New, Lucida Console, monospace",
      fontSize: "20px",
      fontStyle: "bold",
      color: "#fff2d3",
      stroke: "#05070d",
      strokeThickness: 5
    }).setOrigin(0.5).setLetterSpacing(4).setDepth(21).setScrollFactor(0).setAlpha(0);
    this.doorHotspot = this.buildHotspot({
      id: "door",
      x: 300,
      y: 486,
      width: 118,
      height: 178,
      color: 0xffd06d,
      label: "ENTRADA"
    });
    this.terminalHotspot = this.buildHotspot({
      id: "terminal",
      x: 108,
      y: 446,
      width: 106,
      height: 132,
      color: 0x50efff,
      label: "TERMINAL"
    });
    this.hotspots = [this.doorHotspot, this.terminalHotspot, this.googlePortSign];
    this.validateStreetMap();

    this.player = this.buildPlayer(176, 560);
    this.targetMarker = this.add.circle(this.player.x, this.player.y, 10, 0x50efff, 0.25).setVisible(false);

    this.cameras.main.setBounds(0, 0, GAME_WIDTH, GAME_HEIGHT);
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);

    this.scale.on("resize", this.handleResize, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off("resize", this.handleResize, this);
      this.streetSfxTimer?.remove(false);
    });
    this.handleResize(this.scale.gameSize);

    this.input.on("pointerdown", (pointer) => {
      const worldPoint = pointer.positionToCamera(this.cameras.main);
      const hit = this.findHotspotAt(worldPoint.x, worldPoint.y);
      if (hit) {
        this.handleHotspot(hit);
        return;
      }
      this.pendingDoorEntry = false;
      const target = this.resolveStreetPoint(worldPoint.x, worldPoint.y);
      this.targetPoint = new Phaser.Math.Vector2(target.x, target.y);
      this.pendingDoorEntry = Phaser.Math.Distance.Between(this.targetPoint.x, this.targetPoint.y, 300, 486) < 88;
      this.targetMarker.setPosition(this.targetPoint.x, this.targetPoint.y).setVisible(true);
      updateGameState({
        currentScene: "street",
        focus: "rua principal",
        objective: "Aproximar da porta principal",
        nerdAgent: formatNerdAgent(NERD_TEAM.physics),
        streetMap: this.getStreetMapSnapshot(),
        streetMapWarnings: this.streetMapWarnings,
        prompt: "Destino marcado. Caminhe até a porta principal; a rua voltou a usar arte pixel aprovada."
      });
    });

    this.cursors = this.input.keyboard.createCursorKeys();
    this.input.keyboard.on("keydown-W", () => this.nudgePlayer(0, -40));
    this.input.keyboard.on("keydown-A", () => this.nudgePlayer(-40, 0));
    this.input.keyboard.on("keydown-S", () => this.nudgePlayer(0, 40));
    this.input.keyboard.on("keydown-D", () => this.nudgePlayer(40, 0));
    this.input.keyboard.on("keydown-ENTER", () => this.tryDoorInteraction());
    this.input.keyboard.on("keydown-E", () => this.tryNearestHotspot());

    updateGameState({
      currentScene: "street",
      focus: "porta principal",
      objective: "Entrar no PubPaid pela porta principal",
      nerdAgent: formatNerdAgent(NERD_TEAM.engine),
      streetMap: this.getStreetMapSnapshot(),
      streetMapWarnings: this.streetMapWarnings,
      prompt: "Clique na rua para mover. Entre pela porta ou use a saída para alternar entre rua e salão."
    });
  }

  buildAmbientStreetFx() {
    this.neonWash = this.add.rectangle(708, 286, 420, 150, 0x50efff, 0.08)
      .setBlendMode(Phaser.BlendModes.SCREEN)
      .setDepth(1.3);
    const magentaWash = this.add.rectangle(658, 314, 360, 120, 0xff4fb8, 0.05)
      .setBlendMode(Phaser.BlendModes.SCREEN)
      .setDepth(1.31);
    this.sideGlow = this.add.rectangle(1044, 462, 176, 184, 0xffd06d, 0.04)
      .setBlendMode(Phaser.BlendModes.SCREEN)
      .setDepth(1.25);
    this.streetMist = this.add.rectangle(646, 606, 1120, 170, 0x78d4ff, 0.035)
      .setBlendMode(Phaser.BlendModes.SCREEN)
      .setDepth(1.2);

    this.tweens.add({
      targets: [this.neonWash, magentaWash],
      alpha: { from: 0.03, to: 0.14 },
      duration: 1900,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut"
    });
    this.tweens.add({
      targets: this.sideGlow,
      alpha: { from: 0.02, to: 0.1 },
      duration: 1400,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut"
    });
    this.tweens.add({
      targets: this.streetMist,
      alpha: { from: 0.015, to: 0.06 },
      duration: 2200,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut"
    });

    const rainLayer = this.add.graphics().setDepth(1.4);
    this.rainLines = STREET_RAIN_DROPS.map((drop) => ({ ...drop }));
    rainLayer.ppgRainLayer = true;
    this.rainLines.graphics = rainLayer;

    const reflectionLayer = this.add.graphics().setDepth(1.15);
    this.reflectionBands = [
      { x: 548, y: 598, width: 112, height: 10, color: 0x50efff, alpha: 0.2, speed: 0.012 },
      { x: 646, y: 612, width: 124, height: 12, color: 0xff4fb8, alpha: 0.18, speed: 0.016 },
      { x: 770, y: 604, width: 136, height: 11, color: 0xffd06d, alpha: 0.16, speed: 0.014 },
      { x: 1002, y: 632, width: 96, height: 9, color: 0x50efff, alpha: 0.14, speed: 0.011 }
    ];
    reflectionLayer.ppgReflectionLayer = true;
    this.reflectionBands.graphics = reflectionLayer;
  }

  buildStreetLife() {
    this.buildTraffic();
    this.streetSfxTimer = null;
  }

  buildTraffic() {
    if (!this.textures.exists(PUBPAID_TEXTURE_KEYS.trafficVehicles)) return;
    STREET_MAP.trafficLanes.forEach((lane, index) => {
      const vehicle = this.add.container(lane.startX, lane.y).setDepth(lane.depth);
      const shadow = this.add.ellipse(0, 28, lane.width * 0.62, 17, 0x000000, 0.22)
        .setBlendMode(Phaser.BlendModes.MULTIPLY);
      const car = this.add.sprite(0, 0, PUBPAID_TEXTURE_KEYS.trafficVehicles, lane.frameStart)
        .setOrigin(0.5, 0.72)
        .setDisplaySize(lane.width, lane.height)
        .setFlipX(lane.direction < 0);
      vehicle.add([shadow, car]);
      vehicle.ppgTraffic = { id: lane.id, spriteOnly: true, textureKey: PUBPAID_TEXTURE_KEYS.trafficVehicles };
      this.vehicles.push(vehicle);
      this.tweens.add({
        targets: car,
        duration: 520,
        repeat: -1,
        ease: "Steps",
        onRepeat: () => {
          const currentFrame = Number(car.frame.name) || lane.frameStart;
          const nextFrame = lane.frameStart + ((currentFrame - lane.frameStart + 1) % 4);
          car.setFrame(nextFrame);
        }
      });
      this.tweens.add({
        targets: vehicle,
        x: lane.endX,
        duration: lane.duration,
        delay: lane.delay + index * 420,
        repeat: -1,
        ease: "Linear",
        onRepeat: () => {
          vehicle.x = lane.startX;
        }
      });
    });
  }

  buildHotspot({ id, x, y, width, height, color, label }) {
    const container = this.add.container(x, y).setDepth(2);
    const glow = this.add.rectangle(0, 0, width + 10, height + 10, color, 0.06)
      .setBlendMode(Phaser.BlendModes.SCREEN);
    const softGlow = this.add.ellipse(0, 0, width + 36, height + 28, color, 0.03)
      .setBlendMode(Phaser.BlendModes.SCREEN);
    const outline = this.add.graphics();
    this.drawPixelFrame(outline, width, height, color, 0.42);
    const text = this.add.text(0, -height / 2 - 18, label, {
      fontFamily: "Courier New, Lucida Console, monospace",
      fontSize: "12px",
      fontStyle: "bold",
      color: "#fff6dc",
      stroke: "#03050b",
      strokeThickness: 3
    }).setOrigin(0.5).setLetterSpacing(2).setAlpha(0.9);
    const pulse = this.add.rectangle(0, 0, width - 14, height - 14, color, 0.02)
      .setBlendMode(Phaser.BlendModes.SCREEN);
    const doorReadyGlow = id === "door"
      ? this.add.ellipse(0, height / 2 - 4, width + 32, 28, color, 0.02)
        .setBlendMode(Phaser.BlendModes.SCREEN)
        .setAlpha(0.03)
      : null;

    container.add([softGlow, glow, pulse, outline, text]);
    if (doorReadyGlow) {
      this.doorReadyGlow = doorReadyGlow;
      container.addAt(doorReadyGlow, 0);
    }
    container.setSize(width, height);
    container.ppgHotspot = { id, x, y, width, height, glow, softGlow, pulse, outline, text, color };
    container.setInteractive(new Phaser.Geom.Rectangle(-width / 2, -height / 2, width, height), Phaser.Geom.Rectangle.Contains);
    container.on("pointerover", () => this.setActiveHotspot(container));
    container.on("pointerout", () => {
      if (this.activeHotspot === container) this.setActiveHotspot(null);
    });
    container.on("pointerdown", (_pointer, _localX, _localY, event) => {
      event?.stopPropagation?.();
      this.handleHotspot(container);
    });
    return container;
  }

  drawPixelFrame(graphics, width, height, color, alpha) {
    graphics.clear();
    graphics.lineStyle(2, color, alpha);
    const halfW = width / 2;
    const halfH = height / 2;
    const cut = 10;
    graphics.strokePoints([
      new Phaser.Geom.Point(-halfW + cut, -halfH),
      new Phaser.Geom.Point(halfW - cut, -halfH),
      new Phaser.Geom.Point(halfW, -halfH + cut),
      new Phaser.Geom.Point(halfW, halfH - cut),
      new Phaser.Geom.Point(halfW - cut, halfH),
      new Phaser.Geom.Point(-halfW + cut, halfH),
      new Phaser.Geom.Point(-halfW, halfH - cut),
      new Phaser.Geom.Point(-halfW, -halfH + cut)
    ], true);
  }

  buildGooglePortSign(x, y) {
    const sign = this.add.container(x, y).setDepth(3);
    const glow = this.add.rectangle(0, 0, 302, 92, 0x50efff, 0.07)
      .setBlendMode(Phaser.BlendModes.SCREEN);
    const glowAura = this.add.ellipse(0, 0, 352, 126, 0x50efff, 0.035)
      .setBlendMode(Phaser.BlendModes.SCREEN);
    const magentaAura = this.add.ellipse(10, -8, 286, 88, 0xff4fb8, 0.022)
      .setBlendMode(Phaser.BlendModes.SCREEN);
    const plaque = this.add.graphics();
    plaque.fillStyle(0x080b14, 0.88);
    plaque.fillPoints([
      new Phaser.Geom.Point(-136, -30),
      new Phaser.Geom.Point(136, -30),
      new Phaser.Geom.Point(152, -10),
      new Phaser.Geom.Point(152, 26),
      new Phaser.Geom.Point(136, 36),
      new Phaser.Geom.Point(-136, 36),
      new Phaser.Geom.Point(-152, 26),
      new Phaser.Geom.Point(-152, -10)
    ], true);
    plaque.lineStyle(4, 0xbda37e, 0.52);
    plaque.strokePoints([
      new Phaser.Geom.Point(-136, -30),
      new Phaser.Geom.Point(136, -30),
      new Phaser.Geom.Point(152, -10),
      new Phaser.Geom.Point(152, 26),
      new Phaser.Geom.Point(136, 36),
      new Phaser.Geom.Point(-136, 36),
      new Phaser.Geom.Point(-152, 26),
      new Phaser.Geom.Point(-152, -10)
    ], true);
    plaque.lineStyle(1, 0x50efff, 0.16);
    for (let row = -22; row <= 24; row += 8) {
      plaque.lineBetween(-124, row, 124, row);
    }
    plaque.fillStyle(0x50efff, 0.08);
    plaque.fillRoundedRect(-120, -10, 22, 32, 2);
    plaque.fillRoundedRect(98, -10, 22, 32, 2);

    const kicker = this.add.text(0, -48, "GOOGLE PORT", {
      fontFamily: "Courier New, Lucida Console, monospace",
      fontSize: "14px",
      fontStyle: "bold",
      color: "#7feeff"
    }).setOrigin(0.5).setLetterSpacing(4).setAlpha(0.92);
    const label = this.add.text(0, 2, "ENTRAR COM GOOGLE", {
      fontFamily: "Courier New, Lucida Console, monospace",
      fontSize: "20px",
      fontStyle: "bold",
      color: "#fff3da",
      stroke: "#03050b",
      strokeThickness: 5
    }).setOrigin(0.5).setLetterSpacing(2);
    const status = this.add.text(0, 48, "EM ESPERA. TESTES LOCAIS LIBERADOS.", {
      fontFamily: "Courier New, Lucida Console, monospace",
      fontSize: "10px",
      color: "#aab7d0"
    }).setOrigin(0.5).setLetterSpacing(2);
    const spark = this.add.graphics().setBlendMode(Phaser.BlendModes.SCREEN);
    spark.fillStyle(0x50efff, 0.32);
    spark.fillRect(-62, -6, 10, 2);
    spark.fillRect(-58, -10, 2, 10);
    spark.fillStyle(0xffd06d, 0.24);
    spark.fillRect(54, -3, 8, 2);
    spark.fillRect(57, -6, 2, 8);

    sign.add([glowAura, magentaAura, glow, plaque, spark, kicker, label, status]);
    sign.setSize(296, 92);
    sign.ppgHotspot = { id: "google", x, y, width: 296, height: 92, glow, softGlow: glowAura, pulse: spark, label, status, color: 0x50efff };
    sign.setInteractive(new Phaser.Geom.Rectangle(-148, -46, 296, 92), Phaser.Geom.Rectangle.Contains);
    sign.on("pointerdown", (_pointer, _localX, _localY, event) => {
      event?.stopPropagation?.();
      this.handleHotspot(sign);
    });
    this.tweens.add({
      targets: glow,
      alpha: { from: 0.04, to: 0.16 },
      duration: 1100,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut"
    });
    this.tweens.add({
      targets: [glowAura, magentaAura, spark],
      alpha: { from: 0.02, to: 0.12 },
      duration: 1600,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut"
    });
    return sign;
  }

  getStreetMapSnapshot() {
    return {
      walkableAreas: STREET_MAP.walkableAreas.map((area) => ({ ...area })),
      blockedAreas: STREET_MAP.blockedAreas.map((area) => ({ ...area })),
      doors: STREET_MAP.doors.map((door) => ({ ...door, approach: { ...door.approach } })),
      pedestrianRoutes: [],
      trafficLanes: STREET_MAP.trafficLanes.map((lane) => ({ ...lane })),
      lightingZones: STREET_MAP.lightingZones.map((zone) => ({ ...zone }))
    };
  }

  validateStreetMap() {
    const warnings = [];
    STREET_MAP.doors.forEach((door) => {
      if (!this.isStreetWalkable(door.approach.x, door.approach.y, 4)) warnings.push(`door-${door.id}-approach-blocked`);
    });
    this.streetMapWarnings = warnings;
  }

  getStreetBlockingArea(x, y, padding = 0) {
    return STREET_MAP.blockedAreas.find((area) => (
      x >= area.x - padding
      && x <= area.x + area.width + padding
      && y >= area.y - padding
      && y <= area.y + area.height + padding
    )) || null;
  }

  isStreetWalkable(x, y, padding = 10) {
    const insideBounds = x >= STREET_BOUNDS.minX
      && x <= STREET_BOUNDS.maxX
      && y >= STREET_BOUNDS.minY
      && y <= STREET_BOUNDS.maxY;
    return insideBounds && !this.getStreetBlockingArea(x, y, padding);
  }

  resolveStreetPoint(x, y) {
    const clamped = {
      x: Phaser.Math.Clamp(x, STREET_BOUNDS.minX, STREET_BOUNDS.maxX),
      y: Phaser.Math.Clamp(y, STREET_BOUNDS.minY, STREET_BOUNDS.maxY)
    };
    if (this.isStreetWalkable(clamped.x, clamped.y, 10)) return clamped;
    const blocked = this.getStreetBlockingArea(clamped.x, clamped.y, 10);
    const edgeCandidates = blocked
      ? [
          { x: blocked.x - 22, y: Phaser.Math.Clamp(clamped.y, STREET_BOUNDS.minY, STREET_BOUNDS.maxY) },
          { x: blocked.x + blocked.width + 22, y: Phaser.Math.Clamp(clamped.y, STREET_BOUNDS.minY, STREET_BOUNDS.maxY) },
          { x: Phaser.Math.Clamp(clamped.x, STREET_BOUNDS.minX, STREET_BOUNDS.maxX), y: blocked.y + blocked.height + 22 },
          { x: Phaser.Math.Clamp(clamped.x, STREET_BOUNDS.minX, STREET_BOUNDS.maxX), y: blocked.y - 22 }
        ]
      : [];
    const doorPoints = STREET_MAP.doors.map((door) => door.approach);
    const candidates = [...edgeCandidates, ...doorPoints]
      .filter((point) => this.isStreetWalkable(point.x, point.y, 10));
    candidates.sort((a, b) => (
      Phaser.Math.Distance.Between(clamped.x, clamped.y, a.x, a.y)
      - Phaser.Math.Distance.Between(clamped.x, clamped.y, b.x, b.y)
    ));
    return candidates[0] || { x: this.player?.x || 176, y: this.player?.y || 560 };
  }

  moveStreetPlayerBy(dx, dy) {
    const direct = this.resolveStreetStep(this.player.x + dx, this.player.y + dy);
    if (direct) {
      this.player.setPosition(direct.x, direct.y);
      return true;
    }
    const xOnly = this.resolveStreetStep(this.player.x + dx, this.player.y);
    if (xOnly) {
      this.player.setPosition(xOnly.x, xOnly.y);
      return true;
    }
    const yOnly = this.resolveStreetStep(this.player.x, this.player.y + dy);
    if (yOnly) {
      this.player.setPosition(yOnly.x, yOnly.y);
      return true;
    }
    return false;
  }

  resolveStreetStep(x, y) {
    const clamped = {
      x: Phaser.Math.Clamp(x, STREET_BOUNDS.minX, STREET_BOUNDS.maxX),
      y: Phaser.Math.Clamp(y, STREET_BOUNDS.minY, STREET_BOUNDS.maxY)
    };
    return this.isStreetWalkable(clamped.x, clamped.y, 12) ? clamped : null;
  }

  findHotspotAt(x, y) {
    return this.hotspots.find((hotspot) => {
      const data = hotspot.ppgHotspot;
      if (!data) return false;
      return (
        x >= data.x - data.width / 2 &&
        x <= data.x + data.width / 2 &&
        y >= data.y - data.height / 2 &&
        y <= data.y + data.height / 2
      );
    });
  }

  setActiveHotspot(hotspot) {
    this.activeHotspot = hotspot;
    this.hotspots.forEach((item) => {
      const data = item.ppgHotspot;
      if (!data?.glow) return;
      data.glow.setAlpha(item === hotspot ? 0.22 : 0.08);
      data.softGlow?.setAlpha(item === hotspot ? 0.12 : 0.03);
      data.pulse?.setAlpha(item === hotspot ? 0.22 : 0.04);
      data.text?.setAlpha(item === hotspot ? 1 : 0.9);
      data.label?.setAlpha(item === hotspot ? 1 : 0.92);
      data.status?.setAlpha(item === hotspot ? 0.96 : 0.82);
    });
  }

  handleHotspot(hotspot) {
    if (this.isTransitioning) return;
    const id = hotspot.ppgHotspot?.id;
    if (id === "door") {
      if (Phaser.Math.Distance.Between(this.player.x, this.player.y, 300, 486) < 74) {
        this.enterInterior();
        return;
      }
      this.pendingDoorEntry = true;
      const doorApproach = STREET_MAP.doors[0].approach;
      this.targetPoint = new Phaser.Math.Vector2(doorApproach.x, doorApproach.y);
      this.targetMarker.setPosition(doorApproach.x, doorApproach.y).setVisible(true);
      updateGameState({
        focus: "entrada",
        objective: "Entrar no salão",
        nerdAgent: formatNerdAgent(NERD_TEAM.engine),
        prompt: "Entrada marcada. Chegue perto e aperte Enter para atravessar."
      });
      return;
    }

    if (id === "terminal") {
      openPanel(TERMINAL_PANEL);
      updateGameState({
        focus: "terminal de missoes",
        objective: "Preparar missões locais",
        nerdAgent: formatNerdAgent(NERD_TEAM.hud),
        prompt: "Terminal local aberto. A camada de missões entra aqui."
      });
      return;
    }

    if (id === "google") {
      openPanel(GOOGLE_PANEL);
      this.game.events.emit("pubpaid:google-port-click");
      updateGameState({
        focus: "google port",
        objective: "Google em espera para experimento local",
        nerdAgent: formatNerdAgent(NERD_TEAM.hud),
        prompt: "Google Port parado. Testes locais continuam liberados."
      });
    }
  }

  buildPlayer(x, y) {
    const player = this.add.container(x, y).setDepth(2.42);
    const shadow = this.add.ellipse(0, 2, 48, 11, 0x000000, 0.2)
      .setBlendMode(Phaser.BlendModes.MULTIPLY);
    const rig = this.getPlayerRig();
    const sprite = this.add.sprite(0, 0, rig.idleBreatheKey, 0)
      .setOrigin(0.5, 1);
    fitImageToHeight(sprite, PUBPAID_WORLD_SCALE.adultForegroundPx);
    sprite.ppgBaseScaleX = sprite.scaleX;
    sprite.ppgBaseScaleY = sprite.scaleY;
    player.ppgSprite = sprite;
    player.ppgFacing = 0;
    player.ppgCharacter = rig.id;
    player.ppgLastMoveAt = this.time.now || 0;
    player.add([shadow, sprite]);
    return player;
  }

  getPlayerRig() {
    const female = gameState.selectedCharacter?.id === "female";
    return female
      ? {
          id: "female",
          walkKey: PUBPAID_TEXTURE_KEYS.playerFemaleWalk,
          idleBreatheKey: PUBPAID_TEXTURE_KEYS.playerFemaleIdleBreathe,
          idlePhoneKey: PUBPAID_TEXTURE_KEYS.playerFemaleIdlePhone
        }
      : {
          id: "male",
          walkKey: PUBPAID_TEXTURE_KEYS.playerMaleWalk,
          idleBreatheKey: PUBPAID_TEXTURE_KEYS.playerMaleIdleBreathe,
          idlePhoneKey: PUBPAID_TEXTURE_KEYS.playerMaleIdlePhone
        };
  }

  getFacingIndex(vectorX, vectorY) {
    const angle = Phaser.Math.RadToDeg(Math.atan2(vectorY, vectorX));
    if (angle >= 67.5 && angle < 112.5) return 0;
    if (angle >= 22.5 && angle < 67.5) return 1;
    if (angle >= -22.5 && angle < 22.5) return 2;
    if (angle >= -67.5 && angle < -22.5) return 3;
    if (angle >= -112.5 && angle < -67.5) return 4;
    if (angle >= -157.5 && angle < -112.5) return 5;
    if (angle >= 157.5 || angle < -157.5) return 6;
    return 7;
  }

  directionFromVector(vectorX, vectorY) {
    const vertical = vectorY < -0.35 ? "up" : vectorY > 0.35 ? "down" : "";
    const horizontal = vectorX < -0.35 ? "left" : vectorX > 0.35 ? "right" : "";
    return [vertical, horizontal].filter(Boolean).join("-") || this.playerDirection || "down";
  }

  updatePlayerMotion(vectorX = 0, vectorY = 0, moving = false) {
    const sprite = this.player?.ppgSprite;
    if (!sprite) return;
    const baseScaleX = sprite.ppgBaseScaleX || sprite.scaleX || 1;
    const baseScaleY = sprite.ppgBaseScaleY || sprite.scaleY || 1;
    const rig = this.getPlayerRig();
    if (this.player.ppgCharacter !== rig.id) {
      this.player.ppgCharacter = rig.id;
      this.player.ppgFacing = 0;
      sprite.setTexture(rig.idleBreatheKey, 0);
    }
    if (!moving) {
      sprite.setY(0);
      sprite.setRotation(0);
      sprite.setScale(baseScaleX, baseScaleY);
      const idleMs = Math.max(0, (this.time.now || 0) - (this.player.ppgLastMoveAt || 0));
      const idleKey = idleMs > 2600 ? rig.idlePhoneKey : rig.idleBreatheKey;
      if (sprite.texture.key !== idleKey) sprite.setTexture(idleKey);
      const idleFrame = Math.floor((this.time.now || 0) / 240) % 4;
      sprite.setFrame((this.player.ppgFacing || 0) * 4 + idleFrame);
      updateGameState({ playerMoving: false, playerDirection: this.playerDirection });
      return;
    }
    this.playerDirection = this.directionFromVector(vectorX, vectorY);
    this.player.ppgLastMoveAt = this.time.now || 0;
    this.player.ppgFacing = this.getFacingIndex(vectorX, vectorY);
    if (sprite.texture.key !== rig.walkKey) sprite.setTexture(rig.walkKey);
    const walkFrame = Math.floor((this.time.now || 0) / 120) % 4;
    sprite.setFrame(this.player.ppgFacing * 4 + walkFrame);
    sprite.setY(0);
    sprite.setRotation(0);
    sprite.setScale(baseScaleX, baseScaleY);
    updateGameState({ playerMoving: true, playerDirection: this.playerDirection });
  }

  handleResize(gameSize) {
    if (!gameSize || !this.cameras?.main) return;
    this.cameras.main.setZoom(gameSize.width < 700 ? 0.82 : 1);
  }

  nudgePlayer(dx, dy) {
    this.pendingDoorEntry = false;
    const target = this.resolveStreetPoint(this.player.x + dx, this.player.y + dy);
    this.targetPoint = new Phaser.Math.Vector2(target.x, target.y);
    this.targetMarker.setPosition(this.targetPoint.x, this.targetPoint.y).setVisible(true);
  }

  tryDoorInteraction() {
    const now = this.time.now;
    if (this.isTransitioning || now < this.interactionCooldown) return;
    this.interactionCooldown = now + 250;

    const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, 300, 486);
    if (distance < 74) {
      this.enterInterior();
      return;
    }
    updateGameState({
      focus: "calçada",
      objective: "Chegar mais perto da entrada",
      nerdAgent: formatNerdAgent(NERD_TEAM.physics),
      prompt: "Chegue mais perto da porta para entrar no salão definitivo em Phaser."
    });
  }

  tryNearestHotspot() {
    if (this.isTransitioning) return;
    const nearest = this.hotspots
      .map((hotspot) => ({
        hotspot,
        distance: Phaser.Math.Distance.Between(
          this.player.x,
          this.player.y,
          hotspot.ppgHotspot.x,
          hotspot.ppgHotspot.y
        )
      }))
      .sort((a, b) => a.distance - b.distance)[0];
    if (nearest && nearest.distance < 110) {
      this.handleHotspot(nearest.hotspot);
    }
  }

  update() {
    if (this.isTransitioning) {
      return;
    }
    const keyboardVector = new Phaser.Math.Vector2(0, 0);
    if (this.cursors.left.isDown) keyboardVector.x -= 1;
    if (this.cursors.right.isDown) keyboardVector.x += 1;
    if (this.cursors.up.isDown) keyboardVector.y -= 1;
    if (this.cursors.down.isDown) keyboardVector.y += 1;
    const mobileVector = window.pubpaidMobileInput?.getVector?.() || { x: 0, y: 0 };
    keyboardVector.x += mobileVector.x || 0;
    keyboardVector.y += mobileVector.y || 0;
    if (window.pubpaidMobileInput?.consumeAction?.()) {
      this.tryNearestHotspot();
    }

    let motionVector = new Phaser.Math.Vector2(0, 0);
    let playerMoved = false;
    if (keyboardVector.lengthSq() > 0) {
      keyboardVector.normalize();
      motionVector = keyboardVector.clone();
      keyboardVector.scale(2.6);
      playerMoved = this.moveStreetPlayerBy(keyboardVector.x, keyboardVector.y);
      this.targetPoint = null;
      this.targetMarker.setVisible(false);
    } else if (this.targetPoint) {
      const dx = this.targetPoint.x - this.player.x;
      const dy = this.targetPoint.y - this.player.y;
      const distance = Math.hypot(dx, dy);
      if (distance < 3) {
        this.player.setPosition(this.targetPoint.x, this.targetPoint.y);
        this.targetPoint = null;
        this.targetMarker.setVisible(false);
        if (this.pendingDoorEntry) {
          this.enterInterior();
          return;
        }
      } else {
        const speed = 2.8;
        motionVector = new Phaser.Math.Vector2(dx / distance, dy / distance);
        playerMoved = this.moveStreetPlayerBy(motionVector.x * speed, motionVector.y * speed);
        if (!playerMoved) {
          this.targetPoint = null;
          this.targetMarker.setVisible(false);
          updateGameState({
            prompt: "Caminho bloqueado por fachada ou mobiliário urbano. Escolha a calçada livre."
          });
          return;
        }
      }
    }
    this.updatePlayerMotion(motionVector.x, motionVector.y, playerMoved);

    const nearDoor = Phaser.Math.Distance.Between(this.player.x, this.player.y, 300, 486) < 74;
    const nearestHotspot = this.hotspots
      .map((hotspot) => ({
        hotspot,
        distance: Phaser.Math.Distance.Between(
          this.player.x,
          this.player.y,
          hotspot.ppgHotspot.x,
          hotspot.ppgHotspot.y
        )
      }))
      .sort((a, b) => a.distance - b.distance)[0];
    this.setActiveHotspot(nearestHotspot?.distance < 120 ? nearestHotspot.hotspot : null);
    if (this.doorReadyGlow) {
      this.doorReadyGlow.setAlpha(nearDoor ? 0.18 + Math.sin(this.time.now / 140) * 0.04 : 0.03);
      this.doorReadyGlow.setScale(1 + (nearDoor ? 0.04 : 0));
    }
    updateGameState({
      currentScene: "street",
      focus: nearDoor ? "porta principal" : "rua viva",
      objective: nearDoor ? "Apertar Enter para entrar" : "Entrar no PubPaid pela porta principal",
      nerdAgent: formatNerdAgent(nearDoor ? NERD_TEAM.engine : NERD_TEAM.physics),
      prompt: nearDoor
        ? "Porta encontrada. Aperte Enter para entrar no salão em Phaser."
        : nearestHotspot?.distance < 120
          ? "Ponto ativo perto. Aperte E ou clique para interagir."
          : "Rua viva carregada no núcleo definitivo. Explore ou siga para a porta."
    });

    const rainLayer = this.rainLines.graphics;
    if (rainLayer) {
      rainLayer.clear();
      this.rainLines.forEach((drop, index) => {
        drop.y += drop.speed;
        drop.x -= drop.speed * 0.32;
        if (drop.y > GAME_HEIGHT + 50 || drop.x < -30) {
          const reset = STREET_RAIN_RESET_POINTS[index % STREET_RAIN_RESET_POINTS.length];
          drop.y = reset.y;
          drop.x = reset.x;
        }
        rainLayer.lineStyle(1, 0xc7ebff, drop.alpha);
        rainLayer.lineBetween(drop.x, drop.y, drop.x + 7, drop.y - drop.length);
      });
    }

    const reflectionLayer = this.reflectionBands.graphics;
    if (reflectionLayer) {
      reflectionLayer.clear();
      this.reflectionBands.forEach((band, index) => {
        const pulse = (Math.sin(this.time.now * band.speed + index) + 1) * 0.5;
        reflectionLayer.fillStyle(band.color, band.alpha * (0.42 + pulse * 0.8));
        reflectionLayer.fillRoundedRect(
          band.x - band.width / 2 + Math.sin(this.time.now * 0.0015 + index) * 5,
          band.y,
          band.width,
          band.height,
          3
        );
      });
    }
  }

  enterInterior() {
    if (this.isTransitioning) return;
    this.isTransitioning = true;
    this.targetPoint = null;
    this.targetMarker?.setVisible(false);
    this.input.enabled = false;
    this.player.ppgSprite?.setTint(0xffe0ae);
    this.transitionLabel?.setAlpha(1);
    this.tweens.add({
      targets: [this.transitionVeil, this.transitionLabel],
      alpha: { from: 0, to: 1 },
      duration: 420,
      ease: "Sine.easeInOut"
    });
    this.tweens.add({
      targets: this.player,
      y: this.player.y - 10,
      duration: 180,
      yoyo: true,
      ease: "Sine.easeInOut"
    });
    this.cameras.main.once("camerafadeoutcomplete", () => {
      this.player.ppgSprite?.clearTint();
      this.scene.start("interior-scene");
    });
    this.cameras.main.fadeOut(460, 8, 12, 20);
    updateGameState({
      currentScene: "street",
      focus: "portal principal",
      objective: "Transicao para o salao",
      nerdAgent: formatNerdAgent(NERD_TEAM.engine),
      prompt: "Entrando no salao do PubPaid..."
    });
  }
}
