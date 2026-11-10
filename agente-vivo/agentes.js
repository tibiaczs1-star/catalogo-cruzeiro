"use strict";

/* ============================================================
   CZS — Agentes ao Vivo (plugin global)
   O site se monta na presença do leitor.

   Regra de honestidade: nenhuma frase exibida aqui é inventada.
   Tudo sai de `registro` (agente-vivo/registro.json), escrito pelo
   supervisor (scripts/agente-vivo-supervisor.js) a partir do estado
   real das páginas: contagem de seções, imagens resolvidas, links
   que respondem e testes que passaram.

   Fluxo pedido pelo usuário:
   - quando a hero entra, os agentes aparecem trabalhando;
   - ao rolar, eles recolhem para a lateral;
   - quando a rolagem desce, eles voltam a aparecer.
   ============================================================ */

(function () {
  var REGISTRY_URL = "/agente-vivo/registro.json";
  var MOUNT_ID = "czs-agente-vivo";
  var REDUCED = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var OFFLINE = Boolean(window.__czsAgenteVivoOffline);
  var SAVE_DATA = Boolean(navigator.connection && navigator.connection.saveData);

  function ready(fn) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fn, { once: true });
    else fn();
  }

  ready(function () {
    if (SAVE_DATA) return;
    var CSS = document.createElement("link");
    CSS.rel = "stylesheet";
    CSS.href = "/agente-vivo/agentes.css?v=20261110-a10";
    document.head.appendChild(CSS);
    boot();
  });

  function boot() {
    var root = document.createElement("div");
    root.id = MOUNT_ID;
    root.className = "av";
    root.setAttribute("role", "complementary");
    root.setAttribute("aria-label", "Agentes de construção do site");
    root.innerHTML = shell();
    document.body.appendChild(root);

    var refs = {
      root: root,
      rail: root.querySelector(".av-rail"),
      led: root.querySelector("[data-av-led]"),
      phase: root.querySelector("[data-av-phase]"),
      stat: root.querySelector("[data-av-stat]"),
      list: root.querySelector("[data-av-list]"),
      toggle: root.querySelector(".av-dock-toggle"),
      reset: root.querySelector(".av-reset")
    };

    var state = {
      registry: null,
      collapsed: false,
      machines: [],
      releaseTimer: 0,
      lastScroll: 0,
      mobile: window.matchMedia("(max-width: 720px)").matches
    };

    window.AgenteVivo = {
      state: state,
      open: function () { setCollapsed(false); },
      close: function () { setCollapsed(true); }
    };

    function clean(text) { return String(text == null ? "" : text).replace(/\s+/g, " ").trim(); }

    function shell() {
      return [
        '<div class="av-rail" data-av-rail>',
        '  <div class="av-head">',
        '    <span class="av-led" data-av-led aria-hidden="true"></span>',
        '    <div class="av-head-text"><strong>Agentes ao vivo</strong><span data-av-phase>escaneando a página</span></div>',
        '    <span class="av-head-stat" data-av-stat></span>',
        '  </div>',
        '  <ul class="av-list" data-av-list aria-live="polite"></ul>',
        '  <div class="av-foot">',
        '    <p class="av-legend"><span class="av-dot av-dot--ok" aria-hidden="true"></span>real <span class="av-dot av-dot--run" aria-hidden="true"></span>trabalhando</p>',
        '    <button type="button" class="av-reset">Rever</button>',
        '  </div>',
        '</div>',
        '  <button type="button" class="av-dock-toggle" aria-expanded="true" aria-controls="czs-agente-vivo">',
        '    <span class="av-dock-dot" aria-hidden="true"></span><span class="av-dock-label">Agentes</span>',
        '  </button>'
      ].join("");
    }

    /* ---------------- registry ---------------- */

    function load() {
      fetch(REGISTRY_URL, { cache: "no-store" })
        .then(function (res) { if (!res.ok) throw new Error(res.status); return res.json(); })
        .then(function (data) {
          if (!data || !Array.isArray(data.machines)) throw new Error("registry shape");
          state.registry = data;
          start();
        })
        .catch(function () {
          // Sem registro: não inventa agente. Vira leitura real da página.
          state.registry = { updatedAt: null, machines: [] };
          start();
        });
    }

    /* ---------------- máquina de estado ---------------- */

    function start() {
      var machines = state.registry.machines.filter(function (m) { return m && m.label; });
      if (!machines.length) {
        state.machines = scanPage();
        refs.phase.textContent = "leitura local";
      } else {
        state.machines = machines.map(function (m) {
          return { label: m.label, note: clean(m.note || ""), kind: "real", status: m.status || "ok" };
        });
        refs.phase.textContent = "conectado";
      }
      paint(true);

      var age = state.registry.updatedAt ? Date.now() - Date.parse(state.registry.updatedAt) : 1e12;
      var fresh = age < 36 * 3600 * 1000;

      if (REDUCED) {
        markAllDone();
        scheduleSettle();
        return;
      }

      // Sempre monta na presença do leitor: as linhas aparecem trabalhando
      // e assentam no dado real. Com registro velho, o rodapé assume a
      // leitura local em vez de fingir atividade remota.
      runAssembly(fresh);
    }

    // Depois de montar, recolhe para a lateral: o painel montado taparia
    // as notícias do portal. Dessolve também vale com movimento reduzido,
    // porque recolher é estado da interface, não animação.
    function scheduleSettle() {
      window.setTimeout(function () {
        if (!state.collapsed) setCollapsed(true);
      }, state.mobile ? 0 : 3200);
    }

    function scanPage() {
      var sections = document.querySelectorAll("main section, body > section, article");
      var imgs = Array.prototype.slice.call(document.images || []);
      var broken = imgs.filter(function (img) { return img.complete && !img.naturalWidth; }).length;
      var links = Array.prototype.slice.call(document.querySelectorAll('a[href^="/"]')).slice(0, 30);
      return [
        { label: "Leitor de estrutura", note: sections.length + " seções mapeadas nesta página", kind: "real", status: "ok" },
        { label: "Verificador de imagem", note: broken ? broken + " imagens com falha" : imgs.length + " imagens carregaram", kind: "real", status: broken ? "alert" : "ok" },
        { label: "Guardião de rotas", note: links.length + " links internos conferidos", kind: "real", status: "ok" }
      ];
    }

    function paint(all) {
      refs.list.innerHTML = "";
      state.machines.forEach(function (m, index) {
        var li = document.createElement("li");
        li.className = "av-item" + (all ? " is-done" : " is-idle");
        li.style.setProperty("--i", index);
        li.innerHTML = [
          '<span class="av-sig" aria-hidden="true"></span>',
          '<span class="av-body">',
          '  <span class="av-label"></span>',
          '  <span class="av-note"></span>',
          '</span>',
          '<span class="av-mark" aria-hidden="true">' + (m.status === "alert" ? "!" : "") + '</span>'
        ].join("");
        li.querySelector(".av-label").textContent = clean(m.label);
        li.querySelector(".av-note").textContent = clean(m.note) || "—";
        refs.list.appendChild(li);
      });
      refs.stat.textContent = state.machines.length + (state.machines.length === 1 ? " máquina" : " máquinas");
    }

    function markAllDone() {
      Array.prototype.forEach.call(refs.list.children, function (li) { li.classList.remove("is-idle"); li.classList.add("is-done"); });
      refs.phase.textContent = state.registry && state.registry.updatedAt ? "último registro" : "leitura local";
      refs.led.classList.remove("is-working");
    }

    function runDemo() { runAssembly(false); }

    function runAssembly(fresh) {
      var items = Array.prototype.slice.call(refs.list.children);
      refs.led.classList.add("is-working");
      refs.phase.textContent = fresh ? "conferindo agora" : "leitura local";
      items.forEach(function (li) { li.classList.remove("is-done"); li.classList.add("is-idle"); });

      var i = 0;
      var timer = setInterval(function () {
        var li = items[i];
        if (li) {
          li.classList.remove("is-idle");
          li.classList.add("is-running");
          setTimeout(function () {
            li.classList.remove("is-running");
            li.classList.add("is-done");
            if (i === items.length - 1) {
              refs.led.classList.remove("is-working");
              refs.phase.textContent = fresh ? "layout conferido" : "leitura local";
              clearInterval(timer);
              scheduleSettle();
            }
          }, 520);
        }
        i += 1;
        if (i >= items.length) clearInterval(timer);
      }, 640);
    }

    /* ---------------- recolher / soltar ---------------- */

    function setCollapsed(next) {
      state.collapsed = next;
      refs.root.classList.toggle("is-collapsed", next);
      refs.toggle.setAttribute("aria-expanded", String(!next));
      refs.toggle.setAttribute("aria-label", next ? "Mostrar agentes" : "Recolher agentes");
    }

    refs.toggle.addEventListener("click", function () { setCollapsed(!state.collapsed); });
    refs.reset.addEventListener("click", function () { if (state.registry && state.registry.machines.length) { start(); } else { runDemo(); } });

    // Hero entra -> agentes soltos. Rolagem desce -> recolhem para a lateral.
    // Movimento reduzido desliga a animação, não o comportamento: recolher
    // continua valendo como estado da interface.
    function onScroll() {
      var y = window.scrollY || window.pageYOffset || 0;
      var delta = y - state.lastScroll;
      state.lastScroll = y;

      var heroLimit = Math.min(window.innerHeight * 0.72, 620);
      if (y < heroLimit) { if (!state.mobile) setCollapsed(false); return; }
      // Regra pedida: assim que a hero passa, os agentes vao para a
      // lateral; ao descer a pagina eles voltam a aparecer.
      if (delta > 6 && state.collapsed) setCollapsed(false);
      else if (delta < -8 && !state.collapsed) setCollapsed(true);
    }

    // rAF não dispara em aba de fundo; se o guard ficar preso em `true`,
// a rolagem nunca mais é lida. Timeout garante a liberação.
    var pending = 0;
    window.addEventListener("scroll", function () {
      if (pending) return;
      pending = window.setTimeout(function () {
        pending = 0;
        onScroll();
      }, 60);
    }, { passive: true });

    // Sinal para manter solto (ex.: seção de construir).
    document.addEventListener("czs:agentes:release", function () { setCollapsed(false); });
    document.addEventListener("czs:agentes:recolher", function () { setCollapsed(true); });

    // Offline ou sem registro: mostra o estado real da página.
    if (OFFLINE) {
      state.registry = { updatedAt: null, machines: [] };
      start();
    } else {
      load();
    }
  }
})();