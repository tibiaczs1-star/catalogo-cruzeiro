export const gameState = {
  currentScene: "street",
  focus: "porta principal",
  mode: "nucleo phaser",
  prompt: "Clique na rua para mover. Entre pela porta ou use a saída para alternar entre rua e salão.",
  testBalance: 100,
  realBalance: 0,
  selectedTable: "darts",
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
