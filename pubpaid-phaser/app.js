import { GAME_HEIGHT, GAME_WIDTH } from "./config/gameConfig.js";
import { gameState, updateGameState } from "./core/gameState.js";
import { createPubPaidSoundtrack } from "./audio/chipTechSoundtrack.js";
import { bindOverlay } from "./ui/overlay.js";
import { bindDomGameInterface } from "./ui/domGameInterface.js?v=20260518-poolspace3";
import { bindWalletInterface } from "./ui/walletInterface.js?v=20260518-poolspace3";
import { closePanel } from "./ui/panelActions.js";
import { savePubpaidProfile, syncPubpaidAccount, syncPubpaidProfile } from "./services/accountService.js?v=20260518-poolspace3";
import { BootScene } from "./scenes/BootScene.js?v=20260518-poolspace3";
import { IntroScene } from "./scenes/IntroScene.js?v=20260518-poolspace3";
import { CharacterSelectScene } from "./scenes/CharacterSelectScene.js?v=20260518-poolspace3";
import { StreetScene } from "./scenes/StreetScene.js?v=20260518-poolspace3";
import { InteriorScene } from "./scenes/InteriorScene.js?v=20260518-poolspace3";
import { GameLobbyScene } from "./scenes/GameLobbyScene.js?v=20260518-poolspace3";
import { PoolGameScene } from "./scenes/PoolGameScene.js?v=20260518-poolspace3";
import { CheckersGameScene } from "./scenes/CheckersGameScene.js?v=20260518-poolspace3";
import { UIScene } from "./scenes/UIScene.js?v=20260518-poolspace3";

const PUBPAID_BUILD_VERSION = "20260518-poolspace3";
window.pubpaidBuildVersion = PUBPAID_BUILD_VERSION;

bindOverlay();

const isIOS =
  /iPad|iPhone|iPod/.test(window.navigator.userAgent) ||
  (window.navigator.platform === "MacIntel" && window.navigator.maxTouchPoints > 1);
const isTouchDevice =
  window.matchMedia?.("(pointer: coarse)")?.matches || window.navigator.maxTouchPoints > 0;
const isSmallScreen = window.matchMedia?.("(max-width: 960px)")?.matches ?? window.innerWidth <= 960;
const isTouchPortraitAtBoot = Boolean(isTouchDevice && window.innerHeight > window.innerWidth);

const config = {
  type: Phaser.AUTO,
  parent: "pubpaid-phaser-root",
  transparent: true,
  backgroundColor: "#02050d",
  scale: {
    mode: isTouchPortraitAtBoot ? Phaser.Scale.ENVELOP : Phaser.Scale.FIT,
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

const TERMS_KEY = "pubpaid_v2_terms_accepted";
const PROFILE_KEY = "pubpaid_v2_player_profile";
const BUILD_KEY = "pubpaid_canon_build_version";
let cachedPlayerProfile = null;
const refs = {
  body: document.body,
  updateGate: document.querySelector("[data-update-gate]"),
  updateStatus: document.querySelector("[data-update-status]"),
  updateReload: document.querySelector("[data-update-reload]"),
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
  profileNick: document.querySelector("[data-player-nick]"),
  profileSave: document.querySelector("[data-save-player-profile]"),
  profileStatus: document.querySelector("[data-player-profile-status]"),
  profileEdit: document.querySelectorAll("[data-edit-player-profile]"),
  audioToggle: document.querySelector("[data-audio-toggle]"),
  orientationGate: document.querySelector("[data-orientation-gate]"),
  orientationStatus: document.querySelector("[data-orientation-status]"),
  fullscreenWarning: document.querySelector("[data-fullscreen-warning]"),
  fullscreenWarningCopy: document.querySelector("[data-fullscreen-warning-copy]"),
  returnFullscreen: document.querySelector("[data-return-fullscreen]"),
  mobileControls: document.querySelector("[data-mobile-controls]"),
  permissionGate: document.querySelector("[data-permission-gate]"),
  startExperience: document.querySelector("[data-start-experience]"),
  permissionStatus: document.querySelector("[data-permission-status]"),
  controlsGuide: document.querySelector("[data-controls-guide]"),
  gameShell: document.querySelector(".ppg-game-shell")
};

let currentStep = "intro";
let gameStarted = false;
let introStarted = false;
let orientationLocked = false;
let bootGateReady = false;
let assetsReady = false;
let pendingAutoEntry = false;
let pendingIntroStart = false;
let pendingStartGameOptions = null;
let fullscreenWasActive = false;

function setUpdateStatus(message) {
  if (refs.updateStatus) refs.updateStatus.textContent = message;
}

function areAssetsReady() {
  if (window.pubpaidAssetsReady) assetsReady = true;
  return assetsReady;
}

function pubpaidVersionedUrl(version = PUBPAID_BUILD_VERSION) {
  const url = new URL(window.location.href);
  url.pathname = url.pathname.replace(/\/?[^/]*$/, "/pubpaid.html");
  url.searchParams.set("v", version);
  url.searchParams.set("sync", String(Date.now()));
  return url.toString();
}

async function clearPubpaidCachesAndWorkers() {
  try {
    if ("caches" in window) {
      const keys = await window.caches.keys();
      await Promise.all(
        keys
          .filter((key) => /pubpaid|ppg|catalogo/i.test(key))
          .map((key) => window.caches.delete(key))
      );
    }
  } catch (_error) {
    // Best effort: stale cache cleanup must not freeze the entry screen.
  }
  try {
    if (navigator.serviceWorker?.getRegistrations) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(
        registrations
          .filter((registration) => {
            const scriptUrl = registration.active?.scriptURL || registration.waiting?.scriptURL || registration.installing?.scriptURL || "";
            return scriptUrl.startsWith(window.location.origin);
          })
          .map((registration) => registration.unregister())
      );
    }
  } catch (_error) {
    // Old service workers are cleared when possible, without blocking play.
  }
}

async function refreshPubpaidRuntimeCache() {
  try {
    window.localStorage?.removeItem("pubpaid_v2_build_version");
    const previousVersion = window.localStorage?.getItem(BUILD_KEY) || "";
    if (previousVersion === PUBPAID_BUILD_VERSION) {
      await clearPubpaidCachesAndWorkers();
      return;
    }
    window.localStorage?.setItem(BUILD_KEY, PUBPAID_BUILD_VERSION);
    await clearPubpaidCachesAndWorkers();
  } catch (_error) {
    // Cache refresh must never block login, wallet, lobby, or Damas.
  }
}

async function runPubpaidUpdateGate() {
  refs.updateGate?.removeAttribute("hidden");
  refs.updateReload?.setAttribute("hidden", "");
  setUpdateStatus("Checando versao online...");
  const currentUrl = new URL(window.location.href);
  const urlVersion = currentUrl.searchParams.get("v") || "";

  let serverVersion = "";
  try {
    const response = await fetch(`./api/pubpaid/build?client=${encodeURIComponent(PUBPAID_BUILD_VERSION)}&t=${Date.now()}`, {
      method: "GET",
      credentials: "same-origin",
      cache: "no-store",
      headers: { Accept: "application/json", "Cache-Control": "no-store" }
    });
    const payload = await response.json().catch(() => null);
    if (response.ok && payload?.buildVersion) {
      serverVersion = String(payload.buildVersion || "");
    }
  } catch (_error) {
    setUpdateStatus("Sem resposta do servidor. Limpando cache local...");
  }

  const targetVersion = serverVersion || PUBPAID_BUILD_VERSION;
  if (serverVersion && serverVersion !== PUBPAID_BUILD_VERSION) {
    setUpdateStatus("Atualizacao nova encontrada. Reabrindo o PubPaid...");
    await clearPubpaidCachesAndWorkers();
    try {
      window.localStorage?.removeItem("pubpaid_v2_build_version");
      window.localStorage?.setItem(BUILD_KEY, serverVersion);
    } catch (_error) {
      // ignore storage failures
    }
    window.location.replace(pubpaidVersionedUrl(serverVersion));
    return false;
  }

  if (urlVersion !== targetVersion) {
    setUpdateStatus("Aplicando versao correta antes de entrar...");
    await clearPubpaidCachesAndWorkers();
    try {
      window.localStorage?.removeItem("pubpaid_v2_build_version");
      window.localStorage?.setItem(BUILD_KEY, targetVersion);
    } catch (_error) {
      // ignore storage failures
    }
    window.location.replace(pubpaidVersionedUrl(targetVersion));
    return false;
  }

  await refreshPubpaidRuntimeCache();
  setUpdateStatus("Versao conferida. Abrindo entrada...");
  window.setTimeout(() => refs.updateGate?.setAttribute("hidden", ""), 260);
  return true;
}

const mobileInputState = {
  x: 0,
  y: 0,
  actionPressed: false,
  actionQueued: false
};

function needsLandscape() {
  return Boolean(isTouchDevice);
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
  if (!auth) return false;
  if (typeof auth.isAuthRequired === "function") {
    return Boolean(auth.isAuthRequired());
  }
  if (typeof auth.isEnabled === "function") {
    return Boolean(auth.isEnabled());
  }
  return true;
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

function normalizePlayerNick(value = "") {
  return String(value || "")
    .normalize("NFKC")
    .replace(/[^\p{L}\p{N}_. -]/gu, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 18);
}

function profileStorageKey() {
  const user = getAuthApi()?.getUser?.() || gameState.googleUser || {};
  const identity = String(user.sub || user.email || "local").trim().toLowerCase() || "local";
  return `${PROFILE_KEY}:${identity}`;
}

function getPlayerProfile() {
  const stateProfile = gameState.playerProfile || cachedPlayerProfile;
  const stateNick = normalizePlayerNick(stateProfile?.nick || stateProfile?.name || "");
  if (stateNick) {
    return {
      ...stateProfile,
      nick: stateNick,
      name: stateNick
    };
  }
  try {
    const user = getAuthApi()?.getUser?.() || gameState.googleUser || {};
    const keyed = window.localStorage.getItem(profileStorageKey());
    const fallback = window.localStorage.getItem(PROFILE_KEY);
    const parsedFallback = JSON.parse(fallback || "{}");
    const fallbackMatchesUser =
      !fallback ||
      !user?.email ||
      !parsedFallback?.email ||
      String(parsedFallback.email).toLowerCase() === String(user.email).toLowerCase() ||
      (user?.sub && parsedFallback?.sub && String(parsedFallback.sub) === String(user.sub));
    const parsed = JSON.parse(keyed || (fallbackMatchesUser ? fallback : "") || "{}");
    const nick = normalizePlayerNick(parsed.nick || parsed.name || "");
    return nick
      ? {
          ...parsed,
          nick,
          name: nick
        }
      : null;
  } catch (_error) {
    return null;
  }
}

function persistPlayerProfile(profile = {}) {
  const nick = normalizePlayerNick(profile.nick || profile.name || "");
  if (nick.length < 3) return null;
  const user = getAuthApi()?.getUser?.() || gameState.googleUser || {};
  const nextProfile = {
    ...profile,
    nick,
    name: nick,
    email: profile.email || user.email || "",
    sub: profile.sub || user.sub || "",
    updatedAt: profile.updatedAt || new Date().toISOString()
  };
  try {
    const serialized = JSON.stringify(nextProfile);
    window.localStorage.setItem(profileStorageKey(), serialized);
    window.localStorage.setItem(PROFILE_KEY, serialized);
  } catch (_error) {
    // Profile is still usable in memory when storage is unavailable.
  }
  cachedPlayerProfile = nextProfile;
  updateGameState({
    playerProfile: nextProfile,
    nickname: nick
  });
  return nextProfile;
}

async function syncPlayerProfileFromServer() {
  const auth = getAuthApi();
  if (!auth?.isSignedIn?.()) return getPlayerProfile();
  const payload = await syncPubpaidProfile();
  const serverProfile = payload?.profile?.nick ? persistPlayerProfile(payload.profile) : null;
  if (serverProfile) return serverProfile;
  const localProfile = getPlayerProfile();
  if (localProfile?.nick) {
    try {
      const saved = await savePubpaidProfile({ nick: localProfile.nick });
      return persistPlayerProfile(saved?.profile || localProfile);
    } catch (_error) {
      return localProfile;
    }
  }
  return null;
}

async function savePlayerProfile(nickValue) {
  const localProfile = persistPlayerProfile({ nick: nickValue });
  if (!localProfile) return null;
  try {
    const saved = await savePubpaidProfile({ nick: localProfile.nick });
    return persistPlayerProfile(saved?.profile || localProfile);
  } catch (error) {
    if (refs.profileStatus) {
      refs.profileStatus.textContent = error?.message || "Nick salvo localmente. Tentaremos sincronizar online.";
    }
    return localProfile;
  }
}

function syncProfileUi() {
  const user = getAuthApi()?.getUser?.() || gameState.googleUser || {};
  const profile = getPlayerProfile();
  if (refs.profileNick && document.activeElement !== refs.profileNick) {
    refs.profileNick.value = profile?.nick || "";
    refs.profileNick.placeholder = normalizePlayerNick(user.givenName || user.name || "Jogador") || "Seu nick";
  }
  const candidate = normalizePlayerNick(refs.profileNick?.value || profile?.nick || "");
  if (refs.profileSave) {
    refs.profileSave.disabled = candidate.length < 3;
    refs.profileSave.textContent = profile?.nick ? "Salvar nick" : "Jogar agora";
  }
  if (refs.profileStatus) {
    refs.profileStatus.textContent = candidate.length >= 3
      ? `${candidate} fica salvo na sua conta Google e aparece nas mesas.`
      : "Crie um nick com pelo menos 3 caracteres para entrar.";
  }
  refs.profileEdit?.forEach((button) => {
    button.hidden = !profile?.nick;
    button.textContent = profile?.nick ? `Nick: ${profile.nick}` : "Criar nick";
  });
}

async function saveProfileAndEnter() {
  const profile = await savePlayerProfile(refs.profileNick?.value || "");
  if (!profile) {
    syncProfileUi();
    refs.profileNick?.focus();
    return;
  }
  setAcceptedTerms(true);
  await startGame({ allowProfilePrompt: false });
}

function setStep(step) {
  currentStep = step;
  document.querySelectorAll("[data-splash-step]").forEach((node) => {
    const active = node.getAttribute("data-splash-step") === step;
    node.hidden = !active;
    node.classList.toggle("is-active", active);
  });
  if (step === "profile") {
    syncProfileUi();
    window.setTimeout(() => refs.profileNick?.focus(), 80);
  }
}

function syncEnterExitButtons() {
  refs.enterButtons.forEach((button) => {
    button.hidden = gameStarted;
  });
  refs.exitButtons.forEach((button) => {
    button.hidden = !gameStarted;
  });
  syncControlsGuide();
}

function syncControlsGuide() {
  if (!refs.controlsGuide) return;
  const shouldShow =
    gameStarted &&
    !refs.body?.classList.contains("game-is-locked") &&
    !isTouchDevice &&
    !["intro"].includes(gameState.currentScene);
  refs.controlsGuide.hidden = !shouldShow;
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
  const target = refs.gameShell || document.documentElement;
  if (document.fullscreenElement || !target?.requestFullscreen) return true;
  try {
    await target.requestFullscreen({ navigationUI: "hide" });
    fullscreenWasActive = true;
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
  const permissionGateVisible = Boolean(refs.permissionGate && !refs.permissionGate.hasAttribute("hidden"));
  const splashVisible = Boolean(refs.splash && !refs.splash.hasAttribute("hidden"));
  const signedIn = Boolean(getAuthApi()?.isSignedIn?.());
  const readyToPlay = signedIn || !isAuthRequired();
  const shouldShowGate = blocked && (gameStarted || introStarted || permissionGateVisible || (splashVisible && readyToPlay));
  refs.body?.classList.toggle("is-orientation-blocked", shouldShowGate);
  if (refs.orientationGate) {
    refs.orientationGate.hidden = !shouldShowGate;
  }
  if (refs.orientationStatus) {
    refs.orientationStatus.textContent = blocked
      ? "Gire o aparelho para horizontal para continuar."
      : "Modo horizontal pronto.";
  }
}

function syncFullscreenWarning() {
  const fullscreenSupported = Boolean(document.fullscreenEnabled && (refs.gameShell || document.documentElement)?.requestFullscreen);
  if (document.fullscreenElement) fullscreenWasActive = true;
  const shouldWarn = Boolean(gameStarted && fullscreenWasActive && !isTouchDevice && fullscreenSupported && !document.fullscreenElement);
  refs.body?.classList.toggle("is-fullscreen-warning", shouldWarn);
  if (refs.fullscreenWarning) {
    refs.fullscreenWarning.hidden = !shouldWarn;
  }
  if (refs.fullscreenWarningCopy) {
    refs.fullscreenWarningCopy.textContent = needsLandscape()
      ? "No celular, deixe em horizontal e volte para tela cheia para melhor visualização."
      : "A tela cheia e obrigatoria no desktop. Clique para voltar ao jogo em tela cheia.";
  }
}

function startIntroScene() {
  if (!areAssetsReady()) {
    pendingIntroStart = true;
    return;
  }
  if (introStarted) return;
  introStarted = true;
  refs.permissionGate?.setAttribute("hidden", "");
  if (!game.scene.isActive("intro-scene")) {
    game.scene.start("intro-scene");
  }
}

function openPermissionGate() {
  refs.splash?.setAttribute("hidden", "");
  refs.permissionGate?.removeAttribute("hidden");
  setPermissionStatus(isTouchDevice ? "Som 16-bit + tela horizontal" : "Som 16-bit + fullscreen");
}

async function activateExperience() {
  if (isOrientationBlocked()) {
    syncOrientationGate();
    setPermissionStatus("Gire o aparelho para horizontal para continuar.");
    if (refs.startExperience) {
      refs.startExperience.disabled = false;
    }
    return;
  }
  if (refs.startExperience) {
    refs.startExperience.disabled = true;
  }
  refs.body?.classList.remove("game-is-locked");
  refs.splash?.setAttribute("hidden", "");
  refs.permissionGate?.setAttribute("hidden", "");
  setPermissionStatus("Abrindo o PubPaid...");
  startIntroScene();
  let audioStarted = false;
  try {
    audioStarted = Boolean(soundtrack.startIntro());
  } catch (_error) {
    setPermissionStatus("Jogo liberado. O som pode ser ligado depois.");
  }
  syncAudioButton();
  const fullscreenOk = await withTimeout(requestFullscreen(), false, 900);
  const orientationOk = await withTimeout(requestLandscapeLock(), false, 900);
  setPermissionStatus(
    !audioStarted
      ? "Jogo liberado. O som pode ser ligado depois."
      : fullscreenOk || orientationOk
      ? "Tela cheia ativa."
      : isIOS
        ? "Som ativo. No iPhone/iPad, mantenha em horizontal."
        : isTouchDevice
          ? "Som ativo. Mantenha o jogo em horizontal."
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

async function syncAuthUi({ autoEnter = false } = {}) {
  const auth = getAuthApi();
  const signedIn = Boolean(auth?.isSignedIn?.());
  const authRequired = isAuthRequired();
  const user = auth?.getUser?.() || null;
  refs.googleSlot?.toggleAttribute("hidden", signedIn);
  refs.googleLogout?.toggleAttribute("hidden", !signedIn);
  if (refs.openGame) {
    refs.openGame.hidden = authRequired && !signedIn;
    refs.openGame.disabled = authRequired && !signedIn;
    refs.openGame.textContent = signedIn ? "Tocar para intro" : !authRequired ? "Jogar agora" : "Entrar para jogar";
  }
  if (refs.authTitle) {
    refs.authTitle.textContent = signedIn || !authRequired ? "Entrada confirmada" : "Entre para jogar";
  }
  if (signedIn) {
    updateGameState({
      googleUser: user,
      walletFeedback: user?.email ? `Carteira pronta para ${user.email}.` : "Carteira pronta para jogar."
    });
    if (refs.authStatus) {
      refs.authStatus.textContent = `Conta confirmada, ${user?.name || user?.email || "jogador"}. Toque para abrir a intro.`;
    }
    if (refs.authEmail) {
      refs.authEmail.textContent = user?.email || "Conta confirmada.";
    }
  } else {
    if (refs.authStatus) {
      refs.authStatus.textContent = auth?.isReady?.() && !auth?.isEnabled?.()
        ? "A entrada segura ainda não está disponível aqui."
        : "Entre para abrir o PubPaid.";
    }
    if (refs.authEmail) {
      refs.authEmail.textContent = "Seu nome e email protegem a carteira e deixam a conferência do Pix mais simples.";
    }
  }
  if (signedIn) {
    await syncPubpaidAccount();
    await syncPlayerProfileFromServer();
  }
  syncProfileUi();
  if (autoEnter && signedIn && bootGateReady && !gameStarted) {
    pendingAutoEntry = false;
    syncOrientationGate();
  } else if (autoEnter && signedIn && !bootGateReady) {
    pendingAutoEntry = true;
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

async function continueAfterAuth({ syncFirst = true } = {}) {
  if (!bootGateReady) {
    pendingAutoEntry = true;
    return;
  }
  const auth = getAuthApi();
  if (isAuthRequired() && !auth?.isSignedIn?.()) {
    openSplash("auth");
    return;
  }
  if (auth?.isSignedIn?.() && syncFirst) {
    await syncAuthUi({ autoEnter: false });
  }
  if (auth?.isSignedIn?.() && !getPlayerProfile()?.nick) {
    openSplash("profile");
    return;
  }
  setAcceptedTerms(true);
  await startGame({ allowProfilePrompt: false });
}

async function startGame({ allowProfilePrompt = true } = {}) {
  const auth = getAuthApi();
  if (isAuthRequired() && !auth?.isSignedIn?.()) {
    openSplash("auth");
    return;
  }
  if (auth?.isSignedIn?.()) {
    await syncAuthUi({ autoEnter: false });
    if (allowProfilePrompt && !getPlayerProfile()?.nick) {
      openSplash("profile");
      return;
    }
    setAcceptedTerms(true);
  } else if (!hasAcceptedTerms()) {
    openSplash("terms");
    return;
  }
  if (!areAssetsReady()) {
    pendingStartGameOptions = { allowProfilePrompt };
    updateGameState({
      objective: "Carregar personagens",
      prompt: "Preparando sprites e cenario antes de abrir o jogo."
    });
    return;
  }
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
  syncOrientationGate();
  syncFullscreenWarning();
}

function resolveEntryStep() {
  const auth = getAuthApi();
  if (isAuthRequired() && !auth?.isSignedIn?.()) return "auth";
  if (auth?.isSignedIn?.() && !getPlayerProfile()?.nick) return "profile";
  return hasAcceptedTerms() ? "auth" : "terms";
}

function tryEnterFlow() {
  const auth = getAuthApi();
  if (!isAuthRequired() || auth?.isSignedIn?.()) {
    void enterIntroAfterAuth();
    return;
  }
  openSplash(resolveEntryStep());
}

async function enterIntroAfterAuth({ syncFirst = true } = {}) {
  if (!bootGateReady) {
    pendingAutoEntry = true;
    return;
  }
  const auth = getAuthApi();
  if (isAuthRequired() && !auth?.isSignedIn?.()) {
    openSplash("auth");
    return;
  }
  if (auth?.isSignedIn?.() && syncFirst) {
    await syncAuthUi({ autoEnter: false });
  }
  if (auth?.isSignedIn?.() && !getPlayerProfile()?.nick) {
    openSplash("profile");
    return;
  }
  setAcceptedTerms(true);
  await activateExperience();
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
      soundtrack.toggle();
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
      openSplash(resolveEntryStep());
      return;
    }

    if (event.target.closest("[data-accept-terms]")) {
      const auth = getAuthApi();
      if (isAuthRequired() && !auth?.isSignedIn?.()) {
        setStep("auth");
        await auth?.promptSignIn?.();
        return;
      }
      if (refs.termsCheckbox) {
        refs.termsCheckbox.checked = true;
      }
      setAcceptedTerms(true);
      await continueAfterAuth();
      return;
    }

    if (event.target.closest("[data-open-game]")) {
      const auth = getAuthApi();
      if (isAuthRequired() && !auth?.isSignedIn?.()) {
        await auth?.promptSignIn?.();
        return;
      }
      await enterIntroAfterAuth();
      return;
    }

    const authCard = event.target.closest("[data-google-auth-card]");
    if (authCard && getAuthApi()?.isSignedIn?.()) {
      event.preventDefault();
      await enterIntroAfterAuth();
      return;
    }

    if (event.target.closest("[data-edit-player-profile]")) {
      event.preventDefault();
      if (isAuthRequired() && !getAuthApi()?.isSignedIn?.()) {
        await getAuthApi()?.promptSignIn?.();
        return;
      }
      await syncPlayerProfileFromServer();
      openSplash("profile");
      return;
    }

    if (event.target.closest("[data-save-player-profile]")) {
      event.preventDefault();
      await saveProfileAndEnter();
      return;
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

  refs.profileNick?.addEventListener("input", syncProfileUi);
  refs.profileNick?.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      void saveProfileAndEnter();
    }
  });

  window.addEventListener("keydown", () => {
    const auth = getAuthApi();
    if ((isAuthRequired() && !auth?.isSignedIn?.()) || refs.permissionGate?.hasAttribute("hidden")) {
      return;
    }
    if (!introStarted) {
      void activateExperience();
      return;
    }
    startSoundtrackFromGesture();
  }, { once: true });

  const handleWalletShortcut = (event) => {
    const target = event.target;
    const isTyping =
      target instanceof HTMLElement &&
      (target.matches("input, textarea, select") || target.isContentEditable);
    if (
      event.key?.toLowerCase() === "w" &&
      !isTyping &&
      !refs.body?.classList.contains("game-is-locked") &&
      gameState.currentScene !== "intro" &&
      gameState.currentScene !== "character-select"
    ) {
      event.preventDefault();
      event.stopImmediatePropagation();
      window.pubpaidWalletOpen?.();
    }
    if (event.key === "F11") {
      window.setTimeout(syncFullscreenWarning, 160);
    }
  };
  window.addEventListener("keydown", handleWalletShortcut, true);
  document.addEventListener("keydown", handleWalletShortcut, true);

  window.addEventListener("catalogo:google-auth", async () => {
    await syncAuthUi({ autoEnter: true });
  });
}

bindSplash();
bindMobileControls();
syncAudioButton();
syncEnterExitButtons();
refs.body?.classList.toggle("is-ios", isIOS);
refs.body?.classList.toggle("is-touch", Boolean(isTouchDevice));
refs.body?.classList.add("game-is-locked");
refs.splash?.removeAttribute("hidden");
syncOrientationGate();
setStep("auth");
refs.updateReload?.addEventListener("click", () => {
  window.location.replace(pubpaidVersionedUrl(PUBPAID_BUILD_VERSION));
});
void (async () => {
  try {
    bootGateReady = await runPubpaidUpdateGate();
  } catch (_error) {
    bootGateReady = true;
    refs.updateReload?.removeAttribute("hidden");
    refs.updateGate?.setAttribute("hidden", "");
  }
  if (!bootGateReady) return;
  await syncAuthUi({ autoEnter: true });
  if (pendingAutoEntry) {
    pendingAutoEntry = false;
    await syncAuthUi({ autoEnter: true });
  }
})();
window.setTimeout(() => {
  if (bootGateReady && !gameStarted) {
    void syncAuthUi({ autoEnter: true });
  }
}, 1200);

window.addEventListener("resize", syncOrientationGate);
window.addEventListener("orientationchange", syncOrientationGate);
window.visualViewport?.addEventListener?.("resize", syncOrientationGate);
document.addEventListener("fullscreenchange", syncFullscreenWarning);
document.addEventListener("webkitfullscreenchange", syncFullscreenWarning);

window.setInterval(() => {
  if (!gameStarted) return;
  const auth = getAuthApi();
  if (auth?.isSignedIn?.()) {
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
  const auth = getAuthApi();
  if (isAuthRequired() && !auth?.isSignedIn?.()) {
    openSplash("auth");
    return;
  }
  if (auth?.isSignedIn?.() && !getPlayerProfile()?.nick) {
    openSplash("profile");
    return;
  }
  if (!hasAcceptedTerms()) {
    openSplash("terms");
  }
});

game.events.on("pubpaid:intro-enter", () => {
  const auth = getAuthApi();
  if (isAuthRequired() && !auth?.isSignedIn?.()) {
    openSplash("auth");
    return;
  }
  startGame();
});

game.events.on("pubpaid:intro-start", () => {
  soundtrack.setZone("street");
  try {
    if (!soundtrack.isPlaying()) {
      soundtrack.startIntro();
    }
  } catch (_error) {
    setPermissionStatus("Jogo liberado. O som pode ser ligado depois.");
  }
  syncAudioButton();
});

game.events.on("pubpaid:assets-ready", () => {
  if (assetsReady) return;
  assetsReady = true;
  if (pendingIntroStart) {
    pendingIntroStart = false;
    startIntroScene();
  }
  if (pendingStartGameOptions) {
    const options = pendingStartGameOptions;
    pendingStartGameOptions = null;
    void startGame(options);
  }
});

game.events.on("pubpaid:request-fullscreen", () => {
  if (isOrientationBlocked()) {
    syncOrientationGate();
    return;
  }
  void Promise.all([requestFullscreen(), requestLandscapeLock()]).then(syncFullscreenWarning);
});

game.events.on("pubpaid:intro-frame", ({ index = 0, totalFrames = 1 } = {}) => {
  soundtrack.accentFrame(index, totalFrames);
});

game.events.on("pubpaid:music-zone", (zone) => {
  soundtrack.setZone(zone);
});

window.pubpaidPhaserGame = game;
window.pubpaidPlayerProfile = getPlayerProfile;
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
    `googleUser=${gameState.googleUser?.email || "none"}`,
    `nickname=${getPlayerProfile()?.nick || "none"}`,
    `buildVersion=${PUBPAID_BUILD_VERSION}`,
    `realBalance=${gameState.realBalance}`,
    `availableBalance=${gameState.availableBalance}`,
    `lockedMatchBalance=${gameState.lockedMatchBalance}`,
    `lockedWithdrawalBalance=${gameState.lockedWithdrawalBalance}`,
    `pendingDeposits=${gameState.pendingDeposits}`,
    `pendingWithdrawals=${gameState.pendingWithdrawals}`,
    `walletOpen=${gameState.walletOpen ? "yes" : "no"}`,
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

window.pubpaidDebugState = () => ({
  ...JSON.parse(JSON.stringify(gameState)),
  buildVersion: PUBPAID_BUILD_VERSION,
  fullscreen: Boolean(document.fullscreenElement),
  updateGateOpen: Boolean(refs.updateGate && !refs.updateGate.hidden)
});

window.advanceTime = (ms = 250) => {
  const activeScenes = game.scene.getScenes(true);
  activeScenes.forEach((activeScene) => {
    activeScene.time?.delayedCall?.(0, () => {});
    activeScene.events.emit("codex-advance-time", ms);
  });
  return window.render_game_to_text();
};
