"use strict";

(function () {
  const PERSON_HINTS = [
    "destaque",
    "viral",
    "famos",
    "candidato",
    "elei",
    "jovem",
    "social",
    "comunidade",
    "pop",
    "portrait",
    "person",
    "people",
    "woman",
    "man",
    "girl",
    "boy",
    "face",
    "model",
    "rosto",
    "retrato",
    "cantor",
    "cantora",
    "artista",
    "ator",
    "atriz",
    "jogador",
    "jogadora",
    "ciclista",
    "atleta",
    "prefeito",
    "prefeita",
    "governador",
    "governadora",
    "senador",
    "senadora",
    "deputado",
    "deputada",
    "ministro",
    "ministra",
    "presidente",
    "entrevista",
    "bbb"
  ];

  function normalize(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
  }

  function findTrendingSection() {
    const headings = Array.from(document.querySelectorAll("h1, h2, h3, h4"));
    const title = headings.find((node) => {
      const text = normalize(node.textContent);
      return text.includes("trending & buzz") || text.includes("radar da galera");
    });
    if (!title) return null;
    return title.closest("section, article, .block, .panel, main") || null;
  }

  function extractUrl(backgroundImage) {
    const text = String(backgroundImage || "");
    const match = text.match(/url\((['"]?)(.*?)\1\)/i);
    return match ? String(match[2] || "").trim() : "";
  }

  function isValidFrame(node) {
    if (!(node instanceof HTMLElement)) return false;
    const cls = normalize(node.className);
    if (cls.includes("avatar") || cls.includes("icon") || cls.includes("logo")) return false;
    const rect = node.getBoundingClientRect();
    return rect.width >= 220 && rect.height >= 42;
  }

  function ensureImageNode(frame) {
    let img = frame.querySelector("img");
    if (img) return img;

    const bg = extractUrl(frame.style.backgroundImage || window.getComputedStyle(frame).backgroundImage);
    if (!bg) return null;

    img = document.createElement("img");
    img.className = "photo-fit-img";
    img.alt = frame.getAttribute("data-photo-alt") || "Imagem da pauta";
    img.loading = "lazy";
    img.decoding = "async";
    img.src = bg;

    frame.style.backgroundImage = "none";
    frame.appendChild(img);
    return img;
  }

  function hasPersonHint(frame, img) {
    const context = normalize(
      `${frame.className} ${frame.textContent} ${img?.alt || ""} ${img?.src || ""}`
    );
    return PERSON_HINTS.some((hint) => context.includes(hint));
  }

  async function tryFaceDetection(frame, img) {
    if (!("FaceDetector" in window)) return;
    if (!img || !img.naturalWidth || !img.naturalHeight) return;

    try {
      const detector = new window.FaceDetector({
        fastMode: true,
        maxDetectedFaces: 3
      });
      const faces = await detector.detect(img);
      if (!faces || !faces.length) return;

      const chosen = faces
        .slice()
        .sort((a, b) => {
          const aa = (a.boundingBox?.width || 0) * (a.boundingBox?.height || 0);
          const bb = (b.boundingBox?.width || 0) * (b.boundingBox?.height || 0);
          return bb - aa;
        })[0];
      const box = chosen.boundingBox;
      if (!box) return;

      const ratio = img.naturalWidth / Math.max(1, img.naturalHeight);
      const x = ((box.x + box.width / 2) / img.naturalWidth) * 100;
      const y = ((box.y + box.height * 0.4) / img.naturalHeight) * 100;
      const safeX = Math.max(20, Math.min(80, x));
      const safeY = Math.max(ratio < 1.05 ? 14 : 18, Math.min(ratio < 1.05 ? 38 : 54, y));

      frame.classList.add("photo-face-focus");
      frame.style.setProperty("--face-pos", `${safeX}% ${safeY}%`);
      img.style.objectPosition = `${safeX}% ${safeY}%`;
    } catch {
      // falhou (CORS/unsupported): mantém fallback
    }
  }

  function applyBaseCrop(frame, img) {
    const ratio = img.naturalWidth / Math.max(1, img.naturalHeight);
    const prefersPerson = hasPersonHint(frame, img);
    frame.classList.remove("photo-portrait", "photo-person-safe", "photo-face-focus");

    if (ratio < 0.68) {
      frame.classList.add("photo-portrait");
      img.style.objectPosition = prefersPerson ? "50% 14%" : "50% 18%";
      return;
    }

    if (prefersPerson || ratio < 1.24) {
      frame.classList.add("photo-person-safe");
      img.style.objectPosition = ratio < 0.95 ? "50% 18%" : "50% 22%";
      return;
    }

    if (ratio > 2.3) {
      img.style.objectPosition = "50% 45%";
      return;
    }

    if (ratio < 1.35) {
      img.style.objectPosition = "50% 24%";
      return;
    }

    img.style.objectPosition = "50% 30%";
  }

  function patchFrame(frame) {
    if (!isValidFrame(frame)) return;
    if (frame.getAttribute("data-photo-fixed") === "1") return;
    frame.setAttribute("data-photo-fixed", "1");
    frame.classList.add("photo-fit-frame");

    const img = ensureImageNode(frame);
    if (!img) {
      frame.style.backgroundPosition = "center 28%";
      return;
    }

    const ready = () => {
      if (!img.naturalWidth || !img.naturalHeight) return;
      applyBaseCrop(frame, img);
      tryFaceDetection(frame, img);
    };

    if (img.complete) {
      ready();
    } else {
      img.addEventListener("load", ready, { once: true });
    }
  }

  function run() {
    const section = findTrendingSection();
    if (!section) return;
    section.classList.add("section-trending-buzz");

    const candidates = Array.from(
      section.querySelectorAll(
        "[class*='photo'], [class*='thumb'], [class*='image'], .trend-photo, .trend-image, .buzz-photo, img"
      )
    );
    candidates.forEach((node) => {
      const frame =
        node instanceof HTMLImageElement
          ? node.closest("[class*='photo'], [class*='thumb'], [class*='image'], article, .card") ||
            node.parentElement
          : node;
      if (frame) patchFrame(frame);
    });
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
