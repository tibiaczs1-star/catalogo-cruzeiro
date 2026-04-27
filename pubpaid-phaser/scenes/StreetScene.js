import { GAME_HEIGHT, GAME_WIDTH, STREET_BOUNDS } from "../config/gameConfig.js";
import { addIdleSpriteActor, ensureCoreSprites, PUBPAID_WORLD_SCALE, TEXTURE_KEYS } from "../core/spriteFactory.js";
import { NERD_TEAM, formatNerdAgent } from "../config/nerdTeam.js";
import { openPanel } from "../ui/panelActions.js";
import { updateGameState } from "../core/gameState.js";

const TERMINAL_PANEL = {
  kicker: "terminal",
  title: "Missões locais",
  body: "Terminal pronto para receber missões, contratos rápidos e chamadas de carteira. Por enquanto ele marca o ponto principal no mapa da rua.",
  chips: ["missoes", "atalho rapido", "carteira em seguida"],
  actions: [{ id: "close-panel", label: "Fechar", primary: true }]
};

const GOOGLE_PANEL = {
  kicker: "acesso google",
  title: "Login em espera",
  body: "Acesso Google está parado para os experimentos locais. Quando o modo real estiver ativo, este ponto abre a conexão da conta.",
  chips: ["google", "modo local", "sem bloqueio"],
  actions: [{ id: "close-panel", label: "Fechar", primary: true }]
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
  }

  create() {
    ensureCoreSprites(this);
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
      this.targetPoint = new Phaser.Math.Vector2(
        Phaser.Math.Clamp(worldPoint.x, STREET_BOUNDS.minX, STREET_BOUNDS.maxX),
        Phaser.Math.Clamp(worldPoint.y, STREET_BOUNDS.minY, STREET_BOUNDS.maxY)
      );
      this.targetMarker.setPosition(this.targetPoint.x, this.targetPoint.y).setVisible(true);
      updateGameState({
        currentScene: "street",
        focus: "rua principal",
        objective: "Aproximar da porta principal",
        nerdAgent: formatNerdAgent(NERD_TEAM.physics),
        prompt: "Destino marcado. Caminhe até a porta principal; a rua agora usa figurantes bitmap em escala controlada."
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
    for (let index = 0; index < 22; index += 1) {
      this.rainLines.push({
        x: Phaser.Math.Between(20, GAME_WIDTH - 20),
        y: Phaser.Math.Between(260, GAME_HEIGHT + 120),
        length: Phaser.Math.Between(22, 40),
        speed: Phaser.Math.FloatBetween(6.6, 10.8),
        alpha: Phaser.Math.FloatBetween(0.08, 0.2)
      });
    }
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
    const people = [
      { key: TEXTURE_KEYS.guestA, x: 94, y: 558, toX: 216, delay: 180, scale: 0.072, shadow: 50 },
      { key: TEXTURE_KEYS.guestA, x: 918, y: 558, toX: 812, delay: 620, scale: 0.066, shadow: 46 },
      { key: TEXTURE_KEYS.guestA, x: 682, y: 500, toX: 752, delay: 1200, scale: 0.052, shadow: 38 },
      { key: TEXTURE_KEYS.guestA, x: 1138, y: 578, toX: 1042, delay: 880, scale: 0.06, shadow: 42 }
    ];

    people.forEach((person, index) => {
      const sprite = addIdleSpriteActor(this, person.key, person.x, person.y, person.scale, {
        frameDuration: 260,
        delay: person.delay,
        staticBitmap: true
      });
      sprite.setDepth(person.y > 540 ? 2.25 : 1.62);
      sprite.setAlpha(0.88);
      sprite.setFlipX(person.toX < person.x);
      const shadow = this.add.ellipse(person.x, person.y + 2, person.shadow, person.shadow * 0.2, 0x000000, 0.22)
        .setDepth(sprite.depth - 0.02)
        .setBlendMode(Phaser.BlendModes.MULTIPLY);
      this.pedestrians.push({ sprite, shadow });
      this.tweens.add({
        targets: [sprite, shadow],
        x: person.toX,
        duration: 4200 + index * 540,
        delay: person.delay,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
        onYoyo: () => sprite.setFlipX(!sprite.flipX),
        onRepeat: () => sprite.setFlipX(!sprite.flipX)
      });
    });

    const scaleNote = this.add.text(18, 704, `escala adulta: player ~${PUBPAID_WORLD_SCALE.adultForegroundPx}px / porta ~${PUBPAID_WORLD_SCALE.doorHeightPx}px`, {
      fontFamily: "Courier New, Lucida Console, monospace",
      fontSize: "9px",
      color: "#8fa0ba",
      stroke: "#02050d",
      strokeThickness: 2
    }).setAlpha(0.36).setDepth(4).setScrollFactor(0);
    this.time.delayedCall(1800, () => {
      this.tweens.add({ targets: scaleNote, alpha: 0, duration: 900, ease: "Sine.easeOut" });
    });

    this.streetSfxTimer = null;
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

    const kicker = this.add.text(0, -48, "ACESSO GOOGLE", {
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
      this.targetPoint = new Phaser.Math.Vector2(300, 526);
      this.targetMarker.setPosition(300, 526).setVisible(true);
      updateGameState({
        focus: "entrada",
        objective: "Entrar no salão",
        nerdAgent: formatNerdAgent(NERD_TEAM.engine),
        prompt: "Entrada marcada. Chegue perto e aperte a tecla Entrar para atravessar."
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
        focus: "acesso google",
        objective: "Google em espera para experimento local",
        nerdAgent: formatNerdAgent(NERD_TEAM.hud),
        prompt: "Acesso Google parado. Testes locais continuam liberados."
      });
    }
  }

  buildPlayer(x, y) {
    const player = this.add.container(x, y).setDepth(2.42);
    const shadow = this.add.ellipse(0, 2, 48, 11, 0x000000, 0.2)
      .setBlendMode(Phaser.BlendModes.MULTIPLY);
    const sprite = this.add.image(0, 0, TEXTURE_KEYS.player)
      .setOrigin(0.5, 1)
      .setScale(0.083);
    player.add([shadow, sprite]);
    return player;
  }

  handleResize(gameSize) {
    if (!gameSize || !this.cameras?.main) return;
    this.cameras.main.setZoom(gameSize.width < 700 ? 0.82 : 1);
  }

  nudgePlayer(dx, dy) {
    this.targetPoint = new Phaser.Math.Vector2(
      Phaser.Math.Clamp(this.player.x + dx, STREET_BOUNDS.minX, STREET_BOUNDS.maxX),
      Phaser.Math.Clamp(this.player.y + dy, STREET_BOUNDS.minY, STREET_BOUNDS.maxY)
    );
    this.targetMarker.setPosition(this.targetPoint.x, this.targetPoint.y).setVisible(true);
  }

  tintPlayer(color) {
    this.player?.each?.((child) => child.setTint?.(color));
  }

  clearPlayerTint() {
    this.player?.each?.((child) => child.clearTint?.());
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

    if (keyboardVector.lengthSq() > 0) {
      keyboardVector.normalize().scale(2.6);
      this.player.x = Phaser.Math.Clamp(this.player.x + keyboardVector.x, STREET_BOUNDS.minX, STREET_BOUNDS.maxX);
      this.player.y = Phaser.Math.Clamp(this.player.y + keyboardVector.y, STREET_BOUNDS.minY, STREET_BOUNDS.maxY);
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
      objective: nearDoor ? "Apertar a tecla Entrar" : "Entrar no PubPaid pela porta principal",
      nerdAgent: formatNerdAgent(nearDoor ? NERD_TEAM.engine : NERD_TEAM.physics),
      prompt: nearDoor
        ? "Porta encontrada. Aperte a tecla Entrar para entrar no salão em Phaser."
        : nearestHotspot?.distance < 120
          ? "Ponto ativo perto. Aperte E ou clique para interagir."
          : "Rua viva carregada no núcleo definitivo. Explore ou siga para a porta."
    });

    const rainLayer = this.rainLines.graphics;
    if (rainLayer) {
      rainLayer.clear();
      this.rainLines.forEach((drop) => {
        drop.y += drop.speed;
        drop.x -= drop.speed * 0.32;
        if (drop.y > GAME_HEIGHT + 50 || drop.x < -30) {
          drop.y = Phaser.Math.Between(240, 320);
          drop.x = Phaser.Math.Between(40, GAME_WIDTH - 20);
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
    this.tintPlayer(0xffe0ae);
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
      this.clearPlayerTint();
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
