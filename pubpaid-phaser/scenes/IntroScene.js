import { GAME_HEIGHT, GAME_WIDTH } from "../config/gameConfig.js";
import { NERD_TEAM, formatNerdAgent } from "../config/nerdTeam.js";
import { updateGameState } from "../core/gameState.js";

const INTRO_FRAMES = [
  {
    key: "street-bg",
    label: "rua molhada",
    hold: 520,
    fromScale: 1.18,
    toScale: 1.08,
    fromX: 688,
    toX: 640,
    flash: 0.03
  },
  {
    key: "street-bg",
    label: "neon chamando",
    hold: 440,
    fromScale: 1.12,
    toScale: 1.18,
    fromX: 572,
    toX: 520,
    flash: 0.08
  },
  {
    key: "street-bg",
    label: "carros passando",
    hold: 360,
    fromScale: 1.22,
    toScale: 1.16,
    fromX: 740,
    toX: 702,
    flash: 0.1
  },
  {
    key: "intro-frame-13",
    label: "porta acendendo",
    hold: 420,
    fromScale: 1.16,
    toScale: 1.04,
    fromX: 624,
    toX: 640,
    flash: 0.22
  },
  {
    key: "intro-frame-16",
    label: "atravessando a entrada",
    hold: 360,
    fromScale: 1.1,
    toScale: 1.24,
    fromX: 640,
    toX: 640,
    flash: 0.34
  },
  {
    key: "interior-bg",
    label: "bar cheio",
    hold: 560,
    fromScale: 1.16,
    toScale: 1.04,
    fromX: 676,
    toX: 640,
    flash: 0.18
  },
  {
    key: "game-lobby-bg",
    label: "mesas acordando",
    hold: 560,
    fromScale: 1.14,
    toScale: 1.03,
    fromX: 610,
    toX: 640,
    flash: 0.12
  },
  {
    key: "game-lobby-bg",
    label: "entrar no jogo",
    hold: 820,
    fromScale: 1.04,
    toScale: 1,
    fromX: 640,
    toX: 640,
    flash: 0.16,
    final: true
  }
];

const INTRO_TOTAL = INTRO_FRAMES.length;

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
      focus: "intro cinematica PubPaid",
      objective: "Assistir a abertura cinematica",
      nerdAgent: formatNerdAgent(NERD_TEAM.sprite),
      prompt: "Abertura cinematica em pixel art: rua, neon, porta, salao cheio e entrada direta."
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

    if (frame.final) {
      const plaque = this.add.rectangle(GAME_WIDTH / 2, 560, 360, 78, 0x060912, 0.78)
        .setStrokeStyle(3, 0xffd06d, 0.58);
      const enter = this.add.text(GAME_WIDTH / 2, 548, "ENTRAR NO JOGO", {
        fontFamily: "Georgia, Times New Roman, serif",
        fontSize: "34px",
        fontStyle: "bold",
        color: "#fff0cf",
        stroke: "#120904",
        strokeThickness: 5
      }).setOrigin(0.5).setLetterSpacing(2);
      const hint = this.add.text(GAME_WIDTH / 2, 586, "clique ou use a tecla Entrar", {
        fontFamily: "Courier New, Lucida Console, monospace",
        fontSize: "11px",
        color: "#9fb0ca"
      }).setOrigin(0.5).setLetterSpacing(2);
      this.cinematicOverlay.add([plaque, enter, hint]);
    }
  }

  freezeFinalFrame() {
    if (this.sequenceDone) return;
    this.sequenceDone = true;
    this.caption.setText("PUBPAID 2.0 - ENTRAR NO JOGO");
    this.currentImage
      .setTexture(INTRO_FRAMES[INTRO_TOTAL - 1].key)
      .setDisplaySize(GAME_WIDTH, GAME_HEIGHT)
      .setPosition(GAME_WIDTH / 2, GAME_HEIGHT / 2)
      .setAlpha(1);
    this.drawCinematicOverlays(INTRO_TOTAL - 1, INTRO_FRAMES[INTRO_TOTAL - 1]);
    this.finalPulse = this.add.rectangle(GAME_WIDTH / 2, 560, 420, 88, 0xffd06d, 0)
      .setBlendMode(Phaser.BlendModes.SCREEN);
    this.tweens.add({
      targets: this.finalPulse,
      alpha: { from: 0.04, to: 0.22 },
      duration: 880,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut"
    });

    updateGameState({
      currentScene: "intro",
      focus: "frame final congelado",
      objective: "Apertar a tecla Entrar ou clicar no letreiro",
      nerdAgent: formatNerdAgent(NERD_TEAM.hud),
      prompt: "Frame final congelado. Clique em Entrar no jogo ou aperte a tecla Entrar para seguir."
    });
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
