export const gameState = {
  currentScene: "street",
  focus: "porta principal",
  mode: "nucleo phaser",
  prompt: "Clique na rua para mover. Entre pela porta ou use a saída para alternar entre rua e salão.",
  googleUser: null,
  realBalance: 0,
  availableBalance: 0,
  lockedMatchBalance: 0,
  lockedWithdrawalBalance: 0,
  pendingDeposits: 0,
  pendingWithdrawals: 0,
  recentDeposits: [],
  recentWithdrawals: [],
  walletOpen: false,
  walletFeedback: "",
  pvpStatus: "idle",
  pvpGameId: "",
  pvpSeat: "",
  pvpMatchId: "",
  pvpMatch: null,
  pvpQueue: null,
  selectedTable: "pool",
  selectedCharacter: null,
  playerDirection: "down",
  playerMoving: false,
  activeGameId: "",
  lobbyPhase: "hub",
  lobbyOpponent: null,
  lobbyStake: 10,
  poolGame: null,
  dartsGame: null,
  checkersGame: null,
  panelBusy: false,
  panelSelection: null,
  stageEventActive: false,
  loungeQueue: "",
  objective: "Entrar no PubPaid pela porta principal",
  nerdAgent: "Pixo FX: sprites, neon e efeitos",
  panel: {
    open: false,
    kicker: "interação",
    title: "Ponto do jogo",
    body: "",
    chips: [],
    view: null,
    actions: []
  }
};

const listeners = new Set();

export function subscribeGameState(listener) {
  listeners.add(listener);
  listener(gameState);
  return () => listeners.delete(listener);
}

export function updateGameState(patch) {
  Object.assign(gameState, patch);
  listeners.forEach((listener) => listener(gameState));
}

export function updatePanel(panelPatch) {
  Object.assign(gameState.panel, panelPatch);
  listeners.forEach((listener) => listener(gameState));
}
