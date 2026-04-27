import { GAME_HEIGHT, GAME_WIDTH } from "../config/gameConfig.js";
import { gameState, updateGameState } from "../core/gameState.js";
import { TEXTURE_KEYS } from "../core/spriteFactory.js";

const GAME_META = {
  darts: {
    title: "Dardos",
    accent: 0xffd06d,
    alt: 0x50efff,
    description: "Mira rápida, rodadas curtas e placar auditável.",
    badge: "PRECISÃO",
    strap: "Foco, pressão e impacto",
    panelA: 0x1a0f12,
    panelB: 0x0a111b,
    chip: 0x2d78ff,
    ai: ["Rafa Mira Fina", "Nina Triplo 20", "Beto Mira Certa"]
  },
  checkers: {
    title: "Dama",
    accent: 0x50efff,
    alt: 0x8ef0a3,
    description: "Turnos claros, captura obrigatória e leitura limpa.",
    badge: "ESTRATÉGIA",
    strap: "Leitura, tática e controle",
    panelA: 0x2a0f13,
    panelB: 0x1d1720,
    chip: 0xd4a33e,
    ai: ["Dona Coroa", "Caio Diagonal", "Lia Rainha"]
  }
};

const LOBBY_META = {
  title: "Mesas",
  accent: 0xffd06d,
  alt: 0x50efff,
  description: "Escolha um jogo para abrir aposta, oponente e confirmação."
};

const STAKES = [2, 5, 10, 20, 30, 40, 50, 100];
const CARD_TEXTURES = {
  checkers: "game-menu-damas-card",
  darts: "game-menu-dardos-card"
};

export class GameLobbyScene extends Phaser.Scene {
  constructor() {
    super("game-lobby-scene");
    this.gameId = "darts";
    this.meta = GAME_META.darts;
    this.phase = "select";
    this.stake = 10;
    this.opponent = null;
    this.buttons = [];
    this.titleText = null;
    this.statusText = null;
    this.tableLayer = null;
    this.fxLayer = null;
    this.waiterSprite = null;
    this.waiterTalkTimer = null;
  }

  init(data = {}) {
    this.gameId = data.gameId === "checkers" || data.gameId === "darts" ? data.gameId : "";
    this.meta = GAME_META[this.gameId] || LOBBY_META;
    this.phase = "select";
    this.stake = Number(data.stake || gameState.lobbyStake || 10);
    this.opponent = data.opponent || null;
    this.buttons = [];
  }

  create() {
    this.game.events.emit("pubpaid:music-zone", "game");
    this.buildBackdrop();
    this.tableLayer = this.add.container(0, 0).setDepth(1);
    this.drawLobbyWaiter(1088, 654, "Escolha a mesa.");
    this.game.events.emit("pubpaid:open-dom-lobby");
    updateGameState({
      currentScene: "game-lobby",
      activeGameId: "",
      lobbyPhase: "selecting",
      objective: "Escolher jogo",
      focus: "catálogo do garçom",
      prompt: "Escolha Dardos ou Dama para iniciar a mesa."
    });
  }

  buildBackdrop() {
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x030712, 1);
    if (this.textures.exists("game-lobby-bg")) {
      this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, "game-lobby-bg")
        .setDisplaySize(GAME_WIDTH, GAME_HEIGHT)
        .setDepth(0.05);
      this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x030712, 0.28)
        .setDepth(0.08);
    }
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x030712, 0.16)
      .setDepth(0.1);
    this.fxLayer = this.add.graphics().setDepth(0.8).setBlendMode(Phaser.BlendModes.SCREEN);
    for (let index = 0; index < 34; index += 1) {
      this.add.rectangle(
        Phaser.Math.Between(80, GAME_WIDTH - 80),
        Phaser.Math.Between(130, GAME_HEIGHT - 80),
        Phaser.Math.Between(3, 12),
        2,
        index % 2 ? this.meta.accent : this.meta.alt,
        Phaser.Math.FloatBetween(0.08, 0.24)
      ).setDepth(0.7).setBlendMode(Phaser.BlendModes.SCREEN);
    }
  }

  buildFrame() {
    this.titleText = this.add.text(GAME_WIDTH / 2, 82, this.gameId ? `PUBPAID / ${this.meta.title.toUpperCase()}` : "ESCOLHA SEU JOGO", {
      fontFamily: "Georgia, Times New Roman, serif",
      fontSize: this.gameId ? "24px" : "32px",
      fontStyle: "bold",
      color: this.gameId ? "#fff6dc" : "#ffcf76",
      stroke: "#160804",
      strokeThickness: this.gameId ? 5 : 8
    }).setLetterSpacing(3).setOrigin(0.5);
    this.titleText.setShadow(0, 0, "#ff9d28", this.gameId ? 4 : 18, true, true);
    this.statusText = this.add.text(GAME_WIDTH / 2, 126, this.gameId ? this.meta.description : "Escolha o jogo clicando direto na arte.", {
      fontFamily: "Georgia, Times New Roman, serif",
      fontSize: this.gameId ? "12px" : "14px",
      color: this.gameId ? "#d5dff2" : "#fff0c9",
      stroke: "#05070d",
      strokeThickness: 3
    }).setLetterSpacing(1).setOrigin(0.5);
    this.makeButton(1120, 72, 150, 38, "VOLTAR", () => this.backToSalon(), false);
  }

  clearSceneUi() {
    this.buttons.forEach((button) => button.container.destroy());
    this.buttons = [];
    this.waiterTalkTimer?.remove(false);
    this.waiterTalkTimer = null;
    this.waiterSprite = null;
    this.tableLayer?.destroy();
    this.tableLayer = this.add.container(0, 0).setDepth(1);
  }

  makeButton(x, y, width, height, label, onClick, primary = false) {
    const container = this.add.container(x, y).setDepth(4);
    const bg = this.add.rectangle(0, 0, width, height, primary ? 0xd9b15f : 0x1a120c, primary ? 0.96 : 0.9)
      .setStrokeStyle(2, primary ? 0xffefc2 : 0xc48b3a, primary ? 0.66 : 0.34);
    const text = this.add.text(0, 0, label, {
      fontFamily: "Georgia, Times New Roman, serif",
      fontSize: "11px",
      fontStyle: "bold",
      color: primary ? "#201208" : "#fff3d5",
      stroke: primary ? "#fff3d5" : "#120904",
      strokeThickness: primary ? 0 : 2
    }).setOrigin(0.5).setLetterSpacing(0);
    container.add([bg, text]);
    container.setSize(width, height);
    container.setInteractive(new Phaser.Geom.Rectangle(-width / 2, -height / 2, width, height), Phaser.Geom.Rectangle.Contains);
    container.on("pointerdown", (pointer) => {
      if (this.isDomUiPointer(pointer)) return;
      onClick();
    });
    this.buttons.push({ container, bg, text });
    return container;
  }

  renderLobby() {
    this.clearSceneUi();
    this.phase = "select";
    updateGameState({ lobbyPhase: "selecting", lobbyStake: this.stake, lobbyOpponent: null });

    this.drawGameChoiceCard(410, 394, "checkers");
    this.drawGameChoiceCard(742, 394, "darts");
    if (this.gameId) {
      this.drawLobbyWaiter(1094, 642, "Pronto para a mesa.");
    } else {
      this.drawLobbyWaiter(1094, 642, "Escolha seu jogo.");
    }

    if (this.gameId) {
      this.tableLayer.add(this.add.rectangle(612, 656, 560, 96, 0x120c08, 0.82)
        .setStrokeStyle(2, 0xc48b3a, 0.3));
      this.tableLayer.add(this.add.text(248, 622, "APOSTA", {
        fontFamily: "Georgia, Times New Roman, serif",
        fontSize: "16px",
        fontStyle: "bold",
        color: "#fff0cf",
        stroke: "#120904",
        strokeThickness: 2
      }).setOrigin(0.5));
      STAKES.forEach((stake, index) => {
        const x = 270 + (index % 4) * 80;
        const y = 658 + Math.floor(index / 4) * 30;
        this.makeButton(x, y, 56, 22, `${stake}`, () => {
          this.stake = stake;
          updateGameState({ lobbyStake: stake, prompt: `Aposta definida em ${stake} créditos.` });
          this.renderLobby();
        }, stake === this.stake);
      });
      this.makeButton(588, 658, 180, 28, "BUSCAR OPONENTE", () => this.findAiOpponent(), true);
      this.makeButton(770, 658, 124, 28, "TROCAR", () => this.selectGame(""), false);
    }
    this.makeButton(1094, 702, 152, 28, "VOLTAR", () => this.backToSalon(), false);
  }

  findAiOpponent() {
    this.phase = "matching";
    const names = this.meta.ai;
    this.opponent = {
      name: names[Phaser.Math.Between(0, names.length - 1)],
      style: this.gameId === "darts" ? "mira agressiva" : "jogo posicional",
      rating: Phaser.Math.Between(680, 920)
    };
    updateGameState({
      lobbyPhase: "matched",
      lobbyOpponent: this.opponent,
      prompt: `${this.opponent.name} encontrado. Abrindo partida de teste.`
    });
    if (this.gameId === "checkers") {
      this.scene.start("checkers-game-scene", {
        stake: this.stake,
        opponent: this.opponent
      });
      return;
    }
    if (this.gameId === "darts") {
      this.scene.start("darts-game-scene", {
        stake: this.stake,
        opponent: this.opponent
      });
      return;
    }
    this.startMatchScreen();
  }

  renderMatched() {
    this.clearSceneUi();
    this.drawGlassPanel(92, 144, 650, 472, this.meta.alt);
    this.tableLayer.add(this.add.text(110, 168, "OPONENTE ENCONTRADO", this.textStyle(30, "#fff6dc")).setLetterSpacing(3));
    this.tableLayer.add(this.add.text(112, 224, `${this.opponent.name} / ${this.opponent.style} / nível ${this.opponent.rating}`, this.textStyle(15, "#d5dff2")));
    this.tableLayer.add(this.add.text(112, 270, `Aposta: ${this.stake} créditos`, this.textStyle(18, "#ffd06d")));
    this.drawOpponentCard(270, 402);
    this.drawGamePreview(840, 378);
    this.makeButton(220, 586, 220, 48, "CONFIRMAR", () => this.startMatchScreen(), true);
    this.makeButton(470, 586, 190, 48, "PROCURAR OUTRO", () => this.findAiOpponent(), false);
  }

  startMatchScreen() {
    this.phase = "match";
    if (this.gameId === "darts") {
      updateGameState({
        currentScene: "darts-game",
        activeGameId: "darts",
        lobbyPhase: "playing",
        objective: "Jogar Dardos",
        prompt: `Partida de Dardos aberta contra ${this.opponent.name}.`
      });
      this.scene.start("darts-game-scene", {
        stake: this.stake,
        opponent: this.opponent
      });
      return;
    }
    if (this.gameId === "checkers") {
      updateGameState({
        currentScene: "checkers-game",
        activeGameId: "checkers",
        lobbyPhase: "playing",
        objective: "Jogar Dama",
        prompt: `Partida de Dama aberta contra ${this.opponent.name}.`
      });
      this.scene.start("checkers-game-scene", {
        stake: this.stake,
        opponent: this.opponent
      });
      return;
    }
    updateGameState({
      currentScene: "game-match",
      lobbyPhase: "playing",
      objective: `Jogar ${this.meta.title}`,
      prompt: `Partida de ${this.meta.title} aberta em tela própria contra ${this.opponent.name}.`
    });
    this.renderMatchScreen();
  }

  renderMatchScreen() {
    this.clearSceneUi();
    this.drawMatchBackdrop();
    this.drawGlassPanel(80, 128, 570, 444, this.meta.accent);
    this.tableLayer.add(this.add.text(96, 150, this.meta.title.toUpperCase(), this.textStyle(40, "#fff6dc")).setLetterSpacing(4));
    this.tableLayer.add(this.add.text(98, 206, `Você x ${this.opponent.name} / aposta ${this.stake}`, this.textStyle(16, "#d5dff2")));
    if (this.gameId === "darts") {
      this.drawDartsMatch();
    } else {
      this.drawCheckersMatch();
    }
    this.makeButton(218, 626, 220, 46, "VOLTAR ÀS MESAS", () => this.renderMatched(), false);
    this.makeButton(486, 626, 220, 46, "SAIR PRO SALÃO", () => this.backToSalon(), true);
  }

  drawGamePreview(x, y) {
    this.tableLayer.add(this.add.rectangle(x, y, 410, 380, 0x05070d, 0.62).setStrokeStyle(3, this.meta.accent, 0.24));
    if (this.gameId === "darts") {
      this.tableLayer.add(this.add.rectangle(x, y, 300, 360, 0x160c15, 1).setStrokeStyle(4, this.meta.accent, 0.36));
      this.tableLayer.add(this.add.circle(x, y - 30, 106, 0x0b1220, 1).setStrokeStyle(8, this.meta.accent, 0.45));
      this.tableLayer.add(this.add.circle(x, y - 30, 70, 0xff4fb8, 0.28));
      this.tableLayer.add(this.add.circle(x, y - 30, 38, 0x50efff, 0.32));
      this.tableLayer.add(this.add.circle(x, y - 30, 10, 0x8ef0a3, 0.95));
    } else {
      this.tableLayer.add(this.add.rectangle(x, y, 360, 320, 0x140b12, 1).setStrokeStyle(4, this.meta.alt, 0.34));
      const size = 32;
      for (let row = 0; row < 8; row += 1) {
        for (let col = 0; col < 8; col += 1) {
          this.tableLayer.add(this.add.rectangle(x - 112 + col * size, y - 112 + row * size, size, size, (row + col) % 2 ? 0x281322 : 0xc49a64, 1));
        }
      }
    }
  }

  drawOpponentCard(x, y) {
    this.tableLayer.add(this.add.rectangle(x, y, 280, 190, 0x0b1220, 0.95).setStrokeStyle(3, this.meta.alt, 0.32));
    this.tableLayer.add(this.add.circle(x - 82, y - 20, 36, this.meta.accent, 0.95).setStrokeStyle(4, 0x07101c, 0.76));
    this.tableLayer.add(this.add.rectangle(x - 82, y + 36, 62, 58, this.meta.alt, 0.82).setStrokeStyle(3, 0x07101c, 0.7));
    this.tableLayer.add(this.add.text(x - 18, y - 50, this.opponent.name, this.textStyle(18, "#fff6dc")));
    this.tableLayer.add(this.add.text(x - 18, y - 14, this.opponent.style, this.textStyle(12, "#d5dff2")));
    this.tableLayer.add(this.add.text(x - 18, y + 22, `nível ${this.opponent.rating}`, this.textStyle(12, "#ffd06d")));
  }

  drawDartsMatch() {
    this.drawDartsTarget(848, 374, 126);
    this.tableLayer.add(this.add.text(118, 310, "Tela própria dos Dardos", this.textStyle(20, "#ffd06d")));
    this.tableLayer.add(this.add.text(118, 350, "Aqui entram mira, rodadas, IA e liquidação da partida.", this.textStyle(14, "#d5dff2")));
  }

  drawCheckersMatch() {
    this.drawCheckersBoard(850, 392, 44);
    this.tableLayer.add(this.add.text(118, 310, "Tela própria da Dama", this.textStyle(20, "#50efff")));
    this.tableLayer.add(this.add.text(118, 350, "Aqui entram tabuleiro grande, seleção de peça e IA de teste.", this.textStyle(14, "#d5dff2")));
  }

  switchGame() {
    this.gameId = this.gameId === "darts" ? "checkers" : "darts";
    this.meta = GAME_META[this.gameId];
    updateGameState({ activeGameId: this.gameId, selectedTable: this.gameId });
    this.renderLobby();
  }

  selectGame(gameId) {
    this.gameId = gameId === "checkers" || gameId === "darts" ? gameId : "";
    this.meta = GAME_META[this.gameId] || LOBBY_META;
    this.opponent = null;
    this.phase = "select";
    updateGameState({
      activeGameId: this.gameId,
      selectedTable: this.gameId || "darts",
      lobbyPhase: "selecting",
      objective: this.gameId ? `Configurar ${this.meta.title}` : "Escolher jogo",
      prompt: this.gameId ? `${this.meta.title} selecionado. Ajuste a aposta e busque um oponente.` : "Escolha um jogo no catálogo."
    });
    this.titleText?.setText(this.gameId ? `PUBPAID / ${this.meta.title.toUpperCase()}` : "ESCOLHA SEU JOGO");
    this.titleText?.setFontSize(this.gameId ? "24px" : "32px");
    this.titleText?.setColor(this.gameId ? "#fff6dc" : "#ffcf76");
    this.titleText?.setStroke("#160804", this.gameId ? 5 : 8);
    this.titleText?.setShadow(0, 0, "#ff9d28", this.gameId ? 4 : 18, true, true);
    this.statusText?.setText(this.gameId ? `${this.meta.title} selecionado. Ajuste a aposta abaixo.` : "Escolha o jogo clicando direto na arte.");
    this.statusText?.setFontSize(this.gameId ? "12px" : "14px");
    this.statusText?.setColor(this.gameId ? "#d5dff2" : "#fff0c9");
    this.renderLobby();
  }

  backToSalon() {
    updateGameState({
      currentScene: "interior",
      lobbyPhase: "hub",
      activeGameId: "",
      lobbyOpponent: null,
      objective: "Falar com o garçom para escolher jogo",
      prompt: "Voltando ao salão. Escolha outro jogo pelo garçom."
    });
    this.scene.start("interior-scene");
  }

  textStyle(size, color) {
    return {
      fontFamily: "Georgia, Times New Roman, serif",
      fontSize: `${size}px`,
      fontStyle: "bold",
      color,
      stroke: "#05070d",
      strokeThickness: 3
    };
  }

  drawGlassPanel(x, y, width, height, accent) {
    this.tableLayer.add(this.add.rectangle(x + width / 2, y + height / 2, width, height, 0x05070d, 0.68)
      .setStrokeStyle(3, accent, 0.3));
    this.tableLayer.add(this.add.rectangle(x + width / 2, y + 18, width - 26, 2, 0xffffff, 0.13));
  }

  drawGameChoiceCard(x, y, gameId) {
    const meta = GAME_META[gameId];
    const selected = this.gameId === gameId;
    const container = this.add.container(x, y).setDepth(3);
    const glow = this.add.rectangle(0, 0, 302, 226, selected ? meta.accent : 0xffd06d, selected ? 0.07 : 0.02)
      .setBlendMode(Phaser.BlendModes.SCREEN);
    const shadow = this.add.ellipse(0, 108, 230, 22, 0x000000, 0.22)
      .setBlendMode(Phaser.BlendModes.MULTIPLY);
    const image = this.textures.exists(CARD_TEXTURES[gameId])
      ? this.add.image(0, -8, CARD_TEXTURES[gameId]).setDisplaySize(292, 208)
      : this.add.rectangle(0, -8, 292, 208, meta.panelA, 0.92).setStrokeStyle(2, meta.alt, 0.3);
    const selectedRing = this.add.rectangle(0, -8, 300, 216, 0x000000, 0)
      .setStrokeStyle(3, selected ? meta.accent : 0xc48b3a, selected ? 0.7 : 0.1);
    const title = this.add.text(0, 122, meta.title.toUpperCase(), {
      fontFamily: "Georgia, Times New Roman, serif",
      fontSize: "24px",
      fontStyle: "bold",
      color: "#fff0cf",
      stroke: "#120904",
      strokeThickness: 2
    }).setOrigin(0.5).setLetterSpacing(1);
    container.add([glow, shadow, image, selectedRing, title]);
    container.setSize(302, 226);
    container.setInteractive(new Phaser.Geom.Rectangle(-151, -113, 302, 226), Phaser.Geom.Rectangle.Contains);
    container.on("pointerdown", (pointer) => {
      if (this.isDomUiPointer(pointer)) return;
      this.selectGame(gameId);
    });
    container.on("pointerover", () => {
      this.tweens.add({
        targets: container,
        scaleX: 1.02,
        scaleY: 1.02,
        duration: 120,
        ease: "Sine.easeOut"
      });
    });
    container.on("pointerout", () => {
      this.tweens.add({
        targets: container,
        scaleX: selected ? 1.03 : 1,
        scaleY: selected ? 1.03 : 1,
        duration: 120,
        ease: "Sine.easeOut"
      });
    });
    this.tweens.add({
      targets: container,
      scaleX: selected ? 1.03 : 1,
      scaleY: selected ? 1.03 : 1,
      duration: 260,
      ease: "Sine.easeOut"
    });
    return container;
  }

  drawCatalogPreview(x, y) {
    this.tableLayer.add(this.add.rectangle(x, y, 410, 380, 0x05070d, 0.62).setStrokeStyle(3, this.meta.accent, 0.24));
    this.tableLayer.add(this.add.text(x, y - 126, "ESCOLHA NO CATÁLOGO", this.textStyle(18, "#fff6dc")).setOrigin(0.5).setLetterSpacing(2));
    this.drawDartsTarget(x - 90, y + 18, 76);
    this.drawCheckersBoard(x + 100, y + 20, 24);
  }

  drawLobbyWaiter(x, y, message) {
    if (this.textures.exists(TEXTURE_KEYS.waiterLobby)) {
      this.waiterSprite = this.add.image(x, y, TEXTURE_KEYS.waiterLobby)
        .setOrigin(0.5, 1)
        .setScale(0.16)
        .setDepth(2.2);
      this.tableLayer.add(this.waiterSprite);
      this.startWaiterTalking();
    } else {
      return;
    }
    this.tableLayer.add(this.add.text(x, y - 214, message, {
      fontFamily: "Georgia, Times New Roman, serif",
      fontSize: "14px",
      fontStyle: "bold",
      color: "#fff0cf",
      stroke: "#120904",
      strokeThickness: 2
    }).setOrigin(0.5).setDepth(2.5));
  }

  startWaiterTalking() {
    if (!this.waiterSprite || !this.textures.exists(TEXTURE_KEYS.waiterLobbySpeaking)) return;
    let speaking = false;
    this.waiterTalkTimer = this.time.addEvent({
      delay: 260,
      loop: true,
      callback: () => {
        speaking = !speaking;
        this.waiterSprite?.setTexture(speaking ? TEXTURE_KEYS.waiterLobbySpeaking : TEXTURE_KEYS.waiterLobby);
      }
    });
  }

  isDomUiPointer(pointer) {
    const target = pointer?.event?.target;
    return Boolean(target?.closest?.("[data-dom-game-ui]"));
  }

  drawMatchBackdrop() {
    const textureKey = this.gameId === "darts" ? "game-darts-room" : "game-checkers-room";
    if (this.textures.exists(textureKey)) {
      this.tableLayer.add(this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, textureKey)
        .setDisplaySize(GAME_WIDTH, GAME_HEIGHT)
        .setAlpha(0.96)
        .setDepth(-2));
      this.tableLayer.add(this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x030712, 0.2)
        .setDepth(-1));
      return;
    }
    this.tableLayer.add(this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x07101c, 0.92)
      .setDepth(-2));
  }

  drawDartsTarget(x, y, radius) {
    this.tableLayer.add(this.add.circle(x, y, radius + 18, 0x05070d, 0.66).setStrokeStyle(5, this.meta.accent, 0.5));
    [radius, radius * 0.72, radius * 0.44, radius * 0.16].forEach((size, index) => {
      const color = [0x22101b, 0xff4fb8, 0x07101c, 0x8ef0a3][index];
      this.tableLayer.add(this.add.circle(x, y, size, color, index === 0 ? 0.95 : 0.78));
    });
    for (let angle = 0; angle < 360; angle += 30) {
      const radian = Phaser.Math.DegToRad(angle);
      this.tableLayer.add(this.add.line(0, 0, x, y, x + Math.cos(radian) * radius, y + Math.sin(radian) * radius, 0xfff6dc, 0.22).setLineWidth(2));
    }
  }

  drawCheckersBoard(x, y, tile) {
    this.tableLayer.add(this.add.rectangle(x, y, tile * 8 + 28, tile * 8 + 28, 0x05070d, 0.72).setStrokeStyle(5, this.meta.alt, 0.42));
    for (let row = 0; row < 8; row += 1) {
      for (let col = 0; col < 8; col += 1) {
        const px = x - tile * 3.5 + col * tile;
        const py = y - tile * 3.5 + row * tile;
        this.tableLayer.add(this.add.rectangle(px, py, tile, tile, (row + col) % 2 ? 0x24111e : 0xc9965f, 1));
        if ((row + col) % 2 && (row < 3 || row > 4)) {
          this.tableLayer.add(this.add.circle(px, py, tile * 0.32, row < 3 ? 0x111827 : 0xd94a5f, 0.95).setStrokeStyle(2, 0xfff6dc, 0.18));
        }
      }
    }
  }
}
