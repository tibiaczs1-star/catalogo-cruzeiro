(() => {
  if (window.__catalogoAgentsDockMounted) return;
  window.__catalogoAgentsDockMounted = true;

  const DOCK_ID = "catalogoAgentsDock";
  const FOOTER_DOCK_QUERY = "(max-width: 720px)";
  const DETAIL_BODY_CLASS = "detail-body";
  const BUBBLES = [
    "Recebendo documentos do dia",
    "Equipe subindo atualizacao no radar",
    "Cafe passado e texto revisado",
    "Monitorando grupos e redes locais",
    "Checando portal oficial agora",
    "Apurando o Vale do Jurua em tempo real",
  ];

  const STATUS_GROUPS = [
    ["Portal oficial ok", "Equipe nas redes", "Cafe e docs na mesa"],
    ["Assunto do Jurua", "Fonte confirmada", "Texto entrando no ar"],
    ["Documento recebido", "Monitor ligado", "Radar quase pronto"],
    ["Checagem em curso", "Headline em ajuste", "Equipe no escritorio"],
  ];

  function isDetailPage() {
    return document.body?.classList.contains(DETAIL_BODY_CLASS) || false;
  }

  function isHomePage() {
    return document.body?.classList.contains("editorial-home") || false;
  }

  function cleanupLegacyAgentsBlocks() {
    const selectors = [
      "#agentesNewsroomHero",
      ".agentes-newsroom-hero",
      ".catalogo-agentes-hero",
      ".agents-newsroom-hero",
    ];

    selectors.forEach((selector) => {
      document.querySelectorAll(selector).forEach((element) => {
        element.style.display = "none";
      });
    });
  }

  function shouldUseFooterDock() {
    return isDetailPage() || window.matchMedia(FOOTER_DOCK_QUERY).matches;
  }

  function shouldMountDock() {
    if (isHomePage()) {
      return false;
    }

    return isDetailPage() || window.matchMedia(FOOTER_DOCK_QUERY).matches;
  }

  function getDockTarget() {
    if (shouldUseFooterDock()) {
      return document.querySelector("#footer-live-office") || document.querySelector(".site-footer");
    }

    return document.body;
  }

  function syncDockPlacement(dock) {
    if (!dock) return;

    const target = getDockTarget();
    if (!target) return;

    const panel = dock.querySelector(".catalogo-agents-panel");
    const toggle = dock.querySelector(".catalogo-agents-toggle");
    const minimize = dock.querySelector(".catalogo-agents-min");
    const useFooterDock = shouldUseFooterDock();
    const onDetailPage = isDetailPage();

    dock.classList.toggle("is-footer-dock", useFooterDock);
    dock.classList.toggle("is-detail-dock", onDetailPage);

    if (onDetailPage) {
      const heading = dock.querySelector(".catalogo-agents-head strong");
      const description = dock.querySelector(".catalogo-agents-head span");
      if (heading) {
        heading.textContent = "3 pixels cuidando do radar";
      }
      if (description) {
        description.textContent =
          "Padrao das materias: apuracao, revisao e fechamento visual no rodape.";
      }
    }

    if (useFooterDock && panel) {
      panel.classList.add("is-open");
      panel.classList.remove("is-minimized");
      toggle?.setAttribute("aria-expanded", "true");
      minimize?.setAttribute("aria-pressed", "false");
      if (minimize) {
        minimize.textContent = "Minimizar escritorio";
      }
    }

    if (dock.parentElement !== target) {
      target.appendChild(dock);
    }
  }

  function createDock() {
    if (document.getElementById(DOCK_ID)) return;

    const dock = document.createElement("aside");
    dock.id = DOCK_ID;
    dock.className = "catalogo-agents-dock";
    dock.innerHTML = `
      <button class="catalogo-agents-toggle" type="button" aria-expanded="true">
        Agentes pixel ao vivo
      </button>

      <section class="catalogo-agents-panel is-open">
        <header class="catalogo-agents-head">
          <div class="catalogo-agents-copy">
            <small>Agentes ao vivo</small>
            <strong>Escritorio pixel do Vale</strong>
            <span>digitando, levando documentos, tomando cafe e atualizando o radar</span>
          </div>
          <button class="catalogo-agents-min" type="button" aria-pressed="false">
            Minimizar escritorio
          </button>
        </header>

        <div class="catalogo-agents-office">
          <div class="catalogo-agents-hud">
            <span class="status-chip" data-status-slot="0">Portal oficial ok</span>
            <span class="status-chip" data-status-slot="1">Equipe nas redes</span>
            <span class="status-chip" data-status-slot="2">Cafe e docs na mesa</span>
          </div>

          <div class="catalogo-agents-scene">
            <div class="window-row">
              <i class="pixel-window w1"></i>
              <i class="pixel-window w2"></i>
            </div>

            <div class="scene-board">
              <strong>Sala ativa</strong>
              <span>Alertas, cafe e monitoramento local</span>
            </div>

            <div class="scene-floor-line"></div>

            <div class="coffee-station"></div>
            <i class="coffee-steam steam-a"></i>
            <i class="coffee-steam steam-b"></i>

            <div class="filing-cabinet">
              <i class="drawer d1"></i>
              <i class="drawer d2"></i>
              <i class="drawer d3"></i>
            </div>

            <div class="pixel-desk desk-a">
              <i class="desk-screen"></i>
              <i class="desk-keyboard"></i>
              <i class="desk-docs"></i>
              <i class="desk-mug"></i>
            </div>

            <div class="pixel-desk desk-b">
              <i class="desk-screen"></i>
              <i class="desk-keyboard"></i>
              <i class="desk-docs"></i>
              <i class="desk-tray"></i>
            </div>

            <div class="pixel-desk desk-c">
              <i class="desk-screen"></i>
              <i class="desk-keyboard"></i>
              <i class="desk-docs"></i>
              <i class="desk-mug"></i>
            </div>

            <div class="pixel-agent agent-a">
              <i class="agent-shadow"></i>
              <i class="hair"></i>
              <i class="head"></i>
              <i class="body"></i>
              <i class="arm arm-left"></i>
              <i class="arm arm-right"></i>
              <i class="leg leg-left"></i>
              <i class="leg leg-right"></i>
            </div>

            <div class="pixel-agent agent-b">
              <i class="agent-shadow"></i>
              <i class="hair"></i>
              <i class="head"></i>
              <i class="body"></i>
              <i class="arm arm-left"></i>
              <i class="arm arm-right"></i>
              <i class="leg leg-left"></i>
              <i class="leg leg-right"></i>
            </div>

            <div class="pixel-agent agent-c">
              <i class="agent-shadow"></i>
              <i class="hair"></i>
              <i class="head"></i>
              <i class="body"></i>
              <i class="arm arm-left"></i>
              <i class="arm arm-right"></i>
              <i class="leg leg-left"></i>
              <i class="leg leg-right"></i>
              <i class="prop"></i>
            </div>

            <div class="pixel-agent agent-d">
              <i class="agent-shadow"></i>
              <i class="hair"></i>
              <i class="head"></i>
              <i class="body"></i>
              <i class="arm arm-left"></i>
              <i class="arm arm-right"></i>
              <i class="leg leg-left"></i>
              <i class="leg leg-right"></i>
              <i class="cup"></i>
            </div>

            <div class="pixel-agent agent-e">
              <i class="agent-shadow"></i>
              <i class="hair"></i>
              <i class="head"></i>
              <i class="body"></i>
              <i class="arm arm-left"></i>
              <i class="arm arm-right"></i>
              <i class="leg leg-left"></i>
              <i class="leg leg-right"></i>
              <i class="prop"></i>
            </div>

            <i class="floating-doc doc-a"></i>
            <i class="floating-doc doc-b"></i>

            <div class="catalogo-agents-bubble" aria-live="polite">
              Recebendo documentos do dia
            </div>
          </div>
        </div>
      </section>
    `;

    document.body.appendChild(dock);

    const toggle = dock.querySelector(".catalogo-agents-toggle");
    const panel = dock.querySelector(".catalogo-agents-panel");
    const minimize = dock.querySelector(".catalogo-agents-min");

    toggle.addEventListener("click", () => {
      if (dock.classList.contains("is-footer-dock")) return;
      const opened = panel.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", opened ? "true" : "false");
    });

    minimize.addEventListener("click", () => {
      if (dock.classList.contains("is-footer-dock")) return;
      const minimized = panel.classList.toggle("is-minimized");
      minimize.setAttribute("aria-pressed", minimized ? "true" : "false");
      minimize.textContent = minimized ? "Mostrar escritorio" : "Minimizar escritorio";
    });

    syncDockPlacement(dock);

    const media = window.matchMedia(FOOTER_DOCK_QUERY);
    const handlePlacementChange = () => syncDockPlacement(dock);
    if (typeof media.addEventListener === "function") {
      media.addEventListener("change", handlePlacementChange);
    } else if (typeof media.addListener === "function") {
      media.addListener(handlePlacementChange);
    }
  }

  function randomFrom(list) {
    return list[Math.floor(Math.random() * list.length)];
  }

  function updateBubble() {
    const bubble = document.querySelector(".catalogo-agents-bubble");
    if (!bubble) return;

    bubble.textContent = randomFrom(BUBBLES);
    bubble.classList.remove("is-pop");
    requestAnimationFrame(() => bubble.classList.add("is-pop"));
  }

  function updateHud() {
    const chips = Array.from(document.querySelectorAll("[data-status-slot]"));
    const group = randomFrom(STATUS_GROUPS);
    chips.forEach((chip, index) => {
      chip.textContent = group[index] || "";
    });
  }

  function showToast(title) {
    if (shouldUseFooterDock()) return;

    const oldToast = document.getElementById("catalogoAgentsToast");
    if (oldToast) oldToast.remove();

    const toast = document.createElement("div");
    toast.id = "catalogoAgentsToast";
    toast.className = "catalogo-agents-toast";
    toast.textContent = `Noticia nova no radar: ${title}`;
    document.body.appendChild(toast);

    requestAnimationFrame(() => toast.classList.add("show"));
    setTimeout(() => {
      toast.classList.remove("show");
      setTimeout(() => toast.remove(), 260);
    }, 4200);
  }

  async function startLiveCheck() {
    let lastKey = "";

    async function check() {
      try {
        const response = await fetch("/api/news/aggregator?limit=1", { cache: "no-store" });
        if (!response.ok) return;

        const data = await response.json();
        const item = Array.isArray(data?.items) ? data.items[0] : null;
        if (!item) return;

        const key = item.id || item.url || item.title || "";
        if (!key) return;

        if (!lastKey) {
          lastKey = key;
          return;
        }

        if (key !== lastKey) {
          lastKey = key;
          const bubble = document.querySelector(".catalogo-agents-bubble");
          if (bubble) {
            bubble.textContent = "Atualizacao nova chegando no escritorio";
            bubble.classList.remove("is-pop");
            requestAnimationFrame(() => bubble.classList.add("is-pop"));
          }
          updateHud();
          showToast(item.title || "Atualizacao no catalogo");
        }
      } catch (error) {
        // silencioso por design
      }
    }

    check();
    setInterval(check, 300000);
  }

  function boot() {
    cleanupLegacyAgentsBlocks();
    if (!shouldMountDock()) return;
    createDock();
    updateBubble();
    updateHud();
    setInterval(updateBubble, 9000);
    setInterval(updateHud, 12000);
    startLiveCheck();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
})();
