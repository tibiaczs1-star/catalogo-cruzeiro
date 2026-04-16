"use strict";

(() => {
  const form = document.getElementById("acrePollForm");
  const submitButton = document.getElementById("submitButton");
  const formFeedback = document.getElementById("formFeedback");
  const summaryCard = document.querySelector(".poll-summary");
  const summaryTotal = document.getElementById("summaryTotal");
  const summaryAverage = document.getElementById("summaryAverage");
  const summaryUpdatedAt = document.getElementById("summaryUpdatedAt");
  const voteBars = document.getElementById("voteBars");
  const priorityBars = document.getElementById("priorityBars");
  const rejectionBars = document.getElementById("rejectionBars");
  const locationCloud = document.getElementById("locationCloud");
  const adminToggle = document.getElementById("adminToggle");
  const adminPanel = document.getElementById("adminPanel");
  const adminClose = document.getElementById("adminClose");
  const adminAccessForm = document.getElementById("adminAccessForm");
  const adminPassword = document.getElementById("adminPassword");
  const adminFeedback = document.getElementById("adminFeedback");
  const adminDashboard = document.getElementById("adminDashboard");
  const adminKpis = document.getElementById("adminKpis");
  const adminTableBody = document.getElementById("adminTableBody");
  const adminExport = document.getElementById("adminExport");
  const numberFormatter = new Intl.NumberFormat("pt-BR");
  const decimalFormatter = new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  });
  const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short"
  });
  let lastAdminPayload = null;

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function setFeedback(element, message, state = "") {
    if (!element) return;
    element.textContent = message || "";
    if (state) {
      element.dataset.state = state;
    } else {
      delete element.dataset.state;
    }
  }

  function formatDateTime(value) {
    if (!value) return "Sem atualização";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return String(value);
    return dateFormatter.format(parsed);
  }

  async function readJson(response) {
    try {
      return await response.json();
    } catch (_error) {
      return {};
    }
  }

  function collectClientMeta() {
    const resolvedTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
    return {
      sourcePage: location.pathname,
      pageTitle: document.title,
      referrer: document.referrer || "",
      language: navigator.language || "",
      timezone: resolvedTimeZone,
      screen: window.screen ? `${window.screen.width}x${window.screen.height}` : "",
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      platform: navigator.platform || ""
    };
  }

  function renderBarList(container, items, tone, emptyMessage) {
    if (!container) return;

    if (!Array.isArray(items) || !items.length) {
      container.innerHTML = `<p class="poll-empty">${escapeHtml(emptyMessage)}</p>`;
      return;
    }

    container.innerHTML = items
      .map(
        (item) => `
          <div class="poll-bar-row" data-tone="${escapeHtml(tone)}">
            <div class="poll-bar-meta">
              <strong>${escapeHtml(item.label)}</strong>
              <span>${numberFormatter.format(item.total || 0)} • ${decimalFormatter.format(item.percent || 0)}%</span>
            </div>
            <div class="poll-bar-track">
              <span style="width:${Math.max(0, Math.min(100, Number(item.percent || 0)))}%"></span>
            </div>
          </div>
        `
      )
      .join("");
  }

  function renderLocationCloud(items) {
    if (!locationCloud) return;

    if (!Array.isArray(items) || !items.length) {
      locationCloud.innerHTML = `<span class="poll-empty-chip">Aguardando distribuição</span>`;
      return;
    }

    locationCloud.innerHTML = items
      .map(
        (item) =>
          `<span>${escapeHtml(item.label)} • ${numberFormatter.format(item.total || 0)}</span>`
      )
      .join("");
  }

  function renderPublicSummary(payload = {}) {
    const summary = payload.summary || {};
    const totalResponses = Number(summary.totalResponses || 0);
    const satisfactionAverageValue = Number(summary.satisfactionAverage || 0);

    if (summaryTotal) {
      summaryTotal.textContent = numberFormatter.format(totalResponses);
    }

    if (summaryAverage) {
      summaryAverage.textContent = decimalFormatter.format(satisfactionAverageValue);
    }

    if (summaryUpdatedAt) {
      summaryUpdatedAt.textContent = totalResponses
        ? `Atualizado em ${formatDateTime(summary.updatedAt || payload.updatedAt)}`
        : "Aguardando respostas";
    }

    renderBarList(
      voteBars,
      summary.vote2026,
      "vote",
      "As barras aparecem assim que chegarem as primeiras respostas."
    );
    renderBarList(
      priorityBars,
      summary.priorities,
      "priority",
      "Sem prioridades registradas ainda."
    );
    renderBarList(
      rejectionBars,
      summary.rejection,
      "rejection",
      "Sem dados suficientes até o momento."
    );
    renderLocationCloud(summary.locations);
  }

  async function loadPublicSummary() {
    try {
      const response = await fetch("/api/pesquisa-acre-2026/summary", {
        headers: {
          Accept: "application/json"
        }
      });
      const payload = await readJson(response);
      if (!response.ok) {
        throw new Error(payload.error || "Nao foi possivel carregar as parciais.");
      }
      renderPublicSummary(payload);
    } catch (error) {
      if (summaryUpdatedAt) {
        summaryUpdatedAt.textContent = "Parciais indisponiveis no momento";
      }
      setFeedback(formFeedback, error.message || "Falha ao carregar as parciais.", "error");
    }
  }

  async function handleFormSubmit(event) {
    event.preventDefault();
    if (!form || !submitButton) return;

    if (!form.reportValidity()) {
      setFeedback(formFeedback, "Preencha todos os campos antes de enviar.", "error");
      return;
    }

    const payload = {
      ...Object.fromEntries(new FormData(form).entries()),
      ...collectClientMeta()
    };

    submitButton.disabled = true;
    submitButton.textContent = "Registrando...";
    setFeedback(formFeedback, "");

    try {
      const response = await fetch("/api/pesquisa-acre-2026", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify(payload)
      });
      const data = await readJson(response);

      if (!response.ok) {
        throw new Error(data.error || "Nao foi possivel registrar a resposta.");
      }

      form.reset();
      setFeedback(formFeedback, data.message || "Resposta registrada com sucesso.", "success");
      await loadPublicSummary();
      summaryCard?.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (error) {
      setFeedback(formFeedback, error.message || "Falha ao enviar a pesquisa.", "error");
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = "Enviar e ver parciais";
    }
  }

  function toggleAdminPanel(forceOpen) {
    if (!adminPanel) return;
    const shouldOpen = typeof forceOpen === "boolean" ? forceOpen : adminPanel.hidden;
    adminPanel.hidden = !shouldOpen;
    if (shouldOpen) {
      window.setTimeout(() => adminPassword?.focus(), 60);
    }
  }

  function renderAdminDashboard(payload = {}) {
    const summary = payload.summary || {};
    const voteLeader = Array.isArray(summary.vote2026) && summary.vote2026.length ? summary.vote2026[0] : null;
    const priorityLeader =
      Array.isArray(summary.priorities) && summary.priorities.length ? summary.priorities[0] : null;

    if (adminKpis) {
      adminKpis.innerHTML = `
        <article>
          <strong>${numberFormatter.format(summary.totalResponses || 0)}</strong>
          <span>respostas armazenadas</span>
        </article>
        <article>
          <strong>${decimalFormatter.format(summary.satisfactionAverage || 0)}</strong>
          <span>satisfação média</span>
        </article>
        <article>
          <strong>${escapeHtml(voteLeader?.label || "Sem líder")}</strong>
          <span>${voteLeader ? `${decimalFormatter.format(voteLeader.percent || 0)}% da amostra` : "sem amostra"}</span>
        </article>
        <article>
          <strong>${escapeHtml(priorityLeader?.label || "Sem prioridade")}</strong>
          <span>${priorityLeader ? `${numberFormatter.format(priorityLeader.total || 0)} menções` : "sem amostra"}</span>
        </article>
      `;
    }

    const records = Array.isArray(payload.records) ? payload.records : [];
    if (!records.length) {
      adminTableBody.innerHTML = `<tr><td colspan="8">Nenhum registro armazenado ainda.</td></tr>`;
      return;
    }

    adminTableBody.innerHTML = records
      .map(
        (record) => `
          <tr>
            <td>${escapeHtml(formatDateTime(record.createdAt))}</td>
            <td>${escapeHtml(record.localizacao || record.city || "Nao informado")}</td>
            <td>${escapeHtml(record.profissao || "Nao informado")}<br /><small>${escapeHtml(record.faixaEtaria || "")}</small></td>
            <td>${escapeHtml(record.votoAnterior || "-")}<br /><small>Satisfacao ${escapeHtml(record.satisfacao || "-")}/5</small></td>
            <td>${escapeHtml(record.voto2026 || "-")}</td>
            <td>${escapeHtml(record.rejeicao || "-")}</td>
            <td>${escapeHtml(record.prioridade || "-")}</td>
            <td>${escapeHtml(record.comentario || "Sem comentario")}</td>
          </tr>
        `
      )
      .join("");
  }

  async function handleAdminAccess(event) {
    event.preventDefault();
    const password = String(adminPassword?.value || "").trim();

    if (!password) {
      setFeedback(adminFeedback, "Digite a senha administrativa.", "error");
      return;
    }

    setFeedback(adminFeedback, "Liberando painel...");

    try {
      const response = await fetch("/api/pesquisa-acre-2026/admin", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "x-poll-admin-password": password
        },
        body: "{}"
      });
      const payload = await readJson(response);

      if (!response.ok) {
        throw new Error(payload.error || "Senha invalida.");
      }

      lastAdminPayload = payload;
      adminDashboard.hidden = false;
      renderAdminDashboard(payload);
      setFeedback(
        adminFeedback,
        `Painel liberado. Atualizado em ${formatDateTime(payload.updatedAt || payload.summary?.updatedAt)}.`,
        "success"
      );
    } catch (error) {
      adminDashboard.hidden = true;
      setFeedback(adminFeedback, error.message || "Falha ao abrir o painel.", "error");
    }
  }

  function serializeCsvRows(rows = []) {
    if (!Array.isArray(rows) || !rows.length) return "";
    const headers = [
      "createdAt",
      "localizacao",
      "profissao",
      "faixaEtaria",
      "votoAnterior",
      "satisfacao",
      "voto2026",
      "rejeicao",
      "prioridade",
      "comentario",
      "city",
      "country",
      "browser",
      "deviceType",
      "visitorId",
      "sessionId",
      "ip"
    ];

    const escapeCsv = (value) => {
      const text = String(value ?? "");
      if (/[",\n\r]/.test(text)) {
        return `"${text.replace(/"/g, '""')}"`;
      }
      return text;
    };

    return [headers.join(",")]
      .concat(rows.map((row) => headers.map((header) => escapeCsv(row[header])).join(",")))
      .join("\n");
  }

  function handleAdminExport() {
    const records = lastAdminPayload?.records;
    if (!Array.isArray(records) || !records.length) {
      setFeedback(adminFeedback, "Nenhum dado carregado para exportar.", "error");
      return;
    }

    const csv = serializeCsvRows(records);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "pesquisa-acre-2026.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(link.href), 500);
  }

  form?.addEventListener("submit", handleFormSubmit);
  adminToggle?.addEventListener("click", () => toggleAdminPanel());
  adminClose?.addEventListener("click", () => toggleAdminPanel(false));
  adminAccessForm?.addEventListener("submit", handleAdminAccess);
  adminExport?.addEventListener("click", handleAdminExport);
  loadPublicSummary().catch(() => {});
})();
