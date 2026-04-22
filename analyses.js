const state = {
  filter: "all",
  report: null
};

const REASON_LABELS = {
  "missing-image-url": "Sem imagem",
  "image-unreachable": "Imagem fora do ar",
  "image-content-type-not-confirmed": "Tipo de imagem nao confirmado",
  "people-or-group-scene-without-manual-focus": "Pessoa ou grupo sem foco manual",
  "group-scene-without-manual-focus": "Grupo sem foco manual",
  "manual-focus-present": "Ja tem foco manual",
  "hero-focus-too-high-for-wide-headline": "Foco alto demais para manchete larga"
};

function formatDate(dateLike) {
  if (!dateLike) return "--";
  const parsed = new Date(dateLike);
  if (Number.isNaN(parsed.getTime())) return "--";
  return parsed.toLocaleString("pt-BR", { timeZone: "America/Rio_Branco" });
}

function getFilteredItems() {
  const queue = Array.isArray(state.report?.reviewQueue) ? state.report.reviewQueue : [];
  if (state.filter === "all") return queue;
  return queue.filter((item) => item.level === state.filter);
}

function renderSummary() {
  const summary = state.report?.summary || {};
  const queue = Array.isArray(state.report?.reviewQueue) ? state.report.reviewQueue : [];
  const metrics = [
    ["Itens em analise", queue.length],
    ["Errors", summary.error || 0],
    ["Review", summary.review || 0],
    ["Sem imagem", summary.missingImage || 0],
    ["Com foco manual", summary.manualFocus || 0],
    ["Noticias checadas", state.report?.total || 0]
  ];

  document.getElementById("analysis-stat-open").textContent = String(queue.length);
  document.getElementById("analysis-stat-error").textContent = String(summary.error || 0);
  document.getElementById("analysis-stat-updated").textContent = formatDate(state.report?.updatedAt);

  document.getElementById("analysis-metrics").innerHTML = metrics
    .map(
      ([label, value]) => `
        <div class="analysis-metric">
          <span class="analysis-metric-label">${label}</span>
          <strong>${value}</strong>
        </div>
      `
    )
    .join("");
}

function buildMedia(item) {
  if (!item.imageUrl) {
    return `<div class="analysis-card-media"><div class="analysis-card-media-fallback">Sem imagem para revisar</div></div>`;
  }
  return `
    <div class="analysis-card-media">
      <img src="${item.imageUrl}" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer" />
    </div>
  `;
}

function renderQueue() {
  const items = getFilteredItems();
  const empty = document.getElementById("analysis-empty");
  const grid = document.getElementById("analysis-card-grid");
  const count = document.getElementById("analysis-queue-count");

  count.textContent = `${items.length} item${items.length === 1 ? "" : "s"}`;
  empty.hidden = items.length > 0;

  grid.innerHTML = items
    .map((item) => {
      const reasons = Array.isArray(item.reasons) ? item.reasons : [];
      const focusText = item.effectiveFocus ? item.effectiveFocus : "Sem foco manual";
      const imageLink = item.imageUrl
        ? `<a href="${item.imageUrl}" target="_blank" rel="noreferrer">Open image</a>`
        : "";
      const articleLink = item.articleUrl
        ? `<a href="${item.articleUrl}" target="_blank" rel="noreferrer">Open article</a>`
        : "";

      return `
        <article class="analysis-card">
          ${buildMedia(item)}
          <div class="analysis-card-header">
            <h3>${item.title || "Sem titulo"}</h3>
            <span class="analysis-level analysis-level-${item.level}">${item.level}</span>
          </div>
          <div class="analysis-reasons">
            ${reasons.map((reason) => `<span class="analysis-reason">${REASON_LABELS[reason] || reason}</span>`).join("")}
          </div>
          <div class="analysis-card-meta">
            <span><strong>Slug:</strong> ${item.slug || "--"}</span>
            <span><strong>Foco atual:</strong> ${focusText}</span>
            <span><strong>Status:</strong> aguarda analise manual</span>
          </div>
          <div class="analysis-card-actions">
            ${articleLink}
            ${imageLink}
          </div>
        </article>
      `;
    })
    .join("");
}

function bindFilters() {
  document.querySelectorAll("[data-filter]").forEach((button) => {
    button.addEventListener("click", () => {
      state.filter = button.dataset.filter || "all";
      document.querySelectorAll("[data-filter]").forEach((node) => {
        node.classList.toggle("is-active", node === button);
      });
      renderQueue();
    });
  });
}

async function loadReport() {
  const response = await fetch("/api/news-image-focus-audit", {
    headers: {
      Accept: "application/json"
    }
  });

  if (!response.ok) {
    throw new Error(`Falha ao carregar auditoria (${response.status})`);
  }

  state.report = await response.json();
  renderSummary();
  renderQueue();
}

async function main() {
  bindFilters();
  try {
    await loadReport();
  } catch (error) {
    document.getElementById("analysis-empty").hidden = false;
    document.getElementById("analysis-empty").textContent = error.message;
  }
}

main();
