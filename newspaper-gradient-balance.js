"use strict";

(function () {
  function parseColorsFromGradient(value) {
    const text = String(value || "");
    const matches = [...text.matchAll(/rgba?\((\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})(?:\s*,\s*([0-9.]+))?\)/gi)];
    return matches.map((m) => ({
      r: Math.min(255, Number(m[1] || 0)),
      g: Math.min(255, Number(m[2] || 0)),
      b: Math.min(255, Number(m[3] || 0)),
      a: m[4] == null ? 1 : Number(m[4] || 1)
    }));
  }

  function luminance({ r, g, b }) {
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  function lightenColor(color, ratio) {
    const r = Math.round(color.r + (255 - color.r) * ratio);
    const g = Math.round(color.g + (255 - color.g) * ratio);
    const b = Math.round(color.b + (255 - color.b) * ratio);
    return { r, g, b };
  }

  function rgbString(c) {
    return `rgb(${c.r}, ${c.g}, ${c.b})`;
  }

  function shouldSkip(el) {
    if (!(el instanceof HTMLElement)) return true;
    if (el.classList.contains("np-gradient-checked")) return true;
    const rect = el.getBoundingClientRect();
    if (rect.width < 180 || rect.height < 58) return true;
    return false;
  }

  function isHeroLike(el) {
    const cls = String(el.className || "").toLowerCase();
    return (
      cls.includes("hero") ||
      cls.includes("destaque-principal") ||
      cls.includes("main-highlight") ||
      cls.includes("featured-main")
    );
  }

  function rebalanceGradient(el) {
    if (shouldSkip(el)) return;
    el.classList.add("np-gradient-checked");

    const style = window.getComputedStyle(el);
    const bgImage = String(style.backgroundImage || "");
    if (!bgImage || bgImage === "none" || !bgImage.includes("gradient")) return;

    const colors = parseColorsFromGradient(bgImage);
    if (!colors.length) return;

    const avgLum = colors.reduce((acc, c) => acc + luminance(c), 0) / colors.length;
    if (avgLum >= 138) return;

    const baseA = colors[0];
    const baseB = colors[Math.min(1, colors.length - 1)] || baseA;
    const lightA = lightenColor(baseA, 0.4);
    const lightB = lightenColor(baseB, 0.55);
    const lightC = lightenColor(baseB, 0.68);

    el.style.backgroundImage = `
      radial-gradient(circle at 22% 18%, rgba(255,255,255,0.22), transparent 42%),
      linear-gradient(128deg, ${rgbString(lightA)} 0%, ${rgbString(lightB)} 52%, ${rgbString(lightC)} 100%)
    `;

    el.classList.add("np-newspaper-gradient");
    if (isHeroLike(el)) {
      el.classList.add("np-newspaper-hero");
    }
  }

  function collectCandidates(root) {
    const selectors = [
      ".news-thumb",
      ".mini-thumb",
      ".card-thumb",
      ".hero-card",
      ".top-card",
      ".highlight-card",
      ".featured-card",
      ".destaque-card",
      ".main-highlight-card",
      ".editoria-highlight",
      ".radar-highlight",
      "[class*='thumb']",
      "[class*='hero']",
      "[class*='highlight']",
      "[class*='destaque']"
    ];
    return Array.from(root.querySelectorAll(selectors.join(",")));
  }

  function run() {
    const targets = collectCandidates(document);
    targets.forEach(rebalanceGradient);
  }

  function init() {
    run();
    const observer = new MutationObserver(() => run());
    observer.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
