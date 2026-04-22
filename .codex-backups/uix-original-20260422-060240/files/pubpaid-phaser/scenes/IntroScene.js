import { GAME_HEIGHT, GAME_WIDTH } from "../config/gameConfig.js";
import { NERD_TEAM, formatNerdAgent } from "../config/nerdTeam.js";
import { updateGameState } from "../core/gameState.js";

const INTRO_FRAMES = [
  {
    key: "intro-frame-01",
    label: "chegada ao pub",
    hold: 260,
    fromScale: 1.2,
    toScale: 1.09,
    fromX: 650,
    toX: 632,
    flash: 0.05
  },
  {
    key: "intro-frame-02",
    label: "chegada ao pub",
    hold: 110,
    fromScale: 1.18,
    toScale: 1.11,
    fromX: 642,
    toX: 628,
    flash: 0.04
  },
  {
    key: "intro-frame-03",
    label: "chegada ao pub",
    hold: 110,
    fromScale: 1.17,
    toScale: 1.1,
    fromX: 636,
    toX: 622,
    flash: 0.04
  },
  {
    key: "intro-frame-04",
    label: "olhar para dentro",
    hold: 240,
    fromScale: 1.15,
    toScale: 1.08,
    fromX: 632,
    toX: 616,
    flash: 0.04
  },
  {
    key: "intro-frame-05",
    label: "olhar para dentro",
    hold: 110,
    fromScale: 1.15,
    toScale: 1.09,
    fromX: 626,
    toX: 616,
    flash: 0.04
  },
  {
    key: "intro-frame-06",
    label: "olhar para dentro",
    hold: 110,
    fromScale: 1.15,
    toScale: 1.09,
    fromX: 622,
    toX: 612,
    flash: 0.05
  },
  {
    key: "intro-frame-07",
    label: "celular na mao",
    hold: 260,
    fromScale: 1.16,
    toScale: 1.1,
    fromX: 620,
    toX: 604,
    flash: 0.08
  },
  {
    key: "intro-frame-08",
    label: "celular na mao",
    hold: 110,
    fromScale: 1.17,
    toScale: 1.11,
    fromX: 616,
    toX: 606,
    flash: 0.1
  },
  {
    key: "intro-frame-09",
    label: "celular na mao",
    hold: 110,
    fromScale: 1.17,
    toScale: 1.11,
    fromX: 612,
    toX: 602,
    flash: 0.14
  },
  {
    key: "intro-frame-10",
    label: "toque na tela",
    hold: 220,
    fromScale: 1.18,
    toScale: 1.12,
    fromX: 606,
    toX: 596,
    flash: 0.22
  },
  {
    key: "intro-frame-11",
    label: "neon acordando",
    hold: 120,
    fromScale: 1.16,
    toScale: 1.1,
    fromX: 610,
    toX: 616,
    flash: 0.22
  },
  {
    key: "intro-frame-12",
    label: "neon acordando",
    hold: 120,
    fromScale: 1.15,
    toScale: 1.09,
    fromX: 614,
    toX: 622,
    flash: 0.26
  },
  {
    key: "intro-frame-13",
    label: "neon acorda",
    hold: 280,
    fromScale: 1.14,
    toScale: 1.06,
    fromX: 616,
    toX: 628,
    flash: 0.3
  },
  {
    key: "intro-frame-14",
    label: "entrada surgindo",
    hold: 120,
    fromScale: 1.12,
    toScale: 1.05,
    fromX: 622,
    toX: 630,
    flash: 0.2
  },
  {
    key: "intro-frame-15",
    label: "entrada surgindo",
    hold: 130,
    fromScale: 1.1,
    toScale: 1.03,
    fromX: 632,
    toX: 636,
    flash: 0.18
  },
  {
    key: "intro-frame-16",
    label: "entrada pubpaid 2.0",
    hold: 620,
    fromScale: 1.08,
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
      focus: "sequencia bitmap PubPaid",
      objective: "Assistir a abertura e liberar termos/Login",
      nerdAgent: formatNerdAgent(NERD_TEAM.sprite),
      prompt: "Abertura premium com 6 bitmaps e 10 frames intermediarios. A interface aparece quando o ultimo frame congelar."
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

    this.caption = this.add.text(48, GAME_HEIGHT - 54, "carregando abertura", {
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
    if (index < 3) return;
    this.cameras.main.shake(140, 0.0016 + index * 0.00018);
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
      prompt: "Frame final congelado. Interface de entrada pronta sobre a cena."
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
    this.cameras.main.setZoom(gameSize.width < 700 ? 0.82 : 1);
  }

  update(_time, delta) {
    if (this.scanline) {
      this.scanline.tilePositionY += delta * 0.025;
    }
  }
}
