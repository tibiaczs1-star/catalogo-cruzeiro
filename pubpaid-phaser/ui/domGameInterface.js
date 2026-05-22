import { gameState, subscribeGameState, updateGameState } from "../core/gameState.js";
import { joinPubpaidPvpQueue, leavePubpaidPvpQueue, syncPubpaidAccount } from "../services/accountService.js?v=20260522-gameux2";
import {
  choosePoolSetup,
  confirmPvpReady,
  drawPoker,
  fetchPvpState,
  guessDicecups,
  moveCheckers,
  moveChess,
  playCards21Action,
  playTrucoCard,
  shootPool
} from "../services/pvpService.js?v=20260522-gameux2";
import {
  advanceCheckersTournamentTest,
  fetchCheckersTournamentState,
  isCheckersTournamentTestMode,
  joinCheckersTournament,
  moveCheckersTournament,
  registerCheckersTournament,
  startCheckersTournamentTest
} from "../services/tournamentService.js?v=20260522-gameux2";
import {
  CHECKERS_SIZE,
  applyCheckersMove,
  countCheckersPieces,
  createInitialCheckersBoard,
  getCheckersLegalMoves,
  getCheckersOwner,
  getCheckersOutcome,
  isCheckersKing
} from "../core/checkersRules.js?v=20260522-gameux2";
import { Chess } from "../vendor/chess.js?v=20260522-gameux2";

function resultTitle(result) {
  if (result === "win") return "Vitória";
  if (result === "loss") return "Derrota";
  return "Empate";
}

const ACTIVE_PUBPAID_GAMES = ["pool", "checkers", "chess"];
const PVP_GAMES = new Set(ACTIVE_PUBPAID_GAMES);
const GAME_LABELS = {
  pool: "Sinuca",
  checkers: "Damas",
  chess: "Xadrez",
  cards21: "21",
  poker: "Pôquer",
  truco: "Truco",
  dicecups: "Dados"
};

const GAME_LAUNCH_COPY = {
  pool: {
    promise: "Mira, força e tacada em mesa de clube.",
    loading: "Acendendo a mesa, conferindo as caçapas internas e montando o triângulo da Sinuca."
  },
  checkers: {
    promise: "Arena de captura com leitura clara de turno.",
    loading: "Montando tabuleiro, peças e tensão de rodada de Damas."
  },
  chess: {
    promise: "Tabuleiro clássico em tela cheia, com foco em decisão.",
    loading: "Acendendo o salão de Xadrez e alinhando as peças."
  },
  cards21: {
    promise: "Mesa de 21 com cartas grandes e risco visível.",
    loading: "Embaralhando o 21, separando cartas e calibrando o HUD."
  },
  poker: {
    promise: "Pôquer de troca com mão, rival e decisão de cartas.",
    loading: "Abrindo a mesa de Pôquer e aquecendo o baralho."
  },
  truco: {
    promise: "Truco rápido, mesa viva e leitura de rodada.",
    loading: "Chamando a mesa de Truco e separando as cartas da mão."
  },
  dicecups: {
    promise: "Dados visíveis, copos e palpite de soma.",
    loading: "Sacudindo os copos e colocando os dados no centro da mesa."
  }
};

const GAME_AUDIO_ZONES = {
  pool: "game-pool",
  checkers: "game-checkers",
  chess: "game-chess",
  cards21: "game-cards21",
  poker: "game-poker",
  truco: "game-truco",
  dicecups: "game-dicecups"
};

const CHESS_PIECES = {
  p: { side: "black", role: "pawn", name: "Peão preto" },
  r: { side: "black", role: "rook", name: "Torre preta" },
  n: { side: "black", role: "knight", name: "Cavalo preto" },
  b: { side: "black", role: "bishop", name: "Bispo preto" },
  q: { side: "black", role: "queen", name: "Rainha preta" },
  k: { side: "black", role: "king", name: "Rei preto" },
  P: { side: "white", role: "pawn", name: "Peão branco" },
  R: { side: "white", role: "rook", name: "Torre branca" },
  N: { side: "white", role: "knight", name: "Cavalo branco" },
  B: { side: "white", role: "bishop", name: "Bispo branco" },
  Q: { side: "white", role: "queen", name: "Rainha branca" },
  K: { side: "white", role: "king", name: "Rei branco" }
};

const CHESS_START_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const CHESS_ROLE_NAMES = {
  p: "Peão",
  r: "Torre",
  n: "Cavalo",
  b: "Bispo",
  q: "Rainha",
  k: "Rei"
};
const CHESS_COLOR_NAMES = {
  white: "brancas",
  black: "pretas"
};

function callChessFlag(move, methodName) {
  try {
    return Boolean(move && typeof move[methodName] === "function" && move[methodName]());
  } catch (_error) {
    return false;
  }
}

function normalizeChessMove(move = {}) {
  const promotion = move.promotion || "";
  const capture = Boolean(move.captured) || callChessFlag(move, "isCapture");
  return {
    color: move.color === "b" ? "black" : "white",
    from: String(move.from || "").toLowerCase(),
    to: String(move.to || "").toLowerCase(),
    piece: String(move.piece || "").toLowerCase(),
    captured: String(move.captured || "").toLowerCase(),
    promotion: String(promotion || "").toLowerCase(),
    flags: String(move.flags || ""),
    san: String(move.san || ""),
    lan: String(move.lan || `${move.from || ""}${move.to || ""}${promotion || ""}`),
    capture,
    castle: callChessFlag(move, "isCastle") || callChessFlag(move, "isKingsideCastle") || callChessFlag(move, "isQueensideCastle"),
    enPassant: callChessFlag(move, "isEnPassant"),
    bigPawn: callChessFlag(move, "isBigPawn")
  };
}

function createChessFromFen(fen = CHESS_START_FEN) {
  try {
    return new Chess(fen || CHESS_START_FEN);
  } catch (_error) {
    return new Chess(CHESS_START_FEN);
  }
}

function decorateChessState(state = {}) {
  const chess = createChessFromFen(state.fen || CHESS_START_FEN);
  const legalMoves = chess.moves({ verbose: true }).map(normalizeChessMove);
  const inCheck = Boolean(chess.isCheck?.() || chess.inCheck?.());
  const checkmate = Boolean(chess.isCheckmate?.());
  const draw = Boolean(chess.isDraw?.());
  const gameOver = Boolean(chess.isGameOver?.()) || checkmate || draw;
  const forcedMoves = inCheck || legalMoves.length === 1 ? legalMoves : [];
  return {
    ...state,
    fen: chess.fen(),
    whiteSeat: state.whiteSeat || "playerOne",
    blackSeat: state.blackSeat || "playerTwo",
    history: Array.isArray(state.history) ? state.history : [],
    lastMove: state.lastMove || null,
    turnColor: chess.turn() === "b" ? "black" : "white",
    legalMoves,
    forcedMoves,
    inCheck,
    checkmate,
    stalemate: Boolean(chess.isStalemate?.()),
    draw,
    gameOver
  };
}

function chessMoveCue(move = {}) {
  if (move.checkmate) return "chess-mate";
  if (move.check) return "chess-check";
  if (move.capture) return "chess-capture";
  return "chess-move";
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
    modePicker: document.querySelector("[data-dom-mode-picker]"),
    modeKicker: document.querySelector("[data-dom-mode-kicker]"),
    modeTitle: document.querySelector("[data-dom-mode-title]"),
    modeCopy: document.querySelector("[data-dom-mode-copy]"),
    modeDemo: document.querySelector("[data-dom-mode-demo]"),
    modePvp: document.querySelector("[data-dom-mode-pvp]"),
    loading: document.querySelector("[data-dom-loading]"),
    loadingKicker: document.querySelector("[data-dom-loading-kicker]"),
    loadingTitle: document.querySelector("[data-dom-loading-title]"),
    loadingCopy: document.querySelector("[data-dom-loading-copy]"),
    loadingFill: document.querySelector(".ppg-dom-loading-bar span"),
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
    tournament: document.querySelector("[data-dom-checkers-tournament]"),
    tournamentTitle: document.querySelector("[data-tournament-title]"),
    tournamentWindow: document.querySelector("[data-tournament-window]"),
    tournamentStatus: document.querySelector("[data-tournament-status]"),
    tournamentKey: document.querySelector("[data-tournament-key]"),
    tournamentName: document.querySelector("[data-tournament-name]"),
    tournamentWhatsapp: document.querySelector("[data-tournament-whatsapp]"),
    tournamentPix: document.querySelector("[data-tournament-pix]"),
    tournamentJoin: document.querySelector("[data-tournament-join]"),
    tournamentStartTest: document.querySelector("[data-tournament-start-test]"),
    tournamentKeys: document.querySelector("[data-tournament-keys]"),
    tournamentBracket: document.querySelector("[data-tournament-bracket]"),
    tournamentCurrent: document.querySelector("[data-tournament-current]"),
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
    poolPocketed: document.querySelector("[data-dom-pool-pocketed]"),
    poolRuleCard: document.querySelector("[data-dom-pool-rule-card]"),
    poolRuleModal: document.querySelector("[data-dom-pool-rule-modal]"),
    poolRuleModalBody: document.querySelector("[data-dom-pool-rule-modal-body]"),
    poolEffect: document.querySelector("[data-dom-pool-effect]"),
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
    checkersArena: document.querySelector("[data-dom-checkers] .ppg-checkers-arena"),
    checkersStage: document.querySelector("[data-dom-checkers-stage]"),
    checkersFrame: document.querySelector("[data-dom-checkers-frame]"),
    checkersCoinFlip: document.querySelector("[data-dom-checkers-coinflip]"),
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
    checkersCaptured: document.querySelector("[data-dom-checkers-captured]"),
    checkersHints: document.querySelector("[data-dom-checkers-hints]"),
    checkersHistory: document.querySelector("[data-dom-checkers-history]"),
    checkersMoveToast: document.querySelector("[data-dom-checkers-move-toast]"),
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
    launchTimer: null,
    resultHandledMatchId: "",
    pvpSelected: null,
    pvpLegalMoves: [],
    pvpDragFrom: null,
    tournamentKey: "",
    tournamentSession: null,
    tournamentMatch: null,
    tournamentSelected: null,
    tournamentLegalMoves: [],
    tournamentPollTimer: null,
    demoCheckers: null,
    demoTable: null,
    demoSelected: null,
    demoLegalMoves: [],
    demoAiTimer: null,
    pvpHeld: [true, true, true, true, true],
    chessSelected: "",
    poolAim: 0,
    poolPower: 0.56,
    poolSpin: "centro",
    poolCuePlace: null,
    poolControlStage: "aim",
    poolPowerDirection: 1,
    poolPowerTimer: null,
    pvpIntroTimer: null,
    pvpIntroMatchKey: "",
    pvpIntroPendingKey: "",
    poolRevealKey: "",
    poolRevealTimer: null,
    pvpRenderBusy: false,
    pvpTableRenderBusy: false,
    tableRenderKey: "",
    poolRenderKey: "",
    poolRulesOpen: false,
    poolDemoState: null,
    poolDemoResultKey: "",
    checkersSound: null,
    lastCheckersSoundKey: "",
    lastCheckersTouchAt: 0,
    reviewModeBooted: false,
    checkersIntroMatchKey: "",
    checkersIntroTimer: null,
    checkersIntroLocked: false,
    checkersIntroCredits: false,
    checkersIntroCreditsTimer: null,
    checkersIntroPhase: "",
    demoAiThinking: false,
    demoAiPreviewMove: null,
    demoChessAiTimer: null,
    demoChessAiThinking: false,
    demoChessAiPreviewMove: null,
    chessIntroMatchKey: "",
    chessIntroTimer: null,
    chessIntroLocked: false,
    chessIntroCredits: false,
    chessIntroCreditsTimer: null,
    chessIntroPhase: "",
    chessCoinFace: "cara",
    checkersCamera: {
      yaw: 0,
      zoom: 1,
      panX: 0,
      panY: 0,
      dragId: null,
      dragX: 0,
      dragY: 0,
      dragCapture: null,
      pinchDistance: 0,
      pinchZoom: 1,
      pointers: new Map(),
      suppressUntil: 0
    },
    chessCamera: {
      yaw: 0,
      zoom: 1,
      panX: 0,
      panY: 0,
      dragId: null,
      dragX: 0,
      dragY: 0,
      dragCapture: null,
      pinchDistance: 0,
      pinchZoom: 1,
      pointers: new Map(),
      suppressUntil: 0
    },
    checkersBoardFixed: true,
    chessBoardFixed: true,
    moveFeedback: {
      checkers: { key: "", seat: "", until: 0, timer: null },
      chess: { key: "", seat: "", until: 0, timer: null }
    }
  };

  const setPanel = (name) => {
    refs.root.classList.toggle("is-lobby", name === "lobby");
    refs.root.classList.toggle("is-mode-picker", name === "mode-picker");
    refs.root.classList.toggle("is-loading", name === "loading");
    refs.root.classList.toggle("is-matchmaking", name === "matchmaking");
    refs.root.classList.toggle("is-tournament", name === "tournament");
    refs.root.classList.toggle("is-access-block", name === "access-block");
    refs.root.classList.toggle("is-pool", name === "pool");
    refs.root.classList.toggle("is-checkers", name === "checkers");
    refs.root.classList.toggle("is-table", name === "table");
    refs.root.classList.toggle("is-result", name === "result");
    document.body?.classList.toggle("ppg-dom-playing", name === "pool" || name === "checkers" || name === "table");
    document.body?.classList.toggle("ppg-dom-launching", name === "loading");
    document.body?.classList.toggle("ppg-dom-checkers-active", name === "checkers");
    document.body?.classList.toggle("ppg-dom-table-active", name === "table");
    document.body?.classList.toggle("ppg-dom-tournament-active", name === "tournament");
    refs.lobby.hidden = name !== "lobby" && name !== "mode-picker";
    if (refs.modePicker) refs.modePicker.hidden = name !== "mode-picker";
    if (refs.loading) refs.loading.hidden = name !== "loading";
    refs.matchmaking.hidden = name !== "matchmaking";
    if (refs.tournament) refs.tournament.hidden = name !== "tournament";
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

  const gameAudioZone = (gameId = "") => GAME_AUDIO_ZONES[gameId] || "salon";

  const gameLaunchCopy = (gameId = "") => GAME_LAUNCH_COPY[gameId] || {
    promise: "Mesa em tela cheia com visual e som dedicados.",
    loading: "Preparando tela cheia, som e controles da mesa."
  };

  const emitGameSound = (cue = "select", gameId = local.selectedGame || "pool") => {
    game.events.emit("pubpaid:sound-cue", { cue, gameId });
  };

  const syncSelectedGameCard = (gameId = "") => {
    refs.lobby?.querySelectorAll("[data-dom-game-card]").forEach((card) => {
      card.classList.toggle("is-selected", card.dataset.domGameCard === gameId);
    });
  };

  const showModePicker = (gameId = "pool") => {
    local.selectedGame = gameId;
    const copy = gameLaunchCopy(gameId);
    syncSelectedGameCard(gameId);
    if (refs.modePicker) refs.modePicker.dataset.game = gameId;
    if (refs.modeKicker) refs.modeKicker.textContent = "modo de jogo";
    if (refs.modeTitle) refs.modeTitle.textContent = `${gameLabel(gameId)} em tela cheia`;
    if (refs.modeCopy) refs.modeCopy.textContent = copy.promise;
    if (refs.modeDemo) refs.modeDemo.dataset.domModeDemo = gameId;
    if (refs.modePvp) refs.modePvp.dataset.domModePvp = gameId;
    setPanel("mode-picker");
    emitGameSound("select", gameId);
    updateGameState({
      activeGameId: gameId,
      selectedTable: gameId,
      lobbyPhase: "mode-select",
      objective: `Escolher Demo ou PvP de ${gameLabel(gameId)}`,
      focus: "seletor de modo",
      prompt: copy.promise
    });
  };

  const showGameLoading = (gameId = "pool", mode = "demo") => {
    const copy = gameLaunchCopy(gameId);
    local.selectedGame = gameId;
    if (refs.loading) refs.loading.dataset.game = gameId;
    if (refs.loading) refs.loading.dataset.mode = mode;
    if (refs.loadingKicker) refs.loadingKicker.textContent = mode === "pvp" ? "abrindo PvP" : "abrindo Demo";
    if (refs.loadingTitle) refs.loadingTitle.textContent = `${gameLabel(gameId)} em tela cheia`;
    if (refs.loadingCopy) refs.loadingCopy.textContent = copy.loading;
    if (refs.loadingFill) refs.loadingFill.style.setProperty("--ppg-loading-progress", "8%");
    setPanel("loading");
    game.events.emit("pubpaid:request-fullscreen");
    game.events.emit("pubpaid:music-zone", gameAudioZone(gameId));
    emitGameSound(mode === "pvp" ? "pvp" : "launch", gameId);
    updateGameState({
      activeGameId: gameId,
      selectedTable: gameId,
      lobbyPhase: "loading",
      objective: `Carregar ${gameLabel(gameId)}`,
      focus: mode === "pvp" ? "PvP real" : "Demo local",
      prompt: copy.loading
    });
  };

  const launchGame = (gameId = "pool", mode = "demo", starter = () => {}) => {
    window.clearTimeout(local.launchTimer);
    showGameLoading(gameId, mode);
    const loadingSteps = [22, 46, 71, 92, 100];
    loadingSteps.forEach((progress, index) => {
      window.setTimeout(() => {
        if (local.selectedGame === gameId && refs.loadingFill) {
          refs.loadingFill.style.setProperty("--ppg-loading-progress", `${progress}%`);
        }
      }, 90 + index * 95);
    });
    local.launchTimer = window.setTimeout(() => {
      local.launchTimer = null;
      if (refs.loadingFill) refs.loadingFill.style.setProperty("--ppg-loading-progress", "100%");
      game.events.emit("pubpaid:music-zone", gameAudioZone(gameId));
      starter();
      emitGameSound("ready", gameId);
    }, 680);
  };

  const stopPvpPoolPowerMeter = () => {
    window.clearInterval(local.poolPowerTimer);
    local.poolPowerTimer = null;
  };

  const resetPvpPoolControls = () => {
    stopPvpPoolPowerMeter();
    local.poolAim = 0;
    local.poolPower = 0.18;
    local.poolCuePlace = null;
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
    window.clearTimeout(local.launchTimer);
    window.clearTimeout(local.pvpIntroTimer);
    stopPvpPoolPowerMeter();
    if (isPoolDemoActive()) resetDemoPoolState();
    local.pvpPollTimer = null;
    local.resultReturnTimer = null;
    local.demoAiTimer = null;
    local.launchTimer = null;
    local.pvpIntroTimer = null;
    local.pvpIntroPendingKey = "";
    local.pvpIntroMatchKey = "";
    local.resultHandledMatchId = "";
    local.pvpSelected = null;
    local.pvpLegalMoves = [];
    local.pvpDragFrom = null;
    local.tournamentMatch = null;
    local.tournamentSelected = null;
    local.tournamentLegalMoves = [];
    local.demoCheckers = null;
    local.demoTable = null;
    local.demoSelected = null;
    local.demoLegalMoves = [];
    local.pvpHeld = [true, true, true, true, true];
    local.chessSelected = "";
    local.poolAim = 0;
    local.poolPower = 0.56;
    local.poolSpin = "centro";
    local.tableRenderKey = "";
    local.poolRenderKey = "";
    local.poolDemoResultKey = "";
    local.lastCheckersSoundKey = "";
    local.selectedGame = local.selectedGame === "pool-demo"
      ? "pool"
      : gameState.activeGameId || local.selectedGame || "pool";
    setPanel("lobby");
    syncSelectedGameCard(local.selectedGame);
    game.events.emit("pubpaid:music-zone", "salon");
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
      prompt: "Mesas abertas. Mesas pagas exigem saldo real aprovado."
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
    refs.resultTitle.textContent = `${gameLabel(gameId)}: ${resultTitle(result)}`;
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
      copy.body = "Esta mesa ainda precisa do servidor real de partida, saldo travado e pagamento antes de abrir.";
    }
    if (reason === "pvp-only") {
      copy.title = "Mesa real";
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
  const isTableDemoActive = () => Boolean(local.demoTable);

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

  const MOVE_FEEDBACK_MS = 1500;

  const moveFeedbackActive = (kind = "") => {
    const feedback = local.moveFeedback?.[kind];
    return Boolean(feedback?.key && Number(feedback.until || 0) > Date.now());
  };

  const heldTurnSeat = (kind = "", fallbackSeat = "") =>
    moveFeedbackActive(kind) ? local.moveFeedback[kind].seat || fallbackSeat : fallbackSeat;

  const setCheckersMoveToast = (active = false) => {
    if (!refs.checkersMoveToast) return;
    refs.checkersMoveToast.hidden = !active;
    refs.checkersMoveToast.classList.toggle("is-visible", active);
  };

  const scheduleMoveFeedback = (kind = "", key = "", seat = "", onDone = null) => {
    const feedback = local.moveFeedback?.[kind];
    if (!feedback || !key || !seat || feedback.key === key) return moveFeedbackActive(kind);
    window.clearTimeout(feedback.timer);
    feedback.key = key;
    feedback.seat = seat;
    feedback.until = Date.now() + MOVE_FEEDBACK_MS;
    feedback.timer = window.setTimeout(() => {
      if (feedback.key !== key) return;
      feedback.until = 0;
      feedback.timer = null;
      onDone?.();
    }, MOVE_FEEDBACK_MS);
    return true;
  };

  const checkersMoveFeedbackKey = (match = {}) => {
    const move = match.lastMove || {};
    if (!move.from || !move.to || !move.seat) return "";
    return `${match.id || "checkers"}:${move.index || match.moveCount || ""}:${move.seat}:${move.at || ""}:${formatCheckersMove(move)}`;
  };

  const syncCheckersMoveFeedback = (match = {}) => {
    const key = checkersMoveFeedbackKey(match);
    const move = match.lastMove || {};
    const turnPassed = match.status === "active" && !match.forcedPiece && move.seat && match.turn && match.turn !== move.seat;
    if (turnPassed) scheduleMoveFeedback("checkers", key, move.seat, renderPvpCheckers);
    return moveFeedbackActive("checkers");
  };

  const chessMoveFeedbackKey = (match = {}) => {
    const state = decorateChessState(match.chessState || {});
    const move = state.lastMove || state.history?.slice?.(-1)?.[0] || {};
    if (!move.from || !move.to || !move.seat) return "";
    return `${match.id || "chess"}:${move.index || match.moveCount || ""}:${move.seat}:${move.at || ""}:${move.lan || `${move.from}-${move.to}`}`;
  };

  const syncChessMoveFeedback = (match = {}) => {
    const state = decorateChessState(match.chessState || {});
    const move = state.lastMove || state.history?.slice?.(-1)?.[0] || {};
    const turnSeat = chessSeatForColor(state, state.turnColor || "white");
    const turnPassed = match.status === "active" && move.seat && turnSeat && turnSeat !== move.seat;
    if (turnPassed) scheduleMoveFeedback("chess", chessMoveFeedbackKey(match), move.seat, renderPvpTable);
    return moveFeedbackActive("chess");
  };

  const resetCheckersCamera = () => {
    Object.assign(local.checkersCamera, {
      yaw: 0,
      zoom: 1,
      panX: 0,
      panY: 0,
      dragId: null,
      dragX: 0,
      dragY: 0,
      dragCapture: null,
      pinchDistance: 0,
      pinchZoom: 1,
      pointers: new Map(),
      suppressUntil: 0
    });
  };

  const clampCheckersCamera = () => {
    local.checkersCamera.zoom = clampUiNumber(local.checkersCamera.zoom, 0.82, 1.28, 1);
    local.checkersCamera.yaw = clampUiNumber(local.checkersCamera.yaw, -32, 32, 0);
    local.checkersCamera.panX = clampUiNumber(local.checkersCamera.panX, -42, 42, 0);
    local.checkersCamera.panY = clampUiNumber(local.checkersCamera.panY, -30, 30, 0);
  };

  const applyCheckersCamera = (match = {}, seat = "playerOne") => {
    if (!refs.checkersFrame) return;
    clampCheckersCamera();
    const rivalSeat = seat === "playerOne" ? "playerTwo" : "playerOne";
    const visibleTurnSeat = heldTurnSeat("checkers", match.turn);
    const turnYaw = !local.checkersBoardFixed && match.status === "active" && visibleTurnSeat === rivalSeat ? 180 : 0;
    const cinematic = refs.checkersArena?.classList.contains("is-cinematic");
    refs.checkersFrame.style.setProperty("--ppg-checkers-turn-yaw", `${turnYaw}deg`);
    refs.checkersFrame.style.setProperty("--ppg-checkers-user-yaw", `${local.checkersCamera.yaw}deg`);
    refs.checkersFrame.style.setProperty("--ppg-checkers-zoom", `${local.checkersCamera.zoom}`);
    refs.checkersFrame.style.setProperty("--ppg-checkers-pan-x", `${local.checkersCamera.panX}px`);
    refs.checkersFrame.style.setProperty("--ppg-checkers-pan-y", `${local.checkersCamera.panY}px`);
    refs.checkersFrame.style.setProperty("--ppg-checkers-tilt", cinematic ? "64deg" : "56deg");
  };

  const resetChessCamera = () => {
    Object.assign(local.chessCamera, {
      yaw: 0,
      zoom: 1,
      panX: 0,
      panY: 0,
      dragId: null,
      dragX: 0,
      dragY: 0,
      dragCapture: null,
      pinchDistance: 0,
      pinchZoom: 1,
      pointers: new Map(),
      suppressUntil: 0
    });
  };

  const clampChessCamera = () => {
    local.chessCamera.zoom = clampUiNumber(local.chessCamera.zoom, 0.82, 1.34, 1);
    local.chessCamera.yaw = clampUiNumber(local.chessCamera.yaw, -72, 72, 0);
    local.chessCamera.panX = clampUiNumber(local.chessCamera.panX, -46, 46, 0);
    local.chessCamera.panY = clampUiNumber(local.chessCamera.panY, -34, 34, 0);
  };

  const isChessDemoActive = () => isTableDemoActive() && local.demoTable?.gameId === "chess";
  const isChessCameraActive = () => gameState.pvpGameId === "chess" || isChessDemoActive();
  const isMiddleMouseCameraDrag = (event) => event.pointerType === "mouse" && event.button === 1;
  const cameraPointerDistance = (camera) => {
    const points = Array.from(camera.pointers.values());
    if (points.length < 2) return 0;
    return Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y);
  };

  const rememberCameraPointer = (camera, event) => {
    if (event.pointerType !== "touch") return;
    camera.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (camera.pointers.size >= 2) {
      camera.pinchDistance = cameraPointerDistance(camera);
      camera.pinchZoom = camera.zoom;
      camera.suppressUntil = Date.now() + 420;
    }
  };

  const forgetCameraPointer = (camera, event) => {
    camera.pointers.delete(event.pointerId);
    if (camera.pointers.size < 2) camera.pinchDistance = 0;
  };

  const updatePinchCamera = (camera, event, apply) => {
    if (event.pointerType !== "touch" || !camera.pointers.has(event.pointerId)) return false;
    camera.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (camera.pointers.size < 2 || !camera.pinchDistance) return false;
    const distance = cameraPointerDistance(camera);
    if (!distance) return false;
    camera.zoom = camera.pinchZoom * (distance / camera.pinchDistance);
    camera.suppressUntil = Date.now() + 420;
    event.preventDefault();
    apply();
    return true;
  };

  const applyChessCamera = (match = {}, seat = "playerOne") => {
    const frame = refs.tableBody?.querySelector?.("[data-chess-frame]");
    if (!frame) return;
    clampChessCamera();
    const state = decorateChessState(match.chessState || {});
    const turnSeat = chessSeatForColor(state, state.turnColor || "white");
    const rivalSeat = seat === "playerOne" ? "playerTwo" : "playerOne";
    const visibleTurnSeat = heldTurnSeat("chess", turnSeat);
    const turnYaw = !local.chessBoardFixed && match.status === "active" && visibleTurnSeat === rivalSeat ? 42 : 0;
    const cinematic = frame.closest?.(".ppg-chess-arena")?.classList.contains("is-ai-thinking") || frame.closest?.(".ppg-chess-arena")?.classList.contains("is-cinematic");
    const compactLandscape = window.matchMedia?.("(max-width: 760px) and (orientation: landscape)")?.matches;
    frame.style.setProperty("--ppg-chess-turn-yaw", `${turnYaw}deg`);
    frame.style.setProperty("--ppg-chess-user-yaw", `${local.chessCamera.yaw}deg`);
    frame.style.setProperty("--ppg-chess-zoom", `${local.chessCamera.zoom}`);
    frame.style.setProperty("--ppg-chess-pan-x", `${local.chessCamera.panX}px`);
    frame.style.setProperty("--ppg-chess-pan-y", `${local.chessCamera.panY}px`);
    frame.style.setProperty("--ppg-chess-tilt", compactLandscape ? (cinematic ? "42deg" : "38deg") : (cinematic ? "50deg" : "44deg"));
  };

  const cameraHintMarkup = () => `
    <div class="ppg-camera-hint ppg-chess-camera-hint" aria-hidden="true">
      <i></i>
      <span class="is-desktop-copy">Arraste a borda para ajustar a mesa. Roda aproxima.</span>
      <span class="is-mobile-copy">Use toque na mesa e pinça para zoom.</span>
    </div>
  `;

  const cameraEdgesMarkup = (game = "chess") => `
    <span class="ppg-camera-edge is-top" data-${game}-camera-edge data-camera-edge="top" aria-hidden="true"></span>
    <span class="ppg-camera-edge is-right" data-${game}-camera-edge data-camera-edge="right" aria-hidden="true"></span>
    <span class="ppg-camera-edge is-bottom" data-${game}-camera-edge data-camera-edge="bottom" aria-hidden="true"></span>
    <span class="ppg-camera-edge is-left" data-${game}-camera-edge data-camera-edge="left" aria-hidden="true"></span>
  `;

  const cameraOrbMarkup = (game = "chess", fixed = true) => {
    const attr = game === "checkers" ? "data-checkers-camera" : "data-chess-camera";
    const label = game === "checkers" ? "Damas" : "Xadrez";
    return `
      <div class="ppg-${game}-camera ppg-checkers-camera ppg-camera-orb is-lock-only" aria-label="Trava de mesa de ${label}">
        <button type="button" class="is-camera-lock${fixed ? " is-active" : ""}" ${attr}="lock" aria-pressed="${fixed ? "true" : "false"}">${fixed ? "Mesa fixa" : "Girar rival"}</button>
      </div>
    `;
  };

  const startCheckersCinematic = (match = {}) => {
    const key = match.id || "";
    if (!key || local.checkersIntroMatchKey === key) return;
    local.checkersIntroMatchKey = key;
    local.checkersIntroLocked = true;
    local.checkersIntroCredits = false;
    local.checkersIntroPhase = "video";
    refs.checkersArena?.classList.add("is-cinematic");
    refs.checkersCoinFlip?.classList.add("is-flipping");
    window.clearTimeout(local.checkersIntroTimer);
    window.clearTimeout(local.checkersIntroCreditsTimer);
    const urlParams = new URLSearchParams(window.location.search || "");
    const introDuration = urlParams.get("intro") === "1" ? 8500 : 4600;
    local.checkersIntroTimer = window.setTimeout(() => {
      finishCheckersCinematic();
    }, introDuration);
  };

  const finishCheckersCinematic = () => {
    if (!local.checkersIntroLocked) return;
    if (local.checkersIntroPhase === "video") {
      local.checkersIntroPhase = "credits";
      local.checkersIntroCredits = true;
      renderPvpCheckers();
      window.clearTimeout(local.checkersIntroCreditsTimer);
      local.checkersIntroCreditsTimer = window.setTimeout(() => {
        finishCheckersCinematic();
      }, 3200);
      return;
    }
    if (local.checkersIntroPhase === "credits") {
      local.checkersIntroPhase = "coin";
      local.checkersIntroCredits = false;
      playCheckersMoveSound("coin");
      renderPvpCheckers();
      window.clearTimeout(local.checkersIntroCreditsTimer);
      local.checkersIntroCreditsTimer = window.setTimeout(() => {
        finishCheckersCinematic();
      }, 2600);
      return;
    }
    local.checkersIntroPhase = "";
    local.checkersIntroCredits = false;
    local.checkersIntroLocked = false;
    refs.checkersArena?.classList.remove("is-cinematic");
    refs.checkersCoinFlip?.classList.remove("is-flipping");
    if (refs.checkersCoinFlip) refs.checkersCoinFlip.hidden = true;
    applyCheckersCamera(local.tournamentMatch || local.demoCheckers || gameState.pvpMatch || {}, tournamentSeatForCurrentParticipant() || gameState.pvpSeat || "playerOne");
    renderPvpCheckers();
  };

  const finishChessCinematic = () => {
    if (!local.chessIntroLocked) return;
    if (local.chessIntroPhase === "video") {
      local.chessIntroPhase = "credits";
      local.chessIntroCredits = true;
      renderPvpTable();
      window.clearTimeout(local.chessIntroCreditsTimer);
      local.chessIntroCreditsTimer = window.setTimeout(() => {
        finishChessCinematic();
      }, 3200);
      return;
    }
    if (local.chessIntroPhase === "credits") {
      local.chessIntroPhase = "coin";
      local.chessIntroCredits = false;
      playCheckersMoveSound("coin");
      renderPvpTable();
      window.clearTimeout(local.chessIntroCreditsTimer);
      local.chessIntroCreditsTimer = window.setTimeout(() => {
        finishChessCinematic();
      }, 2600);
      return;
    }
    local.chessIntroPhase = "";
    local.chessIntroCredits = false;
    local.chessIntroLocked = false;
    renderPvpTable();
    if (isTableDemoActive() && local.demoTable?.gameId === "chess") {
      scheduleDemoChessAiMove();
    }
  };

  const startChessCinematic = (match = {}) => {
    const key = match.id || "";
    if (!key || local.chessIntroMatchKey === key) return;
    local.chessIntroMatchKey = key;
    local.chessIntroLocked = true;
    local.chessIntroCredits = false;
    local.chessIntroPhase = "video";
    window.clearTimeout(local.chessIntroTimer);
    window.clearTimeout(local.chessIntroCreditsTimer);
    const urlParams = new URLSearchParams(window.location.search || "");
    const introDuration = urlParams.get("intro") === "1" ? 11500 : 7600;
    local.chessIntroTimer = window.setTimeout(() => {
      finishChessCinematic();
    }, introDuration);
  };

  const renderCheckersCoinFlip = (match = {}, demoMode = false) => {
    if (!refs.checkersCoinFlip) return;
    const coin = match.coinFlip || {};
    const firstSeat = coin.firstSeat || "playerOne";
    const face = demoMode ? "cara" : coin.face || "cara";
    const firstName = displayNameFor(match[firstSeat] || (firstSeat === "playerOne" ? currentPvpPlayer() : rivalPvpPlayer()) || {});
    const opening = local.checkersIntroLocked && match.status === "active" && Number(match.moveCount || 0) === 0;
    refs.checkersCoinFlip.hidden = !opening;
    if (opening) {
      const buildVersion = window.pubpaidBuildVersion || "20260522-gameux2";
      const phase = local.checkersIntroPhase || "coin";
      refs.checkersCoinFlip.innerHTML = `
        ${phase === "video" ? `<video data-checkers-intro-video src="./assets/pubpaid/checkers/checkers-intro-premium-v1.mp4?v=${buildVersion}" autoplay muted playsinline preload="auto"></video>` : ""}
        <div class="ppg-checkers-intro-copy${phase === "credits" ? " is-credits" : ""}${phase === "coin" ? " is-coin" : ""}">
          ${phase === "credits"
            ? `<b>Inside Trade Mark</b><strong>Antonio Clovis</strong><small>Programador e criador</small>`
            : phase === "coin"
              ? `<b>Moeda</b><span></span><strong>${face === "coroa" ? "Coroa" : "Cara"}</strong><small>${firstName || "Jogador"} começa</small>`
              : `<b>Damas</b><strong>PubPaid</strong><small>Prepare-se</small>`}
        </div>
      `;
      playCheckersIntroVideo();
    }
  };

  const playCheckersIntroVideo = () => {
    const video = refs.checkersCoinFlip?.querySelector?.("[data-checkers-intro-video]");
    if (!video) return;
    try {
      const directReview = new URLSearchParams(window.location.search || "").has("review");
      video.muted = directReview ? true : false;
      video.volume = 0.9;
      video.currentTime = 0;
      video.onended = () => finishCheckersCinematic();
      const promise = video.play?.();
      promise?.catch?.(() => {
        video.muted = true;
        video.play?.().catch?.(() => {});
      });
      window.setTimeout(() => {
        if (local.checkersIntroLocked && video.paused && Number(video.duration || 0) > 1) {
          video.currentTime = Math.min(1.2, Number(video.duration || 1) - 0.2);
        }
      }, 700);
    } catch (_error) {
      // Timer fallback releases the board if video playback is blocked.
    }
  };

  const renderChessIntroMarkup = (match = {}) => {
    const state = decorateChessState(match.chessState || {});
    const coin = match.coinFlip || {};
    const firstSeat = coin.firstSeat || state.whiteSeat || "playerOne";
    const firstPlayer = match[firstSeat] || (firstSeat === "playerOne" ? currentPvpPlayer() : rivalPvpPlayer()) || {};
    const face = coin.face || (firstSeat === "playerTwo" ? "coroa" : "cara");
    const firstName = coin.firstPlayerName || displayNameFor(firstPlayer) || (firstSeat === "playerOne" ? "Você" : "Máquina");
    const colorName = state.whiteSeat === firstSeat ? "brancas" : "pretas";
    const buildVersion = window.pubpaidBuildVersion || "20260522-gameux2";
    const phase = local.chessIntroPhase || "coin";
    return `
      ${phase === "video" ? `<video data-chess-intro-video src="./assets/pubpaid/chess/chess-intro-premium-v1.mp4?v=${buildVersion}" autoplay muted playsinline preload="auto"></video>` : ""}
      <div class="ppg-chess-intro-copy${phase === "credits" ? " is-credits" : ""}${phase === "coin" ? " is-coin" : ""}">
        ${phase === "credits"
          ? `<b>Inside Trade Mark</b><strong>Antonio Clovis</strong><small>Programador e criador</small>`
          : phase === "coin"
            ? `<b>Moeda ${face}</b><strong>${firstName}</strong><small>começa de ${colorName}</small>`
            : `<b>Xadrez</b><strong>PubPaid</strong><small>Prepare-se</small>`}
      </div>
    `;
  };

  const playChessIntroVideo = () => {
    const video = refs.tableBody?.querySelector?.("[data-chess-intro-video]");
    if (!video) return;
    try {
      const directReview = new URLSearchParams(window.location.search || "").has("review");
      video.muted = directReview ? true : false;
      video.volume = 0.9;
      video.currentTime = 0;
      video.onended = () => finishChessCinematic();
      video.onloadedmetadata = () => {
        if (video.paused && Number(video.duration || 0) > 1) {
          video.currentTime = Math.min(0.75, Math.max(0.1, Number(video.duration || 1) - 0.2));
        }
      };
      const promise = video.play?.();
      promise?.catch?.(() => {
        video.muted = true;
        video.play?.().catch?.(() => {});
      });
      window.setTimeout(() => {
        if (local.chessIntroLocked && video.paused && Number(video.duration || 0) > 1) {
          video.currentTime = Math.min(1.2, Number(video.duration || 1) - 0.2);
        }
      }, 700);
    } catch (_error) {
      // The table intro has a timer fallback if video playback is blocked.
    }
  };

  const chessSeatForColor = (state = {}, color = "white") =>
    color === "black" ? state.blackSeat || "playerTwo" : state.whiteSeat || "playerOne";

  const chessColorForSeat = (state = {}, seat = "playerOne") =>
    state.blackSeat === seat ? "black" : "white";

  const chessMovePieceName = (move = {}) => CHESS_ROLE_NAMES[move.piece] || "Peça";

  const formatChessMove = (move = {}) => {
    const connector = move.capture ? "x" : "-";
    const san = move.san ? ` ${move.san}` : "";
    const promotion = move.promotion ? `=${String(move.promotion).toUpperCase()}` : "";
    return `${chessMovePieceName(move)} ${String(move.from || "").toUpperCase()}${connector}${String(move.to || "").toUpperCase()}${promotion}${san}`;
  };

  const getChessTurnSummary = (match = {}, seat = "playerOne", demoMode = false) => {
    const state = decorateChessState(match.chessState || {});
    const turnSeat = chessSeatForColor(state, state.turnColor);
    if (match.status !== "active") return match.resultSummary || "Mesa encerrada.";
    if (state.checkmate) return "Xeque-mate.";
    if (state.draw) return "Empate por regra.";
    if (state.inCheck) {
      return demoMode || turnSeat === seat
        ? "Xeque: responda com um lance legal."
        : "Rival em xeque: aguardando resposta.";
    }
    return demoMode
      ? `${CHESS_COLOR_NAMES[state.turnColor] || "lado"} jogam agora.`
      : turnSeat === seat
        ? "Sua vez: escolha uma peça com lance legal."
        : "Vez do rival.";
  };

  const setCheckersPlayerCard = (refsForPlayer = {}, player = {}, { pieces = 0, active = false, connected = true, label = "" } = {}) => {
    if (refsForPlayer.name) refsForPlayer.name.textContent = displayNameFor(player);
    if (refsForPlayer.initial) {
      const pictureUrl = player?.picture || player?.avatar || "";
      refsForPlayer.initial.textContent = pictureUrl ? "" : initialFor(player);
      refsForPlayer.initial.classList.toggle("has-picture", Boolean(pictureUrl));
      refsForPlayer.initial.style.backgroundImage = pictureUrl ? `url("${pictureUrl}")` : "";
    }
    if (refsForPlayer.pieces) refsForPlayer.pieces.textContent = String(pieces);
    if (refsForPlayer.meta) {
      refsForPlayer.meta.textContent = label || (active
        ? "em turno"
        : connected
          ? "conectado"
          : "reconectando");
    }
    refsForPlayer.root?.classList.toggle("is-active", active);
    refsForPlayer.root?.classList.toggle("is-offline", !connected);
  };

  const renderGameAvatarMarkup = (player = {}, fallbackName = "IA", kind = "ai") => {
    const pictureUrl = player?.picture || player?.avatar || "";
    const hasIdentity = Boolean(player?.name || player?.email);
    const source = hasIdentity ? player : { name: fallbackName };
    const name = displayNameFor(source) || fallbackName;
    const initial = initialFor(source);
    return `
      <article class="ppg-game-avatar is-${kind}">
        <span${pictureUrl ? ` class="has-picture" style="background-image:url('${pictureUrl.replace(/'/g, "%27")}')"` : ""}>${pictureUrl ? "" : initial}</span>
        <strong>${name}</strong>
      </article>
    `;
  };

  const renderCapturedTokens = (count = 0, className = "") => {
    const safeCount = Math.max(0, Math.min(16, Number(count || 0)));
    if (!safeCount) return `<small>nenhuma</small>`;
    return Array.from({ length: safeCount }, () => `<i class="${className}" aria-hidden="true"></i>`).join("");
  };

  const renderCheckersCapturedMarkup = ({ ownCaptured = 0, rivalCaptured = 0 } = {}) => `
    <article class="ppg-checkers-captured-summary">
      <span>peças comidas</span>
      <strong><b>${ownCaptured}</b><i>x</i><b>${rivalCaptured}</b></strong>
      <small>você / rival</small>
    </article>
  `;

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
      const isCapture = kind === "capture";
      const isCoin = kind === "coin";
      const isCrown = kind === "crown";
      hit.type = "triangle";
      shine.type = "sine";
      hit.frequency.setValueAtTime(isCoin ? 720 : isCrown ? 392 : isCapture ? 176 : 220, now);
      hit.frequency.exponentialRampToValueAtTime(isCoin ? 280 : isCrown ? 740 : isCapture ? 92 : 132, now + 0.12);
      shine.frequency.setValueAtTime(isCoin ? 1180 : isCrown ? 980 : isCapture ? 520 : 660, now);
      shine.frequency.exponentialRampToValueAtTime(isCoin ? 620 : isCrown ? 1320 : isCapture ? 260 : 440, now + 0.08);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(isCapture || isCoin || isCrown ? 0.13 : 0.075, now + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + (isCoin || isCrown ? 0.28 : isCapture ? 0.18 : 0.12));
      hit.connect(gain);
      shine.connect(gain);
      gain.connect(context.destination);
      hit.start(now);
      shine.start(now);
      hit.stop(now + (isCoin || isCrown ? 0.32 : 0.2));
      shine.stop(now + (isCoin || isCrown ? 0.26 : 0.14));
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
      face: "cara",
      firstSeat: "playerOne"
    }
  });

  const createLocalCoinFlip = (playerOne = {}, playerTwo = {}) => {
    const playerOneStarts = Math.random() >= 0.5;
    const firstSeat = playerOneStarts ? "playerOne" : "playerTwo";
    const firstPlayer = firstSeat === "playerOne" ? playerOne : playerTwo;
    return {
      face: playerOneStarts ? "cara" : "coroa",
      firstSeat,
      firstPlayerName: displayNameFor(firstPlayer) || (firstSeat === "playerOne" ? "Você" : "Máquina")
    };
  };

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
    } else if (!continuation.length) {
      const feedbackKey = checkersMoveFeedbackKey(match);
      if (scheduleMoveFeedback("checkers", feedbackKey, seat, renderPvpCheckers)) setCheckersMoveToast(true);
    }
  };

  const scheduleDemoAiMove = () => {
    window.clearTimeout(local.demoAiTimer);
    if (!isCheckersDemoActive() || local.demoCheckers.status !== "active" || local.demoCheckers.turn !== "playerTwo") return;
    const moves = getCheckersLegalMoves(local.demoCheckers.board, "playerTwo", local.demoCheckers.forcedPiece || null);
    const previewMove = pickDemoAiMove(moves, local.demoCheckers.board);
    local.demoAiThinking = true;
    local.demoAiPreviewMove = previewMove || null;
    renderPvpCheckers();
    local.demoAiTimer = window.setTimeout(() => {
      if (!isCheckersDemoActive() || local.demoCheckers.status !== "active") {
        local.demoAiThinking = false;
        local.demoAiPreviewMove = null;
        renderPvpCheckers();
        return;
      }
      const move = local.demoAiPreviewMove || pickDemoAiMove(
        getCheckersLegalMoves(local.demoCheckers.board, "playerTwo", local.demoCheckers.forcedPiece || null),
        local.demoCheckers.board
      );
      local.demoAiThinking = false;
      local.demoAiPreviewMove = null;
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
    }, 3000);
  };

  const resetDemoCheckersState = () => {
    window.clearTimeout(local.demoAiTimer);
    window.clearTimeout(local.checkersIntroTimer);
    local.demoAiTimer = null;
    local.demoAiThinking = false;
    local.demoAiPreviewMove = null;
    local.checkersIntroTimer = null;
    local.checkersIntroLocked = false;
    local.checkersIntroMatchKey = "";
    refs.checkersArena?.classList.remove("is-cinematic");
    refs.checkersCoinFlip?.classList.remove("is-flipping");
    if (refs.checkersCoinFlip) refs.checkersCoinFlip.hidden = true;
    local.demoCheckers = null;
    local.demoSelected = null;
    local.demoLegalMoves = [];
    updateGameState({ checkersGame: null });
  };

  const resetDemoPoolState = () => {
    if (game.scene.isActive("pool-game-scene")) game.scene.stop("pool-game-scene");
    local.poolRenderKey = "";
    if (refs.poolStage) refs.poolStage.innerHTML = "";
    if (refs.pool) refs.pool.dataset.render = "";
    updateGameState({ poolGame: null });
  };

  const demoPokerDeck = () => ([
    { suit: "hearts", rank: 14 }, { suit: "spades", rank: 13 }, { suit: "diamonds", rank: 10 },
    { suit: "clubs", rank: 12 }, { suit: "hearts", rank: 7 }, { suit: "spades", rank: 9 },
    { suit: "diamonds", rank: 5 }, { suit: "clubs", rank: 3 }, { suit: "hearts", rank: 11 },
    { suit: "spades", rank: 2 }, { suit: "diamonds", rank: 14 }, { suit: "clubs", rank: 8 }
  ]);

  const demoTrucoDeck = () => ([
    { suit: "ouros", rank: "3", strength: 10 }, { suit: "espadas", rank: "A", strength: 8 }, { suit: "copas", rank: "7", strength: 4 },
    { suit: "paus", rank: "2", strength: 9 }, { suit: "ouros", rank: "Q", strength: 5 }, { suit: "espadas", rank: "5", strength: 2 }
  ]);

  const createDemoChessState = () => decorateChessState({
    fen: CHESS_START_FEN,
    whiteSeat: "playerOne",
    blackSeat: "playerTwo",
    history: [],
    lastMove: null
  });

  const applyDemoChessMove = (from = "", to = "", promotion = "q") => {
    const match = local.demoTable;
    if (!match || match.gameId !== "chess" || match.status !== "active") return null;
    const chess = createChessFromFen(match.chessState?.fen || CHESS_START_FEN);
    const move = chess.move({ from, to, promotion });
    if (!move) {
      updateGameState({ prompt: "Lance invalido: escolha uma origem e destino legais." });
      return null;
    }
    const nextColor = chess.turn() === "b" ? "black" : "white";
    const rawEntry = normalizeChessMove(move);
    const entry = {
      index: Number(match.moveCount || 0) + 1,
      seat: rawEntry.color === "black" ? match.chessState.blackSeat || "playerTwo" : match.chessState.whiteSeat || "playerOne",
      playerName: displayNameFor(match[rawEntry.color === "black" ? match.chessState.blackSeat || "playerTwo" : match.chessState.whiteSeat || "playerOne"]),
      ...rawEntry,
      check: Boolean(chess.isCheck?.() || chess.inCheck?.()),
      checkmate: Boolean(chess.isCheckmate?.()),
      draw: Boolean(chess.isDraw?.()),
      at: new Date().toISOString()
    };
    const nextState = decorateChessState({
      ...(match.chessState || createDemoChessState()),
      fen: chess.fen(),
      history: (Array.isArray(match.chessState?.history) ? match.chessState.history : []).concat(entry).slice(-120),
      lastMove: entry
    });
    Object.assign(match, {
      chessState: nextState,
      moveCount: entry.index,
      turn: chessSeatForColor(nextState, nextColor),
      resultSummary: `${entry.playerName || "Jogador"} jogou ${entry.san || entry.lan}.`,
      updatedAt: new Date().toISOString()
    });
    if (nextState.checkmate) {
      match.status = "finished";
      match.winner = entry.seat;
      match.turn = "";
      match.resultSummary = `${entry.playerName || "Jogador"} deu xeque-mate com ${entry.san || entry.lan}.`;
    } else if (nextState.draw) {
      match.status = "finished";
      match.winner = "";
      match.turn = "";
      match.resultSummary = "Treino de xadrez empatado por regra.";
    } else if (nextState.inCheck) {
      match.resultSummary = `${match.resultSummary} Xeque.`;
    }
    updateGameState({ prompt: match.resultSummary });
    return entry;
  };

  const pickDemoChessAiMove = (moves = []) => {
    const scored = moves.map((move, index) => ({
      move,
      score:
        (move.capture ? 100 : 0) +
        (move.checkmate ? 500 : 0) +
        (move.check ? 90 : 0) +
        (move.promotion ? 60 : 0) +
        (move.castle ? 24 : 0) -
        index * 0.01
    }));
    scored.sort((a, b) => b.score - a.score);
    return scored[0]?.move || moves[0] || null;
  };

  const clearDemoChessAi = () => {
    window.clearTimeout(local.demoChessAiTimer);
    local.demoChessAiTimer = null;
    local.demoChessAiThinking = false;
    local.demoChessAiPreviewMove = null;
  };

  const scheduleDemoChessAiMove = () => {
    clearDemoChessAi();
    const match = local.demoTable;
    if (!match || match.gameId !== "chess" || match.status !== "active") return;
    const state = decorateChessState(match.chessState || {});
    match.chessState = state;
    if (chessSeatForColor(state, state.turnColor) !== "playerTwo") return;
    const previewMove = pickDemoChessAiMove(state.legalMoves || []);
    local.demoChessAiThinking = true;
    local.demoChessAiPreviewMove = previewMove || null;
    renderPvpTable();
    local.demoChessAiTimer = window.setTimeout(() => {
      const activeMatch = local.demoTable;
      if (!activeMatch || activeMatch.gameId !== "chess" || activeMatch.status !== "active") {
        clearDemoChessAi();
        renderPvpTable();
        return;
      }
      const activeState = decorateChessState(activeMatch.chessState || {});
      const move = local.demoChessAiPreviewMove || pickDemoChessAiMove(activeState.legalMoves || []);
      clearDemoChessAi();
      if (!move) {
        activeMatch.status = "finished";
        activeMatch.winner = "playerOne";
        activeMatch.turn = "";
        activeMatch.resultSummary = "Máquina sem lances legais. Você venceu o treino.";
        updateGameState({ prompt: activeMatch.resultSummary });
      } else {
        const moveEntry = applyDemoChessMove(move.from, move.to, move.promotion || "q");
        if (moveEntry) emitGameSound(chessMoveCue(moveEntry), "chess");
      }
      renderPvpTable();
    }, 3000);
  };

  const createDemoTableMatch = (gameId = "poker") => {
    const base = {
      id: `demo-${gameId}-${Date.now()}`,
      gameId,
      status: "active",
      turn: "playerOne",
      moveCount: 0,
      playerOne: currentPvpPlayer() || { name: "Você", email: "treino@pubpaid.local" },
      playerTwo: { name: "Treino", email: "mesa@pubpaid.local" },
      presence: { playerOne: { connected: true }, playerTwo: { connected: true } },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    if (gameId === "cards21") {
      return {
        ...base,
        cardsState: {
          drawCount: 4,
          playerOneCards: [11, 7],
          playerTwoCards: [10, 8],
          playerOneState: "active",
          playerTwoState: "stood"
        }
      };
    }
    if (gameId === "poker") {
      const deck = demoPokerDeck();
      return {
        ...base,
        pokerState: {
          deck: deck.slice(10),
          playerOneCards: deck.slice(0, 5),
          playerTwoCards: deck.slice(5, 10),
          playerOneDrawUsed: false,
          playerTwoDrawUsed: false
        }
      };
    }
    if (gameId === "truco") {
      const deck = demoTrucoDeck();
      return {
        ...base,
        trucoState: {
          deck: [],
          round: 1,
          maxRounds: 3,
          playerOneScore: 0,
          playerTwoScore: 0,
          playerOneCards: deck.slice(0, 3),
          playerTwoCards: deck.slice(3, 6),
          table: [],
          history: []
        }
      };
    }
    if (gameId === "dicecups") {
      return { ...base, diceState: { playerOneScore: 0, playerTwoScore: 0, dice: [0, 0], total: 0, round: 1, maxRounds: 3 } };
    }
    const chessAiPlayer = { name: "Máquina", email: "xadrez@pubpaid.local" };
    const coinFlip = createLocalCoinFlip(base.playerOne, chessAiPlayer);
    const whiteSeat = coinFlip.firstSeat;
    const blackSeat = whiteSeat === "playerOne" ? "playerTwo" : "playerOne";
    return {
      ...base,
      coinFlip,
      turn: coinFlip.firstSeat,
      playerTwo: chessAiPlayer,
      chessState: decorateChessState({
        ...createDemoChessState(),
        whiteSeat,
        blackSeat
      }),
      resultSummary: `Moeda ${coinFlip.face}: ${coinFlip.firstPlayerName} começa.`
    };
  };

  const startDemoTable = (gameId = "poker") => {
    window.clearInterval(local.pvpPollTimer);
    resetDemoPoolState();
    resetDemoCheckersState();
    clearDemoChessAi();
    resetChessCamera();
    local.pvpPollTimer = null;
    local.selectedGame = `${gameId}-demo`;
    local.demoTable = createDemoTableMatch(gameId);
    local.pvpHeld = [true, true, true, true, true];
    local.chessSelected = "";
    local.tableRenderKey = "";
    game.events.emit("pubpaid:music-zone", gameAudioZone(gameId));
    setPanel("table");
    updateGameState({
      activeGameId: gameId,
      lobbyPhase: "playing",
      objective: `Treinar ${gameLabel(gameId)}`,
      focus: `treino de ${gameLabel(gameId)}`,
      prompt: "Treino local: sem ficha, sem saldo travado e sem mexer na carteira."
    });
    renderPvpTable();
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
    resetCheckersCamera();
    game.events.emit("pubpaid:music-zone", gameAudioZone("checkers"));
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
    refs.pool.dataset.render = "prototype";
    refs.pool.dataset.mode = "demo";
    game.events.emit("pubpaid:music-zone", gameAudioZone("pool"));
    setPanel("pool");
    renderStablePoolStage("vale-pool:demo", renderValePoolPrototypeMarkup({ mode: "demo" }));
    local.poolDemoState = { ruleModeId: "livre", ruleMode: "Livre", scoreLabel: "BOLAS", liveNumbers: [1, 2, 3, 4, 5, 6, 7, 8, 9] };
    syncPoolRuleUi(poolRuleFormula({ demo: local.poolDemoState }));
    updateGameState({
      activeGameId: "pool",
      currentScene: "vale-pool",
      lobbyPhase: "playing",
      objective: "Treinar Vale Pool",
      focus: "prototipo aprovado de sinuca",
      prompt: "Vale Pool demo aberto com 1 bola branca e bolas 1 a 9.",
      pvpStatus: "idle",
      pvpGameId: "",
      pvpSeat: "",
      pvpMatchId: "",
      pvpMatch: null,
      pvpQueue: null
    });
    game.scene.stop("game-lobby-scene");
    game.scene.stop("pool-game-scene");
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

  const isTournamentCheckersActive = () => Boolean(local.tournamentMatch?.id && local.tournamentSession?.participant?.id);

  const tournamentSeatForCurrentParticipant = (match = local.tournamentMatch) => {
    const participantId = local.tournamentSession?.participant?.id || "";
    if (!participantId || !match) return "";
    if (match.playerOneId === participantId) return "playerOne";
    if (match.playerTwoId === participantId) return "playerTwo";
    return "";
  };

  const currentTournamentKey = () => String(refs.tournamentKey?.value || local.tournamentKey || "").trim().toUpperCase();

  const setTournamentSession = (payload = {}, key = currentTournamentKey()) => {
    local.tournamentKey = key || payload?.participant?.key || local.tournamentKey || "";
    local.tournamentSession = payload || null;
    local.tournamentMatch = payload?.currentMatch || null;
    local.tournamentPix = payload?.pix || local.tournamentPix || null;
    if (refs.tournamentKey && local.tournamentKey) refs.tournamentKey.value = local.tournamentKey;
  };

  const tournamentPlayerName = (match = {}, participantId = "") => {
    if (!participantId) return "Bye";
    if (match.playerOneId === participantId) return match.playerOne?.name || "Jogador 1";
    if (match.playerTwoId === participantId) return match.playerTwo?.name || "Jogador 2";
    return "Classificado";
  };

  const renderTournamentKeys = (payload = {}) => {
    if (!refs.tournamentKeys) return;
    const keys = Array.isArray(payload.testKeys) ? payload.testKeys : [];
    if (!keys.length) {
      refs.tournamentKeys.innerHTML = "";
      return;
    }
    refs.tournamentKeys.innerHTML = `
      <span>Chaves de teste</span>
      <div>
        ${keys.map((entry) => `
          <button type="button" data-tournament-key-fill="${entry.key}">
            <b>${escapeHtml(entry.key)}</b><small>${entry.checkedIn ? "ok" : "livre"}</small>
          </button>
        `).join("")}
      </div>
    `;
  };

  const renderTournamentPix = (payload = {}) => {
    if (!refs.tournamentPix) return;
    const participant = payload.participant || null;
    const pix = payload.pix || (participant?.status === "payment-pending" ? local.tournamentPix : null);
    if (!pix) {
      refs.tournamentPix.hidden = true;
      refs.tournamentPix.innerHTML = "";
      return;
    }
    refs.tournamentPix.hidden = false;
    refs.tournamentPix.innerHTML = `
      <div>${pix.qrSvg || ""}</div>
      <div>
        <strong>Pix da inscricao</strong>
        <span>Valor: ${escapeHtml(String(pix.amount || payload.tournament?.entryAmount || ""))} creditos</span>
        <span>Referencia: ${escapeHtml(pix.txid || participant?.paymentTxid || "")}</span>
        ${pix.pixKey ? `<span>Chave: ${escapeHtml(pix.pixKey)}</span>` : ""}
        <span>${escapeHtml(pix.copyCode || "Pix reservado. Envie o pagamento e aguarde o admin aprovar.")}</span>
      </div>
    `;
  };

  const renderTournamentBracket = (payload = {}) => {
    if (!refs.tournamentBracket) return;
    const tournament = payload.tournament || {};
    const rounds = Array.isArray(tournament.rounds) ? tournament.rounds : [];
    if (!rounds.length) {
      const participants = Array.isArray(tournament.participants) ? tournament.participants : [];
      refs.tournamentBracket.innerHTML = `
        <article class="ppg-tournament-empty">
          <strong>${tournament.checkedInCount || 0}/${tournament.participantCount || 10}</strong>
          <span>participantes confirmados</span>
        </article>
        <div class="ppg-tournament-roster">
          ${participants.map((participant) => `
            <span class="${participant.checkedIn ? "is-ready" : ""}">
              <b>${participant.seed}</b>${escapeHtml(participant.name)}
            </span>
          `).join("")}
        </div>
      `;
      return;
    }
    refs.tournamentBracket.innerHTML = rounds.map((round) => `
      <section class="ppg-tournament-round">
        <h3>${round.name || `Rodada ${round.round}`}</h3>
        ${(Array.isArray(round.matches) ? round.matches : []).map((match) => {
          const playerOneName = tournamentPlayerName(match, match.playerOneId);
          const playerTwoName = tournamentPlayerName(match, match.playerTwoId);
          const winnerOne = match.winnerParticipantId && match.winnerParticipantId === match.playerOneId;
          const winnerTwo = match.winnerParticipantId && match.winnerParticipantId === match.playerTwoId;
          const canTestAdvance = payload.testMode && match.status === "active";
          return `
            <article class="ppg-tournament-match is-${match.status || "scheduled"}">
              <span>${match.status === "active" ? "em jogo" : match.status === "finished" ? "fechado" : "aguardando"}</span>
              <div class="${winnerOne ? "is-winner" : ""}"><b>${escapeHtml(playerOneName)}</b>${canTestAdvance ? `<button type="button" data-tournament-simulate="${match.id}" data-winner-key="${match.playerOneId}">vence</button>` : ""}</div>
              <div class="${winnerTwo ? "is-winner" : ""}"><b>${escapeHtml(playerTwoName)}</b>${canTestAdvance ? `<button type="button" data-tournament-simulate="${match.id}" data-winner-key="${match.playerTwoId}">vence</button>` : ""}</div>
            </article>
          `;
        }).join("")}
      </section>
    `).join("");
  };

  const renderTournamentCurrent = (payload = {}) => {
    if (!refs.tournamentCurrent) return;
    const match = payload.currentMatch || null;
    const participant = payload.participant || null;
    if (payload.tournament?.champion) {
      refs.tournamentCurrent.innerHTML = `
        <article class="ppg-tournament-current is-champion">
          <span>campeão</span>
          <strong>${escapeHtml(payload.tournament.champion.name)}</strong>
          <small>Prêmio final entregue fora do financeiro PubPaid.</small>
        </article>
      `;
      return;
    }
    if (!participant) {
      refs.tournamentCurrent.innerHTML = `<article class="ppg-tournament-current"><span>inscricao</span><strong>Reserve com Google e WhatsApp</strong><small>O admin libera sua vaga depois do Pix.</small></article>`;
      if (refs.tournamentJoin) refs.tournamentJoin.textContent = "Reservar vaga";
      return;
    }
    if (participant.status === "payment-pending") {
      refs.tournamentCurrent.innerHTML = `
        <article class="ppg-tournament-current">
          <span>pix pendente</span>
          <strong>${escapeHtml(participant.name)}</strong>
          <small>Vaga reservada para ${escapeHtml(participant.googleEmail || "sua conta Google")}. Aguarde o admin aprovar o pagamento.</small>
        </article>
      `;
      if (refs.tournamentJoin) refs.tournamentJoin.textContent = "Atualizar inscricao";
      return;
    }
    if (participant.status === "approved" && !participant.checkedIn) {
      refs.tournamentCurrent.innerHTML = `
        <article class="ppg-tournament-current is-ready">
          <span>vaga aprovada</span>
          <strong>${escapeHtml(participant.name)}</strong>
          <small>Entre no horario de confirmacao para ficar no chaveamento.</small>
        </article>
      `;
      if (refs.tournamentJoin) refs.tournamentJoin.textContent = "Confirmar presenca";
      return;
    }
    if (!match) {
      refs.tournamentCurrent.innerHTML = `
        <article class="ppg-tournament-current">
          <span>${participant.status === "checked-in" ? "confirmado" : participant.status}</span>
          <strong>${escapeHtml(participant.name)}</strong>
          <small>Aguarde o fechamento das chaves.</small>
        </article>
      `;
      if (refs.tournamentJoin) refs.tournamentJoin.textContent = "Atualizar torneio";
      return;
    }
    const seat = match.playerOneId === participant.id ? "playerOne" : "playerTwo";
    const rival = seat === "playerOne" ? match.playerTwo?.name : match.playerOne?.name;
    refs.tournamentCurrent.innerHTML = `
      <article class="ppg-tournament-current is-ready">
        <span>seu confronto</span>
        <strong>${escapeHtml(participant.name)} x ${escapeHtml(rival || "rival")}</strong>
        <small>${match.turn === seat ? "Sua vez no tabuleiro." : "Aguardando o rival."}</small>
        <button type="button" class="primary" data-tournament-play>Jogar confronto</button>
      </article>
    `;
    if (refs.tournamentJoin) refs.tournamentJoin.textContent = "Atualizar torneio";
  };

  const renderCheckersTournament = (payload = local.tournamentSession || {}) => {
    const tournament = payload.tournament || {};
    if (refs.tournamentTitle) refs.tournamentTitle.textContent = tournament.title || "Torneio de Damas";
    if (refs.tournamentWindow) {
      const windowInfo = tournament.window || {};
      refs.tournamentWindow.textContent = windowInfo.open
        ? `Confirmacao aberta ate ${tournament.closesAtLocal || "20:00"}`
        : `Inscricao com Pix. Confirmacao: ${tournament.checkinStartsAtLocal || "19:00"} ate ${tournament.closesAtLocal || "20:00"} (${tournament.timeZone || "Acre"})`;
    }
    if (refs.tournamentStatus) {
      refs.tournamentStatus.textContent = payload.error ||
        (tournament.status === "finished"
          ? "Torneio encerrado com um vencedor."
          : tournament.status === "active"
            ? "Chaves fechadas. Jogue seu confronto quando aparecer."
            : payload.participant?.status === "payment-pending"
              ? "Pix enviado para conferencia. A vaga so libera apos aprovacao do admin."
              : payload.participant?.status === "approved"
                ? "Vaga aprovada. Confirme presenca no horario para entrar no chaveamento."
                : "Entre com Google, WhatsApp e reserve sua vaga. O Pix libera a vaga depois da aprovacao do admin.");
    }
    if (refs.tournamentStartTest) refs.tournamentStartTest.hidden = !payload.testMode;
    renderTournamentKeys(payload);
    renderTournamentPix(payload);
    renderTournamentBracket(payload);
    renderTournamentCurrent(payload);
    setPanel("tournament");
    updateGameState({
      activeGameId: "checkers",
      selectedTable: "checkers",
      lobbyPhase: "tournament",
      objective: "Torneio de Damas",
      focus: "chaveamento sem financeiro",
      prompt: refs.tournamentStatus?.textContent || "Torneio de Damas aberto."
    });
  };

  const showCheckersTournament = async () => {
    local.selectedGame = "checkers";
    game.events.emit("pubpaid:music-zone", gameAudioZone("checkers"));
    const key = currentTournamentKey();
    const payload = await fetchCheckersTournamentState(key, { testMode: isCheckersTournamentTestMode() });
    setTournamentSession(payload, key);
    renderCheckersTournament(payload);
    window.clearInterval(local.tournamentPollTimer);
    local.tournamentPollTimer = window.setInterval(async () => {
      if (refs.tournament?.hidden && !isTournamentCheckersActive()) return;
      const nextPayload = await fetchCheckersTournamentState(local.tournamentKey, { testMode: isCheckersTournamentTestMode() });
      if (nextPayload?.ok || nextPayload?.tournament) {
        setTournamentSession(nextPayload, local.tournamentKey);
        if (!refs.tournament?.hidden) renderCheckersTournament(nextPayload);
        if (isTournamentCheckersActive() && !refs.checkers.hidden) renderPvpCheckers();
      }
    }, 2500);
  };

  const renderPvpCheckers = () => {
    if (local.pvpRenderBusy) return;
    const tournamentMode = isTournamentCheckersActive();
    const demoMode = !tournamentMode && isCheckersDemoActive();
    const match = tournamentMode ? local.tournamentMatch : demoMode ? local.demoCheckers : gameState.pvpMatch;
    const seat = tournamentMode ? tournamentSeatForCurrentParticipant(match) : demoMode ? "playerOne" : gameState.pvpSeat;
    const board = Array.isArray(match?.board) ? match.board : [];
    if (!demoMode && !tournamentMode && match?.status === "readying") {
      setPanel("matchmaking");
      renderMatchmakingState();
      return;
    }
    if (!board.length || !seat) return;
    local.pvpRenderBusy = true;
    let selected = tournamentMode ? local.tournamentSelected : demoMode ? local.demoSelected : local.pvpSelected;
    let legalMoves = tournamentMode ? local.tournamentLegalMoves : demoMode ? local.demoLegalMoves : local.pvpLegalMoves;
    if (match.forcedPiece && match.status === "active" && match.turn === seat && !selected) {
      selected = { ...match.forcedPiece };
      legalMoves = getCheckersLegalMoves(board, seat, match.forcedPiece || null)
        .filter((move) => move.from.row === match.forcedPiece.row && move.from.col === match.forcedPiece.col);
      if (demoMode) {
        local.demoSelected = selected;
        local.demoLegalMoves = legalMoves;
      } else if (tournamentMode) {
        local.tournamentSelected = selected;
        local.tournamentLegalMoves = legalMoves;
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
    refs.checkersBoard.dataset.mode = tournamentMode ? "tournament" : demoMode ? "demo" : "pvp";
    refs.checkersBoard.dataset.aiThinking = demoMode && local.demoAiThinking ? "true" : "false";
    refs.checkersArena?.setAttribute("data-turn-seat", match.turn || "idle");
    refs.checkersArena?.setAttribute("data-checkers-mode", tournamentMode ? "tournament" : demoMode ? "demo" : "pvp");
    if (tournamentMode) {
      if (refs.checkersCoinFlip) refs.checkersCoinFlip.hidden = true;
    } else {
      startCheckersCinematic(match);
      renderCheckersCoinFlip(match, demoMode);
    }
    const checkersMoveFeedback = syncCheckersMoveFeedback(match);
    setCheckersMoveToast(checkersMoveFeedback);
    applyCheckersCamera(match, seat);
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
          const aiPreview = demoMode && local.demoAiThinking ? local.demoAiPreviewMove : null;
          const className = [
            "ppg-dom-cell",
            dark ? "is-dark" : "is-light",
            own ? "is-own" : "",
            owner && !own ? "is-rival" : "",
            selected?.row === rowIndex && selected?.col === colIndex ? "is-selected" : "",
            targetKeys.has(`${displayRow}-${displayCol}`) ? "is-target" : "",
            forcedPiece?.row === rowIndex && forcedPiece?.col === colIndex ? "is-forced" : "",
            aiPreview?.from?.row === rowIndex && aiPreview?.from?.col === colIndex ? "is-ai-preview-from" : "",
            aiPreview?.to?.row === rowIndex && aiPreview?.to?.col === colIndex ? "is-ai-preview-to" : "",
            aiPreview?.capture?.row === rowIndex && aiPreview?.capture?.col === colIndex ? "is-ai-preview-capture" : "",
            lastMove?.from?.row === rowIndex && lastMove?.from?.col === colIndex ? "is-last-from" : "",
            lastMove?.to?.row === rowIndex && lastMove?.to?.col === colIndex ? "is-last-to" : "",
            lastMove?.capture?.row === rowIndex && lastMove?.capture?.col === colIndex ? "is-last-capture" : ""
          ].filter(Boolean).join(" ");
          const disabled = local.checkersIntroLocked || match.status !== "active" || match.turn !== seat ? " disabled" : "";
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
        playCheckersMoveSound(match.lastMove?.crowned ? "crown" : match.lastMove?.capture ? "capture" : "move");
      }
      const ownPieces = countCheckersPieces(board, seat);
      const rivalPieces = board.flat().filter((piece) => getCheckersOwner(piece) && getCheckersOwner(piece) !== seat).length;
      const ownCaptured = Math.max(0, 12 - rivalPieces);
      const rivalCaptured = Math.max(0, 12 - ownPieces);
      refs.checkersBoard.dataset.scoreLeader = ownPieces === rivalPieces ? "tied" : ownPieces > rivalPieces ? "self" : "rival";
      const rivalSeat = seat === "playerOne" ? "playerTwo" : "playerOne";
      const availableMoves = getCheckersLegalMoves(board, seat, match.forcedPiece || null);
      const captureMoves = availableMoves.filter((move) => move.capture);
      const recentHistory = Array.isArray(match.checkersHistory) ? match.checkersHistory.slice(-5).reverse() : [];
      const coin = match.coinFlip || {};
      const firstSeat = coin.firstSeat || "";
      const firstName = firstSeat ? displayNameFor(match[firstSeat]) : "";
      const coinLine = tournamentMode
        ? " Torneio: sem depósito, sem escrow e sem mexer na carteira."
        : demoMode ? " Treino contra máquina: não usa saldo." : coin.face && firstName ? ` Moeda ${coin.face}: ${firstName} começa.` : "";
      const isAbandoned = match.status === "abandoned";
      const abandonedBySelf = isAbandoned && match.abandonedBy === seat;
      const abandonSeconds = secondsUntil(match.deadlineAt);
      if (refs.checkersKicker) refs.checkersKicker.textContent = tournamentMode ? "torneio" : demoMode ? "treino local" : "ranked pvp";
      refs.checkersTitle.textContent =
        local.checkersIntroLocked
          ? "Moeda no ar"
        : match.status === "finished"
          ? "Mesa encerrada"
          : tournamentMode
            ? match.turn === seat ? "Sua vez no torneio" : "Vez do rival"
          : demoMode && match.turn === "playerTwo"
            ? "Máquina pensando..."
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
        local.checkersIntroLocked
          ? "Aguarde a moeda cair. A partida libera automaticamente."
        : match.status === "finished"
          ? match.resultSummary || "Partida encerrada."
          : tournamentMode
            ? match.turn === seat
              ? `Jogue seu confronto do torneio.${coinLine}`
              : `Aguardando o rival jogar o confronto.${coinLine}`
          : demoMode && match.turn === "playerTwo"
            ? "A máquina pensa por 3 segundos. Observe a peça e a casa piscando antes do movimento."
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
        refs.forfeitCheckers.disabled = tournamentMode ? false : demoMode ? false : match.status !== "active" && match.status !== "abandoned";
        refs.forfeitCheckers.textContent = tournamentMode ? "Voltar ao torneio" : demoMode ? "Reiniciar demo" : match.status === "finished" ? "Mesa encerrada" : "Desistir";
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
        label: tournamentMode ? "torneio" : demoMode ? "treino" : "sua mesa"
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
        label: tournamentMode ? "confronto" : demoMode ? "máquina local" : "online"
      });
      if (refs.checkersTimer) {
        const turnLeft = Math.max(0, 45 - secondsSince(match.updatedAt || match.startedAt || match.createdAt));
        refs.checkersTimer.textContent = tournamentMode ? "sem ficha" : demoMode ? "demo" : match.status === "abandoned" ? `${abandonSeconds}s` : match.status === "active" ? `${turnLeft}s` : "--";
      }
      if (refs.checkersMoves) refs.checkersMoves.textContent = String(match.moveCount || 0);
      if (refs.checkersCaptured) refs.checkersCaptured.innerHTML = renderCheckersCapturedMarkup({ ownCaptured, rivalCaptured });
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
          realPvp: !demoMode && !tournamentMode,
          demo: demoMode,
          tournament: tournamentMode
        },
        objective: tournamentMode ? "Vencer confronto do torneio" : demoMode ? "Treinar Damas" : "Vencer a Dama real",
        focus: tournamentMode ? "tabuleiro de torneio de dama" : demoMode ? "tabuleiro demo de dama" : "tabuleiro PvP de dama",
        prompt: refs.checkersStatus.textContent
      });
      if (match.status === "finished") {
        if (!tournamentMode) {
          window.clearInterval(local.pvpPollTimer);
          local.pvpPollTimer = null;
        }
        const won = match.winner && match.winner === seat;
        const result = match.winner ? (won ? "win" : "loss") : "draw";
        const settlement = match.settlement || {};
        const stake = Number(settlement.stake || match.stake || 0);
        const payout = Number(settlement.payout || 0);
        const fee = Number(settlement.houseFee || 0);
        const delta = match.winner ? (won ? payout - stake : -stake) : 0;
        const body = tournamentMode
          ? `${match.resultSummary || "Confronto encerrado."} O prêmio final do torneio é entregue fora do backend financeiro.`
          : demoMode
          ? `${match.resultSummary || "Treino encerrado."} Nada foi apostado e a carteira nao foi alterada.`
          : match.winner
          ? `${match.resultSummary || "Partida encerrada."} ${won ? `Você recebeu ${payout} créditos reais.` : "Você perdeu a mesa."} Casa: ${fee}.`
          : `${match.resultSummary || "Empate."} Entrada devolvida.`;
        const resultKey = `${match.id}:${match.updatedAt || match.finishedAt || ""}`;
        if (local.resultHandledMatchId !== resultKey) {
          local.resultHandledMatchId = resultKey;
          if (tournamentMode) {
            local.tournamentMatch = null;
            void showCheckersTournament();
          } else {
            showResult("checkers", result, body, { delta });
          }
        }
      }
    } finally {
      local.pvpRenderBusy = false;
    }
  };

  const escapeHtml = (value = "") => String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

  const cardMeta = (card = {}, fallbackIndex = 0) => {
    const fallbackSuits = ["hearts", "spades", "diamonds", "clubs", "spades"];
    const rankLabel = (rank) => ({
      11: "J",
      12: "Q",
      13: "K",
      14: "A"
    }[rank] || String(rank));
    if (typeof card === "number") {
      return {
        rank: card === 11 ? "A" : String(card),
        suit: fallbackSuits[fallbackIndex % fallbackSuits.length],
        value: card
      };
    }
    const rawSuit = card?.suit || fallbackSuits[fallbackIndex % fallbackSuits.length];
    return {
      rank: typeof card?.rank === "number" ? rankLabel(card.rank) : card?.rank ?? "",
      suit: rawSuit,
      value: card?.rank ?? ""
    };
  };

  const cardSuitIcon = (suit = "") => ({
    hearts: "♥",
    diamonds: "♦",
    clubs: "♣",
    spades: "♠",
    ouros: "♦",
    espadas: "♠",
    copas: "♥",
    paus: "♣"
  }[suit] || suit || "♦");

  const cardSuitClass = (suit = "") => /heart|diamond|ouro|copa/i.test(suit) ? " is-red" : " is-black";

  const cardLabel = (card = {}, fallbackIndex = 0) => {
    if (!card && card !== 0) return "";
    const meta = cardMeta(card, fallbackIndex);
    return `${meta.rank}${cardSuitIcon(meta.suit)}`;
  };

  const renderPlayingCard = (card, index = 0, options = {}) => {
    const {
      dataset = "",
      disabled = false,
      empty = false,
      faceDown = false,
      held = false,
      note = "",
      tag = "button"
    } = options;
    if (empty) {
      return `<span class="ppg-playing-card is-empty"><span class="ppg-card-pip">+</span><small>${escapeHtml(note || "mesa")}</small></span>`;
    }
    const meta = cardMeta(card, index);
    const suitIcon = cardSuitIcon(meta.suit);
    const label = escapeHtml(meta.rank);
    const attrs = tag === "button"
      ? `type="button" ${dataset} ${disabled ? "disabled" : ""}`
      : "";
    const className = `ppg-playing-card${cardSuitClass(meta.suit)}${held ? " is-held" : ""}${faceDown ? " is-back" : ""}`;
    const body = faceDown
      ? `<span class="ppg-card-back-mark">PP</span><small>${escapeHtml(note || "rival")}</small>`
      : `
        <span class="ppg-card-corner is-top"><b>${label}</b><i>${suitIcon}</i></span>
        <span class="ppg-card-pip">${suitIcon}</span>
        <span class="ppg-card-corner is-bottom"><b>${label}</b><i>${suitIcon}</i></span>
        <small>${escapeHtml(note)}</small>
      `;
    return `<${tag} class="${className}" ${attrs}>${body}</${tag}>`;
  };

  const dicePipsFor = (value = 0) => ({
    1: [5],
    2: [1, 9],
    3: [1, 5, 9],
    4: [1, 3, 7, 9],
    5: [1, 3, 5, 7, 9],
    6: [1, 3, 4, 6, 7, 9]
  }[Number(value)] || []);

  const renderDieFace = (value = 0, index = 0) => {
    const face = Number(value || 0);
    const pips = dicePipsFor(face);
    const cells = Array.from({ length: 9 }, (_, cellIndex) => {
      const position = cellIndex + 1;
      return `<i class="${pips.includes(position) ? "is-on" : ""}"></i>`;
    }).join("");
    return `
      <span class="ppg-die-face${face ? "" : " is-hidden-face"}" aria-label="${face ? `Dado ${index + 1}: ${face}` : `Dado ${index + 1} oculto`}">
        ${cells}
        <b>${face || "?"}</b>
      </span>
    `;
  };

  const sumCards21 = (cards = []) => {
    let total = (Array.isArray(cards) ? cards : []).reduce((sum, card) => sum + Number(card || 0), 0);
    let aces = (Array.isArray(cards) ? cards : []).filter((card) => Number(card || 0) === 11).length;
    while (total > 21 && aces > 0) {
      total -= 10;
      aces -= 1;
    }
    return total;
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
    const state = decorateChessState(match.chessState || {});
    const board = chessBoardFromFen(state.fen || "");
    const demoMode = local.demoTable === match;
    const perspectiveColor = chessColorForSeat(state, seat);
    const activeColor = state.turnColor || "white";
    const activeSeat = chessSeatForColor(state, activeColor);
    const demoPlayerTurn = demoMode && activeSeat === "playerOne" && !local.demoChessAiThinking;
    const canAct = !local.chessIntroLocked && match.status === "active" && (demoPlayerTurn || (!demoMode && activeSeat === seat));
    const legalMoves = canAct ? state.legalMoves || [] : [];
    const forcedMoves = canAct ? state.forcedMoves || [] : [];
    const selectedMoves = local.chessSelected
      ? legalMoves.filter((move) => move.from === local.chessSelected)
      : [];
    const legalFromSet = new Set(legalMoves.map((move) => move.from));
    const forcedFromSet = new Set(forcedMoves.map((move) => move.from));
    const selectedTargetSet = new Set(selectedMoves.map((move) => move.to));
    const lastMove = state.lastMove || state.history?.slice?.(-1)?.[0] || null;
    const lastFrom = lastMove?.from || "";
    const lastTo = lastMove?.to || "";
    const aiPreview = demoMode && local.demoChessAiThinking ? local.demoChessAiPreviewMove : null;
    const checkedKingToken = state.inCheck ? activeColor === "black" ? "k" : "K" : "";
    const guideFrom = forcedMoves[0]?.from || legalMoves[0]?.from || "";
    const guideTo = selectedMoves[0]?.to || "";
    const handSquare = guideTo || guideFrom;
    return Array.from({ length: 64 }, (_, index) => {
      const displayRow = Math.floor(index / 8);
      const displayCol = index % 8;
      const file = perspectiveColor === "black" ? "abcdefgh"[7 - displayCol] : "abcdefgh"[displayCol];
      const rank = perspectiveColor === "black" ? displayRow + 1 : 8 - displayRow;
      const square = `${file}${rank}`;
      const piece = board.get(square) || "";
      const pieceMeta = CHESS_PIECES[piece] || null;
      const pieceColor = pieceMeta?.side || "";
      const ownPiece = pieceColor && pieceColor === perspectiveColor;
      const dark = (displayRow + displayCol) % 2 === 1;
      const selected = local.chessSelected === square;
      const legalOrigin = legalFromSet.has(square);
      const forcedOrigin = forcedFromSet.has(square);
      const legalTarget = selectedTargetSet.has(square);
      const lastSource = lastFrom === square;
      const lastTarget = lastTo === square;
      const aiPreviewFrom = aiPreview?.from === square;
      const aiPreviewTo = aiPreview?.to === square;
      const aiPreviewCapture = Boolean(aiPreview?.capture && aiPreviewTo);
      const inCheck = Boolean(checkedKingToken && piece === checkedKingToken);
      const guided = handSquare === square;
      const label = pieceMeta ? `${square}: ${pieceMeta.name}` : square;
      const pieceMarkup = pieceMeta
        ? `
          <span class="ppg-chess-piece is-${pieceMeta.side} is-${pieceMeta.role}" aria-hidden="true">
            <span class="ppg-chess-piece-shape"></span>
          </span>
        `
        : "";
      const glowMarkup = guided && canAct ? `<span class="ppg-chess-guide-glow" aria-hidden="true"></span>` : "";
      return `<button type="button" class="ppg-dom-chess-cell ${dark ? "is-dark" : "is-light"}${selected ? " is-selected" : ""}${ownPiece ? " is-own" : ""}${legalOrigin ? " is-legal-origin" : ""}${forcedOrigin ? " is-forced-origin" : ""}${legalTarget ? " is-legal-target" : ""}${aiPreviewFrom ? " is-ai-preview-from" : ""}${aiPreviewTo ? " is-ai-preview-to" : ""}${aiPreviewCapture ? " is-ai-preview-capture" : ""}${lastSource ? " is-last-from" : ""}${lastTarget ? " is-last-to" : ""}${inCheck ? " is-in-check" : ""}${guided ? " is-guided" : ""}" data-chess-square="${square}" aria-label="${label}">${pieceMarkup}${glowMarkup}</button>`;
    }).join("");
  };

  const renderChessHistoryMarkup = (state = {}) => {
    const history = Array.isArray(state.history) ? state.history.slice(-10) : [];
    if (!history.length) {
      return `<article class="ppg-chess-empty"><strong>Partida pronta</strong><span>As brancas fazem o primeiro lance.</span></article>`;
    }
    return history.map((move) => `
      <article>
        <span>${move.index || ""}</span>
        <strong>${move.san || move.lan || `${move.from}-${move.to}`}</strong>
        <small>${formatChessMove(move)}</small>
      </article>
    `).join("");
  };

  const renderChessCapturedPieces = (items = []) => {
    if (!items.length) return `<small>nenhuma</small>`;
    return items.slice(0, 16).map((item) => `
      <i class="ppg-captured-chess-piece is-${item.side} is-${item.role || "p"}" title="${item.label}" aria-label="${item.label}">
        <span></span>
      </i>
    `).join("");
  };

  const renderChessCapturedMarkup = (match = {}, seat = "playerOne") => {
    const state = decorateChessState(match.chessState || {});
    const capturedBySeat = [];
    const capturedByRival = [];
    (Array.isArray(state.history) ? state.history : []).forEach((move) => {
      if (!move.capture) return;
      const side = move.color === "white" ? "black" : "white";
      const role = move.captured || "p";
      const item = {
        side,
        role,
        label: `${CHESS_ROLE_NAMES[role] || "Peça"} ${side === "white" ? "branca" : "preta"}`
      };
      if (move.seat === seat) capturedBySeat.push(item);
      else capturedByRival.push(item);
    });
    return `
      <div class="ppg-captured-tray ppg-chess-captured" aria-label="Peças comidas no xadrez">
        <article>
          <span>voce comeu</span>
          <div>${renderChessCapturedPieces(capturedBySeat)}</div>
        </article>
        <article>
          <span>rival comeu</span>
          <div>${renderChessCapturedPieces(capturedByRival)}</div>
        </article>
      </div>
    `;
  };

  const renderChessGuidanceMarkup = (match = {}, seat = "playerOne", demoMode = false) => {
    const state = decorateChessState(match.chessState || {});
    const turnSeat = chessSeatForColor(state, state.turnColor);
    const canAct = !local.chessIntroLocked && match.status === "active" && (
      demoMode ? turnSeat === "playerOne" && !local.demoChessAiThinking : turnSeat === seat
    );
    const forcedMoves = canAct ? state.forcedMoves || [] : [];
    const selectedMoves = canAct && local.chessSelected
      ? (state.legalMoves || []).filter((move) => move.from === local.chessSelected)
      : [];
    const guideMoves = selectedMoves.length ? selectedMoves : forcedMoves.length ? forcedMoves : canAct ? (state.legalMoves || []).slice(0, 6) : [];
    const guideTitle = state.inCheck
      ? "Lances obrigatorios"
      : demoMode && local.demoChessAiThinking
        ? "Máquina pensando"
      : forcedMoves.length === 1
        ? "Unico lance legal"
        : selectedMoves.length
          ? "Destinos legais"
          : canAct
            ? "Guia do turno"
            : "Aguardando";
    const guideCopy = state.inCheck
      ? "Voce precisa sair do xeque. O brilho marca a prioridade."
      : demoMode && local.demoChessAiThinking
        ? "A máquina pensa por 3 segundos. A origem e o alvo piscam antes do lance."
      : forcedMoves.length === 1
        ? "So existe um lance legal nesta posicao."
        : selectedMoves.length
          ? "Escolha um destes destinos para concluir o lance."
          : canAct
            ? "O brilho indica uma peca com lance legal."
            : "O rival esta pensando.";
    const moveItems = guideMoves.slice(0, 6).map((move) => `<li>${formatChessMove(move)}</li>`).join("");
    const rivalSeat = seat === "playerOne" ? "playerTwo" : "playerOne";
    const ownPlayer = match[seat] || currentPvpPlayer() || { name: "Você" };
    const rivalPlayer = match[rivalSeat] || (demoMode ? { name: "Máquina" } : rivalPvpPlayer()) || { name: "IA" };
    return `
      <div class="ppg-game-avatar-row">
        ${renderGameAvatarMarkup(ownPlayer, "Você", "player")}
        ${renderGameAvatarMarkup(rivalPlayer, demoMode ? "Máquina" : "Rival", "ai")}
      </div>
      <div class="ppg-chess-status-card${state.inCheck ? " is-check" : ""}">
        <span>${CHESS_COLOR_NAMES[state.turnColor] || "lado"} em turno</span>
        <strong>${getChessTurnSummary(match, seat, demoMode)}</strong>
        <small>${state.legalMoves?.length || 0} lances legais</small>
      </div>
      <div class="ppg-chess-guidance">
        <span>${guideTitle}</span>
        <strong>${guideCopy}</strong>
        <ol>${moveItems || "<li>Sem lance legal disponivel.</li>"}</ol>
      </div>
      ${renderChessCapturedMarkup(match, seat)}
      <div class="ppg-chess-history">
        <span>Planilha de lances</span>
        ${renderChessHistoryMarkup(state)}
      </div>
    `;
  };

  const clampUiNumber = (value, min, max, fallback = min) => {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return fallback;
    return Math.max(min, Math.min(max, numeric));
  };

  const safeBallColor = (value = "") =>
    /^#[0-9a-f]{3,8}$/i.test(String(value || "")) ? String(value) : "#fff6dc";

  const poolPocketedItems = (state = {}) => {
    if (Array.isArray(state.pocketedBalls) && state.pocketedBalls.length) {
      return state.pocketedBalls.map((ball) => ({
        label: ball.label || ball.id || "?",
        color: safeBallColor(ball.color),
        shot: ball.shot || ""
      }));
    }
    return (Array.isArray(state.balls) ? state.balls : [])
      .filter((ball) => ball.pocketed && !ball.cue && Number(ball.id) !== 0)
      .map((ball) => ({
        label: ball.label || ball.id || "?",
        color: safeBallColor(ball.color),
        shot: ""
      }));
  };

  const renderPoolPocketedMarkup = (state = {}) => {
    const items = poolPocketedItems(state);
    return `
      <span>bolas fora da mesa <em>${items.length}</em></span>
      <div class="ppg-pool-pocketed-list">
        ${items.length
          ? items.map((ball) => `<b title="Bola ${ball.label}${ball.shot ? ` - tacada ${ball.shot}` : ""}" style="--ball:${ball.color}">${ball.label}</b>`).join("")
          : "<small>Nenhuma bola fora.</small>"}
      </div>
    `;
  };

  const POOL_SPINS = [
    { id: "centro", label: "Centro", mark: "•" },
    { id: "segue", label: "Segue", mark: "↑" },
    { id: "puxa", label: "Puxa", mark: "↓" },
    { id: "esq", label: "Esq", mark: "←" },
    { id: "dir", label: "Dir", mark: "→" }
  ];

  const normalizePoolSpin = (value = "centro") =>
    POOL_SPINS.some((spin) => spin.id === value) ? value : "centro";

  const POOL_RULE_TUTORIALS = {
    livre: {
      title: "Modo Livre",
      lines: [
        "Branca + bolas 1 a 9 em diamante.",
        "Encaçape qualquer bola de jogo.",
        "Vence quem derrubar mais bolas."
      ]
    },
    brasileira: {
      title: "Sinuca Brasileira",
      lines: [
        "Branca + sete bolas coloridas oficiais.",
        "A bola da vez e sempre a menor na mesa.",
        "Falta entrega pontos ao rival."
      ]
    },
    parimpar: {
      title: "Par ou Impar",
      lines: [
        "Branca + bolas 2 a 15.",
        "Primeira bola valida define PAR ou IMPAR.",
        "A 15 fecha a partida depois do grupo."
      ]
    }
  };

  const normalizePoolRuleModeUi = (value = "livre") => {
    const mode = String(value || "livre").toLowerCase().replace(/[^a-z0-9]/g, "");
    if (mode === "brasileira" || mode === "sinucabrasileira" || mode === "br") return "brasileira";
    if (mode === "parimpar" || mode === "parouimpar" || mode === "tacoforte") return "parimpar";
    return "livre";
  };

  const poolRuleTutorial = (mode = "livre") => POOL_RULE_TUTORIALS[mode] || POOL_RULE_TUTORIALS.livre;

  const poolGroupForNumber = (number = 0) => Number(number) % 2 === 0 ? "PAR" : "IMPAR";

  const poolLiveNumbers = (state = {}) => (Array.isArray(state.balls) ? state.balls : [])
    .filter((ball) => !ball.cue && Number(ball.id) > 0 && !ball.pocketed)
    .map((ball) => Number(ball.id))
    .sort((a, b) => a - b);

  const poolRuleFormula = ({ state = {}, seat = "", rivalSeat = "", demo = null } = {}) => {
    const mode = normalizePoolRuleModeUi(state.ruleMode || demo?.ruleModeId || demo?.ruleMode || "livre");
    const demoLive = Array.isArray(demo?.liveNumbers)
      ? demo.liveNumbers.map(Number).filter((n) => Number.isFinite(n)).sort((a, b) => a - b)
      : [];
    const live = poolLiveNumbers(state);
    const liveNumbers = live.length ? live : demoLive;
    const scoreLabel = String(state.scoreLabel || demo?.scoreLabel || (mode === "brasileira" ? "PONTOS" : "BOLAS")).toUpperCase();
    const ownGroup = String((seat && state[`${seat}Group`]) || demo?.playerGroup || "").toUpperCase();
    const rivalGroup = String((rivalSeat && state[`${rivalSeat}Group`]) || demo?.aiGroup || "").toUpperCase();
    const nextBall = Number(state.nextBall || demo?.next || liveNumbers[0] || 0);
    if (mode === "brasileira") {
      return {
        mode,
        title: "Sinuca Brasileira",
        badge: nextBall ? `BOLA ${nextBall}` : "LIMPE A MESA",
        target: nextBall ? `Mire primeiro na bola ${nextBall}.` : "Todas as bolas oficiais caíram.",
        score: "Cada bola vale seu número. Falta entrega 7 pontos ao rival.",
        win: "Vence quem somar mais pontos depois da última bola.",
        manual: [
          "Bolas: branca + 1 vermelha, 2 amarela, 3 verde, 4 marrom, 5 azul, 6 rosa, 7 preta.",
          "A bola da vez é sempre a menor bola ainda na mesa.",
          "A tacada correta precisa atingir a bola da vez antes das outras.",
          "Se derrubar a branca ou errar a bola da vez, o rival recebe 7 pontos.",
          "A pontuação vem do valor das bolas encaçapadas."
        ],
        scoreLabel,
      };
    }
    if (mode === "parimpar") {
      const ownRemaining = ownGroup ? liveNumbers.filter((n) => n !== 15 && poolGroupForNumber(n) === ownGroup) : [];
      return {
        mode,
        title: "Par ou Ímpar",
        badge: ownGroup ? ownGroup : "GRUPO ABERTO",
        target: ownGroup
          ? ownRemaining.length ? `Mire suas bolas ${ownGroup}: ${ownRemaining.join(", ")}.` : "Seu grupo acabou: agora mire a bola 15."
          : "Primeira bola válida que cair define PAR ou ÍMPAR para quem derrubou.",
        score: ownGroup
          ? `Você é ${ownGroup}; rival é ${rivalGroup || (ownGroup === "PAR" ? "ÍMPAR" : "PAR")}. Bola do rival pontua para ele.`
          : "Ainda não existe dono dos grupos. A primeira bola válida decide.",
        win: "Depois de limpar seu grupo, encaçape a 15 para vencer. Se a 15 cair antes, perde.",
        manual: [
          "Bolas: branca + bolas 2 a 15.",
          "A primeira bola válida encaçapada define o grupo de quem derrubou: par ou ímpar.",
          "Depois disso, cada jogador mira nas bolas do próprio grupo.",
          "Bola do rival que cair conta para o rival.",
          "A bola 15 só pode cair depois que seu grupo acabar; antes disso ela castiga e entrega a vitória."
        ],
        scoreLabel,
      };
    }
    return {
      mode,
      title: "Modo Livre",
      badge: "QUALQUER BOLA",
      target: liveNumbers.length ? `Mire qualquer bola de jogo: ${liveNumbers.join(", ")}.` : "Mesa limpa.",
      score: "Cada bola encaçapada soma 1 para quem derrubou.",
      win: "Vence quem derrubar mais bolas até o fim da mesa.",
      manual: [
        "Bolas: branca + bolas 1 a 9 em diamante.",
        "Qualquer bola de jogo pode ser escolhida e encaçapada.",
        "Cada bola vale 1 no placar.",
        "A branca cair apenas reposiciona a tacadeira.",
        "Vence quem tiver mais bolas encaçapadas quando a mesa acabar."
      ],
      scoreLabel,
    };
  };

  const renderPoolRuleCardMarkup = (formula = poolRuleFormula()) => `
    <span>regra viva</span>
    <strong>${escapeHtml(formula.badge)}</strong>
    <small>${escapeHtml(formula.target)}</small>
    <small>${escapeHtml(formula.score)}</small>
    <button type="button" data-pool-rules-toggle>Manual</button>
  `;

  const renderPoolRuleModalMarkup = (formula = poolRuleFormula()) => `
    <span class="ppg-kicker">${escapeHtml(formula.title)}</span>
    <h3>${escapeHtml(formula.badge)}</h3>
    <p>${escapeHtml(formula.target)}</p>
    <ul>
      ${formula.manual.map((line) => `<li>${escapeHtml(line)}</li>`).join("")}
    </ul>
    <p><strong>Pontuação:</strong> ${escapeHtml(formula.score)}</p>
    <p><strong>Vitória:</strong> ${escapeHtml(formula.win)}</p>
  `;

  const syncPoolRuleUi = (formula = poolRuleFormula()) => {
    if (refs.poolRuleCard) refs.poolRuleCard.innerHTML = renderPoolRuleCardMarkup(formula);
    if (refs.poolRuleModalBody) refs.poolRuleModalBody.innerHTML = renderPoolRuleModalMarkup(formula);
    if (refs.poolRuleModal) refs.poolRuleModal.hidden = !local.poolRulesOpen;
  };

  const currentPoolRuleFormula = () => {
    if (gameState.pvpGameId === "pool" && gameState.pvpMatch?.poolState) {
      const seat = gameState.pvpSeat || "playerOne";
      return poolRuleFormula({
        state: gameState.pvpMatch.poolState,
        seat,
        rivalSeat: seat === "playerOne" ? "playerTwo" : "playerOne",
      });
    }
    return poolRuleFormula({ demo: local.poolDemoState || { ruleModeId: "livre", scoreLabel: "BOLAS" } });
  };

  const poolPlayerRuleLabel = (formula = poolRuleFormula(), group = "", owner = "") => {
    const currentGroup = String(group || "").toUpperCase();
    const prefix = owner ? `${owner}: ` : "";
    if (formula.mode === "parimpar") return currentGroup ? `${prefix}${currentGroup}` : `${prefix}DEFINE GRUPO`;
    if (formula.mode === "brasileira") return formula.badge;
    return "QUALQUER BOLA";
  };

  const renderPoolEffectMarkup = (active = "centro") => {
    const current = normalizePoolSpin(active);
    return `
      <span>efeito</span>
      <div class="ppg-pool-effect-pad" role="group" aria-label="Efeito da bola branca">
        ${POOL_SPINS.map((spin) => `
          <button type="button" class="${spin.id === current ? "is-active" : ""}" data-dom-pool-spin="${spin.id}" aria-label="Efeito ${spin.label}">
            <b>${spin.mark}</b><small>${spin.label}</small>
          </button>
        `).join("")}
      </div>
    `;
  };

  const valePoolFrameSrc = (mode = "demo", matchId = "") => {
    const params = new URLSearchParams({
      mode: mode === "pvp" ? "pvp" : "demo",
      source: "pubpaid",
      v: window.pubpaidBuildVersion || "dev"
    });
    if (matchId) params.set("match", matchId);
    return `./games/vale-pool/index.html?${params.toString()}`;
  };

  const renderValePoolPlayerBadge = (player = {}, label = "", score = 0, active = false, side = "", ruleLabel = "") => {
    const picture = String(player?.picture || "");
    return `
      <aside class="ppg-vale-pool-player${active ? " is-active" : ""}" ${side ? `data-vale-pool-side="${escapeHtml(side)}"` : ""}>
        ${player?.robot
          ? `<span class="ppg-vale-pool-robot" aria-hidden="true"><i></i></span>`
          : picture
          ? `<img src="${escapeHtml(picture)}" alt="">`
          : `<span>${escapeHtml(initialFor(player))}</span>`}
        <strong>${escapeHtml(displayNameFor(player))}</strong>
        <small data-vale-pool-status>${escapeHtml(label)}</small>
        <small class="ppg-vale-pool-rule-tag" data-vale-pool-rule>${escapeHtml(ruleLabel)}</small>
        <b class="ppg-vale-pool-count"><em data-vale-pool-score>${Number(score || 0)}</em><small data-vale-pool-score-label>BOLAS</small></b>
        <button type="button" data-pool-rules-toggle>REGRAS</button>
      </aside>
    `;
  };

  const updateValePoolDemoChrome = (payload = {}) => {
    if (!isPoolDemoActive() || refs.pool?.dataset.render !== "prototype") return;
    local.poolDemoState = payload;
    const formula = poolRuleFormula({ demo: payload });
    const playerCard = refs.poolStage?.querySelector('[data-vale-pool-side="player"]');
    const iaCard = refs.poolStage?.querySelector('[data-vale-pool-side="ia"]');
    const playerScore = Number(payload.playerBalls ?? payload.playerScore ?? 0);
    const aiScore = Number(payload.aiBalls ?? payload.aiScore ?? 0);
    const scoreLabel = String(payload.scoreLabel || "BOLAS").toUpperCase();
    if (playerCard) {
      playerCard.classList.toggle("is-active", payload.turn !== "ia");
      const score = playerCard.querySelector("[data-vale-pool-score]");
      const scoreLabelNode = playerCard.querySelector("[data-vale-pool-score-label]");
      const status = playerCard.querySelector("[data-vale-pool-status]");
      const rule = playerCard.querySelector("[data-vale-pool-rule]");
      if (score) score.textContent = String(playerScore);
      if (scoreLabelNode) scoreLabelNode.textContent = scoreLabel;
      if (rule) rule.textContent = poolPlayerRuleLabel(formula, payload.playerGroup, "VOCE");
      if (status) status.textContent = payload.winner
        ? (payload.winner === "player" ? "venceu" : "fim")
        : payload.setupPhase && payload.setupPhase !== "done" ? "moeda"
        : payload.turn === "ia" ? "aguardando" : "sua vez";
    }
    if (iaCard) {
      iaCard.classList.toggle("is-active", payload.turn === "ia");
      const score = iaCard.querySelector("[data-vale-pool-score]");
      const scoreLabelNode = iaCard.querySelector("[data-vale-pool-score-label]");
      const status = iaCard.querySelector("[data-vale-pool-status]");
      const rule = iaCard.querySelector("[data-vale-pool-rule]");
      if (score) score.textContent = String(aiScore);
      if (scoreLabelNode) scoreLabelNode.textContent = scoreLabel;
      if (rule) rule.textContent = poolPlayerRuleLabel(formula, payload.aiGroup, "IA");
      if (status) status.textContent = payload.winner
        ? (payload.winner === "ia" ? "venceu" : "fim")
        : payload.setupPhase && payload.setupPhase !== "done" ? "moeda"
        : payload.turn === "ia" ? "mirando" : "ia treino";
    }
    updateGameState({
      prompt: `${payload.message || "Treino Vale Pool"} | dentro ${payload.ballsInside ?? "-"} fora ${payload.ballsOutside ?? "-"} jogadas ${payload.shots ?? "-"}`
    });
    syncPoolRuleUi(formula);
    const winner = String(payload.winner || "");
    if (winner && local.poolDemoResultKey !== winner) {
      local.poolDemoResultKey = winner;
      const result = winner === "draw"
        ? "draw"
        : winner === "player" ? "win" : "loss";
      const body = `${payload.message || "Treino encerrado."} Nada foi apostado.`;
      window.setTimeout(() => showResult("pool", result, body, { delta: 0 }), 120);
    }
  };

  const poolSetupInfo = (match = {}) => {
    const setup = match?.poolState?.setup || {};
    return {
      complete: Boolean(setup.complete),
      phase: String(setup.phase || ""),
      winnerSeat: String(setup.winnerSeat || ""),
      chooserSeat: String(setup.chooserSeat || ""),
      starterSeat: String(setup.starterSeat || ""),
      winnerChoice: String(setup.winnerChoice || setup.choice || ""),
      ruleMode: String(setup.ruleMode || match?.poolState?.ruleMode || "livre"),
      tutorialReady: {
        playerOne: Boolean(setup.tutorialReady?.playerOne),
        playerTwo: Boolean(setup.tutorialReady?.playerTwo),
      },
      choice: String(setup.choice || ""),
    };
  };

  const renderPoolSetupControls = (match = {}, seat = "") => {
    const setup = poolSetupInfo(match);
    if (!match?.id || setup.complete) return "";
    const canChoose = match.status === "active" && setup.chooserSeat === seat;
    const chooserName = displayNameFor(match[setup.chooserSeat] || {});
    const ownName = displayNameFor(match[seat] || {}) || "Voce";
    const rivalSeat = seat === "playerOne" ? "playerTwo" : "playerOne";
    const rivalName = displayNameFor(match[rivalSeat] || {}) || "Rival";
    const tutorial = poolRuleTutorial(setup.ruleMode || match?.poolState?.ruleMode || "livre");
    if (setup.phase === "mode-reveal") {
      return `
        <div class="ppg-vale-pool-setup is-mode-reveal" data-pool-setup>
          <strong>MODO ESCOLHIDO</strong>
          <span>${escapeHtml(tutorial.title)}</span>
          <small>Animacao antes do tutorial. A mesa ainda esta travada.</small>
          <div class="ppg-vale-pool-mode-orbit" aria-hidden="true"><i></i><i></i><i></i></div>
          <div class="ppg-vale-pool-setup-actions is-compact">
            <button type="button" class="primary" data-dom-pool-setup-action="reveal">Ver tutorial</button>
          </div>
        </div>
      `;
    }
    if (setup.phase === "tutorial") {
      const ready = Boolean(setup.tutorialReady?.[seat]);
      return `
        <div class="ppg-vale-pool-setup is-tutorial" data-pool-setup>
          <strong>${escapeHtml(tutorial.title)}</strong>
          <span>${escapeHtml(`Saida: ${displayNameFor(match[setup.starterSeat] || {}) || "jogador"}`)}</span>
          <small>${tutorial.lines.map(escapeHtml).join("<br>")}</small>
          ${ready ? `<small>Voce ja confirmou. Aguardando o outro jogador.</small>` : `
            <div class="ppg-vale-pool-setup-actions is-compact">
              <button type="button" class="primary" data-dom-pool-setup-action="tutorial">Começar</button>
            </div>
          `}
        </div>
      `;
    }
    let actions = "";
    let helper = "";
    let lead = canChoose
      ? "Voce ganhou: escolha uma parte."
      : `${chooserName || "Rival"} esta escolhendo.`;
    if (canChoose && setup.phase === "winner-choice") {
      actions = `
        <button type="button" class="primary" data-dom-pool-setup-action="start">Ser primeiro</button>
        <button type="button" data-dom-pool-setup-action="mode" data-dom-pool-setup-mode="livre">Livre</button>
        <button type="button" data-dom-pool-setup-action="mode" data-dom-pool-setup-mode="brasileira">Brasileira</button>
        <button type="button" data-dom-pool-setup-action="mode" data-dom-pool-setup-mode="parimpar">Par/Impar</button>
      `;
      helper = "Se escolher ser primeiro, o rival escolhe o modo. Se escolher modo, o rival escolhe quem sai.";
    } else if (canChoose && setup.phase === "loser-mode") {
      lead = "O vencedor escolheu ser primeiro. Escolha o modo.";
      actions = `
        <button type="button" data-dom-pool-setup-action="mode" data-dom-pool-setup-mode="livre">Livre</button>
        <button type="button" data-dom-pool-setup-action="mode" data-dom-pool-setup-mode="brasileira">Brasileira</button>
        <button type="button" data-dom-pool-setup-action="mode" data-dom-pool-setup-mode="parimpar">Par/Impar</button>
      `;
      helper = "Depois abre o tutorial antes da mesa.";
    } else if (canChoose && setup.phase === "loser-start") {
      lead = "O vencedor escolheu o modo. Escolha quem começa.";
      actions = `
        <button type="button" class="primary" data-dom-pool-setup-action="starter" data-dom-pool-setup-starter="${escapeHtml(seat)}">${escapeHtml(ownName)} começa</button>
        <button type="button" data-dom-pool-setup-action="starter" data-dom-pool-setup-starter="${escapeHtml(rivalSeat)}">${escapeHtml(rivalName)} começa</button>
      `;
      helper = "Depois abre o tutorial antes da mesa.";
    }
    return `
      <div class="ppg-vale-pool-setup" data-pool-setup>
        <strong>Moeda da saida</strong>
        <span>${escapeHtml(lead)}</span>
        ${canChoose && actions ? `
          <div class="ppg-vale-pool-setup-actions">
            ${actions}
          </div>
          <small>${escapeHtml(helper)}</small>
        ` : `<small>Aguardando a decisao da moeda.</small>`}
      </div>
    `;
  };

  const poolSetupStatusText = (setup = {}, seat = "", match = {}) => {
    if (setup.phase === "mode-reveal") {
      return "Modo escolhido. Animação rápida antes de abrir o tutorial.";
    }
    if (setup.phase === "tutorial") {
      const ready = Boolean(setup.tutorialReady?.[seat]);
      return ready
        ? "Tutorial confirmado. Aguardando o outro jogador apertar começar."
        : "Leia o tutorial do modo e aperte Começar para liberar a mesa.";
    }
    if (setup.chooserSeat === seat) {
      if (setup.phase === "loser-mode") return "O vencedor escolheu sair primeiro. Escolha a modalidade.";
      if (setup.phase === "loser-start") return "O vencedor escolheu a modalidade. Escolha quem começa.";
      return "Moeda sua: escolha ser primeiro ou escolher a modalidade.";
    }
    const chooserName = displayNameFor(match[setup.chooserSeat] || {}) || "Rival";
    return `${chooserName} esta decidindo a parte que falta.`;
  };

  const maybeAdvancePoolModeReveal = (match = {}, setup = {}) => {
    if (setup.phase !== "mode-reveal" || setup.complete || !match?.id) {
      return;
    }
    const key = `${match.id}:${setup.ruleMode}:${setup.starterSeat || ""}`;
    if (local.poolRevealKey === key) return;
    window.clearTimeout(local.poolRevealTimer);
    local.poolRevealKey = key;
    local.poolRevealTimer = window.setTimeout(() => {
      choosePoolSetup(match.id, "reveal").then((payload) => {
        if (payload?.ok) routePvpState(payload);
      }).catch(() => {});
    }, 1500);
  };

  const renderValePoolControlsMarkup = ({
    pvp = false,
    demo = false,
    match = null,
    seat = "",
    setup = { complete: true },
    ballInHandOwn = false,
    shotLabel = "Travar mira",
    disabled = "disabled"
  } = {}) => `
    ${demo ? `
      <div class="ppg-vale-pool-controls is-demo-help">
        <span>Mouse mira</span>
        <span>1-5 ou bola de efeito</span>
        <span>Clique para tacar</span>
      </div>
    ` : ""}
    ${ballInHandOwn ? `
      <div class="ppg-vale-pool-controls is-demo-help">
        <span>Bola na mão</span>
        <span>Clique na mesa para posicionar a branca</span>
      </div>
    ` : ""}
    ${pvp && !setup.complete ? renderPoolSetupControls(match, seat) : ""}
    ${pvp && setup.complete ? `
      <div class="ppg-vale-pool-controls">
        <button type="button" data-dom-pool-aim-step="-5" ${disabled}>‹</button>
        <input type="range" min="-180" max="180" step="5" value="${local.poolAim}" data-pool-aim ${local.poolControlStage === "aim" ? disabled : "disabled"}>
        <button type="button" data-dom-pool-aim-step="5" ${disabled}>›</button>
        <div class="ppg-vale-pool-spin">
          ${POOL_SPINS.map((spin) => `<button type="button" class="${spin.id === local.poolSpin ? "is-active" : ""}" data-dom-pool-spin="${spin.id}" ${local.poolControlStage === "aim" ? disabled : "disabled"}>${spin.mark}</button>`).join("")}
        </div>
        <button type="button" class="primary" data-pool-shoot ${disabled}>${shotLabel}</button>
      </div>
    ` : ""}
  `;

  const renderValePoolPrototypeMarkup = ({ mode = "demo", match = null, seat = "" } = {}) => {
    const pvp = mode === "pvp" && match && seat;
    const demo = !pvp;
    const state = match?.poolState || {};
    const setup = pvp ? poolSetupInfo(match) : { complete: true };
    const rivalSeat = seat === "playerOne" ? "playerTwo" : "playerOne";
    const ownScore = Number(state[`${seat}Score`] || 0);
    const rivalScore = Number(state[`${rivalSeat}Score`] || 0);
    const demoPlayer = currentPvpPlayer() || gameState.googleUser || window.CatalogoGoogleAuth?.getUser?.() || { name: "Jogador" };
    const demoRobot = { name: "Robo IA", robot: true };
    const formula = pvp
      ? poolRuleFormula({ state, seat, rivalSeat })
      : poolRuleFormula({ demo: local.poolDemoState || { ruleModeId: "livre", scoreLabel: "BOLAS" } });
    const ownRuleLabel = pvp
      ? poolPlayerRuleLabel(formula, state[`${seat}Group`], "VOCE")
      : poolPlayerRuleLabel(formula, local.poolDemoState?.playerGroup, "VOCE");
    const rivalRuleLabel = pvp
      ? poolPlayerRuleLabel(formula, state[`${rivalSeat}Group`], "RIVAL")
      : poolPlayerRuleLabel(formula, local.poolDemoState?.aiGroup, "IA");
    const ballInHandOwn = pvp && state.ballInHandSeat === seat;
    const shotLabel =
      ballInHandOwn && !local.poolCuePlace
        ? "Posicione a branca"
        :
      local.poolControlStage === "power"
        ? "Tacar"
        : local.poolControlStage === "locked"
          ? "Iniciar força"
          : "Travar mira";
    const disabled = pvp && match.status === "active" && match.turn === seat && (!ballInHandOwn || local.poolCuePlace) ? "" : "disabled";
    const controlsMarkup = renderValePoolControlsMarkup({ pvp, demo, match, seat, setup, ballInHandOwn, shotLabel, disabled });
    return `
      <div class="ppg-vale-pool-shell${pvp ? " is-pvp" : " is-demo"}">
        ${pvp ? renderValePoolPlayerBadge(match[seat], "voce", ownScore, match.turn === seat, "player", ownRuleLabel) : renderValePoolPlayerBadge(demoPlayer, "sua vez", 0, true, "player", ownRuleLabel)}
        ${pvp
          ? `<button type="button" class="ppg-vale-pool-exit danger" data-dom-forfeit-pool>Desistir</button>`
          : `<button type="button" class="ppg-vale-pool-exit" data-dom-open-lobby>Voltar ao lobby</button>`}
        <iframe
          class="ppg-vale-pool-frame"
          data-vale-pool-frame
          title="Vale Pool"
          src="${escapeHtml(valePoolFrameSrc(pvp ? "pvp" : "demo", match?.id || ""))}"
          allow="autoplay; fullscreen"
        ></iframe>
        ${pvp ? renderValePoolPlayerBadge(match[rivalSeat], "rival", rivalScore, match.turn === rivalSeat, "rival", rivalRuleLabel) : renderValePoolPlayerBadge(demoRobot, "ia treino", 0, false, "ia", rivalRuleLabel)}
        ${controlsMarkup}
      </div>
    `;
  };

  const refreshValePoolPrototypeChrome = ({ mode = "demo", match = null, seat = "" } = {}) => {
    const shell = refs.poolStage?.querySelector(".ppg-vale-pool-shell");
    if (!shell) return;
    const pvp = mode === "pvp" && match && seat;
    if (!pvp) return;
    const state = match.poolState || {};
    const setup = poolSetupInfo(match);
    const rivalSeat = seat === "playerOne" ? "playerTwo" : "playerOne";
    const ownScore = Number(state[`${seat}Score`] || 0);
    const rivalScore = Number(state[`${rivalSeat}Score`] || 0);
    const formula = poolRuleFormula({ state, seat, rivalSeat });
    const ownRuleLabel = poolPlayerRuleLabel(formula, state[`${seat}Group`], "VOCE");
    const rivalRuleLabel = poolPlayerRuleLabel(formula, state[`${rivalSeat}Group`], "RIVAL");
    const ballInHandOwn = state.ballInHandSeat === seat;
    const shotLabel =
      ballInHandOwn && !local.poolCuePlace
        ? "Posicione a branca"
        : local.poolControlStage === "power"
          ? "Tacar"
          : local.poolControlStage === "locked"
            ? "Iniciar força"
            : "Travar mira";
    const disabled = match.status === "active" && match.turn === seat && (!ballInHandOwn || local.poolCuePlace) ? "" : "disabled";
    const playerCard = shell.querySelector('[data-vale-pool-side="player"]');
    if (playerCard) playerCard.outerHTML = renderValePoolPlayerBadge(match[seat], "voce", ownScore, match.turn === seat, "player", ownRuleLabel);
    const rivalCard = shell.querySelector('[data-vale-pool-side="rival"]');
    if (rivalCard) rivalCard.outerHTML = renderValePoolPlayerBadge(match[rivalSeat], "rival", rivalScore, match.turn === rivalSeat, "rival", rivalRuleLabel);
    shell.querySelectorAll(".ppg-vale-pool-controls, [data-pool-setup]").forEach((node) => node.remove());
    shell.insertAdjacentHTML("beforeend", renderValePoolControlsMarkup({ pvp, match, seat, setup, ballInHandOwn, shotLabel, disabled }));
  };

  const syncValePoolPrototypeFrame = (match = null, seat = "") => {
    const frame = refs.poolStage?.querySelector("[data-vale-pool-frame]");
    if (!frame || !match || !seat) return;
    const state = match.poolState || {};
    const setup = poolSetupInfo(match);
    const rivalSeat = seat === "playerOne" ? "playerTwo" : "playerOne";
    const canAct = match.status === "active" && match.turn === seat && setup.complete;
    const payload = {
      type: "vale-pool:state",
      poolState: state,
      seat,
      canAct,
      ownScore: Number(state[`${seat}Score`] || 0),
      rivalScore: Number(state[`${rivalSeat}Score`] || 0),
      moveCount: Number(match.moveCount || 0),
      aim: local.poolAim,
      power: local.poolPower,
      spin: local.poolSpin,
      cuePlace: local.poolCuePlace,
      ruleMode: state.ruleMode || "livre",
      scoreLabel: state.scoreLabel || "BOLAS",
      setupPhase: setup.complete ? "done" : setup.phase || "choice",
      message: !setup.complete
        ? setup.phase === "mode-reveal"
          ? "MODO ESCOLHIDO"
          : setup.phase === "tutorial" ? "TUTORIAL: APERTE COMEÇAR" : setup.chooserSeat === seat ? "MOEDA: SUA ESCOLHA" : "MOEDA: AGUARDANDO RIVAL"
        : match.status === "active" && match.turn === seat ? "SUA VEZ" : "VEZ DO RIVAL"
    };
    const deliver = () => frame.contentWindow?.postMessage(payload, window.location.origin);
    if (frame.dataset.valePoolBound !== "1") {
      frame.dataset.valePoolBound = "1";
      frame.addEventListener("load", deliver, { once: true });
    }
    window.setTimeout(deliver, 30);
    window.setTimeout(deliver, 180);
  };

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
      ["p1", 7.5, 12], ["p2", 50, 10], ["p3", 92.5, 12],
      ["p4", 7.5, 88], ["p5", 50, 90], ["p6", 92.5, 88]
    ].map(([className, x, y]) => `<span class="ppg-pool-pocket ${className}" style="left:${x}%;top:${y}%"></span>`).join("");
    const ballMarkup = balls
      .filter((ball) => !ball.pocketed)
      .map((ball) => {
        const x = 8 + clampUiNumber(ball.x, 0, 100, 50) * 0.84;
        const y = 12 + clampUiNumber(Number(ball.y) * 2, 0, 100, 50) * 0.76;
        const id = Number(ball.id) || 0;
        const label = ball.cue || id === 0 ? "" : id;
        return `<span class="ppg-pool-ball${ball.cue || id === 0 ? " is-cue" : ""}" style="left:${x.toFixed(2)}%;top:${y.toFixed(2)}%;background:${safeBallColor(ball.color)}">${label}</span>`;
      }).join("");
    const aimX = 8 + clampUiNumber(cue.x, 0, 100, 25) * 0.84;
    const aimY = 12 + clampUiNumber(Number(cue.y) * 2, 0, 100, 50) * 0.76;
    const last = state.lastShot || {};
    const spin = normalizePoolSpin(local.poolSpin);
    return `
      <div class="ppg-dom-pvp-pool">
        <div class="ppg-dom-pvp-pool-table${last.pocketed?.length ? " has-pocket-fx" : ""}" data-spin="${spin}" style="--pool-aim:${local.poolAim}deg;--cue-x:${aimX.toFixed(2)}%;--cue-y:${aimY.toFixed(2)}%">
          ${pockets}
          <span class="ppg-pool-fx-ring" aria-hidden="true"></span>
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
    if (refs.poolPocketed) refs.poolPocketed.innerHTML = renderPoolPocketedMarkup(state);
    if (refs.poolEffect) refs.poolEffect.innerHTML = renderPoolEffectMarkup(state.spin || "centro");
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
          : "Jogar";
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
    const setup = poolSetupInfo(match);
    const setupPending = !setup.complete;
    maybeAdvancePoolModeReveal(match, setup);
    if (match.status !== "active" || match.turn !== seat || setupPending) {
      if (local.poolControlStage !== "aim" || local.poolPowerTimer) resetPvpPoolControls();
    }
    const isAbandoned = match.status === "abandoned";
    const abandonedBySelf = isAbandoned && match.abandonedBy === seat;
    const abandonSeconds = secondsUntil(match.deadlineAt);
    const ownScore = Number(state[`${seat}Score`] || 0);
    const rivalScore = Number(state[`${rivalSeat}Score`] || 0);
    const formula = poolRuleFormula({ state, seat, rivalSeat });
    const ownRuleLabel = poolPlayerRuleLabel(formula, state[`${seat}Group`], "VOCE");
    const rivalRuleLabel = poolPlayerRuleLabel(formula, state[`${rivalSeat}Group`], "RIVAL");
    const ballInHandOwn = state.ballInHandSeat === seat;
    refs.pool.dataset.mode = "pvp";
    refs.pool.dataset.render = "prototype";
    if (refs.poolKicker) refs.poolKicker.textContent = "ranked pvp";
    if (refs.poolTitle) {
      refs.poolTitle.textContent =
        match.status === "finished"
          ? "Mesa encerrada"
          : isAbandoned
            ? abandonedBySelf ? "Reconectando mesa" : "Rival desconectou"
            : setupPending
              ? setup.chooserSeat === seat ? "Sua escolha na moeda" : "Moeda decidindo regra"
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
            : setupPending
              ? poolSetupStatusText(setup, seat, match)
            : ballInHandOwn
              ? "Bola na mao: clique na mesa para posicionar a branca antes de tacar."
            : match.turn === seat
              ? `${displayNameFor(match[seat])}, escolha mira e força.`
              : "Aguardando tacada do rival.";
    }
    if (refs.poolScore) refs.poolScore.textContent = `${ownScore} x ${rivalScore}`;
    if (refs.poolRound) refs.poolRound.textContent = `${match.moveCount || 0} tacadas`;
    if (refs.poolLast) {
      refs.poolLast.textContent = state.lastShot?.at
        ? `${state.lastShot.pocketed?.length || 0} bola(s) na ultima tacada.`
        : setupPending
          ? setup.phase === "tutorial" ? "Tutorial antes da mesa." : "Moeda: escolha inicial."
          : `${state.ruleLabel || "Livre"} montado.`;
    }
    if (refs.poolPocketed) refs.poolPocketed.innerHTML = renderPoolPocketedMarkup(state);
    if (refs.poolEffect) refs.poolEffect.innerHTML = renderPoolEffectMarkup(local.poolSpin);
    syncPoolRuleUi(formula);
    renderStablePoolStage(
      `pool-prototype:${match.id}:${seat}:${match.status}:${state.ruleMode || "livre"}:${state[`${seat}Group`] || ""}:${state[`${rivalSeat}Group`] || ""}:${setup.complete ? 1 : 0}:${setup.phase}:${setup.chooserSeat}:${setup.winnerChoice}:${setup.starterSeat}:${setup.tutorialReady.playerOne ? 1 : 0}:${setup.tutorialReady.playerTwo ? 1 : 0}`,
      renderValePoolPrototypeMarkup({ mode: "pvp", match, seat })
    );
    refreshValePoolPrototypeChrome({ mode: "pvp", match, seat });
    syncValePoolPrototypeFrame(match, seat);
    setCheckersPlayerCard({
      root: refs.poolSelf,
      initial: refs.poolSelfInitial,
      name: refs.poolSelfName,
      meta: refs.poolSelfMeta,
      pieces: refs.poolSelfBalls
    }, match[seat] || currentPvpPlayer() || {}, {
      pieces: ownScore,
      active: match.status === "active" && match.turn === seat && !setupPending,
      connected: Boolean(match.presence?.[seat]?.connected ?? true),
      label: setupPending && setup.chooserSeat === seat ? `moeda | ${ownRuleLabel}` : ownRuleLabel
    });
    setCheckersPlayerCard({
      root: refs.poolRival,
      initial: refs.poolRivalInitial,
      name: refs.poolRivalName,
      meta: refs.poolRivalMeta,
      pieces: refs.poolRivalBalls
    }, match[rivalSeat] || rivalPvpPlayer() || {}, {
      pieces: rivalScore,
      active: match.status === "active" && match.turn === rivalSeat && !setupPending,
      connected: Boolean(match.presence?.[rivalSeat]?.connected ?? true),
      label: setupPending && setup.chooserSeat === rivalSeat ? `moeda | ${rivalRuleLabel}` : rivalRuleLabel
    });
    if (refs.forfeitPool) {
      refs.forfeitPool.hidden = false;
      refs.forfeitPool.disabled = match.status !== "active" && match.status !== "abandoned";
      refs.forfeitPool.textContent = match.status === "finished" ? "Mesa encerrada" : "Desistir";
    }
    if (refs.poolShot) refs.poolShot.hidden = true;
    if (refs.poolTouchShot) {
      refs.poolTouchShot.disabled = setupPending || match.status !== "active" || match.turn !== seat || (ballInHandOwn && !local.poolCuePlace);
      refs.poolTouchShot.textContent =
        match.status === "finished"
          ? "Fim"
          : ballInHandOwn && !local.poolCuePlace
            ? "Posicione"
          : "Jogar";
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
    if (!poolSetupInfo(match).complete) return;
    if (match.poolState?.ballInHandSeat === gameState.pvpSeat && !local.poolCuePlace) {
      updateGameState({ prompt: "Bola na mao: clique na mesa para posicionar a branca." });
      return;
    }
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
    shootPool(match.id, local.poolAim, local.poolPower, local.poolSpin, local.poolCuePlace || null).then((payload) => {
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
    const demoMode = isTableDemoActive();
    const match = demoMode ? local.demoTable : gameState.pvpMatch;
    const seat = demoMode ? "playerOne" : gameState.pvpSeat;
    const gameId = demoMode ? local.demoTable?.gameId : gameState.pvpGameId || local.selectedGame;
    if (!match || !seat || !refs.table) return;
    refs.table.dataset.game = gameId || "";
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
    refs.tableKicker.textContent = demoMode ? "treino local" : "mesa PvP";
    refs.tableTitle.textContent =
      match.status === "finished"
        ? `${gameLabel(gameId)} encerrado`
        : isAbandoned
          ? abandonedBySelf ? "Reconectando mesa" : "Rival desconectou"
          : demoMode ? `Treino de ${gameLabel(gameId)}` : match.turn === seat ? "Sua vez" : "Vez do rival";
    refs.tableStatus.textContent =
      match.status === "finished"
        ? match.resultSummary || "Partida encerrada."
        : isAbandoned
          ? abandonedBySelf
            ? "Voce voltou a tempo. Reabrindo a mesa..."
            : `Rival caiu. Vitoria por W.O. em ${abandonSeconds}s se ele nao voltar.`
          : demoMode ? "Treino livre, sem saldo e sem fila real." : match.turn === seat ? `${myName}, jogue em ${gameLabel(gameId)}.` : "Aguardando jogada do rival.";
    refs.genericForfeit.disabled = !demoMode && match.status !== "active" && match.status !== "abandoned";
    refs.genericForfeit.textContent = demoMode ? "Sair do treino" : "Desistir";

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
    } else if (gameId === "cards21") {
      const state = match.cardsState || {};
      const cardsKey = seat === "playerOne" ? "playerOneCards" : "playerTwoCards";
      const rivalCardsKey = seat === "playerOne" ? "playerTwoCards" : "playerOneCards";
      const stateKey = seat === "playerOne" ? "playerOneState" : "playerTwoState";
      const rivalStateKey = seat === "playerOne" ? "playerTwoState" : "playerOneState";
      const cards = Array.isArray(state[cardsKey]) ? state[cardsKey] : [];
      const rivalCards = Array.isArray(state[rivalCardsKey]) ? state[rivalCardsKey] : [];
      const total = sumCards21(cards);
      const rivalClosed = state[rivalStateKey] && state[rivalStateKey] !== "active";
      const canAct = match.status === "active" && state[stateKey] === "active";
      refs.tableScore.textContent = `${total} / 21`;
      renderStableTableBody(
        `${gameId}:${match.id}:${seat}:${match.status}:${state[stateKey]}:${state[rivalStateKey]}:${JSON.stringify(cards)}:${JSON.stringify(rivalCards)}`,
        `
        <section class="ppg-card-table is-cards21">
          <div class="ppg-card-table-felt">
            <div class="ppg-card-seat is-rival">
              <span>Rival</span>
              <div class="ppg-card-row is-rival-hand">
                ${rivalCards.map((card, index) => renderPlayingCard(card, index, { tag: "span", faceDown: !rivalClosed && index > 0, note: rivalClosed ? "fechou" : "oculta" })).join("")}
              </div>
              <small>${rivalClosed ? `total ${sumCards21(rivalCards)}` : "mão em jogo"}</small>
            </div>
            <div class="ppg-card-center">
              <strong>21</strong>
              <span>${state[stateKey] === "busted" ? "voce estourou" : state[stateKey] === "stood" ? "voce parou" : "compre ou pare"}</span>
            </div>
            <div class="ppg-card-seat is-self">
              <span>Sua mão</span>
              <div class="ppg-card-row">${cards.map((card, index) => renderPlayingCard(card, index, { tag: "span", note: "valor" })).join("")}</div>
              <small>${total} pontos</small>
            </div>
          </div>
          <div class="ppg-card-controls">
            <button type="button" class="primary" data-cards21-action="hit" ${canAct ? "" : "disabled"}>Comprar carta</button>
            <button type="button" data-cards21-action="stand" ${canAct ? "" : "disabled"}>Parar</button>
          </div>
        </section>
      `);
    } else if (gameId === "poker") {
      const state = match.pokerState || {};
      const cardsKey = seat === "playerOne" ? "playerOneCards" : "playerTwoCards";
      const rivalCardsKey = seat === "playerOne" ? "playerTwoCards" : "playerOneCards";
      const usedKey = seat === "playerOne" ? "playerOneDrawUsed" : "playerTwoDrawUsed";
      const rivalUsedKey = seat === "playerOne" ? "playerTwoDrawUsed" : "playerOneDrawUsed";
      const cards = Array.isArray(state[cardsKey]) ? state[cardsKey] : [];
      const rivalCards = Array.isArray(state[rivalCardsKey]) ? state[rivalCardsKey] : [];
      refs.tableScore.textContent = state[usedKey] ? "troca usada" : "troca aberta";
      renderStableTableBody(
        `${gameId}:${match.id}:${seat}:${match.status}:${match.turn}:${JSON.stringify(cards)}:${state[usedKey] ? 1 : 0}:${local.pvpHeld.join("")}`,
        `
        <section class="ppg-card-table is-poker">
          <div class="ppg-card-table-felt">
            <div class="ppg-card-seat is-rival">
              <span>Rival</span>
              <div class="ppg-card-row is-rival-hand">
                ${rivalCards.map((card, index) => renderPlayingCard(card, index, { tag: "span", faceDown: !state[rivalUsedKey], note: state[rivalUsedKey] ? "pronto" : "oculta" })).join("")}
              </div>
              <small>${state[rivalUsedKey] ? "rival fechou a troca" : "rival decidindo"}</small>
            </div>
            <div class="ppg-card-center">
              <strong>Pôquer de troca</strong>
              <span>${state[usedKey] ? "sua mão está fechada" : "marque as cartas que quer segurar"}</span>
            </div>
            <div class="ppg-card-seat is-self">
              <span>Sua mão</span>
              <div class="ppg-card-row">${cards.map((card, index) => renderPlayingCard(card, index, { dataset: `data-poker-card="${index}"`, held: local.pvpHeld[index], note: local.pvpHeld[index] ? "segura" : "troca" })).join("")}</div>
            </div>
          </div>
          <div class="ppg-card-controls">
            <button type="button" class="primary" data-poker-draw ${match.status !== "active" || match.turn !== seat || state[usedKey] ? "disabled" : ""}>Trocar cartas soltas</button>
          </div>
        </section>
      `);
    } else if (gameId === "dicecups") {
      const state = match.diceState || {};
      const dice = Array.isArray(state.dice) ? state.dice : [0, 0];
      const total = Number(state.total || dice.reduce((sum, value) => sum + Number(value || 0), 0));
      refs.tableScore.textContent = `${state.playerOneScore || 0} x ${state.playerTwoScore || 0}`;
      renderStableTableBody(
        `${gameId}:${match.id}:${seat}:${match.status}:${match.turn}:${state.playerOneScore || 0}:${state.playerTwoScore || 0}:${JSON.stringify(dice)}:${total}`,
        `
        <section class="ppg-dice-table">
          <div class="ppg-dice-backdrop">
            <div class="ppg-dice-cup is-left"><span></span></div>
            <div class="ppg-dice-cups" aria-live="polite">
              ${renderDieFace(dice[0], 0)}
              ${renderDieFace(dice[1], 1)}
            </div>
            <div class="ppg-dice-cup is-right"><span></span></div>
          </div>
          <div class="ppg-dice-total">
            <span>soma revelada</span>
            <strong>${total || "?"}</strong>
          </div>
          <div class="ppg-number-grid" aria-label="Escolha a soma dos dados">
            ${Array.from({ length: 11 }, (_, index) => index + 2).map((value) => `<button type="button" data-dice-guess="${value}" ${match.status !== "active" || match.turn !== seat ? "disabled" : ""}>${value}</button>`).join("")}
          </div>
        </section>
      `);
    } else if (gameId === "truco") {
      const state = match.trucoState || {};
      const cardsKey = seat === "playerOne" ? "playerOneCards" : "playerTwoCards";
      const cards = Array.isArray(state[cardsKey]) ? state[cardsKey] : [];
      const tableCards = Array.isArray(state.table) ? state.table : [];
      refs.tableScore.textContent = `${state.playerOneScore || 0} x ${state.playerTwoScore || 0}`;
      renderStableTableBody(
        `${gameId}:${match.id}:${seat}:${match.status}:${match.turn}:${state.playerOneScore || 0}:${state.playerTwoScore || 0}:${state.round || 1}:${JSON.stringify(cards)}:${JSON.stringify(state.table || [])}`,
        `
        <section class="ppg-card-table is-truco">
          <div class="ppg-card-table-felt">
            <div class="ppg-truco-score">
              <span>Mão ${state.round || 1}/${state.maxRounds || 3}</span>
              <strong>${state.playerOneScore || 0} x ${state.playerTwoScore || 0}</strong>
            </div>
            <div class="ppg-card-center is-table-pot">
              ${tableCards.length
                ? tableCards.map((play, index) => renderPlayingCard(play.card, index, { tag: "span", note: play.seat === seat ? "sua mesa" : "rival" })).join("")
                : `<span class="ppg-playing-card is-empty"><span class="ppg-card-pip">+</span><small>mesa vazia</small></span>`}
            </div>
            <div class="ppg-card-seat is-self">
              <span>Sua mão</span>
              <div class="ppg-card-row is-truco-hand">${cards.map((card, index) => card ? renderPlayingCard(card, index, { dataset: `data-truco-card="${index}"`, disabled: match.status !== "active" || match.turn !== seat, note: "jogar" }) : renderPlayingCard(null, index, { empty: true, note: "jogada" })).join("")}</div>
            </div>
          </div>
          <p class="ppg-table-note">${tableCards.length ? "Carta na mesa aguardando resposta." : "Escolha uma carta quando for sua vez."}</p>
        </section>
      `);
    } else if (gameId === "chess") {
      const state = decorateChessState(match.chessState || {});
      match.chessState = state;
      startChessCinematic(match);
      const turnSeat = chessSeatForColor(state, state.turnColor);
      const chessMoveFeedback = syncChessMoveFeedback(match);
      refs.tableScore.textContent = `${state.history?.length || match.moveCount || 0} lances`;
      refs.tableStatus.textContent = demoMode && local.demoChessAiThinking
        ? "Máquina pensando por 3 segundos."
        : chessMoveFeedback
          ? "Movimento feito. Virando a mesa..."
        : getChessTurnSummary(match, seat, demoMode);
      renderStableTableBody(
        `${gameId}:${match.id}:${seat}:${match.status}:${turnSeat}:${match.moveCount || 0}:${state.fen || ""}:${state.inCheck}:${state.legalMoves?.length || 0}:${local.chessSelected}:${state.lastMove?.lan || ""}:${local.demoChessAiThinking}:${local.demoChessAiPreviewMove?.from || ""}:${local.demoChessAiPreviewMove?.to || ""}:${chessMoveFeedback}:${local.chessIntroLocked}:${local.chessBoardFixed}`,
        `<section class="ppg-chess-arena${demoMode && local.demoChessAiThinking ? " is-ai-thinking" : ""}${local.chessIntroLocked ? " is-cinematic" : ""}">
          <div class="ppg-chess-orbit-lights" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div>
          <button type="button" class="ppg-chess-exit" data-dom-open-lobby>Mesas</button>
          <button type="button" class="ppg-chess-resign" data-dom-generic-forfeit>${demoMode ? "Sair" : "Desistir"}</button>
          <div class="ppg-chess-board-stage" data-chess-stage>
            <div class="ppg-chess-intro${local.chessIntroLocked ? " is-visible" : ""}" ${local.chessIntroLocked ? "" : "hidden"}>
              ${renderChessIntroMarkup(match)}
            </div>
            <div class="ppg-chess-board-frame" data-chess-frame>
              <div class="ppg-dom-chess-board" data-ai-thinking="${demoMode && local.demoChessAiThinking ? "true" : "false"}">${renderChessBoardMarkup(match, seat)}</div>
            </div>
            ${cameraEdgesMarkup("chess")}
            <div class="ppg-move-toast${chessMoveFeedback ? " is-visible" : ""}" ${chessMoveFeedback ? "" : "hidden"}>Movimento feito...</div>
            ${cameraHintMarkup()}
            ${cameraOrbMarkup("chess", local.chessBoardFixed)}
          </div>
          <aside class="ppg-chess-sidecar">${renderChessGuidanceMarkup(match, seat, demoMode)}</aside>
        </section>`
      );
      applyChessCamera(match, seat);
      if (local.chessIntroLocked) playChessIntroVideo();
    }

    updateGameState({
      activeGameId: gameId,
      lobbyPhase: match.status === "finished" ? "finished" : "playing",
      objective: demoMode ? `Treinar ${gameLabel(gameId)}` : `Vencer ${gameLabel(gameId)} real`,
      focus: demoMode ? `treino de ${gameLabel(gameId)}` : `mesa real de ${gameLabel(gameId)}`,
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
      const matchKey = `${gameId}:${payload.match?.id || gameState.pvpMatch?.id || ""}:${payload.seat || gameState.pvpSeat || ""}`;
      const enterPanel = () => {
        setPanel(gameId === "checkers" ? "checkers" : gameId === "pool" ? "pool" : "table");
        game.scene.stop("game-lobby-scene");
        game.scene.stop("pool-game-scene");
        if (gameId === "checkers") renderPvpCheckers();
        else if (gameId === "pool") renderPvpPool();
        else renderPvpTable();
      };
      if (payload.state === "active" && matchKey && local.pvpIntroMatchKey !== matchKey) {
        local.pvpIntroMatchKey = matchKey;
        local.pvpIntroPendingKey = matchKey;
        window.clearTimeout(local.pvpIntroTimer);
        showGameLoading(gameId, "pvp");
        local.pvpIntroTimer = window.setTimeout(() => {
          local.pvpIntroTimer = null;
          local.pvpIntroPendingKey = "";
          enterPanel();
          emitGameSound("ready", gameId);
        }, 920);
        return;
      }
      if (local.pvpIntroPendingKey === matchKey) return;
      enterPanel();
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
    game.events.emit("pubpaid:music-zone", gameAudioZone(gameId));
    if (gameId === "checkers") {
      resetDemoCheckersState();
      resetCheckersCamera();
    }
    if (gameId === "pool") resetDemoPoolState();
    local.pvpHeld = [true, true, true, true, true];
    local.chessSelected = "";
    local.pvpIntroMatchKey = "";
    local.pvpIntroPendingKey = "";
    window.clearTimeout(local.pvpIntroTimer);
    local.pvpIntroTimer = null;
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

  const startDemoFlow = (gameId = "checkers") => {
    if (gameId === "checkers") {
      launchGame(gameId, "demo", startDemoCheckers);
    } else if (gameId === "pool") {
      launchGame(gameId, "demo", startDemoPool);
    } else if (PVP_GAMES.has(gameId)) {
      launchGame(gameId, "demo", () => startDemoTable(gameId));
    } else {
      showAccessBlock("unavailable");
    }
  };

  const startPvpFlow = async (gameId = "pool", sourceButton = null) => {
    local.selectedGame = gameId;
    if (PVP_GAMES.has(gameId) && isRealPvpEligible(gameId)) {
      void startRealPvpGame(gameId);
      return;
    }
    if (!PVP_GAMES.has(gameId)) {
      showAccessBlock("unavailable");
      return;
    }
    if (!isLoggedIn()) {
      showAccessBlock("pvp-only");
      return;
    }
    if (sourceButton) sourceButton.disabled = true;
    if (refs.lobbyState) refs.lobbyState.textContent = "atualizando saldo";
    updateGameState({ prompt: `Atualizando saldo aprovado antes de abrir ${gameLabel(gameId)}.` });
    await syncPubpaidAccount();
    if (sourceButton) sourceButton.disabled = false;
    if (isRealPvpEligible(gameId)) {
      void startRealPvpGame(gameId);
    } else {
      showAccessBlock("pvp-only");
    }
  };

  const bootReviewMode = () => {
    const params = new URLSearchParams(window.location.search || "");
    const reviewValue = params.get("review") || "";
    if (/^(torneio|tournament|damas-torneio|checkers-tournament)$/i.test(reviewValue)) {
      if (local.reviewModeBooted) return;
      local.reviewModeBooted = true;
      window.setTimeout(() => {
        if (!local.demoCheckers && !local.demoTable && !gameState.pvpMatch) void showCheckersTournament();
      }, 600);
      return;
    }
    const reviewGame = /^(sinuca|pool|vale-pool)$/i.test(reviewValue)
      ? "pool"
      : params.get("review") === "damas"
        ? "checkers"
        : /^(xadrez|chess)$/i.test(reviewValue)
          ? "chess"
          : "";
    if (!reviewGame || local.reviewModeBooted) return;
    local.reviewModeBooted = true;
    window.setTimeout(() => {
      if (!local.demoCheckers && !local.demoTable && !gameState.pvpMatch) startDemoFlow(reviewGame);
    }, 600);
  };

  const handleCheckersCell = (cell) => {
    const row = Number(cell.dataset.row);
    const col = Number(cell.dataset.col);
    if (local.checkersIntroLocked) return true;
    if (isTournamentCheckersActive()) {
      const match = local.tournamentMatch;
      const seat = tournamentSeatForCurrentParticipant(match);
      if (!match || !seat || match.status !== "active" || match.turn !== seat) return true;
      const target = local.tournamentLegalMoves.find((move) => move.to.row === row && move.to.col === col);
      if (target) {
        moveCheckersTournament({ key: local.tournamentKey, matchId: match.id, move: target }).then((payload) => {
          if (payload?.ok || payload?.tournament) {
            setTournamentSession(payload, local.tournamentKey);
            local.tournamentSelected = null;
            local.tournamentLegalMoves = [];
            renderPvpCheckers();
          }
        });
        return true;
      }
      const piece = match.board?.[row]?.[col];
      if (getCheckersOwner(piece) !== seat) {
        local.tournamentSelected = null;
        local.tournamentLegalMoves = [];
        renderPvpCheckers();
        return true;
      }
      local.tournamentSelected = { row, col };
      local.tournamentLegalMoves = getCheckersLegalMoves(match.board, seat, match.forcedPiece || null)
        .filter((move) => move.from.row === row && move.from.col === col);
      renderPvpCheckers();
      return true;
    }
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
            const feedbackKey = checkersMoveFeedbackKey(payload.match || {});
            if (scheduleMoveFeedback("checkers", feedbackKey, seat, renderPvpCheckers)) setCheckersMoveToast(true);
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
    if (Date.now() < local.checkersCamera.suppressUntil) return;
    event.preventDefault();
    local.lastCheckersTouchAt = Date.now();
    handleCheckersCell(cell);
  }, { passive: false });

  refs.checkersStage?.addEventListener("wheel", (event) => {
    if (!isTournamentCheckersActive() && !isCheckersDemoActive() && gameState.pvpGameId !== "checkers") return;
    event.preventDefault();
    local.checkersCamera.zoom += event.deltaY > 0 ? -0.045 : 0.045;
    applyCheckersCamera(local.tournamentMatch || local.demoCheckers || gameState.pvpMatch || {}, tournamentSeatForCurrentParticipant() || gameState.pvpSeat || "playerOne");
  }, { passive: false });

  refs.checkersStage?.addEventListener("pointerdown", (event) => {
    if (!isTournamentCheckersActive() && !isCheckersDemoActive() && gameState.pvpGameId !== "checkers") return;
    const edge = event.target.closest?.("[data-checkers-camera-edge]");
    const frame = event.target.closest?.("[data-dom-checkers-frame]");
    const boardCell = event.target.closest?.("[data-dom-checkers-board] [data-row]");
    rememberCameraPointer(local.checkersCamera, event);
    if (event.pointerType === "touch" && local.checkersCamera.pointers.size >= 2) {
      event.preventDefault();
      return;
    }
    const primaryFrameDrag = event.pointerType === "mouse" && event.button === 0 && frame && !boardCell;
    if (!edge && !(frame && isMiddleMouseCameraDrag(event)) && !primaryFrameDrag) return;
    event.preventDefault();
    local.checkersCamera.dragId = event.pointerId;
    local.checkersCamera.dragX = event.clientX;
    local.checkersCamera.dragY = event.clientY;
    local.checkersCamera.dragCapture = edge || refs.checkersStage;
    local.checkersCamera.dragCapture?.setPointerCapture?.(event.pointerId);
  });

  refs.checkersStage?.addEventListener("pointermove", (event) => {
    if (updatePinchCamera(local.checkersCamera, event, () => applyCheckersCamera(local.tournamentMatch || local.demoCheckers || gameState.pvpMatch || {}, tournamentSeatForCurrentParticipant() || gameState.pvpSeat || "playerOne"))) return;
    if (local.checkersCamera.dragId !== event.pointerId) return;
    const dx = event.clientX - local.checkersCamera.dragX;
    const dy = event.clientY - local.checkersCamera.dragY;
    event.preventDefault();
    local.checkersCamera.dragX = event.clientX;
    local.checkersCamera.dragY = event.clientY;
    local.checkersCamera.yaw += dx * 0.08;
    local.checkersCamera.panY += dy * 0.055;
    applyCheckersCamera(local.tournamentMatch || local.demoCheckers || gameState.pvpMatch || {}, tournamentSeatForCurrentParticipant() || gameState.pvpSeat || "playerOne");
  });

  refs.checkersStage?.addEventListener("pointerup", (event) => {
    forgetCameraPointer(local.checkersCamera, event);
    if (local.checkersCamera.dragId !== event.pointerId) return;
    local.checkersCamera.dragId = null;
    local.checkersCamera.dragCapture?.releasePointerCapture?.(event.pointerId);
    local.checkersCamera.dragCapture = null;
  });

  refs.checkersStage?.addEventListener("pointercancel", (event) => {
    forgetCameraPointer(local.checkersCamera, event);
    if (local.checkersCamera.dragId !== event.pointerId) return;
    local.checkersCamera.dragId = null;
    local.checkersCamera.dragCapture = null;
  });

  refs.checkersFrame?.addEventListener("auxclick", (event) => {
    if (event.button === 1) event.preventDefault();
  });

  refs.checkersFrame?.addEventListener("mousedown", (event) => {
    if (event.button === 1) event.preventDefault();
  });

  document.addEventListener("wheel", (event) => {
    const stage = event.target.closest?.("[data-chess-stage]");
    if (!stage || !isChessCameraActive()) return;
    event.preventDefault();
    local.chessCamera.zoom += event.deltaY > 0 ? -0.045 : 0.045;
    applyChessCamera(local.demoTable || gameState.pvpMatch || {}, gameState.pvpSeat || "playerOne");
  }, { passive: false });

  document.addEventListener("pointerdown", (event) => {
    const edge = event.target.closest?.("[data-chess-camera-edge]");
    const frame = event.target.closest?.("[data-chess-frame]");
    const square = event.target.closest?.("[data-chess-square]");
    if ((!edge && !frame) || !isChessCameraActive()) return;
    rememberCameraPointer(local.chessCamera, event);
    if (event.pointerType === "touch" && local.chessCamera.pointers.size >= 2) {
      event.preventDefault();
      return;
    }
    const primaryFrameDrag = event.pointerType === "mouse" && event.button === 0 && frame && !square;
    if (!edge && !isMiddleMouseCameraDrag(event) && !primaryFrameDrag) return;
    event.preventDefault();
    local.chessCamera.dragId = event.pointerId;
    local.chessCamera.dragX = event.clientX;
    local.chessCamera.dragY = event.clientY;
    local.chessCamera.dragCapture = edge || frame;
    local.chessCamera.dragCapture?.setPointerCapture?.(event.pointerId);
  });

  document.addEventListener("pointermove", (event) => {
    if (updatePinchCamera(local.chessCamera, event, () => applyChessCamera(local.demoTable || gameState.pvpMatch || {}, gameState.pvpSeat || "playerOne"))) return;
    if (local.chessCamera.dragId !== event.pointerId) return;
    const dx = event.clientX - local.chessCamera.dragX;
    const dy = event.clientY - local.chessCamera.dragY;
    event.preventDefault();
    local.chessCamera.dragX = event.clientX;
    local.chessCamera.dragY = event.clientY;
    local.chessCamera.yaw += dx * 0.08;
    local.chessCamera.panY += dy * 0.055;
    applyChessCamera(local.demoTable || gameState.pvpMatch || {}, gameState.pvpSeat || "playerOne");
  });

  document.addEventListener("pointerup", (event) => {
    forgetCameraPointer(local.chessCamera, event);
    if (local.chessCamera.dragId !== event.pointerId) return;
    local.chessCamera.dragId = null;
    local.chessCamera.dragCapture?.releasePointerCapture?.(event.pointerId);
    local.chessCamera.dragCapture = null;
  });

  document.addEventListener("pointercancel", (event) => {
    forgetCameraPointer(local.chessCamera, event);
    if (local.chessCamera.dragId !== event.pointerId) return;
    local.chessCamera.dragId = null;
    local.chessCamera.dragCapture = null;
  });

  document.addEventListener("auxclick", (event) => {
    if (event.button === 1 && event.target.closest?.("[data-chess-stage]")) event.preventDefault();
  });

  document.addEventListener("mousedown", (event) => {
    if (event.button === 1 && event.target.closest?.("[data-chess-stage]")) event.preventDefault();
  });

  window.addEventListener("message", (event) => {
    if (event.origin !== window.location.origin) return;
    if (event.data?.type === "vale-pool:demo-state") {
      updateValePoolDemoChrome(event.data);
      return;
    }
    if (event.data?.type === "vale-pool:cue-place") {
      local.poolCuePlace = {
        x: clampUiNumber(event.data.x, 0, 100, 25),
        y: clampUiNumber(event.data.y, 0, 50, 25),
      };
      updateGameState({ prompt: "Bola branca posicionada. Agora mire e taque." });
      if (gameState.pvpGameId === "pool" && gameState.pvpMatch?.id) renderPvpPool();
    }
  });

  document.addEventListener("click", async (event) => {
    const cameraButton = event.target.closest("[data-checkers-camera]");
    if (cameraButton) {
      const action = cameraButton.dataset.checkersCamera || "reset";
      if (action === "lock") {
        local.checkersBoardFixed = !local.checkersBoardFixed;
        cameraButton.classList.toggle("is-active", local.checkersBoardFixed);
        cameraButton.setAttribute("aria-pressed", local.checkersBoardFixed ? "true" : "false");
        cameraButton.textContent = local.checkersBoardFixed ? "Mesa fixa" : "Girar rival";
      } else {
        resetCheckersCamera();
      }
      applyCheckersCamera(local.tournamentMatch || local.demoCheckers || gameState.pvpMatch || {}, tournamentSeatForCurrentParticipant() || gameState.pvpSeat || "playerOne");
      return;
    }

    const chessCameraButton = event.target.closest("[data-chess-camera]");
    if (chessCameraButton) {
      const action = chessCameraButton.dataset.chessCamera || "reset";
      if (action === "lock") {
        local.chessBoardFixed = !local.chessBoardFixed;
        chessCameraButton.classList.toggle("is-active", local.chessBoardFixed);
        chessCameraButton.setAttribute("aria-pressed", local.chessBoardFixed ? "true" : "false");
        chessCameraButton.textContent = local.chessBoardFixed ? "Mesa fixa" : "Girar rival";
      } else {
        resetChessCamera();
      }
      applyChessCamera(local.demoTable || gameState.pvpMatch || {}, gameState.pvpSeat || "playerOne");
      return;
    }

    const tournamentButton = event.target.closest("[data-dom-start-tournament]");
    if (tournamentButton) {
      await showCheckersTournament();
      return;
    }

    const tournamentFill = event.target.closest("[data-tournament-key-fill]");
    if (tournamentFill) {
      const key = tournamentFill.dataset.tournamentKeyFill || "";
      if (refs.tournamentKey) refs.tournamentKey.value = key;
      local.tournamentKey = key;
      return;
    }

    if (event.target.closest("[data-tournament-join]")) {
      const key = currentTournamentKey();
      const name = String(refs.tournamentName?.value || "").trim();
      const whatsapp = String(refs.tournamentWhatsapp?.value || "").trim();
      const testMode = isCheckersTournamentTestMode();
      const currentParticipant = local.tournamentSession?.participant || null;
      if (!testMode && !window.CatalogoGoogleAuth?.getUser?.()?.email) {
        await window.CatalogoGoogleAuth?.promptSignIn?.();
      }
      const shouldCheckIn = currentParticipant &&
        (currentParticipant.status === "approved" || currentParticipant.status === "checked-in");
      const payload = shouldCheckIn
        ? await joinCheckersTournament({ key: currentParticipant.key || key, name, testMode })
        : await registerCheckersTournament({
            key,
            name,
            whatsapp,
            email: testMode ? `teste-${Date.now()}@pubpaid.local` : "",
            testMode
          });
      setTournamentSession(payload, key);
      renderCheckersTournament(payload);
      return;
    }

    if (event.target.closest("[data-tournament-start-test]")) {
      const key = currentTournamentKey();
      const payload = await startCheckersTournamentTest({ key, testMode: isCheckersTournamentTestMode() });
      setTournamentSession(payload, key);
      renderCheckersTournament(payload);
      return;
    }

    const tournamentSimulate = event.target.closest("[data-tournament-simulate]");
    if (tournamentSimulate) {
      const matchId = tournamentSimulate.dataset.tournamentSimulate || "";
      const winnerId = tournamentSimulate.dataset.winnerKey || "";
      const winnerKey = local.tournamentSession?.tournament?.participants?.find?.((participant) => participant.id === winnerId)?.key || local.tournamentKey;
      const payload = await advanceCheckersTournamentTest({
        key: local.tournamentKey || currentTournamentKey(),
        winnerKey,
        matchId,
        testMode: isCheckersTournamentTestMode()
      });
      setTournamentSession(payload, local.tournamentKey || currentTournamentKey());
      renderCheckersTournament(payload);
      return;
    }

    if (event.target.closest("[data-tournament-play]")) {
      if (!local.tournamentSession?.currentMatch) {
        await showCheckersTournament();
        return;
      }
      local.tournamentMatch = local.tournamentSession.currentMatch;
      local.tournamentSelected = null;
      local.tournamentLegalMoves = [];
      resetDemoCheckersState();
      resetCheckersCamera();
      setPanel("checkers");
      renderPvpCheckers();
      return;
    }

    const demoButton = event.target.closest("[data-dom-start-demo]");
    if (demoButton) {
      const demoGame = demoButton.dataset.domStartDemo || "checkers";
      startDemoFlow(demoGame);
      return;
    }

    const startButton = event.target.closest("[data-dom-start-game]");
    if (startButton) {
      const nextGame = startButton.dataset.domStartGame || "pool";
      await startPvpFlow(nextGame, startButton);
      return;
    }

    const modeDemoButton = event.target.closest("[data-dom-mode-demo]");
    if (modeDemoButton) {
      startDemoFlow(modeDemoButton.dataset.domModeDemo || refs.modePicker?.dataset.game || "pool");
      return;
    }

    const modePvpButton = event.target.closest("[data-dom-mode-pvp]");
    if (modePvpButton) {
      await startPvpFlow(modePvpButton.dataset.domModePvp || refs.modePicker?.dataset.game || "pool", modePvpButton);
      return;
    }

    const gameCard = event.target.closest("[data-dom-game-card]");
    if (gameCard && !event.target.closest("button")) {
      showModePicker(gameCard.dataset.domGameCard || "pool");
      return;
    }
    if (event.target.closest("[data-dom-open-lobby]")) {
      window.clearInterval(local.pvpPollTimer);
      window.clearTimeout(local.resultReturnTimer);
      window.clearTimeout(local.checkersIntroTimer);
      window.clearTimeout(local.checkersIntroCreditsTimer);
      window.clearTimeout(local.demoAiTimer);
      local.checkersIntroLocked = false;
      local.checkersIntroCredits = false;
      local.checkersIntroPhase = "";
      local.checkersIntroMatchKey = "";
      local.demoAiThinking = false;
      local.demoAiPreviewMove = null;
      clearDemoChessAi();
      window.clearTimeout(local.chessIntroTimer);
      window.clearTimeout(local.chessIntroCreditsTimer);
      local.chessIntroLocked = false;
      local.chessIntroCredits = false;
      local.chessIntroPhase = "";
      local.chessIntroMatchKey = "";
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
      window.clearTimeout(local.checkersIntroTimer);
      window.clearTimeout(local.checkersIntroCreditsTimer);
      window.clearTimeout(local.demoAiTimer);
      local.checkersIntroLocked = false;
      local.checkersIntroCredits = false;
      local.checkersIntroPhase = "";
      local.checkersIntroMatchKey = "";
      local.demoAiThinking = false;
      local.demoAiPreviewMove = null;
      clearDemoChessAi();
      window.clearTimeout(local.chessIntroTimer);
      window.clearTimeout(local.chessIntroCreditsTimer);
      local.chessIntroLocked = false;
      local.chessIntroCredits = false;
      local.chessIntroPhase = "";
      local.chessIntroMatchKey = "";
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
      if (isPoolDemoActive()) return;
      emitGameSound("action", "pool");
      game.events.emit("pubpaid:pool-dom-shot");
      return;
    }
    if (event.target.closest("[data-pool-rules-toggle]")) {
      local.poolRulesOpen = true;
      syncPoolRuleUi(currentPoolRuleFormula());
      emitGameSound("select", "pool");
      return;
    }
    if (event.target.closest("[data-pool-rules-close]") || (event.target === refs.poolRuleModal && refs.poolRuleModal)) {
      local.poolRulesOpen = false;
      syncPoolRuleUi(currentPoolRuleFormula());
      emitGameSound("select", "pool");
      return;
    }
    const poolSetupButton = event.target.closest("[data-dom-pool-setup-action]");
    if (poolSetupButton) {
      const match = gameState.pvpMatch;
      if (!match?.id || gameState.pvpGameId !== "pool") return;
      const action = String(poolSetupButton.dataset.domPoolSetupAction || "start");
      const mode = String(poolSetupButton.dataset.domPoolSetupMode || "livre");
      const starter = String(poolSetupButton.dataset.domPoolSetupStarter || "");
      emitGameSound("ready", "pool");
      poolSetupButton.disabled = true;
      choosePoolSetup(match.id, action, mode, starter).then((payload) => {
        if (payload?.ok) {
          resetPvpPoolControls();
          routePvpState(payload);
        } else {
          poolSetupButton.disabled = false;
          if (refs.poolStatus) refs.poolStatus.textContent = payload?.error || "Nao foi possivel escolher agora.";
        }
      });
      return;
    }
    const poolSpinButton = event.target.closest("[data-dom-pool-spin]");
    if (poolSpinButton) {
      const spin = normalizePoolSpin(poolSpinButton.dataset.domPoolSpin || "centro");
      emitGameSound("select", "pool");
      if (isPoolDemoActive()) {
        return;
      } else if (gameState.pvpGameId === "pool" && local.poolControlStage === "aim") {
        local.poolSpin = spin;
        renderPvpPool();
      }
      return;
    }
    if (event.target.closest("[data-dom-pool-touch-shot]")) {
      if (isPoolDemoActive()) {
        return;
      }
      const match = gameState.pvpMatch;
      if (gameState.pvpGameId === "pool" && match?.id) {
        emitGameSound("action", "pool");
        handlePvpPoolShot(match);
      }
      return;
    }
    const poolAimStep = event.target.closest("[data-dom-pool-aim-step]");
    if (poolAimStep) {
      const step = Number(poolAimStep.dataset.domPoolAimStep || 0);
      if (isPoolDemoActive()) {
        return;
      } else if (gameState.pvpGameId === "pool" && local.poolControlStage === "aim") {
        local.poolAim = clampUiNumber(local.poolAim + step, -180, 180, 0);
        renderPvpPool();
      }
      return;
    }
    if (event.target.closest("[data-dom-pvp-ready]")) {
      const matchId = gameState.pvpMatch?.id || "";
      if (!matchId) return;
      emitGameSound("ready", gameState.pvpGameId || local.selectedGame || "pool");
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
      if (isTournamentCheckersActive()) {
        local.tournamentMatch = null;
        local.tournamentSelected = null;
        local.tournamentLegalMoves = [];
        await showCheckersTournament();
        return;
      }
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
        local.poolRenderKey = "";
        renderStablePoolStage(`vale-pool:demo:${Date.now()}`, renderValePoolPrototypeMarkup({ mode: "demo" }));
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
      if (isTableDemoActive()) {
        local.demoTable = null;
        showLobby();
        return;
      }
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
      if (match?.id) {
        emitGameSound("action", "pool");
        handlePvpPoolShot(match);
      }
      return;
    }
    const pokerCard = event.target.closest("[data-poker-card]");
    if (pokerCard) {
      const index = Number(pokerCard.dataset.pokerCard);
      local.pvpHeld[index] = !local.pvpHeld[index];
      emitGameSound("select", "poker");
      renderPvpTable();
      return;
    }
    if (event.target.closest("[data-poker-draw]")) {
      const matchId = gameState.pvpMatch?.id || "";
      if (isTableDemoActive() && local.demoTable?.gameId === "poker") {
        const state = local.demoTable.pokerState || {};
        const deck = Array.isArray(state.deck) ? state.deck : [];
        state.playerOneCards = (Array.isArray(state.playerOneCards) ? state.playerOneCards : []).map((card, index) =>
          local.pvpHeld[index] ? card : deck.shift() || card
        );
        state.playerOneDrawUsed = true;
        state.playerTwoDrawUsed = true;
        state.deck = deck;
        local.demoTable.updatedAt = new Date().toISOString();
        emitGameSound("action", "poker");
        renderPvpTable();
        return;
      }
      if (matchId) {
        emitGameSound("action", "poker");
        drawPoker(matchId, local.pvpHeld).then((payload) => payload?.ok && routePvpState(payload));
      }
      return;
    }
    const cards21Button = event.target.closest("[data-cards21-action]");
    if (cards21Button) {
      const matchId = gameState.pvpMatch?.id || "";
      const action = cards21Button.dataset.cards21Action || "stand";
      if (isTableDemoActive() && local.demoTable?.gameId === "cards21") {
        const state = local.demoTable.cardsState || {};
        state.playerOneCards = Array.isArray(state.playerOneCards) ? state.playerOneCards : [];
        if (action === "hit") {
          const nextCards = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
          state.playerOneCards.push(nextCards[(state.drawCount || 0) % nextCards.length]);
          state.drawCount = Number(state.drawCount || 0) + 1;
          if (sumCards21(state.playerOneCards) > 21) state.playerOneState = "busted";
        } else {
          state.playerOneState = "stood";
        }
        local.demoTable.updatedAt = new Date().toISOString();
        emitGameSound(action === "hit" ? "card" : "ready", "cards21");
        renderPvpTable();
        return;
      }
      if (matchId) {
        emitGameSound(action === "hit" ? "card" : "ready", "cards21");
        playCards21Action(matchId, action).then((payload) => payload?.ok && routePvpState(payload));
      }
      return;
    }
    const diceButton = event.target.closest("[data-dice-guess]");
    if (diceButton) {
      const matchId = gameState.pvpMatch?.id || "";
      if (isTableDemoActive() && local.demoTable?.gameId === "dicecups") {
        const guess = Number(diceButton.dataset.diceGuess);
        const state = local.demoTable.diceState || {};
        const a = 1 + Math.floor(Math.random() * 6);
        const b = 1 + Math.floor(Math.random() * 6);
        state.dice = [a, b];
        state.total = a + b;
        state.playerOneScore = Number(state.playerOneScore || 0) + (guess === state.total ? 1 : 0);
        local.demoTable.updatedAt = new Date().toISOString();
        emitGameSound(guess === state.total ? "win" : "dice", "dicecups");
        renderPvpTable();
        refs.tableStatus.textContent = guess === state.total ? "Você acertou a soma dos dados." : `Deu ${state.total}. Tente outra soma.`;
        return;
      }
      if (matchId) {
        emitGameSound("dice", "dicecups");
        guessDicecups(matchId, Number(diceButton.dataset.diceGuess)).then((payload) => payload?.ok && routePvpState(payload));
      }
      return;
    }
    const trucoButton = event.target.closest("[data-truco-card]");
    if (trucoButton) {
      const matchId = gameState.pvpMatch?.id || "";
      if (isTableDemoActive() && local.demoTable?.gameId === "truco") {
        const index = Number(trucoButton.dataset.trucoCard);
        const state = local.demoTable.trucoState || {};
        const cards = Array.isArray(state.playerOneCards) ? state.playerOneCards : [];
        const card = cards[index] || null;
        if (card) {
          cards[index] = null;
          state.table = [{ seat: "playerOne", card, at: new Date().toISOString() }];
          state.playerOneScore = Number(state.playerOneScore || 0) + 1;
          local.demoTable.updatedAt = new Date().toISOString();
          emitGameSound("card", "truco");
          renderPvpTable();
        }
        return;
      }
      if (matchId) {
        emitGameSound("card", "truco");
        playTrucoCard(matchId, Number(trucoButton.dataset.trucoCard)).then((payload) => payload?.ok && routePvpState(payload));
      }
      return;
    }
    const chessSquare = event.target.closest("[data-chess-square]");
    if (chessSquare) {
      const square = chessSquare.dataset.chessSquare || "";
      const demoChess = isTableDemoActive() && local.demoTable?.gameId === "chess";
      const match = demoChess ? local.demoTable : gameState.pvpMatch;
      if (!match || match.status !== "active") return;
      const state = decorateChessState(match.chessState || {});
      match.chessState = state;
      const turnSeat = chessSeatForColor(state, state.turnColor);
      const canAct = !local.chessIntroLocked && (demoChess ? turnSeat === "playerOne" && !local.demoChessAiThinking : turnSeat === gameState.pvpSeat);
      if (!canAct) return;
      const legalMoves = state.legalMoves || [];
      if (!local.chessSelected) {
        if (!legalMoves.some((move) => move.from === square)) {
          updateGameState({ prompt: "Escolha uma peca com lance legal. O brilho mostra uma opcao." });
          renderPvpTable();
          return;
        }
        local.chessSelected = square;
        emitGameSound("select", "chess");
        renderPvpTable();
        return;
      }
      const from = local.chessSelected;
      if (from === square) {
        local.chessSelected = "";
        renderPvpTable();
        return;
      }
      const selectedMoves = legalMoves.filter((move) => move.from === from);
      const legalMove = selectedMoves.find((move) => move.to === square);
      if (!legalMove) {
        if (legalMoves.some((move) => move.from === square)) {
          local.chessSelected = square;
          emitGameSound("select", "chess");
        } else {
          updateGameState({ prompt: "Destino invalido. Use os pontos verdes ou escolha outra peca." });
        }
        renderPvpTable();
        return;
      }
      local.chessSelected = "";
      if (demoChess) {
        const moveEntry = applyDemoChessMove(from, square, legalMove.promotion || "q");
        if (moveEntry) emitGameSound(chessMoveCue(moveEntry), "chess");
        renderPvpTable();
        scheduleDemoChessAiMove();
        return;
      }
      moveChess(match.id, from, square, legalMove.promotion || "q").then((payload) => {
        if (payload?.ok) {
          emitGameSound(chessMoveCue(payload.match?.chessState?.lastMove || legalMove), "chess");
          routePvpState(payload);
        } else {
          updateGameState({ prompt: payload?.error || "Nao foi possivel jogar esse lance." });
          renderPvpTable();
        }
      });
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
    if (!event.repeat && (event.code === "Enter" || event.code === "Space")) {
      const gameCard = event.target.closest?.("[data-dom-game-card]");
      if (gameCard && !event.target.closest?.("button")) {
        event.preventDefault();
        showModePicker(gameCard.dataset.domGameCard || "pool");
        return;
      }
    }
    if (event.code !== "Space" || event.repeat) return;
    if (isPoolDemoActive()) {
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
    if (local.checkersIntroLocked || !match || match.status !== "active" || match.turn !== seat || getCheckersOwner(piece) !== seat) {
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
    if (local.checkersIntroLocked) return;
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
    const cueX = rect.left + ((8 + clampUiNumber(cue.x, 0, 100, 25) * 0.84) / 100) * rect.width;
    const cueY = rect.top + ((12 + clampUiNumber(Number(cue.y) * 2, 0, 100, 50) * 0.76) / 100) * rect.height;
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
      state.lobbyPhase === "mode-select" ||
      state.lobbyPhase === "loading" ||
      state.lobbyPhase === "tournament" ||
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
        state.lobbyPhase === "mode-select" ? "escolha de modo" :
        state.lobbyPhase === "loading" ? "carregando" :
        state.lobbyPhase === "playing" ? "em mesa" :
        state.lobbyPhase === "finished" ? "resultado" :
        "pronto";
    }
    if (PVP_GAMES.has(state.pvpGameId) && state.pvpMatch?.status === "finished" && state.pvpSeat) {
      finishGenericMatchIfNeeded(state.pvpMatch, state.pvpGameId, state.pvpSeat);
      if (!refs.result.hidden) return;
    }
    bootReviewMode();
    if (state.lobbyPhase === "selecting" && !refs.lobby.hidden) return;
    if (state.lobbyPhase === "mode-select" && refs.modePicker && !refs.modePicker.hidden) return;
    if (state.lobbyPhase === "loading" && refs.loading && !refs.loading.hidden) return;
    if (state.lobbyPhase === "tournament" && refs.tournament && !refs.tournament.hidden) return;
    if (state.lobbyPhase === "blocked" && !refs.accessBlock.hidden) return;
    if (state.lobbyPhase === "blocked") {
      setPanel("access-block");
      return;
    }
    if (state.lobbyPhase === "matching" && !refs.matchmaking.hidden) return;
    if (state.currentScene === "game-lobby" || state.lobbyPhase === "selecting") {
      if (refs.pool.hidden && refs.checkers.hidden && refs.table?.hidden !== false && refs.result.hidden && refs.matchmaking.hidden && refs.tournament?.hidden !== false && refs.modePicker?.hidden !== false && refs.loading?.hidden !== false) setPanel("lobby");
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
