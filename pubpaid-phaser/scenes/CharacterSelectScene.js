import { GAME_HEIGHT, GAME_WIDTH } from "../config/gameConfig.js";
import { updateGameState } from "../core/gameState.js";
import { PUBPAID_TEXTURE_KEYS, fitImageToHeight } from "../core/assetRegistry.js";
import { NERD_TEAM, formatNerdAgent } from "../config/nerdTeam.js";

const CHARACTER_OPTIONS = [
  {
    id: "male",
    label: "MASCULINO",
    title: "Masculino",
    spriteKey: PUBPAID_TEXTURE_KEYS.playerMaleIdlePhone,
    accent: 0x50efff
  },
  {
    id: "female",
    label: "FEMININO",
    title: "Feminino",
    spriteKey: PUBPAID_TEXTURE_KEYS.playerFemaleIdlePhone,
    accent: 0xff4fb8
  }
];

export class CharacterSelectScene extends Phaser.Scene {
  constructor() {
    super("character-select-scene");
    this.selectedIndex = 0;
    this.optionCards = [];
    this.mobileSelectCooldown = 0;
    this.confirmLocked = false;
  }

  create() {
    this.game.events.emit("pubpaid:music-zone", "street");
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x02050d, 1);
    if (this.textures.exists("street-bg")) {
      this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, "street-bg")
        .setDisplaySize(GAME_WIDTH, GAME_HEIGHT)
        .setAlpha(0.58);
      this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x02050d, 0.58);
    }
    this.add.rectangle(GAME_WIDTH / 2, 76, 660, 58, 0x06101a, 0.74)
      .setStrokeStyle(1, 0xffd06d, 0.2);
    this.add.text(GAME_WIDTH / 2, 76, "Escolha seu avatar", this.titleStyle(26, "#fff6dc"))
      .setOrigin(0.5)
      .setLetterSpacing(1);

    this.optionCards = CHARACTER_OPTIONS.map((option, index) => this.buildOption(option, index));
    this.makeButton(GAME_WIDTH / 2, 650, 250, 50, "CONFIRMAR", () => this.chooseSelected(), true);

    this.input.keyboard.on("keydown-LEFT", () => this.setSelected(0));
    this.input.keyboard.on("keydown-RIGHT", () => this.setSelected(1));
    this.input.keyboard.on("keydown-A", () => this.chooseSelected());
    this.input.keyboard.on("keydown-D", () => this.setSelected(1));
    this.input.keyboard.on("keydown-ENTER", () => this.chooseSelected());
    this.setSelected(0);

    updateGameState({
      currentScene: "character-select",
      focus: "selecao de personagem",
      objective: "Escolher avatar",
      nerdAgent: formatNerdAgent(NERD_TEAM.sprite),
      prompt: "Escolha seu avatar e confirme."
    });
  }

  update(time) {
    const mobile = window.pubpaidMobileInput;
    const vector = mobile?.getVector?.() || { x: 0, y: 0 };
    if (Math.abs(vector.x || 0) > 0.55 && time > this.mobileSelectCooldown) {
      this.setSelected(vector.x < 0 ? 0 : 1);
      this.mobileSelectCooldown = time + 220;
    }
    if (mobile?.consumeAction?.()) {
      this.chooseSelected();
    }
  }

  buildOption(option, index) {
    const x = index === 0 ? 430 : 850;
    const card = this.add.container(x, 360).setDepth(2);
    const shadow = this.add.ellipse(0, 166, 240, 34, 0x000000, 0.28)
      .setBlendMode(Phaser.BlendModes.MULTIPLY);
    const glow = this.add.rectangle(0, 8, 316, 428, option.accent, 0.035)
      .setBlendMode(Phaser.BlendModes.SCREEN);
    const bg = this.add.rectangle(0, 8, 296, 408, 0x07101c, 0.74)
      .setStrokeStyle(2, option.accent, 0.2);
    const floor = this.add.ellipse(0, 154, 190, 32, option.accent, 0.12)
      .setBlendMode(Phaser.BlendModes.SCREEN);
    const sprite = this.add.sprite(0, 148, option.spriteKey, 1)
      .setOrigin(0.5, 1);
    fitImageToHeight(sprite, 278);
    const title = this.add.text(0, -230, option.title, this.titleStyle(22, "#fff6dc"))
      .setOrigin(0.5)
      .setLetterSpacing(0);
    const marker = this.add.rectangle(0, 206, 86, 4, option.accent, 0.95)
      .setAlpha(0);
    card.add([shadow, glow, bg, floor, sprite, title, marker]);
    card.setSize(296, 408);
    card.setInteractive(new Phaser.Geom.Rectangle(-148, -204, 296, 408), Phaser.Geom.Rectangle.Contains);
    card.on("pointerover", () => this.setSelected(index));
    card.on("pointerdown", () => {
      this.setSelected(index);
      this.chooseSelected();
    });
    card.ppgOption = { option, bg, glow, marker, sprite, floor };
    return card;
  }

  setSelected(index) {
    this.selectedIndex = index;
    this.optionCards.forEach((card, cardIndex) => {
      const active = cardIndex === index;
      card.ppgOption.bg.setStrokeStyle(active ? 4 : 2, card.ppgOption.option.accent, active ? 0.82 : 0.2);
      card.ppgOption.glow.setAlpha(active ? 0.13 : 0.035);
      card.ppgOption.floor.setAlpha(active ? 0.2 : 0.1);
      card.ppgOption.marker.setAlpha(active ? 1 : 0);
      this.tweens.add({
        targets: card,
        scaleX: active ? 1.035 : 0.985,
        scaleY: active ? 1.035 : 0.985,
        duration: 140,
        ease: "Sine.easeOut"
      });
    });
    const option = CHARACTER_OPTIONS[index];
    updateGameState({
      focus: option.title,
      selectedCharacter: {
        id: option.id,
        label: option.label,
        spriteKey: option.spriteKey
      },
      prompt: `${option.title} selecionado.`
    });
  }

  chooseSelected() {
    if (this.confirmLocked) return;
    this.confirmLocked = true;
    const option = CHARACTER_OPTIONS[this.selectedIndex] || CHARACTER_OPTIONS[0];
    updateGameState({
      selectedCharacter: {
        id: option.id,
        label: option.label,
        spriteKey: option.spriteKey
      },
      currentScene: "street",
      objective: "Entrar no PubPaid pela porta principal",
      focus: "rua viva",
      prompt: `${option.title} confirmado. Boa noite.`
    });
    this.cameras.main.fadeOut(260, 5, 7, 14);
    this.cameras.main.once("camerafadeoutcomplete", () => {
      this.scene.start("street-scene");
    });
  }

  makeButton(x, y, width, height, label, onClick, primary = false) {
    const container = this.add.container(x, y).setDepth(4);
    const bg = this.add.rectangle(0, 0, width, height, primary ? 0xffd06d : 0x07101c, primary ? 0.94 : 0.88)
      .setStrokeStyle(2, primary ? 0xfff6dc : 0x50efff, 0.58);
    const text = this.add.text(0, 0, label, {
      fontFamily: "Courier New, Lucida Console, monospace",
      fontSize: "13px",
      fontStyle: "bold",
      color: primary ? "#07101c" : "#fff6dc",
      stroke: primary ? "#fff6dc" : "#05070d",
      strokeThickness: primary ? 1 : 3
    }).setOrigin(0.5).setLetterSpacing(2);
    container.add([bg, text]);
    container.setSize(width, height);
    container.setInteractive(new Phaser.Geom.Rectangle(-width / 2, -height / 2, width, height), Phaser.Geom.Rectangle.Contains);
    if (container.input) container.input.cursor = "pointer";
    container.on("pointerdown", () => {
      bg.setScale(0.98, 0.96);
    });
    container.on("pointerup", () => {
      bg.setScale(1, 1);
      onClick();
    });
    container.on("pointerout", () => {
      bg.setScale(1, 1);
    });
    return container;
  }

  titleStyle(size, color) {
    return {
      fontFamily: "Georgia, Times New Roman, serif",
      fontSize: `${size}px`,
      fontStyle: "bold",
      color,
      stroke: "#05070d",
      strokeThickness: 4
    };
  }

  pixelStyle(size, color) {
    return {
      fontFamily: "Courier New, Lucida Console, monospace",
      fontSize: `${size}px`,
      fontStyle: "bold",
      color,
      stroke: "#05070d",
      strokeThickness: 3
    };
  }
}
