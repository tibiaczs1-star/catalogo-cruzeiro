import { GAME_HEIGHT, GAME_WIDTH } from "./config/gameConfig.js";
import { gameState, updateGameState } from "./core/gameState.js";
import { createPubPaidSoundtrack } from "./audio/chipTechSoundtrack.js";
import { bindOverlay } from "./ui/overlay.js";
import { bindDomGameInterface } from "./ui/domGameInterface.js";
import { closePanel } from "./ui/panelActions.js";
import { syncPubpaidAccount } from "./services/accountService.js";
import { BootScene } from "./scenes/BootScene.js";
import { IntroScene } from "./scenes/IntroScene.js";
import { StreetScene, resetStreetOpeningPlayback } from "./scenes/StreetScene.js";
import { InteriorScene } from "./scenes/InteriorScene.js";
import { WalletScene } from "./scenes/WalletScene.js";
import { GameLobbyScene } from "./scenes/GameLobbyScene.js";
import { DartsGameScene } from "./scenes/DartsGameScene.js";
import { CheckersGameScene } from "./scenes/CheckersGameScene.js";
import { UIScene } from "./scenes/UIScene.js";

bindOverlay();

const config = {
  type: Phaser.AUTO,
  parent: "pubpaid-phaser-root",
  transparent: true,
  pixelArt: true,
  antialias: false,
  roundPixels: true,
  backgroundColor: "#02050d",
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: GAME_WIDTH,
    height: GAME_HEIGHT
  },
  scene: [BootScene, IntroScene, StreetScene, InteriorScene, WalletScene, GameLobbyScene, DartsGameScene, CheckersGameScene, UIScene]
};

const game = new Phaser.Game(config);
bindDomGameInterface(game);
const soundtrack = createPubPaidSoundtrack();
const isIOS =
  /iPad|iPhone|iPod/.test(window.navigator.userAgent) ||
  (window.navigator.platform === "MacIntel" && window.navigator.maxTouchPoints > 1);
const isTouchDevice =
  window.matchMedia?.("(pointer: coarse)")?.matches || window.navigator.maxTouchPoints > 0;
const isSmallScreen = window.matchMedia?.("(max-width: 960px)")?.matches ?? window.innerWidth <= 960;

const TERMS_KEY = "pubpaid_v2_terms_accepted";
const CHARACTER_KEY = "pubpaid_v2_selected_character";
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
  audioToggles: Array.from(document.querySelectorAll("[data-audio-toggle]")),
  streetGoogleGate: document.querySelector("[data-street-google-gate]"),
  streetGoogleButton: document.querySelector("[data-street-google-button]"),
  streetGoogleStatus: document.querySelector("[data-street-google-status]"),
  orientationGate: document.querySelector("[data-orientation-gate]"),
  orientationStatus: document.querySelector("[data-orientation-status]"),
  permissionGate: document.querySelector("[data-permission-gate]"),
  startExperience: document.querySelector("[data-start-experience]"),
  permissionStatus: document.querySelector("[data-permission-status]"),
  canvasShell: document.querySelector(".ppg-canvas-shell"),
  characterSelect: document.querySelector("[data-character-select]"),
  characterChoiceButtons: Array.from(document.querySelectorAll("[data-character-choice]")),
  mobileControls: document.querySelector("[data-mobile-controls]"),
  mobileControlButtons: Array.from(document.querySelectorAll("[data-mobile-control]")),
  mobileSettings: document.querySelector("[data-mobile-settings]"),
  mobileSettingsClose: document.querySelector("[data-mobile-settings-close]"),
  walletPix: document.querySelector("[data-wallet-pix]"),
  walletPixTitle: document.querySelector("[data-wallet-pix-title]"),
  walletPixKicker: document.querySelector("[data-wallet-pix-kicker]"),
  walletPixClose: document.querySelector("[data-wallet-pix-close]"),
  walletPixDeposit: document.querySelector("[data-wallet-pix-deposit]"),
  walletPixWithdraw: document.querySelector("[data-wallet-pix-withdraw]"),
  walletPixAmountButtons: Array.from(document.querySelectorAll("[data-wallet-pix-amount-preset]")),
  walletPixName: document.querySelector("[data-wallet-pix-name]"),
  walletPixQr: document.querySelector("[data-wallet-pix-qr]"),
  walletPixCopy: document.querySelector("[data-wallet-pix-copy]"),
  walletPixGenerate: document.querySelector("[data-wallet-pix-generate]"),
  walletPixRegister: document.querySelector("[data-wallet-pix-register]"),
  walletPixWithdrawAmount: document.querySelector("[data-wallet-pix-withdraw-amount]"),
  walletPixWithdrawKey: document.querySelector("[data-wallet-pix-withdraw-key]"),
  walletPixWithdrawSubmit: document.querySelector("[data-wallet-pix-withdraw-submit]"),
  walletPixFeedback: document.querySelector("[data-wallet-pix-feedback]")
};

let currentStep = "auth";
let gameStarted = false;
let introStarted = false;
let orientationLocked = false;
let characterSelectOpen = false;
let selectedCharacter = loadSelectedCharacter();
let mobileSettingsOpen = false;
const walletPixState = {
  open: false,
  mode: "deposit",
  amount: 10,
  txid: "",
  qrReady: false,
  busy: false
};
let preserveFullscreenOnEscapeUntil = 0;
const ENTRY_SCENE_KEYS = [
  "intro-scene",
  "street-scene",
  "interior-scene",
  "wallet-scene",
  "game-lobby-scene",
  "darts-game-scene",
  "checkers-game-scene",
  "ui-scene"
];

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

function normalizeCharacter(value) {
  return value === "female" ? "female" : "male";
}

function loadSelectedCharacter() {
  try {
    return normalizeCharacter(window.localStorage.getItem(CHARACTER_KEY));
  } catch (_error) {
    return "male";
  }
}

function saveSelectedCharacter(value) {
  selectedCharacter = normalizeCharacter(value);
  try {
    window.localStorage.setItem(CHARACTER_KEY, selectedCharacter);
  } catch (_error) {
    // ignore storage failures
  }
  updateGameState({ selectedCharacter });
  return selectedCharacter;
}

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function normalizeMoneyInput(value, fallback = 0) {
  const normalized = String(value ?? "")
    .replace(/\s+/g, "")
    .replace(",", ".");
  const amount = Number(normalized);
  if (!Number.isFinite(amount)) return fallback;
  return Math.max(0, Math.round(amount * 100) / 100);
}

function buildWalletTxid(prefix = "PUB") {
  return `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`
    .replace(/[^A-Za-z0-9]/g, "")
    .toUpperCase()
    .slice(0, 25);
}

async function requestApiJson(path, options = {}) {
  const response = await fetch(path, {
    credentials: "same-origin",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(options.headers || {})
    },
    ...options
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload?.ok === false) {
    throw new Error(payload?.error || payload?.message || "Nao foi possivel falar com o caixa agora.");
  }
  return payload;
}

async function ensurePubpaidServerSession() {
  const auth = getAuthApi();
  if (!auth?.isSignedIn?.() && auth?.isEnabled?.()) {
    await auth.promptSignIn?.();
  }
  const session = await requestApiJson("./api/auth/session", { method: "GET" });
  if (session?.user?.email) return session.user;
  throw new Error(
    session?.enabled === false
      ? "Pix real exige login Google ativo no servidor. Nesta sessao, a carteira abre apenas para visualizacao."
      : "Entre com Google para usar Pix na carteira."
  );
}

function syncCharacterChoiceButtons() {
  refs.characterChoiceButtons.forEach((button) => {
    const character = normalizeCharacter(button.getAttribute("data-character-choice"));
    button.classList.toggle("is-selected", character === selectedCharacter);
    button.setAttribute("aria-pressed", String(character === selectedCharacter));
  });
}

function setMobileSettingsOpen(open) {
  mobileSettingsOpen = Boolean(open);
  refs.mobileSettings?.toggleAttribute("hidden", !mobileSettingsOpen);
  refs.body?.classList.toggle("mobile-settings-open", mobileSettingsOpen);
  updateGameState({
    mobileSettingsOpen,
    prompt: mobileSettingsOpen
      ? "Configurações mobile abertas. Ajuste o som ou volte para jogar."
      : gameState.prompt
  });
}

function setWalletPixFeedback(message) {
  if (refs.walletPixFeedback) {
    refs.walletPixFeedback.textContent = message;
  }
}

function setWalletPixBusy(busy) {
  walletPixState.busy = Boolean(busy);
  refs.walletPixGenerate?.toggleAttribute("disabled", walletPixState.busy);
  refs.walletPixWithdrawSubmit?.toggleAttribute("disabled", walletPixState.busy);
  if (refs.walletPixRegister) {
    refs.walletPixRegister.disabled = walletPixState.busy || !walletPixState.qrReady;
  }
}

function syncWalletPixAmountButtons() {
  refs.walletPixAmountButtons.forEach((button) => {
    const amount = normalizeMoneyInput(button.getAttribute("data-wallet-pix-amount-preset"), 10);
    button.classList.toggle("is-selected", amount === walletPixState.amount);
    button.setAttribute("aria-pressed", String(amount === walletPixState.amount));
  });
}

function resetWalletPixDeposit() {
  walletPixState.txid = "";
  walletPixState.qrReady = false;
  if (refs.walletPixQr) {
    refs.walletPixQr.innerHTML = "<p>Escolha o valor e gere o QR Pix.</p>";
  }
  if (refs.walletPixCopy) {
    refs.walletPixCopy.hidden = true;
    refs.walletPixCopy.textContent = "";
  }
  if (refs.walletPixRegister) {
    refs.walletPixRegister.disabled = true;
  }
}

function setWalletPixMode(mode) {
  walletPixState.mode = mode === "withdraw" ? "withdraw" : "deposit";
  refs.walletPixDeposit?.toggleAttribute("hidden", walletPixState.mode !== "deposit");
  refs.walletPixWithdraw?.toggleAttribute("hidden", walletPixState.mode !== "withdraw");
  if (refs.walletPixTitle) {
    refs.walletPixTitle.textContent = walletPixState.mode === "withdraw" ? "Retirar Pix" : "Adicionar Pix";
  }
  if (refs.walletPixKicker) {
    refs.walletPixKicker.textContent = walletPixState.mode === "withdraw" ? "saque pix" : "deposito pix";
  }
  resetWalletPixDeposit();
  setWalletPixFeedback(
    walletPixState.mode === "withdraw"
      ? "Informe valor e chave Pix para pedir a retirada."
      : "Pix aberto pela carteira do jogo."
  );
  updateGameState({
    walletPixMode: walletPixState.mode,
    walletPhase: walletPixState.mode === "withdraw" ? "pix-withdraw" : "pix-deposit"
  });
  syncWalletPixAmountButtons();
}

function setWalletPixOpen(open, mode = walletPixState.mode) {
  walletPixState.open = Boolean(open);
  refs.walletPix?.toggleAttribute("hidden", !walletPixState.open);
  refs.body?.classList.toggle("ppg-wallet-pix-open", walletPixState.open);
  if (walletPixState.open) {
    setWalletPixMode(mode);
    window.setTimeout(() => {
      if (walletPixState.mode === "withdraw") refs.walletPixWithdrawAmount?.focus?.();
      else refs.walletPixName?.focus?.();
    }, 80);
  }
  updateGameState({
    walletPixOpen: walletPixState.open,
    walletPixMode: walletPixState.mode,
    walletPhase: walletPixState.open
      ? walletPixState.mode === "withdraw" ? "pix-withdraw" : "pix-deposit"
      : gameState.walletOpen ? "menu" : "closed"
  });
}

async function generateWalletDepositPix() {
  const depositorName = String(refs.walletPixName?.value || "").trim();
  if (depositorName.length < 3) {
    setWalletPixFeedback("Informe o nome de quem fez o Pix antes de gerar o QR.");
    refs.walletPixName?.focus?.();
    return;
  }
  setWalletPixBusy(true);
  setWalletPixFeedback("Gerando QR Pix dentro da carteira...");
  try {
    await ensurePubpaidServerSession();
    walletPixState.txid = walletPixState.txid || buildWalletTxid("PUB");
    const params = new URLSearchParams({
      amount: String(walletPixState.amount),
      txid: walletPixState.txid,
      description: "PubPaid Creditos"
    });
    const payload = await requestApiJson(`./api/pubpaid/deposit/pix?${params.toString()}`, { method: "GET" });
    walletPixState.txid = payload?.txid || walletPixState.txid;
    walletPixState.qrReady = true;
    if (refs.walletPixQr) {
      refs.walletPixQr.innerHTML = payload?.qrSvg || "<p>QR indisponivel. Gere novamente.</p>";
    }
    if (refs.walletPixCopy) {
      refs.walletPixCopy.hidden = false;
      refs.walletPixCopy.textContent = payload?.copyCode || "Codigo Pix indisponivel.";
    }
    if (refs.walletPixRegister) {
      refs.walletPixRegister.disabled = false;
    }
    setWalletPixFeedback(`QR Pix de ${walletPixState.amount} creditos criado. Depois do pagamento, avise o deposito.`);
  } catch (error) {
    walletPixState.qrReady = false;
    if (refs.walletPixQr) {
      refs.walletPixQr.innerHTML = `<p>${escapeHtml(error?.message || "Nao foi possivel gerar o QR Pix.")}</p>`;
    }
    setWalletPixFeedback("Pix nao abriu. Confira Google/chave Pix do servidor.");
  } finally {
    setWalletPixBusy(false);
  }
}

async function registerWalletDepositPix() {
  if (!walletPixState.txid || !walletPixState.qrReady) {
    setWalletPixFeedback("Gere o QR Pix antes de avisar o pagamento.");
    return;
  }
  const depositorName = String(refs.walletPixName?.value || "").trim();
  if (depositorName.length < 3) {
    setWalletPixFeedback("Informe o nome que aparece no Pix para o admin conferir.");
    refs.walletPixName?.focus?.();
    return;
  }
  setWalletPixBusy(true);
  setWalletPixFeedback("Enviando deposito para conferencia manual...");
  try {
    await ensurePubpaidServerSession();
    const payload = await requestApiJson("./api/pubpaid/deposits", {
      method: "POST",
      body: JSON.stringify({
        amount: walletPixState.amount,
        paymentTxid: walletPixState.txid,
        depositorName,
        sourcePage: window.location.pathname
      })
    });
    walletPixState.qrReady = false;
    if (refs.walletPixRegister) {
      refs.walletPixRegister.disabled = true;
    }
    if (refs.walletPixQr) {
      refs.walletPixQr.innerHTML = `
        <p><strong>Pagamento avisado.</strong></p>
        <p>Aguarde a conferencia manual do admin.</p>
        <p>Ref: ${escapeHtml(walletPixState.txid)}</p>
      `;
    }
    if (refs.walletPixCopy) refs.walletPixCopy.hidden = true;
    setWalletPixFeedback(payload?.message || "Deposito enviado para conferencia.");
    await syncPubpaidAccount();
  } catch (error) {
    setWalletPixFeedback(String(error?.message || "Falha ao registrar deposito."));
  } finally {
    setWalletPixBusy(false);
  }
}

async function requestWalletWithdrawalPix() {
  const amount = normalizeMoneyInput(refs.walletPixWithdrawAmount?.value, 0);
  const pixKey = String(refs.walletPixWithdrawKey?.value || "").trim();
  if (amount <= 0) {
    setWalletPixFeedback("Informe um valor valido para retirada.");
    refs.walletPixWithdrawAmount?.focus?.();
    return;
  }
  if (pixKey.length < 3) {
    setWalletPixFeedback("Informe a chave Pix que vai receber a retirada.");
    refs.walletPixWithdrawKey?.focus?.();
    return;
  }
  setWalletPixBusy(true);
  setWalletPixFeedback("Pedindo retirada via Pix...");
  try {
    await ensurePubpaidServerSession();
    const payload = await requestApiJson("./api/pubpaid/withdrawals", {
      method: "POST",
      body: JSON.stringify({
        amount,
        pixKey,
        paymentTxid: buildWalletTxid("SAQ"),
        sourcePage: window.location.pathname
      })
    });
    setWalletPixFeedback(payload?.message || "Retirada enviada para revisao manual.");
    if (refs.walletPixWithdrawAmount) refs.walletPixWithdrawAmount.value = "";
    await syncPubpaidAccount();
  } catch (error) {
    setWalletPixFeedback(String(error?.message || "Falha ao pedir retirada Pix."));
  } finally {
    setWalletPixBusy(false);
  }
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
  const playing = soundtrack.isPlaying();
  refs.audioToggles.forEach((button) => {
    button.setAttribute("aria-pressed", String(playing));
    button.textContent = playing ? "Som ligado" : "Ligar som";
    button.classList.toggle("is-playing", playing);
  });
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
  const target = refs.canvasShell || document.documentElement;
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

function keepFullscreenAfterGameEscape() {
  preserveFullscreenOnEscapeUntil = Date.now() + 1400;
  void requestFullscreen();
}

function handleGameEscape(event) {
  if (event.key !== "Escape") return;
  const walletIsBusy = gameState.walletOpen || gameState.walletPhase === "phone-pull" || gameState.walletPhase === "phone-pocket";
  if (!gameStarted || (!walletPixState.open && !mobileSettingsOpen && !walletIsBusy)) return;
  event.preventDefault();
  event.stopPropagation();
  event.stopImmediatePropagation?.();
  keepFullscreenAfterGameEscape();
  if (walletPixState.open) {
    setWalletPixOpen(false);
    return;
  }
  if (mobileSettingsOpen) {
    setMobileSettingsOpen(false);
    return;
  }
  if (walletIsBusy) {
    game.events.emit("pubpaid:wallet-close-request", { source: "escape" });
  }
}

function recoverFullscreenAfterGameEscape() {
  if (document.fullscreenElement || Date.now() > preserveFullscreenOnEscapeUntil) return;
  void requestFullscreen();
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

async function syncAuthUi() {
  const auth = getAuthApi();
  const signedIn = Boolean(auth?.isSignedIn?.());
  const localDemoAccess = canUseLocalDemoAccess();
  refs.body?.classList.toggle("has-local-demo-access", localDemoAccess);
  refs.authCard?.classList.toggle("is-local-demo", localDemoAccess);
  refs.googleSlot?.toggleAttribute("hidden", localDemoAccess);
  refs.googleLogout?.toggleAttribute("hidden", localDemoAccess || !signedIn);
  if (refs.openGame) {
    refs.openGame.disabled = !(signedIn || localDemoAccess);
    refs.openGame.textContent = signedIn
      ? "Abrir frente do bar"
      : localDemoAccess
        ? "Continuar pre-visualizacao"
        : "Entrar com Google";
  }
  if (refs.authTitle) {
    refs.authTitle.textContent = signedIn || localDemoAccess ? "Acesso liberado." : "Entrar com Google.";
  }
  if (localDemoAccess) {
    if (refs.authStatus) {
      refs.authStatus.textContent = "Google nao configurado neste ambiente. Acesso de visualizacao liberado.";
    }
    if (refs.authEmail) {
      refs.authEmail.textContent = "No ar real, este ponto exige login Google antes da escolha do personagem.";
    }
  } else {
    if (refs.authStatus) {
      refs.authStatus.textContent = signedIn ? "Conta conectada. Abrindo a frente do bar." : "Entre com Google para continuar.";
    }
    if (refs.authEmail) {
      refs.authEmail.textContent = signedIn ? "Conta Google sincronizada." : "Depois do login voce escolhe homem ou mulher.";
    }
  }
  if (signedIn) {
    await syncPubpaidAccount();
  }
  syncStreetGoogleGate();
}

function openSplash(step = "auth") {
  refs.permissionGate?.setAttribute("hidden", "");
  refs.body?.classList.add("game-is-locked");
  refs.body?.classList.add("is-entry-flow");
  refs.body?.classList.remove("game-has-started");
  refs.body?.classList.remove("is-character-selecting");
  refs.splash?.removeAttribute("hidden");
  setStep(step);
  gameStarted = false;
  characterSelectOpen = false;
  refs.characterSelect?.setAttribute("hidden", "");
  closePanel();
  setMobileSettingsOpen(false);
  updateGameState({ characterSelectOpen: false, walletOpen: false, walletPhase: "closed" });
  syncEnterExitButtons();
  syncStreetGoogleGate();
}

function ensureStreetMapStarted() {
  refs.splash?.setAttribute("hidden", "");
  refs.body?.classList.add("is-entry-flow");
  refs.body?.classList.remove("game-has-started");
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
  syncStreetGoogleGate();
}

function stopEntryScenes() {
  ENTRY_SCENE_KEYS.forEach((sceneKey) => {
    if (game.scene.isActive(sceneKey)) {
      game.scene.stop(sceneKey);
    }
  });
}

function openCharacterSelect() {
  refs.splash?.setAttribute("hidden", "");
  stopEntryScenes();
  gameStarted = true;
  characterSelectOpen = true;
  refs.body?.classList.add("game-is-locked");
  refs.body?.classList.add("is-entry-flow");
  refs.body?.classList.remove("game-has-started");
  refs.body?.classList.add("is-character-selecting");
  refs.characterSelect?.removeAttribute("hidden");
  syncCharacterChoiceButtons();
  updateGameState({
    selectedCharacter,
    characterSelectOpen: true,
    currentScene: "character-select",
    focus: "escolha de personagem",
    objective: "Escolher protagonista",
    prompt: "Escolha homem ou mulher antes da chegada na frente do bar."
  });
  syncEnterExitButtons();
}

function finishCharacterSelect(character) {
  saveSelectedCharacter(character);
  characterSelectOpen = false;
  refs.characterSelect?.setAttribute("hidden", "");
  resetStreetOpeningPlayback();
  stopEntryScenes();
  ensureStreetMapStarted();
  refs.body?.classList.remove("game-is-locked");
  refs.body?.classList.remove("is-entry-flow");
  refs.body?.classList.remove("is-character-selecting");
  refs.body?.classList.add("game-has-started");
  updateGameState({
    selectedCharacter,
    characterSelectOpen: false,
    currentScene: "street",
    focus: selectedCharacter === "female" ? "protagonista mulher" : "protagonista homem",
    objective: "Assistir o carro deixar o protagonista na rua",
    prompt: "Personagem escolhido. O carro esta chegando pela rua."
  });
  game.events.emit("pubpaid:character-selected", { character: selectedCharacter });
  syncEnterExitButtons();
}

function handleMobileControl(action, pressed) {
  if (!action) return;
  if (action === "config") {
    if (pressed) {
      setMobileSettingsOpen(!mobileSettingsOpen);
    }
    return;
  }
  if (!gameStarted || characterSelectOpen || refs.body?.classList.contains("game-is-locked")) return;
  startSoundtrackFromGesture();
  game.events.emit("pubpaid:mobile-control", { action, pressed });
}

function bindMobileControls() {
  refs.mobileControlButtons.forEach((button) => {
    const action = button.getAttribute("data-mobile-control");
    const release = (event) => {
      event?.preventDefault?.();
      button.classList.remove("is-pressed");
      handleMobileControl(action, false);
    };
    button.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      button.setPointerCapture?.(event.pointerId);
      button.classList.add("is-pressed");
      handleMobileControl(action, true);
    });
    button.addEventListener("pointerup", release);
    button.addEventListener("pointercancel", release);
    button.addEventListener("lostpointercapture", release);
    button.addEventListener("click", (event) => event.preventDefault());
  });
}

function bindWalletPixControls() {
  refs.walletPixClose?.addEventListener("click", (event) => {
    event.preventDefault();
    setWalletPixOpen(false);
  });

  refs.walletPixAmountButtons.forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      walletPixState.amount = normalizeMoneyInput(button.getAttribute("data-wallet-pix-amount-preset"), 10);
      resetWalletPixDeposit();
      syncWalletPixAmountButtons();
      setWalletPixFeedback(`Valor selecionado: ${walletPixState.amount} creditos.`);
    });
  });

  refs.walletPixGenerate?.addEventListener("click", (event) => {
    event.preventDefault();
    void generateWalletDepositPix();
  });

  refs.walletPixRegister?.addEventListener("click", (event) => {
    event.preventDefault();
    void registerWalletDepositPix();
  });

  refs.walletPixWithdrawSubmit?.addEventListener("click", (event) => {
    event.preventDefault();
    void requestWalletWithdrawalPix();
  });
}

function startGame() {
  openCharacterSelect();
}

function resolveEntryStep() {
  return "auth";
}

function tryEnterFlow() {
  refs.splash?.setAttribute("hidden", "");
  refs.characterSelect?.setAttribute("hidden", "");
  refs.body?.classList.add("game-is-locked");
  refs.body?.classList.add("is-entry-flow");
  refs.body?.classList.remove("game-has-started");
  updateGameState({
    currentScene: "intro",
    focus: "intro cinematica PubPaid",
    objective: "Assistir a abertura cinematica",
    prompt: "Abertura restaurada. Clique ou aperte Enter no frame final para seguir ao login."
  });
  void activateExperience();
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

    if (event.target.closest("[data-mobile-settings-close]")) {
      event.preventDefault();
      setMobileSettingsOpen(false);
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
      openSplash("auth");
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
        openCharacterSelect();
        return;
      }
      if (!auth?.isSignedIn?.()) {
        await auth?.promptSignIn?.();
        return;
      }
      openCharacterSelect();
      return;
    }

    const characterChoice = event.target.closest("[data-character-choice]");
    if (characterChoice) {
      event.preventDefault();
      finishCharacterSelect(characterChoice.getAttribute("data-character-choice"));
    }

    if (event.target.closest("[data-street-google-button]")) {
      event.preventDefault();
      if (canUseLocalDemoAccess()) return;
      const auth = getAuthApi();
      await auth?.promptSignIn?.();
    }
  });

  refs.termsCheckbox?.addEventListener("change", () => {
    if (refs.acceptTerms) {
      refs.acceptTerms.disabled = false;
    }
  });

  window.addEventListener("keydown", () => {
    startSoundtrackFromGesture();
  }, { once: true });

  window.addEventListener("catalogo:google-auth", async () => {
    await syncAuthUi();
  });
}

bindSplash();
bindMobileControls();
bindWalletPixControls();
window.addEventListener("keydown", handleGameEscape, { capture: true });
document.addEventListener("fullscreenchange", recoverFullscreenAfterGameEscape);
syncAudioButton();
syncEnterExitButtons();
refs.body?.classList.toggle("is-ios", isIOS);
refs.body?.classList.toggle("is-touch", Boolean(isTouchDevice));
refs.body?.classList.add("game-is-locked");
refs.splash?.setAttribute("hidden", "");
syncStreetGoogleGate();
syncOrientationGate();
saveSelectedCharacter(selectedCharacter);
syncCharacterChoiceButtons();
setStep("auth");
window.setTimeout(() => {
  void syncAuthUi();
}, 250);

window.addEventListener("resize", syncOrientationGate);
window.addEventListener("orientationchange", syncOrientationGate);

window.setInterval(() => {
  if (!gameStarted) return;
  const auth = getAuthApi();
  if (auth?.isSignedIn?.()) {
    void syncPubpaidAccount();
  }
}, 10000);

window.addEventListener("focus", () => {
  const auth = getAuthApi();
  if (gameStarted && auth?.isSignedIn?.()) {
    void syncPubpaidAccount();
  }
});

game.events.on("pubpaid:intro-ready", () => {
  openSplash("auth");
});

game.events.on("pubpaid:intro-enter", () => {
  setAcceptedTerms(true);
  openSplash("auth");
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
    `pvpStatus=${gameState.pvpStatus}`,
    `pvpGameId=${gameState.pvpGameId}`,
    `pvpMatchId=${gameState.pvpMatchId}`,
    `selectedCharacter=${gameState.selectedCharacter}`,
    `characterSelectOpen=${gameState.characterSelectOpen ? "yes" : "no"}`,
    `walletOpen=${gameState.walletOpen ? "yes" : "no"}`,
    `walletPhase=${gameState.walletPhase}`,
    `mobileSettingsOpen=${mobileSettingsOpen ? "yes" : "no"}`,
    `trafficCount=${gameState.trafficCount || 0}`,
    `trafficBlocked=${gameState.trafficBlocked ? "yes" : "no"}`,
    `activeGameId=${gameState.activeGameId}`,
    `lobbyPhase=${gameState.lobbyPhase}`,
    `dartsGame=${gameState.dartsGame ? JSON.stringify(gameState.dartsGame) : "none"}`,
    `checkersGame=${gameState.checkersGame ? JSON.stringify(gameState.checkersGame) : "none"}`,
    `music=${soundtrack.getState().playing ? "on" : "off"}`,
    `musicStyle=${soundtrack.getState().style}`,
    `musicZone=${soundtrack.getState().zone}`,
    `musicIntroSynced=${soundtrack.getState().introSynced ? "yes" : "no"}`,
    `introStarted=${introStarted ? "yes" : "no"}`,
    `fullscreen=${document.fullscreenElement ? "yes" : "no"}`,
    `orientationBlocked=${isOrientationBlocked() ? "yes" : "no"}`,
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
