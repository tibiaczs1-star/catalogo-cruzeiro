import { TABLE_COPY } from "../config/gameConfig.js";
import { gameState, updateGameState, updatePanel } from "../core/gameState.js";
import { joinPubpaidPvpQueue, leavePubpaidPvpQueue } from "../services/accountService.js";
import { fetchPvpState, moveCheckers, throwDarts } from "../services/pvpService.js";

export function openPanel(content) {
  updatePanel({
    open: true,
    kicker: content.kicker,
    title: content.title,
    body: content.body,
    chips: content.chips || [],
    view: content.view || null,
    actions: content.actions || []
  });
}

export function closePanel() {
  updateGameState({ panelBusy: false, panelSelection: null });
  updatePanel({
    open: false,
    kicker: "interação",
    title: "Ponto do jogo",
    body: "",
    chips: [],
    view: null,
    actions: []
  });
}

export function setSelectedTable(tableId) {
  updateGameState({
    selectedTable: tableId,
    prompt: TABLE_COPY[tableId] || TABLE_COPY.darts
  });
}

function getPlayerLabel(match, seat) {
  if (!match) return "Jogador";
  const player = seat === "playerTwo" ? match.playerTwo : match.playerOne;
  return player?.name || (seat === "playerTwo" ? "Jogador 2" : "Jogador 1");
}

function getRivalLabel(match, seat) {
  if (!match) return "Rival";
  const rival = seat === "playerTwo" ? match.playerOne : match.playerTwo;
  return rival?.name || (seat === "playerTwo" ? "Jogador 1" : "Jogador 2");
}

function formatMatchBody(match, seat, state) {
  if (!match) {
    return "Entre em uma fila real para abrir a mesa. O saldo fica travado no escrow ate a partida terminar ou a fila ser cancelada.";
  }
  const stake = Number(match.stake || 0);
  const pot = stake * 2;
  const turnLabel = match.turn === seat ? "sua vez" : `vez de ${getRivalLabel(match, seat)}`;
  const deadline = match.deadlineAt ? ` Prazo de reconexao: ${new Date(match.deadlineAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}.` : "";
  if (state === "finished") {
    const payout = match?.settlement?.payout ?? (match.winner ? pot * 0.8 : stake);
    const result = match.winner
      ? match.winner === seat
        ? `Voce venceu e recebe ${payout} creditos.`
        : `${getRivalLabel(match, seat)} venceu.`
      : `Empate: ${stake} creditos voltam para cada jogador.`;
    return `${match.resultSummary || "Partida encerrada."} ${result}`;
  }
  if (state === "abandoned") {
    return `${match.resultSummary || "Mesa em reconexao."}${deadline}`;
  }
  return `${getPlayerLabel(match, seat)} contra ${getRivalLabel(match, seat)}. Entrada ${stake}, pote ${pot}, casa 20%. Agora: ${turnLabel}. ${match.resultSummary || ""}`;
}

function buildSettlementView(match, seat) {
  if (!match || !["finished", "abandoned"].includes(match.state)) return null;
  const stake = Number(match.stake || 0);
  const payout = Number(match?.settlement?.payout ?? (match.winner ? stake * 1.6 : stake));
  const houseFee = Number(match?.settlement?.houseFee ?? (match.winner ? stake * 0.4 : 0));
  const tone = match.winner
    ? match.winner === seat
      ? "win"
      : "loss"
    : "draw";
  return {
    tone,
    headline: tone === "win" ? "Vitoria confirmada" : tone === "loss" ? "Derrota confirmada" : "Empate auditado",
    detail:
      tone === "win"
        ? `Voce recebe ${payout} creditos e a casa segura ${houseFee}.`
        : tone === "loss"
          ? `${getRivalLabel(match, seat)} levou ${payout} creditos.`
          : `Entrada devolvida: ${stake} para cada lado.`,
    payout,
    houseFee,
    pot: stake * 2
  };
}

function openPvpPanel(payload = {}) {
  const state = payload.state || gameState.pvpStatus || "idle";
  const gameId = payload.gameId || gameState.pvpGameId || gameState.selectedTable || "darts";
  const match = payload.match || gameState.pvpMatch || null;
  const queue = payload.queue || gameState.pvpQueue || null;
  const seat = payload.seat || gameState.pvpSeat || "";
  const isDarts = gameId === "darts";
  const isCheckers = gameId === "checkers";
  const actions = [];

  if (state === "waiting") {
    actions.push({ id: "refresh-pvp", label: "Atualizar fila", primary: true });
    actions.push({ id: "leave-pvp", label: "Cancelar fila" });
  } else if (state === "active" && match) {
    actions.push({ id: "refresh-pvp", label: "Atualizar mesa" });
    if (match.turn === seat && isDarts) {
      actions.push({ id: "pvp-darts-50-50", label: "Mira bull", primary: true });
      actions.push({ id: "pvp-darts-50-18", label: "Triplo 20" });
      actions.push({ id: "pvp-darts-78-34", label: "Lateral direita" });
      actions.push({ id: "pvp-darts-30-62", label: "Baixo esquerdo" });
    }
    if (match.turn === seat && isCheckers) {
      const legalMoves = getLegalCheckersMoves(match.board || [], seat).slice(0, 6);
      legalMoves.forEach((move, index) => {
        actions.push({
          id: `pvp-checkers-move-${encodeCheckersMove(move)}`,
          label: `${formatSquare(move.from.row, move.from.col)}-${formatSquare(move.to.row, move.to.col)}`,
          primary: index === 0
        });
      });
      if (!legalMoves.length) {
        actions.push({ id: "refresh-pvp", label: "Sem jogada, atualizar", primary: true });
      }
    }
    actions.push({ id: "leave-pvp", label: "Sair da mesa" });
  } else if (state === "abandoned") {
    actions.push({ id: `join-${isCheckers ? "checkers" : "darts"}-pvp`, label: "Reconectar", primary: true });
    actions.push({ id: "refresh-pvp", label: "Atualizar" });
  } else {
    actions.push({ id: `join-${isCheckers ? "checkers" : "darts"}-pvp`, label: `Entrar em ${isCheckers ? "Dama" : "Dardos"}`, primary: true });
  }

  openPanel({
    kicker: state === "waiting" ? "fila real" : state === "active" ? "mesa real" : "pvp",
    title: isCheckers ? "Dama PvP" : "Dardos PvP",
    body:
      state === "waiting"
        ? `Fila aberta para ${isCheckers ? "Dama" : "Dardos"} com ${queue?.stake || 10} creditos travados no escrow. Aguardando rival.`
        : formatMatchBody(match, seat, state),
    chips: [
      `estado: ${state}`,
      `jogo: ${isCheckers ? "dama" : "dardos"}`,
      `assento: ${seat || "-"}`,
      `mesa: ${match?.id || queue?.id || "-"}`
    ],
    view: buildPvpView({ gameId, state, match, seat }),
    actions
  });
}

function buildPvpView({ gameId, state, match, seat }) {
  const settlement = buildSettlementView(match, seat);
  if (state === "waiting") {
    return {
      type: "queue",
      stake: match?.stake || gameState.pvpQueue?.stake || 10,
      label: gameId === "checkers" ? "mesa de dama procurando jogador" : "alvo de dardos procurando jogador"
    };
  }
  if (gameId === "darts") {
    const darts = match?.dartsState || {};
    return {
      type: "darts",
      state,
      seat,
      round: darts.round || 1,
      maxRounds: darts.maxRounds || 3,
      playerOneScore: darts.playerOneScore || 0,
      playerTwoScore: darts.playerTwoScore || 0,
      playerOneThrow: darts.lastPlayerOne || darts.playerOneThrow || null,
      playerTwoThrow: darts.lastPlayerTwo || darts.playerTwoThrow || null,
      history: darts.history || [],
      settlement,
      canPlay: state === "active" && match?.turn === seat,
      busy: gameState.panelBusy,
      phase: gameState.panelBusy
        ? "enviando"
        : state === "active" && match?.turn === seat
          ? "sua vez"
          : state === "active"
            ? "aguardando"
            : state
    };
  }
  if (gameId === "checkers") {
    const board = Array.isArray(match?.board) ? match.board : [];
    return {
      type: "checkers",
      state,
      seat,
      turn: match?.turn || "",
      board,
      legalMoves: match?.turn === seat ? getLegalCheckersMoves(board, seat).slice(0, 6) : [],
      settlement,
      selected: gameState.panelSelection,
      canPlay: state === "active" && match?.turn === seat,
      busy: gameState.panelBusy,
      phase: gameState.panelBusy
        ? "enviando"
        : state === "active" && match?.turn === seat
          ? "sua vez"
          : state === "active"
            ? "aguardando"
            : state
    };
  }
  return null;
}

function setPanelBusy(isBusy, prompt = "") {
  updateGameState({
    panelBusy: Boolean(isBusy),
    objective: isBusy ? "Jogada enviada" : gameState.objective,
    prompt: prompt || gameState.prompt
  });
}

function clearPanelBusyWithError(message) {
  updateGameState({
    panelBusy: false,
    prompt: message || "A mesa demorou a responder. Tente atualizar."
  });
}

function getCheckersOwner(piece = "") {
  if (!piece) return "";
  return piece.toLowerCase() === "p" ? "playerOne" : "playerTwo";
}

function getCheckersDirections(piece = "") {
  if (!piece) return [];
  if (piece === piece.toUpperCase()) return [[-1, -1], [-1, 1], [1, -1], [1, 1]];
  return piece.toLowerCase() === "p" ? [[-1, -1], [-1, 1]] : [[1, -1], [1, 1]];
}

function getAutoCheckersMove(board = [], owner = "playerOne") {
  const moves = [];
  for (let row = 0; row < 8; row += 1) {
    for (let col = 0; col < 8; col += 1) {
      const piece = board?.[row]?.[col];
      if (getCheckersOwner(piece) !== owner) continue;
      const enemy = owner === "playerOne" ? "playerTwo" : "playerOne";
      getCheckersDirections(piece).forEach(([rowStep, colStep]) => {
        const nextRow = row + rowStep;
        const nextCol = col + colStep;
        if (!board?.[nextRow] || nextCol < 0 || nextCol > 7) return;
        if (!board[nextRow][nextCol]) {
          moves.push({ from: { row, col }, to: { row: nextRow, col: nextCol }, capture: null });
          return;
        }
        const jumpRow = nextRow + rowStep;
        const jumpCol = nextCol + colStep;
        if (
          getCheckersOwner(board[nextRow][nextCol]) === enemy &&
          board?.[jumpRow] &&
          jumpCol >= 0 &&
          jumpCol <= 7 &&
          !board[jumpRow][jumpCol]
        ) {
          moves.unshift({
            from: { row, col },
            to: { row: jumpRow, col: jumpCol },
            capture: { row: nextRow, col: nextCol }
          });
        }
      });
    }
  }
  return moves[0] || null;
}

function getLegalCheckersMoves(board = [], owner = "playerOne") {
  const moves = [];
  for (let row = 0; row < 8; row += 1) {
    for (let col = 0; col < 8; col += 1) {
      const piece = board?.[row]?.[col];
      if (getCheckersOwner(piece) !== owner) continue;
      const enemy = owner === "playerOne" ? "playerTwo" : "playerOne";
      getCheckersDirections(piece).forEach(([rowStep, colStep]) => {
        const nextRow = row + rowStep;
        const nextCol = col + colStep;
        if (!board?.[nextRow] || nextCol < 0 || nextCol > 7) return;
        if (!board[nextRow][nextCol]) {
          moves.push({ from: { row, col }, to: { row: nextRow, col: nextCol }, capture: null });
          return;
        }
        const jumpRow = nextRow + rowStep;
        const jumpCol = nextCol + colStep;
        if (
          getCheckersOwner(board[nextRow][nextCol]) === enemy &&
          board?.[jumpRow] &&
          jumpCol >= 0 &&
          jumpCol <= 7 &&
          !board[jumpRow][jumpCol]
        ) {
          moves.push({
            from: { row, col },
            to: { row: jumpRow, col: jumpCol },
            capture: { row: nextRow, col: nextCol }
          });
        }
      });
    }
  }
  const captures = moves.filter((move) => move.capture);
  return captures.length ? captures : moves;
}

function encodeCheckersMove(move) {
  return [
    move?.from?.row ?? 0,
    move?.from?.col ?? 0,
    move?.to?.row ?? 0,
    move?.to?.col ?? 0
  ].join("-");
}

function decodeCheckersMove(encoded = "") {
  const [fromRow, fromCol, toRow, toCol] = String(encoded).split("-").map((item) => Number(item));
  if (![fromRow, fromCol, toRow, toCol].every((item) => Number.isInteger(item))) return null;
  return {
    from: { row: fromRow, col: fromCol },
    to: { row: toRow, col: toCol }
  };
}

function formatSquare(row, col) {
  return `${String.fromCharCode(65 + col)}${row + 1}`;
}

export function runPanelAction(actionId) {
  if (actionId === "close-panel") {
    closePanel();
    return;
  }

  if (actionId === "reset-test") {
    updateGameState({
      testBalance: 100,
      objective: "Escolher uma mesa para testar",
            prompt: "Bartender: 100 créditos de teste recarregados."
    });
    return;
  }

  if (actionId === "open-game-lobby-darts" || actionId === "open-game-lobby-checkers") {
    const gameId = actionId.endsWith("checkers") ? "checkers" : "darts";
    closePanel();
    updateGameState({
      activeGameId: gameId,
      selectedTable: gameId,
      lobbyPhase: "selecting",
      objective: "Abrir lobby do jogo",
            prompt: `${gameId === "darts" ? "Dardos" : "Dama"} escolhido. Abrindo lobby separado.`
    });
    window.pubpaidPhaserGame?.scene?.stop?.("interior-scene");
    window.pubpaidPhaserGame?.scene?.start?.("game-lobby-scene", { gameId });
    return;
  }

  if (actionId === "suggest-darts") {
    setSelectedTable("darts");
    updateGameState({
      focus: "balcão do bartender",
      objective: "Ir para Dardos",
            prompt: "Bartender: vá de Dardos primeiro. É a melhor leitura de ritmo do núcleo."
    });
    return;
  }

  if (actionId === "toggle-stage-event") {
    updateGameState({
      stageEventActive: !gameState.stageEventActive,
      objective: !gameState.stageEventActive ? "Explorar o salão com evento ativo" : "Escolher outro ponto ativo",
            prompt: !gameState.stageEventActive
        ? "Evento do palco ativado. O salão ganhou clima de noite grande."
        : "Evento do palco encerrado. O salão voltou ao modo base."
    });
    return;
  }

  if (actionId === "queue-casual") {
    setSelectedTable("checkers");
    updateGameState({
      loungeQueue: "casual",
      objective: "Aguardar mesa casual",
            prompt: "Fila casual aberta na mesa oeste. Dama virou a mesa sugerida."
    });
    return;
  }

  if (actionId === "queue-premium") {
    setSelectedTable("poker");
    updateGameState({
      loungeQueue: "premium",
      objective: "Aguardar mesa premium",
            prompt: "Fila premium aberta na mesa leste. Poker virou a mesa social do momento."
    });
    return;
  }

  if (actionId === "join-darts-pvp" || actionId === "join-checkers-pvp") {
    const gameId = actionId === "join-checkers-pvp" ? "checkers" : "darts";
    setSelectedTable(gameId);
    updateGameState({
      objective: "Travando escrow PvP",
            prompt: `Abrindo fila real de ${gameId === "darts" ? "Dardos" : "Dama"} com 10 créditos.`
    });
    joinPubpaidPvpQueue(gameId, 10).then((payload) => {
      if (!payload?.ok) {
        updateGameState({
          objective: "Depositar antes do PvP",
                    prompt: payload?.error || "Saldo real indisponivel para escrow."
        });
        return;
      }
      openPvpPanel(payload);
    });
    return;
  }

  if (actionId === "leave-pvp") {
    const gameId = gameState.pvpGameId || gameState.selectedTable || "darts";
    updateGameState({
      objective: "Saindo da fila PvP",
      prompt: "Cancelando fila ou abandonando mesa ativa."
    });
    leavePubpaidPvpQueue(gameId).then((payload) => {
      if (payload?.ok) openPvpPanel(payload);
    });
    return;
  }

  if (actionId === "refresh-pvp") {
    const gameId = gameState.pvpGameId || gameState.selectedTable || "darts";
    fetchPvpState(gameId).then((payload) => {
      if (payload?.ok) openPvpPanel(payload);
    });
    return;
  }

  if (actionId.startsWith("pvp-darts-")) {
    if (gameState.panelBusy) return;
    const [, , aimX = "50", aimY = "50"] = actionId.split("-");
    const aim = {
      x: Number(aimX) || 50,
      y: Number(aimY) || 50
    };
    setPanelBusy(true, "Dardo lançado. Aguardando resposta da mesa.");
    throwDarts(gameState.pvpMatchId, aim.x, aim.y).then((payload) => {
      setPanelBusy(false);
      if (payload?.ok) {
        openPvpPanel(payload);
      } else {
        updateGameState({ prompt: payload?.error || "Arremesso recusado pela mesa." });
      }
    }).catch(() => clearPanelBusyWithError("Falha ao enviar o dardo."));
    return;
  }

  if (actionId.startsWith("pvp-checkers-move-")) {
    if (gameState.panelBusy) return;
    const move = decodeCheckersMove(actionId.replace("pvp-checkers-move-", ""));
    if (!move) {
      updateGameState({ prompt: "Movimento de Dama inválido no painel." });
      return;
    }
    setPanelBusy(true, "Movimento de Dama enviado para validacao do servidor.");
    moveCheckers(gameState.pvpMatchId, move).then((payload) => {
      setPanelBusy(false);
      updateGameState({ panelSelection: null });
      if (payload?.ok) {
        openPvpPanel(payload);
      } else {
        updateGameState({ prompt: payload?.error || "Movimento recusado pela mesa." });
      }
    }).catch(() => clearPanelBusyWithError("Falha ao enviar o movimento."));
    return;
  }

  if (actionId === "pvp-checkers-auto") {
    if (gameState.panelBusy) return;
    const match = gameState.pvpMatch || {};
    const move = getAutoCheckersMove(match.board || [], gameState.pvpSeat || "playerOne");
    if (!move) {
      updateGameState({ prompt: "Nenhuma jogada legal encontrada para sua vez." });
      return;
    }
    setPanelBusy(true, "Movimento de Dama enviado para validacao do servidor.");
    moveCheckers(gameState.pvpMatchId, move).then((payload) => {
      setPanelBusy(false);
      if (payload?.ok) {
        openPvpPanel(payload);
      } else {
        updateGameState({ prompt: payload?.error || "Movimento recusado pela mesa." });
      }
    }).catch(() => clearPanelBusyWithError("Falha ao enviar o movimento."));
  }
}

export function handlePanelDartsAim(aimX, aimY) {
  if (gameState.panelBusy || gameState.pvpStatus !== "active") return;
  if (gameState.pvpMatch?.turn !== gameState.pvpSeat) {
    updateGameState({ prompt: "Aguarde sua vez para mirar." });
    return;
  }
  const x = Math.max(8, Math.min(92, Math.round(Number(aimX) || 50)));
  const y = Math.max(8, Math.min(92, Math.round(Number(aimY) || 50)));
  setPanelBusy(true, `Mira enviada em ${x}, ${y}.`);
  throwDarts(gameState.pvpMatchId, x, y).then((payload) => {
    setPanelBusy(false);
    if (payload?.ok) {
      openPvpPanel(payload);
    } else {
      updateGameState({ prompt: payload?.error || "Arremesso recusado pela mesa." });
    }
  }).catch(() => clearPanelBusyWithError("Falha ao enviar o dardo."));
}

export function handlePanelCheckersCell(row, col) {
  if (gameState.panelBusy || gameState.pvpStatus !== "active") return;
  const match = gameState.pvpMatch || {};
  if (match.turn !== gameState.pvpSeat) {
    updateGameState({ prompt: "Aguarde sua vez na Dama." });
    return;
  }
  const legalMoves = getLegalCheckersMoves(match.board || [], gameState.pvpSeat || "playerOne");
  const selected = gameState.panelSelection;
  const fromMoves = legalMoves.filter((move) => move.from.row === row && move.from.col === col);
  if (!selected && fromMoves.length) {
    updateGameState({ panelSelection: { row, col }, prompt: "Peça selecionada. Agora escolha o destino." });
    openPvpPanel({ state: gameState.pvpStatus, gameId: "checkers", match, seat: gameState.pvpSeat });
    return;
  }
  if (selected) {
    const chosen = legalMoves.find((move) =>
      move.from.row === selected.row &&
      move.from.col === selected.col &&
      move.to.row === row &&
      move.to.col === col
    );
    if (chosen) {
      updateGameState({ panelSelection: null });
      runPanelAction(`pvp-checkers-move-${encodeCheckersMove(chosen)}`);
      return;
    }
    if (fromMoves.length) {
      updateGameState({ panelSelection: { row, col }, prompt: "Peça trocada. Escolha o destino." });
      openPvpPanel({ state: gameState.pvpStatus, gameId: "checkers", match, seat: gameState.pvpSeat });
      return;
    }
    updateGameState({ panelSelection: null, prompt: "Destino inválido. Selecione uma peça com jogada legal." });
    openPvpPanel({ state: gameState.pvpStatus, gameId: "checkers", match, seat: gameState.pvpSeat });
  }
}
