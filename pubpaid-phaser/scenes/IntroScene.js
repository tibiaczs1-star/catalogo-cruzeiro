import { GAME_HEIGHT, GAME_WIDTH } from "../config/gameConfig.js";
import { updateGameState } from "../core/gameState.js";

const INTRO_FRAMES = Array.from({ length: 16 }, (_item, index) => {
  const frame = index + 1;
  return {
    key: `intro-frame-${String(frame).padStart(2, "0")}`,
    label: frame < 5 ? "chegada" : frame < 10 ? "toque no celular" : frame < 15 ? "neon acendendo" : "porta pub paid",
    hold: frame === 16 ? 980 : 360,
    fromScale: frame < 7 ? 1.08 : 1.04,
    toScale: frame === 16 ? 1.02 : 1.12,
    fromX: 640,
    toX: frame % 2 === 0 ? 632 : 648,
    flash: frame > 11 ? 0.18 : 0.06,
    final: frame === 16
  };
});

const INTRO_TOTAL = INTRO_FRAMES.length;
const FINAL_ENTER_POINT = {
  x: 672,
  y: 548,
  radius: 18
};

export class IntroScene extends Phaser.Scene {
  constructor() {
    super("intro-scene");
    this.currentImage = null;
    this.nextImage = null;
    this.scanline = null;
    this.flashLayer = null;
    this.vignette = null;
    this.caption = null;
    this.progressMarks = [];
    this.finalPulse = null;
    this.finalEnterPoint = null;
    this.sequenceDone = false;
  }

  create() {
    this.buildStageLayers();
    this.input.keyboard.on("keydown-ENTER", () => this.skipOrContinue());
    this.input.on("pointerdown", (pointer) => this.handlePointerDown(pointer));
    this.scale.on("resize", this.handleResize, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off("resize", this.handleResize, this);
    });
    this.handleResize(this.scale.gameSize);
    this.game.events.emit("pubpaid:intro-start", { totalFrames: INTRO_TOTAL });
    this.playFrame(0);

    updateGameState({
      currentScene: "intro",
      focus: "intro PubPaid",
      objective: "Assistir a abertura",
      prompt: "Abertura antiga restaurada como base: toque, neon e porta PUB PAID."
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
    const scanlineTexture = this.makeScanlineTexture();
    this.scanline = this.add.tileSprite(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, scanlineTexture)
      .setAlpha(0.08);
    this.vignette = this.add.graphics();
    this.drawVignette();

    this.caption = this.add.text(48, GAME_HEIGHT - 54, "pubpaid 2.0", {
      fontFamily: "Courier New, Lucida Console, monospace",
      fontSize: "15px",
      fontStyle: "bold",
      color: "#fff6dc",
      stroke: "#050711",
      strokeThickness: 5
    }).setAlpha(0.72).setLetterSpacing(3);

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

    this.caption.setText(`${String(index + 1).padStart(2, "0")} / ${String(INTRO_TOTAL).padStart(2, "0")} - ${frame.label.toUpperCase()}`);
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
    this.drawCinematicOverlays(index, frame);

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
    if (index < 2) return;
    this.cameras.main.shake(120, 0.0012 + index * 0.00012);
  }

  drawCinematicOverlays(index, frame) {
    if (this.cinematicOverlay) {
      this.cinematicOverlay.destroy();
    }
    this.cinematicOverlay = this.add.container(0, 0).setDepth(4);
    const letterTop = this.add.rectangle(GAME_WIDTH / 2, 34, GAME_WIDTH, 68, 0x02030a, 0.42);
    const letterBottom = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT - 34, GAME_WIDTH, 68, 0x02030a, 0.42);
    this.cinematicOverlay.add([letterTop, letterBottom]);

    if (frame.label.includes("carros")) {
      const headlightA = this.add.rectangle(-120, 592, 220, 18, 0xffd06d, 0.18)
        .setBlendMode(Phaser.BlendModes.SCREEN);
      const headlightB = this.add.rectangle(GAME_WIDTH + 120, 632, 260, 14, 0x50efff, 0.12)
        .setBlendMode(Phaser.BlendModes.SCREEN);
      this.cinematicOverlay.add([headlightA, headlightB]);
      this.tweens.add({ targets: headlightA, x: GAME_WIDTH + 140, duration: frame.hold + 300, ease: "Cubic.easeIn" });
      this.tweens.add({ targets: headlightB, x: -140, duration: frame.hold + 420, ease: "Cubic.easeIn" });
    }

    if (frame.label.includes("porta") || frame.label.includes("entrada")) {
      const doorGlow = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0xffd06d, 0.08)
        .setBlendMode(Phaser.BlendModes.SCREEN);
      this.cinematicOverlay.add(doorGlow);
      this.tweens.add({
        targets: doorGlow,
        alpha: { from: 0.04, to: 0.22 },
        duration: Math.max(260, frame.hold - 80),
        yoyo: true,
        ease: "Sine.easeInOut"
      });
    }

  }

  freezeFinalFrame() {
    if (this.sequenceDone) return;
    this.sequenceDone = true;
    this.caption.setText("PUBPAID 2.0 - PORTA");
    this.currentImage
      .setTexture(INTRO_FRAMES[INTRO_TOTAL - 1].key)
      .setDisplaySize(GAME_WIDTH, GAME_HEIGHT)
      .setPosition(GAME_WIDTH / 2, GAME_HEIGHT / 2)
      .setAlpha(1);
    this.drawCinematicOverlays(INTRO_TOTAL - 1, INTRO_FRAMES[INTRO_TOTAL - 1]);
    this.finalPulse = this.add.circle(FINAL_ENTER_POINT.x, FINAL_ENTER_POINT.y, 12, 0xffd06d, 0)
      .setBlendMode(Phaser.BlendModes.SCREEN)
      .setDepth(5);
    this.finalEnterPoint = this.add.circle(FINAL_ENTER_POINT.x, FINAL_ENTER_POINT.y, 4, 0xfff0cf, 0.9)
      .setStrokeStyle(2, 0xffd06d, 0.92)
      .setDepth(6);
    this.tweens.add({
      targets: this.finalPulse,
      alpha: { from: 0.08, to: 0.24 },
      scale: { from: 0.9, to: 1.5 },
      duration: 880,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut"
    });

    updateGameState({
      currentScene: "intro",
      focus: "frame final congelado",
      objective: "Entrar pela porta da imagem",
      prompt: "Frame final congelado. Clique no ponto da porta ou aperte Enter para entrar."
    });
  }

  handlePointerDown(pointer) {
    if (!this.sequenceDone) {
      this.skipOrContinue();
      return;
    }
    const distance = Phaser.Math.Distance.Between(pointer.x, pointer.y, FINAL_ENTER_POINT.x, FINAL_ENTER_POINT.y);
    if (distance <= FINAL_ENTER_POINT.radius) {
      this.skipOrContinue();
    }
  }

  skipOrContinue() {
    if (this.sequenceDone) {
      this.game.events.emit("pubpaid:intro-enter");
      return;
    }
    this.tweens.killTweensOf([this.currentImage, this.nextImage, this.flashLayer]);
    this.freezeFinalFrame();
  }

  handleResize(gameSize) {
    if (!gameSize || !this.cameras?.main) return;
    this.cameras.main.setZoom(gameSize.width < 700 ? 0.82 : 1);
  }

  update(_time, delta) {
    if (this.scanline) {
      this.scanline.tilePositionY += delta * 0.025;
    }
  }
}
