import { GAME_HEIGHT, GAME_WIDTH } from "../config/gameConfig.js";
import { gameState, updateGameState } from "../core/gameState.js";
import { PUBPAID_TEXTURE_KEYS, fitImageToHeight } from "../core/assetRegistry.js";

const GAME_META = {
  pool: {
    title: "Sinuca",
    accent: 0xffd06d,
    alt: 0x8ef0a3,
    description: "Mesa paga em preparação para backend real.",
    badge: "CONTROLE",
    strap: "Mira, força e mesa viva",
    panelA: 0x10241c,
    panelB: 0x0a111b,
    chip: 0x1c8f5e
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
    chip: 0xd4a33e
  }
};

const LOBBY_META = {
  title: "Lobby",
  accent: 0xffd06d,
  alt: 0x50efff,
    description: "Escolha Sinuca ou Damas. Mesas pagas exigem saldo real aprovado."
  };

const STAKES = [2, 5, 10, 20, 30, 40, 50, 100];
const CARD_TEXTURES = {
  checkers: "game-menu-damas-card",
  pool: ""
};

export class GameLobbyScene extends Phaser.Scene {
  constructor() {
    super("game-lobby-scene");
    this.gameId = "pool";
    this.meta = GAME_META.pool;
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
    this.gameId = data.gameId === "checkers" || data.gameId === "pool" ? data.gameId : "";
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
    this.drawLobbyWaiter(GAME_WIDTH / 2, 684, "Escolha a mesa.");
    this.game.events.emit("pubpaid:open-dom-lobby");
    updateGameState({
      currentScene: "game-lobby",
      activeGameId: "",
      lobbyPhase: "selecting",
      objective: "Escolher jogo",
      focus: "catálogo do garçom",
      prompt: "Escolha Sinuca ou Damas para iniciar a mesa."
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
        80 + (index * 149) % (GAME_WIDTH - 160),
        130 + (index * 83) % (GAME_HEIGHT - 210),
        3 + index % 10,
        2,
        index % 2 ? this.meta.accent : this.meta.alt,
        0.08 + (index % 7) * 0.022
      ).setDepth(0.7).setBlendMode(Phaser.BlendModes.SCREEN);
    }
  }

  buildFrame() {
    this.titleText = this.add.text(GAME_WIDTH / 2, 82, this.gameId ? `PUBPAID / ${this.meta.title.toUpperCase()}` : "Escolha sua mesa", {
      fontFamily: "Georgia, Times New Roman, serif",
      fontSize: this.gameId ? "24px" : "32px",
      fontStyle: "bold",
      color: this.gameId ? "#fff6dc" : "#ffcf76",
      stroke: "#160804",
      strokeThickness: this.gameId ? 5 : 8
    }).setLetterSpacing(3).setOrigin(0.5);
    this.titleText.setShadow(0, 0, "#ff9d28", this.gameId ? 4 : 18, true, true);
    this.statusText = this.add.text(GAME_WIDTH / 2, 126, this.gameId ? this.meta.description : "Sinuca ou Dama com carteira real e aprovação de saldo.", {
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
    container.on("pointerdown", onClick);
    this.buttons.push({ container, bg, text });
    return container;
  }

  renderLobby() {
    this.clearSceneUi();
    this.phase = "select";
    updateGameState({ lobbyPhase: "selecting", lobbyStake: this.stake, lobbyOpponent: null });

    this.drawGameChoiceCard(410, 394, "pool");
    this.drawGameChoiceCard(742, 394, "checkers");
    if (this.gameId) {
      this.drawLobbyWaiter(GAME_WIDTH / 2, 684, "Pronto para a mesa.");
    } else {
      this.drawLobbyWaiter(GAME_WIDTH / 2, 684, "Escolha seu jogo.");
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
      const realCheckersReady = this.gameId === "checkers" && Number(gameState.availableBalance || 0) >= this.stake;
      const actionLabel = realCheckersReady ? "BUSCAR JOGADOR REAL" : "ABRIR CARTEIRA";
      this.makeButton(588, 658, 180, 28, actionLabel, () => this.startRealMatchmaking(), true);
      this.makeButton(770, 658, 124, 28, "TROCAR", () => this.selectGame(""), false);
    }
    this.makeButton(1094, 702, 152, 28, "VOLTAR", () => this.backToSalon(), false);
  }

  startRealMatchmaking() {
    if (this.gameId === "checkers" && Number(gameState.availableBalance || 0) >= this.stake) {
      updateGameState({
        lobbyPhase: "matching",
        lobbyOpponent: null,
        prompt: "Buscando outro jogador real para a mesa de Damas."
      });
      this.game.events.emit("pubpaid:start-real-checkers");
      return;
    }
    if (this.gameId === "checkers") {
      this.statusText?.setText("Saldo real aprovado é obrigatório para Damas.");
      updateGameState({
        lobbyPhase: "blocked",
        activeGameId: "",
        selectedTable: "checkers",
        objective: "Saldo aprovado obrigatório",
        prompt: Number(gameState.pendingDeposits || 0) > 0
          ? "Seu depósito está pendente de aprovação do admin."
          : "Abra a carteira, faça um Pix e aguarde a aprovação do admin."
      });
      this.game.events.emit("pubpaid:block-paid-game");
      return;
    }
    this.statusText?.setText("Esta mesa paga ainda precisa do backend real antes de abrir.");
    updateGameState({
      lobbyPhase: "blocked",
      activeGameId: "",
      objective: "Mesa real indisponível",
      prompt: "Esta mesa ainda precisa do backend real de partida, escrow e pagamento antes de abrir."
    });
    this.game.events.emit("pubpaid:block-paid-game", "unavailable");
    return;
  }

  switchGame() {
    this.gameId = this.gameId === "pool" ? "checkers" : "pool";
    this.meta = GAME_META[this.gameId];
    updateGameState({ activeGameId: this.gameId, selectedTable: this.gameId });
    this.renderLobby();
  }

  selectGame(gameId) {
    this.gameId = gameId === "checkers" || gameId === "pool" ? gameId : "";
    this.meta = GAME_META[this.gameId] || LOBBY_META;
    this.opponent = null;
    this.phase = "select";
    updateGameState({
      activeGameId: this.gameId,
      selectedTable: this.gameId || "pool",
      lobbyPhase: "selecting",
      objective: this.gameId ? `Configurar ${this.meta.title}` : "Escolher jogo",
      prompt: this.gameId ? `${this.meta.title} selecionado. Ajuste a aposta e busque um oponente.` : "Escolha um jogo no catálogo."
    });
    this.titleText?.setText(this.gameId ? `PUBPAID / ${this.meta.title.toUpperCase()}` : "Escolha sua mesa");
    this.titleText?.setFontSize(this.gameId ? "24px" : "32px");
    this.titleText?.setColor(this.gameId ? "#fff6dc" : "#ffcf76");
    this.titleText?.setStroke("#160804", this.gameId ? 5 : 8);
    this.titleText?.setShadow(0, 0, "#ff9d28", this.gameId ? 4 : 18, true, true);
    this.statusText?.setText(this.gameId ? `${this.meta.title} selecionado. Ajuste a aposta abaixo.` : "Sinuca ou Dama com carteira real e aprovação de saldo.");
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
    const cardArt = [];
    if (gameId === "pool" && !this.textures.exists(CARD_TEXTURES[gameId])) {
      cardArt.push(
        this.add.rectangle(0, -18, 222, 110, 0x2b140d, 0.96).setStrokeStyle(3, 0xffd06d, 0.32),
        this.add.rectangle(0, -18, 194, 82, 0x0b5a42, 0.96).setStrokeStyle(2, 0x07101c, 0.8),
        this.add.circle(-78, -50, 9, 0x07101c, 1),
        this.add.circle(0, -58, 8, 0x07101c, 1),
        this.add.circle(78, -50, 9, 0x07101c, 1),
        this.add.circle(-78, 14, 9, 0x07101c, 1),
        this.add.circle(0, 24, 8, 0x07101c, 1),
        this.add.circle(78, 14, 9, 0x07101c, 1),
        this.add.circle(-34, -8, 8, 0xf4ead8, 1).setStrokeStyle(2, 0x07101c, 0.7),
        this.add.circle(32, -24, 8, 0xff4f7d, 1).setStrokeStyle(2, 0x07101c, 0.7),
        this.add.circle(58, 2, 8, 0xffd06d, 1).setStrokeStyle(2, 0x07101c, 0.7),
        this.add.rectangle(-20, 28, 132, 4, 0xc48b3a, 0.86).setRotation(-0.34)
      );
    }
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
    container.add([glow, shadow, image, ...cardArt, selectedRing, title]);
    container.setSize(302, 226);
    container.setInteractive(new Phaser.Geom.Rectangle(-151, -113, 302, 226), Phaser.Geom.Rectangle.Contains);
    container.on("pointerdown", () => this.selectGame(gameId));
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
    this.tableLayer.add(this.add.text(x, y - 126, "MESAS DA NOITE", this.textStyle(18, "#fff6dc")).setOrigin(0.5).setLetterSpacing(2));
    this.drawMiniPoolTable(x - 100, y + 20, 0.64);
    this.drawCheckersBoard(x + 100, y + 20, 24);
  }

  drawLobbyWaiter(x, y, message) {
    if (this.textures.exists(PUBPAID_TEXTURE_KEYS.waiterLobby)) {
      const shadow = this.add.ellipse(x, y - 16, 360, 54, 0x000000, 0.32)
        .setBlendMode(Phaser.BlendModes.MULTIPLY)
        .setDepth(2.05);
      this.waiterSprite = this.add.image(x, y, PUBPAID_TEXTURE_KEYS.waiterLobby)
        .setOrigin(0.5, 1)
        .setDepth(2.2);
      fitImageToHeight(this.waiterSprite, 440);
      this.tableLayer.add(shadow);
      this.tableLayer.add(this.waiterSprite);
      this.startWaiterTalking();
    } else {
      return;
    }
    const panelX = 938;
    const panelY = 188;
    this.tableLayer.add(this.add.rectangle(panelX, panelY, 276, 54, 0x120c08, 0.88)
      .setStrokeStyle(2, 0xffd06d, 0.34)
      .setDepth(2.45));
    this.tableLayer.add(this.add.text(panelX, panelY, message, {
      fontFamily: "Georgia, Times New Roman, serif",
      fontSize: "14px",
      fontStyle: "bold",
      color: "#fff0cf",
      stroke: "#120904",
      strokeThickness: 2
    }).setOrigin(0.5).setDepth(2.5));
  }

  startWaiterTalking() {
    if (!this.waiterSprite || !this.textures.exists(PUBPAID_TEXTURE_KEYS.waiterLobbySpeaking)) return;
    let speaking = false;
    this.waiterTalkTimer = this.time.addEvent({
      delay: 260,
      loop: true,
      callback: () => {
        speaking = !speaking;
        this.waiterSprite?.setTexture(speaking ? PUBPAID_TEXTURE_KEYS.waiterLobbySpeaking : PUBPAID_TEXTURE_KEYS.waiterLobby);
      }
    });
  }

  drawMatchBackdrop() {
    const textureKey = this.gameId === "pool" ? "game-pool-room" : "game-checkers-room";
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

  drawMiniPoolTable(x, y, scale = 1) {
    const width = 214 * scale;
    const height = 126 * scale;
    this.tableLayer.add(this.add.ellipse(x, y + height / 2 + 12 * scale, width * 0.78, 16 * scale, 0x000000, 0.2)
      .setBlendMode(Phaser.BlendModes.MULTIPLY));
    this.tableLayer.add(this.add.rectangle(x, y, width + 28 * scale, height + 28 * scale, 0x2b140d, 0.96)
      .setStrokeStyle(Math.max(2, 3 * scale), 0xffd06d, 0.28));
    this.tableLayer.add(this.add.rectangle(x, y, width, height, 0x0b5a42, 0.96)
      .setStrokeStyle(Math.max(2, 2 * scale), 0x07101c, 0.82));
    [
      [-width / 2 + 14 * scale, -height / 2 + 14 * scale],
      [0, -height / 2 + 8 * scale],
      [width / 2 - 14 * scale, -height / 2 + 14 * scale],
      [-width / 2 + 14 * scale, height / 2 - 14 * scale],
      [0, height / 2 - 8 * scale],
      [width / 2 - 14 * scale, height / 2 - 14 * scale]
    ].forEach(([px, py]) => {
      this.tableLayer.add(this.add.circle(x + px, y + py, 9 * scale, 0x05070d, 1)
        .setStrokeStyle(Math.max(1, 2 * scale), 0xc48b3a, 0.56));
    });
    [
      { dx: -44, dy: 20, color: 0xf4ead8 },
      { dx: 22, dy: -24, color: 0xff4f7d },
      { dx: 58, dy: 12, color: 0xffd06d },
      { dx: 82, dy: -14, color: 0x10131a }
    ].forEach((ball, index) => {
      this.tableLayer.add(this.add.circle(x + ball.dx * scale, y + ball.dy * scale, 8 * scale, ball.color, 1)
        .setStrokeStyle(Math.max(1, 2 * scale), 0x07101c, 0.75));
      if (index > 0) {
        this.tableLayer.add(this.add.circle(x + ball.dx * scale - 2 * scale, y + ball.dy * scale - 2 * scale, 2 * scale, 0xfff6dc, 0.5));
      }
    });
    this.tableLayer.add(this.add.rectangle(x - 24 * scale, y + 42 * scale, 118 * scale, 4 * scale, 0xc48b3a, 0.86)
      .setRotation(-0.32));
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
