"use strict";

(function () {
  const LAST_NEWS_KEY = "catalogo_last_news_update";
  const OFFICE_TASKS = [
    {
      key: "texto",
      label: "TXT",
      caption: "Texto",
      lines: ["Lead", "Titulo", "Resumo"]
    },
    {
      key: "imagem",
      label: "IMG",
      caption: "Imagem",
      lines: ["Crop", "Luz", "Cor"]
    },
    {
      key: "html",
      label: "HTML",
      caption: "HTML",
      lines: ["<div>", "grid", "</>"]
    }
  ];

  function apiBase() {
    if (typeof window.CATALOGO_API_BASE === "string" && window.CATALOGO_API_BASE) {
      return window.CATALOGO_API_BASE.replace(/\/$/, "");
    }
    if (location.protocol === "file:") return "http://localhost:8787";
    return location.origin;
  }

  const API = apiBase();

  function createOfficeWidget() {
    const root = document.createElement("aside");
    root.className = "agente-escritorio";
    root.setAttribute("aria-hidden", "true");
    root.innerHTML = `
      <div class="agente-escritorio-head">
        <strong>Central de Agentes</strong>
        <span>Monitorando noticias</span>
      </div>
      <div class="agente-escritorio-subhead">
        <span>texto</span>
        <span>imagem</span>
        <span>html</span>
      </div>
      <div class="agente-escritorio-body">
        ${OFFICE_TASKS.map(
          (task) => `
            <div class="agente-estacao agente-estacao--${task.key}">
              <div class="agente-monitor">
                <div class="agente-monitor-screen">
                  <span class="agente-monitor-tag">${task.label}</span>
                  <div class="agente-monitor-lines">
                    ${task.lines.map((line) => `<span>${line}</span>`).join("")}
                  </div>
                </div>
                <div class="agente-monitor-base"></div>
              </div>
              <div class="agente-mesa">
                <div class="agente-teclado"></div>
                <div class="agente-mouse"></div>
              </div>
              <div class="agente-trabalhador">
                <div class="agente-cabeca"></div>
                <div class="agente-cabelo"></div>
                <div class="agente-braco agente-braco-esq"></div>
                <div class="agente-braco agente-braco-dir"></div>
                <div class="agente-tronco"></div>
                <div class="agente-perna agente-perna-esq"></div>
                <div class="agente-perna agente-perna-dir"></div>
              </div>
              <div class="agente-status">${task.caption}</div>
            </div>
          `
        ).join("")}
      </div>
    `;

    const runner = document.createElement("div");
    runner.className = "agente-runner";

    const alert = document.createElement("div");
    alert.className = "agente-alerta";
    alert.textContent = "Notícia nova na área!!!!";

    document.body.append(root, runner, alert);
    return { root, runner, alert };
  }

  function findMenuTarget() {
    return (
      document.querySelector(
        ".top-strip, header, .site-header, .main-header, nav, .menu-local"
      ) || document.body
    );
  }

  function showAlert(alert, x, y, text) {
    alert.textContent = text;
    alert.style.left = `${Math.max(8, x - 40)}px`;
    alert.style.top = `${Math.max(8, y - 44)}px`;
    alert.classList.add("is-show");
    setTimeout(() => alert.classList.remove("is-show"), 2200);
  }

  async function animateRunner(bundle) {
    const { root, runner, alert } = bundle;
    const target = findMenuTarget();
    const rootRect = root.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();

    const startX = rootRect.left + 34;
    const startY = rootRect.top + 18;
    const endX = Math.max(10, targetRect.left + targetRect.width - 120);
    const endY = Math.max(8, targetRect.top + 16);

    runner.style.left = `${startX}px`;
    runner.style.top = `${startY}px`;
    runner.style.opacity = "1";

    await runner
      .animate(
        [
          { transform: "translate(0px, 0px) scale(1) rotate(0deg)" },
          {
            transform: `translate(${endX - startX}px, ${endY - startY}px) scale(1.08) rotate(-8deg)`
          }
        ],
        {
          duration: 1300,
          easing: "cubic-bezier(.2,.8,.2,1)",
          fill: "forwards"
        }
      )
      .finished;

    showAlert(alert, endX, endY, "Notícia nova na área!!!!");

    await runner
      .animate(
        [
          {
            transform: `translate(${endX - startX}px, ${endY - startY}px) scale(1.08) rotate(-8deg)`
          },
          { transform: "translate(0px, 0px) scale(1) rotate(0deg)" }
        ],
        {
          duration: 1450,
          easing: "cubic-bezier(.2,.8,.2,1)",
          fill: "forwards"
        }
      )
      .finished;

    runner.style.opacity = "0";
  }

  async function checkNews(bundle, isFirst = false) {
    try {
      const response = await fetch(`${API}/api/news/aggregator?limit=1`);
      if (!response.ok) return;
      const data = await response.json();
      const current = String(data?.updatedAt || "");
      if (!current) return;

      const previous = localStorage.getItem(LAST_NEWS_KEY) || "";
      if (!previous) {
        localStorage.setItem(LAST_NEWS_KEY, current);
        return;
      }

      if (current !== previous && !isFirst) {
        localStorage.setItem(LAST_NEWS_KEY, current);
        animateRunner(bundle);
        return;
      }

      localStorage.setItem(LAST_NEWS_KEY, current);
    } catch {
      // sem backend ou sem rede: ignora
    }
  }

  function init() {
    const bundle = createOfficeWidget();
    checkNews(bundle, true);
    setInterval(() => checkNews(bundle, false), 120000);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
