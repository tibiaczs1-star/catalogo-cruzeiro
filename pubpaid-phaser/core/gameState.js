const DEMO_BALANCE_KEY = "pubpaid_v2_demo_credits";

function readDemoBalance() {
  try {
    const stored = window.localStorage.getItem(DEMO_BALANCE_KEY);
    if (stored === null) return 100;
    const value = Number(stored);
    return Number.isFinite(value) ? value : 100;
  } catch (_error) {
    return 100;
  }
}

function persistDemoBalance(value) {
  try {
    window.localStorage.setItem(DEMO_BALANCE_KEY, String(value));
  } catch (_error) {
    // Demo credits should never block gameplay.
  }
}

export const gameState = {
  currentScene: "street",
  focus: "porta principal",
  mode: "nucleo phaser",
  prompt: "Clique na rua para mover. Entre pela porta ou use a saída para alternar entre rua e salão.",
  testBalance: readDemoBalance(),
  realBalance: 0,
  availableBalance: 0,
  lockedMatchBalance: 0,
  lockedWithdrawalBalance: 0,
  pendingDeposits: 0,
  pendingWithdrawals: 0,
  recentDeposits: [],
  recentWithdrawals: [],
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
  lastDemoSettlement: null,
  demoCreditHistory: [],
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

export function settleDemoMatch({ gameId, result, stake = 10, summary = "" } = {}) {
  const normalizedResult = result === "win" || result === "loss" || result === "draw" ? result : "draw";
  const safeStake = Math.max(0, Math.floor(Number(stake) || 0));
  const delta = normalizedResult === "win" ? safeStake : normalizedResult === "loss" ? -safeStake : 0;
  const nextBalance = Math.max(0, Number(gameState.testBalance || 0) + delta);
  const settlement = {
    gameId: gameId || gameState.activeGameId || "",
    result: normalizedResult,
    stake: safeStake,
    delta,
    balance: nextBalance,
    summary,
    demoOnly: true,
    at: new Date().toISOString()
  };
  persistDemoBalance(nextBalance);
  updateGameState({
    testBalance: nextBalance,
    lastDemoSettlement: settlement,
    demoCreditHistory: [settlement, ...gameState.demoCreditHistory].slice(0, 8)
  });
  return settlement;
}

export function updatePanel(panelPatch) {
  Object.assign(gameState.panel, panelPatch);
  listeners.forEach((listener) => listener(gameState));
}
