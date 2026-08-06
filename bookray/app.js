document.documentElement.classList.add("js");

const scenes = [
  ["Magnetismo", "O olhar abre a narrativa", "portrait"],
  ["Ritmo", "Moda em movimento", "split"],
  ["Presença", "A imagem sustenta o silêncio", "wide"],
  ["Precisão", "Detalhes que comandam", "poster"],
  ["Raiz", "Origem, elegância e verdade", "wide"],
  ["Impulso", "O campo vira passarela", "cinema"],
  ["Atitude", "Firmeza em primeiro plano", "poster"],
  ["Movimento", "Forma, passo e energia", "split"],
  ["Instinto", "A força do gesto", "poster"],
  ["Desejo", "Luxo sem excesso", "portrait"],
  ["Elegância", "Linhas que alongam o tempo", "wide"],
  ["Assinatura", "Uma presença impossível de copiar", "poster"],
  ["Horizonte", "O futuro começa na origem", "cinema"],
  ["Suspense", "Entre luz, sombra e intenção", "portrait"],
  ["Calor", "Dourado, terra e coragem", "finale"],
];

// Acervo completo: 61 fotos na grade, mais abertura e perfil = 63 imagens.
const assets = [
  "assets/6ffa85aa-813c-4136-b2e8-0ff248324533.JPG.jpeg",
  "assets/IMG_0406.jpeg",
  "assets/IMG_0407.jpeg",
  "assets/IMG_0449.jpeg",
  "assets/5f9195c0-957a-44e8-ba89-f8e0291b8a32.JPG.jpeg",
  "assets/IMG_0602.jpeg",
  "assets/IMG_0605.jpeg",
  "assets/IMG_0657.jpeg",
  "assets/259b0ccb-9b2a-4b97-b0e2-fc2d09eee812.JPG.jpeg",
  "assets/bc0cea41-9f73-4f8a-a754-04290a741733.JPG.jpeg",
  "assets/1c69e6fc-05f9-4ad6-9d4f-5e595f645762.JPG.jpeg",
  "assets/21496ee4-5f41-4ea0-850e-85ffb099a475.JPG.jpeg",
  "assets/5200325f-1857-4517-8fbc-c4fcabd0ab73.JPG.jpeg",
  "assets/1999e35b-ef92-41c8-b717-9df2e47bd880.JPG.jpeg",
  "assets/6a2f159a-5513-4df7-8214-a58ea0caca22.JPG.jpeg",
  "assets/5b61d66c-39e7-4868-a193-230185470d4d.JPG.jpeg",
  "assets/IMG_0767.jpeg",
  "assets/IMG_0812.jpeg",
  "assets/IMG_0816.jpeg",
  "assets/IMG_0817.jpeg",
  "assets/IMG_0818.jpeg",
  "assets/IMG_0830.jpeg",
  "assets/IMG_0903.jpeg",
  "assets/87189062-434a-437b-aea5-2b0afaaadfe2.JPG.jpeg",
  "assets/304aa290-f2bc-43fc-b953-0b427eba0cc3.JPG.jpeg",
  "assets/3b0d5937-0611-43cc-8b7e-81dd4cb1b44f.JPG.jpeg",
  "assets/96cd42f8-7399-42a1-a6cf-26aceb41ecc2.JPG.jpeg",
  "assets/IMG_1127.jpeg",
  "assets/IMG_1128.jpeg",
  "assets/IMG_1129.jpeg",
  "assets/IMG_1130.jpeg",
  "assets/IMG_1154.jpeg",
  "assets/IMG_1200.jpeg",
  "assets/IMG_1201.jpeg",
  "assets/campanha-country-botas-douradas-close.webp",
  "assets/campanha-country-botas-rosa-estudio.webp",
  "assets/campanha-country-botas-rosa-loja.webp",
  "assets/campanha-country-raiane-blocos.webp",
  "assets/campanha-country-raiane-botas-douradas.webp",
  "assets/campanha-country-raiane-editorial-estudio.webp",
  "assets/lifestyle-country-cavalo.webp",
  "assets/parceiros-laco-de-ouro.webp",
  "assets/produto-botas-douradas-frontal.webp",
  "assets/produto-botas-douradas-perfil.webp",
  "assets/produto-botas-rosa-fazenda.webp",
  "assets/produto-botas-rosa-pegada-loja.webp",
  "assets/raiane-sensacao-01.jpg",
  "assets/raiane-sensacao-02.jpg",
  "assets/raiane-sensacao-03.jpg",
  "assets/raiane-sensacao-04.jpg",
  "assets/raiane-sensacao-05.jpg",
  "assets/raiane-sensacao-06.jpg",
  "assets/raiane-sensacao-07.jpg",
  "assets/raiane-sensacao-08.jpg",
  "assets/raiane-sensacao-09.jpg",
  "assets/raiane-sensacao-10.jpg",
  "assets/raiane-sensacao-11.jpg",
  "assets/raiane-sensacao-12.jpg",
  "assets/raiane-sensacao-13.jpg",
  "assets/raiane-sensacao-14.jpg",
  "assets/raiane-sensacao-15.jpg",
];

const total = assets.length + 2;
const portfolio = assets.map((src, index) => {
  const scene = scenes[index % scenes.length];
  return { src, title: scene[0], copy: scene[1], layout: scene[2] };
});

function renderPortfolio() {
  const root = document.querySelector(".portfolio");
  if (!root) return;
  portfolio.forEach((item, index) => {
    const number = String(index + 2).padStart(2, "0");
    const element = document.createElement("article");
    element.className = `scene ${item.layout} scene-${number} face-safe`;
    element.style.setProperty("--order", index);
    element.style.setProperty("--delay", `${(index % 3) * 90}ms`);
    element.tabIndex = 0;
    element.setAttribute("role", "button");
    element.setAttribute("aria-label", `Ampliar foto ${number}: ${item.title}`);
    element.innerHTML = `<div class="scene-media"><img loading="lazy" src="${item.src}" alt="Raiane — ${item.title}"></div><div class="caption"><span>${number}/${total}</span><div><h3>${item.title}</h3><p>${item.copy}</p></div></div>`;
    element.addEventListener("click", () => openLightbox(index));
    if (
      matchMedia("(pointer:fine) and (prefers-reduced-motion:no-preference)")
        .matches
    ) {
      element.addEventListener("pointermove", (event) => {
        const rect = element.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - 0.5;
        const y = (event.clientY - rect.top) / rect.height - 0.5;
        element.style.setProperty("--tilt-x", `${(-y * 4).toFixed(2)}deg`);
        element.style.setProperty("--tilt-y", `${(x * 5).toFixed(2)}deg`);
      });
      element.addEventListener("pointerleave", () => {
        element.style.setProperty("--tilt-x", "0deg");
        element.style.setProperty("--tilt-y", "0deg");
      });
    }
    element.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openLightbox(index);
      }
    });
    root.appendChild(element);
  });
}
renderPortfolio();

const box = document.querySelector("#lightbox");
function openLightbox(index) {
  if (!box) return;
  const item = portfolio[index];
  const image = box.querySelector("img");
  image.src = item.src;
  image.alt = `Raiane — ${item.title}`;
  box.querySelector("b").textContent = item.title;
  box.querySelector("span").textContent = item.copy;
  const show = () => box.showModal();
  document.startViewTransition ? document.startViewTransition(show) : show();
}

function initLightbox() {
  if (!box) return;
  box.querySelector("button").onclick = () => box.close();
  box.onclick = (event) => {
    if (event.target === box) box.close();
  };
}
initLightbox();

let motionFrame = 0;
function updateMotion() {
  const distance = document.documentElement.scrollHeight - innerHeight;
  const progress = document.querySelector(".progress");
  if (progress)
    progress.style.transform = `scaleX(${distance ? scrollY / distance : 0})`;
  document.documentElement.style.setProperty("--scroll-y", `${scrollY}px`);
  document.documentElement.style.setProperty(
    "--hero-shift",
    `${Math.min(scrollY * 0.18, 180).toFixed(1)}px`,
  );

  const runway = document.querySelector(".runway-break");
  if (runway) {
    const rect = runway.getBoundingClientRect();
    const runwayRange = Math.max(runway.offsetHeight - innerHeight, 1);
    const chapterProgress = Math.max(
      0,
      Math.min(1, -rect.top / runwayRange),
    );
    runway.style.setProperty("--chapter-progress", chapterProgress.toFixed(3));
    runway.style.setProperty(
      "--runway-text-a",
      `${((chapterProgress - 0.5) * 7).toFixed(2)}vw`,
    );
    runway.style.setProperty(
      "--runway-text-b",
      `${((0.5 - chapterProgress) * 7).toFixed(2)}vw`,
    );
    runway.style.setProperty(
      "--runway-one-shift",
      `${((0.5 - chapterProgress) * 120).toFixed(1)}px`,
    );
    runway.style.setProperty(
      "--runway-two-shift",
      `${((chapterProgress - 0.5) * 170).toFixed(1)}px`,
    );
    runway.style.setProperty(
      "--runway-three-shift",
      `${((0.5 - chapterProgress) * 150).toFixed(1)}px`,
    );
  }

  document.querySelectorAll(".scene.seen").forEach((scene) => {
    const rect = scene.getBoundingClientRect();
    if (rect.bottom < -100 || rect.top > innerHeight + 100) return;
    const center = rect.top + rect.height / 2;
    const normalized = (center - innerHeight / 2) / innerHeight;
    const shift = Math.max(-34, Math.min(34, normalized * -28));
    scene.style.setProperty("--scene-shift", `${shift.toFixed(1)}px`);
  });
  motionFrame = 0;
}

function queueMotionUpdate() {
  if (!motionFrame) motionFrame = requestAnimationFrame(updateMotion);
}

addEventListener("scroll", queueMotionUpdate, { passive: true });
addEventListener("resize", queueMotionUpdate, { passive: true });
queueMotionUpdate();

const revealTargets = document.querySelectorAll(
  ".scene,.manifesto,.editorial-intro,.stats,.runway-break,.profile",
);
if (typeof IntersectionObserver === "undefined") {
  revealTargets.forEach((element) => element.classList.add("seen"));
} else {
  const reveal = new IntersectionObserver(
    (entries) =>
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("seen");
          reveal.unobserve(entry.target);
        }
      }),
    { threshold: 0.12 },
  );
  revealTargets.forEach((element) => reveal.observe(element));
}

document.documentElement.classList.add("motion-ready");

const hero = document.querySelector(".hero");
if (
  hero &&
  matchMedia("(pointer:fine) and (prefers-reduced-motion:no-preference)")
    .matches
) {
  hero.addEventListener("pointermove", (event) => {
    const mx = event.clientX / innerWidth - 0.5;
    const my = event.clientY / innerHeight - 0.5;
    hero.style.setProperty("--hero-x", `${(mx * -18).toFixed(1)}px`);
    hero.style.setProperty("--hero-y", `${(my * -12).toFixed(1)}px`);
    hero.style.setProperty("--hero-rotate-x", `${(my * -3).toFixed(2)}deg`);
    hero.style.setProperty("--hero-rotate-y", `${(mx * 4).toFixed(2)}deg`);
  });
}

const pointerOrb = document.querySelector(".pointer-orb");
if (
  pointerOrb &&
  matchMedia("(pointer:fine) and (prefers-reduced-motion:no-preference)").matches
) {
  document.addEventListener(
    "pointermove",
    (event) => {
      pointerOrb.style.transform = `translate3d(${event.clientX}px, ${event.clientY}px, 0)`;
    },
    { passive: true },
  );
}

function finishIntro() {
  document.documentElement.classList.add("experience-loaded");
}
addEventListener("load", finishIntro, { once: true });
setTimeout(finishIntro, 900);
