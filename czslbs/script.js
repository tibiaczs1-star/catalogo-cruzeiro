"use strict";

const root = document.documentElement;
const body = document.body;
const header = document.querySelector("[data-header]");
const hero = document.querySelector("[data-cinematic-hero]");
const canvas = document.querySelector("#constellation");
const context = canvas?.getContext("2d");
const motionToggle = document.querySelector("[data-motion-toggle]");
const motionLabel = document.querySelector("[data-motion-label]");
const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
const motionStorageKey = "czs-labs-motion";
const rotatingIdea = document.querySelector("[data-rotating-idea]");
const rotatingIdeas = ["INFORMAÇÃO", "COMÉRCIO", "SERVIÇOS", "CULTURA", "OPORTUNIDADES"];
const motionVideos = [...document.querySelectorAll(".motion-reel video")];
const systemsCore = document.querySelector("[data-systems-core]");
const cyberWorld = document.querySelector("[data-cyber-world]");
const finePointerQuery = window.matchMedia("(pointer: fine)");
const techLive = document.querySelector("[data-tech-live]");
const techCases = [...document.querySelectorAll("[data-tech-case]")];
const techConsole = document.querySelector("[data-tech-console]");
const techImage = document.querySelector("[data-tech-image]");
const techLabel = document.querySelector("[data-tech-label]");
const techResult = document.querySelector("[data-tech-result]");
const productCards = [...document.querySelectorAll("[data-product-card]")];
const stageStatus = document.querySelector("[data-stage-status]");
const mascot = document.querySelector("[data-mascot]");
const mascotAction = document.querySelector("[data-mascot-action]");
const mascotStates = [
  { state: "idle", label: "OBSERVANDO SISTEMAS" },
  { state: "blink", label: "CHECANDO SINAIS" },
  { state: "look", label: "RASTREANDO DADOS" },
  { state: "ear", label: "OUVINDO O TERRITÓRIO" },
  { state: "tail", label: "PROCESSANDO IDEIAS" },
  { state: "scan", label: "ESCANEANDO A REDE" },
  { state: "type", label: "OPERANDO SISTEMAS" },
  { state: "hop", label: "ENTRANDO EM AÇÃO" },
  { state: "wave", label: "RECEBENDO VISITANTE" },
  { state: "celebrate", label: "MISSÃO CONCLUÍDA" }
];

let manualMotionPreference = null;
let pageVisible = !document.hidden;
let heroVisible = true;
let viewportFrame = 0;
let canvasFrame = 0;
let dots = [];
let canvasWidth = 0;
let canvasHeight = 0;
let rotatingIdeaIndex = 0;
let rotatingTimer = 0;
let rotatingChangeTimer = 0;
const visibleVideos = new Set();
let corePointerFrame = 0;
let corePointerX = 0.5;
let corePointerY = 0.5;
let techSwitchTimer = 0;
let worldPointerFrame = 0;
let worldPointerX = 0;
let worldPointerY = 0;
let productIndex = 0;
let productTimer = 0;
let mascotIndex = 0;
let mascotTimer = 0;

try {
  const savedMotionPreference = window.localStorage.getItem(motionStorageKey);
  manualMotionPreference = savedMotionPreference === "on" || savedMotionPreference === "off"
    ? savedMotionPreference
    : null;
} catch {
  manualMotionPreference = null;
}

const motionPreferenceEnabled = () => manualMotionPreference === "on"
  || (manualMotionPreference !== "off" && !reducedMotionQuery.matches);
const motionRuntimeEnabled = () => motionPreferenceEnabled() && pageVisible;

function updateViewport() {
  viewportFrame = 0;
  header?.classList.toggle("is-scrolled", window.scrollY > 18);
  const maximum = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
  root.style.setProperty("--scroll-progress", String(Math.min(1, Math.max(0, window.scrollY / maximum))));
  if (hero) {
    const rect = hero.getBoundingClientRect();
    const travel = Math.min(1, Math.max(0, -rect.top / Math.max(1, rect.height)));
    hero.style.setProperty("--hero-travel", travel.toFixed(3));
  }
}

function resetCyberWorld() {
  if (!hero) return;
  if (worldPointerFrame) window.cancelAnimationFrame(worldPointerFrame);
  worldPointerFrame = 0;
  hero.style.setProperty("--world-x", "0");
  hero.style.setProperty("--world-y", "0");
}

function scheduleCyberWorldTransform() {
  if (!hero || worldPointerFrame) return;
  worldPointerFrame = window.requestAnimationFrame(() => {
    hero.style.setProperty("--world-x", worldPointerX.toFixed(3));
    hero.style.setProperty("--world-y", worldPointerY.toFixed(3));
    worldPointerFrame = 0;
  });
}

function scheduleViewportUpdate() {
  if (viewportFrame) return;
  viewportFrame = window.requestAnimationFrame(updateViewport);
}

function revealContent() {
  const elements = [...document.querySelectorAll("[data-reveal]")];
  if (!("IntersectionObserver" in window)) {
    elements.forEach((element) => element.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.12 }
  );

  elements.forEach((element) => observer.observe(element));
}

function stopRotatingIdea() {
  if (rotatingTimer) window.clearInterval(rotatingTimer);
  if (rotatingChangeTimer) window.clearTimeout(rotatingChangeTimer);
  rotatingTimer = 0;
  rotatingChangeTimer = 0;
  rotatingIdea?.classList.remove("is-changing");
}

function startRotatingIdea() {
  if (!rotatingIdea || rotatingTimer || !motionRuntimeEnabled()) return;
  rotatingTimer = window.setInterval(() => {
    rotatingIdea.classList.add("is-changing");
    rotatingChangeTimer = window.setTimeout(() => {
      rotatingIdeaIndex = (rotatingIdeaIndex + 1) % rotatingIdeas.length;
      rotatingIdea.textContent = rotatingIdeas[rotatingIdeaIndex];
      rotatingIdea.classList.remove("is-changing");
    }, 180);
  }, 2400);
}

function seedDots() {
  const count = Math.min(52, Math.max(22, Math.floor(window.innerWidth / 31)));
  dots = Array.from({ length: count }, () => ({
    x: Math.random() * window.innerWidth,
    y: Math.random() * window.innerHeight,
    vx: (Math.random() - 0.5) * 0.14,
    vy: (Math.random() - 0.5) * 0.14,
    radius: Math.random() * 1.1 + 0.45
  }));
}

function resizeCanvas() {
  if (!canvas || !context) return;
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  canvasWidth = window.innerWidth;
  canvasHeight = window.innerHeight;
  canvas.width = Math.round(canvasWidth * ratio);
  canvas.height = Math.round(canvasHeight * ratio);
  canvas.style.width = `${canvasWidth}px`;
  canvas.style.height = `${canvasHeight}px`;
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  seedDots();
}

function drawConstellation() {
  if (!context || !canvas || !motionRuntimeEnabled() || !heroVisible || window.innerWidth <= 540) {
    canvasFrame = 0;
    return;
  }

  context.clearRect(0, 0, canvasWidth, canvasHeight);
  for (const dot of dots) {
    dot.x += dot.vx;
    dot.y += dot.vy;
    if (dot.x < 0 || dot.x > canvasWidth) dot.vx *= -1;
    if (dot.y < 0 || dot.y > canvasHeight) dot.vy *= -1;
  }

  for (let index = 0; index < dots.length; index += 1) {
    const dot = dots[index];
    context.beginPath();
    context.fillStyle = "rgba(76, 192, 255, .42)";
    context.arc(dot.x, dot.y, dot.radius, 0, Math.PI * 2);
    context.fill();

    for (let next = index + 1; next < dots.length; next += 1) {
      const other = dots[next];
      const distance = Math.hypot(dot.x - other.x, dot.y - other.y);
      if (distance > 132) continue;
      context.beginPath();
      context.strokeStyle = `rgba(35, 163, 255, ${0.13 * (1 - distance / 132)})`;
      context.lineWidth = 0.6;
      context.moveTo(dot.x, dot.y);
      context.lineTo(other.x, other.y);
      context.stroke();
    }
  }

  canvasFrame = window.requestAnimationFrame(drawConstellation);
}

function syncCanvas() {
  if (!canvas || !context) return;
  const shouldRun = motionRuntimeEnabled() && heroVisible && window.innerWidth > 540;
  canvas.style.opacity = shouldRun ? "" : "0";
  if (!shouldRun) {
    if (canvasFrame) window.cancelAnimationFrame(canvasFrame);
    canvasFrame = 0;
    context.clearRect(0, 0, canvasWidth, canvasHeight);
    return;
  }
  if (!dots.length) resizeCanvas();
  if (!canvasFrame) canvasFrame = window.requestAnimationFrame(drawConstellation);
}

function syncVideos() {
  if (!motionVideos.length) return;
  motionVideos.forEach((video) => {
    if (!motionRuntimeEnabled() || !visibleVideos.has(video)) {
      video.pause();
      return;
    }
    video.play().catch(() => {});
  });
}

function resetSystemsCore() {
  if (!systemsCore) return;
  if (corePointerFrame) window.cancelAnimationFrame(corePointerFrame);
  corePointerFrame = 0;
  systemsCore.style.removeProperty("--core-rotate-x");
  systemsCore.style.removeProperty("--core-rotate-y");
}

function scheduleSystemsCoreTransform() {
  if (!systemsCore || corePointerFrame) return;
  corePointerFrame = window.requestAnimationFrame(() => {
    systemsCore.style.setProperty("--core-rotate-x", `${(0.5 - corePointerY) * 3.5}deg`);
    systemsCore.style.setProperty("--core-rotate-y", `${(corePointerX - 0.5) * 5}deg`);
    corePointerFrame = 0;
  });
}

function activateProduct(index) {
  if (!productCards.length) return;
  productIndex = ((index % productCards.length) + productCards.length) % productCards.length;
  productCards.forEach((card, cardIndex) => {
    const active = cardIndex === productIndex;
    card.classList.toggle("is-active", active);
    card.setAttribute("aria-current", active ? "true" : "false");
  });
  const title = productCards[productIndex].querySelector("strong")?.textContent?.trim();
  if (stageStatus && title) stageStatus.textContent = `${title.toUpperCase()} EM FOCO`;
}

function setMascotState(index) {
  if (!mascot || !mascotStates.length) return;
  mascotIndex = ((index % mascotStates.length) + mascotStates.length) % mascotStates.length;
  const nextState = mascotStates[mascotIndex];
  mascot.dataset.state = nextState.state;
  if (mascotAction) mascotAction.textContent = nextState.label;
}

function stopHeroStageMotion() {
  if (productTimer) window.clearInterval(productTimer);
  if (mascotTimer) window.clearInterval(mascotTimer);
  productTimer = 0;
  mascotTimer = 0;
}

function startHeroStageMotion() {
  stopHeroStageMotion();
  if (!motionRuntimeEnabled()) return;
  productTimer = window.setInterval(() => activateProduct(productIndex + 1), 3200);
  mascotTimer = window.setInterval(() => setMascotState(mascotIndex + 1), 2100);
}

function syncHeroStageMotion() {
  if (motionRuntimeEnabled()) startHeroStageMotion();
  else stopHeroStageMotion();
}

function syncMotionControl() {
  const enabled = motionPreferenceEnabled();
  const runtimeEnabled = motionRuntimeEnabled();
  body.classList.toggle("motion-enabled", enabled);
  body.classList.toggle("motion-paused", !runtimeEnabled);
  if (!runtimeEnabled) {
    resetSystemsCore();
    resetCyberWorld();
  }

  if (motionToggle) {
    motionToggle.setAttribute("aria-pressed", String(enabled));
    motionToggle.setAttribute("aria-label", enabled ? "Pausar movimentos da página" : "Ativar movimentos da página");
    motionToggle.disabled = false;
  }
  if (motionLabel) {
    motionLabel.textContent = enabled
      ? "MOVIMENTO ATIVO"
      : reducedMotionQuery.matches && manualMotionPreference !== "off"
        ? "ATIVAR MOVIMENTO"
        : "MOVIMENTO PAUSADO";
  }

  if (runtimeEnabled) startRotatingIdea();
  else stopRotatingIdea();
  syncHeroStageMotion();
  syncCanvas();
  syncVideos();
}

function activateTechCase(nextCase) {
  if (!nextCase || nextCase.classList.contains("is-active")) return;
  techCases.forEach((item) => {
    const active = item === nextCase;
    item.classList.toggle("is-active", active);
    item.setAttribute("aria-pressed", String(active));
  });

  techConsole?.classList.add("is-switching");
  window.clearTimeout(techSwitchTimer);
  techSwitchTimer = window.setTimeout(() => {
    if (techImage) {
      techImage.src = nextCase.dataset.image || "";
      techImage.alt = `Visual do projeto ${nextCase.dataset.label || "CZS Labs"}`;
    }
    if (techLabel) techLabel.textContent = nextCase.dataset.label || "";
    if (techResult) techResult.textContent = nextCase.dataset.result || "";
    techConsole?.classList.remove("is-switching");
  }, motionRuntimeEnabled() ? 180 : 0);
}

techCases.forEach((item) => {
  item.addEventListener("click", () => activateTechCase(item));
  item.addEventListener("pointerenter", () => {
    if (finePointerQuery.matches) activateTechCase(item);
  });
  item.addEventListener("focus", () => activateTechCase(item));
});

productCards.forEach((card, index) => {
  card.tabIndex = 0;
  card.addEventListener("pointerenter", () => activateProduct(index));
  card.addEventListener("focus", () => activateProduct(index));
  card.addEventListener("click", () => activateProduct(index));
});

techLive?.addEventListener("pointermove", (event) => {
  if (!motionRuntimeEnabled() || !finePointerQuery.matches) return;
  const rect = techLive.getBoundingClientRect();
  const x = ((event.clientX - rect.left) / Math.max(1, rect.width) - 0.5) * 2;
  const y = ((event.clientY - rect.top) / Math.max(1, rect.height) - 0.5) * 2;
  techLive.style.setProperty("--tech-pointer-x", x.toFixed(3));
  techLive.style.setProperty("--tech-pointer-y", y.toFixed(3));
});
techLive?.addEventListener("pointerleave", () => {
  techLive.style.removeProperty("--tech-pointer-x");
  techLive.style.removeProperty("--tech-pointer-y");
});

function observeHero() {
  if (!hero || !("IntersectionObserver" in window)) return;
  const observer = new IntersectionObserver(
    ([entry]) => {
      heroVisible = entry.isIntersecting;
      syncCanvas();
    },
    { threshold: 0.02 }
  );
  observer.observe(hero);
}

function observeVideos() {
  if (!motionVideos.length) return;
  if (!("IntersectionObserver" in window)) {
    motionVideos.forEach((video) => visibleVideos.add(video));
    syncVideos();
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) visibleVideos.add(entry.target);
        else visibleVideos.delete(entry.target);
      });
      syncVideos();
    },
    { threshold: 0.2 }
  );
  motionVideos.forEach((video) => observer.observe(video));
}

motionToggle?.addEventListener("click", () => {
  manualMotionPreference = motionPreferenceEnabled() ? "off" : "on";
  try {
    window.localStorage.setItem(motionStorageKey, manualMotionPreference);
  } catch {
    // The page remains functional if persistent storage is unavailable.
  }
  syncMotionControl();
});

systemsCore?.addEventListener("pointermove", (event) => {
  if (!motionRuntimeEnabled() || !finePointerQuery.matches) return;
  const rect = systemsCore.getBoundingClientRect();
  if (!rect.width || !rect.height) return;
  corePointerX = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
  corePointerY = Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height));
  scheduleSystemsCoreTransform();
});
systemsCore?.addEventListener("pointerleave", resetSystemsCore);

hero?.addEventListener("pointermove", (event) => {
  if (!cyberWorld || !motionRuntimeEnabled() || !finePointerQuery.matches) return;
  const rect = hero.getBoundingClientRect();
  if (!rect.width || !rect.height) return;
  worldPointerX = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
  worldPointerY = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
  scheduleCyberWorldTransform();
});
hero?.addEventListener("pointerleave", resetCyberWorld);

window.addEventListener("scroll", scheduleViewportUpdate, { passive: true });
window.addEventListener("resize", () => {
  resizeCanvas();
  scheduleViewportUpdate();
  syncCanvas();
}, { passive: true });
document.addEventListener("visibilitychange", () => {
  pageVisible = !document.hidden;
  syncMotionControl();
});

if (typeof reducedMotionQuery.addEventListener === "function") {
  reducedMotionQuery.addEventListener("change", syncMotionControl);
} else {
  reducedMotionQuery.addListener(syncMotionControl);
}

updateViewport();
revealContent();
observeHero();
observeVideos();
resizeCanvas();
activateProduct(0);
setMascotState(0);
syncMotionControl();
