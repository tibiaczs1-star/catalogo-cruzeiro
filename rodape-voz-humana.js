(() => {
  const LABELS = new Set([
    "rodape oficial do projeto",
    "rodapé oficial do projeto",
  ]);

  function normalize(text) {
    return (text || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
  }

  function removeFooterLabelOnly() {
    const footerRoots = document.querySelectorAll(
      "footer, .site-footer, .rodape-oficial-catalogo, [data-rodape]"
    );

    footerRoots.forEach((footer) => {
      footer.querySelectorAll("h1, h2, h3, h4, p, span, small, strong, div").forEach((el) => {
        const text = normalize(el.textContent);
        if (LABELS.has(text)) {
          el.remove();
        }
      });
    });
  }

  const MAILZA_CARTOON_SLUG = "corre-alan-a-mailza-ta-chegando";
  const MAILZA_CARTOON_IMAGE = "./assets/news-fallbacks/corre-alan-mailza-cartoon.svg";
  const MAILZA_CARTOON_TITLE = "Corre Alan, a Mailza ta chegando";

  function isMailzaCartoonArticle(item = {}) {
    const haystack = [
      item.slug,
      item.id,
      item.title,
      item.sourceUrl,
      item.sourceLabel,
      item.href,
    ]
      .join(" ")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();

    return haystack.includes(MAILZA_CARTOON_SLUG) || haystack.includes("corre alan");
  }

  function patchMailzaCartoonData() {
    if (!Array.isArray(window.NEWS_DATA)) return;

    window.NEWS_DATA.forEach((item) => {
      if (!isMailzaCartoonArticle(item)) return;
      item.imageUrl = MAILZA_CARTOON_IMAGE;
      item.feedImageUrl = MAILZA_CARTOON_IMAGE;
      item.sourceImageUrl = MAILZA_CARTOON_IMAGE;
      item.imageCredit = "Ilustracao editorial do Catalogo Cruzeiro do Sul";
      item.imageFocus = "62% 48%";
    });
  }

  function paintMailzaCartoon(node) {
    if (!node) return;
    const imageValue = `url("${MAILZA_CARTOON_IMAGE}")`;
    node.dataset.imageUrl = MAILZA_CARTOON_IMAGE;
    node.dataset.sourceImage = MAILZA_CARTOON_IMAGE;
    node.style.setProperty("--bg-image", imageValue);
    node.style.setProperty("--news-photo", imageValue);
    node.style.setProperty("--bg-position", "62% 48%");
    node.style.setProperty("background-image", imageValue, "important");
    node.style.setProperty("background-position", "62% 48%", "important");
    node.style.setProperty("background-size", "cover", "important");
    node.style.setProperty("background-repeat", "no-repeat", "important");
    node.classList.add("has-photo", "has-real-photo");
  }

  function paintMailzaCartoonSurfaces() {
    patchMailzaCartoonData();

    const search = new URLSearchParams(window.location.search || "");
    const pageSlug = search.get("slug") || "";
    const detailTitle = document.getElementById("detail-title")?.textContent || "";

    if (pageSlug === MAILZA_CARTOON_SLUG || /corre\s+alan/i.test(detailTitle)) {
      paintMailzaCartoon(document.getElementById("detail-thumb"));
      const mediaKind = document.getElementById("detail-media-kind");
      const mediaNote = document.getElementById("detail-media-note");
      if (mediaKind) mediaKind.textContent = "Ilustracao editorial";
      if (mediaNote) mediaNote.textContent = "Cartoon editorial de Alan Rick e Mailza correndo.";
    }

    const heroTitle = document.querySelector("[data-hero-tourism-title]");
    if (heroTitle && /corre\s+alan/i.test(heroTitle.textContent || "")) {
      document.querySelectorAll("[data-hero-tourism-slide], .hero-newsroom-shell").forEach(paintMailzaCartoon);
    }

    document.querySelectorAll("a[href*='corre-alan-a-mailza-ta-chegando']").forEach((link) => {
      paintMailzaCartoon(link.querySelector(".news-thumb, [data-image-url]"));
      paintMailzaCartoon(link.closest("article")?.querySelector(".news-thumb, [data-image-url]"));
      paintMailzaCartoon(link.closest("[data-source-image]")?.querySelector(".news-thumb, [data-image-url]"));
    });

    document.querySelectorAll("[data-hero-daily-title], [data-hero-topic-title], [data-hero-office-photo-title]").forEach((title) => {
      if (!/corre\s+alan/i.test(title.textContent || "")) return;
      const root = title.closest("a, article, section, div");
      paintMailzaCartoon(root?.querySelector("[data-hero-topic-photo], [data-hero-office-photo], .news-thumb"));
      paintMailzaCartoon(root);
    });
  }

  function bootMailzaCartoonOverride() {
    paintMailzaCartoonSurfaces();
    [300, 900, 1800, 3200, 5200].forEach((delay) => {
      window.setTimeout(paintMailzaCartoonSurfaces, delay);
    });

    if ("MutationObserver" in window) {
      const observer = new MutationObserver(() => paintMailzaCartoonSurfaces());
      observer.observe(document.body, { childList: true, subtree: true, characterData: true });
      window.setTimeout(() => observer.disconnect(), 8000);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      removeFooterLabelOnly();
      bootMailzaCartoonOverride();
    }, { once: true });
  } else {
    removeFooterLabelOnly();
    bootMailzaCartoonOverride();
  }
})();
