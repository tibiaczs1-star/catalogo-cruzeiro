import { subscribeGameState } from "../core/gameState.js";
import { runPanelAction } from "../ui/panelActions.js";

const refs = {
  scene: document.querySelector("[data-game-scene]"),
  focus: document.querySelector("[data-game-focus]"),
  mode: document.querySelector("[data-game-mode]"),
  testBalance: document.querySelector("[data-game-test-balance]"),
  realBalance: document.querySelector("[data-game-real-balance]"),
  objective: document.querySelector("[data-game-objective]"),
  nerdAgent: document.querySelector("[data-game-nerd-agent]"),
  prompt: document.querySelector("[data-game-prompt-copy]"),
  panel: document.querySelector("[data-game-panel]"),
  panelKicker: document.querySelector("[data-game-panel-kicker]"),
  panelTitle: document.querySelector("[data-game-panel-title]"),
  panelBody: document.querySelector("[data-game-panel-body]"),
  panelChips: document.querySelector("[data-game-panel-chips]"),
  panelActions: document.querySelector("[data-game-panel-actions]"),
  accountLabel: document.querySelector("[data-game-account-label]")
};

function renderChips(chips = []) {
  if (!refs.panelChips) return;
  refs.panelChips.innerHTML = "";
  chips.forEach((chip) => {
    const node = document.createElement("span");
    node.textContent = chip;
    refs.panelChips.appendChild(node);
  });
}

function renderActions(actions = []) {
  if (!refs.panelActions) return;
  refs.panelActions.innerHTML = "";
  actions.forEach((action) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = action.label;
    button.dataset.panelAction = action.id;
    if (action.primary) button.classList.add("is-primary");
    refs.panelActions.appendChild(button);
  });
}

export function bindOverlay() {
  refs.panelActions?.addEventListener("click", (event) => {
    const actionButton = event.target.closest("[data-panel-action]");
    if (!actionButton) return;
    runPanelAction(actionButton.dataset.panelAction || "");
  });

  refs.panel?.querySelector("[data-game-panel-close]")?.addEventListener("click", () => {
    runPanelAction("close-panel");
  });

  subscribeGameState((state) => {
    if (refs.scene) refs.scene.textContent = state.currentScene;
    if (refs.focus) refs.focus.textContent = state.focus;
    if (refs.mode) refs.mode.textContent = state.mode;
    if (refs.testBalance) refs.testBalance.textContent = String(state.testBalance);
    if (refs.realBalance) refs.realBalance.textContent = String(state.realBalance);
    if (refs.objective) refs.objective.textContent = state.objective;
    if (refs.nerdAgent) refs.nerdAgent.textContent = state.nerdAgent;
    if (refs.prompt) refs.prompt.textContent = state.prompt;
    if (refs.accountLabel) {
      refs.accountLabel.textContent =
        state.realBalance > 0
          ? `Saldo real detectado: ${state.realBalance} créditos. O núcleo já pode ser ligado à carteira publicada.`
          : "Rua e salão já estão organizados em scenes separadas. O próximo salto é ligar tudo à carteira e ao matchmaking real.";
    }
    if (refs.panel) refs.panel.hidden = !state.panel.open;
    if (refs.panelKicker) refs.panelKicker.textContent = state.panel.kicker;
    if (refs.panelTitle) refs.panelTitle.textContent = state.panel.title;
    if (refs.panelBody) refs.panelBody.textContent = state.panel.body;
    renderChips(state.panel.chips);
    renderActions(state.panel.actions);
  });
}
