/**
 * Agent OS — Supervisor Frontend
 *
 * Painel de comando do Agent OS.
 * Consome endpoints do servidor para exibir estado dos agentes.
 *
 * Uso:
 *   Abra agent-os-supervisor.html no browser
 *   Ou acesse: http://localhost:3000/agent-os-supervisor.html
 */

(function () {
  "use strict";

  const REFRESH_INTERVAL_MS = 5000;
  let refreshTimer = null;
  let currentPayload = null;

  // ─── Elementos DOM ─────────────────────────────────────────────────

  const els = {
    statAgents: document.querySelector("#stat-agents"),
    statTeams: document.querySelector("#stat-teams"),
    statCycles: document.querySelector("#stat-cycles"),
    statReports: document.querySelector("#stat-reports"),
    console: document.querySelector("#console"),
    reportList: document.querySelector("#report-list"),
  };

  // ─── Console Logger ─────────────────────────────────────────────────

  function logToConsole(message, type = "info") {
    if (!els.console) return;
    const time = new Date().toLocaleTimeString("pt-BR");
    const line = document.createElement("div");
    line.className = `console-line ${type}`;
    line.textContent = `[${time}] ${message}`;
    els.console.appendChild(line);
    els.console.scrollTop = els.console.scrollHeight;
  }

  // ─── API Calls ──────────────────────────────────────────────────────

  async function fetchState() {
    try {
      const res = await fetch("/api/agent-os/state");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      logToConsole(`Erro ao carregar estado: ${err.message}`, "error");
      return null;
    }
  }

  async function fetchReports() {
    try {
      const res = await fetch("/api/agent-os/reports");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch {
      return { reports: [] };
    }
  }

  async function triggerCycle() {
    try {
      logToConsole("Iniciando ciclo completo...", "info");
      const res = await fetch("/api/agent-os/cycle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cycle: "full" }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const result = await res.json();
      logToConsole(
        `Ciclo concluído: ${result.summary?.success || 0} sucessos, ${result.summary?.failed || 0} falhas`,
        result.summary?.failed > 0 ? "warning" : "success"
      );
      return result;
    } catch (err) {
      logToConsole(`Erro no ciclo: ${err.message}`, "error");
      return null;
    }
  }

  // ─── Render ────────────────────────────────────────────────────────

  function updateStats(state) {
    if (!state) return;

    if (els.statAgents) {
      els.statAgents.textContent = state.summary?.totalAgents || 181;
    }
    if (els.statTeams) {
      els.statTeams.textContent = Object.keys(state.teams || {}).length;
    }
    if (els.statCycles) {
      els.statCycles.textContent = state.cycles || 0;
    }
    if (els.statReports) {
      els.statReports.textContent = state.reportsGenerated || 0;
    }
  }

  function updateReports(reports) {
    if (!els.reportList || !reports.reports) return;

    if (reports.reports.length === 0) {
      els.reportList.innerHTML = `
        <div class="report-item">
          <div class="report-info">
            <h4>Nenhum relatório gerado ainda</h4>
            <p>Execute o primeiro ciclo para gerar relatórios</p>
          </div>
        </div>
      `;
      return;
    }

    els.reportList.innerHTML = reports.reports
      .slice(0, 10)
      .map(
        (r) => `
      <div class="report-item" onclick="window.open('${r.url}', '_blank')">
        <div class="report-info">
          <h4>${r.title || r.type}</h4>
          <p>${r.date} — ${r.agents || 0} agentes</p>
        </div>
        <span class="report-status ${r.status || 'completed'}">
          ${r.status === 'pending' ? '⏳' : '✅'}
        </span>
      </div>
    `
      )
      .join("");
  }

  async function loadPayload() {
    const [state, reports] = await Promise.all([fetchState(), fetchReports()]);

    if (state) {
      currentPayload = state;
      updateStats(state);
    }

    updateReports(reports || { reports: [] });
  }

  // ─── Auto Refresh ──────────────────────────────────────────────────

  function startAutoRefresh() {
    if (refreshTimer) clearInterval(refreshTimer);
    refreshTimer = setInterval(() => {
      loadPayload();
    }, REFRESH_INTERVAL_MS);
  }

  function stopAutoRefresh() {
    if (refreshTimer) {
      clearInterval(refreshTimer);
      refreshTimer = null;
    }
  }

  // ─── Public API ────────────────────────────────────────────────────

  window.AgentOS = {
    refresh: loadPayload,
    runCycle: triggerCycle,
    startAutoRefresh,
    stopAutoRefresh,
    getState: () => currentPayload,
    log: logToConsole,
  };

  // ─── Init ──────────────────────────────────────────────────────────

  loadPayload();
  startAutoRefresh();
})();
