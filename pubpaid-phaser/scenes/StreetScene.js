import { GAME_HEIGHT, GAME_WIDTH, STREET_BOUNDS } from "../config/gameConfig.js";
import { ensureCoreSprites, TEXTURE_KEYS } from "../core/spriteFactory.js";
import { updateGameState } from "../core/gameState.js";
import {
  getInteractionAt,
  getInteractionById,
  getNearestInteraction,
  isWalkable
} from "../systems/mapQuerySystem.js";

const PUB_DOOR = getInteractionById("street", "street_pub_door");

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
    this.steamPuffs = [];
    this.identityGlows = [];
    this.streetSfxTimer = null;
    this.cityWindows = [];
    this.streetSetpieces = [];
    this.livingStreetLights = [];
    this.roadLightStreaks = [];
  }

  create() {
    ensureCoreSprites(this);
    this.game.events.emit("pubpaid:music-zone", "street");
    this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, "street-bg").setDisplaySize(GAME_WIDTH, GAME_HEIGHT);
    this.buildAmbientStreetFx();
    this.buildTrafficFx();
    this.buildStreetLife();
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
      x: PUB_DOOR.x,
      y: PUB_DOOR.y,
      width: PUB_DOOR.width,
      height: PUB_DOOR.height,
      color: 0xffd06d,
      label: "PORTA",
      visible: false
    });
    this.hotspots = [this.doorHotspot];

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
      if (this.isPointOnDoor(worldPoint.x, worldPoint.y)) {
        this.enterInterior();
        updateGameState({
          focus: "entrada",
          objective: "Entrar no salão",
          prompt: "Porta acionada. Entrando no salão."
        });
        return;
      }
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
        prompt: "Destino marcado. A rua ganhou luz, chuva e reflexos vivos; siga para a porta principal."
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
      prompt: "Mapa externo carregado: porta, rua e ponto de onibus identificados. Clique na porta do PubPaid para entrar no bar."
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
      { x: 1002, y: 632, width: 96, height: 9, color: 0x50efff, alpha: 0.14, speed: 0.011 },
      { x: 710, y: 650, width: 220, height: 12, color: 0xffcf4a, alpha: 0.12, speed: 0.01 },
      { x: 360, y: 674, width: 156, height: 10, color: 0xff4fb8, alpha: 0.12, speed: 0.013 }
    ];
    reflectionLayer.ppgReflectionLayer = true;
    this.reflectionBands.graphics = reflectionLayer;

    const doorGold = this.add.ellipse(674, 520, 168, 70, 0xffcf4a, 0.11)
      .setBlendMode(Phaser.BlendModes.SCREEN)
      .setDepth(1.34);
    const brandPink = this.add.rectangle(674, 306, 312, 70, 0xff4fb8, 0.08)
      .setBlendMode(Phaser.BlendModes.SCREEN)
      .setDepth(1.33);
    const brandCyan = this.add.rectangle(712, 260, 234, 54, 0x50efff, 0.06)
      .setBlendMode(Phaser.BlendModes.SCREEN)
      .setDepth(1.32);
    this.identityGlows.push(doorGold, brandPink, brandCyan);
    this.tweens.add({
      targets: this.identityGlows,
      alpha: { from: 0.035, to: 0.16 },
      duration: 1250,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut"
    });

    const puffOrigins = [
      { x: 292, y: 579, delay: 0 },
      { x: 1016, y: 586, delay: 520 },
      { x: 840, y: 602, delay: 1040 }
    ];
    puffOrigins.forEach((origin) => {
      const puff = this.add.ellipse(origin.x, origin.y, 34, 14, 0xd8f3ff, 0.08)
        .setBlendMode(Phaser.BlendModes.SCREEN)
        .setDepth(1.55);
      this.steamPuffs.push(puff);
      this.tweens.add({
        targets: puff,
        y: origin.y - 38,
        x: origin.x + 10,
        scaleX: 1.8,
        scaleY: 1.35,
        alpha: { from: 0.11, to: 0 },
        duration: 2100,
        delay: origin.delay,
        repeat: -1,
        repeatDelay: 520,
        ease: "Sine.easeOut",
        onRepeat: () => {
          puff.setPosition(origin.x, origin.y);
          puff.setScale(1);
        }
      });
    });

    const cityWindowLayout = [
      [102, 78, 14, 8, 0xffc768], [126, 92, 12, 8, 0xff67d4], [152, 70, 10, 7, 0x64e5ff],
      [230, 84, 12, 8, 0xffc768], [256, 74, 10, 6, 0x64e5ff], [286, 100, 14, 8, 0xff67d4],
      [840, 66, 14, 8, 0xffc768], [866, 78, 11, 8, 0x64e5ff], [888, 92, 10, 7, 0xff67d4],
      [1008, 78, 13, 8, 0x64e5ff], [1036, 90, 11, 7, 0xffc768], [1064, 74, 10, 7, 0xff67d4]
    ];
    cityWindowLayout.forEach(([x, y, width, height, color], index) => {
      const light = this.add.rectangle(x, y, width, height, color, 0.22)
        .setBlendMode(Phaser.BlendModes.SCREEN)
        .setDepth(0.95);
      this.cityWindows.push(light);
      this.tweens.add({
        targets: light,
        alpha: { from: 0.08, to: 0.42 },
        duration: 1100 + index * 80,
        delay: index * 90,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut"
      });
    });

    const alleyGlow = this.add.rectangle(320, 330, 72, 188, 0x2ae4db, 0.08)
      .setBlendMode(Phaser.BlendModes.SCREEN)
      .setDepth(1.18);
    const alleyShadow = this.add.rectangle(324, 336, 92, 210, 0x04111c, 0.22)
      .setDepth(1.17);
    this.tweens.add({
      targets: alleyGlow,
      alpha: { from: 0.04, to: 0.16 },
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut"
    });
    this.identityGlows.push(alleyGlow, alleyShadow);
  }

  buildTrafficFx() {
    this.vehicles = [];
    const roadLanes = [
      { x: -160, y: 586, width: 132, color: 0x50efff, delay: 0, duration: 5200 },
      { x: GAME_WIDTH + 180, y: 646, width: 176, color: 0xff4fb8, delay: 1600, duration: 6200 },
      { x: -220, y: 620, width: 108, color: 0xffd06d, delay: 3200, duration: 5600 }
    ];
    roadLanes.forEach((lane, index) => {
      const streak = this.add.rectangle(lane.x, lane.y, lane.width, 4, lane.color, 0.16)
        .setBlendMode(Phaser.BlendModes.SCREEN)
        .setDepth(1.5);
      const reflection = this.add.rectangle(lane.x, lane.y + 22, lane.width * 1.22, 7, lane.color, 0.08)
        .setBlendMode(Phaser.BlendModes.SCREEN)
        .setDepth(1.12);
      this.roadLightStreaks.push(streak, reflection);
      this.tweens.add({
        targets: [streak, reflection],
        x: index === 1 ? -220 : GAME_WIDTH + 220,
        alpha: { from: 0, to: 0.22 },
        duration: lane.duration,
        delay: lane.delay,
        repeat: -1,
        repeatDelay: 1200,
        ease: "Sine.easeInOut",
        yoyo: false,
        onRepeat: () => {
          streak.setX(lane.x);
          reflection.setX(lane.x);
        }
      });
    });
  }

  buildStreetLife() {
    this.pedestrians = [];
    this.streetSetpieces = [];
    const livingLights = [
      { x: 988, y: 386, width: 64, height: 86, color: 0x64e5ff, alpha: 0.08, delay: 0 },
      { x: 1084, y: 360, width: 78, height: 112, color: 0xffd06d, alpha: 0.06, delay: 320 },
      { x: 204, y: 222, width: 132, height: 88, color: 0x50efff, alpha: 0.08, delay: 640 },
      { x: 444, y: 370, width: 92, height: 54, color: 0xff4fb8, alpha: 0.05, delay: 960 }
    ];
    livingLights.forEach((light) => {
      const glow = this.add.rectangle(light.x, light.y, light.width, light.height, light.color, light.alpha)
        .setBlendMode(Phaser.BlendModes.SCREEN)
        .setDepth(1.36);
      this.livingStreetLights.push(glow);
      this.tweens.add({
        targets: glow,
        alpha: { from: light.alpha * 0.35, to: light.alpha * 1.7 },
        duration: 1200 + light.delay,
        delay: light.delay,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut"
      });
    });
  }

  buildHotspot({ id, x, y, width, height, color, label, visible = true }) {
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
      ? this.add.ellipse(0, height / 2 - 4, width + 54, 30, color, 0.04)
        .setBlendMode(Phaser.BlendModes.SCREEN)
        .setAlpha(0.08)
      : null;

    container.add([softGlow, glow, pulse, outline, text]);
    if (doorReadyGlow) {
      this.doorReadyGlow = doorReadyGlow;
      container.addAt(doorReadyGlow, 0);
    }
    if (!visible) {
      glow.setAlpha(0);
      softGlow.setAlpha(0);
      pulse.setAlpha(0);
      outline.setAlpha(0);
      text.setAlpha(0);
    }
    container.setSize(width, height);
    container.ppgHotspot = { id, x, y, width, height, glow, softGlow, pulse, outline, text, color, visible };
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

  findHotspotAt(x, y) {
    const interaction = getInteractionAt("street", x, y);
    if (interaction?.id === "street_pub_door") {
      return this.doorHotspot;
    }
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

  isPointOnDoor(x, y) {
    return getInteractionAt("street", x, y)?.id === "street_pub_door";
  }

  setActiveHotspot(hotspot) {
    this.activeHotspot = hotspot;
    this.hotspots.forEach((item) => {
      const data = item.ppgHotspot;
      if (!data?.glow) return;
      if (!data.visible) return;
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
      this.enterInterior();
      updateGameState({
        focus: "entrada",
        objective: "Entrar no salão",
        prompt: "Porta acionada. Entrando no salão."
      });
      return;
    }

  }

  buildPlayer(x, y) {
    const player = this.add.container(x, y).setDepth(2.42);
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

  handleResize(gameSize) {
    if (!gameSize || !this.cameras?.main) return;
    this.cameras.main.setZoom(gameSize.width < 700 ? 0.82 : 1);
  }

  nudgePlayer(dx, dy) {
    const nextX = Phaser.Math.Clamp(this.player.x + dx, STREET_BOUNDS.minX, STREET_BOUNDS.maxX);
    const nextY = Phaser.Math.Clamp(this.player.y + dy, STREET_BOUNDS.minY, STREET_BOUNDS.maxY);
    this.targetPoint = new Phaser.Math.Vector2(nextX, nextY);
    this.targetMarker.setPosition(this.targetPoint.x, this.targetPoint.y).setVisible(true);
  }

  tryMovePlayer(dx, dy) {
    const tryX = Phaser.Math.Clamp(this.player.x + dx, STREET_BOUNDS.minX, STREET_BOUNDS.maxX);
    const tryY = Phaser.Math.Clamp(this.player.y + dy, STREET_BOUNDS.minY, STREET_BOUNDS.maxY);
    if (isWalkable("street", tryX, tryY)) {
      this.player.x = tryX;
      this.player.y = tryY;
      return true;
    }

    const axisX = Phaser.Math.Clamp(this.player.x + dx, STREET_BOUNDS.minX, STREET_BOUNDS.maxX);
    if (isWalkable("street", axisX, this.player.y)) {
      this.player.x = axisX;
      return true;
    }
    const axisY = Phaser.Math.Clamp(this.player.y + dy, STREET_BOUNDS.minY, STREET_BOUNDS.maxY);
    if (isWalkable("street", this.player.x, axisY)) {
      this.player.y = axisY;
      return true;
    }
    return false;
  }

  tryDoorInteraction() {
    const now = this.time.now;
    if (this.isTransitioning || now < this.interactionCooldown) return;
    this.interactionCooldown = now + 250;

    const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, PUB_DOOR.entryX, PUB_DOOR.entryY);
    if (distance < PUB_DOOR.radius) {
      this.enterInterior();
      return;
    }
    updateGameState({
      focus: "calçada",
      objective: "Chegar mais perto da entrada",
      prompt: "Chegue mais perto da porta para entrar no salão definitivo em Phaser."
    });
  }

  tryNearestHotspot() {
    if (this.isTransitioning) return;
    const nearestInteraction = getNearestInteraction("street", this.player.x, this.player.y);
    const nearest = nearestInteraction
      ? {
        hotspot: nearestInteraction.point.id === "street_pub_door" ? this.doorHotspot : null,
        distance: nearestInteraction.distance
      }
      : null;
    if (nearest && nearest.distance < 110) {
      if (nearest.hotspot) this.handleHotspot(nearest.hotspot);
    }
  }

  update() {
    if (this.isTransitioning) {
      return;
    }
    let playerMoving = false;
    let moveDx = 0;
    let moveDy = 0;
    const keyboardVector = new Phaser.Math.Vector2(0, 0);
    if (this.cursors.left.isDown) keyboardVector.x -= 1;
    if (this.cursors.right.isDown) keyboardVector.x += 1;
    if (this.cursors.up.isDown) keyboardVector.y -= 1;
    if (this.cursors.down.isDown) keyboardVector.y += 1;

    if (keyboardVector.lengthSq() > 0) {
      keyboardVector.normalize().scale(2.6);
      moveDx = keyboardVector.x;
      moveDy = keyboardVector.y;
      playerMoving = this.tryMovePlayer(moveDx, moveDy);
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
        moveDx = (dx / distance) * speed;
        moveDy = (dy / distance) * speed;
        playerMoving = this.tryMovePlayer(moveDx, moveDy);
      }
    }
    this.updatePlayerBitmapPose(playerMoving, moveDx, moveDy);

    const nearDoor = Phaser.Math.Distance.Between(this.player.x, this.player.y, PUB_DOOR.entryX, PUB_DOOR.entryY) < PUB_DOOR.radius;
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
      prompt: nearDoor
        ? "Porta encontrada. Aperte Enter para entrar no salão em Phaser."
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

  updatePlayerBitmapPose(moving, dx, dy) {
    const sprite = this.player?.ppgSprite;
    if (!sprite) return;
    if (Math.abs(dx) > 0.05) {
      sprite.setFlipX(dx < 0);
    }

    const shadow = this.player.ppgShadow;
    if (shadow) {
      const pulse = moving ? Math.abs(Math.sin(this.time.now / 120)) : 0.12;
      shadow.scaleX = 1 - pulse * 0.08;
      shadow.alpha = 0.2 - pulse * 0.04;
    }
  }

  enterInterior() {
    if (this.isTransitioning) return;
    this.isTransitioning = true;
    this.targetPoint = null;
    this.targetMarker?.setVisible(false);
    this.input.enabled = false;
    this.player.setTint(0xffe0ae);
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
      this.player.clearTint();
      this.scene.start("interior-scene");
    });
    this.cameras.main.fadeOut(460, 8, 12, 20);
    updateGameState({
      currentScene: "street",
      focus: "portal principal",
      objective: "Transicao para o salao",
      prompt: "Entrando no salao do PubPaid..."
    });
  }
}
