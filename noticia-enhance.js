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
      "#detail-title",
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
      "#detail-category",
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
      "#detail-source-name",
      ".source-name",
      "#detail-source-name strong",
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

  function extendArticleText() {
    return;
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

  function applyHeroImagePreference() {
    return;
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
