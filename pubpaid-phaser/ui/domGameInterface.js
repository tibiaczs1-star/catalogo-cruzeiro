import { gameState, subscribeGameState, updateGameState } from "../core/gameState.js";
import { joinPubpaidPvpQueue, leavePubpaidPvpQueue, syncPubpaidAccount } from "../services/accountService.js?v=20260517-real-pvp-checkers1";
import { confirmPvpReady, fetchPvpState, moveCheckers } from "../services/pvpService.js?v=20260517-real-pvp-checkers1";
import {
  CHECKERS_SIZE,
  countCheckersPieces,
  getCheckersLegalMoves,
  getCheckersOwner,
  isCheckersKing
} from "../core/checkersRules.js?v=20260517-real-pvp-checkers1";

function resultTitle(result) {
  if (result === "win") return "Vitória";
  if (result === "loss") return "Derrota";
  return "Empate";
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
    pvpPollTimer: null,
    resultReturnTimer: null,
    resultHandledMatchId: "",
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
    window.clearInterval(local.pvpPollTimer);
    window.clearTimeout(local.resultReturnTimer);
    local.pvpPollTimer = null;
    local.resultReturnTimer = null;
    local.resultHandledMatchId = "";
    local.pvpSelected = null;
    local.pvpLegalMoves = [];
    local.selectedGame = gameState.activeGameId || local.selectedGame || "pool";
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
      objective: "Escolher Sinuca ou Damas",
      prompt: "Lobby aberto. Mesas pagas exigem saldo real aprovado."
    });
  };

  const showResult = (gameId, result, body) => {
    window.clearTimeout(local.resultReturnTimer);
    local.selectedGame = gameId;
    refs.resultGame.textContent = gameId === "checkers" ? "damas" : "sinuca";
    refs.resultTitle.textContent = resultTitle(result);
    refs.resultBody.textContent = body;
    refs.result.dataset.result = result;
    setPanel("result");
    if (gameId === "checkers" && gameState.pvpGameId === "checkers") {
      syncPubpaidAccount().finally(() => {
        local.resultReturnTimer = window.setTimeout(() => {
          updateGameState({
            activeGameId: "",
            lobbyPhase: "selecting",
            pvpStatus: "idle",
            pvpGameId: "",
            pvpSeat: "",
            pvpMatchId: "",
            pvpMatch: null,
            pvpQueue: null,
            prompt: "Saldos reais atualizados. Voltando ao lobby."
          });
          showLobby();
        }, 4200);
      });
    }
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
      copy.title = "Damas é PvP real";
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

  const isRealCheckersEligible = () =>
    gameIdIsCheckers(local.selectedGame) &&
    Number(gameState.availableBalance || 0) >= Number(gameState.lobbyStake || 10);

  const isLoggedIn = () => Boolean(gameState.googleUser?.email || window.CatalogoGoogleAuth?.isSignedIn?.());

  const gameIdIsCheckers = (gameId) => gameId === "checkers";

  const displayNameFor = (player = {}) =>
    player?.name || player?.email?.split?.("@")?.[0] || "Jogador";

  const initialFor = (player = {}) => displayNameFor(player).trim().charAt(0).toUpperCase() || "?";

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
    refs.matchmakingGame.textContent = "Damas";
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
        : "Jogador real encontrado. Confirme pronto nos dois aparelhos para abrir o tabuleiro.";
      if (refs.pvpReady) {
        refs.pvpReady.hidden = false;
        refs.pvpReady.disabled = ownReady;
        refs.pvpReady.textContent = ownReady ? "Aguardando rival" : "Estou pronto";
      }
      return;
    }
    setMatchmakingState(match ? "matched" : "waiting");
    refs.matchmakingStatus.textContent = "Aguardando jogador real";
    if (refs.pvpReady) {
      refs.pvpReady.hidden = true;
      refs.pvpReady.disabled = false;
      refs.pvpReady.textContent = "Estou pronto";
    }
  };

  const renderPvpCheckers = () => {
    if (local.pvpRenderBusy) return;
    const match = gameState.pvpMatch;
    const seat = gameState.pvpSeat;
    const board = Array.isArray(match?.board) ? match.board : [];
    if (match?.status === "readying") {
      setPanel("matchmaking");
      renderMatchmakingState();
      return;
    }
    if (!board.length || !seat) return;
    local.pvpRenderBusy = true;
    const boardToDisplay = (row, col) =>
      seat === "playerTwo" ? { row: CHECKERS_SIZE - 1 - row, col: CHECKERS_SIZE - 1 - col } : { row, col };
    const displayToBoard = (row, col) =>
      seat === "playerTwo" ? { row: CHECKERS_SIZE - 1 - row, col: CHECKERS_SIZE - 1 - col } : { row, col };
    const targetKeys = new Set(
      local.pvpLegalMoves.map((move) => {
        const display = boardToDisplay(move.to.row, move.to.col);
        return `${display.row}-${display.col}`;
      })
    );
    refs.checkersBoard.dataset.orientation = seat === "playerTwo" ? "flipped" : "normal";
    refs.checkersBoard.dataset.seat = seat;
    try {
      refs.checkersBoard.innerHTML = Array.from({ length: CHECKERS_SIZE * CHECKERS_SIZE }, (_, index) => {
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
            local.pvpSelected?.row === rowIndex && local.pvpSelected?.col === colIndex ? "is-selected" : "",
            targetKeys.has(`${displayRow}-${displayCol}`) ? "is-target" : "",
            forcedPiece?.row === rowIndex && forcedPiece?.col === colIndex ? "is-forced" : "",
            lastMove?.from?.row === rowIndex && lastMove?.from?.col === colIndex ? "is-last-from" : "",
            lastMove?.to?.row === rowIndex && lastMove?.to?.col === colIndex ? "is-last-to" : "",
            lastMove?.capture?.row === rowIndex && lastMove?.capture?.col === colIndex ? "is-last-capture" : ""
          ].filter(Boolean).join(" ");
          const disabled = match.status !== "active" || match.turn !== seat ? " disabled" : "";
          const checker = piece
            ? `<span class="ppg-dom-piece is-${own ? "player" : "ai"}${isCheckersKing(piece) ? " is-king" : ""}">${isCheckersKing(piece) ? "D" : ""}</span>`
            : "";
          const aria = `linha ${rowIndex + 1}, coluna ${colIndex + 1}${piece ? own ? ", sua peça" : ", peça rival" : ""}`;
          return `<button type="button" class="${className}" data-row="${rowIndex}" data-col="${colIndex}" data-display-row="${displayRow}" data-display-col="${displayCol}" aria-label="${aria}"${disabled}>${checker}</button>`;
      }).join("");
      const ownPieces = countCheckersPieces(board, seat);
      const rivalPieces = board.flat().filter((piece) => getCheckersOwner(piece) && getCheckersOwner(piece) !== seat).length;
      const coin = match.coinFlip || {};
      const firstSeat = coin.firstSeat || "";
      const firstName = firstSeat ? displayNameFor(match[firstSeat]) : "";
      const coinLine = coin.face && firstName ? ` Moeda ${coin.face}: ${firstName} começa.` : "";
      refs.checkersTitle.textContent = match.status === "finished" ? "Mesa encerrada" : match.turn === seat ? "Sua vez" : "Vez do rival";
      refs.checkersScore.textContent = `${ownPieces} x ${rivalPieces}`;
      refs.checkersStatus.textContent =
        match.status === "finished"
          ? match.resultSummary || "Partida encerrada."
          : match.turn === seat
            ? `Sua vez. Escolha uma peça.${coinLine}`
            : `Aguardando jogada do rival.${coinLine}`;
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
          selected: local.pvpSelected,
          legalMoves: local.pvpLegalMoves.map((move) => ({ to: move.to, capture: Boolean(move.capture) })),
          forcedPiece: match.forcedPiece || null,
          lastMove: match.lastMove || null,
          moveCount: match.moveCount || 0,
          realPvp: true
        },
        objective: "Vencer a Dama real",
        focus: "tabuleiro PvP de dama",
        prompt: refs.checkersStatus.textContent
      });
      if (match.status === "finished") {
        window.clearInterval(local.pvpPollTimer);
        local.pvpPollTimer = null;
        const won = match.winner && match.winner === seat;
        const result = match.winner ? (won ? "win" : "loss") : "draw";
        const settlement = match.settlement || {};
        const payout = Number(settlement.payout || 0);
        const fee = Number(settlement.houseFee || 0);
        const body = match.winner
          ? `${match.resultSummary || "Partida encerrada."} ${won ? `Você recebeu ${payout} créditos reais.` : "Você perdeu a mesa."} Casa: ${fee}.`
          : `${match.resultSummary || "Empate."} Entrada devolvida.`;
        const resultKey = `${match.id}:${match.updatedAt || match.finishedAt || ""}`;
        if (local.resultHandledMatchId !== resultKey) {
          local.resultHandledMatchId = resultKey;
          showResult("checkers", result, body);
        }
      }
    } finally {
      local.pvpRenderBusy = false;
    }
  };

  const routePvpState = (payload = {}) => {
    if (payload.state === "waiting" || payload.state === "readying") {
      setPanel("matchmaking");
      setMatchmakingState(payload.state === "readying" ? "matched" : "waiting");
      renderMatchmakingState();
      return;
    }
    if (payload.state === "active" || payload.state === "finished") {
      setPanel("checkers");
      game.scene.stop("game-lobby-scene");
      game.scene.stop("pool-game-scene");
      renderPvpCheckers();
      return;
    }
    if (payload.state === "idle") showLobby();
  };

  const startPvpPolling = () => {
    window.clearInterval(local.pvpPollTimer);
    local.pvpPollTimer = window.setInterval(async () => {
      const payload = await fetchPvpState("checkers");
      if (payload?.ok) routePvpState(payload);
    }, 1200);
  };

  const startRealCheckers = async () => {
    local.selectedGame = "checkers";
    refs.matchmakingGame.textContent = "Damas";
    refs.matchmakingStatus.textContent = "Procurando jogador real com aposta equivalente.";
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
    const profile = window.pubpaidPlayerProfile?.() || {};
    const payload = await joinPubpaidPvpQueue("checkers", gameState.lobbyStake || 10, {
      name: profile.nick || profile.name || gameState.googleUser?.name || "",
      archetype: gameState.selectedCharacter?.id || "neon",
      favorite: "checkers"
    });
    if (!payload?.ok) {
      setMatchmakingState("error");
      refs.matchmakingStatus.textContent = payload?.error || "Nao foi possivel abrir a fila real.";
      updateGameState({ prompt: refs.matchmakingStatus.textContent });
      return;
    }
    routePvpState(payload);
    startPvpPolling();
  };

  document.addEventListener("click", async (event) => {
    const startButton = event.target.closest("[data-dom-start-game]");
    if (startButton) {
      const nextGame = startButton.dataset.domStartGame === "checkers" ? "checkers" : "pool";
      local.selectedGame = nextGame;
      if (nextGame === "checkers" && isRealCheckersEligible()) {
        startRealCheckers();
      } else if (nextGame === "checkers") {
        if (!isLoggedIn()) {
          showAccessBlock("pvp-only");
          return;
        }
        startButton.disabled = true;
        if (refs.lobbyState) refs.lobbyState.textContent = "atualizando saldo";
        updateGameState({ prompt: "Atualizando saldo aprovado antes de abrir Damas." });
        await syncPubpaidAccount();
        startButton.disabled = false;
        if (isRealCheckersEligible()) {
          startRealCheckers();
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
      if (gameState.pvpStatus === "waiting" || gameState.pvpStatus === "readying") leavePubpaidPvpQueue("checkers");
      game.scene.stop("pool-game-scene");
      game.scene.stop("checkers-game-scene");
      game.scene.start("game-lobby-scene", { gameId: local.selectedGame });
      showLobby();
      return;
    }
    if (event.target.closest("[data-dom-return-salon]")) {
      window.clearInterval(local.pvpPollTimer);
      window.clearTimeout(local.resultReturnTimer);
      if (gameState.pvpStatus === "waiting" || gameState.pvpStatus === "readying") leavePubpaidPvpQueue("checkers");
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
    if (event.target.closest("[data-dom-pvp-ready]")) {
      const matchId = gameState.pvpMatch?.id || "";
      if (!matchId) return;
      refs.pvpReady.disabled = true;
      refs.pvpReady.textContent = "Confirmando...";
      confirmPvpReady(matchId, "checkers").then((payload) => {
        if (payload?.ok) routePvpState(payload);
        else {
          refs.matchmakingStatus.textContent = payload?.error || "Nao foi possivel confirmar agora.";
          refs.pvpReady.disabled = false;
          refs.pvpReady.textContent = "Estou pronto";
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
      local.selectedGame === "checkers" && isRealCheckersEligible() ? startRealCheckers() : showAccessBlock("pvp-only");
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
        if (getCheckersOwner(piece) !== seat) {
          local.pvpSelected = null;
          local.pvpLegalMoves = [];
          renderPvpCheckers();
          return;
        }
        local.pvpSelected = { row, col };
        local.pvpLegalMoves = getCheckersLegalMoves(match.board, seat, match.forcedPiece || null)
          .filter((move) => move.from.row === row && move.from.col === col);
        renderPvpCheckers();
        return;
      }
      showAccessBlock("pvp-only");
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
    if (state.pvpGameId === "checkers" && (state.pvpMatch || state.pvpQueue)) {
      if (state.pvpMatch?.status === "readying" || state.pvpStatus === "waiting") {
        if (refs.matchmaking.hidden) setPanel("matchmaking");
        renderMatchmakingState();
        return;
      }
      if (state.pvpMatch && ["active", "finished"].includes(state.pvpMatch.status)) {
        if (refs.checkers.hidden) setPanel("checkers");
        renderPvpCheckers();
      }
    }
  });
}
