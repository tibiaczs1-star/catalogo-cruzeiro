"use strict";

/* ============================================================
   CZS — Camada Surreal Editorial
   Liga a classe `cz-surreal` no <html>, insere o grão de impressão e
   as marcas de registro. Não altera texto, não esconde conteúdo e não
   depende de rede: tudo é CSS local.

   Desliga sozinho em:
   - prefers-reduced-motion (movimento do grão);
   - saveData do navegador (economia de bateria/dados);
   - impressão.
   ============================================================ */

(function () {
  var root = document.documentElement;
  if (!root) return;

  var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  var saveData = Boolean(conn) && conn.saveData === true;

  // O grão é a única peça com animação. Em economia de dados ele sai;
  // a tipografia editorial continua, porque não custa nada.
  root.classList.add("cz-surreal");
  if (reduced || saveData) root.classList.add("cz-surreal-quiet");

  function addGrain() {
    if (saveData) return;
    if (document.querySelector(".cz-surreal-grain")) return;
    var grain = document.createElement("div");
    grain.className = "cz-surreal-grain";
    grain.setAttribute("aria-hidden", "true");
    grain.setAttribute("role", "presentation");
    // Grão estático não é movimento: com movimento reduzido ele fica,
    // só para de deslizar (o CSS desliga a animação).
    document.body.appendChild(grain);
  }

  // Marcas de registro só na capa: são a assinatura da prancha.
  function addPlateMarks() {
    var hero = document.querySelector(".hero-grid");
    if (!hero || hero.querySelector(".czs-plate-mark")) return;
    var mark = document.createElement("div");
    mark.className = "czs-plate-mark";
    mark.setAttribute("aria-hidden", "true");
    hero.appendChild(mark);
  }

  function boot() {
    try { addGrain(); } catch (_e) {}
    try { addPlateMarks(); } catch (_e) {}
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
})();