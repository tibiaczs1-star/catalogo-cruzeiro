import { gameState, subscribeGameState, updateGameState } from "../core/gameState.js";
import { joinPubpaidPvpQueue, leavePubpaidPvpQueue, syncPubpaidAccount } from "../services/accountService.js?v=20260518-entryclean1";
import {
  confirmPvpReady,
  drawPoker,
  fetchPvpState,
  guessDicecups,
  moveCheckers,
  moveChess,
  playTrucoCard,
  shootPool
} from "../services/pvpService.js?v=20260518-entryclean1";
import {
  CHECKERS_SIZE,
  applyCheckersMove,
  countCheckersPieces,
  createInitialCheckersBoard,
  getCheckersLegalMoves,
  getCheckersOwner,
  getCheckersOutcome,
  isCheckersKing
} from "../core/checkersRules.js?v=20260518-entryclean1";

function resultTitle(result) {
  if (result === "win") return "Vitória";
  if (result === "loss") return "Derrota";
  return "Empate";
}

const PVP_GAMES = new Set(["pool", "checkers", "chess", "poker", "truco", "dicecups"]);
const GAME_LABELS = {
  pool: "Sinuca",
  checkers: "Damas",
  chess: "Xadrez",
  poker: "Poker",
  truco: "Truco",
  dicecups: "Dados"
};

const CHESS_PIECES = {
  p: "♟", r: "♜", n: "♞", b: "♝", q: "♛", k: "♚",
  P: "♙", R: "♖", N: "♘", B: "♗", Q: "♕", K: "♔"
};

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
    matchSelfPicture: document.querySelector("[data-dom-match-self-picture]"),
    matchSelfInitial: document.querySelector("[data-dom-match-self-initial]"),
    matchSelfName: document.querySelector("[data-dom-match-self-name]"),
    matchSelfState: document.querySelector("[data-dom-match-self-state]"),
    matchRival: document.querySelector("[data-dom-match-rival]"),
    matchRivalPicture: document.querySelector("[data-dom-match-rival-picture]"),
    matchRivalInitial: document.querySelector("[data-dom-match-rival-initial]"),
    matchRivalName: document.querySelector("[data-dom-match-rival-name]"),
    matchRivalState: document.querySelector("[data-dom-match-rival-state]"),
    pvpReady: document.querySelector("[data-dom-pvp-ready]"),
    accessBlock: document.querySelector("[data-dom-access-block]"),
    accessBlockTitle: document.querySelector("[data-dom-access-block-title]"),
    accessBlockBody: document.querySelector("[data-dom-access-block-body]"),
    cancelAccessBlock: document.querySelector("[data-dom-cancel-access-block]"),
    pool: document.querySelector("[data-dom-pool]"),
    poolKicker: document.querySelector("[data-dom-pool-kicker]"),
    poolTitle: document.querySelector("[data-dom-pool-title]"),
    poolScore: document.querySelector("[data-dom-pool-score]"),
    poolRound: document.querySelector("[data-dom-pool-round]"),
    poolStatus: document.querySelector("[data-dom-pool-status]"),
    poolLast: document.querySelector("[data-dom-pool-last]"),
    poolStage: document.querySelector("[data-dom-pool-stage]"),
    poolSelf: document.querySelector("[data-dom-pool-self]"),
    poolSelfInitial: document.querySelector("[data-dom-pool-self-initial]"),
    poolSelfName: document.querySelector("[data-dom-pool-self-name]"),
    poolSelfMeta: document.querySelector("[data-dom-pool-self-meta]"),
    poolSelfBalls: document.querySelector("[data-dom-pool-self-balls]"),
    poolRival: document.querySelector("[data-dom-pool-rival]"),
    poolRivalInitial: document.querySelector("[data-dom-pool-rival-initial]"),
    poolRivalName: document.querySelector("[data-dom-pool-rival-name]"),
    poolRivalMeta: document.querySelector("[data-dom-pool-rival-meta]"),
    poolRivalBalls: document.querySelector("[data-dom-pool-rival-balls]"),
    poolShot: document.querySelector("[data-dom-pool-shot]"),
    poolTouchShot: document.querySelector("[data-dom-pool-touch-shot]"),
    forfeitPool: document.querySelector("[data-dom-forfeit-pool]"),
    checkers: document.querySelector("[data-dom-checkers]"),
    checkersBoard: document.querySelector("[data-dom-checkers-board]"),
    checkersKicker: document.querySelector("[data-dom-checkers-kicker]"),
    checkersTitle: document.querySelector("[data-dom-checkers-title]"),
    checkersScore: document.querySelector("[data-dom-checkers-score]"),
    checkersStatus: document.querySelector("[data-dom-checkers-status]"),
    checkersTimer: document.querySelector("[data-dom-checkers-timer]"),
    checkersMoves: document.querySelector("[data-dom-checkers-moves]"),
    checkersSelf: document.querySelector("[data-dom-checkers-self]"),
    checkersSelfInitial: document.querySelector("[data-dom-checkers-self-initial]"),
    checkersSelfName: document.querySelector("[data-dom-checkers-self-name]"),
    checkersSelfMeta: document.querySelector("[data-dom-checkers-self-meta]"),
    checkersSelfPieces: document.querySelector("[data-dom-checkers-self-pieces]"),
    checkersRival: document.querySelector("[data-dom-checkers-rival]"),
    checkersRivalInitial: document.querySelector("[data-dom-checkers-rival-initial]"),
    checkersRivalName: document.querySelector("[data-dom-checkers-rival-name]"),
    checkersRivalMeta: document.querySelector("[data-dom-checkers-rival-meta]"),
    checkersRivalPieces: document.querySelector("[data-dom-checkers-rival-pieces]"),
    checkersHints: document.querySelector("[data-dom-checkers-hints]"),
    checkersHistory: document.querySelector("[data-dom-checkers-history]"),
    forfeitCheckers: document.querySelector("[data-dom-forfeit-checkers]"),
    table: document.querySelector("[data-dom-table]"),
    tableKicker: document.querySelector("[data-dom-table-kicker]"),
    tableTitle: document.querySelector("[data-dom-table-title]"),
    tableBody: document.querySelector("[data-dom-table-body]"),
    tableScore: document.querySelector("[data-dom-table-score]"),
    tableStatus: document.querySelector("[data-dom-table-status]"),
    genericForfeit: document.querySelector("[data-dom-generic-forfeit]"),
    result: document.querySelector("[data-dom-result]"),
    resultGame: document.querySelector("[data-dom-result-game]"),
    resultTitle: document.querySelector("[data-dom-result-title]"),
    resultAmount: document.querySelector("[data-dom-result-amount]"),
    resultBody: document.querySelector("[data-dom-result-body]"),
    resultNext: document.querySelector("[data-dom-result-next]"),
    resultAgain: document.querySelector("[data-dom-result-again]")
  };
  if (!refs.root) return;

  const local = {
    selectedGame: "pool",
    pvpPollTimer: null,
    resultReturnTimer: null,
    resultHandledMatchId: "",
    pvpSelected: null,
    pvpLegalMoves: [],
    pvpDragFrom: null,
    demoCheckers: null,
    demoSelected: null,
    demoLegalMoves: [],
    demoAiTimer: null,
    pvpHeld: [true, true, true, true, true],
    chessSelected: "",
    poolAim: 0,
    poolPower: 0.56,
    poolControlStage: "aim",
    poolPowerDirection: 1,
    poolPowerTimer: null,
    pvpRenderBusy: false,
    pvpTableRenderBusy: false,
    tableRenderKey: "",
    poolRenderKey: "",
    checkersSound: null,
    lastCheckersSoundKey: "",
    lastCheckersTouchAt: 0
  };

  const setPanel = (name) => {
    refs.root.classList.toggle("is-lobby", name === "lobby");
    refs.root.classList.toggle("is-matchmaking", name === "matchmaking");
    refs.root.classList.toggle("is-access-block", name === "access-block");
    refs.root.classList.toggle("is-pool", name === "pool");
    refs.root.classList.toggle("is-checkers", name === "checkers");
    refs.root.classList.toggle("is-table", name === "table");
    refs.root.classList.toggle("is-result", name === "result");
    document.body?.classList.toggle("ppg-dom-playing", name === "pool" || name === "checkers" || name === "table");
    document.body?.classList.toggle("ppg-dom-checkers-active", name === "checkers");
    refs.lobby.hidden = name !== "lobby";
    refs.matchmaking.hidden = name !== "matchmaking";
    refs.accessBlock.hidden = name !== "access-block";
    refs.pool.hidden = name !== "pool";
    refs.checkers.hidden = name !== "checkers";
    if (refs.table) refs.table.hidden = name !== "table";
    refs.result.hidden = name !== "result";
    refs.root.classList.toggle("is-playing", name === "pool" || name === "checkers" || name === "table");
  };

  const setMatchmakingState = (state = "searching") => {
    if (refs.matchmaking) refs.matchmaking.dataset.matchState = state;
  };

  const stopPvpPoolPowerMeter = () => {
    window.clearInterval(local.poolPowerTimer);
    local.poolPowerTimer = null;
  };

  const resetPvpPoolControls = () => {
    stopPvpPoolPowerMeter();
    local.poolAim = 0;
    local.poolPower = 0.18;
    local.poolControlStage = "aim";
    local.poolPowerDirection = 1;
  };

  const startPvpPoolPowerMeter = () => {
    stopPvpPoolPowerMeter();
    local.poolPowerTimer = window.setInterval(() => {
      local.poolPower += local.poolPowerDirection * 0.055;
      if (local.poolPower >= 0.96) {
        local.poolPower = 0.96;
        local.poolPowerDirection = -1;
      } else if (local.poolPower <= 0.18) {
        local.poolPower = 0.18;
        local.poolPowerDirection = 1;
      }
      renderPvpPool();
    }, 70);
  };

  const showLobby = () => {
    window.clearInterval(local.pvpPollTimer);
    window.clearTimeout(local.resultReturnTimer);
    window.clearTimeout(local.demoAiTimer);
    stopPvpPoolPowerMeter();
    if (isPoolDemoActive()) resetDemoPoolState();
    local.pvpPollTimer = null;
    local.resultReturnTimer = null;
    local.demoAiTimer = null;
    local.resultHandledMatchId = "";
    local.pvpSelected = null;
    local.pvpLegalMoves = [];
    local.pvpDragFrom = null;
    local.demoCheckers = null;
    local.demoSelected = null;
    local.demoLegalMoves = [];
    local.pvpHeld = [true, true, true, true, true];
    local.chessSelected = "";
    local.poolAim = 0;
    local.poolPower = 0.56;
    local.tableRenderKey = "";
    local.poolRenderKey = "";
    local.lastCheckersSoundKey = "";
    local.selectedGame = local.selectedGame === "pool-demo"
      ? "pool"
      : gameState.activeGameId || local.selectedGame || "pool";
    setPanel("lobby");
    const resetFinishedPvp = gameState.pvpStatus === "finished"
      ? {
          pvpStatus: "idle",
          pvpGameId: "",
          pvpSeat: "",
          pvpMatchId: "",
          pvpMatch: null,
          pvpQueue: null
        }
      : {};
    updateGameState({
      ...resetFinishedPvp,
      lobbyPhase: "selecting",
      objective: "Escolher mesa PvP",
      prompt: "Lobby aberto. Mesas pagas exigem saldo real aprovado."
    });
  };

  const formatResultAmount = (delta = 0) => {
    const amount = Number(delta || 0);
    if (!Number.isFinite(amount) || amount === 0) return "saldo mantido";
    return `${amount > 0 ? "+" : ""}${amount} créditos`;
  };

  const showResult = (gameId, result, body, details = {}) => {
    window.clearTimeout(local.resultReturnTimer);
    local.selectedGame = gameId;
    refs.resultGame.textContent = gameLabel(gameId).toLowerCase();
    refs.resultTitle.textContent = resultTitle(result);
    if (refs.resultAmount) refs.resultAmount.textContent = formatResultAmount(details.delta || 0);
    refs.resultBody.textContent = body;
    if (refs.resultNext) refs.resultNext.textContent = "Voltando ao lobby em 5s.";
    refs.result.dataset.result = result;
    updateGameState({
      activeGameId: gameId,
      lobbyPhase: "finished",
      objective: resultTitle(result),
      focus: `resultado de ${gameLabel(gameId)}`,
      prompt: body
    });
    setPanel("result");
    if (PVP_GAMES.has(gameId) && gameState.pvpGameId === gameId) {
      syncPubpaidAccount().finally(() => {
        updateGameState({ prompt: "Resultado confirmado. Saldo real atualizado." });
      });
    }
    local.resultReturnTimer = window.setTimeout(() => {
      showLobby();
    }, 5000);
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
            body: "Seu pagamento foi informado. Aguarde confirmação para o saldo ficar jogável."
          }
        : {
            title: "Sem saldo aprovado",
            body: "Faça um depósito Pix na carteira e aguarde a aprovação do admin para jogar."
          };
    if (reason === "unavailable") {
      copy.title = "Mesa real indisponível";
      copy.body = "Esta mesa ainda precisa do backend real de partida, escrow e pagamento antes de abrir.";
    }
    if (reason === "pvp-only") {
      copy.title = "Mesa PvP real";
      copy.body = "A mesa só inicia com dois jogadores reais conectados, pareados e confirmados no botão Estou pronto.";
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

  const isRealPvpEligible = (gameId = local.selectedGame) =>
    PVP_GAMES.has(gameId) &&
    Number(gameState.availableBalance || 0) >= Number(gameState.lobbyStake || 10);

  const isRealCheckersEligible = () => isRealPvpEligible("checkers");

  const isLoggedIn = () => Boolean(gameState.googleUser?.email || window.CatalogoGoogleAuth?.isSignedIn?.());

  const gameIdIsCheckers = (gameId) => gameId === "checkers";

  const isCheckersDemoActive = () => local.selectedGame === "checkers-demo" && Boolean(local.demoCheckers);
  const isPoolDemoActive = () => local.selectedGame === "pool-demo";

  const gameLabel = (gameId = "") => GAME_LABELS[gameId] || "Mesa";

  const displayNameFor = (player = {}) =>
    player?.name || player?.email?.split?.("@")?.[0] || "Jogador";

  const initialFor = (player = {}) => displayNameFor(player).trim().charAt(0).toUpperCase() || "?";

  const secondsUntil = (isoValue = "") => {
    const deadline = new Date(isoValue || 0).getTime();
    if (!deadline) return 0;
    return Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
  };

  const secondsSince = (isoValue = "") => {
    const timestamp = new Date(isoValue || 0).getTime();
    if (!timestamp) return 0;
    return Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
  };

  const formatCheckersSquare = (position = {}) => {
    const row = Number(position.row);
    const col = Number(position.col);
    if (!Number.isInteger(row) || !Number.isInteger(col)) return "--";
    return `${String.fromCharCode(65 + col)}${CHECKERS_SIZE - row}`;
  };

  const formatCheckersMove = (move = {}) => {
    const connector = move.capture ? "x" : "-";
    return `${formatCheckersSquare(move.from)}${connector}${formatCheckersSquare(move.to)}`;
  };

  const setCheckersPlayerCard = (refsForPlayer = {}, player = {}, { pieces = 0, active = false, connected = true, label = "" } = {}) => {
    if (refsForPlayer.name) refsForPlayer.name.textContent = displayNameFor(player);
    if (refsForPlayer.initial) refsForPlayer.initial.textContent = initialFor(player);
    if (refsForPlayer.pieces) refsForPlayer.pieces.textContent = String(pieces);
    if (refsForPlayer.meta) {
      refsForPlayer.meta.textContent = active
        ? "em turno"
        : connected
          ? label || "conectado"
          : "reconectando";
    }
    refsForPlayer.root?.classList.toggle("is-active", active);
    refsForPlayer.root?.classList.toggle("is-offline", !connected);
  };

  const playCheckersMoveSound = (kind = "move") => {
    try {
      const AudioCtor = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtor) return;
      if (!local.checkersSound) {
        local.checkersSound = new AudioCtor();
      }
      const context = local.checkersSound;
      if (context.state === "suspended") context.resume().catch(() => {});
      const now = context.currentTime;
      const gain = context.createGain();
      const hit = context.createOscillator();
      const shine = context.createOscillator();
      hit.type = "triangle";
      shine.type = "sine";
      hit.frequency.setValueAtTime(kind === "capture" ? 176 : 220, now);
      hit.frequency.exponentialRampToValueAtTime(kind === "capture" ? 92 : 132, now + 0.12);
      shine.frequency.setValueAtTime(kind === "capture" ? 520 : 660, now);
      shine.frequency.exponentialRampToValueAtTime(kind === "capture" ? 260 : 440, now + 0.08);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(kind === "capture" ? 0.13 : 0.075, now + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + (kind === "capture" ? 0.18 : 0.12));
      hit.connect(gain);
      shine.connect(gain);
      gain.connect(context.destination);
      hit.start(now);
      shine.start(now);
      hit.stop(now + 0.2);
      shine.stop(now + 0.14);
    } catch (_error) {
      // Sound is cosmetic; gameplay must continue silently if the browser blocks it.
    }
  };

  const createDemoCheckersMatch = () => ({
    id: `demo-checkers-${Date.now()}`,
    gameId: "checkers-demo",
    status: "active",
    board: createInitialCheckersBoard(),
    turn: "playerOne",
    winner: "",
    resultSummary: "",
    ready: { playerOne: true, playerTwo: true },
    presence: {
      playerOne: { connected: true },
      playerTwo: { connected: true }
    },
    playerOne: currentPvpPlayer() || {
      name: "Você",
      email: "demo@pubpaid.local"
    },
    playerTwo: {
      name: "Máquina",
      email: "treino@pubpaid.local"
    },
    forcedPiece: null,
    lastMove: null,
    checkersHistory: [],
    moveCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    coinFlip: {
      face: "demo",
      firstSeat: "playerOne"
    }
  });

  const pickDemoAiMove = (moves = [], board = []) => {
    const scored = moves.map((move, index) => {
      const piece = board?.[move.from?.row]?.[move.from?.col] || "";
      const landingPiece = board?.[move.to?.row]?.[move.to?.col] || piece;
      const promotion = String(piece).toLowerCase() === "o" && move.to?.row === CHECKERS_SIZE - 1 ? 1 : 0;
      const centerBonus = 4 - Math.abs(3.5 - Number(move.to?.col || 0));
      const progress = Number(move.to?.row || 0);
      return {
        move,
        score:
          (move.capture ? 100 : 0) +
          Number(move.chainLength || 0) * 20 +
          promotion * 14 +
          (isCheckersKing(landingPiece) ? 4 : 0) +
          centerBonus +
          progress * 0.25 -
          index * 0.01
      };
    });
    scored.sort((a, b) => b.score - a.score);
    return scored[0]?.move || moves[0] || null;
  };

  const applyDemoCheckersMove = (move, seat = local.demoCheckers?.turn || "playerOne") => {
    const match = local.demoCheckers;
    if (!match || match.status !== "active" || !move) return;
    const board = applyCheckersMove(match.board, move);
    const nextPiece = board?.[move.to?.row]?.[move.to?.col] || "";
    const continuation = move.capture
      ? getCheckersLegalMoves(board, seat, move.to).filter((entry) => entry.capture && getCheckersOwner(nextPiece) === seat)
      : [];
    const outcome = getCheckersOutcome(board);
    const now = new Date().toISOString();
    const historyEntry = {
      index: Number(match.moveCount || 0) + 1,
      playerName: displayNameFor(match[seat]),
      seat,
      from: move.from,
      to: move.to,
      capture: move.capture || null,
      crowned: isCheckersKing(nextPiece),
      at: now
    };
    Object.assign(match, {
      board,
      lastMove: historyEntry,
      checkersHistory: match.checkersHistory.concat(historyEntry).slice(-80),
      moveCount: historyEntry.index,
      forcedPiece: continuation.length ? { ...move.to } : null,
      turn: continuation.length ? seat : seat === "playerOne" ? "playerTwo" : "playerOne",
      updatedAt: now
    });
    if (outcome) {
      match.status = "finished";
      match.winner = outcome;
      match.resultSummary = outcome === "playerOne" ? "Você venceu o treino." : "A máquina venceu o treino.";
      match.turn = "";
      match.forcedPiece = null;
    }
  };

  const scheduleDemoAiMove = () => {
    window.clearTimeout(local.demoAiTimer);
    if (!isCheckersDemoActive() || local.demoCheckers.status !== "active" || local.demoCheckers.turn !== "playerTwo") return;
    local.demoAiTimer = window.setTimeout(() => {
      if (!isCheckersDemoActive() || local.demoCheckers.status !== "active") return;
      const moves = getCheckersLegalMoves(local.demoCheckers.board, "playerTwo", local.demoCheckers.forcedPiece || null);
      const move = pickDemoAiMove(moves, local.demoCheckers.board);
      if (!move) {
        local.demoCheckers.status = "finished";
        local.demoCheckers.winner = "playerOne";
        local.demoCheckers.resultSummary = "Máquina sem movimentos. Você venceu o treino.";
      } else {
        applyDemoCheckersMove(move, "playerTwo");
      }
      local.demoSelected = null;
      local.demoLegalMoves = [];
      renderPvpCheckers();
      if (local.demoCheckers?.turn === "playerTwo") scheduleDemoAiMove();
    }, 650);
  };

  const resetDemoCheckersState = () => {
    window.clearTimeout(local.demoAiTimer);
    local.demoAiTimer = null;
    local.demoCheckers = null;
    local.demoSelected = null;
    local.demoLegalMoves = [];
    updateGameState({ checkersGame: null });
  };

  const resetDemoPoolState = () => {
    if (game.scene.isActive("pool-game-scene")) game.scene.stop("pool-game-scene");
    local.poolRenderKey = "";
    updateGameState({ poolGame: null });
  };

  const startDemoCheckers = () => {
    window.clearInterval(local.pvpPollTimer);
    resetDemoCheckersState();
    local.pvpPollTimer = null;
    local.selectedGame = "checkers-demo";
    local.demoCheckers = createDemoCheckersMatch();
    local.pvpSelected = null;
    local.pvpLegalMoves = [];
    local.lastCheckersSoundKey = "";
    setPanel("checkers");
    updateGameState({
      pvpStatus: "idle",
      pvpGameId: "",
      pvpSeat: "",
      pvpMatchId: "",
      pvpMatch: null,
      pvpQueue: null
    });
    renderPvpCheckers();
  };

  const startDemoPool = () => {
    window.clearInterval(local.pvpPollTimer);
    local.pvpPollTimer = null;
    resetDemoPoolState();
    local.selectedGame = "pool-demo";
    resetPvpPoolControls();
    local.poolRenderKey = "";
    refs.pool.dataset.mode = "demo";
    setPanel("pool");
    updateGameState({
      pvpStatus: "idle",
      pvpGameId: "",
      pvpSeat: "",
      pvpMatchId: "",
      pvpMatch: null,
      pvpQueue: null
    });
    game.scene.stop("game-lobby-scene");
    game.scene.start("pool-game-scene", { stake: 0, mode: "demo" });
  };

  const setPlayerSlot = ({ picture, initial, name, state }, player = null, fallback = {}) => {
    const source = player || fallback;
    if (name) name.textContent = displayNameFor(source);
    if (state) state.textContent = fallback.state || "aguardando";
    if (initial) initial.textContent = initialFor(source);
    if (picture) {
      const pictureUrl = source?.picture || "";
      picture.hidden = !pictureUrl;
      if (pictureUrl) picture.src = pictureUrl;
    }
  };

  const currentPvpPlayer = () => {
    const match = gameState.pvpMatch;
    if (match && gameState.pvpSeat) return match[gameState.pvpSeat] || null;
    return gameState.pvpQueue?.player || gameState.googleUser || window.CatalogoGoogleAuth?.getUser?.() || null;
  };

  const rivalPvpPlayer = () => {
    const match = gameState.pvpMatch;
    if (!match || !gameState.pvpSeat) return null;
    return gameState.pvpSeat === "playerOne" ? match.playerTwo : match.playerOne;
  };

  const renderMatchmakingState = () => {
    const match = gameState.pvpMatch;
    const seat = gameState.pvpSeat;
    const ready = match?.ready || {};
    const ownReady = Boolean(seat && ready[seat]);
    const rivalSeat = seat === "playerOne" ? "playerTwo" : "playerOne";
    const rivalReady = Boolean(rivalSeat && ready[rivalSeat]);
    const activeGameId = gameState.pvpGameId || local.selectedGame || "checkers";
    refs.matchmakingGame.textContent = gameLabel(activeGameId);
    setPlayerSlot({
      picture: refs.matchSelfPicture,
      initial: refs.matchSelfInitial,
      name: refs.matchSelfName,
      state: refs.matchSelfState
    }, currentPvpPlayer(), {
      name: "Você",
      state: match?.status === "readying" ? (ownReady ? "pronto" : "confirme inicio") : "na fila"
    });
    const rival = rivalPvpPlayer();
    setPlayerSlot({
      picture: refs.matchRivalPicture,
      initial: refs.matchRivalInitial,
      name: refs.matchRivalName,
      state: refs.matchRivalState
    }, rival, {
      name: "Aguardando jogador",
      state: rival ? (rivalReady ? "pronto" : "precisa confirmar") : "outro dispositivo"
    });
    refs.matchRival?.classList.toggle("is-pending", !rival);
    if (match?.status === "readying") {
      setMatchmakingState("matched");
      refs.matchmakingStatus.textContent = ownReady
        ? "Voce esta pronto. Aguardando o outro aparelho confirmar."
        : `Jogador real encontrado. Confirme pronto nos dois aparelhos para abrir ${gameLabel(activeGameId)}.`;
      if (refs.pvpReady) {
        refs.pvpReady.hidden = false;
        refs.pvpReady.disabled = ownReady;
        refs.pvpReady.textContent = ownReady ? "Aguardando rival" : "Estou pronto";
      }
      return;
    }
    setMatchmakingState(match ? "matched" : "waiting");
    refs.matchmakingStatus.textContent = `Aguardando jogador real em ${gameLabel(activeGameId)}`;
    if (refs.pvpReady) {
      refs.pvpReady.hidden = true;
      refs.pvpReady.disabled = false;
      refs.pvpReady.textContent = "Estou pronto";
    }
  };

  const renderPvpCheckers = () => {
    if (local.pvpRenderBusy) return;
    const demoMode = isCheckersDemoActive();
    const match = demoMode ? local.demoCheckers : gameState.pvpMatch;
    const seat = demoMode ? "playerOne" : gameState.pvpSeat;
    const board = Array.isArray(match?.board) ? match.board : [];
    if (!demoMode && match?.status === "readying") {
      setPanel("matchmaking");
      renderMatchmakingState();
      return;
    }
    if (!board.length || !seat) return;
    local.pvpRenderBusy = true;
    let selected = demoMode ? local.demoSelected : local.pvpSelected;
    let legalMoves = demoMode ? local.demoLegalMoves : local.pvpLegalMoves;
    if (match.forcedPiece && match.status === "active" && match.turn === seat && !selected) {
      selected = { ...match.forcedPiece };
      legalMoves = getCheckersLegalMoves(board, seat, match.forcedPiece || null)
        .filter((move) => move.from.row === match.forcedPiece.row && move.from.col === match.forcedPiece.col);
      if (demoMode) {
        local.demoSelected = selected;
        local.demoLegalMoves = legalMoves;
      } else {
        local.pvpSelected = selected;
        local.pvpLegalMoves = legalMoves;
      }
    }
    const boardToDisplay = (row, col) =>
      seat === "playerTwo" ? { row: CHECKERS_SIZE - 1 - row, col: CHECKERS_SIZE - 1 - col } : { row, col };
    const displayToBoard = (row, col) =>
      seat === "playerTwo" ? { row: CHECKERS_SIZE - 1 - row, col: CHECKERS_SIZE - 1 - col } : { row, col };
    const targetKeys = new Set(
      legalMoves.map((move) => {
        const display = boardToDisplay(move.to.row, move.to.col);
        return `${display.row}-${display.col}`;
      })
    );
    refs.checkersBoard.dataset.orientation = seat === "playerTwo" ? "flipped" : "normal";
    refs.checkersBoard.dataset.seat = seat;
    refs.checkersBoard.dataset.mode = demoMode ? "demo" : "pvp";
    try {
      const cellsMarkup = Array.from({ length: CHECKERS_SIZE * CHECKERS_SIZE }, (_, index) => {
          const displayRow = Math.floor(index / CHECKERS_SIZE);
          const displayCol = index % CHECKERS_SIZE;
          const { row: rowIndex, col: colIndex } = displayToBoard(displayRow, displayCol);
          const piece = board[rowIndex]?.[colIndex] || "";
          const dark = (rowIndex + colIndex) % 2 === 1;
          const owner = getCheckersOwner(piece);
          const own = owner && owner === seat;
          const lastMove = match.lastMove || {};
          const forcedPiece = match.forcedPiece || null;
          const className = [
            "ppg-dom-cell",
            dark ? "is-dark" : "is-light",
            own ? "is-own" : "",
            owner && !own ? "is-rival" : "",
            selected?.row === rowIndex && selected?.col === colIndex ? "is-selected" : "",
            targetKeys.has(`${displayRow}-${displayCol}`) ? "is-target" : "",
            forcedPiece?.row === rowIndex && forcedPiece?.col === colIndex ? "is-forced" : "",
            lastMove?.from?.row === rowIndex && lastMove?.from?.col === colIndex ? "is-last-from" : "",
            lastMove?.to?.row === rowIndex && lastMove?.to?.col === colIndex ? "is-last-to" : "",
            lastMove?.capture?.row === rowIndex && lastMove?.capture?.col === colIndex ? "is-last-capture" : ""
          ].filter(Boolean).join(" ");
          const disabled = match.status !== "active" || match.turn !== seat ? " disabled" : "";
          const checker = piece
            ? `<span class="ppg-dom-piece is-${own ? "player" : "ai"}${isCheckersKing(piece) ? " is-king" : ""}" ${own ? "draggable=\"true\"" : ""}>${isCheckersKing(piece) ? `<span class="ppg-dom-crown" aria-hidden="true"></span>` : ""}</span>`
            : "";
          const aria = `linha ${rowIndex + 1}, coluna ${colIndex + 1}${piece ? own ? ", sua peça" : ", peça rival" : ""}`;
          return `<button type="button" class="${className}" data-row="${rowIndex}" data-col="${colIndex}" data-display-row="${displayRow}" data-display-col="${displayCol}" aria-label="${aria}"${disabled}>${checker}</button>`;
      }).join("");
      refs.checkersBoard.innerHTML = cellsMarkup;
      const soundKey = match.lastMove?.at ? `${match.id}:${match.lastMove.index || ""}:${match.lastMove.at}` : "";
      if (soundKey && soundKey !== local.lastCheckersSoundKey) {
        local.lastCheckersSoundKey = soundKey;
        playCheckersMoveSound(match.lastMove?.capture ? "capture" : "move");
      }
      const ownPieces = countCheckersPieces(board, seat);
      const rivalPieces = board.flat().filter((piece) => getCheckersOwner(piece) && getCheckersOwner(piece) !== seat).length;
      refs.checkersBoard.dataset.scoreLeader = ownPieces === rivalPieces ? "tied" : ownPieces > rivalPieces ? "self" : "rival";
      const rivalSeat = seat === "playerOne" ? "playerTwo" : "playerOne";
      const availableMoves = getCheckersLegalMoves(board, seat, match.forcedPiece || null);
      const captureMoves = availableMoves.filter((move) => move.capture);
      const recentHistory = Array.isArray(match.checkersHistory) ? match.checkersHistory.slice(-5).reverse() : [];
      const coin = match.coinFlip || {};
      const firstSeat = coin.firstSeat || "";
      const firstName = firstSeat ? displayNameFor(match[firstSeat]) : "";
      const coinLine = demoMode ? " Treino contra máquina: não usa saldo." : coin.face && firstName ? ` Moeda ${coin.face}: ${firstName} começa.` : "";
      const isAbandoned = match.status === "abandoned";
      const abandonedBySelf = isAbandoned && match.abandonedBy === seat;
      const abandonSeconds = secondsUntil(match.deadlineAt);
      if (refs.checkersKicker) refs.checkersKicker.textContent = demoMode ? "treino local" : "ranked pvp";
      refs.checkersTitle.textContent =
        match.status === "finished"
          ? "Mesa encerrada"
          : demoMode && match.turn === "playerTwo"
            ? "Máquina pensando"
            : demoMode
              ? match.forcedPiece ? "Continue a captura" : "Treino livre"
          : isAbandoned
            ? abandonedBySelf ? "Reconectando mesa" : "Rival desconectou"
            : match.turn === seat
              ? match.forcedPiece ? "Continue a captura" : "Sua vez"
              : "Vez do rival";
      refs.checkersScore.innerHTML = `
        <span class="ppg-checkers-score-token is-self">${ownPieces}</span>
        <i>x</i>
        <span class="ppg-checkers-score-token is-rival">${rivalPieces}</span>
      `;
      refs.checkersStatus.textContent =
        match.status === "finished"
          ? match.resultSummary || "Partida encerrada."
          : demoMode && match.turn === "playerTwo"
            ? "A máquina vai responder automaticamente."
            : demoMode
              ? match.forcedPiece
                ? `Captura em cadeia: continue com a peça destacada.${coinLine}`
                : `Sua vez no treino. Escolha uma peça.${coinLine}`
          : isAbandoned
            ? abandonedBySelf
              ? "Voce voltou a tempo. Reabrindo a mesa..."
              : `Rival caiu. Vitoria por W.O. em ${abandonSeconds}s se ele nao voltar.`
          : match.turn === seat
            ? match.forcedPiece
              ? `Captura em cadeia: continue com a peça destacada.${coinLine}`
              : `Sua vez. Escolha uma peça.${coinLine}`
            : `Aguardando jogada do rival.${coinLine}`;
      if (refs.forfeitCheckers) {
        refs.forfeitCheckers.disabled = demoMode ? false : match.status !== "active" && match.status !== "abandoned";
        refs.forfeitCheckers.textContent = demoMode ? "Reiniciar demo" : match.status === "finished" ? "Mesa encerrada" : "Desistir";
      }
      setCheckersPlayerCard({
        root: refs.checkersSelf,
        initial: refs.checkersSelfInitial,
        name: refs.checkersSelfName,
        meta: refs.checkersSelfMeta,
        pieces: refs.checkersSelfPieces
      }, match[seat] || currentPvpPlayer() || {}, {
        pieces: ownPieces,
        active: match.status === "active" && match.turn === seat,
        connected: Boolean(match.presence?.[seat]?.connected ?? true),
        label: demoMode ? "treino" : "sua mesa"
      });
      setCheckersPlayerCard({
        root: refs.checkersRival,
        initial: refs.checkersRivalInitial,
        name: refs.checkersRivalName,
        meta: refs.checkersRivalMeta,
        pieces: refs.checkersRivalPieces
      }, match[rivalSeat] || rivalPvpPlayer() || {}, {
        pieces: rivalPieces,
        active: match.status === "active" && match.turn === rivalSeat,
        connected: Boolean(match.presence?.[rivalSeat]?.connected ?? true),
        label: demoMode ? "máquina local" : "online"
      });
      if (refs.checkersTimer) {
        const turnLeft = Math.max(0, 45 - secondsSince(match.updatedAt || match.startedAt || match.createdAt));
        refs.checkersTimer.textContent = demoMode ? "demo" : match.status === "abandoned" ? `${abandonSeconds}s` : match.status === "active" ? `${turnLeft}s` : "--";
      }
      if (refs.checkersMoves) refs.checkersMoves.textContent = String(match.moveCount || 0);
      if (refs.checkersHints) {
        const hintItems = [];
        if (match.status === "active" && match.turn === seat && captureMoves.length) hintItems.push(`<b>${captureMoves.length}</b><span>captura obrigatoria</span>`);
        if (match.forcedPiece) hintItems.push(`<b>combo</b><span>continue com ${formatCheckersSquare(match.forcedPiece)}</span>`);
        if (match.lastMove?.to) hintItems.push(`<b>ultimo</b><span>${formatCheckersMove(match.lastMove)}</span>`);
        if (!hintItems.length) hintItems.push(`<b>${availableMoves.length}</b><span>movimentos disponiveis</span>`);
        refs.checkersHints.innerHTML = hintItems.map((item) => `<article>${item}</article>`).join("");
      }
      if (refs.checkersHistory) {
        refs.checkersHistory.innerHTML = recentHistory.length
          ? recentHistory.map((entry) => `
              <article>
                <span>${entry.index || ""}</span>
                <strong>${formatCheckersMove(entry)}</strong>
                <small>${entry.capture ? "captura" : entry.crowned ? "dama" : entry.playerName || "lance"}</small>
              </article>
            `).join("")
          : `<article><span>0</span><strong>abertura</strong><small>sem lances ainda</small></article>`;
      }
      updateGameState({
        activeGameId: "checkers",
        lobbyPhase: match.status === "finished" ? "finished" : "playing",
        checkersGame: {
          phase: match.status,
          turn: match.turn,
          playerPieces: ownPieces,
          aiPieces: rivalPieces,
          rivalPieces,
          coinFlip: match.coinFlip || null,
          selected,
          legalMoves: legalMoves.map((move) => ({ to: move.to, capture: Boolean(move.capture) })),
          forcedPiece: match.forcedPiece || null,
          lastMove: match.lastMove || null,
          moveCount: match.moveCount || 0,
          realPvp: !demoMode,
          demo: demoMode
        },
        objective: demoMode ? "Treinar Damas" : "Vencer a Dama real",
        focus: demoMode ? "tabuleiro demo de dama" : "tabuleiro PvP de dama",
        prompt: refs.checkersStatus.textContent
      });
      if (match.status === "finished") {
        window.clearInterval(local.pvpPollTimer);
        local.pvpPollTimer = null;
        const won = match.winner && match.winner === seat;
        const result = match.winner ? (won ? "win" : "loss") : "draw";
        const settlement = match.settlement || {};
        const stake = Number(settlement.stake || match.stake || 0);
        const payout = Number(settlement.payout || 0);
        const fee = Number(settlement.houseFee || 0);
        const delta = match.winner ? (won ? payout - stake : -stake) : 0;
        const body = demoMode
          ? `${match.resultSummary || "Treino encerrado."} Nada foi apostado e a carteira nao foi alterada.`
          : match.winner
          ? `${match.resultSummary || "Partida encerrada."} ${won ? `Você recebeu ${payout} créditos reais.` : "Você perdeu a mesa."} Casa: ${fee}.`
          : `${match.resultSummary || "Empate."} Entrada devolvida.`;
        const resultKey = `${match.id}:${match.updatedAt || match.finishedAt || ""}`;
        if (local.resultHandledMatchId !== resultKey) {
          local.resultHandledMatchId = resultKey;
          showResult("checkers", result, body, { delta });
        }
      }
    } finally {
      local.pvpRenderBusy = false;
    }
  };

  const cardLabel = (card = {}) => {
    if (!card) return "";
    const suit = card.suit || "";
    const rank = card.rank || "";
    const suitIcon = {
      hearts: "♥",
      diamonds: "♦",
      clubs: "♣",
      spades: "♠",
      ouros: "♦",
      espadas: "♠",
      copas: "♥",
      paus: "♣"
    }[suit] || suit;
    return `${rank}${suitIcon}`;
  };

  const chessBoardFromFen = (fen = "") => {
    const board = new Map();
    const rows = String(fen || "").split(" ")[0]?.split("/") || [];
    rows.forEach((rowValue, rowIndex) => {
      let fileIndex = 0;
      [...rowValue].forEach((token) => {
        const empty = Number(token);
        if (Number.isFinite(empty) && empty > 0) {
          fileIndex += empty;
          return;
        }
        const square = `${"abcdefgh"[fileIndex]}${8 - rowIndex}`;
        board.set(square, token);
        fileIndex += 1;
      });
    });
    return board;
  };

  const renderChessBoardMarkup = (match, seat) => {
    const state = match.chessState || {};
    const board = chessBoardFromFen(state.fen || "");
    const ownColor = state.whiteSeat === seat ? "white" : "black";
    return Array.from({ length: 64 }, (_, index) => {
      const displayRow = Math.floor(index / 8);
      const displayCol = index % 8;
      const file = ownColor === "black" ? "abcdefgh"[7 - displayCol] : "abcdefgh"[displayCol];
      const rank = ownColor === "black" ? displayRow + 1 : 8 - displayRow;
      const square = `${file}${rank}`;
      const piece = board.get(square) || "";
      const pieceColor = piece ? piece === piece.toUpperCase() ? "white" : "black" : "";
      const ownPiece = pieceColor && pieceColor === ownColor;
      const dark = (displayRow + displayCol) % 2 === 1;
      const selected = local.chessSelected === square;
      return `<button type="button" class="ppg-dom-chess-cell ${dark ? "is-dark" : "is-light"}${selected ? " is-selected" : ""}${ownPiece ? " is-own" : ""}" data-chess-square="${square}" aria-label="${square}">${piece ? `<span>${CHESS_PIECES[piece] || piece}</span>` : ""}</button>`;
    }).join("");
  };

  const clampUiNumber = (value, min, max, fallback = min) => {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return fallback;
    return Math.max(min, Math.min(max, numeric));
  };

  const safeBallColor = (value = "") =>
    /^#[0-9a-f]{3,8}$/i.test(String(value || "")) ? String(value) : "#fff6dc";

  const renderPoolTableMarkup = (match, seat) => {
    const state = match.poolState || {};
    const balls = Array.isArray(state.balls) ? state.balls : [];
    const disabled = match.status !== "active" || match.turn !== seat ? "disabled" : "";
    const aimDisabled = disabled || local.poolControlStage !== "aim" ? "disabled" : "";
    const shotLabel =
      local.poolControlStage === "power"
        ? "Tacar"
        : local.poolControlStage === "locked"
          ? "Iniciar força"
          : "Travar mira";
    const cue = balls.find((ball) => ball.cue || Number(ball.id) === 0) || { x: 25, y: 25 };
    const pockets = [
      ["p1", 0, 0], ["p2", 50, 0], ["p3", 100, 0],
      ["p4", 0, 100], ["p5", 50, 100], ["p6", 100, 100]
    ].map(([className, x, y]) => `<span class="ppg-pool-pocket ${className}" style="left:${x}%;top:${y}%"></span>`).join("");
    const ballMarkup = balls
      .filter((ball) => !ball.pocketed)
      .map((ball) => {
        const x = clampUiNumber(ball.x, 0, 100, 50);
        const y = clampUiNumber(Number(ball.y) * 2, 0, 100, 50);
        const id = Number(ball.id) || 0;
        const label = ball.cue || id === 0 ? "" : id;
        return `<span class="ppg-pool-ball${ball.cue || id === 0 ? " is-cue" : ""}" style="left:${x}%;top:${y}%;background:${safeBallColor(ball.color)}">${label}</span>`;
      }).join("");
    const aimX = clampUiNumber(cue.x, 0, 100, 25);
    const aimY = clampUiNumber(Number(cue.y) * 2, 0, 100, 50);
    const last = state.lastShot || {};
    return `
      <div class="ppg-dom-pvp-pool">
        <div class="ppg-dom-pvp-pool-table" style="--pool-aim:${local.poolAim}deg;--cue-x:${aimX}%;--cue-y:${aimY}%">
          ${pockets}
          <span class="ppg-pool-cue" aria-hidden="true"></span>
          <span class="ppg-pool-aim-line"></span>
          ${ballMarkup}
        </div>
        <div class="ppg-pool-controls">
          <label><span>Mira ${local.poolAim}°</span><input type="range" min="-180" max="180" step="5" value="${local.poolAim}" data-pool-aim ${aimDisabled}></label>
          <label><span>Força ${Math.round(local.poolPower * 100)}%</span><input type="range" min="10" max="100" step="5" value="${Math.round(local.poolPower * 100)}" data-pool-power disabled></label>
          <button type="button" class="primary" data-pool-shoot ${disabled}>${shotLabel}</button>
        </div>
        <p class="ppg-table-note">${last.at ? `Ultima tacada: ${last.pocketed?.length || 0} bola(s), ${last.remaining ?? 0} restantes.` : "Tacada calculada no servidor, com turno e placar compartilhados."}</p>
      </div>
    `;
  };

  const renderDemoPool = (state = gameState.poolGame || {}) => {
    if (!refs.pool || !state) return;
    refs.pool.dataset.mode = "demo";
    if (refs.poolKicker) refs.poolKicker.textContent = "treino livre";
    if (refs.poolTitle) refs.poolTitle.textContent = state.phase === "finished" ? "Mesa encerrada" : "Sinuca demo";
    if (refs.poolStatus) refs.poolStatus.textContent = gameState.prompt || "Trave mira e força para tacar.";
    if (refs.poolScore) refs.poolScore.textContent = `${state.playerScore || 0} x ${state.aiScore || 0}`;
    if (refs.poolRound) refs.poolRound.textContent = `tacada ${Math.min(state.round || 1, state.maxRounds || 12)}/${state.maxRounds || 12}`;
    if (refs.poolLast) refs.poolLast.textContent = state.phase === "finished" ? "Série encerrada." : "Mesa física ativa no salão.";
    if (refs.poolStage) refs.poolStage.innerHTML = "";
    local.poolRenderKey = "";
    setCheckersPlayerCard({
      root: refs.poolSelf,
      initial: refs.poolSelfInitial,
      name: refs.poolSelfName,
      meta: refs.poolSelfMeta,
      pieces: refs.poolSelfBalls
    }, currentPvpPlayer() || { name: "Você" }, {
      pieces: state.playerScore || 0,
      active: state.phase !== "finished",
      connected: true,
      label: "treino"
    });
    setCheckersPlayerCard({
      root: refs.poolRival,
      initial: refs.poolRivalInitial,
      name: refs.poolRivalName,
      meta: refs.poolRivalMeta,
      pieces: refs.poolRivalBalls
    }, { name: "Mesa" }, {
      pieces: state.aiScore || 0,
      active: false,
      connected: true,
      label: "bolas restantes"
    });
    if (refs.forfeitPool) {
      refs.forfeitPool.hidden = false;
      refs.forfeitPool.disabled = false;
      refs.forfeitPool.textContent = "Reiniciar demo";
    }
    if (refs.poolShot) {
      refs.poolShot.hidden = false;
      refs.poolShot.disabled = state.phase !== "aim";
      refs.poolShot.textContent =
        state.phase === "finished"
          ? "Mesa encerrada"
          : state.phase === "rolling"
            ? "Bolas rolando"
          : state.lockStage === "power"
            ? "Tacar"
            : state.lockStage === "locked"
              ? "Iniciar força"
            : "Travar mira";
    }
    if (refs.poolTouchShot) {
      refs.poolTouchShot.disabled = state.phase !== "aim";
      refs.poolTouchShot.textContent =
        state.phase === "finished"
          ? "Fim"
          : state.phase === "rolling"
            ? "..."
          : state.lockStage === "power"
            ? "Tacar"
            : state.lockStage === "locked"
              ? "Força"
              : "Mira";
    }
  };

  const renderPvpPool = () => {
    const match = gameState.pvpMatch;
    const seat = gameState.pvpSeat;
    if (!match || !seat || !refs.pool) return;
    if (match.status === "finished") {
      finishGenericMatchIfNeeded(match, "pool", seat);
      return;
    }
    if (match.status === "readying") {
      setPanel("matchmaking");
      renderMatchmakingState();
      return;
    }
    const rivalSeat = seat === "playerOne" ? "playerTwo" : "playerOne";
    const state = match.poolState || {};
    if (match.status !== "active" || match.turn !== seat) {
      if (local.poolControlStage !== "aim" || local.poolPowerTimer) resetPvpPoolControls();
    }
    const isAbandoned = match.status === "abandoned";
    const abandonedBySelf = isAbandoned && match.abandonedBy === seat;
    const abandonSeconds = secondsUntil(match.deadlineAt);
    const ownScore = Number(state[`${seat}Score`] || 0);
    const rivalScore = Number(state[`${rivalSeat}Score`] || 0);
    refs.pool.dataset.mode = "pvp";
    if (refs.poolKicker) refs.poolKicker.textContent = "ranked pvp";
    if (refs.poolTitle) {
      refs.poolTitle.textContent =
        match.status === "finished"
          ? "Mesa encerrada"
          : isAbandoned
            ? abandonedBySelf ? "Reconectando mesa" : "Rival desconectou"
            : match.turn === seat ? "Sua vez" : "Vez do rival";
    }
    if (refs.poolStatus) {
      refs.poolStatus.textContent =
        match.status === "finished"
          ? match.resultSummary || "Partida encerrada."
          : isAbandoned
            ? abandonedBySelf
              ? "Voce voltou a tempo. Reabrindo a mesa..."
              : `Rival caiu. Vitoria por W.O. em ${abandonSeconds}s se ele nao voltar.`
            : match.turn === seat
              ? `${displayNameFor(match[seat])}, escolha mira e força.`
              : "Aguardando tacada do rival.";
    }
    if (refs.poolScore) refs.poolScore.textContent = `${ownScore} x ${rivalScore}`;
    if (refs.poolRound) refs.poolRound.textContent = `${match.moveCount || 0} tacadas`;
    if (refs.poolLast) {
      refs.poolLast.textContent = state.lastShot?.at
        ? `${state.lastShot.pocketed?.length || 0} bola(s) na ultima tacada.`
        : "Triangulo montado.";
    }
    const ballsKey = Array.isArray(state.balls)
      ? state.balls.map((ball) => [ball.id, ball.x, ball.y, ball.pocketed ? 1 : 0].join(":")).join("|")
      : "";
    renderStablePoolStage(
      `pool:${match.id}:${seat}:${match.status}:${match.turn}:${match.moveCount}:${state.playerOneScore || 0}:${state.playerTwoScore || 0}:${ballsKey}:${local.poolAim}:${local.poolPower}:${local.poolControlStage}`,
      renderPoolTableMarkup(match, seat)
    );
    setCheckersPlayerCard({
      root: refs.poolSelf,
      initial: refs.poolSelfInitial,
      name: refs.poolSelfName,
      meta: refs.poolSelfMeta,
      pieces: refs.poolSelfBalls
    }, match[seat] || currentPvpPlayer() || {}, {
      pieces: ownScore,
      active: match.status === "active" && match.turn === seat,
      connected: Boolean(match.presence?.[seat]?.connected ?? true),
      label: "sua mesa"
    });
    setCheckersPlayerCard({
      root: refs.poolRival,
      initial: refs.poolRivalInitial,
      name: refs.poolRivalName,
      meta: refs.poolRivalMeta,
      pieces: refs.poolRivalBalls
    }, match[rivalSeat] || rivalPvpPlayer() || {}, {
      pieces: rivalScore,
      active: match.status === "active" && match.turn === rivalSeat,
      connected: Boolean(match.presence?.[rivalSeat]?.connected ?? true),
      label: "online"
    });
    if (refs.forfeitPool) {
      refs.forfeitPool.hidden = false;
      refs.forfeitPool.disabled = match.status !== "active" && match.status !== "abandoned";
      refs.forfeitPool.textContent = match.status === "finished" ? "Mesa encerrada" : "Desistir";
    }
    if (refs.poolShot) refs.poolShot.hidden = true;
    if (refs.poolTouchShot) {
      refs.poolTouchShot.disabled = match.status !== "active" || match.turn !== seat;
      refs.poolTouchShot.textContent =
        local.poolControlStage === "power"
          ? "Tacar"
          : local.poolControlStage === "locked"
            ? "Força"
            : "Mira";
    }
    updateGameState({
      activeGameId: "pool",
      lobbyPhase: match.status === "finished" ? "finished" : "playing",
      objective: "Vencer Sinuca real",
      focus: "mesa PvP de Sinuca",
      prompt: refs.poolStatus?.textContent || "Mesa de Sinuca"
    });
  };

  const renderStableTableBody = (key = "", markup = "") => {
    if (local.tableRenderKey === key) return;
    refs.tableBody.innerHTML = markup;
    local.tableRenderKey = key;
  };

  const renderStablePoolStage = (key = "", markup = "") => {
    if (!refs.poolStage || local.poolRenderKey === key) return;
    refs.poolStage.innerHTML = markup;
    local.poolRenderKey = key;
  };

  const handlePvpPoolShot = (match) => {
    if (!match?.id || match.status !== "active" || match.turn !== gameState.pvpSeat) return;
    if (local.poolControlStage === "aim") {
      local.poolControlStage = "locked";
      local.poolPower = 0.18;
      renderPvpPool();
      return;
    }
    if (local.poolControlStage === "locked") {
      local.poolControlStage = "power";
      local.poolPower = 0.18;
      local.poolPowerDirection = 1;
      startPvpPoolPowerMeter();
      renderPvpPool();
      return;
    }
    stopPvpPoolPowerMeter();
    shootPool(match.id, local.poolAim, local.poolPower).then((payload) => {
      if (payload?.ok) {
        resetPvpPoolControls();
        routePvpState(payload);
      }
    });
  };

  const finishGenericMatchIfNeeded = (match, gameId, seat) => {
    if (match?.status !== "finished") return;
    window.clearInterval(local.pvpPollTimer);
    local.pvpPollTimer = null;
    const won = match.winner && match.winner === seat;
    const result = match.winner ? (won ? "win" : "loss") : "draw";
    const settlement = match.settlement || {};
    const stake = Number(settlement.stake || match.stake || 0);
    const payout = Number(settlement.payout || 0);
    const fee = Number(settlement.houseFee || 0);
    const delta = match.winner ? (won ? payout - stake : -stake) : 0;
    const body = match.winner
      ? `${match.resultSummary || "Partida encerrada."} ${won ? `Você recebeu ${payout} créditos reais.` : "Você perdeu a mesa."} Casa: ${fee}.`
      : `${match.resultSummary || "Empate."} Entrada devolvida.`;
    const resultKey = `${match.id}:${match.updatedAt || match.finishedAt || ""}`;
    if (local.resultHandledMatchId !== resultKey) {
      local.resultHandledMatchId = resultKey;
      showResult(gameId, result, body, { delta });
    }
  };

  const renderPvpTable = () => {
    if (local.pvpTableRenderBusy) return;
    const match = gameState.pvpMatch;
    const seat = gameState.pvpSeat;
    const gameId = gameState.pvpGameId || local.selectedGame;
    if (!match || !seat || !refs.table) return;
    if (match.status === "finished") {
      finishGenericMatchIfNeeded(match, gameId, seat);
      return;
    }
    local.pvpTableRenderBusy = true;
    try {
    if (match.status === "readying") {
      setPanel("matchmaking");
      renderMatchmakingState();
      return;
    }
    const isAbandoned = match.status === "abandoned";
    const abandonedBySelf = isAbandoned && match.abandonedBy === seat;
    const abandonSeconds = secondsUntil(match.deadlineAt);
    const myName = displayNameFor(match[seat]);
    refs.tableKicker.textContent = "mesa PvP";
    refs.tableTitle.textContent =
      match.status === "finished"
        ? `${gameLabel(gameId)} encerrado`
        : isAbandoned
          ? abandonedBySelf ? "Reconectando mesa" : "Rival desconectou"
          : match.turn === seat ? "Sua vez" : "Vez do rival";
    refs.tableStatus.textContent =
      match.status === "finished"
        ? match.resultSummary || "Partida encerrada."
        : isAbandoned
          ? abandonedBySelf
            ? "Voce voltou a tempo. Reabrindo a mesa..."
            : `Rival caiu. Vitoria por W.O. em ${abandonSeconds}s se ele nao voltar.`
          : match.turn === seat ? `${myName}, jogue em ${gameLabel(gameId)}.` : "Aguardando jogada do rival.";
    refs.genericForfeit.disabled = match.status !== "active" && match.status !== "abandoned";

    if (gameId === "pool") {
      const state = match.poolState || {};
      const ballsKey = Array.isArray(state.balls)
        ? state.balls.map((ball) => [ball.id, ball.x, ball.y, ball.pocketed ? 1 : 0].join(":")).join("|")
        : "";
      refs.tableScore.textContent = `${state.playerOneScore || 0} x ${state.playerTwoScore || 0}`;
      renderStableTableBody(
        `${gameId}:${match.id}:${seat}:${match.status}:${match.turn}:${match.moveCount}:${state.playerOneScore || 0}:${state.playerTwoScore || 0}:${ballsKey}:${local.poolAim}:${local.poolPower}:${local.poolControlStage}`,
        renderPoolTableMarkup(match, seat)
      );
    } else if (gameId === "poker") {
      const state = match.pokerState || {};
      const cardsKey = seat === "playerOne" ? "playerOneCards" : "playerTwoCards";
      const usedKey = seat === "playerOne" ? "playerOneDrawUsed" : "playerTwoDrawUsed";
      const cards = Array.isArray(state[cardsKey]) ? state[cardsKey] : [];
      refs.tableScore.textContent = state[usedKey] ? "troca usada" : "troca aberta";
      renderStableTableBody(
        `${gameId}:${match.id}:${seat}:${match.status}:${match.turn}:${JSON.stringify(cards)}:${state[usedKey] ? 1 : 0}:${local.pvpHeld.join("")}`,
        `
        <div class="ppg-card-row">${cards.map((card, index) => `<button type="button" class="ppg-playing-card${local.pvpHeld[index] ? " is-held" : ""}" data-poker-card="${index}"><strong>${cardLabel(card)}</strong><small>${local.pvpHeld[index] ? "segura" : "troca"}</small></button>`).join("")}</div>
        <button type="button" class="primary" data-poker-draw ${match.status !== "active" || match.turn !== seat || state[usedKey] ? "disabled" : ""}>Trocar cartas soltas</button>
      `);
    } else if (gameId === "dicecups") {
      const state = match.diceState || {};
      refs.tableScore.textContent = `${state.playerOneScore || 0} x ${state.playerTwoScore || 0}`;
      renderStableTableBody(
        `${gameId}:${match.id}:${seat}:${match.status}:${match.turn}:${state.playerOneScore || 0}:${state.playerTwoScore || 0}:${JSON.stringify(state.dice || [])}`,
        `
        <div class="ppg-dice-cups"><span>${state.dice?.[0] || "?"}</span><span>${state.dice?.[1] || "?"}</span></div>
        <div class="ppg-number-grid">${Array.from({ length: 11 }, (_, index) => index + 2).map((value) => `<button type="button" data-dice-guess="${value}" ${match.status !== "active" || match.turn !== seat ? "disabled" : ""}>${value}</button>`).join("")}</div>
      `);
    } else if (gameId === "truco") {
      const state = match.trucoState || {};
      const cardsKey = seat === "playerOne" ? "playerOneCards" : "playerTwoCards";
      const cards = Array.isArray(state[cardsKey]) ? state[cardsKey] : [];
      refs.tableScore.textContent = `${state.playerOneScore || 0} x ${state.playerTwoScore || 0}`;
      renderStableTableBody(
        `${gameId}:${match.id}:${seat}:${match.status}:${match.turn}:${state.playerOneScore || 0}:${state.playerTwoScore || 0}:${state.round || 1}:${JSON.stringify(cards)}:${JSON.stringify(state.table || [])}`,
        `
        <div class="ppg-card-row">${cards.map((card, index) => card ? `<button type="button" class="ppg-playing-card" data-truco-card="${index}" ${match.status !== "active" || match.turn !== seat ? "disabled" : ""}><strong>${cardLabel(card)}</strong><small>jogar</small></button>` : `<span class="ppg-playing-card is-empty"><strong>-</strong><small>mesa</small></span>`).join("")}</div>
        <p class="ppg-table-note">Mao ${state.round || 1}/${state.maxRounds || 3}. ${state.table?.length ? "Carta na mesa aguardando resposta." : "Escolha uma carta quando for sua vez."}</p>
      `);
    } else if (gameId === "chess") {
      const state = match.chessState || {};
      refs.tableScore.textContent = `${match.moveCount || 0} lances`;
      renderStableTableBody(
        `${gameId}:${match.id}:${seat}:${match.status}:${match.turn}:${match.moveCount || 0}:${state.fen || ""}:${local.chessSelected}`,
        `<div class="ppg-dom-chess-board">${renderChessBoardMarkup(match, seat)}</div><p class="ppg-table-note">${state.history?.slice?.(-1)?.[0]?.san ? `Ultimo lance: ${state.history.slice(-1)[0].san}` : "Selecione uma peça e depois o destino."}</p>`
      );
    }

    updateGameState({
      activeGameId: gameId,
      lobbyPhase: match.status === "finished" ? "finished" : "playing",
      objective: `Vencer ${gameLabel(gameId)} real`,
      focus: `mesa PvP de ${gameLabel(gameId)}`,
      prompt: refs.tableStatus.textContent
    });
    } finally {
      local.pvpTableRenderBusy = false;
    }
  };

  const routePvpState = (payload = {}) => {
    if (payload.state === "waiting" || payload.state === "readying") {
      setPanel("matchmaking");
      setMatchmakingState(payload.state === "readying" ? "matched" : "waiting");
      renderMatchmakingState();
      return;
    }
    if (payload.state === "finished") {
      const gameId = payload.gameId || gameState.pvpGameId || local.selectedGame;
      const seat = payload.seat || gameState.pvpSeat;
      if (payload.match && seat) finishGenericMatchIfNeeded(payload.match, gameId, seat);
      return;
    }
    if (payload.state === "active" || payload.state === "abandoned") {
      const gameId = payload.gameId || gameState.pvpGameId || local.selectedGame;
      setPanel(gameId === "checkers" ? "checkers" : gameId === "pool" ? "pool" : "table");
      game.scene.stop("game-lobby-scene");
      game.scene.stop("pool-game-scene");
      if (gameId === "checkers") renderPvpCheckers();
      else if (gameId === "pool") renderPvpPool();
      else renderPvpTable();
      return;
    }
    if (payload.state === "idle") showLobby();
  };

  const startPvpPolling = (gameId = local.selectedGame || "checkers") => {
    window.clearInterval(local.pvpPollTimer);
    local.pvpPollTimer = window.setInterval(async () => {
      const payload = await fetchPvpState(gameId);
      if (payload?.ok) routePvpState(payload);
    }, 1200);
  };

  const startRealPvpGame = async (gameId = "checkers") => {
    local.selectedGame = gameId;
    if (gameId === "checkers") resetDemoCheckersState();
    if (gameId === "pool") resetDemoPoolState();
    local.pvpHeld = [true, true, true, true, true];
    local.chessSelected = "";
    resetPvpPoolControls();
    refs.matchmakingGame.textContent = gameLabel(gameId);
    refs.matchmakingStatus.textContent = "Procurando jogador real com aposta equivalente.";
    setMatchmakingState("searching");
    setPanel("matchmaking");
    updateGameState({
      activeGameId: gameId,
      selectedTable: gameId,
      lobbyPhase: "matching",
      objective: `Encontrar jogador real para ${gameLabel(gameId)}`,
      focus: "matchmaking real",
      prompt: "Buscando jogador real. Escrow travado no servidor."
    });
    const profile = window.pubpaidPlayerProfile?.() || {};
    const payload = await joinPubpaidPvpQueue(gameId, gameState.lobbyStake || 10, {
      name: profile.nick || profile.name || gameState.googleUser?.name || "",
      archetype: gameState.selectedCharacter?.id || "neon",
      favorite: gameId
    }, { fresh: true });
    if (!payload?.ok) {
      setMatchmakingState("error");
      refs.matchmakingStatus.textContent = payload?.error || "Nao foi possivel abrir a fila real.";
      updateGameState({ prompt: refs.matchmakingStatus.textContent });
      return;
    }
    routePvpState(payload);
    startPvpPolling(gameId);
  };

  const startRealCheckers = () => startRealPvpGame("checkers");

  const handleCheckersCell = (cell) => {
    const row = Number(cell.dataset.row);
    const col = Number(cell.dataset.col);
    if (isCheckersDemoActive()) {
      const match = local.demoCheckers;
      if (!match || match.status !== "active" || match.turn !== "playerOne") return true;
      const target = local.demoLegalMoves.find((move) => move.to.row === row && move.to.col === col);
      if (target) {
        applyDemoCheckersMove(target, "playerOne");
        local.demoSelected = null;
        local.demoLegalMoves = [];
        renderPvpCheckers();
        scheduleDemoAiMove();
        return true;
      }
      const piece = match.board?.[row]?.[col];
      if (getCheckersOwner(piece) !== "playerOne") {
        local.demoSelected = null;
        local.demoLegalMoves = [];
        renderPvpCheckers();
        return true;
      }
      local.demoSelected = { row, col };
      local.demoLegalMoves = getCheckersLegalMoves(match.board, "playerOne", match.forcedPiece || null)
        .filter((move) => move.from.row === row && move.from.col === col);
      renderPvpCheckers();
      return true;
    }
    if (gameState.pvpGameId === "checkers" && gameState.pvpMatch?.status) {
      const match = gameState.pvpMatch;
      const seat = gameState.pvpSeat;
      if (match.status !== "active" || match.turn !== seat) return true;
      const target = local.pvpLegalMoves.find((move) => move.to.row === row && move.to.col === col);
      if (target) {
        moveCheckers(match.id, target).then((payload) => {
          if (payload?.ok) {
            local.pvpSelected = null;
            local.pvpLegalMoves = [];
            renderPvpCheckers();
          }
        });
        return true;
      }
      const piece = match.board?.[row]?.[col];
      if (getCheckersOwner(piece) !== seat) {
        local.pvpSelected = null;
        local.pvpLegalMoves = [];
        renderPvpCheckers();
        return true;
      }
      local.pvpSelected = { row, col };
      local.pvpLegalMoves = getCheckersLegalMoves(match.board, seat, match.forcedPiece || null)
        .filter((move) => move.from.row === row && move.from.col === col);
      renderPvpCheckers();
      return true;
    }
    showAccessBlock("pvp-only");
    return true;
  };

  document.addEventListener("pointerup", (event) => {
    const cell = event.target.closest?.("[data-dom-checkers-board] [data-row]");
    if (!cell || event.pointerType === "mouse") return;
    event.preventDefault();
    local.lastCheckersTouchAt = Date.now();
    handleCheckersCell(cell);
  }, { passive: false });

  document.addEventListener("click", async (event) => {
    const demoButton = event.target.closest("[data-dom-start-demo]");
    if (demoButton) {
      const demoGame = demoButton.dataset.domStartDemo || "checkers";
      if (demoGame === "checkers") {
        startDemoCheckers();
      } else if (demoGame === "pool") {
        startDemoPool();
      } else {
        showAccessBlock("unavailable");
      }
      return;
    }

    const startButton = event.target.closest("[data-dom-start-game]");
    if (startButton) {
      const nextGame = startButton.dataset.domStartGame || "pool";
      local.selectedGame = nextGame;
      if (PVP_GAMES.has(nextGame) && isRealPvpEligible(nextGame)) {
        startRealPvpGame(nextGame);
      } else if (PVP_GAMES.has(nextGame)) {
        if (!isLoggedIn()) {
          showAccessBlock("pvp-only");
          return;
        }
        startButton.disabled = true;
        if (refs.lobbyState) refs.lobbyState.textContent = "atualizando saldo";
        updateGameState({ prompt: `Atualizando saldo aprovado antes de abrir ${gameLabel(nextGame)}.` });
        await syncPubpaidAccount();
        startButton.disabled = false;
        if (isRealPvpEligible(nextGame)) {
          startRealPvpGame(nextGame);
        } else {
          showAccessBlock("pvp-only");
        }
      } else {
        showAccessBlock("unavailable");
      }
      return;
    }
    if (event.target.closest("[data-dom-open-lobby]")) {
      window.clearInterval(local.pvpPollTimer);
      window.clearTimeout(local.resultReturnTimer);
      if (gameState.pvpStatus === "waiting" || gameState.pvpStatus === "readying") leavePubpaidPvpQueue(gameState.pvpGameId || local.selectedGame || "checkers");
      game.scene.stop("pool-game-scene");
      game.scene.stop("checkers-game-scene");
      game.scene.start("game-lobby-scene", { gameId: local.selectedGame });
      showLobby();
      return;
    }
    if (event.target.closest("[data-dom-return-salon]")) {
      window.clearInterval(local.pvpPollTimer);
      window.clearTimeout(local.resultReturnTimer);
      if (gameState.pvpStatus === "waiting" || gameState.pvpStatus === "readying") leavePubpaidPvpQueue(gameState.pvpGameId || local.selectedGame || "checkers");
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
    if (event.target.closest("[data-dom-pool-touch-shot]")) {
      if (isPoolDemoActive()) {
        game.events.emit("pubpaid:pool-dom-shot");
        return;
      }
      const match = gameState.pvpMatch;
      if (gameState.pvpGameId === "pool" && match?.id) handlePvpPoolShot(match);
      return;
    }
    const poolAimStep = event.target.closest("[data-dom-pool-aim-step]");
    if (poolAimStep) {
      const step = Number(poolAimStep.dataset.domPoolAimStep || 0);
      if (isPoolDemoActive()) {
        game.events.emit("pubpaid:pool-dom-aim-step", step);
      } else if (gameState.pvpGameId === "pool" && local.poolControlStage === "aim") {
        local.poolAim = clampUiNumber(local.poolAim + step, -180, 180, 0);
        renderPvpPool();
      }
      return;
    }
    if (event.target.closest("[data-dom-pvp-ready]")) {
      const matchId = gameState.pvpMatch?.id || "";
      if (!matchId) return;
      refs.pvpReady.disabled = true;
      refs.pvpReady.textContent = "Confirmando...";
      confirmPvpReady(matchId, gameState.pvpGameId || local.selectedGame || "checkers").then((payload) => {
        if (payload?.ok) routePvpState(payload);
        else {
          refs.matchmakingStatus.textContent = payload?.error || "Nao foi possivel confirmar agora.";
          refs.pvpReady.disabled = false;
          refs.pvpReady.textContent = "Estou pronto";
        }
      });
      return;
    }
    if (event.target.closest("[data-dom-forfeit-checkers]")) {
      const button = event.target.closest("[data-dom-forfeit-checkers]");
      if (isCheckersDemoActive()) {
        startDemoCheckers();
        return;
      }
      button.disabled = true;
      button.textContent = "Desistindo...";
      leavePubpaidPvpQueue("checkers", { reason: "forfeit", forfeit: true }).then((payload) => {
        if (payload?.ok) routePvpState(payload);
        else {
          button.disabled = false;
          button.textContent = "Desistir";
          updateGameState({ prompt: payload?.error || "Nao foi possivel desistir agora." });
        }
      });
      return;
    }
    if (event.target.closest("[data-dom-forfeit-pool]")) {
      const button = event.target.closest("[data-dom-forfeit-pool]");
      if (isPoolDemoActive()) {
        game.scene.stop("pool-game-scene");
        game.scene.start("pool-game-scene", { stake: 0, mode: "demo" });
        return;
      }
      button.disabled = true;
      button.textContent = "Desistindo...";
      leavePubpaidPvpQueue("pool", { reason: "forfeit", forfeit: true }).then((payload) => {
        if (payload?.ok) routePvpState(payload);
        else {
          button.disabled = false;
          button.textContent = "Desistir";
          updateGameState({ prompt: payload?.error || "Nao foi possivel desistir agora." });
        }
      });
      return;
    }
    if (event.target.closest("[data-dom-generic-forfeit]")) {
      const gameId = gameState.pvpGameId || local.selectedGame || "checkers";
      const button = event.target.closest("[data-dom-generic-forfeit]");
      button.disabled = true;
      button.textContent = "Desistindo...";
      leavePubpaidPvpQueue(gameId, { reason: "forfeit", forfeit: true }).then((payload) => {
        if (payload?.ok) routePvpState(payload);
        else {
          button.disabled = false;
          button.textContent = "Desistir";
          updateGameState({ prompt: payload?.error || "Nao foi possivel desistir agora." });
        }
      });
      return;
    }
    if (event.target.closest("[data-pool-shoot]")) {
      const match = gameState.pvpMatch;
      if (match?.id) handlePvpPoolShot(match);
      return;
    }
    const pokerCard = event.target.closest("[data-poker-card]");
    if (pokerCard) {
      const index = Number(pokerCard.dataset.pokerCard);
      local.pvpHeld[index] = !local.pvpHeld[index];
      renderPvpTable();
      return;
    }
    if (event.target.closest("[data-poker-draw]")) {
      const matchId = gameState.pvpMatch?.id || "";
      if (matchId) drawPoker(matchId, local.pvpHeld).then((payload) => payload?.ok && routePvpState(payload));
      return;
    }
    const diceButton = event.target.closest("[data-dice-guess]");
    if (diceButton) {
      const matchId = gameState.pvpMatch?.id || "";
      if (matchId) guessDicecups(matchId, Number(diceButton.dataset.diceGuess)).then((payload) => payload?.ok && routePvpState(payload));
      return;
    }
    const trucoButton = event.target.closest("[data-truco-card]");
    if (trucoButton) {
      const matchId = gameState.pvpMatch?.id || "";
      if (matchId) playTrucoCard(matchId, Number(trucoButton.dataset.trucoCard)).then((payload) => payload?.ok && routePvpState(payload));
      return;
    }
    const chessSquare = event.target.closest("[data-chess-square]");
    if (chessSquare) {
      const square = chessSquare.dataset.chessSquare || "";
      const match = gameState.pvpMatch;
      if (!match || match.status !== "active" || match.turn !== gameState.pvpSeat) return;
      if (!local.chessSelected) {
        local.chessSelected = square;
        renderPvpTable();
        return;
      }
      const from = local.chessSelected;
      local.chessSelected = "";
      if (from === square) {
        renderPvpTable();
        return;
      }
      moveChess(match.id, from, square, "q").then((payload) => payload?.ok ? routePvpState(payload) : renderPvpTable());
      return;
    }
    const resetButton = event.target.closest("[data-dom-game-reset]");
    if (resetButton) {
      resetButton.dataset.domGameReset === "checkers" ? showAccessBlock("pvp-only") : showAccessBlock("unavailable");
      return;
    }
    if (event.target.closest("[data-dom-result-again]")) {
      PVP_GAMES.has(local.selectedGame) && isRealPvpEligible(local.selectedGame) ? startRealPvpGame(local.selectedGame) : showAccessBlock("pvp-only");
      return;
    }
    const cell = event.target.closest("[data-dom-checkers-board] [data-row]");
    if (cell) {
      if (Date.now() - local.lastCheckersTouchAt < 360) return;
      handleCheckersCell(cell);
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.code !== "Space" || event.repeat) return;
    if (isPoolDemoActive()) {
      event.preventDefault();
      game.events.emit("pubpaid:pool-dom-shot");
      return;
    }
    if (gameState.pvpGameId === "pool" && gameState.pvpMatch?.status === "active") {
      event.preventDefault();
      handlePvpPoolShot(gameState.pvpMatch);
    }
  });

  document.addEventListener("dragstart", (event) => {
    const cell = event.target.closest?.("[data-dom-checkers-board] [data-row]");
    if (!cell || (!isCheckersDemoActive() && gameState.pvpGameId !== "checkers")) return;
    const demoMode = isCheckersDemoActive();
    const match = demoMode ? local.demoCheckers : gameState.pvpMatch;
    const seat = demoMode ? "playerOne" : gameState.pvpSeat;
    const row = Number(cell.dataset.row);
    const col = Number(cell.dataset.col);
    const piece = match?.board?.[row]?.[col];
    if (!match || match.status !== "active" || match.turn !== seat || getCheckersOwner(piece) !== seat) {
      event.preventDefault();
      return;
    }
    local.pvpDragFrom = { row, col };
    if (demoMode) local.demoSelected = { row, col };
    else local.pvpSelected = { row, col };
    const moves = getCheckersLegalMoves(match.board, seat, match.forcedPiece || null)
      .filter((move) => move.from.row === row && move.from.col === col);
    if (demoMode) local.demoLegalMoves = moves;
    else local.pvpLegalMoves = moves;
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", `${row}-${col}`);
    renderPvpCheckers();
  });

  document.addEventListener("dragover", (event) => {
    if (event.target.closest?.("[data-dom-checkers-board] [data-row]")) event.preventDefault();
  });

  document.addEventListener("drop", (event) => {
    const cell = event.target.closest?.("[data-dom-checkers-board] [data-row]");
    if (!cell || (!isCheckersDemoActive() && gameState.pvpGameId !== "checkers")) return;
    event.preventDefault();
    const demoMode = isCheckersDemoActive();
    const match = demoMode ? local.demoCheckers : gameState.pvpMatch;
    const row = Number(cell.dataset.row);
    const col = Number(cell.dataset.col);
    const legalMoves = demoMode ? local.demoLegalMoves : local.pvpLegalMoves;
    const target = legalMoves.find((move) => move.to.row === row && move.to.col === col);
    if (demoMode && target) {
      applyDemoCheckersMove(target, "playerOne");
      local.pvpDragFrom = null;
      local.demoSelected = null;
      local.demoLegalMoves = [];
      renderPvpCheckers();
      scheduleDemoAiMove();
      return;
    }
    if (match?.id && target) {
      moveCheckers(match.id, target).then((payload) => {
        if (payload?.ok) {
          local.pvpDragFrom = null;
          local.pvpSelected = null;
          local.pvpLegalMoves = [];
          renderPvpCheckers();
        }
      });
      return;
    }
    local.pvpDragFrom = null;
    if (demoMode) {
      local.demoSelected = null;
      local.demoLegalMoves = [];
    }
    renderPvpCheckers();
  });

  document.addEventListener("input", (event) => {
    const aimInput = event.target.closest?.("[data-pool-aim]");
    if (aimInput) {
      if (local.poolControlStage !== "aim") return;
      local.poolAim = clampUiNumber(aimInput.value, -180, 180, 0);
      gameState.pvpGameId === "pool" ? renderPvpPool() : renderPvpTable();
      return;
    }
    const powerInput = event.target.closest?.("[data-pool-power]");
    if (powerInput) {
      local.poolPower = clampUiNumber(Number(powerInput.value) / 100, 0.1, 1, 0.56);
      gameState.pvpGameId === "pool" ? renderPvpPool() : renderPvpTable();
    }
  });

  const updatePoolAimFromPointer = (event) => {
    const table = event.target.closest?.(".ppg-dom-pvp-pool-table");
    if (!table || gameState.pvpGameId !== "pool") return false;
    const match = gameState.pvpMatch;
    if (!match || match.status !== "active" || match.turn !== gameState.pvpSeat || local.poolControlStage !== "aim") return false;
    const rect = table.getBoundingClientRect();
    const cue = Array.isArray(match.poolState?.balls)
      ? match.poolState.balls.find((ball) => ball.cue || Number(ball.id) === 0)
      : null;
    if (!cue || !rect.width || !rect.height) return false;
    const cueX = rect.left + (clampUiNumber(cue.x, 0, 100, 25) / 100) * rect.width;
    const cueY = rect.top + (clampUiNumber(Number(cue.y) * 2, 0, 100, 50) / 100) * rect.height;
    const dx = Number(event.clientX) - cueX;
    const dy = Number(event.clientY) - cueY;
    if (Math.hypot(dx, dy) < 8) return false;
    local.poolAim = Math.round((Math.atan2(dy, dx) * 180) / Math.PI);
    renderPvpPool();
    return true;
  };

  document.addEventListener("pointerdown", (event) => {
    updatePoolAimFromPointer(event);
  });

  document.addEventListener("pointermove", (event) => {
    if (!(event.buttons & 1)) return;
    updatePoolAimFromPointer(event);
  });

  window.addEventListener("pagehide", () => {
    if (!PVP_GAMES.has(gameState.pvpGameId) || gameState.pvpMatch?.status !== "active") return;
    const body = JSON.stringify({ gameId: gameState.pvpGameId, reason: "disconnect" });
    if (navigator.sendBeacon) {
      navigator.sendBeacon("./api/pubpaid/pvp/leave", new Blob([body], { type: "application/json" }));
      return;
    }
    fetch("./api/pubpaid/pvp/leave", {
      method: "POST",
      credentials: "same-origin",
      keepalive: true,
      headers: { "Content-Type": "application/json" },
      body
    }).catch(() => {});
  });

  refs.cancelAccessBlock?.addEventListener("click", () => {
    showLobby();
  });

  game.events.on("pubpaid:open-dom-lobby", showLobby);
  game.events.on("pubpaid:block-paid-game", showAccessBlock);
  game.events.on("pubpaid:start-real-checkers", startRealCheckers);
  game.events.on("pubpaid:pool-result", ({ result, body } = {}) => {
    if (isPoolDemoActive()) return;
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
      PVP_GAMES.has(state.activeGameId) ||
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
    if (PVP_GAMES.has(state.pvpGameId) && state.pvpMatch?.status === "finished" && state.pvpSeat) {
      finishGenericMatchIfNeeded(state.pvpMatch, state.pvpGameId, state.pvpSeat);
      if (!refs.result.hidden) return;
    }
    if (state.lobbyPhase === "selecting" && !refs.lobby.hidden) return;
    if (state.lobbyPhase === "blocked" && !refs.accessBlock.hidden) return;
    if (state.lobbyPhase === "blocked") {
      setPanel("access-block");
      return;
    }
    if (state.lobbyPhase === "matching" && !refs.matchmaking.hidden) return;
    if (state.currentScene === "game-lobby" || state.lobbyPhase === "selecting") {
      if (refs.pool.hidden && refs.checkers.hidden && refs.table?.hidden !== false && refs.result.hidden && refs.matchmaking.hidden) setPanel("lobby");
    }
    if (state.activeGameId === "pool" && state.poolGame && isPoolDemoActive()) {
      if (refs.pool.hidden) setPanel("pool");
      renderDemoPool(state.poolGame);
    }
    if (state.lobbyPhase === "finished" && !refs.result.hidden) return;
    if (PVP_GAMES.has(state.pvpGameId) && (state.pvpMatch || state.pvpQueue)) {
      if (state.pvpMatch?.status === "readying" || state.pvpStatus === "waiting") {
        if (refs.matchmaking.hidden) setPanel("matchmaking");
        renderMatchmakingState();
        return;
      }
      if (state.pvpMatch && ["active", "abandoned", "finished"].includes(state.pvpMatch.status)) {
        if (state.pvpGameId === "checkers") {
          if (refs.checkers.hidden) setPanel("checkers");
          renderPvpCheckers();
        } else if (state.pvpGameId === "pool") {
          if (refs.pool.hidden) setPanel("pool");
          renderPvpPool();
        } else {
          if (refs.table?.hidden) setPanel("table");
          renderPvpTable();
        }
      }
    }
  });
}
