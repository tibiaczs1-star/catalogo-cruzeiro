(function () {
  const state = {
    payload: null,
    query: "",
    password: sessionStorage.getItem("realAgentsReportPassword") || ""
  };

  const accessGateEl = document.querySelector("#agentsAccessGate");
  const accessFormEl = document.querySelector("#agentsAccessForm");
  const accessStatusEl = document.querySelector("#agentsAccessStatus");
  const shellEl = document.querySelector("#agentsShell");
  const statsEl = document.querySelector("#agentsStats");
  const ordersListEl = document.querySelector("#ordersList");
  const officeListEl = document.querySelector("#officeList");
  const roleListEl = document.querySelector("#roleList");
  const queueListEl = document.querySelector("#queueList");
  const awardsPodiumEl = document.querySelector("#awardsPodium");
  const awardsCatalogEl = document.querySelector("#awardsCatalog");
  const autonomyRunnerEl = document.querySelector("#autonomyRunner");
  const awardsChaseEl = document.querySelector("#awardsChase");
  const scoreboardPeriodsEl = document.querySelector("#scoreboardPeriods");
  const liveEventsEl = document.querySelector("#liveEvents");
  const officeLogsEl = document.querySelector("#officeLogs");
  const officeDashboardEl = document.querySelector("#officeDashboard");
  const agentTimelinesEl = document.querySelector("#agentTimelines");
  const agentActionsEl = document.querySelector("#agentActions");
  const runMetaEl = document.querySelector("#runMeta");
  const statusEl = document.querySelector("#agentsStatus");
  const searchEl = document.querySelector("#agentSearch");
  const runnerEl = document.querySelector("#agentsRunner");
  const directOrderEl = document.querySelector("#agentsDirectOrder");

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function formatDate(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "sem data";
    return date.toLocaleString("pt-BR", {
      dateStyle: "short",
      timeStyle: "short"
    });
  }

  function formatInterval(ms) {
    const minutes = Math.max(1, Math.round(Number(ms || 0) / 60000));
    return `${minutes} min`;
  }

  function normalize(value) {
    return String(value || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  }

  function setStatus(message, tone) {
    if (!statusEl) return;
    statusEl.textContent = message;
    statusEl.style.color = tone === "bad" ? "var(--agent-red)" : tone === "ok" ? "var(--agent-green)" : "";
  }

  function setAccessStatus(message, tone) {
    if (!accessStatusEl) return;
    accessStatusEl.textContent = message;
    accessStatusEl.style.color = tone === "bad" ? "var(--agent-red)" : tone === "ok" ? "var(--agent-green)" : "";
  }

  function openReportShell() {
    if (accessGateEl) accessGateEl.hidden = true;
    if (shellEl) shellEl.hidden = false;
  }

  async function verifyAccess(password) {
    const response = await fetch("/api/real-agents/access", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ password })
    });
    const payload = await response.json();
    if (!response.ok || !payload.ok) {
      throw new Error(payload.error || "Senha invalida.");
    }
    state.password = password;
    sessionStorage.setItem("realAgentsReportPassword", password);
    openReportShell();
    await loadAgents();
  }

  function renderStats(payload) {
    const summary = payload.summary || {};
    const autoRun = payload.autoRun || {};
    const stats = [
      ["Agentes", summary.totalAgents],
      ["Vivos", summary.aliveAgents || 0],
      ["Entregas", summary.deliveredAgents || 0],
      ["Falhas", summary.failedAgents || 0],
      ["Exaustos", summary.exhaustedAgents || 0],
      ["Escritórios", summary.totalOffices],
      ["Funções", summary.totalRoles],
      ["Notícias lidas", summary.newsItems],
      ["Achados", summary.reviewIssues],
      ["Fila ativa", summary.activeQueue],
      ["Autônomos", summary.autonomousAgents || 0],
      ["Média IA", `${summary.averageAutonomy || 0}%`],
      ["Energia", `${summary.averageEnergy || 0}%`],
      ["Moral", `${summary.averageMorale || 0}%`],
      ["Auto", autoRun.enabled ? formatInterval(autoRun.intervalMs) : "off"]
    ];

    statsEl.innerHTML = stats
      .map(
        ([label, value]) => `
          <article class="agents-stat">
            <span>${escapeHtml(label)}</span>
            <strong>${escapeHtml(value ?? 0)}</strong>
          </article>
        `
      )
      .join("");
  }

  function renderMiniRows(container, items, labelKey, countKey) {
    container.innerHTML = (items || [])
      .map((item) => {
        const label = item[labelKey] || item.value || item.office || item.role || "Sem nome";
        const count = item[countKey] || item.agents || item.count || 0;
        return `
          <div class="agents-mini-row">
            <strong>${escapeHtml(label)}</strong>
            <span>${escapeHtml(count)}</span>
          </div>
        `;
      })
      .join("");
  }

  function renderOrders(payload) {
    if (!ordersListEl) return;
    const orders = Array.isArray(payload.orders) ? payload.orders.slice(0, 8) : [];
    ordersListEl.innerHTML = orders.length
      ? orders
          .map(
            (order) => `
              <div class="agents-mini-row">
                <strong>${escapeHtml(order.to || "Codex CEO")} • ${escapeHtml(order.status || "recebida")}</strong>
                <span>${escapeHtml(
                  `${order.executionSummary?.delivered || 0}/${order.assignedAgents || 0}`
                )}</span>
                <div class="agent-order-actions">
                  <button type="button" data-review-order="${escapeHtml(order.id)}" data-review-status="aprovado">Aprovar</button>
                  <button type="button" data-review-order="${escapeHtml(order.id)}" data-review-status="reprovado">Reprovar</button>
                  <button type="button" data-review-order="${escapeHtml(order.id)}" data-review-status="reaberto">Reabrir</button>
                </div>
              </div>
            `
          )
          .join("")
      : '<p class="agents-empty">Sem ordens rastreadas.</p>';
  }

  function renderOfficeDashboard(payload) {
    if (!officeDashboardEl) return;
    const dashboards = Array.isArray(payload.officeDashboard) ? payload.officeDashboard : [];
    officeDashboardEl.innerHTML = dashboards.length
      ? dashboards
          .map(
            (office) => `
              <article class="agent-period-board">
                <div class="agent-period-head">
                  <span>${escapeHtml(office.office)}</span>
                  <strong>${escapeHtml(office.deliveryRate)}% entrega</strong>
                </div>
                <div class="agent-office-mini">
                  <span>falha ${escapeHtml(office.failureRate)}%</span>
                  <span>energia ${escapeHtml(office.averageEnergy)}%</span>
                  <span>moral ${escapeHtml(office.averageMorale)}%</span>
                  <span>ordens abertas ${escapeHtml(office.openOrders || 0)}</span>
                </div>
                <div class="agent-period-leaders">
                  ${(office.topAgents || [])
                    .map(
                      (agent, index) => `
                        <div class="agent-period-row">
                          <span class="agent-period-rank">#${escapeHtml(index + 1)}</span>
                          <div style="grid-column: span 2;">
                            <strong>${escapeHtml(agent.name)} • ${escapeHtml(agent.points)} pts</strong>
                            <p>${escapeHtml(agent.status)}</p>
                          </div>
                        </div>
                      `
                    )
                    .join("")}
                </div>
              </article>
            `
          )
          .join("")
      : '<p class="agents-empty">Sem dashboard por escritório.</p>';
  }

  function renderAgentTimelines(payload) {
    if (!agentTimelinesEl) return;
    const timelines = Array.isArray(payload.agentTimelines) ? payload.agentTimelines.slice(0, 24) : [];
    agentTimelinesEl.innerHTML = timelines.length
      ? timelines
          .map(
            (agent) => `
              <article class="agent-award-type">
                <span>${escapeHtml(agent.rank || "AG")}</span>
                <div>
                  <strong>${escapeHtml(agent.name)} • nível ${escapeHtml(agent.level || 1)}</strong>
                  <p>${escapeHtml(agent.office)} • ${escapeHtml(agent.role)}</p>
                  ${(agent.events || [])
                    .slice(0, 3)
                    .map((event) => `<p>${escapeHtml(event.type)} • ${escapeHtml(event.title)} • ${escapeHtml(event.points || 0)} pts</p>`)
                    .join("")}
                </div>
              </article>
            `
          )
          .join("")
      : '<p class="agents-empty">Sem timeline por agente.</p>';
  }

  function renderAgentActions(payload) {
    if (!agentActionsEl) return;
    const actions = Array.isArray(payload.executableActions) ? payload.executableActions.slice(0, 24) : [];
    agentActionsEl.innerHTML = actions.length
      ? actions
          .map(
            (action) => `
              <article class="agent-award-type">
                <span>${escapeHtml(action.kind || "acao")}</span>
                <div>
                  <strong>${escapeHtml(action.agent)} • ${escapeHtml(action.points)} pts</strong>
                  <p>${escapeHtml(action.office)} • ${escapeHtml(action.status)}</p>
                  <p>${escapeHtml(action.title)}</p>
                  <p>${escapeHtml(action.artifact)}</p>
                  <div class="agent-order-actions">
                    <button type="button" data-review-action="${escapeHtml(action.id)}" data-review-status="aprovado">Aprovar</button>
                    <button type="button" data-review-action="${escapeHtml(action.id)}" data-review-status="reprovado">Reprovar</button>
                  </div>
                </div>
              </article>
            `
          )
          .join("")
      : '<p class="agents-empty">Sem ações reais geradas ainda.</p>';
  }

  function renderAutonomyRunner(payload) {
    if (!autonomyRunnerEl) return;
    const runner = payload.autonomyRunner || {};
    const report = runner.report || {};
    const actions = Array.isArray(report.actions) ? report.actions : [];

    autonomyRunnerEl.innerHTML = `
      <div class="agents-award-card">
        <strong>${runner.running ? "Rodando agora" : report.ok ? "Ciclo validado" : "Aguardando ciclo"}</strong>
        <span>Último ciclo: ${escapeHtml(formatDate(runner.lastRunAt || report.finishedAt))}</span>
        <small>${escapeHtml(runner.lastError || `Ciclos nesta sessão: ${runner.cycles || 0}`)}</small>
      </div>
      ${actions
        .map(
          (action) => `
            <div class="agents-award-card">
              <strong>${escapeHtml(action.id || "acao")}</strong>
              <span>${escapeHtml(action.agentGroup || "agentes")} • ${escapeHtml(action.status || "")}</span>
              <small>${escapeHtml(action.detail || action.output || `${action.totalAgents || 0} agentes`)}</small>
            </div>
          `
        )
        .join("")}
    `;
  }

  function renderAgentPhoto(photo, name) {
    const safePhoto = photo || {};
    const primary = safePhoto.primary || "#5eead4";
    const secondary = safePhoto.secondary || "#f6c453";
    return `
      <span class="agent-photo" style="--photo-a: ${escapeHtml(primary)}; --photo-b: ${escapeHtml(secondary)}" aria-label="Foto de ${escapeHtml(name)}">
        <span>${escapeHtml(safePhoto.initials || "?")}</span>
        <i>${escapeHtml(safePhoto.badge || "AG")}</i>
      </span>
    `;
  }

  function renderAwards(payload) {
    const awards = payload.awards || {};
    const podium = Array.isArray(awards.podium) ? awards.podium : [];
    const catalog = Array.isArray(awards.catalog) ? awards.catalog : [];

    if (awardsChaseEl) {
      awardsChaseEl.textContent = awards.chaseLine || "Os agentes entram na disputa quando a próxima rodada rodar.";
    }

    if (awardsPodiumEl) {
      awardsPodiumEl.innerHTML = podium.length
        ? podium
            .map((item) => {
              const badges = (item.awards || [])
                .slice(0, 4)
                .map(
                  (award) => `
                    <span class="agent-award-badge" title="${escapeHtml(award.description)}">
                      ${escapeHtml(award.icon)} ${escapeHtml(award.shortTitle)}
                    </span>
                  `
                )
                .join("");
              return `
                <article class="agent-podium-card ${item.rank <= 3 ? "is-top" : ""}">
                  <div class="agent-podium-rank">#${escapeHtml(item.rank)}</div>
                  ${renderAgentPhoto(item.photo, item.name)}
                  <div class="agent-podium-info">
                    <h3>${escapeHtml(item.name)}</h3>
                    <p>${escapeHtml(item.office)} • ${escapeHtml(item.role)}</p>
                    <strong>${escapeHtml(item.points)} pts</strong>
                  </div>
                  <div class="agent-award-row">${badges || '<span class="agent-award-badge">Em caça</span>'}</div>
                  <p class="agent-podium-intent">${escapeHtml(item.intent)}</p>
                </article>
              `;
            })
            .join("")
        : '<p class="agents-empty">A primeira premiação aparece depois da próxima rodada.</p>';
    }

    if (awardsCatalogEl) {
      awardsCatalogEl.innerHTML = catalog
        .map(
          (award) => `
            <article class="agent-award-type">
              <span>${escapeHtml(award.icon)}</span>
              <div>
                <strong>${escapeHtml(award.title)}</strong>
                <p>${escapeHtml(award.description)}</p>
              </div>
            </article>
          `
        )
        .join("");
    }
  }

  function renderScoreboard(payload) {
    if (!scoreboardPeriodsEl) return;
    const scoreboard = payload.scoreboard || {};
    const current = scoreboard.current || {};
    const periodLabels = {
      day: "Hoje",
      week: "Semana",
      month: "Mês"
    };

    scoreboardPeriodsEl.innerHTML = ["day", "week", "month"]
      .map((type) => {
        const period = current[type] || {};
        const leaders = Array.isArray(period.leaders) ? period.leaders.slice(0, 5) : [];
        const offices = Array.isArray(period.offices) ? period.offices.slice(0, 3) : [];
        return `
          <article class="agent-period-board">
            <div class="agent-period-head">
              <span>${escapeHtml(periodLabels[type])}</span>
              <strong>${escapeHtml(period.key || "-")}</strong>
            </div>
            <div class="agent-period-leaders">
              ${
                leaders.length
                  ? leaders
                      .map(
                        (leader) => `
                          <div class="agent-period-row">
                            <span class="agent-period-rank">#${escapeHtml(leader.rank)}</span>
                            ${renderAgentPhoto(leader.photo, leader.name)}
                            <div>
                              <strong>${escapeHtml(leader.name)}</strong>
                              <p>${escapeHtml(leader.office)} • ${escapeHtml(leader.points)} pts • ${escapeHtml(leader.awards)} prêmios</p>
                            </div>
                          </div>
                        `
                      )
                      .join("")
                  : '<p class="agents-empty">Sem pontos acumulados ainda.</p>'
              }
            </div>
            <div class="agent-office-mini">
              ${offices
                .map(
                  (office) => `
                    <span>#${escapeHtml(office.rank)} ${escapeHtml(office.office)} · ${escapeHtml(office.points)} pts</span>
                  `
                )
                .join("")}
            </div>
          </article>
        `;
      })
      .join("");
  }

  function renderLiveEvents(payload) {
    if (!liveEventsEl) return;
    const events = Array.isArray(payload.liveEvents) ? payload.liveEvents.slice(0, 12) : [];
    liveEventsEl.innerHTML = events.length
      ? events
          .map(
            (event) => `
              <article class="agent-award-type">
                <span>${escapeHtml(event.outcome === "success" ? "OK" : event.outcome === "failure" ? "!!" : "..")}</span>
                <div>
                  <strong>${escapeHtml(event.name)} • ${escapeHtml(event.points)} pts</strong>
                  <p>${escapeHtml(event.office)} • ${escapeHtml(event.status)} • nível ${escapeHtml(event.level)} ${escapeHtml(event.rank)}</p>
                  <p>${escapeHtml(event.message)}</p>
                </div>
              </article>
            `
          )
          .join("")
      : '<p class="agents-empty">Sem eventos vivos ainda.</p>';
  }

  function renderOfficeLogs(payload) {
    if (!officeLogsEl) return;
    const officeLogs = Array.isArray(payload.officeLogs) ? payload.officeLogs : [];
    officeLogsEl.innerHTML = officeLogs.length
      ? officeLogs
          .map(
            (office) => `
              <article class="agent-period-board">
                <div class="agent-period-head">
                  <span>${escapeHtml(office.office)}</span>
                  <strong>${escapeHtml(office.totalLogs)} logs</strong>
                </div>
                <div class="agent-period-leaders">
                  ${(office.items || [])
                    .map(
                      (item) => `
                        <div class="agent-period-row">
                          <span class="agent-period-rank">${escapeHtml(item.outcome === "success" ? "OK" : item.outcome === "failure" ? "!!" : "..")}</span>
                          <div style="grid-column: span 2;">
                            <strong>${escapeHtml(item.name)} • ${escapeHtml(item.points)} pts</strong>
                            <p>${escapeHtml(item.role)} • ${escapeHtml(item.status)}</p>
                            <p>${escapeHtml(item.message)}</p>
                          </div>
                        </div>
                      `
                    )
                    .join("")}
                </div>
              </article>
            `
          )
          .join("")
      : '<p class="agents-empty">Sem logs por escritório ainda.</p>';
  }

  function queueMatches(item) {
    const query = normalize(state.query);
    if (!query) return true;
    return normalize(
      [
        item.name,
        item.officeLabel,
        item.role,
        item.assignment?.headline,
        item.assignment?.action,
        item.assignment?.idea,
        item.assignment?.monitor
      ].join(" ")
    ).includes(query);
  }

  function renderQueue(payload) {
    const queue = (payload.queue || []).filter(queueMatches);
    if (!queue.length) {
      queueListEl.innerHTML = '<p class="agents-empty">Nenhum agente encontrado nesse filtro.</p>';
      return;
    }

    queueListEl.innerHTML = queue
      .map((item) => {
        const assignment = item.assignment || {};
        const autonomy = item.autonomy || {};
        const life = autonomy.life || {};
        return `
          <article class="agent-work-item">
            <div class="agent-work-id">
              ${renderAgentPhoto(item.photo, item.name)}
              <h3>${escapeHtml(item.name)}</h3>
              <p>${escapeHtml(item.officeLabel)} • ${escapeHtml(item.role)}</p>
              <div class="agent-pill-row">
                <span class="agent-pill">${escapeHtml(assignment.deliverable || "entrega")}</span>
                <span class="agent-pill">${escapeHtml(autonomy.mode || "assistido")}</span>
                <span class="agent-pill">${escapeHtml(life.status || "ativo")}</span>
                <span class="agent-pill">${escapeHtml(item.points || 0)} pts</span>
              </div>
              <div class="agent-award-row">
                ${(item.awards || [])
                  .slice(0, 3)
                  .map((award) => `<span class="agent-award-badge">${escapeHtml(award.icon)} ${escapeHtml(award.shortTitle)}</span>`)
                  .join("")}
              </div>
            </div>
            <div class="agent-work-body">
              <p><b>Manchete:</b> ${escapeHtml(assignment.headline)}</p>
              <p><strong>Ação:</strong> ${escapeHtml(assignment.action)}</p>
              <p><b>Ideia:</b> ${escapeHtml(assignment.idea)}</p>
              <p><b>Monitor:</b> ${escapeHtml(assignment.monitor)}</p>
              <p><b>Vida operacional:</b> ${escapeHtml(life.lastEvent || "sem evento recente")}</p>
              <div class="agent-autonomy-meter" aria-label="Autonomia operacional">
                <span style="width: ${Math.max(0, Math.min(100, Number(autonomy.autonomy || 0)))}%"></span>
              </div>
              <div class="agent-autonomy-meter" aria-label="Energia operacional">
                <span style="width: ${Math.max(0, Math.min(100, Number(life.energy || 0)))}%"></span>
              </div>
              <p><b>Intenção própria:</b> ${escapeHtml(autonomy.intent || "aguardando memoria")}</p>
              <p class="agent-autonomy-line">
                Autonomia ${escapeHtml(autonomy.autonomy || 0)}% • urgência ${escapeHtml(
                  autonomy.urgency || 0
                )}% • confiança ${escapeHtml(autonomy.confidence || 0)}% • energia ${escapeHtml(
                  life.energy || 0
                )}% • moral ${escapeHtml(life.morale || 0)}% • próxima checagem ${escapeHtml(
                  formatDate(autonomy.nextCheckAt)
                )}
              </p>
              <p class="agent-autonomy-line">
                Entregas ${escapeHtml(life.completedTasks || 0)} • parciais ${escapeHtml(life.partialTasks || 0)} • falhas ${escapeHtml(
                  life.failedTasks || 0
                )} • streak ${escapeHtml(life.streak || 0)} • nível ${escapeHtml(life.level || 1)} ${escapeHtml(
                  life.rank || "junior"
                )}
              </p>
            </div>
          </article>
        `;
      })
      .join("");
  }

  function render(payload) {
    state.payload = payload;
    renderStats(payload);
    renderAutonomyRunner(payload);
    renderAwards(payload);
    renderScoreboard(payload);
    renderLiveEvents(payload);
    renderOfficeLogs(payload);
    renderOfficeDashboard(payload);
    renderAgentTimelines(payload);
    renderAgentActions(payload);
    renderOrders(payload);
    renderMiniRows(officeListEl, payload.offices, "office", "agents");
    renderMiniRows(roleListEl, payload.roles, "role", "agents");
    const autoRun = payload.autoRun || {};
    const autoText = autoRun.enabled
      ? ` • Auto: ${formatInterval(autoRun.intervalMs)} • Ciclos: ${autoRun.cycles || 0}`
      : " • Auto: desligado";
    runMetaEl.textContent = `Rodada: ${formatDate(payload.runGeneratedAt)} • Registry: ${formatDate(
      payload.registryGeneratedAt
    )}${autoText}`;
    renderQueue(payload);
  }

  async function loadAgents(silent) {
    if (!silent) setStatus("Abrindo agentes...");
    const response = await fetch(`/api/real-agents?password=${encodeURIComponent(state.password)}`, {
      headers: { Accept: "application/json" }
    });
    const payload = await response.json();
    if (!response.ok || !payload.ok) {
      throw new Error(payload.error || "Nao foi possivel carregar os agentes.");
    }
    render(payload);
    setStatus("Agentes trabalhando e monitorando o jornal.", "ok");
  }

  async function runAgents(event) {
    event.preventDefault();
    const form = new FormData(runnerEl);
    const password = String(form.get("password") || "").trim();
    if (!password) {
      setStatus("Digite a senha Full Admin para rodar a equipe.", "bad");
      return;
    }

    setStatus("Rodando 181 agentes...");
    const response = await fetch("/api/real-agents/run", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        password,
        message: "Rodada solicitada pelo painel Agentes Reais."
      })
    });
    const payload = await response.json();
    if (!response.ok || !payload.ok) {
      throw new Error(payload.error || "Falha ao rodar agentes.");
    }
    render(payload);
    setStatus("Rodada renovada. Os agentes atualizaram a fila.", "ok");
  }

  searchEl?.addEventListener("input", () => {
    state.query = searchEl.value || "";
    if (state.payload) renderQueue(state.payload);
  });

  runnerEl?.addEventListener("submit", (event) => {
    runAgents(event).catch((error) => setStatus(error.message, "bad"));
  });

  accessFormEl?.addEventListener("submit", (event) => {
    event.preventDefault();
    const form = new FormData(accessFormEl);
    const password = String(form.get("password") || "").trim();
    if (!password) {
      setAccessStatus("Digite a senha Full Admin.", "bad");
      return;
    }
    setAccessStatus("Verificando acesso...");
    verifyAccess(password)
      .then(() => setAccessStatus("Acesso liberado.", "ok"))
      .catch((error) => setAccessStatus(error.message, "bad"));
  });

  directOrderEl?.addEventListener("submit", (event) => {
    event.preventDefault();
    (async () => {
      const form = new FormData(directOrderEl);
      const password = String(form.get("password") || "").trim();
      const target = String(form.get("target") || "").trim();
      const priority = String(form.get("priority") || "").trim() || "alta";
      const message = String(form.get("message") || "").trim();
      if (!password || !message) {
        setStatus("Senha e ordem sao obrigatorias.", "bad");
        return;
      }
      setStatus(`Enviando ordem para ${target || "Codex CEO"}...`);
      const response = await fetch("/api/office-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ password, target: target || "Codex CEO", priority, message })
      });
      const payload = await response.json();
      if (!response.ok || !payload.ok) {
        throw new Error(payload.error || "Falha ao enviar ordem.");
      }
      directOrderEl.reset();
      setStatus(`Ordem enviada para ${target || "Codex CEO"}.`, "ok");
    })().catch((error) => setStatus(error.message, "bad"));
  });

  document.addEventListener("click", (event) => {
    const button = event.target.closest("[data-review-order]");
    if (!button) return;
    const password = prompt("Senha Full Admin para revisar a ordem:");
    if (!password) return;
    const note = prompt("Observação curta da revisão:") || "";
    (async () => {
      setStatus("Registrando revisão da ordem...");
      const response = await fetch("/api/office-orders/review", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          password,
          orderId: button.dataset.reviewOrder,
          status: button.dataset.reviewStatus,
          note
        })
      });
      const payload = await response.json();
      if (!response.ok || !payload.ok) {
        throw new Error(payload.error || "Falha ao revisar ordem.");
      }
      setStatus(`Ordem ${button.dataset.reviewStatus}. Rode a equipe para aplicar impacto.`, "ok");
      loadAgents(true).catch((error) => setStatus(error.message, "bad"));
    })().catch((error) => setStatus(error.message, "bad"));
  });

  document.addEventListener("click", (event) => {
    const button = event.target.closest("[data-review-action]");
    if (!button) return;
    const password = prompt("Senha Full Admin para revisar a ação:");
    if (!password) return;
    const note = prompt("Observação curta da ação:") || "";
    (async () => {
      setStatus("Registrando revisão da ação...");
      const response = await fetch("/api/real-agents/actions/review", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          password,
          actionId: button.dataset.reviewAction,
          status: button.dataset.reviewStatus,
          note
        })
      });
      const payload = await response.json();
      if (!response.ok || !payload.ok) {
        throw new Error(payload.error || "Falha ao revisar ação.");
      }
      setStatus(`Ação ${button.dataset.reviewStatus}.`, "ok");
      loadAgents(true).catch((error) => setStatus(error.message, "bad"));
    })().catch((error) => setStatus(error.message, "bad"));
  });

  if (state.password) {
    verifyAccess(state.password).catch(() => {
      sessionStorage.removeItem("realAgentsReportPassword");
      state.password = "";
      if (accessGateEl) accessGateEl.hidden = false;
      if (shellEl) shellEl.hidden = true;
    });
  }
  window.setInterval(() => {
    if (state.password) loadAgents(true).catch((error) => setStatus(error.message, "bad"));
  }, 60 * 1000);
})();
