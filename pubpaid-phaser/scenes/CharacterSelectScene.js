import { GAME_HEIGHT, GAME_WIDTH } from "../config/gameConfig.js";
import { updateGameState } from "../core/gameState.js";
import { PUBPAID_TEXTURE_KEYS, fitImageToHeight } from "../core/assetRegistry.js";
import { NERD_TEAM, formatNerdAgent } from "../config/nerdTeam.js";

const CHARACTER_OPTIONS = [
  {
    id: "male",
    label: "MASCULINO",
    title: "Cliente Azul",
    spriteKey: PUBPAID_TEXTURE_KEYS.player,
    accent: 0x50efff,
    copy: "Passo firme, leitura direta da rua e presença discreta no salão."
  },
  {
    id: "female",
    label: "FEMININO",
    title: "Cliente Rosa",
    spriteKey: PUBPAID_TEXTURE_KEYS.playerFemale,
    accent: 0xff4fb8,
    copy: "Silhueta leve, postura social e contraste forte com o neon do bar."
  }
];

export class CharacterSelectScene extends Phaser.Scene {
  constructor() {
    super("character-select-scene");
    this.selectedIndex = 0;
    this.optionCards = [];
  }

  create() {
    this.game.events.emit("pubpaid:music-zone", "street");
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x02050d, 1);
    if (this.textures.exists("street-bg")) {
      this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, "street-bg")
        .setDisplaySize(GAME_WIDTH, GAME_HEIGHT)
        .setAlpha(0.72);
      this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x02050d, 0.46);
    }
    this.add.rectangle(GAME_WIDTH / 2, 96, 820, 78, 0x06101a, 0.86)
      .setStrokeStyle(3, 0xffd06d, 0.34);
    this.add.text(GAME_WIDTH / 2, 78, "ESCOLHA O PERSONAGEM", this.titleStyle(34, "#fff6dc"))
      .setOrigin(0.5)
      .setLetterSpacing(4);
    this.add.text(GAME_WIDTH / 2, 124, "a escolha define o personagem bitmap usado na rua, no salão e nas mesas demo", this.pixelStyle(13, "#d5dff2"))
      .setOrigin(0.5)
      .setLetterSpacing(1);

    this.optionCards = CHARACTER_OPTIONS.map((option, index) => this.buildOption(option, index));
    this.makeButton(GAME_WIDTH / 2, 628, 260, 46, "ENTRAR NA RUA", () => this.chooseSelected(), true);

    this.input.keyboard.on("keydown-LEFT", () => this.setSelected(0));
    this.input.keyboard.on("keydown-RIGHT", () => this.setSelected(1));
    this.input.keyboard.on("keydown-A", () => this.setSelected(0));
    this.input.keyboard.on("keydown-D", () => this.setSelected(1));
    this.input.keyboard.on("keydown-ENTER", () => this.chooseSelected());
    this.setSelected(0);

    updateGameState({
      currentScene: "character-select",
      focus: "selecao de personagem",
      objective: "Escolher personagem masculino ou feminino",
      nerdAgent: formatNerdAgent(NERD_TEAM.sprite),
      prompt: "Escolha masculino ou feminino. Enter confirma e leva para a rua viva."
    });
  }

  buildOption(option, index) {
    const x = index === 0 ? 430 : 850;
    const card = this.add.container(x, 362).setDepth(2);
    const shadow = this.add.rectangle(0, 18, 318, 338, 0x000000, 0.3);
    const bg = this.add.rectangle(0, 0, 300, 332, 0x07101c, 0.92)
      .setStrokeStyle(3, option.accent, 0.28);
    const glow = this.add.rectangle(0, 0, 318, 348, option.accent, 0.04)
      .setBlendMode(Phaser.BlendModes.SCREEN);
    const stage = this.add.rectangle(0, 72, 196, 188, 0x05070d, 0.52)
      .setStrokeStyle(2, option.accent, 0.18);
    const sprite = this.add.image(0, 142, option.spriteKey)
      .setOrigin(0.5, 1);
    fitImageToHeight(sprite, 222);
    const label = this.add.text(0, -124, option.label, this.pixelStyle(13, "#ffd06d"))
      .setOrigin(0.5)
      .setLetterSpacing(3);
    const title = this.add.text(0, -88, option.title, this.titleStyle(24, "#fff6dc"))
      .setOrigin(0.5)
      .setLetterSpacing(1);
    const copy = this.add.text(0, 174, option.copy, this.pixelStyle(12, "#d5dff2"))
      .setOrigin(0.5, 0)
      .setAlign("center")
      .setWordWrapWidth(238);
    const marker = this.add.text(0, 130, "◆", this.pixelStyle(20, "#ffd06d"))
      .setOrigin(0.5)
      .setAlpha(0);
    card.add([shadow, glow, bg, stage, sprite, label, title, marker, copy]);
    card.setSize(300, 332);
    card.setInteractive(new Phaser.Geom.Rectangle(-150, -166, 300, 332), Phaser.Geom.Rectangle.Contains);
    card.on("pointerover", () => this.setSelected(index));
    card.on("pointerdown", () => {
      this.setSelected(index);
      this.chooseSelected();
    });
    card.ppgOption = { option, bg, glow, marker, sprite };
    return card;
  }

  setSelected(index) {
    this.selectedIndex = index;
    this.optionCards.forEach((card, cardIndex) => {
      const active = cardIndex === index;
      card.ppgOption.bg.setStrokeStyle(4, card.ppgOption.option.accent, active ? 0.82 : 0.28);
      card.ppgOption.glow.setAlpha(active ? 0.16 : 0.04);
      card.ppgOption.marker.setAlpha(active ? 1 : 0);
      card.setScale(active ? 1.03 : 1);
    });
    const option = CHARACTER_OPTIONS[index];
    updateGameState({
      focus: option.title,
      selectedCharacter: {
        id: option.id,
        label: option.label,
        spriteKey: option.spriteKey
      },
      prompt: `${option.label} selecionado. Aperte Enter para ir para a rua.`
    });
  }

  chooseSelected() {
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
      prompt: `${option.label} confirmado. Spawnando na rua do PubPaid.`
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
    container.on("pointerdown", onClick);
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
