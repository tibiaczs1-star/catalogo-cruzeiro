const campaign = [
  { file: "campanha-country-raiane-botas-douradas.webp", width: 1086, height: 1448, title: "Western Contemporâneo", meta: "Editorial de estúdio", className: "portrait lead" },
  { file: "campanha-country-raiane-blocos.webp", width: 1122, height: 1402, title: "Geometria & Couro", meta: "Editorial country · 2026", className: "portrait tall" },
  { file: "campanha-country-botas-douradas-close.webp", width: 1086, height: 1448, title: "Textura", meta: "Detalhe editorial", className: "portrait" }
];

const products = [
  { file: "produto-botas-rosa-fazenda.webp", width: 1122, height: 1402, title: "Bota Rosa", meta: "Campanha rural", className: "wide" },
  { file: "produto-botas-douradas-frontal.webp", width: 1086, height: 1448, title: "Bota Dourada", meta: "Vista frontal" },
  { file: "produto-botas-douradas-perfil.webp", width: 1086, height: 1448, title: "Bota Dourada", meta: "Perfil editorial" },
  { file: "campanha-country-botas-rosa-estudio.webp", width: 1086, height: 1448, title: "Bota Rosa", meta: "Still de estúdio" }
];

const partners = [
  { file: "lifestyle-country-cavalo.webp", width: 1122, height: 1402, title: "Lifestyle Country", meta: "Narrativa de território", className: "partner-main" }
];

const legacy = [
  { file: "IMG_0406.jpeg", width: 1920, height: 2560, title: "Passarela", meta: "Seleção de arquivo" },
  { file: "IMG_0657.jpeg", width: 1920, height: 2560, title: "Editorial", meta: "Seleção de arquivo" },
  { file: "IMG_0903.jpeg", width: 1920, height: 2560, title: "Moda", meta: "Seleção de arquivo" },
  { file: "IMG_1200.jpeg", width: 1920, height: 2560, title: "Presença", meta: "Seleção de arquivo" }
];

const lightboxItems = [];
const lightbox = document.querySelector("#lightbox");
const lightboxImage = lightbox.querySelector("img");
const lightboxTitle = lightbox.querySelector("figcaption span");
const lightboxMeta = lightbox.querySelector("figcaption small");
let activeIndex = 0;

function responsivePicture(item) {
  const path = `assets/${item.file}`;
  const isResponsiveWebp = item.file.endsWith(".webp");
  const stem = isResponsiveWebp ? item.file.slice(0, -5) : item.file;
  const small = isResponsiveWebp ? `assets/${stem}-720.webp` : path;
  return `
    <picture>
      ${small !== path ? `<source srcset="${small} 720w, ${path} ${item.width}w" sizes="(max-width: 760px) 92vw, 45vw">` : ""}
      <img src="${path}" width="${item.width}" height="${item.height}" alt="${item.title} — ${item.meta}" loading="lazy" decoding="async">
    </picture>`;
}

function card(item, index, group) {
  const globalIndex = lightboxItems.push(item) - 1;
  return `
    <button class="photo-card ${item.className || ""} reveal" type="button" data-lightbox-index="${globalIndex}" aria-label="Ampliar: ${item.title}">
      ${responsivePicture(item)}
      <span class="photo-overlay"><strong>${item.title}</strong><small>${item.meta}</small><i>↗</i></span>
      <span class="photo-number">${String(index + 1).padStart(2, "0")} / ${String(group.length).padStart(2, "0")}</span>
    </button>`;
}

function renderCollection(selector, items) {
  document.querySelector(selector).innerHTML = items.map((item, index) => card(item, index, items)).join("");
}

renderCollection("#campaign-grid", campaign);
renderCollection("#product-grid", products);
renderCollection("#partner-grid", partners);
renderCollection("#legacy-grid", legacy);

function openLightbox(index) {
  activeIndex = index;
  const item = lightboxItems[activeIndex];
  const path = `assets/${item.file}`;
  lightboxImage.src = path;
  lightboxImage.alt = `${item.title} — ${item.meta}`;
  lightboxTitle.textContent = item.title;
  lightboxMeta.textContent = `${item.meta} · ${activeIndex + 1}/${lightboxItems.length}`;
  if (!lightbox.open) lightbox.showModal();
}

function moveLightbox(delta) {
  activeIndex = (activeIndex + delta + lightboxItems.length) % lightboxItems.length;
  openLightbox(activeIndex);
}

document.addEventListener("click", (event) => {
  const trigger = event.target.closest("[data-lightbox-index]");
  if (trigger) openLightbox(Number(trigger.dataset.lightboxIndex));
});

lightbox.querySelector(".lightbox-close").addEventListener("click", () => lightbox.close());
lightbox.querySelector(".previous").addEventListener("click", () => moveLightbox(-1));
lightbox.querySelector(".next").addEventListener("click", () => moveLightbox(1));
lightbox.addEventListener("click", (event) => {
  if (event.target === lightbox) lightbox.close();
});
document.addEventListener("keydown", (event) => {
  if (!lightbox.open) return;
  if (event.key === "ArrowLeft") moveLightbox(-1);
  if (event.key === "ArrowRight") moveLightbox(1);
});

const progress = document.querySelector(".progress span");
function updateScrollEffects() {
  const scrollable = document.documentElement.scrollHeight - innerHeight;
  progress.style.transform = `scaleX(${scrollable ? scrollY / scrollable : 0})`;
  document.documentElement.style.setProperty("--scroll", scrollY);
}
addEventListener("scroll", updateScrollEffects, { passive: true });
updateScrollEffects();

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("visible");
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });
document.querySelectorAll(".reveal").forEach((element) => observer.observe(element));

const hero = document.querySelector(".hero");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const precisePointer = window.matchMedia("(pointer: fine)").matches;

if (hero && !reducedMotion && precisePointer) {
  hero.addEventListener("pointermove", (event) => {
    const rect = hero.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;

    hero.querySelectorAll("[data-depth]").forEach((layer) => {
      const depth = Number(layer.dataset.depth || 0);
      layer.style.translate = `${x * depth}px ${y * depth}px`;
    });
  });

  hero.addEventListener("pointerleave", () => {
    hero.querySelectorAll("[data-depth]").forEach((layer) => {
      layer.style.translate = "";
    });
  });
}

document.querySelector("#year").textContent = new Date().getFullYear();
