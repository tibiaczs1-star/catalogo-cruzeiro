import { GAME_HEIGHT, GAME_WIDTH } from "./config/gameConfig.js";
import { gameState } from "./core/gameState.js";
import { createPubPaidSoundtrack } from "./audio/chipTechSoundtrack.js";
import { bindOverlay } from "./ui/overlay.js";
import { bindDomGameInterface } from "./ui/domGameInterface.js";
import { bindWalletInterface } from "./ui/walletInterface.js";
import { closePanel } from "./ui/panelActions.js";
import { syncPubpaidAccount } from "./services/accountService.js";
import { BootScene } from "./scenes/BootScene.js";
import { IntroScene } from "./scenes/IntroScene.js";
import { CharacterSelectScene } from "./scenes/CharacterSelectScene.js";
import { StreetScene } from "./scenes/StreetScene.js";
import { InteriorScene } from "./scenes/InteriorScene.js";
import { GameLobbyScene } from "./scenes/GameLobbyScene.js";
import { PoolGameScene } from "./scenes/PoolGameScene.js";
import { CheckersGameScene } from "./scenes/CheckersGameScene.js";
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
  scene: [BootScene, IntroScene, CharacterSelectScene, StreetScene, InteriorScene, GameLobbyScene, PoolGameScene, CheckersGameScene, UIScene]
};

const game = new Phaser.Game(config);
bindDomGameInterface(game);
bindWalletInterface();
const soundtrack = createPubPaidSoundtrack();
const isIOS =
  /iPad|iPhone|iPod/.test(window.navigator.userAgent) ||
  (window.navigator.platform === "MacIntel" && window.navigator.maxTouchPoints > 1);
const isTouchDevice =
  window.matchMedia?.("(pointer: coarse)")?.matches || window.navigator.maxTouchPoints > 0;
const isSmallScreen = window.matchMedia?.("(max-width: 960px)")?.matches ?? window.innerWidth <= 960;

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
  googleSlot: document.querySelector("[data-google-auth-button]"),
  googleLogout: document.querySelector("[data-google-auth-logout]"),
  authTitle: document.querySelector("[data-auth-title]"),
  audioToggle: document.querySelector("[data-audio-toggle]"),
  streetGoogleGate: document.querySelector("[data-street-google-gate]"),
  streetGoogleButton: document.querySelector("[data-street-google-button]"),
  streetGoogleStatus: document.querySelector("[data-street-google-status]"),
  orientationGate: document.querySelector("[data-orientation-gate]"),
  orientationStatus: document.querySelector("[data-orientation-status]"),
  fullscreenWarning: document.querySelector("[data-fullscreen-warning]"),
  fullscreenWarningCopy: document.querySelector("[data-fullscreen-warning-copy]"),
  returnFullscreen: document.querySelector("[data-return-fullscreen]"),
  mobileControls: document.querySelector("[data-mobile-controls]"),
  permissionGate: document.querySelector("[data-permission-gate]"),
  startExperience: document.querySelector("[data-start-experience]"),
  permissionStatus: document.querySelector("[data-permission-status]"),
  gameShell: document.querySelector(".ppg-game-shell")
};

let currentStep = "intro";
let gameStarted = false;
let introStarted = false;
let orientationLocked = false;
const mobileInputState = {
  x: 0,
  y: 0,
  actionPressed: false,
  actionQueued: false
};

function needsLandscape() {
  return Boolean(isTouchDevice && isSmallScreen);
}

function isPortraitOrientation() {
  return window.innerHeight > window.innerWidth;
}

function isOrientationBlocked() {
  return needsLandscape() && isPortraitOrientation();
}

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

function syncStreetGoogleGate() {
  const auth = getAuthApi();
  const signedIn = Boolean(auth?.isSignedIn?.());
  const localDemoAccess = canUseLocalDemoAccess();
  const shouldShow = gameStarted && !signedIn;

  refs.streetGoogleGate?.toggleAttribute("hidden", !shouldShow);
  if (!refs.streetGoogleButton || !refs.streetGoogleStatus) return;

  refs.streetGoogleButton.disabled = localDemoAccess;
  refs.streetGoogleButton.textContent = "Entrar com Google";
  refs.streetGoogleStatus.textContent = localDemoAccess
    ? "Em espera. Testes locais liberados."
    : "Toque para conectar a conta.";
}

function startSoundtrackFromGesture() {
  if (soundtrack.isPlaying()) return;
  soundtrack.start();
  syncAudioButton();
}

async function requestFullscreen() {
  const target = refs.gameShell || document.documentElement;
  if (document.fullscreenElement || !target?.requestFullscreen) return true;
  try {
    await target.requestFullscreen({ navigationUI: "hide" });
    return true;
  } catch (_error) {
    try {
      if (typeof target.webkitRequestFullscreen === "function") {
        target.webkitRequestFullscreen();
        return true;
      }
    } catch (_webkitError) {
      // ignore fallback failure
    }
    return false;
  }
}

async function requestLandscapeLock() {
  if (!needsLandscape() || orientationLocked) return false;
  const orientationApi = window.screen?.orientation;
  if (!orientationApi?.lock) return false;
  try {
    await orientationApi.lock("landscape");
    orientationLocked = true;
    return true;
  } catch (_error) {
    return false;
  }
}

function withTimeout(promise, fallback = false, timeoutMs = 900) {
  return Promise.race([
    promise,
    new Promise((resolve) => {
      window.setTimeout(() => resolve(fallback), timeoutMs);
    })
  ]);
}

function setPermissionStatus(message) {
  if (refs.permissionStatus) {
    refs.permissionStatus.textContent = message;
  }
}

function syncOrientationGate() {
  const blocked = isOrientationBlocked();
  refs.body?.classList.toggle("is-orientation-blocked", blocked);
  if (refs.orientationGate) {
    refs.orientationGate.hidden = !blocked;
  }
  if (refs.orientationStatus) {
    refs.orientationStatus.textContent = blocked
      ? "Gire o aparelho para horizontal para continuar."
      : "Modo horizontal pronto.";
  }
}

function syncFullscreenWarning() {
  const shouldWarn = Boolean(gameStarted && !document.fullscreenElement);
  refs.body?.classList.toggle("is-fullscreen-warning", shouldWarn);
  if (refs.fullscreenWarning) {
    refs.fullscreenWarning.hidden = !shouldWarn;
  }
  if (refs.fullscreenWarningCopy) {
    refs.fullscreenWarningCopy.textContent = needsLandscape()
      ? "No celular, deixe em horizontal e volte para tela cheia para melhor visualização."
      : "Aperte F11 ou volte para tela cheia para jogar com melhor leitura.";
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
  if (isOrientationBlocked()) {
    syncOrientationGate();
    setPermissionStatus("Modo retrato detectado. Iniciando mesmo assim para teste.");
  }
  if (refs.startExperience) {
    refs.startExperience.disabled = true;
  }
  setPermissionStatus("Iniciando abertura...");
  soundtrack.startIntro();
  syncAudioButton();
  startIntroScene();
  const [fullscreenOk, orientationOk] = await Promise.all([
    withTimeout(requestFullscreen(), false, 900),
    withTimeout(requestLandscapeLock(), false, 900)
  ]);
  setPermissionStatus(
    fullscreenOk || orientationOk
      ? "Tela cheia ativa."
      : isIOS
        ? "Som ativo. No iPhone/iPad, continue em tela ampla no Safari."
        : "Som ativo."
  );
  if (refs.startExperience) {
    refs.startExperience.disabled = false;
  }
}

function resetMobileInput() {
  mobileInputState.x = 0;
  mobileInputState.y = 0;
  mobileInputState.actionPressed = false;
  refs.mobileControls?.querySelectorAll(".is-pressed").forEach((button) => {
    button.classList.remove("is-pressed");
  });
}

function bindMobileControls() {
  if (!refs.mobileControls) return;
  const directionVectors = {
    up: { x: 0, y: -1 },
    down: { x: 0, y: 1 },
    left: { x: -1, y: 0 },
    right: { x: 1, y: 0 }
  };
  const activeDirections = new Set();
  const syncVector = () => {
    let x = 0;
    let y = 0;
    activeDirections.forEach((direction) => {
      x += directionVectors[direction]?.x || 0;
      y += directionVectors[direction]?.y || 0;
    });
    const length = Math.hypot(x, y);
    mobileInputState.x = length > 0 ? x / length : 0;
    mobileInputState.y = length > 0 ? y / length : 0;
  };
  const releaseDirection = (button, direction) => {
    activeDirections.delete(direction);
    button.classList.remove("is-pressed");
    syncVector();
  };

  refs.mobileControls.querySelectorAll("[data-mobile-dir]").forEach((button) => {
    const direction = button.getAttribute("data-mobile-dir");
    button.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      try {
        button.setPointerCapture?.(event.pointerId);
      } catch (_error) {
        // Synthetic test events do not always have an active pointer capture target.
      }
      activeDirections.add(direction);
      button.classList.add("is-pressed");
      syncVector();
    });
    button.addEventListener("pointerup", () => releaseDirection(button, direction));
    button.addEventListener("pointercancel", () => releaseDirection(button, direction));
    button.addEventListener("lostpointercapture", () => releaseDirection(button, direction));
  });

  refs.mobileControls.querySelectorAll("[data-mobile-action]").forEach((button) => {
    const action = button.getAttribute("data-mobile-action");
    button.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      try {
        button.setPointerCapture?.(event.pointerId);
      } catch (_error) {
        // Synthetic test events do not always have an active pointer capture target.
      }
      button.classList.add("is-pressed");
      if (action === "primary") {
        mobileInputState.actionPressed = true;
        mobileInputState.actionQueued = true;
      }
      if (action === "wallet") {
        window.pubpaidWalletOpen?.();
      }
    });
    const release = () => {
      button.classList.remove("is-pressed");
      if (action === "primary") {
        mobileInputState.actionPressed = false;
      }
    };
    button.addEventListener("pointerup", release);
    button.addEventListener("pointercancel", release);
    button.addEventListener("lostpointercapture", release);
  });
}

async function syncAuthUi() {
  const auth = getAuthApi();
  const signedIn = Boolean(auth?.isSignedIn?.());
  const localDemoAccess = canUseLocalDemoAccess();
  refs.body?.classList.toggle("has-local-demo-access", localDemoAccess);
  refs.authCard?.classList.toggle("is-local-demo", localDemoAccess);
  refs.googleSlot?.toggleAttribute("hidden", localDemoAccess);
  refs.googleLogout?.toggleAttribute("hidden", localDemoAccess || !signedIn);
  if (refs.openGame) {
    refs.openGame.disabled = !((signedIn || localDemoAccess) && hasAcceptedTerms());
    refs.openGame.textContent = localDemoAccess ? "Enter game" : "Google gate";
  }
  if (refs.authTitle) {
    refs.authTitle.textContent = localDemoAccess ? "Local run ready." : "Google gate.";
  }
  if (localDemoAccess) {
    if (refs.authStatus) {
      refs.authStatus.textContent = "Local access ready.";
    }
    if (refs.authEmail) {
      refs.authEmail.textContent = "Entre direto e continue a run.";
    }
  } else {
    if (refs.authStatus) {
      refs.authStatus.textContent = signedIn ? "Conta conectada." : "Entre com Google para abrir o portao.";
    }
    if (refs.authEmail) {
      refs.authEmail.textContent = signedIn ? "Google sync ready." : "Google login";
    }
  }
  if (signedIn) {
    await syncPubpaidAccount();
  }
  syncStreetGoogleGate();
}

function openSplash(step = "intro") {
  refs.permissionGate?.setAttribute("hidden", "");
  refs.body?.classList.add("game-is-locked");
  refs.splash?.removeAttribute("hidden");
  setStep(step);
  gameStarted = false;
  closePanel();
  syncEnterExitButtons();
  syncStreetGoogleGate();
}

function startGame() {
  refs.body?.classList.remove("game-is-locked");
  refs.splash?.setAttribute("hidden", "");
  if (game.scene.isActive("intro-scene")) {
    game.scene.stop("intro-scene");
  }
  if (
    !game.scene.isActive("character-select-scene") &&
    !game.scene.isActive("street-scene") &&
    !game.scene.isActive("interior-scene")
  ) {
    game.scene.start(gameState.selectedCharacter?.id ? "street-scene" : "character-select-scene");
  }
  if (!game.scene.isActive("ui-scene")) {
    game.scene.start("ui-scene");
  }
  gameStarted = true;
  syncEnterExitButtons();
  syncStreetGoogleGate();
  syncFullscreenWarning();
}

function resolveEntryStep() {
  return "terms";
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
      if (refs.termsCheckbox) {
        refs.termsCheckbox.checked = true;
      }
      setAcceptedTerms(true);
      await syncAuthUi();
      startGame();
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

    if (event.target.closest("[data-street-google-button]")) {
      event.preventDefault();
      if (canUseLocalDemoAccess()) return;
      const auth = getAuthApi();
      await auth?.promptSignIn?.();
    }

    if (event.target.closest("[data-return-fullscreen]")) {
      event.preventDefault();
      await requestFullscreen();
      syncFullscreenWarning();
    }
  });

  refs.termsCheckbox?.addEventListener("change", () => {
    if (refs.acceptTerms) {
      refs.acceptTerms.disabled = false;
    }
  });

  window.addEventListener("keydown", () => {
    if (!introStarted) {
      void activateExperience();
      return;
    }
    startSoundtrackFromGesture();
  }, { once: true });

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      window.pubpaidWalletOpen?.();
    }
    if (event.key === "F11") {
      window.setTimeout(syncFullscreenWarning, 160);
    }
  });

  window.addEventListener("catalogo:google-auth", async () => {
    await syncAuthUi();
  });
}

bindSplash();
bindMobileControls();
syncAudioButton();
syncEnterExitButtons();
refs.body?.classList.toggle("is-ios", isIOS);
refs.body?.classList.toggle("is-touch", Boolean(isTouchDevice));
refs.body?.classList.add("game-is-locked");
refs.splash?.setAttribute("hidden", "");
syncStreetGoogleGate();
syncOrientationGate();
setStep("terms");
window.setTimeout(() => {
  void syncAuthUi();
}, 250);

window.addEventListener("resize", syncOrientationGate);
window.addEventListener("orientationchange", syncOrientationGate);
document.addEventListener("fullscreenchange", syncFullscreenWarning);
document.addEventListener("webkitfullscreenchange", syncFullscreenWarning);

window.setInterval(() => {
  if (!gameStarted) return;
  const auth = getAuthApi();
  if (auth?.isSignedIn?.() || canUseLocalDemoAccess()) {
    void syncPubpaidAccount();
  }
}, 10000);

window.addEventListener("focus", () => {
  if (gameStarted) {
    void syncPubpaidAccount();
    syncFullscreenWarning();
  }
});

game.events.on("pubpaid:intro-ready", () => {
  openSplash("terms");
});

game.events.on("pubpaid:intro-enter", () => {
  setAcceptedTerms(true);
  startGame();
});

game.events.on("pubpaid:intro-start", () => {
  soundtrack.setZone("street");
  if (!soundtrack.isPlaying()) {
    soundtrack.startIntro();
  }
  syncAudioButton();
});

game.events.on("pubpaid:intro-frame", ({ index = 0, totalFrames = 1 } = {}) => {
  soundtrack.accentFrame(index, totalFrames);
});

game.events.on("pubpaid:google-port-click", async () => {
  if (canUseLocalDemoAccess()) return;
  const auth = getAuthApi();
  await auth?.promptSignIn?.();
});

game.events.on("pubpaid:music-zone", (zone) => {
  soundtrack.setZone(zone);
});

window.pubpaidPhaserGame = game;
window.pubpaidMobileInput = {
  getVector() {
    return { x: mobileInputState.x, y: mobileInputState.y };
  },
  consumeAction() {
    const queued = mobileInputState.actionQueued;
    mobileInputState.actionQueued = false;
    return queued;
  },
  reset: resetMobileInput
};
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
    `availableBalance=${gameState.availableBalance}`,
    `lockedMatchBalance=${gameState.lockedMatchBalance}`,
    `lockedWithdrawalBalance=${gameState.lockedWithdrawalBalance}`,
    `pendingDeposits=${gameState.pendingDeposits}`,
    `pendingWithdrawals=${gameState.pendingWithdrawals}`,
    `walletFeedback=${gameState.walletFeedback}`,
    `pvpStatus=${gameState.pvpStatus}`,
    `pvpGameId=${gameState.pvpGameId}`,
    `pvpMatchId=${gameState.pvpMatchId}`,
    `selectedCharacter=${gameState.selectedCharacter ? JSON.stringify(gameState.selectedCharacter) : "none"}`,
    `playerDirection=${gameState.playerDirection}`,
    `playerMoving=${gameState.playerMoving ? "yes" : "no"}`,
    `activeGameId=${gameState.activeGameId}`,
    `lobbyPhase=${gameState.lobbyPhase}`,
    `poolGame=${gameState.poolGame ? JSON.stringify(gameState.poolGame) : "none"}`,
    `dartsGame=${gameState.dartsGame ? JSON.stringify(gameState.dartsGame) : "none"}`,
    `checkersGame=${gameState.checkersGame ? JSON.stringify(gameState.checkersGame) : "none"}`,
    `lastDemoSettlement=${gameState.lastDemoSettlement ? JSON.stringify(gameState.lastDemoSettlement) : "none"}`,
    `music=${soundtrack.getState().playing ? "on" : "off"}`,
    `musicStyle=${soundtrack.getState().style}`,
    `musicZone=${soundtrack.getState().zone}`,
    `musicIntroSynced=${soundtrack.getState().introSynced ? "yes" : "no"}`,
    `introStarted=${introStarted ? "yes" : "no"}`,
    `fullscreen=${document.fullscreenElement ? "yes" : "no"}`,
    `fullscreenWarning=${refs.fullscreenWarning && !refs.fullscreenWarning.hidden ? "yes" : "no"}`,
    `orientationBlocked=${isOrientationBlocked() ? "yes" : "no"}`,
    `mobileInput=${JSON.stringify(window.pubpaidMobileInput.getVector())}`,
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
