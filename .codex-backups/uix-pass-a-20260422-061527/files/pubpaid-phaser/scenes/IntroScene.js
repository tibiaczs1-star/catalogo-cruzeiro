import { GAME_HEIGHT, GAME_WIDTH } from "../config/gameConfig.js";
import { NERD_TEAM, formatNerdAgent } from "../config/nerdTeam.js";
import { updateGameState } from "../core/gameState.js";

const INTRO_FRAMES = [
  {
    key: "intro-frame-01",
    label: "chegada ao pub",
    hold: 660,
    fromScale: 1.2,
    toScale: 1.09,
    fromX: 650,
    toX: 632,
    flash: 0.05,
    light: { x: 845, y: 160, color: 0xff4fb8, alpha: 0.12 },
    sweep: 0.08,
    cameraZoom: 1.012
  },
  {
    key: "intro-frame-02",
    label: "chegada ao pub",
    hold: 500,
    fromScale: 1.18,
    toScale: 1.11,
    fromX: 642,
    toX: 628,
    flash: 0.04,
    light: { x: 880, y: 170, color: 0x50efff, alpha: 0.1 },
    cameraZoom: 1.018
  },
  {
    key: "intro-frame-03",
    label: "chegada ao pub",
    hold: 500,
    fromScale: 1.17,
    toScale: 1.1,
    fromX: 636,
    toX: 622,
    flash: 0.04,
    light: { x: 760, y: 138, color: 0xffd06d, alpha: 0.1 },
    cameraZoom: 1.02
  },
  {
    key: "intro-frame-04",
    label: "olhar para dentro",
    hold: 700,
    fromScale: 1.15,
    toScale: 1.08,
    fromX: 632,
    toX: 616,
    flash: 0.04,
    light: { x: 690, y: 190, color: 0xffd06d, alpha: 0.14 },
    sweep: 0.1,
    cameraZoom: 1.024
  },
  {
    key: "intro-frame-05",
    label: "olhar para dentro",
    hold: 500,
    fromScale: 1.15,
    toScale: 1.09,
    fromX: 626,
    toX: 616,
    flash: 0.04,
    light: { x: 792, y: 214, color: 0xff4fb8, alpha: 0.12 },
    cameraZoom: 1.026
  },
  {
    key: "intro-frame-06",
    label: "olhar para dentro",
    hold: 500,
    fromScale: 1.15,
    toScale: 1.09,
    fromX: 622,
    toX: 612,
    flash: 0.05,
    light: { x: 875, y: 186, color: 0x50efff, alpha: 0.12 },
    cameraZoom: 1.028
  },
  {
    key: "intro-frame-07",
    label: "celular na mao",
    hold: 700,
    fromScale: 1.16,
    toScale: 1.1,
    fromX: 620,
    toX: 604,
    flash: 0.08,
    light: { x: 520, y: 302, color: 0x50efff, alpha: 0.18 },
    phone: true,
    sweep: 0.14,
    cameraZoom: 1.03
  },
  {
    key: "intro-frame-08",
    label: "celular na mao",
    hold: 500,
    fromScale: 1.17,
    toScale: 1.11,
    fromX: 616,
    toX: 606,
    flash: 0.1,
    light: { x: 560, y: 300, color: 0x50efff, alpha: 0.2 },
    phone: true,
    cameraZoom: 1.034
  },
  {
    key: "intro-frame-09",
    label: "celular na mao",
    hold: 500,
    fromScale: 1.17,
    toScale: 1.11,
    fromX: 612,
    toX: 602,
    flash: 0.14,
    light: { x: 602, y: 292, color: 0x50efff, alpha: 0.24 },
    phone: true,
    cameraZoom: 1.036
  },
  {
    key: "intro-frame-10",
    label: "toque na tela",
    hold: 700,
    fromScale: 1.18,
    toScale: 1.12,
    fromX: 606,
    toX: 596,
    flash: 0.22,
    light: { x: 622, y: 284, color: 0x8ef0a3, alpha: 0.32 },
    phone: true,
    sweep: 0.22,
    cameraZoom: 1.044
  },
  {
    key: "intro-frame-11",
    label: "neon acordando",
    hold: 600,
    fromScale: 1.16,
    toScale: 1.1,
    fromX: 610,
    toX: 616,
    flash: 0.22,
    light: { x: 660, y: 150, color: 0xff4fb8, alpha: 0.28 },
    sweep: 0.28,
    cameraZoom: 1.036
  },
  {
    key: "intro-frame-12",
    label: "neon acordando",
    hold: 600,
    fromScale: 1.15,
    toScale: 1.09,
    fromX: 614,
    toX: 622,
    flash: 0.26,
    light: { x: 688, y: 150, color: 0x50efff, alpha: 0.3 },
    sweep: 0.3,
    cameraZoom: 1.03
  },
  {
    key: "intro-frame-13",
    label: "neon acorda",
    hold: 900,
    fromScale: 1.14,
    toScale: 1.06,
    fromX: 616,
    toX: 628,
    flash: 0.3,
    light: { x: 680, y: 142, color: 0xffd06d, alpha: 0.34 },
    sweep: 0.36,
    cameraZoom: 1.018
  },
  {
    key: "intro-frame-14",
    label: "entrada surgindo",
    hold: 600,
    fromScale: 1.12,
    toScale: 1.05,
    fromX: 622,
    toX: 630,
    flash: 0.2,
    light: { x: 640, y: 132, color: 0xffd06d, alpha: 0.28 },
    sweep: 0.22,
    cameraZoom: 1.012
  },
  {
    key: "intro-frame-15",
    label: "entrada surgindo",
    hold: 600,
    fromScale: 1.1,
    toScale: 1.03,
    fromX: 632,
    toX: 636,
    flash: 0.18,
    light: { x: 640, y: 126, color: 0xffd06d, alpha: 0.24 },
    cameraZoom: 1.006
  },
  {
    key: "intro-frame-16",
    label: "entrada pubpaid 2.0",
    hold: 1200,
    fromScale: 1.08,
    toScale: 1,
    fromX: 640,
    toX: 640,
    flash: 0.16,
    light: { x: 640, y: 132, color: 0xffd06d, alpha: 0.3 },
    sweep: 0.18,
    cameraZoom: 1,
    final: true
  }
];

const INTRO_TOTAL = INTRO_FRAMES.length;
const INTRO_DURATION_MS = INTRO_FRAMES.reduce((total, frame) => total + frame.hold, 0);

export class IntroScene extends Phaser.Scene {
  constructor() {
    super("intro-scene");
    this.currentImage = null;
    this.nextImage = null;
    this.scanline = null;
    this.flashLayer = null;
    this.vignette = null;
    this.caption = null;
    this.lightWash = null;
    this.sweepLight = null;
    this.phoneGlow = null;
    this.neonRays = null;
    this.sparkLayer = null;
    this.letterboxTop = null;
    this.letterboxBottom = null;
    this.progressMarks = [];
    this.finalPulse = null;
    this.baseZoom = 1;
    this.activeLight = { x: GAME_WIDTH / 2, y: GAME_HEIGHT / 2, color: 0xffd06d, alpha: 0.12 };
    this.elapsedMs = 0;
    this.sequenceDone = false;
  }

  create() {
    this.buildStageLayers();
    this.input.keyboard.on("keydown-ENTER", () => this.skipOrContinue());
    this.input.on("pointerdown", () => this.skipOrContinue());
    this.scale.on("resize", this.handleResize, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off("resize", this.handleResize, this);
    });
    this.handleResize(this.scale.gameSize);
    this.game.events.emit("pubpaid:intro-start", { totalFrames: INTRO_TOTAL });
    this.playFrame(0);

    updateGameState({
      currentScene: "intro",
      focus: "sequencia bitmap PubPaid",
      objective: "Assistir a abertura e liberar termos/Login",
      nerdAgent: formatNerdAgent(NERD_TEAM.sprite),
      prompt: `Abertura premium com luzes, camera e ${Math.round(INTRO_DURATION_MS / 1000)}s de sequencia. A interface aparece quando o ultimo frame congelar.`
    });
  }

  buildStageLayers() {
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x02030a, 1);
    this.currentImage = this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, INTRO_FRAMES[0].key)
      .setDisplaySize(GAME_WIDTH, GAME_HEIGHT)
      .setAlpha(0);
    this.nextImage = this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, INTRO_FRAMES[0].key)
      .setDisplaySize(GAME_WIDTH, GAME_HEIGHT)
      .setAlpha(0);

    this.flashLayer = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0xffe3a0, 0)
      .setBlendMode(Phaser.BlendModes.SCREEN);
    this.lightWash = this.add.circle(GAME_WIDTH / 2, GAME_HEIGHT / 2, 260, 0xffd06d, 0)
      .setBlendMode(Phaser.BlendModes.SCREEN);
    this.phoneGlow = this.add.circle(560, 300, 90, 0x50efff, 0)
      .setBlendMode(Phaser.BlendModes.SCREEN);
    this.sweepLight = this.add.rectangle(-160, GAME_HEIGHT / 2, 120, GAME_HEIGHT * 1.32, 0x50efff, 0)
      .setAngle(-18)
      .setBlendMode(Phaser.BlendModes.SCREEN);
    this.neonRays = this.add.graphics().setBlendMode(Phaser.BlendModes.SCREEN);
    this.sparkLayer = this.add.graphics().setBlendMode(Phaser.BlendModes.SCREEN);
    const scanlineTexture = this.makeScanlineTexture();
    this.scanline = this.add.tileSprite(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, scanlineTexture)
      .setAlpha(0.08);
    this.vignette = this.add.graphics();
    this.drawVignette();
    this.letterboxTop = this.add.rectangle(GAME_WIDTH / 2, 31, GAME_WIDTH, 62, 0x02030a, 0.48);
    this.letterboxBottom = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT - 31, GAME_WIDTH, 62, 0x02030a, 0.52);

    this.caption = this.add.text(48, GAME_HEIGHT - 54, "preparando entrada", {
      fontFamily: "Trebuchet MS, Verdana, sans-serif",
      fontSize: "18px",
      fontStyle: "bold",
      color: "#fff6dc",
      stroke: "#050711",
      strokeThickness: 5
    }).setAlpha(0.78);

    for (let index = 0; index < INTRO_FRAMES.length; index += 1) {
      const mark = this.add.rectangle(48 + index * 28, 38, 18, 4, 0xffd06d, 0.2);
      this.progressMarks.push(mark);
    }
  }

  makeScanlineTexture() {
    const key = "intro-scanline-texture";
    if (this.textures.exists(key)) return key;
    const canvas = this.textures.createCanvas(key, 8, 8);
    const ctx = canvas.getContext();
    ctx.fillStyle = "rgba(255,255,255,0.16)";
    ctx.fillRect(0, 0, 8, 1);
    ctx.fillStyle = "rgba(0,0,0,0.18)";
    ctx.fillRect(0, 4, 8, 1);
    canvas.refresh();
    return key;
  }

  drawVignette() {
    this.vignette.clear();
    this.vignette.fillStyle(0x02030a, 0.34);
    this.vignette.fillRect(0, 0, GAME_WIDTH, 82);
    this.vignette.fillRect(0, GAME_HEIGHT - 92, GAME_WIDTH, 92);
    this.vignette.fillStyle(0x000000, 0.28);
    this.vignette.fillRect(0, 0, 44, GAME_HEIGHT);
    this.vignette.fillRect(GAME_WIDTH - 44, 0, 44, GAME_HEIGHT);
  }

  playFrame(index) {
    const frame = INTRO_FRAMES[index];
    if (!frame || this.sequenceDone) return;
    this.game.events.emit("pubpaid:intro-frame", {
      index,
      totalFrames: INTRO_TOTAL,
      label: frame.label,
      final: Boolean(frame.final)
    });
    const target = index === 0 ? this.currentImage : this.nextImage;
    const previous = index === 0 ? null : this.currentImage;

    target
      .setTexture(frame.key)
      .setDisplaySize(GAME_WIDTH * frame.fromScale, GAME_HEIGHT * frame.fromScale)
      .setPosition(frame.fromX, GAME_HEIGHT / 2)
      .setAlpha(0);
    target.setDepth(1);
    if (previous) previous.setDepth(0);

    this.caption.setText(`${String(index + 1).padStart(2, "0")} / ${String(INTRO_TOTAL).padStart(2, "0")} - ${frame.label}`);
    this.progressMarks.forEach((mark, markIndex) => {
      mark.setAlpha(markIndex <= index ? 0.86 : 0.2);
      mark.setFillStyle(markIndex <= index ? 0xffd06d : 0x5f5a6b, markIndex <= index ? 0.86 : 0.22);
    });

    this.tweens.add({
      targets: target,
      alpha: 1,
      duration: index === 0 ? 560 : 420,
      ease: "Sine.easeOut"
    });
    this.tweens.add({
      targets: target,
      x: frame.toX,
      displayWidth: GAME_WIDTH * frame.toScale,
      displayHeight: GAME_HEIGHT * frame.toScale,
      duration: frame.hold + 440,
      ease: "Sine.easeInOut"
    });

    if (previous) {
      this.tweens.add({
        targets: previous,
        alpha: 0,
        displayWidth: previous.displayWidth + 48,
        displayHeight: previous.displayHeight + 27,
        duration: 520,
        ease: "Sine.easeInOut"
      });
      this.currentImage = target;
      this.nextImage = previous;
    }

    this.flash(frame.flash);
    this.cameraBeat(index);
    this.lightBeat(frame, index);

    this.time.delayedCall(frame.hold, () => {
      if (frame.final) {
        this.freezeFinalFrame();
        return;
      }
      this.playFrame(index + 1);
    });
  }

  flash(alpha) {
    this.flashLayer.setAlpha(alpha);
    this.tweens.add({
      targets: this.flashLayer,
      alpha: 0,
      duration: 620,
      ease: "Sine.easeOut"
    });
  }

  cameraBeat(index) {
    const frame = INTRO_FRAMES[index];
    const zoom = this.baseZoom * (frame.cameraZoom || 1);
    this.cameras.main.zoomTo(zoom, Math.max(360, frame.hold + 300), "Sine.easeInOut");
    if (index < 3) return;
    this.cameras.main.shake(120, 0.0012 + index * 0.00012);
  }

  lightBeat(frame, index) {
    const light = frame.light || { x: GAME_WIDTH / 2, y: GAME_HEIGHT / 2, color: 0xffd06d, alpha: 0.12 };
    this.activeLight = light;
    this.lightWash
      .setPosition(light.x, light.y)
      .setFillStyle(light.color, light.alpha || 0.12)
      .setScale(0.72)
      .setAlpha(light.alpha || 0.12);
    this.tweens.add({
      targets: this.lightWash,
      alpha: 0,
      scale: 1.85,
      duration: Math.max(520, frame.hold + 360),
      ease: "Sine.easeOut"
    });

    this.phoneGlow.setAlpha(frame.phone ? 0.28 : 0);
    if (frame.phone) {
      this.phoneGlow
        .setPosition(light.x, light.y)
        .setScale(0.7);
      this.tweens.add({
        targets: this.phoneGlow,
        alpha: { from: 0.28, to: 0.04 },
        scale: { from: 0.72, to: 1.45 },
        duration: Math.max(480, frame.hold + 280),
        ease: "Sine.easeOut"
      });
    }

    this.drawNeonRays(light, frame, index);

    if (frame.sweep) {
      this.sweepLight
        .setFillStyle(light.color, frame.sweep)
        .setPosition(-160, GAME_HEIGHT / 2)
        .setAlpha(frame.sweep);
      this.tweens.add({
        targets: this.sweepLight,
        x: GAME_WIDTH + 180,
        alpha: 0,
        duration: Math.max(700, frame.hold + 520),
        ease: "Sine.easeInOut"
      });
    }
  }

  drawNeonRays(light, frame, index) {
    this.neonRays.clear();
    const alpha = Math.min(0.22, (light.alpha || 0.12) * 0.72);
    this.neonRays.lineStyle(2, light.color || 0xffd06d, alpha);
    const rayCount = frame.final ? 9 : 5;
    for (let ray = 0; ray < rayCount; ray += 1) {
      const offset = (ray - Math.floor(rayCount / 2)) * 34;
      const x1 = light.x + offset * 0.2;
      const y1 = light.y + 12;
      const x2 = light.x + offset + Math.sin(index + ray) * 26;
      const y2 = GAME_HEIGHT - 92 - ray * 3;
      this.neonRays.beginPath();
      this.neonRays.moveTo(x1, y1);
      this.neonRays.lineTo(x2, y2);
      this.neonRays.strokePath();
    }
    this.neonRays.setAlpha(0.7);
    this.tweens.add({
      targets: this.neonRays,
      alpha: 0,
      duration: Math.max(520, frame.hold + 240),
      ease: "Sine.easeOut"
    });
  }

  freezeFinalFrame() {
    if (this.sequenceDone) return;
    this.sequenceDone = true;
    this.caption.setText(`${String(INTRO_TOTAL).padStart(2, "0")} / ${String(INTRO_TOTAL).padStart(2, "0")} - PubPaid 2.0 pronto para entrada`);
    this.currentImage
      .setTexture(`intro-frame-${String(INTRO_TOTAL).padStart(2, "0")}`)
      .setDisplaySize(GAME_WIDTH, GAME_HEIGHT)
      .setPosition(GAME_WIDTH / 2, GAME_HEIGHT / 2)
      .setAlpha(1);
    this.cameras.main.zoomTo(this.baseZoom, 520, "Sine.easeOut");
    this.finalPulse = this.add.rectangle(GAME_WIDTH / 2, 292, 520, 170, 0xffd06d, 0)
      .setBlendMode(Phaser.BlendModes.SCREEN);
    this.tweens.add({
      targets: this.finalPulse,
      alpha: { from: 0.02, to: 0.15 },
      duration: 920,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut"
    });

    updateGameState({
      currentScene: "intro",
      focus: "frame final congelado",
      objective: "Aceitar termos e entrar com Google",
      nerdAgent: formatNerdAgent(NERD_TEAM.hud),
      prompt: `Frame final congelado apos ${Math.round(INTRO_DURATION_MS / 1000)}s. Interface de entrada pronta sobre a cena.`
    });
    window.setTimeout(() => this.game.events.emit("pubpaid:intro-ready"), 520);
  }

  skipOrContinue() {
    if (this.sequenceDone) {
      this.game.events.emit("pubpaid:intro-ready");
      return;
    }
    this.tweens.killTweensOf([this.currentImage, this.nextImage, this.flashLayer]);
    this.freezeFinalFrame();
  }

  handleResize(gameSize) {
    if (!gameSize || !this.cameras?.main) return;
    this.baseZoom = gameSize.width < 700 ? 0.82 : 1;
    this.cameras.main.setZoom(this.baseZoom);
  }

  update(_time, delta) {
    this.elapsedMs += delta;
    if (this.scanline) {
      this.scanline.tilePositionY += delta * 0.025;
    }
    this.drawSparkles();
  }

  drawSparkles() {
    if (!this.sparkLayer) return;
    this.sparkLayer.clear();
    const time = this.elapsedMs * 0.001;
    const colorA = this.sequenceDone ? 0xffd06d : 0x50efff;
    const colorB = this.sequenceDone ? 0x8ef0a3 : 0xff4fb8;

    for (let index = 0; index < 34; index += 1) {
      const phase = time * (1.2 + (index % 5) * 0.18) + index * 1.73;
      const orbit = 36 + (index % 7) * 18;
      const nearSign = index % 3 !== 0;
      const baseX = nearSign ? 620 + Math.sin(index) * 250 : this.activeLight.x;
      const baseY = nearSign ? 128 + Math.cos(index * 0.7) * 44 : this.activeLight.y;
      const x = baseX + Math.sin(phase) * orbit;
      const y = baseY + Math.cos(phase * 0.82) * (orbit * 0.35);
      const alpha = 0.08 + Math.max(0, Math.sin(phase * 2.1)) * 0.26;
      const size = 1.2 + (index % 4) * 0.55;
      this.sparkLayer.fillStyle(index % 2 ? colorA : colorB, alpha);
      this.sparkLayer.fillRect(x, y, size, size);
      if (alpha > 0.26) {
        this.sparkLayer.fillRect(x - size * 1.7, y, size * 4, 1);
        this.sparkLayer.fillRect(x, y - size * 1.7, 1, size * 4);
      }
    }
  }
}
