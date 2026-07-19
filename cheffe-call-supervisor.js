(function () {
  "use strict";

  const REFRESH_INTERVAL_MS = 5000;
  let refreshTimer = null;
  let currentPayload = null;
  let actionInProgress = false;

  const els = {
    stateValue: document.querySelector("#svStateValue"),
    stateMeta: document.querySelector("#svStateMeta"),
    agentsValue: document.querySelector("#svAgentsValue"),
    agentsMeta: document.querySelector("#svAgentsMeta"),
    autonomyValue: document.querySelector("#svAutonomyValue"),
    autonomyMeta: document.querySelector("#svAutonomyMeta"),
    queueValue: document.querySelector("#svQueueValue"),
    queueMeta: document.querySelector("#svQueueMeta"),
    ordersValue: document.querySelector("#svOrdersValue"),
    ordersMeta: document.querySelector("#svOrdersMeta"),
    ideValue: document.querySelector("#svIdeValue"),
    ideMeta: document.querySelector("#svIdeMeta"),
    runtimeValue: document.querySelector("#svRuntimeValue"),
    runtimeMeta: document.querySelector("#svRuntimeMeta"),
    reviewValue: document.querySelector("#svReviewValue"),
    reviewMeta: document.querySelector("#svReviewMeta"),
    log: document.querySelector("#svLog"),
    password: document.querySelector("#svPassword"),
    refresh: document.querySelector("#svRefresh"),
    runAgents: document.querySelector("#svRunAgents"),
    release: document.querySelector("#svRelease"),
    clearSession: document.querySelector("#svClearSession")
  };

  function esc(str) {
    return String(str ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function fmtTime(iso) {
    if (!iso) return "—";
    const d = new Date(iso);
    if (!Number.isFinite(d.getTime())) return "—";
    return d.toLocaleString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit", day: "2-digit", month: "2-digit" });
  }

  function setCard(valueEl, metaEl, value, meta) {
    if (valueEl) valueEl.textContent = value ?? "—";
    if (metaEl) metaEl.textContent = meta ?? "";
  }

  function appendLog(text) {
    if (!els.log) return;
    const line = `[${new Date().toLocaleTimeString("pt-BR")}] ${text}`;
    els.log.textContent = els.log.textContent ? els.log.textContent + "\n" + line : line;
    els.log.scrollTop = els.log.scrollHeight;
  }

  async function postCall(path, body) {
    const password = String(els.password?.value || sessionStorage.getItem("cheffeSupervisorPassword") || "").trim();
    if (!password) {
      throw new Error("Digite a senha Cheffe Call ou Full Admin.");
    }
    sessionStorage.setItem("cheffeSupervisorPassword", password);
    const response = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ ...(body || {}), password })
    });
    const text = await response.text();
    try {
      return { ok: response.ok, status: response.status, data: JSON.parse(text) };
    } catch {
      return { ok: response.ok, status: response.status, data: text };
    }
  }

  async function loadPayload() {
    try {
      const response = await fetch("/api/cheffe-call", { headers: { Accept: "application/json" } });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      currentPayload = await response.json();
      render(currentPayload);
      appendLog(`Payload atualizado: ${new Date().toLocaleTimeString("pt-BR")}`);
    } catch (err) {
      appendLog(`Falha ao atualizar: ${err.message}`);
    }
  }

  function render(payload) {
    if (!payload || typeof payload !== "object") return;
    const meeting = payload.meeting || {};
    const summary = payload.summary || {};
    const autoRun = payload.autoRun || null;
    const ideQueue = payload.ideActionQueue || null;
    const reviewQueue = payload.reviewQueue || null;

    const isActive = Boolean(meeting.active);
    const stateLabel = isActive ? "Ativa" : "Inativa";
    const stateDot = isActive ? "active" : "inactive";

    setCard(
      els.stateValue,
      els.stateMeta,
      `${stateLabel} ${stateDot === "active" ? "🟢" : "🔴"}`,
      isActive ? `Pausada em ${fmtTime(meeting.pausedAt)}` : `Liberada em ${fmtTime(meeting.releasedAt)}`
    );

    setCard(
      els.agentsValue,
      els.agentsMeta,
      `${summary.totalAgents ?? "—"}`,
      `Autônomos: ${summary.autonomousAgents ?? "—"}`
    );

    const avgAuto = summary.averageAutonomy ?? (payload.autonomy && payload.autonomy.averageAutonomy) ?? null;
    setCard(
      els.autonomyValue,
      els.autonomyMeta,
      avgAuto != null ? `${avgAuto}%` : "—",
      avgAuto != null && avgAuto < 50 ? "Abaixo do esperado" : "Dentro do esperado"
    );

    setCard(
      els.queueValue,
      els.queueMeta,
      `${payload.queueTotal ?? (Array.isArray(payload.queue) ? payload.queue.length : "—")}`,
      Array.isArray(payload.queue) && payload.queue.length > 0 ? `Primeiro: ${esc(payload.queue[0].agent || payload.queue[0].office || "item")}` : "Fila vazia"
    );

    setCard(
      els.ordersValue,
      els.ordersMeta,
      `${payload.ordersTotal ?? (Array.isArray(payload.orders) ? payload.orders.length : "—")}`,
      Array.isArray(payload.orders) && payload.orders.length > 0 ? `Última: ${esc(payload.orders[0].title || payload.orders[0].office || "ordem")}` : "Sem ordens"
    );

    const ideWaiting = ideQueue ? ideQueue.waiting ?? ideQueue.total ?? "—" : "—";
    setCard(
      els.ideValue,
      els.ideMeta,
      `${ideWaiting}`,
      ideQueue ? `Arquivo: ${esc(ideQueue.file || "fila IDE")}` : "Fila IDE indisponível"
    );

    if (autoRun) {
      setCard(
        els.runtimeValue,
        els.runtimeMeta,
        autoRun.running ? "Rodando" : "Parado",
        `Ciclos: ${autoRun.cycles ?? 0} · Último: ${fmtTime(autoRun.lastRunAt)}`
      );
    } else {
      setCard(els.runtimeValue, els.runtimeMeta, "—", "Auto runtime indisponível");
    }

    const reviewTotal = reviewQueue ? (Array.isArray(reviewQueue.items) ? reviewQueue.items.length : (reviewQueue.total ?? "—")) : "—";
    setCard(
      els.reviewValue,
      els.reviewMeta,
      `${reviewTotal}`,
      reviewQueue ? "Pendências de revisão" : "Fila indisponível"
    );

    const logLines = [
      `Estado: ${stateLabel}`,
      `Agentes: ${summary.totalAgents ?? "—"} | Autonomia média: ${avgAuto != null ? avgAuto + "%" : "—"}`,
      `Fila: ${payload.queueTotal ?? "—"} | Ordens: ${payload.ordersTotal ?? "—"}`,
      `IDE: ${ideWaiting} | Revisão: ${reviewTotal}`,
      `Auto runtime: ${autoRun ? (autoRun.running ? "ativo" : "parado") : "indisponível"} · Ciclos: ${autoRun ? (autoRun.cycles ?? 0) : "—"}`,
      `Última atividade: ${fmtTime(meeting.lastActivityAt)}`,
      `Instrução: ${meeting.lastInstruction ? esc(meeting.lastInstruction).slice(0, 120) : "—"}`
    ];
    els.log.textContent = logLines.join("\n");
  }

  async function runAction(path, label, body) {
    if (actionInProgress) {
      appendLog(`Ação em andamento. Aguarde...`);
      return;
    }
    actionInProgress = true;
    appendLog(`${label}...`);
    try {
      const result = await postCall(path, body);
      appendLog(`${label} -> HTTP ${result.status} ok=${result.ok}`);
      if (!result.ok) {
        appendLog(`Erro: ${typeof result.data === "string" ? result.data : JSON.stringify(result.data).slice(0, 400)}`);
      }
      await loadPayload();
    } catch (err) {
      appendLog(`${label} falhou: ${err.message}`);
    } finally {
      actionInProgress = false;
    }
  }

  if (els.refresh) {
    els.refresh.addEventListener("click", () => {
      appendLog("Atualização manual solicitada.");
      loadPayload();
    });
  }

  if (els.runAgents) {
    els.runAgents.addEventListener("click", () => {
      runAction("/api/real-agents/run", "Rodar agentes");
    });
  }

  if (els.release) {
    els.release.addEventListener("click", () => {
      runAction("/api/cheffe-call/release", "Liberar reunião");
    });
  }

  if (els.clearSession) {
    els.clearSession.addEventListener("click", () => {
      runAction("/api/cheffe-call/admin/clear", "Limpar sessão");
    });
  }

  function startAutoRefresh() {
    stopAutoRefresh();
    refreshTimer = setInterval(loadPayload, REFRESH_INTERVAL_MS);
  }

  function stopAutoRefresh() {
    if (refreshTimer) {
      clearInterval(refreshTimer);
      refreshTimer = null;
    }
  }

  loadPayload();
  if (els.password) {
    els.password.value = sessionStorage.getItem("cheffeSupervisorPassword") || "";
  }
  startAutoRefresh();
})();
