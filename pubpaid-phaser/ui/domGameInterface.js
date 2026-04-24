import { gameState, subscribeGameState, updateGameState } from "../core/gameState.js";

const CHECKERS_SIZE = 8;

function createCheckersBoard() {
  return Array.from({ length: CHECKERS_SIZE }, (_, row) =>
    Array.from({ length: CHECKERS_SIZE }, (_, col) => {
      if ((row + col) % 2 === 0) return null;
      if (row < 3) return { owner: "ai", king: false };
      if (row > 4) return { owner: "player", king: false };
      return null;
    })
  );
}

function countPieces(board, owner) {
  return board.flat().filter((piece) => piece?.owner === owner).length;
}

function isInside(row, col) {
  return row >= 0 && row < CHECKERS_SIZE && col >= 0 && col < CHECKERS_SIZE;
}

function getMovesFor(board, row, col, enforceCapture = false) {
  const piece = board[row]?.[col];
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
    if (isInside(mid.row, mid.col) && !board[mid.row][mid.col]) {
      moves.push({ from: { row, col }, to: mid, capture: null });
    }
    if (
      isInside(landing.row, landing.col) &&
      board[mid.row]?.[mid.col] &&
      board[mid.row][mid.col].owner !== piece.owner &&
      !board[landing.row][landing.col]
    ) {
      moves.push({ from: { row, col }, to: landing, capture: mid });
    }
  });
  if (!enforceCapture) return moves;
  const captures = getAllMoves(board, piece.owner, false).filter((move) => move.capture);
  return captures.length ? moves.filter((move) => move.capture) : moves;
}

function getAllMoves(board, owner, enforceCapture = false) {
  const moves = [];
  for (let row = 0; row < CHECKERS_SIZE; row += 1) {
    for (let col = 0; col < CHECKERS_SIZE; col += 1) {
      if (board[row][col]?.owner === owner) {
        moves.push(...getMovesFor(board, row, col, false));
      }
    }
  }
  if (!enforceCapture) return moves;
  const captures = moves.filter((move) => move.capture);
  return captures.length ? captures : moves;
}

function cloneBoard(board) {
  return board.map((row) => row.map((piece) => (piece ? { ...piece } : null)));
}

function applyCheckersMove(board, move) {
  const next = cloneBoard(board);
  const piece = next[move.from.row][move.from.col];
  next[move.from.row][move.from.col] = null;
  next[move.to.row][move.to.col] = piece;
  if (move.capture) next[move.capture.row][move.capture.col] = null;
  if (piece?.owner === "player" && move.to.row === 0) piece.king = true;
  if (piece?.owner === "ai" && move.to.row === 7) piece.king = true;
  return next;
}

function getCheckersResult(board, moveCount) {
  const playerPieces = countPieces(board, "player");
  const aiPieces = countPieces(board, "ai");
  if (aiPieces === 0) return { result: "win", reason: "Você limpou a mesa." };
  if (playerPieces === 0) return { result: "loss", reason: "A rival capturou suas peças." };
  if (!getAllMoves(board, "player", true).length) return { result: "loss", reason: "Você ficou sem jogadas." };
  if (!getAllMoves(board, "ai", true).length) return { result: "win", reason: "A rival ficou sem saída." };
  if (moveCount >= 42) {
    if (playerPieces > aiPieces) return { result: "win", reason: "Vitória por vantagem material." };
    if (aiPieces > playerPieces) return { result: "loss", reason: "Derrota por vantagem material." };
    return { result: "draw", reason: "A mesa travou empatada." };
  }
  return null;
}

function resultTitle(result) {
  if (result === "win") return "Vitória";
  if (result === "loss") return "Derrota";
  return "Empate";
}

function initialCheckersState() {
  return {
    board: createCheckersBoard(),
    turn: "player",
    selected: null,
    legalMoves: [],
    moveCount: 0,
    result: null,
    status: "Escolha uma peça vermelha."
  };
}

export function bindDomGameInterface(game) {
  const refs = {
    root: document.querySelector("[data-dom-game-ui]"),
    scene: document.querySelector("[data-dom-ui-scene]"),
    objective: document.querySelector("[data-dom-ui-objective]"),
    lobby: document.querySelector("[data-dom-lobby]"),
    darts: document.querySelector("[data-dom-darts]"),
    dartsTitle: document.querySelector("[data-dom-darts-title]"),
    dartsScore: document.querySelector("[data-dom-darts-score]"),
    dartsRound: document.querySelector("[data-dom-darts-round]"),
    dartsStatus: document.querySelector("[data-dom-darts-status]"),
    checkers: document.querySelector("[data-dom-checkers]"),
    checkersBoard: document.querySelector("[data-dom-checkers-board]"),
    checkersTitle: document.querySelector("[data-dom-checkers-title]"),
    checkersScore: document.querySelector("[data-dom-checkers-score]"),
    checkersStatus: document.querySelector("[data-dom-checkers-status]"),
    result: document.querySelector("[data-dom-result]"),
    resultGame: document.querySelector("[data-dom-result-game]"),
    resultTitle: document.querySelector("[data-dom-result-title]"),
    resultBody: document.querySelector("[data-dom-result-body]"),
    resultAgain: document.querySelector("[data-dom-result-again]")
  };
  if (!refs.root) return;

  const local = {
    selectedGame: "darts",
    checkers: initialCheckersState()
  };

  const setPanel = (name) => {
    refs.root.classList.toggle("is-lobby", name === "lobby");
    refs.root.classList.toggle("is-darts", name === "darts");
    refs.root.classList.toggle("is-checkers", name === "checkers");
    refs.root.classList.toggle("is-result", name === "result");
    refs.lobby.hidden = name !== "lobby";
    refs.darts.hidden = name !== "darts";
    refs.checkers.hidden = name !== "checkers";
    refs.result.hidden = name !== "result";
    refs.root.classList.toggle("is-playing", name === "darts" || name === "checkers");
  };

  const showLobby = () => {
    local.selectedGame = gameState.activeGameId || local.selectedGame || "darts";
    setPanel("lobby");
    updateGameState({
      lobbyPhase: "selecting",
      objective: "Escolher Dardos ou Dama",
      prompt: "Lobby DOM aberto. Escolha uma mesa para jogar localmente."
    });
  };

  const showResult = (gameId, result, body) => {
    local.selectedGame = gameId;
    refs.resultGame.textContent = gameId === "checkers" ? "dama" : "dardos";
    refs.resultTitle.textContent = resultTitle(result);
    refs.resultBody.textContent = body;
    refs.result.dataset.result = result;
    setPanel("result");
  };

  const startDarts = () => {
    local.selectedGame = "darts";
    setPanel("darts");
    updateGameState({ activeGameId: "darts", lobbyPhase: "playing" });
    game.scene.stop("game-lobby-scene");
    game.scene.stop("checkers-game-scene");
    game.scene.start("darts-game-scene", { stake: gameState.lobbyStake || 10 });
  };

  const renderCheckers = () => {
    const state = local.checkers;
    const targetKeys = new Set(state.legalMoves.map((move) => `${move.to.row}-${move.to.col}`));
    refs.checkersBoard.innerHTML = "";
    state.board.forEach((row, rowIndex) => {
      row.forEach((piece, colIndex) => {
        const cell = document.createElement("button");
        const dark = (rowIndex + colIndex) % 2 === 1;
        cell.type = "button";
        cell.className = [
          "ppg-dom-cell",
          dark ? "is-dark" : "is-light",
          state.selected?.row === rowIndex && state.selected?.col === colIndex ? "is-selected" : "",
          targetKeys.has(`${rowIndex}-${colIndex}`) ? "is-target" : ""
        ].filter(Boolean).join(" ");
        cell.dataset.row = String(rowIndex);
        cell.dataset.col = String(colIndex);
        cell.disabled = state.turn !== "player" || Boolean(state.result);
        if (piece) {
          const checker = document.createElement("span");
          checker.className = `ppg-dom-piece is-${piece.owner}${piece.king ? " is-king" : ""}`;
          checker.textContent = piece.king ? "K" : "";
          cell.append(checker);
        }
        refs.checkersBoard.append(cell);
      });
    });
    refs.checkersTitle.textContent = state.result ? "Mesa encerrada" : state.turn === "player" ? "Sua vez" : "Vez da rival";
    refs.checkersScore.textContent = `${countPieces(state.board, "player")} x ${countPieces(state.board, "ai")}`;
    refs.checkersStatus.textContent = state.status;
    updateGameState({
      activeGameId: "checkers",
      lobbyPhase: state.result ? "finished" : "playing",
      checkersGame: {
        phase: state.result ? "finished" : state.turn,
        turn: state.turn,
        playerPieces: countPieces(state.board, "player"),
        aiPieces: countPieces(state.board, "ai"),
        selected: state.selected,
        legalMoves: state.legalMoves.map((move) => ({ to: move.to, capture: Boolean(move.capture) })),
        moveCount: state.moveCount,
        domBoard: true
      },
      objective: "Vencer a Dama local",
      focus: "tabuleiro DOM de dama",
      prompt: state.status
    });
  };

  const finishCheckersIfNeeded = () => {
    const result = getCheckersResult(local.checkers.board, local.checkers.moveCount);
    if (!result) return false;
    local.checkers.result = result.result;
    local.checkers.status = result.reason;
    renderCheckers();
    showResult("checkers", result.result, result.reason);
    return true;
  };

  const aiCheckersMove = () => {
    const moves = getAllMoves(local.checkers.board, "ai", true);
    if (!moves.length) {
      local.checkers.result = "win";
      local.checkers.status = "A rival ficou sem jogadas.";
      renderCheckers();
      showResult("checkers", "win", local.checkers.status);
      return;
    }
    const captures = moves.filter((move) => move.capture);
    const pool = captures.length ? captures : moves;
    const move = pool[Math.floor(Math.random() * pool.length)];
    local.checkers.board = applyCheckersMove(local.checkers.board, move);
    local.checkers.turn = "player";
    local.checkers.moveCount += 1;
    local.checkers.status = move.capture ? "A rival capturou. Sua vez." : "A rival moveu. Sua vez.";
    if (!finishCheckersIfNeeded()) renderCheckers();
  };

  const handleCheckersCell = (row, col) => {
    const state = local.checkers;
    if (state.turn !== "player" || state.result) return;
    const target = state.legalMoves.find((move) => move.to.row === row && move.to.col === col);
    if (target) {
      state.board = applyCheckersMove(state.board, target);
      state.selected = null;
      state.legalMoves = [];
      state.moveCount += 1;
      state.turn = "ai";
      state.status = target.capture ? "Captura feita. Rival pensando." : "Movimento feito. Rival pensando.";
      renderCheckers();
      if (!finishCheckersIfNeeded()) window.setTimeout(aiCheckersMove, 520);
      return;
    }
    const piece = state.board[row]?.[col];
    if (!piece || piece.owner !== "player") {
      state.selected = null;
      state.legalMoves = [];
      state.status = "Escolha uma peça vermelha válida.";
      renderCheckers();
      return;
    }
    state.selected = { row, col };
    state.legalMoves = getMovesFor(state.board, row, col, true);
    state.status = state.legalMoves.length ? "Escolha uma casa marcada." : "Essa peça está sem movimento.";
    renderCheckers();
  };

  const startCheckers = () => {
    local.selectedGame = "checkers";
    local.checkers = initialCheckersState();
    setPanel("checkers");
    game.scene.stop("game-lobby-scene");
    game.scene.stop("darts-game-scene");
    game.scene.start("checkers-game-scene", { stake: gameState.lobbyStake || 10 });
    renderCheckers();
  };

  document.addEventListener("click", (event) => {
    const startButton = event.target.closest("[data-dom-start-game]");
    if (startButton) {
      startButton.dataset.domStartGame === "checkers" ? startCheckers() : startDarts();
      return;
    }
    if (event.target.closest("[data-dom-open-lobby]")) {
      game.scene.stop("darts-game-scene");
      game.scene.stop("checkers-game-scene");
      game.scene.start("game-lobby-scene", { gameId: local.selectedGame });
      showLobby();
      return;
    }
    if (event.target.closest("[data-dom-return-salon]")) {
      game.scene.stop("darts-game-scene");
      game.scene.stop("checkers-game-scene");
      game.scene.stop("game-lobby-scene");
      game.scene.start("interior-scene");
      setPanel("");
      updateGameState({ activeGameId: "", lobbyPhase: "hub" });
      return;
    }
    if (event.target.closest("[data-dom-darts-throw]")) {
      game.events.emit("pubpaid:darts-dom-throw");
      return;
    }
    const resetButton = event.target.closest("[data-dom-game-reset]");
    if (resetButton) {
      resetButton.dataset.domGameReset === "checkers" ? startCheckers() : startDarts();
      return;
    }
    if (event.target.closest("[data-dom-result-again]")) {
      local.selectedGame === "checkers" ? startCheckers() : startDarts();
      return;
    }
    const cell = event.target.closest("[data-dom-checkers-board] [data-row]");
    if (cell) {
      handleCheckersCell(Number(cell.dataset.row), Number(cell.dataset.col));
    }
  });

  game.events.on("pubpaid:open-dom-lobby", showLobby);
  game.events.on("pubpaid:darts-result", ({ result, body } = {}) => {
    showResult("darts", result || "draw", body || "Partida encerrada.");
  });

  subscribeGameState((state) => {
    refs.scene.textContent = state.currentScene || "jogo";
    refs.objective.textContent = state.objective || "PubPaid";
    const shouldShow =
      state.currentScene === "game-lobby" ||
      state.activeGameId === "darts" ||
      state.activeGameId === "checkers" ||
      state.lobbyPhase === "selecting" ||
      state.lobbyPhase === "playing" ||
      state.lobbyPhase === "finished";
    refs.root.classList.toggle("is-hidden", !shouldShow);
    document.body.classList.toggle("ppg-lobby-clean", shouldShow);
    if (state.lobbyPhase === "selecting" && !refs.lobby.hidden) return;
    if (state.currentScene === "game-lobby" || state.lobbyPhase === "selecting") {
      if (refs.darts.hidden && refs.checkers.hidden && refs.result.hidden) setPanel("lobby");
    }
    if (state.activeGameId === "darts" && state.dartsGame) {
      refs.dartsScore.textContent = `${state.dartsGame.playerScore || 0} x ${state.dartsGame.aiScore || 0}`;
      refs.dartsRound.textContent = `rodada ${Math.min(state.dartsGame.round || 1, state.dartsGame.maxRounds || 3)}/${state.dartsGame.maxRounds || 3}`;
      refs.dartsTitle.textContent = state.dartsGame.phase === "finished" ? "Mesa encerrada" : "Mire e arremesse";
      refs.dartsStatus.textContent = state.prompt || "Mire no alvo e arremesse.";
    }
  });
}
