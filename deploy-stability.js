(function () {
  const PHOTOS = {
    prefeitura:
      "https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=1400&q=85",
    cotidiano:
      "https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=1400&q=85",
    educacao:
      "https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1400&q=85",
    saude:
      "https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&w=1400&q=85",
    policia:
      "https://images.unsplash.com/photo-1453873531674-2151bcd01707?auto=format&fit=crop&w=1400&q=85",
    utilidade:
      "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=1400&q=85",
    politica:
      "https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?auto=format&fit=crop&w=1400&q=85",
    negocios:
      "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=1400&q=85",
    default:
      "https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=1400&q=85"
  };

  const normalize = (value) =>
    String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();

  const photoFor = (card) => {
    const category = normalize(card.dataset.category);
    const text = normalize(card.textContent);
    const all = `${category} ${text}`;

    if (all.includes("educacao") || all.includes("enem") || all.includes("ifac") || all.includes("escola")) return PHOTOS.educacao;
    if (all.includes("saude") || all.includes("srag") || all.includes("hospital") || all.includes("creas")) return PHOTOS.saude;
    if (all.includes("policia") || all.includes("preso") || all.includes("roubo") || all.includes("bombeiro")) return PHOTOS.policia;
    if (all.includes("prefeitura") || all.includes("detran") || all.includes("mailza")) return PHOTOS.prefeitura;
    if (all.includes("utilidade") || all.includes("cnh") || all.includes("concurso") || all.includes("iapen")) return PHOTOS.utilidade;
    if (all.includes("politica") || all.includes("governo") || all.includes("deputado")) return PHOTOS.politica;
    if (all.includes("negocio") || all.includes("economia") || all.includes("imposto")) return PHOTOS.negocios;
    return PHOTOS.cotidiano;
  };

  const findMediaTargets = (card) => {
    const selectors = [
      ".news-thumb",
      ".archive-thumb",
      ".live-feed-thumb",
      ".feed-thumb",
      ".mini-thumb",
      "[class*='thumb']",
      "[class*='photo']",
      "[class*='image']",
      "[class*='media']",
      "[class*='visual']",
      "[class*='preview']"
    ];

    return Array.from(card.querySelectorAll(selectors.join(","))).filter((element) => {
      const rect = element.getBoundingClientRect();
      const className = normalize(element.className);
      const looksLikeMedia = /(thumb|photo|image|media|visual|preview)/.test(className);
      return looksLikeMedia && rect.width >= 80 && rect.height >= 50;
    });
  };

  const applyPhotoLayer = (target, photo) => {
    target.classList.add("deploy-photo-ready");
    target.style.setProperty("--deploy-photo", `url("${photo}")`);
    target.style.setProperty("--bg-image", `url("${photo}")`);
    target.style.backgroundImage = `linear-gradient(180deg, rgba(8, 22, 38, 0.04), rgba(8, 22, 38, 0.36)), url("${photo}")`;
    target.style.backgroundSize = "cover";
    target.style.backgroundPosition = "center";

    let layer = target.querySelector(":scope > .deploy-photo-layer");
    if (!layer) {
      layer = document.createElement("span");
      layer.className = "deploy-photo-layer";
      layer.setAttribute("aria-hidden", "true");
      target.appendChild(layer);
    }

    layer.style.setProperty("--deploy-photo", `url("${photo}")`);
  };

  const stabilizeNewsPhotos = () => {
    document.body.classList.add("deploy-safe");

    document
      .querySelectorAll(".news-card, .archive-card, .live-feed-card, .feed-card")
      .forEach((card) => {
        const photo = photoFor(card);
        const targets = findMediaTargets(card);

        if (!targets.length) {
          card.style.setProperty("--deploy-photo", `url("${photo}")`);
          return;
        }

        targets.forEach((target) => applyPhotoLayer(target, photo));
      });
  };

  const schedule = () => {
    stabilizeNewsPhotos();
    window.setTimeout(stabilizeNewsPhotos, 250);
    window.setTimeout(stabilizeNewsPhotos, 900);
    window.setTimeout(stabilizeNewsPhotos, 1800);
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", schedule);
  } else {
    schedule();
  }

  window.addEventListener("load", schedule);

  const observer = new MutationObserver(() => {
    window.requestAnimationFrame(stabilizeNewsPhotos);
  });

  if (document.body) {
    observer.observe(document.body, { childList: true, subtree: true });
  }
})();
