import { TABLE_COPY } from "../config/gameConfig.js";
import { NERD_TEAM, formatNerdAgent } from "../config/nerdTeam.js";
import { gameState, updateGameState, updatePanel } from "../core/gameState.js";

export function openPanel(content) {
  updatePanel({
    open: true,
    kicker: content.kicker,
    title: content.title,
    body: content.body,
    chips: content.chips || [],
    actions: content.actions || []
  });
}

export function closePanel() {
  updatePanel({
    open: false,
    kicker: "interação",
    title: "Ponto do jogo",
    body: "",
    chips: [],
    actions: []
  });
}

export function setSelectedTable(tableId) {
  updateGameState({
    selectedTable: tableId,
    prompt: TABLE_COPY[tableId] || TABLE_COPY.darts
  });
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
      nerdAgent: formatNerdAgent(NERD_TEAM.hud),
      prompt: "Bartender: 100 créditos de teste recarregados."
    });
    return;
  }

  if (actionId === "suggest-darts") {
    setSelectedTable("darts");
    updateGameState({
      focus: "balcão do bartender",
      objective: "Ir para Dardos",
      nerdAgent: formatNerdAgent(NERD_TEAM.engine),
      prompt: "Bartender: vá de Dardos primeiro. É a melhor leitura de ritmo do núcleo."
    });
    return;
  }

  if (actionId === "toggle-stage-event") {
    updateGameState({
      stageEventActive: !gameState.stageEventActive,
      objective: !gameState.stageEventActive ? "Explorar o salão com evento ativo" : "Escolher outro ponto ativo",
      nerdAgent: formatNerdAgent(NERD_TEAM.sprite),
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
      nerdAgent: formatNerdAgent(NERD_TEAM.engine),
      prompt: "Fila casual aberta na mesa oeste. Dama virou a mesa sugerida."
    });
    return;
  }

  if (actionId === "queue-premium") {
    setSelectedTable("poker");
    updateGameState({
      loungeQueue: "premium",
      objective: "Aguardar mesa premium",
      nerdAgent: formatNerdAgent(NERD_TEAM.qa),
      prompt: "Fila premium aberta na mesa leste. Poker virou a mesa social do momento."
    });
  }
}
