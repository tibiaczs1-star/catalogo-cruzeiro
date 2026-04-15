"use strict";

(function () {
  function onceReady(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn, { once: true });
      return;
    }
    fn();
  }

  function cleanText(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  const CITY_FALLBACK_IMAGES = [
    "https://upload.wikimedia.org/wikipedia/commons/9/92/Cruzeiro_do_Sul_-_Acre_%283801204086%29.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/d/d9/Cruzeiro_do_Sul_-_Acre_%283800383521%29.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/7/7d/Cruzeiro_do_Sul_-_Acre_%283800389269%29.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/5/55/Cruzeiro_do_Sul_-_Acre_%283800381599%29.jpg"
  ];

  function looksLikeImageUrl(url) {
    const value = cleanText(url);
    if (!value) return false;
    if (/^data:image\//i.test(value)) return true;
    if (!/^https?:\/\//i.test(value)) return false;
    return /\.(avif|webp|png|jpe?g|gif|bmp|svg)(\?.*)?$/i.test(value);
  }

  function extractStyleUrl(styleValue) {
    const raw = cleanText(styleValue);
    const match = raw.match(/url\((['"]?)(.*?)\1\)/i);
    return match ? cleanText(match[2]) : "";
  }

  function unique(values) {
    return [...new Set(values.map(cleanText).filter(Boolean))];
  }

  function sanitizeImageUrl(url) {
    const value = cleanText(url);
    if (!value) return "";
    if (!/^https?:\/\//i.test(value)) return value;
    if (/images\.weserv\.nl/i.test(value)) return value;

    const needsProxy =
      /ac24horas\.com|jurua24horas\.com|cruzeirodosul\.net|cruzeirodosul\.ac\.gov\.br|static\.wixstatic\.com|agencia\.ac\.gov\.br|www\.amac\.com\.br|ifac\.edu\.br|portalacre\.com\.br/i.test(
        value
      );

    if (!needsProxy) return value;
    return `https://images.weserv.nl/?url=${encodeURIComponent(
      value.replace(/^https?:\/\//i, "")
    )}`;
  }

  function pickMainTitle() {
    const selectors = [
      ".detail-title",
      ".article-title",
      ".news-detail-title",
      ".headline-title",
      "main h1",
      "h1"
    ];

    for (const selector of selectors) {
      const node = document.querySelector(selector);
      if (!node) continue;
      const text = cleanText(node.textContent);
      if (text.length > 8) return text;
    }

    return "";
  }

  function pickCategory() {
    const selectors = [
      ".detail-category",
      ".article-category",
      ".news-category",
      ".kicker",
      ".eyebrow"
    ];

    for (const selector of selectors) {
      const node = document.querySelector(selector);
      if (!node) continue;
      const text = cleanText(node.textContent);
      if (text.length > 2 && text.length < 40) return text;
    }
    return "";
  }

  function pickSourceName() {
    const selectors = [
      ".source-name",
      ".detail-source strong",
      ".source-card strong",
      ".info-card strong",
      ".detail-sidebar strong"
    ];

    for (const selector of selectors) {
      const node = document.querySelector(selector);
      if (!node) continue;
      const text = cleanText(node.textContent);
      if (text.length > 2 && text.length < 80) return text;
    }
    return "";
  }

  function selectBodyContainer() {
    const selectors = [
      ".detail-main",
      ".detail-content-main",
      ".article-main",
      ".news-detail-main",
      ".detail-story",
      "main article",
      "article"
    ];

    for (const selector of selectors) {
      const node = document.querySelector(selector);
      if (node) return node;
    }
    return null;
  }

  function pickParagraphNodes(container) {
    if (!container) return [];
    const nodes = Array.from(container.querySelectorAll("p"));
    return nodes.filter((node) => {
      const text = cleanText(node.textContent);
      if (text.length < 35) return false;
      const parent = node.closest(".detail-sidebar, .right-rail, aside");
      return !parent;
    });
  }

  function buildExtraParagraphs() {
    const title = pickMainTitle();
    const category = pickCategory();
    const source = pickSourceName();

    const first = cleanText(
      `${title ? `No tema "${title}", ` : "Nesta pauta, "}a leitura ampliada mostra como o assunto evolui ao longo do dia e influencia decisões práticas da população, do comércio local e dos serviços públicos.`
    );

    const second = cleanText(
      `${category ? `No caderno de ${category}, ` : ""}os dados reunidos até aqui apontam impactos diretos no cotidiano e também desdobramentos de médio prazo, especialmente em mobilidade, atendimento e organização comunitária.`
    );

    const third = cleanText(
      `${source ? `A fonte original ${source} ` : "A fonte original "}continua sendo acompanhada para novas confirmações, enquanto este catálogo organiza contexto, síntese e pontos essenciais para facilitar uma leitura mais completa.`
    );

    const fourth =
      "Com atualização contínua, a matéria permanece aberta para novos números, reações da comunidade e medidas públicas, mantendo o histórico de fatos para consulta rápida e transparente.";

    return [first, second, third, fourth];
  }

  function extendArticleText() {
    const container = selectBodyContainer();
    if (!container) return;

    const paragraphs = pickParagraphNodes(container);
    const totalChars = paragraphs.reduce(
      (acc, node) => acc + cleanText(node.textContent).length,
      0
    );

    const needsMoreText = paragraphs.length < 5 || totalChars < 1200;
    if (!needsMoreText) return;

    const extras = buildExtraParagraphs();
    const currentTexts = new Set(
      paragraphs.map((node) => cleanText(node.textContent).toLowerCase())
    );

    let anchor =
      paragraphs[paragraphs.length - 1] ||
      container.querySelector(".detail-text, .article-text, .content-body") ||
      container;

    extras.forEach((line) => {
      if (!line || currentTexts.has(line.toLowerCase())) return;
      const p = document.createElement("p");
      p.className = "detail-extra-paragraph";
      p.textContent = line;

      if (anchor && anchor.parentNode) {
        anchor.parentNode.insertBefore(p, anchor.nextSibling);
        anchor = p;
      } else {
        container.appendChild(p);
        anchor = p;
      }
    });
  }

  function getCandidatesFromWindow() {
    const candidates = [];
    const possibleRoots = [
      window.currentArticle,
      window.__CURRENT_ARTICLE__,
      window.__ARTICLE__,
      window.articleData,
      window.noticiaAtual
    ];

    possibleRoots.forEach((root) => {
      if (!root || typeof root !== "object") return;
      const local = [
        root.imageUrl,
        root.coverImage,
        root.heroImage,
        root.image,
        root.thumbUrl,
        root?.media?.url,
        root?.media?.imageUrl,
        root?.media?.creditUrl,
        root.sourceImage,
        root.sourceImageUrl
      ];
      local.forEach((value) => {
        if (looksLikeImageUrl(value)) candidates.push(value);
      });
    });

    return candidates;
  }

  function getCandidatesFromDom() {
    const candidates = [];

    const dataNodes = Array.from(
      document.querySelectorAll(
        "[data-image-url], [data-cover], [data-hero-image], [data-thumb]"
      )
    );
    dataNodes.forEach((node) => {
      ["data-image-url", "data-cover", "data-hero-image", "data-thumb"].forEach(
        (attr) => {
          const value = node.getAttribute(attr);
          if (looksLikeImageUrl(value)) candidates.push(value);
        }
      );
    });

    const linkNodes = Array.from(document.querySelectorAll("a[href]"));
    linkNodes.forEach((link) => {
      const href = link.getAttribute("href");
      if (looksLikeImageUrl(href)) candidates.push(href);
    });

    const imgNodes = Array.from(document.querySelectorAll("img[src]"));
    imgNodes.forEach((img) => {
      const src = img.getAttribute("src");
      if (looksLikeImageUrl(src)) candidates.push(src);
    });

    const meta = document.querySelector('meta[property="og:image"]');
    if (meta && looksLikeImageUrl(meta.getAttribute("content"))) {
      candidates.push(meta.getAttribute("content"));
    }

    const hero = document.querySelector(
      ".detail-hero-thumb, .article-hero-thumb, .news-detail-hero-thumb"
    );
    if (hero) {
      const inlineUrl = extractStyleUrl(hero.style.backgroundImage || "");
      if (looksLikeImageUrl(inlineUrl)) candidates.push(inlineUrl);

      const computedUrl = extractStyleUrl(
        window.getComputedStyle(hero).backgroundImage || ""
      );
      if (looksLikeImageUrl(computedUrl)) candidates.push(computedUrl);
    }

    return candidates;
  }

  function findHeroNode() {
    return document.querySelector(
      ".detail-hero-thumb, .article-hero-thumb, .news-detail-hero-thumb"
    );
  }

  function clearPhotoGrid(hero) {
    if (!hero) return;
    hero.classList.remove("has-photo-grid");
    const grid = hero.querySelector(".hero-photo-grid");
    if (grid) grid.remove();
  }

  function buildPhotoGrid(hero, imageUrls) {
    if (!hero) return;

    clearPhotoGrid(hero);
    const urls = unique(imageUrls).filter(looksLikeImageUrl).slice(0, 4);
    if (!urls.length) return;

    const grid = document.createElement("div");
    grid.className = "hero-photo-grid";

    urls.forEach((url, index) => {
      const tile = document.createElement("div");
      tile.className = `hero-photo-tile hero-photo-tile-${index + 1}`;
      tile.style.backgroundImage = `url("${url}")`;
      grid.appendChild(tile);
    });

    hero.appendChild(grid);
    hero.classList.add("has-photo-grid");
  }

  function applySingleHeroImage(hero, imageUrl) {
    clearPhotoGrid(hero);
    hero.classList.remove("no-image");
    hero.classList.add("has-image", "has-photo");
    const safeUrl = sanitizeImageUrl(imageUrl);
    hero.style.setProperty("--bg-image", `url("${safeUrl}")`);
    hero.style.setProperty("--bg-position", "center 30%");
    hero.style.setProperty("--bg-size", "cover");
    hero.style.backgroundImage = `linear-gradient(180deg, rgba(6, 15, 28, 0.1) 0%, rgba(6, 15, 28, 0.48) 100%), url("${safeUrl}")`;
    hero.style.backgroundPosition = "center center";
    hero.style.backgroundRepeat = "no-repeat";
    hero.style.backgroundSize = "cover";
    hero.style.backgroundColor = "#0f2946";
    hero.style.boxShadow = "";
    hero.setAttribute("data-top-image", "on");

    const img = new Image();
    img.onload = () => {
      const ratio = img.width && img.height ? img.width / img.height : 1.6;
      hero.style.backgroundSize = ratio < 1.25 ? "contain" : "cover";
      hero.style.backgroundPosition = "center center";
    };
    img.src = safeUrl;
  }

  function applyHeroImagePreference() {
    const hero = findHeroNode();
    if (!hero) return;

    const topImageState = cleanText(hero.getAttribute("data-top-image"));
    if (topImageState === "pending" || topImageState === "resolved") {
      return;
    }

    if (hero.querySelector(".detail-hero-media")) {
      return;
    }

    const candidates = unique([
      ...getCandidatesFromWindow(),
      ...getCandidatesFromDom()
    ]);

    const imageUrl = candidates.find(looksLikeImageUrl) || "";

    if (imageUrl) {
      applySingleHeroImage(hero, imageUrl);
      return;
    }

    hero.classList.remove("has-image");
    hero.classList.remove("no-image");
    hero.style.backgroundImage =
      "linear-gradient(180deg, rgba(8, 21, 38, 0.06) 0%, rgba(8, 21, 38, 0.3) 100%)";
    hero.style.backgroundSize = "cover";
    hero.style.backgroundPosition = "center center";
    hero.style.backgroundRepeat = "no-repeat";
    hero.style.backgroundColor = "#102742";
    hero.style.boxShadow = "";

    buildPhotoGrid(hero, CITY_FALLBACK_IMAGES);

    if (!hero.classList.contains("has-photo-grid")) {
      hero.classList.add("no-image");
      hero.style.backgroundImage = "none";
      hero.style.background = "#ffffff";
      hero.style.boxShadow = "none";
      hero.setAttribute("data-top-image", "off");
      return;
    }

    hero.setAttribute("data-top-image", "grid");
  }

  function runEnhancements() {
    extendArticleText();
    applyHeroImagePreference();
  }

  onceReady(function () {
    runEnhancements();

    const observer = new MutationObserver(() => {
      runEnhancements();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  });
})();
