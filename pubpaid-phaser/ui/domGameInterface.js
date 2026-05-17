import { gameState, subscribeGameState, updateGameState } from "../core/gameState.js";
import { joinPubpaidPvpQueue, leavePubpaidPvpQueue } from "../services/accountService.js";
import { fetchPvpState, moveCheckers } from "../services/pvpService.js";

const CHECKERS_SIZE = 8;
const MATCH_OPPONENTS = {
  pool: [
    { name: "Nando Giz Azul", rating: 790, style: "controle de mesa" },
    { name: "Lia Caçapa", rating: 830, style: "tacadas curtas" },
    { name: "Caio Tabela", rating: 760, style: "defesa paciente" }
  ],
  checkers: [
    { name: "Dona Coroa", rating: 780, style: "jogo posicional" },
    { name: "Caio Diagonal", rating: 740, style: "captura agressiva" },
    { name: "Lia Rainha", rating: 820, style: "final forte" }
  ]
};

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

function chooseCheckersAiMove(moves) {
  return [...moves].sort((a, b) => {
    const captureScore = Number(Boolean(b.capture)) - Number(Boolean(a.capture));
    if (captureScore) return captureScore;
    const rowScore = b.to.row - a.to.row;
    if (rowScore) return rowScore;
    const centerA = Math.abs(3.5 - a.to.col);
    const centerB = Math.abs(3.5 - b.to.col);
    if (centerA !== centerB) return centerA - centerB;
    return a.to.col - b.to.col;
  })[0];
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
    lobbyBalance: document.querySelector("[data-dom-lobby-balance]"),
    lobbyStake: document.querySelector("[data-dom-lobby-stake]"),
    lobbyState: document.querySelector("[data-dom-lobby-state]"),
    matchmaking: document.querySelector("[data-dom-matchmaking]"),
    matchmakingGame: document.querySelector("[data-dom-matchmaking-game]"),
    matchmakingStatus: document.querySelector("[data-dom-matchmaking-status]"),
    accessBlock: document.querySelector("[data-dom-access-block]"),
    accessBlockTitle: document.querySelector("[data-dom-access-block-title]"),
    accessBlockBody: document.querySelector("[data-dom-access-block-body]"),
    cancelAccessBlock: document.querySelector("[data-dom-cancel-access-block]"),
    pool: document.querySelector("[data-dom-pool]"),
    poolTitle: document.querySelector("[data-dom-pool-title]"),
    poolScore: document.querySelector("[data-dom-pool-score]"),
    poolRound: document.querySelector("[data-dom-pool-round]"),
    poolStatus: document.querySelector("[data-dom-pool-status]"),
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
    selectedGame: "pool",
    checkers: initialCheckersState(),
    matchCounter: { pool: 0, checkers: 0 },
    matchmakingTimer: null,
    pvpPollTimer: null,
    pvpSelected: null,
    pvpLegalMoves: [],
    pvpRenderBusy: false
  };

  const setPanel = (name) => {
    refs.root.classList.toggle("is-lobby", name === "lobby");
    refs.root.classList.toggle("is-matchmaking", name === "matchmaking");
    refs.root.classList.toggle("is-access-block", name === "access-block");
    refs.root.classList.toggle("is-pool", name === "pool");
    refs.root.classList.toggle("is-checkers", name === "checkers");
    refs.root.classList.toggle("is-result", name === "result");
    refs.lobby.hidden = name !== "lobby";
    refs.matchmaking.hidden = name !== "matchmaking";
    refs.accessBlock.hidden = name !== "access-block";
    refs.pool.hidden = name !== "pool";
    refs.checkers.hidden = name !== "checkers";
    refs.result.hidden = name !== "result";
    refs.root.classList.toggle("is-playing", name === "pool" || name === "checkers");
  };

  const setMatchmakingState = (state = "searching") => {
    if (refs.matchmaking) refs.matchmaking.dataset.matchState = state;
  };

  const showLobby = () => {
    window.clearTimeout(local.matchmakingTimer);
    window.clearInterval(local.pvpPollTimer);
    local.matchmakingTimer = null;
    local.pvpPollTimer = null;
    local.pvpSelected = null;
    local.pvpLegalMoves = [];
    local.selectedGame = gameState.activeGameId || local.selectedGame || "pool";
    setPanel("lobby");
    updateGameState({
      lobbyPhase: "selecting",
      objective: "Escolher Sinuca ou Damas",
      prompt: "Lobby aberto. Mesas pagas exigem saldo real aprovado."
    });
  };

  const showResult = (gameId, result, body) => {
    local.selectedGame = gameId;
    refs.resultGame.textContent = gameId === "checkers" ? "damas" : "sinuca";
    refs.resultTitle.textContent = resultTitle(result);
    refs.resultBody.textContent = body;
    refs.result.dataset.result = result;
    setPanel("result");
  };

  const pickOpponent = (gameId) => {
    const list = MATCH_OPPONENTS[gameId] || MATCH_OPPONENTS.pool;
    const index = local.matchCounter[gameId] % list.length;
    local.matchCounter[gameId] += 1;
    return list[index];
  };

  const startPool = (opponent = pickOpponent("pool")) => {
    local.selectedGame = "pool";
    setPanel("pool");
    updateGameState({ activeGameId: "pool", lobbyPhase: "playing", lobbyOpponent: opponent });
    game.scene.stop("game-lobby-scene");
    game.scene.stop("checkers-game-scene");
    game.scene.start("pool-game-scene", { stake: gameState.lobbyStake || 10, opponent });
  };

  const showMatchmaking = (gameId) => {
    window.clearTimeout(local.matchmakingTimer);
    local.selectedGame = gameId;
    const gameName = gameId === "checkers" ? "Damas" : "Sinuca";
    refs.matchmakingGame.textContent = gameName;
    refs.matchmakingStatus.textContent = `Procurando oponente real para ${gameName}.`;
    setMatchmakingState("searching");
    setPanel("matchmaking");
    updateGameState({
      activeGameId: gameId,
      selectedTable: gameId,
      lobbyPhase: "matching",
      objective: `Encontrar oponente para ${gameName}`,
      focus: "matchmaking real",
      prompt: `Buscando oponente real para ${gameName}.`
    });
    local.matchmakingTimer = window.setTimeout(() => {
      const opponent = pickOpponent(gameId);
      updateGameState({
        lobbyPhase: "matched",
        lobbyOpponent: opponent,
        prompt: `${opponent.name} encontrado. Abrindo mesa.`
      });
      gameId === "checkers" ? showAccessBlock() : showAccessBlock("unavailable");
    }, 980);
  };

  const showAccessBlock = (reason = "deposit") => {
    const user = gameState.googleUser || window.CatalogoGoogleAuth?.getUser?.() || null;
    const pending = Number(gameState.pendingDeposits || 0);
    const copy = !user?.email
      ? {
          title: "Login obrigatório",
          body: "Entre com sua conta antes de abrir a carteira ou jogar mesas pagas."
        }
      : pending > 0
        ? {
            title: "Depósito pendente",
            body: "Seu Pix foi avisado ao admin. O saldo só fica jogável depois da aprovação."
          }
        : {
            title: "Sem saldo aprovado",
            body: "Faça um depósito Pix na carteira e aguarde a aprovação do admin para jogar."
          };
    if (reason === "unavailable") {
      copy.title = "Mesa real indisponível";
      copy.body = "Esta mesa ainda precisa do backend real de partida, escrow e pagamento antes de abrir.";
    }
    refs.accessBlockTitle.textContent = copy.title;
    refs.accessBlockBody.textContent = copy.body;
    setPanel("access-block");
    updateGameState({
      activeGameId: "",
      lobbyPhase: "blocked",
      objective: copy.title,
      focus: "carteira real",
      prompt: copy.body
    });
  };

  const isRealCheckersEligible = () =>
    gameIdIsCheckers(local.selectedGame) &&
    Number(gameState.availableBalance || 0) >= Number(gameState.lobbyStake || 10);

  const isLoggedIn = () => Boolean(gameState.googleUser?.email || window.CatalogoGoogleAuth?.isSignedIn?.());

  const gameIdIsCheckers = (gameId) => gameId === "checkers";

  const getPvpOwner = (piece = "") => {
    if (!piece) return "";
    return piece.toLowerCase() === "p" ? "playerOne" : "playerTwo";
  };

  const getPvpDirections = (piece = "") => {
    if (!piece) return [];
    if (piece === piece.toUpperCase()) return [[-1, -1], [-1, 1], [1, -1], [1, 1]];
    return piece.toLowerCase() === "p" ? [[-1, -1], [-1, 1]] : [[1, -1], [1, 1]];
  };

  const isPvpInside = (row, col) => row >= 0 && row < CHECKERS_SIZE && col >= 0 && col < CHECKERS_SIZE;

  const getPvpMovesFor = (board, row, col) => {
    const piece = board?.[row]?.[col];
    if (!piece) return [];
    const owner = getPvpOwner(piece);
    const enemy = owner === "playerOne" ? "playerTwo" : "playerOne";
    const moves = [];
    getPvpDirections(piece).forEach(([dr, dc]) => {
      const mid = { row: row + dr, col: col + dc };
      const landing = { row: row + dr * 2, col: col + dc * 2 };
      if (isPvpInside(mid.row, mid.col) && !board[mid.row][mid.col]) {
        moves.push({ from: { row, col }, to: mid, capture: null });
      }
      if (
        isPvpInside(landing.row, landing.col) &&
        board[mid.row]?.[mid.col] &&
        getPvpOwner(board[mid.row][mid.col]) === enemy &&
        !board[landing.row][landing.col]
      ) {
        moves.push({ from: { row, col }, to: landing, capture: mid });
      }
    });
    return moves;
  };

  const getAllPvpMoves = (board, owner) => {
    const moves = [];
    for (let row = 0; row < CHECKERS_SIZE; row += 1) {
      for (let col = 0; col < CHECKERS_SIZE; col += 1) {
        if (getPvpOwner(board?.[row]?.[col]) === owner) moves.push(...getPvpMovesFor(board, row, col));
      }
    }
    const captures = moves.filter((move) => move.capture);
    return captures.length ? captures : moves;
  };

  const renderPvpCheckers = () => {
    if (local.pvpRenderBusy) return;
    const match = gameState.pvpMatch;
    const seat = gameState.pvpSeat;
    const board = Array.isArray(match?.board) ? match.board : [];
    if (!board.length || !seat) return;
    local.pvpRenderBusy = true;
    const targetKeys = new Set(local.pvpLegalMoves.map((move) => `${move.to.row}-${move.to.col}`));
    try {
      refs.checkersBoard.innerHTML = board.flatMap((row, rowIndex) => (
        row.map((piece, colIndex) => {
          const dark = (rowIndex + colIndex) % 2 === 1;
          const owner = getPvpOwner(piece);
          const own = owner && owner === seat;
          const className = [
            "ppg-dom-cell",
            dark ? "is-dark" : "is-light",
            local.pvpSelected?.row === rowIndex && local.pvpSelected?.col === colIndex ? "is-selected" : "",
            targetKeys.has(`${rowIndex}-${colIndex}`) ? "is-target" : ""
          ].filter(Boolean).join(" ");
          const disabled = match.status !== "active" || match.turn !== seat ? " disabled" : "";
          const checker = piece
            ? `<span class="ppg-dom-piece is-${own ? "player" : "ai"}${piece === piece.toUpperCase() ? " is-king" : ""}">${piece === piece.toUpperCase() ? "K" : ""}</span>`
            : "";
          return `<button type="button" class="${className}" data-row="${rowIndex}" data-col="${colIndex}"${disabled}>${checker}</button>`;
        })
      )).join("");
      const ownPieces = board.flat().filter((piece) => getPvpOwner(piece) === seat).length;
      const rivalPieces = board.flat().filter((piece) => getPvpOwner(piece) && getPvpOwner(piece) !== seat).length;
      refs.checkersTitle.textContent = match.status === "finished" ? "Mesa encerrada" : match.turn === seat ? "Sua vez" : "Vez do rival";
      refs.checkersScore.textContent = `${ownPieces} x ${rivalPieces}`;
      refs.checkersStatus.textContent =
        match.status === "finished"
          ? match.resultSummary || "Partida encerrada."
          : match.turn === seat
            ? "Sua vez. Escolha uma peça."
            : "Aguardando jogada do rival.";
      updateGameState({
        activeGameId: "checkers",
        lobbyPhase: match.status === "finished" ? "finished" : "playing",
        checkersGame: {
          phase: match.status,
          turn: match.turn,
          playerPieces: ownPieces,
          aiPieces: rivalPieces,
          selected: local.pvpSelected,
          legalMoves: local.pvpLegalMoves.map((move) => ({ to: move.to, capture: Boolean(move.capture) })),
          moveCount: match.moveCount || 0,
          realPvp: true
        },
        objective: "Vencer a Dama real",
        focus: "tabuleiro PvP de dama",
        prompt: refs.checkersStatus.textContent
      });
      if (match.status === "finished") {
        const won = match.winner && match.winner === seat;
        const result = match.winner ? (won ? "win" : "loss") : "draw";
        const settlement = match.settlement || {};
        const payout = Number(settlement.payout || 0);
        const fee = Number(settlement.houseFee || 0);
        const body = match.winner
          ? `${match.resultSummary || "Partida encerrada."} ${won ? `Você recebeu ${payout} créditos reais.` : "Você perdeu a mesa."} Casa: ${fee}.`
          : `${match.resultSummary || "Empate."} Entrada devolvida.`;
        showResult("checkers", result, body);
      }
    } finally {
      local.pvpRenderBusy = false;
    }
  };

  const startPvpPolling = () => {
    window.clearInterval(local.pvpPollTimer);
    local.pvpPollTimer = window.setInterval(async () => {
      const payload = await fetchPvpState("checkers");
      if (payload?.ok) {
        if (payload.state === "waiting") {
          setMatchmakingState("waiting");
          refs.matchmakingStatus.textContent = "Mesa aberta. Estamos aguardando outro jogador real.";
        } else if (payload?.match?.status) {
          setMatchmakingState("matched");
          refs.matchmakingStatus.textContent = "Jogador encontrado. Abrindo o tabuleiro.";
        }
        renderPvpCheckers();
      }
    }, 1200);
  };

  const startRealCheckers = async () => {
    local.selectedGame = "checkers";
    refs.matchmakingGame.textContent = "Damas";
    refs.matchmakingStatus.textContent = "Abrindo mesa real e procurando outro jogador.";
    setMatchmakingState("searching");
    setPanel("matchmaking");
    updateGameState({
      activeGameId: "checkers",
      selectedTable: "checkers",
      lobbyPhase: "matching",
      objective: "Encontrar jogador real para Damas",
      focus: "matchmaking real",
      prompt: "Buscando jogador real. Escrow travado no servidor."
    });
    const payload = await joinPubpaidPvpQueue("checkers", gameState.lobbyStake || 10);
    if (!payload?.ok) {
      setMatchmakingState("error");
      refs.matchmakingStatus.textContent = payload?.error || "Nao foi possivel abrir a fila real.";
      updateGameState({ prompt: refs.matchmakingStatus.textContent });
      return;
    }
    if (payload.state === "waiting") {
      setMatchmakingState("waiting");
      refs.matchmakingStatus.textContent = "Mesa aberta. Estamos aguardando outro jogador real.";
      startPvpPolling();
      return;
    }
    setMatchmakingState("matched");
    setPanel("checkers");
    game.scene.stop("game-lobby-scene");
    game.scene.stop("pool-game-scene");
    renderPvpCheckers();
    startPvpPolling();
  };

  const renderCheckers = () => {
    const state = local.checkers;
    const targetKeys = new Set(state.legalMoves.map((move) => `${move.to.row}-${move.to.col}`));
    refs.checkersBoard.innerHTML = state.board.flatMap((row, rowIndex) => (
      row.map((piece, colIndex) => {
        const dark = (rowIndex + colIndex) % 2 === 1;
        const className = [
          "ppg-dom-cell",
          dark ? "is-dark" : "is-light",
          state.selected?.row === rowIndex && state.selected?.col === colIndex ? "is-selected" : "",
          targetKeys.has(`${rowIndex}-${colIndex}`) ? "is-target" : ""
        ].filter(Boolean).join(" ");
        const disabled = state.turn !== "player" || Boolean(state.result) ? " disabled" : "";
        const checker = piece
          ? `<span class="ppg-dom-piece is-${piece.owner}${piece.king ? " is-king" : ""}">${piece.king ? "K" : ""}</span>`
          : "";
        return `<button type="button" class="${className}" data-row="${rowIndex}" data-col="${colIndex}"${disabled}>${checker}</button>`;
      })
    )).join("");
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
    showResult("checkers", result.result, local.checkers.status);
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
    const move = chooseCheckersAiMove(captures.length ? captures : moves);
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

  const startCheckers = (opponent = pickOpponent("checkers")) => {
    local.selectedGame = "checkers";
    local.checkers = initialCheckersState();
    setPanel("checkers");
    game.scene.stop("game-lobby-scene");
    game.scene.stop("pool-game-scene");
    game.scene.start("checkers-game-scene", { stake: gameState.lobbyStake || 10, opponent });
    renderCheckers();
  };

  document.addEventListener("click", (event) => {
    const startButton = event.target.closest("[data-dom-start-game]");
    if (startButton) {
      const nextGame = startButton.dataset.domStartGame === "checkers" ? "checkers" : "pool";
      local.selectedGame = nextGame;
      if (nextGame === "checkers" && isRealCheckersEligible()) {
        startRealCheckers();
      } else if (nextGame === "checkers") {
        showAccessBlock();
      } else {
        showAccessBlock("unavailable");
      }
      return;
    }
    if (event.target.closest("[data-dom-open-lobby]")) {
      window.clearTimeout(local.matchmakingTimer);
      window.clearInterval(local.pvpPollTimer);
      if (gameState.pvpStatus === "waiting") leavePubpaidPvpQueue("checkers");
      game.scene.stop("pool-game-scene");
      game.scene.stop("checkers-game-scene");
      game.scene.start("game-lobby-scene", { gameId: local.selectedGame });
      showLobby();
      return;
    }
    if (event.target.closest("[data-dom-return-salon]")) {
      window.clearTimeout(local.matchmakingTimer);
      window.clearInterval(local.pvpPollTimer);
      if (gameState.pvpStatus === "waiting") leavePubpaidPvpQueue("checkers");
      game.scene.stop("pool-game-scene");
      game.scene.stop("checkers-game-scene");
      game.scene.stop("game-lobby-scene");
      game.scene.start("interior-scene");
      setPanel("");
      updateGameState({ activeGameId: "", lobbyPhase: "hub" });
      return;
    }
    if (event.target.closest("[data-dom-pool-shot]")) {
      game.events.emit("pubpaid:pool-dom-shot");
      return;
    }
    const resetButton = event.target.closest("[data-dom-game-reset]");
    if (resetButton) {
      resetButton.dataset.domGameReset === "checkers" ? showAccessBlock() : showAccessBlock("unavailable");
      return;
    }
    if (event.target.closest("[data-dom-result-again]")) {
      local.selectedGame === "checkers" && isRealCheckersEligible() ? startRealCheckers() : showAccessBlock();
      return;
    }
    const cell = event.target.closest("[data-dom-checkers-board] [data-row]");
    if (cell) {
      const row = Number(cell.dataset.row);
      const col = Number(cell.dataset.col);
      if (gameState.pvpGameId === "checkers" && gameState.pvpMatch?.status) {
        const match = gameState.pvpMatch;
        const seat = gameState.pvpSeat;
        if (match.status !== "active" || match.turn !== seat) return;
        const target = local.pvpLegalMoves.find((move) => move.to.row === row && move.to.col === col);
        if (target) {
          moveCheckers(match.id, target).then((payload) => {
            if (payload?.ok) {
              local.pvpSelected = null;
              local.pvpLegalMoves = [];
              renderPvpCheckers();
            }
          });
          return;
        }
        const piece = match.board?.[row]?.[col];
        if (getPvpOwner(piece) !== seat) {
          local.pvpSelected = null;
          local.pvpLegalMoves = [];
          renderPvpCheckers();
          return;
        }
        local.pvpSelected = { row, col };
        local.pvpLegalMoves = getAllPvpMoves(match.board, seat).filter((move) => move.from.row === row && move.from.col === col);
        renderPvpCheckers();
        return;
      }
      handleCheckersCell(row, col);
    }
  });

  refs.cancelAccessBlock?.addEventListener("click", () => {
    showLobby();
  });

  game.events.on("pubpaid:open-dom-lobby", showLobby);
  game.events.on("pubpaid:block-paid-game", showAccessBlock);
  game.events.on("pubpaid:start-real-checkers", startRealCheckers);
  game.events.on("pubpaid:pool-result", ({ result, body } = {}) => {
    showResult("pool", result || "draw", body || "Partida encerrada.");
  });
  game.events.on("pubpaid:checkers-result", ({ result, body } = {}) => {
    showResult("checkers", result || "draw", body || "Partida encerrada.");
  });

  subscribeGameState((state) => {
    refs.scene.textContent = state.currentScene || "jogo";
    refs.objective.textContent = state.objective || "PubPaid";
    const shouldShow =
      state.currentScene === "game-lobby" ||
      state.activeGameId === "pool" ||
      state.activeGameId === "checkers" ||
      state.lobbyPhase === "selecting" ||
      state.lobbyPhase === "blocked" ||
      state.lobbyPhase === "matching" ||
      state.lobbyPhase === "matched" ||
      state.lobbyPhase === "playing" ||
      state.lobbyPhase === "finished";
    refs.root.classList.toggle("is-hidden", !shouldShow);
    document.body.classList.toggle("ppg-lobby-clean", shouldShow);
    if (refs.lobbyBalance) refs.lobbyBalance.textContent = `${state.availableBalance || 0}`;
    if (refs.lobbyStake) refs.lobbyStake.textContent = `${state.lobbyStake || 10}`;
    if (refs.lobbyState) {
      refs.lobbyState.textContent =
        state.lobbyPhase === "matching" ? "buscando" :
        state.lobbyPhase === "matched" ? "oponente encontrado" :
        state.lobbyPhase === "playing" ? "em mesa" :
        state.lobbyPhase === "finished" ? "resultado" :
        "pronto";
    }
    if (state.lobbyPhase === "selecting" && !refs.lobby.hidden) return;
    if (state.lobbyPhase === "blocked" && !refs.accessBlock.hidden) return;
    if (state.lobbyPhase === "blocked") {
      setPanel("access-block");
      return;
    }
    if (state.lobbyPhase === "matching" && !refs.matchmaking.hidden) return;
    if (state.currentScene === "game-lobby" || state.lobbyPhase === "selecting") {
      if (refs.pool.hidden && refs.checkers.hidden && refs.result.hidden && refs.matchmaking.hidden) setPanel("lobby");
    }
    if (state.activeGameId === "pool" && state.poolGame) {
      refs.poolScore.textContent = `${state.poolGame.playerScore || 0} x ${state.poolGame.aiScore || 0}`;
      refs.poolRound.textContent = `rodada ${Math.min(state.poolGame.round || 1, state.poolGame.maxRounds || 4)}/${state.poolGame.maxRounds || 4}`;
      refs.poolTitle.textContent = state.poolGame.phase === "finished" ? "Mesa encerrada" : "Mira e força";
      refs.poolStatus.textContent = state.prompt || "Trave mira e força para tacar.";
    }
    if (state.pvpGameId === "checkers" && state.pvpMatch) {
      if (refs.checkers.hidden && state.pvpMatch.status !== "waiting") setPanel("checkers");
      renderPvpCheckers();
    }
  });
}
