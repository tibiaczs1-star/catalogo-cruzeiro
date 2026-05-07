import { GAME_HEIGHT, GAME_WIDTH, STREET_BOUNDS } from "../config/gameConfig.js";
import { ensureCoreSprites, TEXTURE_KEYS } from "../core/spriteFactory.js";
import { NERD_TEAM, formatNerdAgent } from "../config/nerdTeam.js";
import { gameState, updateGameState } from "../core/gameState.js";
import { createTrafficNoise } from "../audio/trafficNoise.js";

const TRAFFIC_TEXTURE = "ppg-traffic-vehicles-sheet";
const STREET_AMBIENT_LIFE_TEXTURE = "ppg-street-ambient-life-sheet";
const STREET_AMBIENT_LIFE_ANIM = "ppg-street-ambient-life-loop";
const TRAFFIC_ENABLED = true;
const TRAFFIC_FRAME_STRIDE = 3;
const TRAFFIC_FRAMES = 3;
const TRAFFIC_SPAWN_DELAY = { min: 2400, max: 3900 };
const TRAFFIC_LANE_BLOCK_MS = 1800;
const TRAFFIC_FOLLOW_GAP = 96;
const TRAFFIC_OFFSCREEN_MARGIN = 430;
const TRAFFIC_MAX_VISIBLE = 1;
const BAR_DOOR_POINT = { x: 642, y: 548 };
const OPENING_PLAYER_START = { x: 312, y: 640 };
const OPENING_SIDEWALK_TARGET = { x: 176, y: 560 };
const OPENING_CAR_STOP_X = 312;
const PLAYER_STREET_DEPTH = 2.18;
const OPENING_GLOW_DEPTH = PLAYER_STREET_DEPTH - 0.03;
const TRAFFIC_STREET_DEPTH = 2.72;
const PLAYER_GUIDE_MARKER_DEPTH = 3.65;
const SIDEWALK_WALK_BOUNDS = {
  minX: STREET_BOUNDS.minX,
  maxX: STREET_BOUNDS.maxX,
  minY: 512,
  maxY: 572
};
const TRAFFIC_LANES = [
  { id: "going", label: "faixa direita para esquerda", y: 716, direction: -1 }
];
const STREET_DECORATIVE_NPCS = [
  { id: "arcade-controller-wall", key: "ppg-street-npc-arcade-controller", x: 98, y: 556, scale: 0.72, depth: PLAYER_STREET_DEPTH - 0.22, frameRate: 4, frames: 5, alpha: 1 },
  { id: "arcade-token-wall", key: "ppg-street-npc-arcade-token", x: 218, y: 556, scale: 0.72, depth: PLAYER_STREET_DEPTH - 0.21, frameRate: 3, frames: 5, alpha: 1 },
  { id: "arcade-phone-wall", key: "ppg-street-npc-arcade-phone", x: 330, y: 556, scale: 0.72, depth: PLAYER_STREET_DEPTH - 0.2, frameRate: 4, frames: 5, alpha: 1 },
  { id: "bus-sitter", key: "ppg-street-npc-curb-sitter", x: 1094, y: 574, scale: 0.45, depth: 1.36, frameRate: 2, alpha: 1 },
  { id: "bus-waiting", key: "ppg-street-npc-bus-lady", x: 1160, y: 568, scale: 0.42, depth: 1.34, frameRate: 2, alpha: 1 }
];
const STREET_WALKING_NPCS = [
  { id: "commuter-loop", key: "ppg-street-ped-commuter", x: 1310, y: 532, direction: -1, sourceFacing: -1, speed: 0.58, scale: 0.58, frameRate: 6, frames: 5, phase: 0 },
  { id: "delivery-loop", key: "ppg-street-ped-delivery", x: 720, y: 548, direction: 1, sourceFacing: 1, speed: 0.5, scale: 0.58, frameRate: 6, frames: 5, phase: 2 },
  { id: "hoodie-loop", key: "ppg-street-ped-hoodie-tote", x: 1420, y: 562, direction: -1, sourceFacing: -1, speed: 0.52, scale: 0.6, frameRate: 6, frames: 5, phase: 1 },
  { id: "woman-denim-loop", key: "ppg-street-ped-woman-denim", x: 520, y: 520, direction: -1, sourceFacing: -1, speed: 0.62, scale: 0.56, frameRate: 7, frames: 5, phase: 3 },
  { id: "woman-umbrella-loop", key: "ppg-street-ped-woman-umbrella", x: -120, y: 540, direction: 1, sourceFacing: 1, speed: 0.54, scale: 0.56, frameRate: 6, frames: 5, phase: 1 },
  { id: "woman-hoodie-loop", key: "ppg-street-ped-woman-hoodie", x: 980, y: 526, direction: -1, sourceFacing: -1, speed: 0.5, scale: 0.56, frameRate: 6, frames: 5, phase: 2 },
  { id: "elder-woman-coat-loop", key: "ppg-street-ped-elder-woman-coat", x: 1180, y: 552, direction: -1, sourceFacing: -1, speed: 0.34, scale: 0.56, frameRate: 5, frames: 5, phase: 0 },
  { id: "elder-man-cane-loop", key: "ppg-street-ped-elder-man-cane", x: -220, y: 566, direction: 1, sourceFacing: 1, speed: 0.3, scale: 0.57, frameRate: 4, frames: 5, phase: 2 },
  { id: "elder-woman-tote-loop", key: "ppg-street-ped-elder-woman-tote", x: 410, y: 544, direction: -1, sourceFacing: -1, speed: 0.32, scale: 0.55, frameRate: 4, frames: 5, phase: 1 }
];
const STATIC_COLLISION_ZONES = [
  { id: "arcade-building", left: 44, right: 360, top: 108, bottom: 500 },
  { id: "main-pub-building", left: 386, right: 990, top: 104, bottom: 500 },
  { id: "bar-door", left: 602, right: 708, top: 390, bottom: 500 },
  { id: "bus-stop", left: 1010, right: 1210, top: 386, bottom: 560 },
  { id: "street-corner", left: 1212, right: 1274, top: 380, bottom: 660 }
];
const TRAFFIC_VEHICLES = [
  { id: "taxi_art_left_v1", label: "taxi amarelo", kind: "car", row: 0, speed: 3.05, scale: 1.46, hitbox: { width: 286, height: 78 } },
  { id: "black_sedan_art_left_v1", label: "sedan preto", kind: "car", row: 1, speed: 3.25, scale: 1.47, hitbox: { width: 296, height: 78 } },
  { id: "red_sport_art_left_v1", label: "esportivo vermelho", kind: "car", row: 2, speed: 3.45, scale: 1.46, hitbox: { width: 292, height: 76 } },
  { id: "teal_hatch_art_left_v1", label: "hatch teal", kind: "car", row: 3, speed: 3.35, scale: 1.48, hitbox: { width: 264, height: 78 } },
  { id: "olive_pickup_art_left_v1", label: "pickup verde", kind: "car", row: 4, speed: 2.95, scale: 1.43, hitbox: { width: 300, height: 84 } },
  { id: "white_van_art_left_v1", label: "van branca", kind: "car", row: 5, speed: 2.85, scale: 1.43, hitbox: { width: 300, height: 88 } },
  { id: "blue_truck_art_left_v1", label: "caminhao leve azul", kind: "car", row: 6, speed: 2.7, scale: 1.36, hitbox: { width: 310, height: 90 } },
  { id: "retro_brazil_art_left_v1", label: "classico brasileiro", kind: "car", row: 7, speed: 3.0, scale: 1.44, hitbox: { width: 284, height: 76 } },
  { id: "red_moto_rider_art_left_v1", label: "moto vermelha com piloto", kind: "moto", row: 8, speed: 4.3, scale: 0.92, hitbox: { width: 178, height: 88 } },
  { id: "teal_delivery_moto_art_left_v1", label: "moto delivery teal", kind: "moto", row: 9, speed: 3.85, scale: 0.92, hitbox: { width: 188, height: 88 } }
];

let streetOpeningPlayed = false;

export function resetStreetOpeningPlayback() {
  streetOpeningPlayed = false;
}

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
    this.backgroundNeonGlows = [];
    this.backgroundLife = null;
    this.decorativeNpcs = [];
    this.streetWalkers = [];
    this.sideGlow = null;
    this.isTransitioning = false;
    this.doorReadyGlow = null;
    this.transitionVeil = null;
    this.transitionLabel = null;
    this.pedestrians = [];
    this.vehicles = [];
    this.traffic = null;
    this.trafficNoise = null;
    this.streetOpening = null;
    this.playerGuideArrow = null;
    this.playerSpeechBubble = null;
    this.openingGlow = null;
    this.staticBlockedAt = 0;
    this.streetSfxTimer = null;
    this.walletMenuOpening = false;
    this.walletMenuClosing = false;
    this.walletOpenTimer = null;
    this.walletCloseTimer = null;
    this.mobileActions = new Set();
    this.handleMobileControl = this.handleMobileControl.bind(this);
    this.handleWalletCloseRequest = this.handleWalletCloseRequest.bind(this);
    this.handleWalletClosed = this.handleWalletClosed.bind(this);
  }

  create() {
    ensureCoreSprites(this);
    this.game.events.emit("pubpaid:music-zone", "street");
    this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, "street-bg").setDisplaySize(GAME_WIDTH, GAME_HEIGHT);
    this.buildAmbientStreetFx();
    this.buildDecorativeStreetSprites();
    this.buildStreetPedestrians();
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
    this.hotspots = [];

    const shouldPlayOpening = !streetOpeningPlayed;
    this.player = this.buildPlayer(
      shouldPlayOpening ? OPENING_PLAYER_START.x : OPENING_SIDEWALK_TARGET.x,
      shouldPlayOpening ? OPENING_PLAYER_START.y : OPENING_SIDEWALK_TARGET.y
    );
    if (shouldPlayOpening) {
      this.player.setAlpha(0);
    }
    this.targetMarker = this.add.circle(this.player.x, this.player.y, 10, 0x50efff, 0.25).setVisible(false);

    this.cameras.main.setBounds(0, 0, GAME_WIDTH, GAME_HEIGHT);
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);

    this.scale.on("resize", this.handleResize, this);
    this.game.events.on("pubpaid:mobile-control", this.handleMobileControl, this);
    this.game.events.on("pubpaid:wallet-close-request", this.handleWalletCloseRequest, this);
    this.game.events.on("pubpaid:wallet-closed", this.handleWalletClosed, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off("resize", this.handleResize, this);
      this.game.events.off("pubpaid:mobile-control", this.handleMobileControl, this);
      this.game.events.off("pubpaid:wallet-close-request", this.handleWalletCloseRequest, this);
      this.game.events.off("pubpaid:wallet-closed", this.handleWalletClosed, this);
      this.streetSfxTimer?.remove(false);
      this.walletOpenTimer?.remove(false);
      this.walletCloseTimer?.remove(false);
      this.trafficNoise?.destroy();
      this.mobileActions.clear();
    });
    this.handleResize(this.scale.gameSize);

    this.input.on("pointerdown", (pointer) => {
      if (gameState.characterSelectOpen || this.isWalletBusy() || this.isStreetOpeningActive()) return;
      const worldPoint = pointer.positionToCamera(this.cameras.main);
      const hit = this.findHotspotAt(worldPoint.x, worldPoint.y);
      if (hit) {
        this.handleHotspot(hit);
        return;
      }
      const target = this.clampWalkablePoint(worldPoint.x, worldPoint.y);
      this.targetPoint = new Phaser.Math.Vector2(
        target.x,
        target.y
      );
      this.targetMarker.setPosition(this.targetPoint.x, this.targetPoint.y).setVisible(true);
      updateGameState({
        currentScene: "street",
        focus: "rua principal",
        objective: "Aproximar da porta principal",
        nerdAgent: formatNerdAgent(NERD_TEAM.physics),
        prompt: "Destino marcado. A rua esta limpa para revisar apenas o protagonista."
      });
    });

    this.cursors = this.input.keyboard.createCursorKeys();
    this.input.keyboard.on("keydown-W", () => this.nudgePlayer(0, -40));
    this.input.keyboard.on("keydown-A", () => this.nudgePlayer(-40, 0));
    this.input.keyboard.on("keydown-S", () => this.nudgePlayer(0, 40));
    this.input.keyboard.on("keydown-D", () => this.nudgePlayer(40, 0));
    this.input.keyboard.on("keydown-ENTER", () => this.openWalletMenuSequence());
    this.input.keyboard.on("keydown-E", () => {
      if (this.isStreetOpeningActive()) return;
      const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, BAR_DOOR_POINT.x, BAR_DOOR_POINT.y);
      if (distance < 74) {
        this.tryDoorInteraction();
        return;
      }
      this.tryNearestHotspot();
    });

    if (shouldPlayOpening) {
      this.startStreetOpening();
    } else {
      updateGameState({
        currentScene: "street",
        focus: "porta principal",
        objective: "Entrar no PubPaid pela porta principal",
        nerdAgent: formatNerdAgent(NERD_TEAM.engine),
        prompt: "Clique na rua para mover. Enter abre a carteira; E entra pela porta quando estiver perto."
      });
    }
  }

  buildAmbientStreetFx() {
    if (!this.textures.exists(STREET_AMBIENT_LIFE_TEXTURE)) return;
    this.textures.get(STREET_AMBIENT_LIFE_TEXTURE)?.setFilter(Phaser.Textures.FilterMode.NEAREST);
    if (!this.anims.exists(STREET_AMBIENT_LIFE_ANIM)) {
      this.anims.create({
        key: STREET_AMBIENT_LIFE_ANIM,
        frames: this.anims.generateFrameNumbers(STREET_AMBIENT_LIFE_TEXTURE, { start: 0, end: 3 }),
        frameRate: 3,
        repeat: -1
      });
    }
    this.backgroundLife = this.add.sprite(GAME_WIDTH / 2, GAME_HEIGHT / 2, STREET_AMBIENT_LIFE_TEXTURE, 0)
      .setOrigin(0.5)
      .setDepth(1.18)
      .setAlpha(0.82);
    this.backgroundLife.play(STREET_AMBIENT_LIFE_ANIM);
  }

  buildDecorativeStreetSprites() {
    this.decorativeNpcs = STREET_DECORATIVE_NPCS
      .filter((npc) => this.textures.exists(npc.key))
      .map((npc, index) => {
        this.textures.get(npc.key)?.setFilter(Phaser.Textures.FilterMode.NEAREST);
        const frameCount = npc.frames || 4;
        const animKey = `${npc.key}-idle-${frameCount}f`;
        if (!this.anims.exists(animKey)) {
          this.anims.create({
            key: animKey,
            frames: this.anims.generateFrameNumbers(npc.key, { start: 0, end: frameCount - 1 }),
            frameRate: npc.frameRate || 2,
            repeat: -1
          });
        }
        const sprite = this.add.sprite(npc.x, npc.y, npc.key, index % frameCount)
          .setOrigin(0.5, 1)
          .setScale(npc.scale)
          .setDepth(npc.depth)
          .setAlpha(npc.alpha ?? 1);
        sprite.play(animKey);
        return sprite;
      });
  }

  getStreetActorDepth(y) {
    return Phaser.Math.Clamp(1.42 + (y - SIDEWALK_WALK_BOUNDS.minY) * 0.014, 1.42, TRAFFIC_STREET_DEPTH - 0.34);
  }

  getStreetWalkerDepth(y) {
    return this.getStreetActorDepth(y);
  }

  updatePlayerStreetDepth() {
    if (!this.player) return;
    const depth = this.getStreetActorDepth(this.player.y) + 0.01;
    this.player.setDepth(depth);
    this.openingGlow?.setDepth(depth - 0.03);
  }

  buildStreetPedestrians() {
    this.streetWalkers = STREET_WALKING_NPCS
      .filter((walker) => this.textures.exists(walker.key))
      .map((walker) => {
        this.textures.get(walker.key)?.setFilter(Phaser.Textures.FilterMode.NEAREST);
        const frameCount = walker.frames || 4;
        const animKey = `${walker.key}-walk-${frameCount}f`;
        if (!this.anims.exists(animKey)) {
          this.anims.create({
            key: animKey,
            frames: this.anims.generateFrameNumbers(walker.key, { start: 0, end: frameCount - 1 }),
            frameRate: walker.frameRate || 5,
            repeat: -1
          });
        }
        const sprite = this.add.sprite(walker.x, walker.y, walker.key, (walker.phase || 0) % frameCount)
          .setOrigin(0.5, 1)
          .setScale(walker.scale)
          .setDepth(this.getStreetWalkerDepth(walker.y))
          .setAlpha(walker.alpha ?? 1);
        sprite.setFlipX(walker.direction !== walker.sourceFacing);
        sprite.play(animKey, true);
        sprite.ppgWalker = { ...walker };
        return sprite;
      });
  }

  updateStreetPedestrians(delta = 16) {
    const step = Math.max(0.35, Math.min(2.5, delta / (1000 / 60)));
    this.streetWalkers.forEach((sprite) => {
      const walker = sprite.ppgWalker;
      if (!walker) return;
      sprite.x += walker.direction * walker.speed * step;
      if (walker.direction < 0 && sprite.x < -150) {
        sprite.x = GAME_WIDTH + 150 + ((walker.phase || 0) * 44);
      } else if (walker.direction > 0 && sprite.x > GAME_WIDTH + 150) {
        sprite.x = -150 - ((walker.phase || 0) * 44);
      }
      sprite.setDepth(this.getStreetWalkerDepth(sprite.y));
    });
  }

  buildStreetLife() {
    this.textures.get(TRAFFIC_TEXTURE)?.setFilter(Phaser.Textures.FilterMode.NEAREST);
    this.traffic = {
      items: [],
      nextSpawnAt: Number.POSITIVE_INFINITY,
      blockedAt: 0,
      blockedLanes: new Map(),
      flowEnabled: streetOpeningPlayed,
    };
    if (!TRAFFIC_ENABLED) return;
    this.trafficNoise = createTrafficNoise();
    if (this.traffic.flowEnabled) this.scheduleNextTrafficSpawn(true);
  }

  isStreetOpeningActive() {
    return Boolean(this.streetOpening && !this.streetOpening.done);
  }

  createPlayerGuideArrow() {
    const marker = this.add.container(OPENING_PLAYER_START.x, OPENING_PLAYER_START.y - 122)
      .setDepth(PLAYER_GUIDE_MARKER_DEPTH)
      .setAlpha(0);
    const glow = this.add.ellipse(0, 3, 52, 30, 0x65ff86, 0.16)
      .setBlendMode(Phaser.BlendModes.SCREEN);
    const aura = this.add.circle(0, 0, 18, 0x65ff86, 0.22)
      .setBlendMode(Phaser.BlendModes.SCREEN);
    const ring = this.add.circle(0, 0, 14, 0x65ff86, 0.26)
      .setStrokeStyle(3, 0xdcffe2, 0.88);
    const core = this.add.circle(0, 0, 7, 0x4eff6f, 0.96)
      .setStrokeStyle(2, 0x06110a, 0.72);
    const shine = this.add.circle(-3, -4, 2, 0xf4fff6, 0.95);
    marker.add([glow, aura, ring, core, shine]);
    this.tweens.add({
      targets: marker,
      y: marker.y - 7,
      duration: 640,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut"
    });
    this.tweens.add({
      targets: [aura, ring],
      scale: { from: 0.92, to: 1.16 },
      alpha: { from: 0.2, to: 0.36 },
      duration: 760,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut"
    });
    return marker;
  }

  createPlayerSpeechBubble() {
    const bubble = this.add.container(OPENING_SIDEWALK_TARGET.x + 52, OPENING_SIDEWALK_TARGET.y - 128)
      .setDepth(4.3)
      .setAlpha(0)
      .setScale(0.92);
    const panel = this.add.graphics();
    panel.fillStyle(0x080b14, 0.94);
    panel.fillRoundedRect(-80, -28, 160, 52, 8);
    panel.lineStyle(3, 0xffd06d, 0.76);
    panel.strokeRoundedRect(-80, -28, 160, 52, 8);
    panel.fillStyle(0x080b14, 0.94);
    panel.fillTriangle(-34, 22, -10, 22, -30, 42);
    panel.lineStyle(2, 0xffd06d, 0.64);
    panel.lineBetween(-34, 22, -30, 42);
    panel.lineBetween(-30, 42, -10, 22);
    const text = this.add.text(0, -2, "Vamos pro bar?", {
      fontFamily: "Courier New, Lucida Console, monospace",
      fontSize: "15px",
      fontStyle: "bold",
      color: "#fff2d3",
      stroke: "#05070d",
      strokeThickness: 3
    }).setOrigin(0.5).setLetterSpacing(1);
    bubble.add([panel, text]);
    return bubble;
  }

  createOpeningCar() {
    const source = TRAFFIC_VEHICLES[1] || TRAFFIC_VEHICLES[0];
    const lane = TRAFFIC_LANES[0];
    const container = this.add.container(GAME_WIDTH + TRAFFIC_OFFSCREEN_MARGIN, lane.y)
      .setDepth(TRAFFIC_STREET_DEPTH + 0.16);
    const reflection = this.add.ellipse(0, -8, 330, 26, 0x50efff, 0.11)
      .setBlendMode(Phaser.BlendModes.SCREEN);
    const sprite = this.add.image(0, 0, TRAFFIC_TEXTURE, this.getTrafficFrameIndex(source, 0))
      .setOrigin(0.5, 1)
      .setScale(1.52)
      .setFlipX(false);
    const warmGlint = this.add.rectangle(-62, -54, 92, 10, 0xffd06d, 0.08)
      .setBlendMode(Phaser.BlendModes.SCREEN);
    container.add([reflection, sprite, warmGlint]);
    container.ppgTraffic = {
      ...source,
      scale: 1.52,
      laneId: lane.id,
      laneLabel: lane.label,
      direction: lane.direction,
      sprite,
      frameOffset: 0,
      lastHornAt: 0,
      bornAt: this.time.now || 0
    };
    return container;
  }

  startStreetOpening() {
    this.targetPoint = null;
    this.targetMarker?.setVisible(false);
    this.traffic.flowEnabled = false;
    this.traffic.nextSpawnAt = Number.POSITIVE_INFINITY;
    this.playerGuideArrow = this.createPlayerGuideArrow();
    this.playerSpeechBubble = this.createPlayerSpeechBubble();
    this.openingGlow = this.add.ellipse(this.player.x, this.player.y + 2, 70, 18, 0x65ff86, 0)
      .setDepth(OPENING_GLOW_DEPTH)
      .setBlendMode(Phaser.BlendModes.SCREEN);
    this.streetOpening = {
      phase: "car-enter",
      done: false,
      car: this.createOpeningCar(),
      holdUntil: 0,
      speechUntil: 0
    };
    updateGameState({
      currentScene: "street",
      focus: "protagonista na rua",
      objective: "Assistir a chegada na frente do PubPaid",
      nerdAgent: formatNerdAgent(NERD_TEAM.sprite),
      trafficCount: 1,
      trafficBlocked: false,
      prompt: "O carro vai deixar o protagonista na rua antes do controle livre."
    });
  }

  updateStreetOpening() {
    const opening = this.streetOpening;
    if (!opening || opening.done) return;

    const now = this.time.now || 0;
    const movementVector = new Phaser.Math.Vector2(0, 0);

    if (this.playerGuideArrow) {
      const pulse = Math.sin(now / 150) * 5;
      this.playerGuideArrow.setPosition(this.player.x, this.player.y - 122 + pulse);
    }
    this.openingGlow?.setPosition(this.player.x, this.player.y + 2);

    if (opening.car?.ppgTraffic) {
      const data = opening.car.ppgTraffic;
      const movingWheels = opening.phase === "car-enter" || opening.phase === "car-exit";
      const frameStep = movingWheels
        ? (Math.floor(now / 115) + data.frameOffset) % TRAFFIC_FRAMES
        : 0;
      data.sprite.setFrame(this.getTrafficFrameIndex(data, frameStep));
      data.sprite.setFlipX(false);
    }

    if (opening.phase === "car-enter") {
      opening.car.x = Math.max(OPENING_CAR_STOP_X, opening.car.x - 8.2);
      if (opening.car.x <= OPENING_CAR_STOP_X) {
        opening.car.x = OPENING_CAR_STOP_X;
        opening.phase = "car-hold";
        opening.holdUntil = now + 850;
        this.player.setAlpha(0);
        this.playerGuideArrow?.setAlpha(0);
        this.openingGlow?.setAlpha(0.04);
        this.trafficNoise?.honk("car");
        updateGameState({
          currentScene: "street",
          focus: "carro parado na rua",
          objective: "Aguardar o carro sair para revelar o protagonista",
          nerdAgent: formatNerdAgent(NERD_TEAM.physics),
          trafficCount: 1,
          trafficBlocked: false,
          prompt: "O carro parou na frente do protagonista e escondeu a entrada da cena."
        });
      }
    } else if (opening.phase === "car-hold") {
      opening.car.x = OPENING_CAR_STOP_X;
      if (now >= opening.holdUntil) {
        opening.phase = "car-exit";
      }
    } else if (opening.phase === "car-exit") {
      opening.car.x -= 7.0;
      if (opening.car.x < this.player.x - 230 && this.player.alpha < 1) {
        this.player.setAlpha(1);
        this.playerGuideArrow?.setAlpha(1);
        this.openingGlow?.setAlpha(0.13);
        updateGameState({
          currentScene: "street",
          focus: "protagonista revelado",
          objective: "Ir para a calcada antes do jogo comecar",
          nerdAgent: formatNerdAgent(NERD_TEAM.sprite),
          trafficCount: 1,
          trafficBlocked: false,
          prompt: "O carro saiu e a bolinha verde marca o protagonista."
        });
      }
      if (opening.car.x < -TRAFFIC_OFFSCREEN_MARGIN) {
        opening.car.destroy(true);
        opening.car = null;
        opening.phase = "player-walk";
      }
    } else if (opening.phase === "player-walk") {
      this.player.setAlpha(1);
      const dx = OPENING_SIDEWALK_TARGET.x - this.player.x;
      const dy = OPENING_SIDEWALK_TARGET.y - this.player.y;
      const distance = Math.hypot(dx, dy);
      if (distance < 3) {
        this.player.setPosition(OPENING_SIDEWALK_TARGET.x, OPENING_SIDEWALK_TARGET.y);
        opening.phase = "speech";
        opening.speechUntil = now + 1650;
        this.playerSpeechBubble?.setPosition(this.player.x + 62, this.player.y - 128);
        this.tweens.add({
          targets: this.playerSpeechBubble,
          alpha: 1,
          scale: 1,
          duration: 220,
          ease: "Sine.easeOut"
        });
        updateGameState({
          currentScene: "street",
          focus: "calcada do PubPaid",
          objective: "Comecar o jogo apos a fala",
          nerdAgent: formatNerdAgent(NERD_TEAM.hud),
          trafficCount: 0,
          trafficBlocked: false,
          prompt: "Vamos pro bar?"
        });
      } else {
        const speed = 2.45;
        movementVector.set(dx / distance, dy / distance);
        this.player.x += movementVector.x * speed;
        this.player.y += movementVector.y * speed;
      }
    } else if (opening.phase === "speech" && now >= opening.speechUntil) {
      this.finishStreetOpening();
    }

    this.updatePlayerSprite(movementVector);
    this.updatePlayerStreetDepth();
  }

  finishStreetOpening() {
    const now = this.time.now || 0;
    streetOpeningPlayed = true;
    if (this.streetOpening) this.streetOpening.done = true;
    this.streetOpening = null;
    this.player.setAlpha(1);
    this.targetPoint = null;
    this.targetMarker?.setVisible(false);
    if (this.traffic) {
      this.traffic.flowEnabled = true;
      this.traffic.blockedLanes?.clear?.();
      this.traffic.nextSpawnAt = now + 950;
    }

    const fading = [this.playerGuideArrow, this.playerSpeechBubble, this.openingGlow].filter(Boolean);
    if (fading.length) {
      this.tweens.add({
        targets: fading,
        alpha: 0,
        duration: 260,
        ease: "Sine.easeInOut",
        onComplete: () => {
          this.playerGuideArrow?.destroy();
          this.playerSpeechBubble?.destroy();
          this.openingGlow?.destroy();
          this.playerGuideArrow = null;
          this.playerSpeechBubble = null;
          this.openingGlow = null;
        }
      });
    }

    updateGameState({
      currentScene: "street",
      focus: "rua viva",
      objective: "Entrar no PubPaid pela porta principal",
      nerdAgent: formatNerdAgent(NERD_TEAM.engine),
      trafficCount: 0,
      trafficBlocked: false,
      prompt: "Jogo iniciado. O transito passa da direita para a esquerda, um veiculo por vez."
    });
  }

  clampWalkablePoint(x, y) {
    return {
      x: Phaser.Math.Clamp(x, SIDEWALK_WALK_BOUNDS.minX, SIDEWALK_WALK_BOUNDS.maxX),
      y: Phaser.Math.Clamp(y, SIDEWALK_WALK_BOUNDS.minY, SIDEWALK_WALK_BOUNDS.maxY)
    };
  }

  scheduleNextTrafficSpawn(immediate = false) {
    if (!this.traffic) return;
    const now = this.time.now || 0;
    this.traffic.nextSpawnAt = immediate
      ? now + 240
      : now + Phaser.Math.Between(TRAFFIC_SPAWN_DELAY.min, TRAFFIC_SPAWN_DELAY.max);
  }

  isTrafficLaneBlocked(laneId) {
    if (!this.traffic?.blockedLanes) return false;
    const until = this.traffic.blockedLanes.get(laneId) || 0;
    if (until <= (this.time.now || 0)) {
      this.traffic.blockedLanes.delete(laneId);
      return false;
    }
    return true;
  }

  markTrafficLaneBlocked(laneId, holdMs = TRAFFIC_LANE_BLOCK_MS) {
    if (!this.traffic?.blockedLanes || !laneId) return;
    const now = this.time.now || 0;
    const until = Math.max(this.traffic.blockedLanes.get(laneId) || 0, now + holdMs);
    this.traffic.blockedLanes.set(laneId, until);
  }

  triggerTrafficHorn(data) {
    const now = this.time.now || 0;
    if (!data || now - (data.lastHornAt || 0) < 950) return;
    data.lastHornAt = now;
    this.trafficNoise?.honk(data.kind);
  }

  spawnTrafficVehicle() {
    if (!this.traffic || !this.textures.exists(TRAFFIC_TEXTURE)) return;
    if (this.traffic.items.length >= TRAFFIC_MAX_VISIBLE) {
      this.scheduleNextTrafficSpawn(false);
      return;
    }
    const laneOptions = TRAFFIC_LANES.filter((lane) => {
      if (this.isTrafficLaneBlocked(lane.id)) return false;
      return !this.traffic.items.some((item) => {
        const data = item.ppgTraffic;
        if (!data || data.laneId !== lane.id) return false;
        return lane.direction > 0 ? item.x < 760 : item.x > GAME_WIDTH - 760;
      });
    });
    if (!laneOptions.length) {
      this.scheduleNextTrafficSpawn(false);
      return;
    }
    const lane = Phaser.Utils.Array.GetRandom(laneOptions);
    const source = Phaser.Utils.Array.GetRandom(TRAFFIC_VEHICLES);
    const startX = lane.direction > 0 ? -TRAFFIC_OFFSCREEN_MARGIN : GAME_WIDTH + TRAFFIC_OFFSCREEN_MARGIN;
    const container = this.add.container(startX, lane.y).setDepth(TRAFFIC_STREET_DEPTH + lane.y / 6000);
    const sprite = this.add.image(0, 0, TRAFFIC_TEXTURE, this.getTrafficFrameIndex(source, 0))
      .setOrigin(0.5, 1)
      .setScale(source.scale);
    sprite.setFlipX(false);
    container.add(sprite);
    container.ppgTraffic = {
      ...source,
      laneId: lane.id,
      laneLabel: lane.label,
      direction: lane.direction,
      sprite,
      lights: null,
      frameOffset: Phaser.Math.Between(0, TRAFFIC_FRAMES - 1),
      lastHornAt: 0,
      bornAt: this.time.now || 0,
    };
    this.traffic.items.push(container);
    this.trafficNoise?.accent(source.kind);
    this.scheduleNextTrafficSpawn(false);
  }

  updateTraffic() {
    if (!this.traffic) return;
    const now = this.time.now || 0;
    this.traffic.blockedLanes?.forEach((until, laneId) => {
      if (until <= now) this.traffic.blockedLanes.delete(laneId);
    });
    if (this.traffic.flowEnabled && now >= this.traffic.nextSpawnAt && this.traffic.items.length < TRAFFIC_MAX_VISIBLE) {
      this.spawnTrafficVehicle();
    }

    let carCount = 0;
    let motoCount = 0;
    this.traffic.items = this.traffic.items.filter((item) => {
      const data = item.ppgTraffic;
      if (!data) {
      item.destroy(true);
        return false;
      }
      item.x = this.getTrafficNextX(item, data.speed * (data.direction || -1));
      const frameStep = (Math.floor(now / 135) + data.frameOffset) % TRAFFIC_FRAMES;
      const frame = this.getTrafficFrameIndex(data, frameStep);
      data.sprite.setFrame(frame);
      data.sprite.setFlipX(false);
      if (data.kind === "car") carCount += 1;
      else motoCount += 1;
      const offscreenLeft = item.x < -TRAFFIC_OFFSCREEN_MARGIN;
      const offscreenRight = item.x > GAME_WIDTH + TRAFFIC_OFFSCREEN_MARGIN;
      if (offscreenLeft || offscreenRight) {
        item.destroy(true);
        return false;
      }
      return true;
    });

    const visible = this.traffic.items.length;
    this.trafficNoise?.setIntensity({
      car: Math.min(1, carCount / 3),
      moto: Math.min(1, motoCount / 2),
      tire: Math.min(1, visible / 5),
    });
  }

  getTrafficFrameIndex(data, frameStep) {
    return data.row * TRAFFIC_FRAME_STRIDE + (frameStep % TRAFFIC_FRAMES);
  }

  getTrafficHitbox(item) {
    const data = item?.ppgTraffic;
    if (!data) return null;
    const width = data.hitbox.width * (data.scale || 1);
    const height = data.hitbox.height * (data.scale || 1);
    return {
      left: item.x - width / 2,
      right: item.x + width / 2,
      top: item.y - height - 4,
      bottom: item.y - 2,
    };
  }

  getTrafficAvoidanceBox(item, x = item?.x) {
    const data = item?.ppgTraffic;
    if (!data) return null;
    const scale = data.scale || 1;
    const width = (data.hitbox.width + (data.kind === "moto" ? 40 : 34)) * scale;
    const height = (data.kind === "moto" ? 108 : 76) * scale;
    return {
      left: x - width / 2,
      right: x + width / 2,
      top: item.y - height,
      bottom: item.y - 2,
      width
    };
  }

  getPlayerVehicleBlockBox(x = this.player?.x, y = this.player?.y) {
    if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
    if (y <= SIDEWALK_WALK_BOUNDS.maxY + 6) return null;
    return {
      left: x - 34,
      right: x + 34,
      top: y - 42,
      bottom: y + 14
    };
  }

  getTrafficNextXAgainstTraffic(item, nextX, direction) {
    const data = item?.ppgTraffic;
    if (!data || !this.traffic?.items?.length) return nextX;
    const currentBox = this.getTrafficAvoidanceBox(item, item.x);
    const nextBox = this.getTrafficAvoidanceBox(item, nextX);
    if (!currentBox || !nextBox) return nextX;

    let clampedX = nextX;
    data.stoppedByTraffic = false;

    this.traffic.items.forEach((other) => {
      if (other === item) return;
      const otherData = other.ppgTraffic;
      if (!otherData || otherData.laneId !== data.laneId) return;
      const otherBox = this.getTrafficAvoidanceBox(other, other.x);
      if (!otherBox) return;
      const sameLaneHeight = nextBox.bottom > otherBox.top && nextBox.top < otherBox.bottom;
      if (!sameLaneHeight) return;

      const gap = TRAFFIC_FOLLOW_GAP + (data.kind === "moto" || otherData.kind === "moto" ? 6 : 0);
      if (direction > 0) {
        const vehicleAhead = item.x <= other.x;
        const stillBehind = currentBox.right <= otherBox.left + gap;
        const wouldReach = nextBox.right + gap >= otherBox.left;
        if (!vehicleAhead || !stillBehind || !wouldReach) return;
        const stopX = otherBox.left - nextBox.width / 2 - gap;
        clampedX = Math.min(clampedX, Math.max(item.x, stopX));
        data.stoppedByTraffic = true;
      } else {
        const vehicleAhead = item.x >= other.x;
        const stillBehind = currentBox.left >= otherBox.right - gap;
        const wouldReach = nextBox.left - gap <= otherBox.right;
        if (!vehicleAhead || !stillBehind || !wouldReach) return;
        const stopX = otherBox.right + nextBox.width / 2 + gap;
        clampedX = Math.max(clampedX, Math.min(item.x, stopX));
        data.stoppedByTraffic = true;
      }

      if (otherData.stoppedByPlayer || otherData.stoppedByTraffic) {
        this.markTrafficLaneBlocked(data.laneId, Math.round(TRAFFIC_LANE_BLOCK_MS * 0.7));
      }
    });

    return clampedX;
  }

  getTrafficNextX(item, deltaX) {
    if (!item?.ppgTraffic) return item.x + deltaX;
    const data = item.ppgTraffic;
    const direction = data.direction || Math.sign(deltaX) || -1;
    data.stoppedByPlayer = false;
    let nextX = direction < 0 ? Math.min(item.x, item.x + deltaX) : Math.max(item.x, item.x + deltaX);
    nextX = this.getTrafficNextXAgainstTraffic(item, nextX, direction);
    if (!this.player) return nextX;
    const currentBox = this.getTrafficAvoidanceBox(item, item.x);
    const nextBox = this.getTrafficAvoidanceBox(item, nextX);
    const playerBox = this.getPlayerVehicleBlockBox();
    if (!currentBox || !nextBox || !playerBox) return nextX;
    const sameVerticalPath = nextBox.bottom > playerBox.top && nextBox.top < playerBox.bottom;
    if (!sameVerticalPath) return nextX;
    const alreadyTouching = this.boxesOverlap(currentBox, playerBox) || this.boxesOverlap(nextBox, playerBox);
    const approachingPlayer = direction > 0
      ? currentBox.right <= playerBox.left + 14
      : currentBox.left >= playerBox.right - 14;
    if (!alreadyTouching && !approachingPlayer) return nextX;

    const gap = data.kind === "moto" ? 48 : 62;
    const stopX = direction > 0
      ? playerBox.left - nextBox.width / 2 - gap
      : playerBox.right + nextBox.width / 2 + gap;
    const reachesStopLine = direction > 0
      ? nextX >= stopX
      : nextX <= stopX;
    if (!alreadyTouching && !reachesStopLine) return nextX;

    if (this.traffic) this.traffic.blockedAt = this.time.now || 0;
    this.markTrafficLaneBlocked(data.laneId);
    data.stoppedByPlayer = true;
    this.triggerTrafficHorn(data);
    return direction > 0
      ? Math.max(item.x, stopX)
      : Math.min(item.x, stopX);
  }

  getPlayerTrafficBox(x, y) {
    const playerWidth = 40;
    const playerHeight = 68;
    return {
      left: x - playerWidth / 2,
      right: x + playerWidth / 2,
      top: y - playerHeight,
      bottom: y - 4,
    };
  }

  getPlayerFootBox(x, y) {
    return {
      left: x - 16,
      right: x + 16,
      top: y - 12,
      bottom: y + 4,
    };
  }

  boxesOverlap(a, b) {
    return !(
      a.right <= b.left ||
      a.left >= b.right ||
      a.bottom <= b.top ||
      a.top >= b.bottom
    );
  }

  collidesWithTraffic(x, y) {
    if (!this.traffic?.items?.length) return false;
    if (y <= SIDEWALK_WALK_BOUNDS.maxY + 6) return false;
    const playerBox = this.getPlayerTrafficBox(x, y);
    return this.traffic.items.some((item) => {
      const hitbox = this.getTrafficHitbox(item);
      if (!hitbox) return false;
      return this.boxesOverlap(playerBox, hitbox);
    });
  }

  collidesWithStatic(x, y) {
    const playerBox = this.getPlayerFootBox(x, y);
    return STATIC_COLLISION_ZONES.some((zone) => this.boxesOverlap(playerBox, zone));
  }

  movePlayerWithTrafficCollision(dx, dy) {
    const next = this.clampWalkablePoint(this.player.x + dx, this.player.y + dy);
    const nextX = next.x;
    const nextY = next.y;
    if (this.collidesWithTraffic(nextX, nextY)) {
      if (this.traffic) this.traffic.blockedAt = this.time.now || 0;
      this.targetPoint = null;
      this.targetMarker?.setVisible(false);
      return false;
    }
    if (this.collidesWithStatic(nextX, nextY)) {
      this.staticBlockedAt = this.time.now || 0;
      this.targetPoint = null;
      this.targetMarker?.setVisible(false);
      return false;
    }
    this.player.x = nextX;
    this.player.y = nextY;
    return true;
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
    if (this.isTransitioning || this.isWalletBusy() || this.isStreetOpeningActive()) return;
    const id = hotspot.ppgHotspot?.id;
    if (id === "door") {
      this.targetPoint = new Phaser.Math.Vector2(BAR_DOOR_POINT.x, BAR_DOOR_POINT.y);
      this.targetMarker.setPosition(BAR_DOOR_POINT.x, BAR_DOOR_POINT.y).setVisible(true);
      updateGameState({
        focus: "entrada",
        objective: "Entrar no salão",
        nerdAgent: formatNerdAgent(NERD_TEAM.engine),
        prompt: "Entrada marcada. Chegue perto e aperte E para atravessar."
      });
    }
  }

  getPlayerRig() {
    const maleRig = {
      character: "male",
      frames: 4,
      scale: 0.88,
      walkFrameMs: 115,
      idleFrameMs: 480,
      phoneFrameMs: 360,
      keys: {
        walk: "ppg-player-walk-sheet",
        idleBreathe: "ppg-player-idle-breathe-sheet",
        idlePhone: "ppg-player-idle-phone-sheet"
      }
    };
    const femaleRig = {
      character: "female",
      frames: 4,
      scale: 0.88,
      walkFrameMs: 110,
      idleFrameMs: 430,
      phoneFrameMs: 320,
      keys: {
        walk: "ppg-player-female-walk-sheet",
        idleBreathe: "ppg-player-female-idle-breathe-sheet",
        idlePhone: "ppg-player-female-idle-phone-sheet"
      }
    };
    const rig = gameState.selectedCharacter === "female" ? femaleRig : maleRig;
    const hasAll = this.textures.exists(rig.keys.walk)
      && this.textures.exists(rig.keys.idleBreathe)
      && this.textures.exists(rig.keys.idlePhone);
    return hasAll ? rig : maleRig;
  }

  buildPlayer(x, y) {
    const player = this.add.container(x, y).setDepth(this.getStreetActorDepth(y) + 0.01);
    const shadow = this.add.ellipse(0, 2, 48, 11, 0x000000, 0.2)
      .setBlendMode(Phaser.BlendModes.MULTIPLY);
    const rig = this.getPlayerRig();
    const hasFinalSheets = this.textures.exists(rig.keys.walk)
      && this.textures.exists(rig.keys.idleBreathe)
      && this.textures.exists(rig.keys.idlePhone);
    const sprite = this.add.image(0, 0, hasFinalSheets ? rig.keys.idleBreathe : TEXTURE_KEYS.player)
      .setOrigin(0.5, 1)
      .setScale(hasFinalSheets ? rig.scale : 0.083);
    if (hasFinalSheets) sprite.setFrame(0);
    player.add([shadow, sprite]);
    player.ppgSprite = sprite;
    player.ppgFacing = 0;
    player.ppgMoving = false;
    player.ppgAnimationMode = "idle_breathe";
    player.ppgLastMoveAt = 0;
    player.ppgCharacter = rig.character;
    return player;
  }

  updatePlayerSprite(vector) {
    const sprite = this.player?.ppgSprite;
    const rig = this.getPlayerRig();
    const keys = rig.keys;
    if (!sprite || !this.textures.exists(keys.walk)) return;
    const now = this.time.now || this.game.loop?.time || 0;
    if (!this.player.ppgLastMoveAt) {
      this.player.ppgLastMoveAt = now;
    }
    if (this.player.ppgCharacter !== rig.character) {
      this.player.ppgCharacter = rig.character;
      this.player.ppgFacing = 0;
      this.player.ppgLastMoveAt = now;
      sprite.setScale(rig.scale);
    }
    const moving = vector && vector.lengthSq() > 0.001;
    if (moving) {
      const angle = Phaser.Math.RadToDeg(Math.atan2(vector.y, vector.x));
      const directions = [
        { frame: 0, angle: 90 },
        { frame: 1, angle: 45 },
        { frame: 2, angle: 0 },
        { frame: 3, angle: -45 },
        { frame: 4, angle: -90 },
        { frame: 5, angle: -135 },
        { frame: 6, angle: 180 },
        { frame: 7, angle: 135 }
      ];
      const nearest = directions
        .map((entry) => ({ ...entry, distance: Math.abs(Phaser.Math.Angle.ShortestBetween(angle, entry.angle)) }))
        .sort((a, b) => a.distance - b.distance)[0];
      this.player.ppgFacing = nearest.frame;
      this.player.ppgMoving = true;
      this.player.ppgLastMoveAt = now;
    } else {
      this.player.ppgMoving = false;
    }
    const idleMs = now - (this.player.ppgLastMoveAt || now);
    const phoneSequence = this.player.ppgPhoneSequence;
    const phoneSequenceActive = Boolean(phoneSequence && now < phoneSequence.until);
    const phoneActive = phoneSequenceActive || gameState.walletOpen;
    const nextMode = moving ? "walk" : phoneActive ? "idle_phone" : "idle_breathe";
    const textureKey = nextMode === "walk"
      ? keys.walk
      : nextMode === "idle_phone"
        ? keys.idlePhone
        : keys.idleBreathe;
    if (sprite.texture?.key !== textureKey) {
      sprite.setTexture(textureKey);
    }
    let frameIndex = 0;
    if (nextMode === "walk") {
      frameIndex = Math.floor(now / rig.walkFrameMs) % rig.frames;
    } else if (nextMode === "idle_phone") {
      frameIndex = this.getPhoneFrameIndex(phoneSequence, rig, now);
    } else if (idleMs >= 3000) {
      frameIndex = Math.floor(now / rig.idleFrameMs) % rig.frames;
    }
    sprite.setFrame((this.player.ppgFacing || 0) * rig.frames + frameIndex);
    this.player.ppgAnimationMode = nextMode;
    this.player.ppgCharacter = rig.character;
  }

  getPhoneFrameIndex(sequence, rig, now) {
    if (sequence?.mode === "put-away") {
      const elapsed = now - sequence.startedAt;
      const lastPhoneFrame = Math.max(0, Math.min(2, rig.frames - 1));
      if (elapsed < 170) return lastPhoneFrame;
      if (elapsed < 350) return Math.min(1, lastPhoneFrame);
      return 0;
    }
    return this.getPhonePullFrameIndex(sequence ? now - sequence.startedAt : 9999, rig);
  }

  getPhonePullFrameIndex(elapsed, rig) {
    const lastPhoneFrame = Math.max(0, Math.min(2, rig.frames - 1));
    if (elapsed < 170) return 0;
    if (elapsed < 360) return Math.min(1, lastPhoneFrame);
    return lastPhoneFrame;
  }

  isWalletBusy() {
    return this.walletMenuOpening || this.walletMenuClosing || gameState.walletOpen;
  }

  handleWalletCloseRequest({ source } = {}) {
    if (!this.walletMenuOpening || gameState.walletOpen) return;
    this.walletOpenTimer?.remove(false);
    this.walletMenuOpening = false;
    this.startPhonePocketSequence(source === "escape" ? "ESC guardou o celular antes da carteira abrir." : "Celular guardado.");
  }

  handleWalletClosed({ fromScene } = {}) {
    if (fromScene !== "street") return;
    this.startPhonePocketSequence("Guardando o celular no bolso.");
  }

  startPhonePocketSequence(prompt = "Guardando o celular no bolso.") {
    if (!this.player) return;
    const now = this.time.now || 0;
    this.walletMenuClosing = true;
    this.targetPoint = null;
    this.targetMarker?.setVisible(false);
    this.player.ppgPhoneSequence = {
      mode: "put-away",
      startedAt: now,
      until: now + 620
    };
    this.updatePlayerSprite(new Phaser.Math.Vector2(0, 0));
    updateGameState({
      currentScene: "street",
      walletOpen: false,
      walletPhase: "phone-pocket",
      focus: "celular da carteira",
      objective: "Guardar o celular e voltar ao controle",
      nerdAgent: formatNerdAgent(NERD_TEAM.hud),
      prompt
    });
    this.walletCloseTimer?.remove(false);
    this.walletCloseTimer = this.time.delayedCall(620, () => {
      this.walletMenuClosing = false;
      if (this.player?.ppgPhoneSequence?.mode === "put-away") {
        this.player.ppgPhoneSequence = null;
      }
      updateGameState({
        currentScene: "street",
        walletOpen: false,
        walletPhase: "closed",
        focus: "rua principal",
        objective: "Entrar no PubPaid pela porta principal",
        prompt: "Celular guardado. Use E perto da porta para entrar no salão."
      });
    });
  }

  handleMobileControl({ action, pressed } = {}) {
    if (!action) return;
    if (this.isStreetOpeningActive()) {
      this.mobileActions.clear();
      return;
    }
    if (["up", "down", "left", "right"].includes(action)) {
      if (pressed) this.mobileActions.add(action);
      else this.mobileActions.delete(action);
      return;
    }
    if (!pressed) return;
    if (action === "wallet") {
      this.openWalletMenuSequence();
      return;
    }
    if (action === "door") {
      this.tryDoorInteraction();
    }
  }

  handleResize(gameSize) {
    if (!gameSize || !this.cameras?.main) return;
    this.cameras.main.setZoom(gameSize.width < 700 ? 0.82 : 1);
  }

  nudgePlayer(dx, dy) {
    if (gameState.characterSelectOpen || this.isWalletBusy() || this.isStreetOpeningActive()) return;
    const target = this.clampWalkablePoint(this.player.x + dx, this.player.y + dy);
    this.targetPoint = new Phaser.Math.Vector2(
      target.x,
      target.y
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
    if (this.isTransitioning || gameState.characterSelectOpen || this.isWalletBusy() || this.isStreetOpeningActive() || now < this.interactionCooldown) return;
    this.interactionCooldown = now + 250;

    const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, BAR_DOOR_POINT.x, BAR_DOOR_POINT.y);
    if (distance < 74) {
      this.enterInterior();
      return;
    }
    updateGameState({
      focus: "calçada",
      objective: "Chegar mais perto da entrada",
      nerdAgent: formatNerdAgent(NERD_TEAM.physics),
      prompt: "Chegue mais perto da porta para entrar com E. Enter abre a carteira."
    });
  }

  tryNearestHotspot() {
    if (this.isTransitioning || gameState.characterSelectOpen || this.isWalletBusy() || this.isStreetOpeningActive()) return;
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

  openWalletMenuSequence() {
    const now = this.time.now || 0;
    if (this.isTransitioning || gameState.characterSelectOpen || this.isWalletBusy() || this.isStreetOpeningActive() || now < this.interactionCooldown) return;
    this.interactionCooldown = now + 2600;
    this.walletMenuOpening = true;
    this.targetPoint = null;
    this.targetMarker?.setVisible(false);
    this.player.ppgPhoneSequence = {
      mode: "pull",
      startedAt: now,
      revealAt: now + 2000,
      until: now + 2600
    };
    this.updatePlayerSprite(new Phaser.Math.Vector2(0, 0));
    updateGameState({
      currentScene: "street",
      walletOpen: false,
      walletPhase: "phone-pull",
      focus: "celular da carteira",
      objective: "Puxar a carteira pelo celular",
      nerdAgent: formatNerdAgent(NERD_TEAM.hud),
      prompt: "Puxando o celular. O ultimo sprite segura a pose antes da carteira aparecer."
    });
    this.walletOpenTimer?.remove(false);
    this.walletOpenTimer = this.time.delayedCall(2000, () => {
      if (!this.scene.isActive("street-scene") || this.isTransitioning) {
        this.walletMenuOpening = false;
        return;
      }
      this.walletMenuOpening = false;
      this.scene.launch("wallet-scene", {
        fromScene: "street",
        originX: this.player.x,
        originY: this.player.y,
        selectedCharacter: gameState.selectedCharacter
      });
      this.scene.bringToTop("wallet-scene");
    });
  }

  update(_time, delta = 16) {
    if (this.isTransitioning) {
      return;
    }
    if (this.isStreetOpeningActive()) {
      this.updateStreetPedestrians(delta);
      this.updateStreetOpening();
      this.updateStreetVisualFx();
      return;
    }
    this.updateStreetPedestrians(delta);
    this.updateTraffic();
    const movementVector = new Phaser.Math.Vector2(0, 0);
    if (gameState.characterSelectOpen || this.isWalletBusy()) {
      this.targetPoint = null;
      this.targetMarker?.setVisible(false);
      this.updatePlayerSprite(movementVector);
      this.updatePlayerStreetDepth();
      this.updateStreetVisualFx();
      return;
    }
    const keyboardVector = new Phaser.Math.Vector2(0, 0);
    if (this.cursors.left.isDown) keyboardVector.x -= 1;
    if (this.cursors.right.isDown) keyboardVector.x += 1;
    if (this.cursors.up.isDown) keyboardVector.y -= 1;
    if (this.cursors.down.isDown) keyboardVector.y += 1;
    if (this.mobileActions.has("left")) keyboardVector.x -= 1;
    if (this.mobileActions.has("right")) keyboardVector.x += 1;
    if (this.mobileActions.has("up")) keyboardVector.y -= 1;
    if (this.mobileActions.has("down")) keyboardVector.y += 1;

    if (keyboardVector.lengthSq() > 0) {
      keyboardVector.normalize().scale(2.6);
      if (this.movePlayerWithTrafficCollision(keyboardVector.x, keyboardVector.y)) {
        movementVector.copy(keyboardVector);
        this.targetPoint = null;
        this.targetMarker.setVisible(false);
      }
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
        movementVector.set(dx / distance, dy / distance);
        if (!this.movePlayerWithTrafficCollision(movementVector.x * speed, movementVector.y * speed)) {
          movementVector.set(0, 0);
        }
      }
    }
    this.updatePlayerSprite(movementVector);
    this.updatePlayerStreetDepth();

    const nearDoor = Phaser.Math.Distance.Between(this.player.x, this.player.y, BAR_DOOR_POINT.x, BAR_DOOR_POINT.y) < 74;
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
    const justBlockedByTraffic = (this.time.now || 0) - (this.traffic?.blockedAt || 0) < 220;
    const justBlockedByStatic = (this.time.now || 0) - (this.staticBlockedAt || 0) < 220;
    updateGameState({
      currentScene: "street",
      focus: justBlockedByTraffic ? "faixa com trafego" : justBlockedByStatic ? "obstaculo da calcada" : nearDoor ? "porta principal" : "rua viva",
      objective: justBlockedByTraffic ? "Esperar carro ou moto passar" : justBlockedByStatic ? "Contornar predio, porta ou ponto" : nearDoor ? "Apertar E para entrar" : "Entrar no PubPaid pela porta principal",
      nerdAgent: formatNerdAgent(nearDoor ? NERD_TEAM.engine : NERD_TEAM.physics),
      trafficCount: this.traffic?.items?.length || 0,
      pedestrianCount: this.streetWalkers?.length || 0,
      trafficBlocked: justBlockedByTraffic,
      prompt: justBlockedByTraffic
        ? "O transito bloqueou a passagem. A faixa direita para esquerda tem colisao real."
        : justBlockedByStatic
          ? "Objeto fisico bloqueado: predio, porta, ponto de onibus ou esquina."
          : nearDoor
            ? "Porta encontrada. Aperte E para entrar no salao. Enter abre a carteira."
            : nearestHotspot?.distance < 120
              ? "Ponto ativo perto. Aperte E ou clique para interagir."
              : "Rua em teste com transito indo da direita para a esquerda. Enter abre a carteira."
    });

    this.updateStreetVisualFx();
  }

  updateStreetVisualFx() {
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
