(function () {
  const state = {
    password: sessionStorage.getItem("spriteCheckPassword") || "",
    items: [],
    category: "checkpubpaid",
    status: "todos",
    query: ""
  };

  const loginForm = document.querySelector("[data-sprite-login]");
  const loginStatus = document.querySelector("[data-sprite-login-status]");
  const passwordInput = document.querySelector("#sprite-password");
  const grid = document.querySelector("[data-sprite-grid]");
  const summary = document.querySelector("[data-sprite-summary]");
  const menu = document.querySelector("[data-sprite-menu]");
  const searchInput = document.querySelector("[data-sprite-search]");
  const statusFilter = document.querySelector("[data-sprite-status-filter]");

  function setStatus(message, isError = false) {
    if (!loginStatus) return;
    loginStatus.textContent = message;
    loginStatus.style.color = isError ? "#ff8da0" : "#7cffb2";
  }

  function formatBytes(value) {
    const bytes = Number(value || 0);
    if (!bytes) return "0 B";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  }

  function statusLabel(status) {
    return {
      accepted: "aceito",
      rejected: "reprovado",
      pending: "pendente",
      "needs-change": "ajuste"
    }[status] || status || "pendente";
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function updateSummary(payload) {
    if (!summary) return;
    const status = payload?.summary?.byStatus || {};
    const total = payload?.summary?.total || state.items.length;
    const values = [
      total,
      status.pending || 0,
      status.accepted || 0,
      status.rejected || 0,
      status["needs-change"] || 0
    ];
    summary.querySelectorAll("strong").forEach((node, index) => {
      node.textContent = String(values[index] ?? "--");
    });
  }

  function filterItems() {
    const query = state.query.trim().toLowerCase();
    return state.items.filter((item) => {
      const categoryMatch =
        state.category === "todos" ||
        state.category === "checkpubpaid" ||
        item.category === state.category ||
        (state.category === "itens" && item.category === "itens");
      const statusMatch = state.status === "todos" || item.status === state.status;
      const haystack = `${item.name} ${item.path} ${item.category} ${item.sourceRoot}`.toLowerCase();
      const queryMatch = !query || haystack.includes(query);
      return categoryMatch && statusMatch && queryMatch;
    });
  }

  function renderGrid() {
    if (!grid) return;
    const items = filterItems();
    if (!items.length) {
      grid.innerHTML = `
        <article class="sprite-empty-state">
          <strong>Nenhum sprite encontrado nesse filtro.</strong>
          <p>Tente outro nome, categoria ou status.</p>
        </article>
      `;
      return;
    }

    grid.innerHTML = items
      .slice(0, 800)
      .map((item) => {
        const statusClass = `sprite-status-${escapeHtml(item.status || "pending")}`;
        return `
          <article class="sprite-card" data-sprite-id="${escapeHtml(item.id)}">
            <div class="sprite-card-preview">
              <img loading="lazy" src="${escapeHtml(item.publicUrl)}" alt="${escapeHtml(item.name)}" />
            </div>
            <div class="sprite-card-body">
              <strong>${escapeHtml(item.name)}</strong>
              <p>${escapeHtml(item.path)}</p>
              <div class="sprite-card-meta">
                <span>${escapeHtml(item.category)}</span>
                <span>${escapeHtml(item.sourceRoot)}</span>
                <span>${escapeHtml(formatBytes(item.sizeBytes))}</span>
                <span class="${statusClass}">${escapeHtml(statusLabel(item.status))}</span>
              </div>
              ${item.note ? `<p><b>Nota:</b> ${escapeHtml(item.note)}</p>` : ""}
              <div class="sprite-card-actions">
                <button type="button" data-review="accepted">Aceitar</button>
                <button type="button" data-review="rejected">Reprovar</button>
                <button type="button" data-review="needs-change">Pedir ajuste</button>
                <button type="button" data-review="pending">Pendente</button>
              </div>
            </div>
          </article>
        `;
      })
      .join("");

    if (items.length > 800) {
      grid.insertAdjacentHTML(
        "beforeend",
        `<article class="sprite-empty-state"><strong>Mostrando 800 de ${items.length}.</strong><p>Use busca para afinar.</p></article>`
      );
    }
  }

  async function loadSprites() {
    if (!state.password) {
      setStatus("Digite a senha para carregar o cofre.", true);
      return;
    }

    setStatus("Buscando sprites do cofre para revisao...");
    const response = await fetch(`/api/sprites-check?password=${encodeURIComponent(state.password)}`);
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || !payload.ok) {
      setStatus(payload.error || "Senha recusada.", true);
      return;
    }

    sessionStorage.setItem("spriteCheckPassword", state.password);
    state.items = Array.isArray(payload.items) ? payload.items : [];
    updateSummary(payload);
    renderGrid();
    setStatus(`Cofre carregado: ${state.items.length} assets encontrados.`);
  }

  async function reviewSprite(id, status) {
    const item = state.items.find((entry) => entry.id === id);
    const defaultNote = status === "needs-change" ? "Descrever ajuste necessario" : "";
    const note = window.prompt("Nota para a equipe Ninja (opcional):", item?.note || defaultNote) || "";
    const response = await fetch("/api/sprites-check/review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: state.password, id, status, note })
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || !payload.ok) {
      setStatus(payload.error || "Nao consegui registrar a revisao.", true);
      return;
    }

    state.items = state.items.map((entry) =>
      entry.id === id
        ? { ...entry, status: payload.item.status, note: payload.item.note, reviewedAt: payload.item.reviewedAt }
        : entry
    );
    updateSummary({ summary: payload.summary });
    renderGrid();
    setStatus("Revisao salva. A equipe vai obedecer esse estado.");
  }

  loginForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    state.password = passwordInput?.value?.trim() || state.password;
    loadSprites().catch(() => setStatus("Falha ao carregar o painel.", true));
  });

  menu?.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-category]");
    if (!button) return;
    state.category = button.dataset.category || "checkpubpaid";
    menu.querySelectorAll("button").forEach((node) => node.classList.toggle("active", node === button));
    renderGrid();
  });

  searchInput?.addEventListener("input", () => {
    state.query = searchInput.value || "";
    renderGrid();
  });

  statusFilter?.addEventListener("change", () => {
    state.status = statusFilter.value || "todos";
    renderGrid();
  });

  grid?.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-review]");
    const card = event.target.closest("[data-sprite-id]");
    if (!button || !card) return;
    reviewSprite(card.dataset.spriteId, button.dataset.review).catch(() =>
      setStatus("Falha ao salvar revisao.", true)
    );
  });

  if (state.password && passwordInput) {
    passwordInput.value = state.password;
    loadSprites().catch(() => setStatus("Falha ao restaurar sessao.", true));
  }
})();
