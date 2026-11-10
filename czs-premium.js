/**
 * CZS Premium Layer — 2026-11-09
 * Efeitos dinamicos de alto nivel para o portal CZS.
 *
 * Sem dependencias externas: WebGL puro + IntersectionObserver + rAF.
 * Nada aqui bloqueia o portal: se WebGL falhar ou o usuaria pedir menos
 * movimento, a camada simplesmente nao liga.
 */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  // Cuidado: navigator.connection existe em muitos navegadores mas
  // saveData pode vir undefined. Comparar com === true evita desligar
  // a camada sem motivo.
  var saveData = Boolean(navigator.connection) && navigator.connection.saveData === true;
  if (reduceMotion || saveData) {
    document.documentElement.classList.add("czs-premium-off");
    return;
  }
  document.documentElement.classList.add("czs-premium-on");

  /* ---------------------------------------------------------------
     1. Hero 3D — shader de particulas com parallax no ponteiro
     --------------------------------------------------------------- */
  function initHeroCanvas() {
    // Efeito de luz ambiente no hero: camadas CSS animadas.
    // Sem WebGL de proposito — funciona em qualquer aparelho, inclusive
    // com GPU bloqueada, e nao disputa CPU com o carregamento da noticia.
    return; // Efeito de hero revertido em 2026-11-09: quebrava o grid.
    var hero = document.querySelector(".hero-grid");
    if (!hero || hero.querySelector(".czs-hero-aurora")) return;

    var aurora = document.createElement("div");
    aurora.className = "czs-hero-aurora";
    aurora.setAttribute("aria-hidden", "true");
    aurora.innerHTML =
      '<span class="czs-aurora-band band-a"></span>' +
      '<span class="czs-aurora-band band-b"></span>' +
      '<span class="czs-aurora-band band-c"></span>';
    hero.prepend(aurora);

    // Parallax suave da luz com o ponteiro (so transform, sem repaint).
    hero.addEventListener("pointermove", function (e) {
      var r = hero.getBoundingClientRect();
      var x = ((e.clientX - r.left) / r.width - 0.5) * 2;
      var y = ((e.clientY - r.top) / r.height - 0.5) * 2;
      aurora.style.setProperty("--mx", x.toFixed(3));
      aurora.style.setProperty("--my", y.toFixed(3));
    }, { passive: true });
  }

  /* ---------------------------------------------------------------
     2. Scroll reveal — cards entram com profundidade
     --------------------------------------------------------------- */
  function initScrollReveal() {
    if (!("IntersectionObserver" in window)) return;
    // Nao inclui .section: o hero e as secoes principais usam grid proprio
    // e o transform do reveal quebrava o layout.
    var targets = document.querySelectorAll(
      ".news-card, .v8-continuous-card, .service-card, .site-map-col"
    );
    if (!targets.length) return;

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("czs-reveal-in");
        io.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });

    Array.prototype.forEach.call(targets, function (el, i) {
      el.classList.add("czs-reveal");
      el.style.setProperty("--czs-delay", (i % 6) * 55 + "ms");
      io.observe(el);
    });
  }

  /* ---------------------------------------------------------------
     3. Barra de progresso de leitura (jornal longo)
     --------------------------------------------------------------- */
  function initReadingProgress() {
    var bar = document.createElement("div");
    bar.className = "czs-read-progress";
    bar.setAttribute("aria-hidden", "true");
    document.body.appendChild(bar);

    var ticking = false;
    function update() {
      ticking = false;
      var h = document.documentElement;
      var max = h.scrollHeight - h.clientHeight;
      var pct = max > 0 ? (h.scrollTop / max) * 100 : 0;
      bar.style.transform = "scaleX(" + (pct / 100) + ")";
    }
    window.addEventListener("scroll", function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    }, { passive: true });
    update();
  }

  /* ---------------------------------------------------------------
     4. Correcao visual: rotulos (eyebrow) ilegiveis
     --------------------------------------------------------------- */
  function fixUnreadableLabels() {
    var els = document.querySelectorAll(".eyebrow");
    Array.prototype.forEach.call(els, function (el) {
      var cs = getComputedStyle(el);
      var bg = cs.backgroundColor;
      // Branco/quase branco com texto claro = ilegivel.
      var m = /rgba?\((\d+), (\d+), (\d+)(?:, ([\d.]+))?\)/.exec(bg);
      if (!m) return;
      var lum = (0.299 * +m[1] + 0.587 * +m[2] + 0.114 * +m[3]) / 255;
      var alpha = m[4] === undefined ? 1 : parseFloat(m[4]);
      if (lum > 0.85 && alpha > 0.5) {
        el.classList.add("czs-label-fixed");
      }
    });
  }

  function boot() {
    try { fixUnreadableLabels(); } catch (e) {}
    try { initScrollReveal(); } catch (e) {}
    try { initReadingProgress(); } catch (e) {}
    // WebGL depois do primeiro paint: nunca atrasa a noticia.
    window.setTimeout(function () {
      try { initHeroCanvas(); } catch (e) {}
    }, 600);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
})();