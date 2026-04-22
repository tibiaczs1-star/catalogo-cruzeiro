import { GAME_HEIGHT, GAME_WIDTH } from "./config/gameConfig.js";
import { gameState } from "./core/gameState.js";
import { createPubPaidSoundtrack } from "./audio/chipTechSoundtrack.js";
import { bindOverlay } from "./ui/overlay.js";
import { closePanel } from "./ui/panelActions.js";
import { syncPubpaidAccount } from "./services/accountService.js";
import { BootScene } from "./scenes/BootScene.js";
import { IntroScene } from "./scenes/IntroScene.js";
import { StreetScene } from "./scenes/StreetScene.js";
import { InteriorScene } from "./scenes/InteriorScene.js";
import { UIScene } from "./scenes/UIScene.js";

bindOverlay();

const config = {
  type: Phaser.AUTO,
  parent: "pubpaid-phaser-root",
  transparent: true,
  backgroundColor: "#02050d",
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: GAME_WIDTH,
    height: GAME_HEIGHT
  },
  scene: [BootScene, IntroScene, StreetScene, InteriorScene, UIScene]
};

const game = new Phaser.Game(config);
const soundtrack = createPubPaidSoundtrack();

const TERMS_KEY = "pubpaid_v2_terms_accepted";
const refs = {
  body: document.body,
  splash: document.querySelector("[data-splash-screen]"),
  enterButtons: Array.from(document.querySelectorAll("[data-enter-game]")),
  exitButtons: Array.from(document.querySelectorAll("[data-exit-game]")),
  termsCheckbox: document.querySelector("[data-terms-checkbox]"),
  acceptTerms: document.querySelector("[data-accept-terms]"),
  openGame: document.querySelector("[data-open-game]"),
  authStatus: document.querySelector("[data-google-auth-status]"),
  authEmail: document.querySelector("[data-google-auth-email]"),
  authCard: document.querySelector("[data-google-auth-card]"),
  authTitle: document.querySelector("[data-auth-title]"),
  audioToggle: document.querySelector("[data-audio-toggle]"),
  permissionGate: document.querySelector("[data-permission-gate]"),
  startExperience: document.querySelector("[data-start-experience]"),
  permissionStatus: document.querySelector("[data-permission-status]"),
  canvasShell: document.querySelector(".ppg-canvas-shell")
};

let currentStep = "intro";
let gameStarted = false;
let introStarted = false;

function getAuthApi() {
  return window.CatalogoGoogleAuth || null;
}

function isAuthRequired() {
  const auth = getAuthApi();
  return Boolean(auth?.isEnabled?.());
}

function canUseLocalDemoAccess() {
  const auth = getAuthApi();
  return Boolean(auth?.isReady?.() && !auth?.isEnabled?.());
}

function hasAcceptedTerms() {
  try {
    return window.localStorage.getItem(TERMS_KEY) === "1";
  } catch (_error) {
    return false;
  }
}

function setAcceptedTerms(accepted) {
  try {
    if (accepted) {
      window.localStorage.setItem(TERMS_KEY, "1");
    } else {
      window.localStorage.removeItem(TERMS_KEY);
    }
  } catch (_error) {
    // ignore storage failures
  }
}

function setStep(step) {
  currentStep = step;
  document.querySelectorAll("[data-splash-step]").forEach((node) => {
    const active = node.getAttribute("data-splash-step") === step;
    node.hidden = !active;
    node.classList.toggle("is-active", active);
  });
}

function syncEnterExitButtons() {
  refs.enterButtons.forEach((button) => {
    button.hidden = gameStarted;
  });
  refs.exitButtons.forEach((button) => {
    button.hidden = !gameStarted;
  });
}

function syncAudioButton() {
  if (!refs.audioToggle) return;
  const playing = soundtrack.isPlaying();
  refs.audioToggle.setAttribute("aria-pressed", String(playing));
  refs.audioToggle.textContent = playing ? "Som ligado" : "Ligar som";
  refs.audioToggle.classList.toggle("is-playing", playing);
}

function startSoundtrackFromGesture() {
  if (soundtrack.isPlaying()) return;
  soundtrack.start();
  syncAudioButton();
}

async function requestFullscreen() {
  const target = refs.canvasShell || document.documentElement;
  if (document.fullscreenElement || !target?.requestFullscreen) return true;
  try {
    await target.requestFullscreen({ navigationUI: "hide" });
    return true;
  } catch (_error) {
    return false;
  }
}

function setPermissionStatus(message) {
  if (refs.permissionStatus) {
    refs.permissionStatus.textContent = message;
  }
}

function startIntroScene() {
  if (introStarted) return;
  introStarted = true;
  refs.permissionGate?.setAttribute("hidden", "");
  if (!game.scene.isActive("intro-scene")) {
    game.scene.start("intro-scene");
  }
}

async function activateExperience() {
  if (refs.startExperience) {
    refs.startExperience.disabled = true;
  }
  setPermissionStatus("Liberando tela cheia e som...");
  const fullscreenOk = await requestFullscreen();
  soundtrack.startIntro();
  syncAudioButton();
  setPermissionStatus(fullscreenOk ? "Tela cheia ativa. Iniciando..." : "Som ativo. Iniciando...");
  startIntroScene();
  if (refs.startExperience) {
    refs.startExperience.disabled = false;
  }
}

async function syncAuthUi() {
  const auth = getAuthApi();
  const signedIn = Boolean(auth?.isSignedIn?.());
  const localDemoAccess = canUseLocalDemoAccess();
  refs.body?.classList.toggle("has-local-demo-access", localDemoAccess);
  refs.authCard?.classList.toggle("is-local-demo", localDemoAccess);
  if (refs.openGame) {
    refs.openGame.disabled = !((signedIn || localDemoAccess) && hasAcceptedTerms());
      refs.openGame.textContent = localDemoAccess ? "Entrar no jogo com acesso local" : "Entrar no jogo";
  }
  if (refs.authTitle) {
    refs.authTitle.textContent = localDemoAccess ? "Acesso local liberado." : "Entre no PubPaid 2.";
  }
  if (localDemoAccess) {
    if (refs.authStatus) {
      refs.authStatus.textContent = "Google ainda nao configurado. Entrada local liberada para teste.";
    }
    if (refs.authEmail) {
      refs.authEmail.textContent = "No Render, configure GOOGLE_AUTH_CLIENT_ID para ativar login real.";
    }
  }
  if (signedIn) {
    await syncPubpaidAccount();
  }
}

function openSplash(step = "intro") {
  refs.permissionGate?.setAttribute("hidden", "");
  refs.body?.classList.add("game-is-locked");
  refs.splash?.removeAttribute("hidden");
  setStep(step);
  gameStarted = false;
  closePanel();
  syncEnterExitButtons();
}

function startGame() {
  refs.body?.classList.remove("game-is-locked");
  refs.splash?.setAttribute("hidden", "");
  if (game.scene.isActive("intro-scene")) {
    game.scene.stop("intro-scene");
  }
  if (!game.scene.isActive("street-scene") && !game.scene.isActive("interior-scene")) {
    game.scene.start("street-scene");
  }
  if (!game.scene.isActive("ui-scene")) {
    game.scene.start("ui-scene");
  }
  gameStarted = true;
  syncEnterExitButtons();
}

function resolveEntryStep() {
  const auth = getAuthApi();
  const signedIn = Boolean(auth?.isSignedIn?.());
  if (!hasAcceptedTerms()) return "terms";
  if (!signedIn || canUseLocalDemoAccess()) return "auth";
  return "auth";
}

function tryEnterFlow() {
  openSplash(resolveEntryStep());
}

function bindSplash() {
  document.addEventListener("click", async (event) => {
    if (event.target.closest("[data-start-experience]")) {
      event.preventDefault();
      await activateExperience();
      return;
    }

    if (event.target.closest("[data-audio-toggle]")) {
      event.preventDefault();
      if (!introStarted) {
        await activateExperience();
      } else {
        soundtrack.toggle();
      }
      syncAudioButton();
      return;
    }

    if (introStarted) {
      startSoundtrackFromGesture();
    }

    const nextButton = event.target.closest("[data-splash-next]");
    if (nextButton) {
      setStep(nextButton.getAttribute("data-splash-next") || "terms");
      return;
    }

    const backButton = event.target.closest("[data-splash-back]");
    if (backButton) {
      setStep(backButton.getAttribute("data-splash-back") || "intro");
      return;
    }

    if (event.target.closest("[data-enter-game]")) {
      event.preventDefault();
      tryEnterFlow();
      return;
    }

    if (event.target.closest("[data-exit-game]")) {
      event.preventDefault();
      openSplash(getAuthApi()?.isSignedIn?.() ? "auth" : "intro");
      return;
    }

    if (event.target.closest("[data-accept-terms]")) {
      if (!refs.termsCheckbox?.checked) return;
      setAcceptedTerms(true);
      await syncAuthUi();
      setStep("auth");
      const auth = getAuthApi();
      if (isAuthRequired()) {
        await auth?.promptSignIn?.();
      }
      return;
    }

    if (event.target.closest("[data-open-game]")) {
      const auth = getAuthApi();
      if (canUseLocalDemoAccess()) {
        startGame();
        return;
      }
      if (!auth?.isSignedIn?.()) {
        await auth?.promptSignIn?.();
        return;
      }
      if (!hasAcceptedTerms()) {
        setStep("terms");
        return;
      }
      startGame();
    }
  });

  refs.termsCheckbox?.addEventListener("change", () => {
    if (refs.acceptTerms) {
      refs.acceptTerms.disabled = !refs.termsCheckbox.checked;
    }
  });

  window.addEventListener("keydown", () => {
    if (!introStarted) {
      void activateExperience();
      return;
    }
    startSoundtrackFromGesture();
  }, { once: true });

  window.addEventListener("catalogo:google-auth", async () => {
    await syncAuthUi();
  });
}

bindSplash();
syncAudioButton();
syncEnterExitButtons();
refs.body?.classList.add("game-is-locked");
refs.splash?.setAttribute("hidden", "");
setStep(hasAcceptedTerms() ? "auth" : "terms");
window.setTimeout(() => {
  void syncAuthUi();
}, 250);

game.events.on("pubpaid:intro-ready", () => {
  openSplash(resolveEntryStep());
});

game.events.on("pubpaid:intro-start", () => {
  if (!soundtrack.isPlaying()) {
    soundtrack.startIntro();
  }
  syncAudioButton();
});

game.events.on("pubpaid:intro-frame", ({ index = 0, totalFrames = 1 } = {}) => {
  soundtrack.accentFrame(index, totalFrames);
});

window.pubpaidPhaserGame = game;
window.render_game_to_text = () => {
  const scene = game.scene.getScenes(true).map((activeScene) => activeScene.scene.key).join(", ");
  return [
    `scene=${gameState.currentScene}`,
    `activeScenes=${scene || "none"}`,
    `focus=${gameState.focus}`,
    `objective=${gameState.objective}`,
    `prompt=${gameState.prompt}`,
    `testBalance=${gameState.testBalance}`,
    `realBalance=${gameState.realBalance}`,
    `music=${soundtrack.getState().playing ? "on" : "off"}`,
    `musicStyle=${soundtrack.getState().style}`,
    `musicIntroSynced=${soundtrack.getState().introSynced ? "yes" : "no"}`,
    `introStarted=${introStarted ? "yes" : "no"}`,
    `fullscreen=${document.fullscreenElement ? "yes" : "no"}`,
    `panelOpen=${gameState.panel.open}`,
    `panelTitle=${gameState.panel.title}`
  ].join("\n");
};

window.advanceTime = (ms = 250) => {
  const activeScenes = game.scene.getScenes(true);
  activeScenes.forEach((activeScene) => {
    activeScene.time?.delayedCall?.(0, () => {});
    activeScene.events.emit("codex-advance-time", ms);
  });
  return window.render_game_to_text();
};
