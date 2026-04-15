"use strict";

(function () {
  function findAnchor() {
    const headings = Array.from(document.querySelectorAll("h1, h2, h3"));
    const radar = headings.find((el) =>
      /radar czs|agregador local/i.test(String(el.textContent || ""))
    );
    if (radar) return radar.closest("section, article, .panel, .block, main") || null;

    return document.querySelector("main > section, main > article, main") || null;
  }

  function createHero() {
    const hero = document.createElement("section");
    hero.id = "cruzeiro3DHero";
    hero.className = "crz3d-hero";
    hero.innerHTML = `
      <div class="crz3d-bg"></div>
      <div class="crz3d-overlay"></div>
      <span class="crz3d-glow g1"></span>
      <span class="crz3d-glow g2"></span>
      <span class="crz3d-glow g3"></span>

      <div class="crz3d-content">
        <p class="crz3d-kicker">Cruzeiro do Sul • especial</p>
        <h2 class="crz3d-title">Portal vivo da cidade, com informação local em camadas</h2>
        <p class="crz3d-sub">
          Um painel dinâmico com notícias, agenda, serviços, comunidade e utilidade pública,
          pensado para leitura rápida e acompanhamento em tempo real.
        </p>
        <div class="crz3d-actions">
          <a href="#radar" class="crz3d-btn primary">Ir para os assuntos</a>
          <a href="catalogo-servicos.html" class="crz3d-btn ghost">Abrir catálogo de serviços</a>
        </div>
      </div>

      <div class="crz3d-chip">Atualização local <strong>em destaque</strong></div>
    `;
    return hero;
  }

  function animate3D(hero) {
    const bg = hero.querySelector(".crz3d-bg");
    const content = hero.querySelector(".crz3d-content");
    const chip = hero.querySelector(".crz3d-chip");
    const glows = Array.from(hero.querySelectorAll(".crz3d-glow"));
    let raf = 0;
    let tx = 0;
    let ty = 0;

    const render = () => {
      raf = 0;
      hero.style.transform = `perspective(1300px) rotateX(${ty * 2.2}deg) rotateY(${tx * -2.4}deg)`;
      if (bg) bg.style.transform = `translate3d(${tx * 14}px, ${ty * 10}px, 0) scale(1.05)`;
      if (content) content.style.transform = `translate3d(${tx * -10}px, ${ty * -10}px, 60px)`;
      if (chip) chip.style.transform = `translate3d(${tx * -16}px, ${ty * -12}px, 80px)`;
      glows.forEach((g, i) => {
        const n = 6 + i * 5;
        g.style.transform = `translate3d(${tx * n}px, ${ty * n}px, 0)`;
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
    if (document.getElementById("cruzeiro3DHero")) return;
    const anchor = findAnchor();
    if (!anchor) return;
    const hero = createHero();
    anchor.insertAdjacentElement("beforebegin", hero);
    animate3D(hero);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
