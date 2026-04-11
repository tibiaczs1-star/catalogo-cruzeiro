"use strict";

(function () {
  const CITY_IMAGES = {
    "RIO BRANCO":
      "https://commons.wikimedia.org/wiki/Special:FilePath/Rio_Branco_(Acre).jpg",
    "SENA MADUREIRA":
      "https://commons.wikimedia.org/wiki/Special:FilePath/Sena_Madureira_-_Acre_(3801372002).jpg",
    FEIJÓ:
      "https://commons.wikimedia.org/wiki/Special:FilePath/Feij%C3%B3_-_Acre_(3800469635).jpg",
    TARAUACÁ:
      "https://commons.wikimedia.org/wiki/Special:FilePath/Tarauac%C3%A1_-_Acre.jpg",
    "CRUZEIRO DO SUL":
      "https://commons.wikimedia.org/wiki/Special:FilePath/Cruzeiro_do_Sul-Acre%2C_Brasil.jpg"
  };

  function textOf(node) {
    return String(node?.textContent || "").replace(/\s+/g, " ").trim();
  }

  function normalizeUpper(value) {
    return textOf(value).toUpperCase();
  }

  function findAcreSection() {
    const headings = Array.from(document.querySelectorAll("h1, h2, h3"));
    const title = headings.find((el) => /o que rola no acre/i.test(textOf(el)));
    if (!title) return null;
    return title.closest("section, article, .block, .panel, .card, main") || null;
  }

  function getCityFromCard(card) {
    const candidates = Array.from(
      card.querySelectorAll(".tag, .chip, .kicker, .eyebrow, [class*='tag'], [class*='chip']")
    );

    for (const node of candidates) {
      const value = normalizeUpper(node);
      if (CITY_IMAGES[value]) return value;
    }

    const allText = normalizeUpper(card);
    const keys = Object.keys(CITY_IMAGES);
    return keys.find((key) => allText.includes(key)) || "";
  }

  function findCards(section) {
    const raw = Array.from(section.querySelectorAll("article, .card, .news-card, .block, li"));
    return raw.filter((node) => {
      const txt = normalizeUpper(node);
      return /LER MAIS/.test(txt) || /ABRIL 2026|MARÇO 2026|2026/.test(txt);
    });
  }

  function applyPhotoCard(card, imageUrl) {
    if (!imageUrl || card.classList.contains("acre-photo-card")) return;
    card.classList.add("acre-photo-card");
    card.style.backgroundImage = `url("${imageUrl}")`;
  }

  function init() {
    const section = findAcreSection();
    if (!section) return;

    const cards = findCards(section).slice(0, 10);
    cards.forEach((card) => {
      const city = getCityFromCard(card);
      const image = CITY_IMAGES[city] || CITY_IMAGES["CRUZEIRO DO SUL"];
      applyPhotoCard(card, image);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
