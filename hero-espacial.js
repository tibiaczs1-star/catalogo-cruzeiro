"use strict";

(function () {
  function findAnchor() {
    const headings = Array.from(document.querySelectorAll("h1, h2, h3"));
    const radar = headings.find((el) => /radar czs|agregador local/i.test(el.textContent || ""));
    if (radar) {
      return radar.closest("section, article, .panel, .block, main") || null;
    }

    const main = document.querySelector("main");
    if (!main) return null;
    const firstSection = main.querySelector("section, article, .panel, .block");
    return firstSection || main;
  }

  function createHero() {
    const root = document.createElement("section");
    root.className = "hero-espacial-czs";
    root.id = "heroEspacialCZS";
    root.innerHTML = `
      <div class="hero-espacial-bg"></div>
      <div class="hero-espacial-overlay"></div>
      <span class="hero-espacial-orb orb-1"></span>
      <span class="hero-espacial-orb orb-2"></span>
      <span class="hero-espacial-orb orb-3"></span>

      <div class="hero-espacial-content">
        <p class="hero-espacial-kicker">Especial • Cruzeiro do Sul</p>
        <h2 class="hero-espacial-title">Onde a notícia encontra a cidade em tempo real</h2>
        <p class="hero-espacial-sub">
          Um painel vivo com informação local, serviços, agenda, clima, política e utilidade
          pública em uma leitura moderna, clara e dinâmica.
        </p>
        <div class="hero-espacial-actions">
          <a class="hero-espacial-btn primary" href="#radar">Abrir Radar CZS</a>
          <a class="hero-espacial-btn ghost" href="catalogo-servicos.html">Abrir catálogo de serviços</a>
        </div>
      </div>

      <div class="hero-espacial-chip">
        Atualização local <strong>ao vivo</strong> • foco em Cruzeiro do Sul
      </div>
    `;
    return root;
  }

  function enable3dMotion(hero) {
    if (!hero) return;
    const bg = hero.querySelector(".hero-espacial-bg");
    const content = hero.querySelector(".hero-espacial-content");
    const chip = hero.querySelector(".hero-espacial-chip");
    const orbs = Array.from(hero.querySelectorAll(".hero-espacial-orb"));

    let raf = 0;
    let tx = 0;
    let ty = 0;

    const render = () => {
      raf = 0;
      hero.style.transform = `perspective(1300px) rotateX(${ty * 2.1}deg) rotateY(${tx * -2.4}deg)`;
      if (bg) bg.style.transform = `translate3d(${tx * 10}px, ${ty * 8}px, 0) scale(1.04)`;
      if (content) content.style.transform = `translate3d(${tx * -8}px, ${ty * -8}px, 52px)`;
      if (chip) chip.style.transform = `translate3d(${tx * -14}px, ${ty * -10}px, 75px)`;
      orbs.forEach((orb, idx) => {
        const m = 5 + idx * 4;
        orb.style.transform = `translate3d(${tx * m}px, ${ty * m}px, 0)`;
      });
    };

    hero.addEventListener("mousemove", (event) => {
      const rect = hero.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width;
      const y = (event.clientY - rect.top) / rect.height;
      tx = (x - 0.5) * 2;
      ty = (y - 0.5) * 2;
      if (!raf) raf = requestAnimationFrame(render);
    });

    hero.addEventListener("mouseleave", () => {
      tx = 0;
      ty = 0;
      if (!raf) raf = requestAnimationFrame(render);
    });
  }

  function init() {
    if (document.getElementById("heroEspacialCZS")) return;
    const anchor = findAnchor();
    if (!anchor) return;
    const hero = createHero();
    anchor.insertAdjacentElement("beforebegin", hero);
    enable3dMotion(hero);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
