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

let manualMotionOff = false;
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

try {
  manualMotionOff = window.localStorage.getItem(motionStorageKey) === "off";
} catch {
  manualMotionOff = false;
}

const motionPreferenceEnabled = () => !reducedMotionQuery.matches && !manualMotionOff;
const motionRuntimeEnabled = () => motionPreferenceEnabled() && pageVisible;

function updateViewport() {
  viewportFrame = 0;
  header?.classList.toggle("is-scrolled", window.scrollY > 18);
  const maximum = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
  root.style.setProperty("--scroll-progress", String(Math.min(1, Math.max(0, window.scrollY / maximum))));
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

function syncMotionControl() {
  const enabled = motionPreferenceEnabled();
  const runtimeEnabled = motionRuntimeEnabled();
  body.classList.toggle("motion-paused", !runtimeEnabled);

  if (motionToggle) {
    motionToggle.setAttribute("aria-pressed", String(enabled));
    motionToggle.setAttribute("aria-label", enabled ? "Pausar movimentos da página" : "Ativar movimentos da página");
    motionToggle.disabled = reducedMotionQuery.matches;
  }
  if (motionLabel) {
    motionLabel.textContent = reducedMotionQuery.matches
      ? "MOVIMENTO REDUZIDO"
      : enabled
        ? "MOVIMENTO ATIVO"
        : "MOVIMENTO PAUSADO";
  }

  if (runtimeEnabled) startRotatingIdea();
  else stopRotatingIdea();
  syncCanvas();
  syncVideos();
}

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
  if (reducedMotionQuery.matches) return;
  manualMotionOff = !manualMotionOff;
  try {
    window.localStorage.setItem(motionStorageKey, manualMotionOff ? "off" : "on");
  } catch {
    // The page remains functional if persistent storage is unavailable.
  }
  syncMotionControl();
});

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
syncMotionControl();
