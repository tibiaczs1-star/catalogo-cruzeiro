import { GAME_HEIGHT, GAME_WIDTH } from "../config/gameConfig.js";
import { updateGameState } from "../core/gameState.js";

const BOARD = {
  x: 720,
  y: 142,
  tile: 58
};

const PIECE_FRAMES = {
  ai: 3,
  aiKing: 0,
  player: 5,
  playerKing: 2
};

export class CheckersGameScene extends Phaser.Scene {
  constructor() {
    super("checkers-game-scene");
    this.stake = 10;
    this.opponent = { name: "Dona Coroa", rating: 760, style: "jogo posicional" };
    this.board = [];
    this.turn = "player";
    this.phase = "select";
    this.selected = null;
    this.legalMoves = [];
    this.message = "";
    this.buttons = [];
    this.boardLayer = null;
    this.hud = {};
    this.moveCount = 0;
  }

  init(data = {}) {
    this.stake = Number(data.stake || 10);
    this.opponent = data.opponent || this.opponent;
    this.board = this.createBoard();
    this.turn = "player";
    this.phase = "select";
    this.selected = null;
    this.legalMoves = [];
    this.message = "Sua vez. Escolha uma peça vermelha.";
    this.buttons = [];
    this.moveCount = 0;
  }

  create() {
    this.game.events.emit("pubpaid:music-zone", "game");
    this.drawBackdrop();
    this.drawHud();
    this.boardLayer = this.add.container(0, 0).setDepth(3);
    this.renderBoard();
    this.syncState(this.message);
  }

  drawBackdrop() {
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x02050d, 1);
    if (this.textures.exists("game-checkers-room")) {
      this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, "game-checkers-room")
        .setDisplaySize(GAME_WIDTH, GAME_HEIGHT)
        .setAlpha(0.98);
      this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x02050d, 0.2);
    }
    this.add.rectangle(306, 370, 470, 500, 0x05070d, 0.58)
      .setStrokeStyle(2, 0xc48b3a, 0.2);
    this.add.rectangle(BOARD.x + BOARD.tile * 4, BOARD.y + BOARD.tile * 4, BOARD.tile * 8 + 38, BOARD.tile * 8 + 38, 0x05070d, 0.46)
      .setStrokeStyle(2, 0xc48b3a, 0.26);
  }

  drawHud() {
    this.add.text(84, 74, "DAMA", this.textStyle(42, "#fff6dc")).setLetterSpacing(5);
    this.hud.subtitle = this.add.text(88, 132, `Você x ${this.opponent.name} / aposta ${this.stake}`, this.textStyle(15, "#d5dff2"));
    this.hud.score = this.add.text(100, 204, "", this.textStyle(22, "#50efff")).setLetterSpacing(1);
    this.hud.turn = this.add.text(102, 252, "", this.textStyle(16, "#d5dff2"));
    this.hud.status = this.add.text(102, 304, "", this.textStyle(15, "#fff6dc"))
      .setWordWrapWidth(370);
    this.hud.tip = this.add.text(102, 408, "Peça vermelha sobe. Captura acontece ao pular uma peça escura.", this.textStyle(12, "#d5dff2"))
      .setWordWrapWidth(360);
    this.makeButton(208, 626, 210, 44, "VOLTAR LOBBY", () => this.backToLobby(), false);
    this.makeButton(454, 626, 190, 44, "SAIR SALÃO", () => this.backToSalon(), false);
    this.updateHud();
  }

  renderBoard() {
    this.boardLayer.destroy();
    this.boardLayer = this.add.container(0, 0).setDepth(3);
    const movesByTarget = new Map(this.legalMoves.map((move) => [`${move.to.row}-${move.to.col}`, move]));
    for (let row = 0; row < 8; row += 1) {
      for (let col = 0; col < 8; col += 1) {
        const x = BOARD.x + col * BOARD.tile;
        const y = BOARD.y + row * BOARD.tile;
        const dark = (row + col) % 2 === 1;
        const selected = this.selected?.row === row && this.selected?.col === col;
        const targetMove = movesByTarget.get(`${row}-${col}`);
        const tile = this.add.image(x + BOARD.tile / 2, y + BOARD.tile / 2, "checkers-wood-tiles", dark ? 1 : 0)
          .setDisplaySize(BOARD.tile, BOARD.tile)
          .setOrigin(0.5);
        tile.setInteractive();
        tile.on("pointerdown", () => this.handleCell(row, col));
        this.boardLayer.add(tile);
        if (selected || targetMove) {
          this.boardLayer.add(this.add.rectangle(x + BOARD.tile / 2, y + BOARD.tile / 2, BOARD.tile - 4, BOARD.tile - 4, targetMove ? 0x8ef0a3 : 0xffd06d, targetMove ? 0.14 : 0.1)
            .setStrokeStyle(2, targetMove ? 0x8ef0a3 : 0xffd06d, 0.82));
        }

        const piece = this.board[row][col];
        if (piece) {
          const cx = x + BOARD.tile / 2;
          const cy = y + BOARD.tile / 2;
          const frame = piece.owner === "player"
            ? (piece.king ? PIECE_FRAMES.playerKing : PIECE_FRAMES.player)
            : (piece.king ? PIECE_FRAMES.aiKing : PIECE_FRAMES.ai);
          const shadow = this.add.ellipse(cx + 2, cy + 16, 34, 10, 0x000000, 0.22)
            .setBlendMode(Phaser.BlendModes.MULTIPLY);
          const sprite = this.add.image(cx, cy, "checkers-pieces", frame)
            .setDisplaySize(44, 44)
            .setOrigin(0.5);
          this.boardLayer.add([shadow, sprite]);
        }
      }
    }
  }

  handleCell(row, col) {
    if (this.phase !== "select" || this.turn !== "player") return;
    const targetMove = this.legalMoves.find((move) => move.to.row === row && move.to.col === col);
    if (targetMove) {
      this.applyMove(targetMove);
      return;
    }
    const piece = this.board[row][col];
    if (!piece || piece.owner !== "player") {
      this.selected = null;
      this.legalMoves = [];
      this.message = "Escolha uma peça vermelha válida.";
      this.updateHud();
      this.renderBoard();
      return;
    }
    this.selected = { row, col };
    this.legalMoves = this.getMovesFor(row, col, true);
    this.message = this.legalMoves.length ? "Agora escolha uma casa marcada." : "Essa peça não tem movimento agora.";
    this.updateHud();
    this.renderBoard();
    this.syncState(this.message);
  }

  applyMove(move) {
    const piece = this.board[move.from.row][move.from.col];
    this.board[move.from.row][move.from.col] = null;
    this.board[move.to.row][move.to.col] = piece;
    if (move.capture) {
      this.board[move.capture.row][move.capture.col] = null;
    }
    if (piece.owner === "player" && move.to.row === 0) piece.king = true;
    if (piece.owner === "ai" && move.to.row === 7) piece.king = true;
    this.moveCount += 1;
    this.selected = null;
    this.legalMoves = [];
    this.renderBoard();
    if (this.checkFinished()) return;
    this.turn = "ai";
    this.phase = "ai";
    this.message = `${this.opponent.name} pensando a resposta.`;
    this.updateHud();
    this.syncState(this.message);
    this.time.delayedCall(700, () => this.aiMove());
  }

  aiMove() {
    const moves = this.getAllMoves("ai", true);
    if (!moves.length) {
      this.finishMatch("win", "A IA ficou sem jogadas.");
      return;
    }
    const captures = moves.filter((move) => move.capture);
    const pool = captures.length ? captures : moves;
    const move = pool[Phaser.Math.Between(0, pool.length - 1)];
    const piece = this.board[move.from.row][move.from.col];
    this.board[move.from.row][move.from.col] = null;
    this.board[move.to.row][move.to.col] = piece;
    if (move.capture) {
      this.board[move.capture.row][move.capture.col] = null;
    }
    if (piece.owner === "ai" && move.to.row === 7) piece.king = true;
    this.moveCount += 1;
    this.turn = "player";
    this.phase = "select";
    this.message = move.capture ? `${this.opponent.name} capturou uma peça. Sua vez.` : `${this.opponent.name} moveu. Sua vez.`;
    this.renderBoard();
    if (!this.checkFinished()) {
      this.updateHud();
      this.syncState(this.message);
    }
  }

  checkFinished() {
    const playerPieces = this.countPieces("player");
    const aiPieces = this.countPieces("ai");
    if (aiPieces === 0) {
      this.finishMatch("win", "Você limpou o tabuleiro.");
      return true;
    }
    if (playerPieces === 0) {
      this.finishMatch("loss", "A IA capturou suas peças.");
      return true;
    }
    if (!this.getAllMoves("player", true).length) {
      this.finishMatch("loss", "Você ficou sem movimentos.");
      return true;
    }
    if (this.moveCount >= 40) {
      if (playerPieces > aiPieces) this.finishMatch("win", "Você venceu por vantagem material.");
      else if (aiPieces > playerPieces) this.finishMatch("loss", "A IA venceu por vantagem material.");
      else this.finishMatch("draw", "A mesa travou empatada.");
      return true;
    }
    return false;
  }

  finishMatch(result, reason) {
    this.phase = "finished";
    this.turn = "none";
    const headline = result === "win" ? "VITÓRIA" : result === "loss" ? "DERROTA" : "EMPATE";
    const color = result === "win" ? 0x8ef0a3 : result === "loss" ? 0xff4fb8 : 0x50efff;
    this.add.rectangle(BOARD.x + BOARD.tile * 4, BOARD.y + BOARD.tile * 4, 438, 166, 0x05070d, 0.88)
      .setStrokeStyle(5, color, 0.62)
      .setDepth(9);
    this.add.text(BOARD.x + BOARD.tile * 4, BOARD.y + BOARD.tile * 4 - 38, headline, this.textStyle(38, result === "win" ? "#8ef0a3" : result === "loss" ? "#ff8abf" : "#50efff"))
      .setOrigin(0.5)
      .setDepth(10)
      .setLetterSpacing(4);
    this.add.text(BOARD.x + BOARD.tile * 4, BOARD.y + BOARD.tile * 4 + 18, reason, this.textStyle(15, "#fff6dc"))
      .setOrigin(0.5)
      .setDepth(10)
      .setWordWrapWidth(360);
    this.makeButton(BOARD.x + BOARD.tile * 4, BOARD.y + BOARD.tile * 4 + 82, 220, 44, "JOGAR DE NOVO", () => this.restartMatch(), true);
    this.message = `${headline}: ${reason}`;
    this.updateHud();
    this.syncState(this.message);
  }

  getMovesFor(row, col, enforceCapture = false) {
    const piece = this.board[row]?.[col];
    if (!piece) return [];
    const directions = piece.king
      ? [[-1, -1], [-1, 1], [1, -1], [1, 1]]
      : piece.owner === "player"
        ? [[-1, -1], [-1, 1]]
        : [[1, -1], [1, 1]];
    const moves = [];
    directions.forEach(([dr, dc]) => {
      const mid = { row: row + dr, col: col + dc };
      const landing = { row: row + dr * 2, col: col + dc * 2 };
      if (this.isInside(mid.row, mid.col) && !this.board[mid.row][mid.col]) {
        moves.push({ from: { row, col }, to: mid, capture: null });
      }
      if (
        this.isInside(landing.row, landing.col) &&
        this.board[mid.row]?.[mid.col] &&
        this.board[mid.row][mid.col].owner !== piece.owner &&
        !this.board[landing.row][landing.col]
      ) {
        moves.push({ from: { row, col }, to: landing, capture: mid });
      }
    });
    if (!enforceCapture) return moves;
    const allCaptures = this.getAllMoves(piece.owner, false).filter((move) => move.capture);
    if (!allCaptures.length) return moves;
    return moves.filter((move) => move.capture);
  }

  getAllMoves(owner, enforceCapture = false) {
    const moves = [];
    for (let row = 0; row < 8; row += 1) {
      for (let col = 0; col < 8; col += 1) {
        if (this.board[row][col]?.owner === owner) {
          moves.push(...this.getMovesFor(row, col, false));
        }
      }
    }
    if (!enforceCapture) return moves;
    const captures = moves.filter((move) => move.capture);
    return captures.length ? captures : moves;
  }

  countPieces(owner) {
    return this.board.flat().filter((piece) => piece?.owner === owner).length;
  }

  createBoard() {
    return Array.from({ length: 8 }, (_, row) => Array.from({ length: 8 }, (_, col) => {
      if ((row + col) % 2 === 0) return null;
      if (row < 3) return { owner: "ai", king: false };
      if (row > 4) return { owner: "player", king: false };
      return null;
    }));
  }

  updateHud() {
    this.hud.score?.setText(`VERMELHAS ${this.countPieces("player")}  /  ESCURAS ${this.countPieces("ai")}`);
    this.hud.turn?.setText(this.phase === "finished" ? "Partida encerrada" : this.turn === "player" ? "Sua vez" : "Vez da IA");
    this.hud.status?.setText(this.message);
  }

  syncState(prompt) {
    updateGameState({
      currentScene: "checkers-game",
      activeGameId: "checkers",
      lobbyPhase: this.phase === "finished" ? "finished" : "playing",
      objective: "Vencer a IA na Dama",
      focus: "tabuleiro de dama",
      checkersGame: {
        phase: this.phase,
        turn: this.turn,
        playerPieces: this.countPieces("player"),
        aiPieces: this.countPieces("ai"),
        selected: this.selected,
        legalMoves: this.legalMoves.map((move) => ({ to: move.to, capture: Boolean(move.capture) })),
        moveCount: this.moveCount
      },
      prompt
    });
  }

  restartMatch() {
    this.scene.restart({ stake: this.stake, opponent: this.opponent });
  }

  backToLobby() {
    this.scene.start("game-lobby-scene", {
      gameId: "checkers",
      stake: this.stake,
      opponent: this.opponent
    });
  }

  backToSalon() {
    updateGameState({
      currentScene: "interior",
      activeGameId: "",
      lobbyPhase: "hub",
      objective: "Falar com o garçom para escolher jogo",
      prompt: "Voltando ao salão. Escolha outro jogo pelo garçom."
    });
    this.scene.start("interior-scene");
  }

  makeButton(x, y, width, height, label, onClick, primary = false) {
    const container = this.add.container(x, y).setDepth(10);
    const bg = this.add.rectangle(0, 0, width, height, primary ? 0x50efff : 0x0b1220, primary ? 0.94 : 0.9)
      .setStrokeStyle(2, primary ? 0xfff6dc : 0x8ef0a3, primary ? 0.55 : 0.34);
    const text = this.add.text(0, 0, label, {
      fontFamily: "Courier New, Lucida Console, monospace",
      fontSize: "12px",
      fontStyle: "bold",
      color: primary ? "#07101c" : "#fff6dc",
      stroke: primary ? "#fff6dc" : "#05070d",
      strokeThickness: primary ? 1 : 3
    }).setOrigin(0.5).setLetterSpacing(1);
    container.add([bg, text]);
    container.setSize(width, height);
    container.setInteractive(new Phaser.Geom.Rectangle(-width / 2, -height / 2, width, height), Phaser.Geom.Rectangle.Contains);
    container.on("pointerdown", onClick);
    this.buttons.push(container);
    return container;
  }

  isInside(row, col) {
    return row >= 0 && row < 8 && col >= 0 && col < 8;
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
}
