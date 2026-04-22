import { GAME_HEIGHT, GAME_WIDTH, INTERIOR_BOUNDS } from "../config/gameConfig.js";
import { addIdleSpriteActor, addSpriteActor, ensureCoreSprites, TEXTURE_KEYS } from "../core/spriteFactory.js";
import { NERD_TEAM, formatNerdAgent } from "../config/nerdTeam.js";
import { openPanel, runPanelAction } from "../ui/panelActions.js";
import { gameState, updateGameState } from "../core/gameState.js";

const INTERIOR_PANELS = {
  bartender: {
    kicker: "balcão",
    title: "Bartender operacional",
    body: "O bartender já virou um ponto real do núcleo: daqui saem recarga de teste, orientação de mesa e, depois, drinks e onboarding premium.",
    chips: ["tutorial", "drinks", "mesa sugerida", NERD_TEAM.hud.name],
    actions: [
      { id: "reset-test", label: "Recarregar teste", primary: true },
      { id: "suggest-darts", label: "Sugerir mesa" }
    ]
  },
  stage: {
    kicker: "palco",
    title: "Cantora ao vivo",
    body: "O palco agora é um nó de evento do salão. Ele pode ativar clima de noite, buff visual e chamadas para mesas ou torneios.",
    chips: ["evento", "buff visual", "crowd mood", NERD_TEAM.sprite.name],
    actions: [{ id: "toggle-stage-event", label: "Ativar evento", primary: true }]
  },
  west: {
    kicker: "lounge",
    title: "Mesa oeste",
    body: "A mesa oeste agora representa a fila casual e a camada de descoberta. É o espaço mais natural para Dama e onboarding social.",
    chips: ["fila casual", "dama", "descoberta", NERD_TEAM.engine.name],
    actions: [
      { id: "queue-casual", label: "Entrar na fila casual", primary: true },
      { id: "close-panel", label: "Fechar" }
    ]
  },
  east: {
    kicker: "premium",
    title: "Mesa leste",
    body: "A mesa leste é a ponta premium do salão. Ela já serve para simular espera social e foco em Poker como núcleo de mesa avançada.",
    chips: ["fila premium", "poker", "social", NERD_TEAM.qa.name],
    actions: [
      { id: "queue-premium", label: "Entrar na fila premium", primary: true },
      { id: "close-panel", label: "Fechar" }
    ]
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
  }

  create() {
    ensureCoreSprites(this);
    this.game.events.emit("pubpaid:music-zone", "salon");
    this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, "interior-bg").setDisplaySize(GAME_WIDTH, GAME_HEIGHT);
    this.buildAmbientFx();

    this.actors = [
      this.addActor(TEXTURE_KEYS.waiterHero, 176, 244, 1.05, 2400, 0xfff0c0),
      this.addActor(TEXTURE_KEYS.singer, 1058, 250, 1.1, 1600, 0xff7bd0),
      this.addActor(TEXTURE_KEYS.guestA, 320, 504, 1.02, 2100, 0x8ef0a3),
      this.addActor(TEXTURE_KEYS.guestB, 862, 492, 1.02, 2300, 0xffd06d)
    ];

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
      { id: "bartender", x: 180, y: 252, radius: 84, color: 0xffd06d, label: "BAR", objective: "Falar com o bartender" },
      { id: "stage", x: 1060, y: 242, radius: 84, color: 0xff4fb8, label: "PALCO", objective: "Ativar o palco" },
      { id: "west", x: 318, y: 490, radius: 84, color: 0x50efff, label: "LOUNGE", objective: "Abrir fila casual" },
      { id: "east", x: 860, y: 480, radius: 84, color: 0xffd06d, label: "PREMIUM", objective: "Abrir fila premium" },
      { id: "exit", x: 640, y: 580, radius: 96, color: 0x8ef0a3, label: "SAIDA", objective: "Voltar para a rua" }
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
        nerdAgent: formatNerdAgent(NERD_TEAM.physics),
        prompt: "Destino marcado dentro do salão. Aproxime-se de um ponto ativo e aperte Enter."
      });
    });

    updateGameState({
      currentScene: "interior",
      focus: "salão",
      objective: "Escolher um ponto ativo no salão",
      nerdAgent: formatNerdAgent(NERD_TEAM.hud),
      prompt: "Salão definitivo carregado. Bartender, palco, mesas lounge e saída já vivem em scene própria."
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
    const player = addSpriteActor(this, TEXTURE_KEYS.player, x, y, 1.12);
    player.setDepth(2.55);
    return player;
  }

  addActor(textureKey, x, y, scale, pulseDuration, glowColor) {
    const glow = this.add.ellipse(x, y - 8, 42 * scale, 18 * scale, glowColor, 0.1)
      .setBlendMode(Phaser.BlendModes.SCREEN)
      .setDepth(2.36);
    const actor = addIdleSpriteActor(this, textureKey, x, y, scale, {
      frameDuration: 220,
      delay: Math.floor((x + y) % 170)
    });
    actor.setDepth(2.45);
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
      nerdAgent: formatNerdAgent(zone.id === "stage" ? NERD_TEAM.sprite : zone.id === "exit" ? NERD_TEAM.engine : NERD_TEAM.physics),
      prompt:
        zone.id === "exit"
          ? "Saída marcada. Chegue perto e aperte Enter."
          : `${zone.label} marcado. Chegue perto e aperte Enter.`
    });
  }

  nudgePlayer(dx, dy) {
    this.targetPoint = new Phaser.Math.Vector2(
      Phaser.Math.Clamp(this.player.x + dx, INTERIOR_BOUNDS.minX, INTERIOR_BOUNDS.maxX),
      Phaser.Math.Clamp(this.player.y + dy, INTERIOR_BOUNDS.minY, INTERIOR_BOUNDS.maxY)
    );
    this.targetMarker.setPosition(this.targetPoint.x, this.targetPoint.y).setVisible(true);
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
    if (zoneId === "bartender") return "balcão do bartender";
    if (zoneId === "stage") return "palco da cantora";
    if (zoneId === "west") return "mesa lounge oeste";
    if (zoneId === "east") return "mesa lounge leste";
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
        prompt: "Chegue perto do balcão, palco, mesa oeste, mesa leste ou saída."
      });
      return;
    }

    if (zone.id === "exit") {
      this.exitToStreet();
      return;
    }

    openPanel(INTERIOR_PANELS[zone.id]);
    updateGameState({
      focus: this.getZoneLabel(zone.id),
      objective: "Escolher ação no painel",
      nerdAgent: formatNerdAgent(zone.id === "stage" ? NERD_TEAM.sprite : NERD_TEAM.hud)
    });
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

    if (keyboardVector.lengthSq() > 0) {
      keyboardVector.normalize().scale(2.6);
      this.player.x = Phaser.Math.Clamp(this.player.x + keyboardVector.x, INTERIOR_BOUNDS.minX, INTERIOR_BOUNDS.maxX);
      this.player.y = Phaser.Math.Clamp(this.player.y + keyboardVector.y, INTERIOR_BOUNDS.minY, INTERIOR_BOUNDS.maxY);
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
      } else {
        const speed = 2.8;
        this.player.x += (dx / distance) * speed;
        this.player.y += (dy / distance) * speed;
      }
    }

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

    updateGameState({
      currentScene: "interior",
      focus: zone ? this.getZoneLabel(zone.id) : "salão",
      objective: zone
        ? zone.id === "exit"
          ? "Voltar para a rua"
          : "Apertar Enter para interagir"
        : "Explorar pontos ativos do salão",
      nerdAgent: formatNerdAgent(zone ? zone.id === "stage" ? NERD_TEAM.sprite : NERD_TEAM.hud : NERD_TEAM.physics),
      prompt: zone
        ? zone.id === "exit"
          ? "Saída localizada. Aperte Enter para voltar para a rua."
          : `${zone.label} ativo. Aperte Enter para abrir a interface do núcleo.`
        : "Explore o salão definitivo em Phaser. Os pontos ativos brilham no mapa."
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
      runPanelAction("close-panel");
      this.scene.start("street-scene");
    });
    this.cameras.main.fadeOut(460, 5, 12, 8);
    updateGameState({
      currentScene: "interior",
      focus: "saida para rua",
      objective: "Transicao para a rua",
      nerdAgent: formatNerdAgent(NERD_TEAM.engine),
      prompt: "Voltando para a rua..."
    });
  }
}
