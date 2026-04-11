(() => {
  if (window.__catalogoAgentsDockMounted) return;
  window.__catalogoAgentsDockMounted = true;

  const DOCK_ID = "catalogoAgentsDock";
  const BUBBLES = [
    "Estudando pauta local",
    "Validando fonte agora",
    "Equipe monitorando redes",
    "Repórter fechando texto",
    "Lá vem notícia nova...",
  ];

  function cleanupLegacyAgentsBlocks() {
    const selectors = [
      "#agentesNewsroomHero",
      ".agentes-newsroom-hero",
      ".catalogo-agentes-hero",
      ".agents-newsroom-hero",
    ];

    selectors.forEach((selector) => {
      document.querySelectorAll(selector).forEach((el) => {
        el.style.display = "none";
      });
    });
  }

  function createDock() {
    if (document.getElementById(DOCK_ID)) return;

    const dock = document.createElement("aside");
    dock.id = DOCK_ID;
    dock.className = "catalogo-agents-dock";
    dock.innerHTML = `
      <button class="catalogo-agents-toggle" type="button" aria-expanded="true">
        Agentes ao vivo
      </button>

      <section class="catalogo-agents-panel is-open">
        <header class="catalogo-agents-head">
          <strong>Redação em movimento</strong>
          <span>trabalhando, estudando e buscando notícia</span>
        </header>

        <div class="catalogo-agents-office">
          <div class="office-wall"></div>
          <div class="office-floor"></div>

          <div class="desk d1"><i class="pc"></i><i class="chair"></i></div>
          <div class="desk d2"><i class="pc"></i><i class="chair"></i></div>
          <div class="desk d3"><i class="pc"></i><i class="chair"></i></div>
          <div class="desk d4"><i class="pc"></i><i class="chair"></i></div>

          <div class="agent seated a1"></div>
          <div class="agent seated a2"></div>
          <div class="agent walk a3"></div>
          <div class="agent walk a4"></div>

          <div class="chat c1">Conferi no portal oficial</div>
          <div class="chat c2">Subindo atualização no radar</div>
          <div class="catalogo-agents-bubble" aria-live="polite">Estudando pauta local</div>
        </div>
      </section>
    `;

    document.body.appendChild(dock);

    const toggle = dock.querySelector(".catalogo-agents-toggle");
    const panel = dock.querySelector(".catalogo-agents-panel");
    toggle.addEventListener("click", () => {
      const opened = panel.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", opened ? "true" : "false");
    });
  }

  function randomBubbleMessage() {
    const bubble = document.querySelector(".catalogo-agents-bubble");
    if (!bubble) return;
    bubble.textContent = BUBBLES[Math.floor(Math.random() * BUBBLES.length)];
    bubble.classList.remove("is-pop");
    requestAnimationFrame(() => bubble.classList.add("is-pop"));
  }

  function showToast(title) {
    const old = document.getElementById("catalogoAgentsToast");
    if (old) old.remove();

    const toast = document.createElement("div");
    toast.id = "catalogoAgentsToast";
    toast.className = "catalogo-agents-toast";
    toast.textContent = `Notícia nova no radar: ${title}`;
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
            bubble.textContent = "Lá vem notícia nova!";
            bubble.classList.remove("is-pop");
            requestAnimationFrame(() => bubble.classList.add("is-pop"));
          }
          showToast(item.title || "Atualização no catálogo");
        }
      } catch (error) {
        // intencionalmente silencioso
      }
    }

    check();
    setInterval(check, 300000);
  }

  function boot() {
    cleanupLegacyAgentsBlocks();
    createDock();
    randomBubbleMessage();
    setInterval(randomBubbleMessage, 12000);
    startLiveCheck();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
})();

