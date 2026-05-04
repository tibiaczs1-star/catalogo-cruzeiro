(function () {
  const audienceEl = document.querySelector("#agentAudience");
  const statusEl = document.querySelector("#callStatus");
  const terminalEl = document.querySelector("#callTerminal");
  const formEl = document.querySelector("#cheffeCallForm");
  const releaseEl = document.querySelector("#releaseCall");
  const sendTerminalEl = document.querySelector("#sendTerminalCommand");
  const nextSpeakerEl = document.querySelector("#nextSpeaker");
  const markGoodIdeaEl = document.querySelector("#markGoodIdea");
  const opinionsEl = document.querySelector("#opinionsList");
  const opinionPendingCount = document.querySelector("#opinionPendingCount");
  const opinionReadyCount = document.querySelector("#opinionReadyCount");
  const opinionRunningCount = document.querySelector("#opinionRunningCount");
  const opinionFlowMeta = document.querySelector("#opinionFlowMeta");
  const runApprovedOpinions = document.querySelector("#runApprovedOpinions");
  const refreshOpinionFlow = document.querySelector("#refreshOpinionFlow");
  const opinionFlowSteps = Array.from(document.querySelectorAll("[data-opinion-flow-step]"));
  const speechBubbleEl = document.querySelector("#activeSpeechBubble");
  const raisedHandBoard = document.querySelector("#raisedHandBoard");
  const raisedHandList = document.querySelector("#raisedHandList");
  const meetingLogList = document.querySelector("#meetingLogList");
  const callModeBanner = document.querySelector("#callModeBanner");
  const taskQueueList = document.querySelector("#taskQueueList");
  const agentOfDayEl = document.querySelector("#agentOfDay");
  const agentOfDayMetaEl = document.querySelector("#agentOfDayMeta");
  const agentOfDayAvatar = document.querySelector("#agentOfDayAvatar");
  const agentNeuralBar = document.querySelector("#agentNeuralBar");
  const agentAwardNote = document.querySelector("#agentAwardNote");
  const voteAgentOfDay = document.querySelector("#voteAgentOfDay");
  const openAgentFile = document.querySelector("#openAgentFile");
  const fullscreenToggleEl = document.querySelector("#toggleFullscreenMode");
  const hudToggleEl = document.querySelector("#toggleHudMode");
  const lowerDecksToggleEl = document.querySelector("#toggleLowerDecks");
  const commandBarEl = document.querySelector("#cheffeCommandBar");
  const cheffeAccessModal = document.querySelector("#cheffeAccessModal");
  const cheffeAccessCard = document.querySelector(".cheffe-access-card");
  const quickPasswordInput = document.querySelector("#quickPasswordInput");
  const quickPasswordConfirm = document.querySelector("#quickPasswordConfirm");
  const quickPasswordStatus = document.querySelector("#quickPasswordStatus");
  const cheffePhotoApproval = document.querySelector("#cheffePhotoApproval");
  const photoApprovalCounter = document.querySelector("#photoApprovalCounter");
  const photoApprovalSummary = document.querySelector("#photoApprovalSummary");
  const photoApprovalProgress = document.querySelector("#photoApprovalProgress");
  const photoApprovalList = document.querySelector("#photoApprovalList");
  const photoApprovalImage = document.querySelector("#photoApprovalImage");
  const photoApprovalImageCaption = document.querySelector("#photoApprovalImageCaption");
  const photoApprovalTitle = document.querySelector("#photoApprovalTitle");
  const photoApprovalMeta = document.querySelector("#photoApprovalMeta");
  const photoApprovalReasons = document.querySelector("#photoApprovalReasons");
  const photoApprovalFocus = document.querySelector("#photoApprovalFocus");
  const photoApprovalFocusX = document.querySelector("#photoApprovalFocusX");
  const photoApprovalFocusY = document.querySelector("#photoApprovalFocusY");
  const photoApprovalFocusYValue = document.querySelector("#photoApprovalFocusYValue");
  const photoApprovalImageFit = document.querySelector("#photoApprovalImageFit");
  const photoApprovalManualAdjustment = document.querySelector("#photoApprovalManualAdjustment");
  const photoApprovalReplacementInput = document.querySelector("#photoApprovalReplacementInput");
  const photoApprovalNote = document.querySelector("#photoApprovalNote");
  const photoApprovalArticle = document.querySelector("#photoApprovalArticle");
  const photoApprovalPrev = document.querySelector("#photoApprovalPrev");
  const photoApprovalNext = document.querySelector("#photoApprovalNext");
  const photoApprovalContinue = document.querySelector("#photoApprovalContinue");
  const photoApprovalRunRuntime = document.querySelector("#photoApprovalRunRuntime");
  const photoApprovalRunRuntimeText = document.querySelector("#photoApprovalRunRuntimeText");
  const photoApprovalDecisionButtons = Array.from(document.querySelectorAll("[data-photo-decision]"));
  const photoFocusPresetButtons = Array.from(document.querySelectorAll("[data-photo-focus]"));
  const cheffeActionFeedback = document.querySelector("#cheffeActionFeedback");
  const cheffeActionFeedbackBadge = document.querySelector("#cheffeActionFeedbackBadge");
  const cheffeActionFeedbackTitle = document.querySelector("#cheffeActionFeedbackTitle");
  const cheffeActionFeedbackMessage = document.querySelector("#cheffeActionFeedbackMessage");
  const cheffeActionFeedbackSteps = document.querySelector("#cheffeActionFeedbackSteps");
  const cheffeActionFeedbackDetails = document.querySelector("#cheffeActionFeedbackDetails");
  const cheffeActionFeedbackClose = document.querySelector("#cheffeActionFeedbackClose");
  const quickInstructionInput = document.querySelector("#quickInstructionInput");
  const focusCommandDetails = document.querySelector("#focusCommandDetails");
  const quickNextSpeaker = document.querySelector("#quickNextSpeaker");
  const quickRefreshAgents = document.querySelector("#quickRefreshAgents");
  const officeOfDayEl = document.querySelector("#officeOfDay");
  const officeOfDayMetaEl = document.querySelector("#officeOfDayMeta");
  const actionOfDayEl = document.querySelector("#actionOfDay");
  const actionOfDayMetaEl = document.querySelector("#actionOfDayMeta");
  const achievementHeadlineEl = document.querySelector("#achievementHeadline");
  const achievementChaseLineEl = document.querySelector("#achievementChaseLine");
  const achievementHourLeaderEl = document.querySelector("#achievementHourLeader");
  const achievementHourMetaEl = document.querySelector("#achievementHourMeta");
  const achievementDayLeaderEl = document.querySelector("#achievementDayLeader");
  const achievementDayMetaEl = document.querySelector("#achievementDayMeta");
  const achievementWeekLeaderEl = document.querySelector("#achievementWeekLeader");
  const achievementWeekMetaEl = document.querySelector("#achievementWeekMeta");
  const achievementMonthLeaderEl = document.querySelector("#achievementMonthLeader");
  const achievementMonthMetaEl = document.querySelector("#achievementMonthMeta");
  const adminRuntimeStateEl = document.querySelector("#adminRuntimeState");
  const adminRuntimeMetaEl = document.querySelector("#adminRuntimeMeta");
  const adminSessionStateEl = document.querySelector("#adminSessionState");
  const adminSessionMetaEl = document.querySelector("#adminSessionMeta");
  const adminLastActionStateEl = document.querySelector("#adminLastActionState");
  const adminLastActionMetaEl = document.querySelector("#adminLastActionMeta");
  const adminRunAgentsNow = document.querySelector("#adminRunAgentsNow");
  const adminReleaseRoom = document.querySelector("#adminReleaseRoom");
  const adminClearSession = document.querySelector("#adminClearSession");
  const adminExportSnapshot = document.querySelector("#adminExportSnapshot");
  const adminOpenRealAgents = document.querySelector("#adminOpenRealAgents");
  const callMapSummary = document.querySelector("#callMapSummary");
  const callMapList = document.querySelector("#callMapList");
  const theaterEl = document.querySelector(".bitmap-theater");
  const lowerDecksEl = document.querySelector(".call-lower-decks");
  const theaterStackEl = document.querySelector(".theater-stack");
  const meetingTableEl = document.querySelector(".meeting-table");
  const stagePlatformEl = document.querySelector(".stage-platform");
  const instructionInput = formEl?.querySelector('[name="instruction"]');
  const commandInput = formEl?.querySelector('[name="command"]');
  const promptModeSelect = document.querySelector("#promptModeSelect");
  const promptOfficeSelect = document.querySelector("#promptOfficeSelect");
  const promptAgentSelect = document.querySelector("#promptAgentSelect");
  const promptPreviewTitle = document.querySelector("#promptPreviewTitle");
  const promptPreviewBadge = document.querySelector("#promptPreviewBadge");
  const promptPreviewText = document.querySelector("#promptPreviewText");
  const promptConsoleMeta = document.querySelector("#promptConsoleMeta");
  const loadPromptToInstruction = document.querySelector("#loadPromptToInstruction");
  const loadPromptToTerminal = document.querySelector("#loadPromptToTerminal");
  const copyPromptText = document.querySelector("#copyPromptText");
  const callReportSummary = document.querySelector("#callReportSummary");
  const callReportQueue = document.querySelector("#callReportQueue");
  const callReportOffices = document.querySelector("#callReportOffices");
  const callReportActions = document.querySelector("#callReportActions");
  const callReportLogs = document.querySelector("#callReportLogs");
  const realFlowSteps = Array.from(document.querySelectorAll("[data-flow-step]"));

  const fallbackAgents = [
    { agent: "Codex CEO", office: "Comando", role: "prioridade", score: 92 },
    { agent: "Editora Ari", office: "Jornal", role: "manchete", score: 88 },
    { agent: "Revisor Bento", office: "Qualidade", role: "revisão", score: 84 },
    { agent: "Lia Copy", office: "Texto", role: "copy", score: 83 },
    { agent: "Dara Design", office: "Criação", role: "visual", score: 82 },
    { agent: "Pixo", office: "Pixel Art", role: "sprites", score: 81 },
    { agent: "Kai Gamer", office: "Games", role: "loop", score: 79 },
    { agent: "Téo Dev", office: "Sistema", role: "terminal", score: 78 },
    { agent: "Nina Texto", office: "Texto", role: "clareza", score: 77 },
    { agent: "Vera Vendas", office: "Promo", role: "pontuação", score: 76 },
    { agent: "Nico Study", office: "Fontes", role: "contexto", score: 75 },
    { agent: "Mila Kids", office: "Família", role: "leveza", score: 74 }
  ];
  let currentAgentOfDay = null;
  let currentRealAgents = [];
  let currentOpinions = [];
  let activeSpeakerIndex = 0;
  let meetingLogs = [];
  let taskQueue = [];
  let raisedHandName = "";
  let raisedHandQueue = [];
  let promptConsoleData = null;
  let activePromptPayload = { title: "Prompt supremo", badge: "Cheffe Call", text: "" };
  let lowerDecksOpen = false;
  let currentMeetingSessionId = "";
  let latestCallPayload = null;
  let cheffeAdminPassword = window.sessionStorage.getItem("cheffeCallFullAdminPassword") || "";
  let photoApprovalQueue = [];
  let photoApprovalIndex = 0;
  let photoApprovalBusy = false;
  let actionFeedbackTimer = 0;
  let latestOpinionFlow = [];

  function rectToPercent(rect, rootRect) {
    if (!rect || !rootRect || !rootRect.width || !rootRect.height) return null;
    return {
      x: Number((((rect.left - rootRect.left) / rootRect.width) * 100).toFixed(2)),
      y: Number((((rect.top - rootRect.top) / rootRect.height) * 100).toFixed(2)),
      width: Number(((rect.width / rootRect.width) * 100).toFixed(2)),
      height: Number(((rect.height / rootRect.height) * 100).toFixed(2))
    };
  }

  function getSeatGridMeta() {
    const mobile = window.matchMedia("(max-width: 980px)").matches;
    return {
      columns: mobile ? 10 : 20,
      rows: mobile ? 19 : 10,
      orientation: "virados para o palco sul",
      anchor: "tronco no assento / cabeça acima do encosto"
    };
  }

  function buildSceneMap() {
    const rootRect = theaterStackEl?.getBoundingClientRect();
    if (!rootRect) return null;
    const zones = [
      {
        key: "audience",
        label: "Plateia",
        role: "Grade de cadeiras onde ficam os 181 agentes.",
        rect: rectToPercent(audienceEl?.getBoundingClientRect(), rootRect)
      },
      {
        key: "podium",
        label: "Púlpito",
        role: "Mesa central de fala do comando.",
        rect: rectToPercent(meetingTableEl?.getBoundingClientRect(), rootRect)
      },
      {
        key: "stage",
        label: "Palco sul",
        role: "Área do avatar principal em 2D, de costas para a plateia.",
        rect: rectToPercent(stagePlatformEl?.getBoundingClientRect(), rootRect)
      },
      {
        key: "speakerBubble",
        label: "Bolha de fala",
        role: "Card do agente ativo com as ações da fala.",
        rect: rectToPercent(speechBubbleEl?.getBoundingClientRect(), rootRect)
      },
      {
        key: "raisedHands",
        label: "Fila de fala",
        role: "Zona dos agentes com mão levantada aguardando vez.",
        rect: rectToPercent(raisedHandBoard?.getBoundingClientRect(), rootRect)
      }
    ].filter((item) => item.rect);

    return {
      root: {
        width: Math.round(rootRect.width),
        height: Math.round(rootRect.height)
      },
      stageDirection: "south",
      seatGrid: getSeatGridMeta(),
      zones
    };
  }

  function renderSceneMap() {
    const sceneMap = buildSceneMap();
    if (!sceneMap) return;
    if (callMapSummary) {
      callMapSummary.textContent = `Mapa ativo: palco ao sul, ${sceneMap.seatGrid.columns} colunas de assentos e ${sceneMap.zones.length} zonas nomeadas com coordenadas reais da cena.`;
    }
    if (callMapList) {
      callMapList.innerHTML = sceneMap.zones
        .map(
          (zone) => `
            <article class="call-map-item">
              <span>${escapeHtml(zone.key)}</span>
              <strong>${escapeHtml(zone.label)}</strong>
              <p>${escapeHtml(zone.role)} x:${zone.rect.x}% y:${zone.rect.y}% w:${zone.rect.width}% h:${zone.rect.height}%</p>
            </article>
          `
        )
        .join("");
    }
    window.cheffe_call_scene_map = sceneMap;
  }

  function syncGameShellState() {
    document.body.classList.toggle("call-hud-hidden", document.body.dataset.hud === "hidden");
    document.body.classList.toggle("call-lower-open", lowerDecksOpen);
    if (lowerDecksEl) lowerDecksEl.setAttribute("aria-hidden", lowerDecksOpen ? "false" : "true");
    window.dispatchEvent(
      new CustomEvent("cheffe-call:scene-state", {
        detail: {
          hudHidden: document.body.dataset.hud === "hidden",
          lowerDecksOpen,
          speaker: currentOpinions[activeSpeakerIndex % Math.max(1, currentOpinions.length)] || null
        }
      })
    );
  }

  async function toggleFullscreen() {
    const root = document.documentElement;
    try {
      if (!document.fullscreenElement) {
        await root.requestFullscreen?.();
      } else {
        await document.exitFullscreen?.();
      }
    } catch (_error) {
      setStatus("Nao foi possivel alternar tela cheia agora.", "bad");
    }
  }

  function toggleHudVisibility() {
    document.body.dataset.hud = document.body.dataset.hud === "hidden" ? "visible" : "hidden";
    syncGameShellState();
  }

  function toggleLowerDecksVisibility(forceState) {
    lowerDecksOpen = typeof forceState === "boolean" ? forceState : !lowerDecksOpen;
    syncGameShellState();
  }

  function slugify(value) {
    return String(value || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function getActiveSession(payload = latestCallPayload) {
    return payload?.meeting?.currentSession || payload?.meeting?.sessions?.[0] || null;
  }

  function buildSessionSummaryText(payload = latestCallPayload) {
    const session = getActiveSession(payload);
    const logs = Array.isArray(session?.logs) ? session.logs : [];
    const decisions = Array.isArray(session?.decisions) ? session.decisions : [];
    const lastLog = logs[0];
    const lastDecision = decisions[0];
    return [
      `Status: ${session?.status || (payload?.meeting?.active ? "reunião ativa" : "sem reunião ativa")}`,
      `Assunto: ${session?.instruction || payload?.meeting?.lastInstruction || "nenhum assunto ativo"}`,
      `Fila ativa: ${decisions.length}`,
      `Logs: ${logs.length}`,
      lastDecision ? `Última decisão: ${lastDecision.kindLabel || lastDecision.state || "decisão"} - ${lastDecision.title || lastDecision.text || ""}` : "Última decisão: nenhuma",
      lastLog ? `Último log: ${lastLog.kindLabel || "log"} - ${lastLog.text || ""}` : "Último log: nenhum"
    ].join("\n");
  }

  function buildFullLogText(payload = latestCallPayload) {
    const session = getActiveSession(payload);
    const logs = Array.isArray(session?.logs) ? session.logs : [];
    const decisions = Array.isArray(session?.decisions) ? session.decisions : [];
    const logLines = logs.length
      ? logs.map((item, index) => `${index + 1}. ${item.kindLabel || "log"} | ${item.agent || "Cheffe Call"} | ${item.text || ""}`)
      : ["Sem logs registrados."];
    const decisionLines = decisions.length
      ? decisions.map((item, index) => `${index + 1}. ${item.kindLabel || item.state || "fila"} | ${item.agent || "Cheffe Call"} | ${item.title || item.text || ""}`)
      : ["Sem decisões na fila."];
    return [
      "RESUMO",
      buildSessionSummaryText(payload),
      "",
      "FILA / DECISÕES",
      ...decisionLines,
      "",
      "LOG COMPLETO",
      ...logLines
    ].join("\n");
  }

  function openCheffeInfoPopup(title, text) {
    let modal = document.querySelector("#cheffeInfoPopup");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "cheffeInfoPopup";
      modal.className = "cheffe-info-popup";
      modal.innerHTML = `
        <div class="cheffe-info-card" role="dialog" aria-modal="true" aria-labelledby="cheffeInfoTitle">
          <div class="cheffe-info-head">
            <h2 id="cheffeInfoTitle"></h2>
            <button type="button" data-cheffe-info-close>Fechar</button>
          </div>
          <pre id="cheffeInfoText"></pre>
        </div>
      `;
      document.body.appendChild(modal);
      modal.addEventListener("click", (event) => {
        if (event.target === modal || event.target.closest("[data-cheffe-info-close]")) {
          modal.classList.remove("is-open");
        }
      });
    }
    modal.querySelector("#cheffeInfoTitle").textContent = title;
    modal.querySelector("#cheffeInfoText").textContent = text;
    modal.classList.add("is-open");
  }

  function setStatus(message, tone) {
    if (!statusEl) return;
    statusEl.textContent = message;
    statusEl.style.color = tone === "bad" ? "var(--call-red)" : tone === "ok" ? "var(--call-green)" : "";
  }

  function setPasswordStatus(message, tone) {
    if (!quickPasswordStatus) return;
    quickPasswordStatus.textContent = message;
    quickPasswordStatus.dataset.tone = tone || "";
  }

  function renderActionFeedbackSteps(steps = []) {
    if (!cheffeActionFeedbackSteps) return;
    cheffeActionFeedbackSteps.innerHTML = "";
    steps.forEach((step) => {
      const item = document.createElement("li");
      const state = typeof step === "object" ? step.state || "pending" : "pending";
      item.dataset.state = state;
      item.textContent = typeof step === "object" ? step.label || "" : String(step || "");
      cheffeActionFeedbackSteps.append(item);
    });
  }

  function setActionFeedback(options = {}) {
    if (!cheffeActionFeedback) return;
    window.clearTimeout(actionFeedbackTimer);
    const tone = options.tone || "pending";
    cheffeActionFeedback.hidden = false;
    cheffeActionFeedback.dataset.tone = tone;
    cheffeActionFeedback.classList.add("is-open");
    if (cheffeActionFeedbackBadge) cheffeActionFeedbackBadge.textContent = options.badge || "Runtime";
    if (cheffeActionFeedbackTitle) cheffeActionFeedbackTitle.textContent = options.title || "Processando ação";
    if (cheffeActionFeedbackMessage) {
      cheffeActionFeedbackMessage.textContent = options.message || "A Cheffe Call está processando a solicitação.";
    }
    renderActionFeedbackSteps(options.steps || []);
    if (cheffeActionFeedbackDetails) {
      const details = String(options.details || "").trim();
      cheffeActionFeedbackDetails.textContent = details;
      cheffeActionFeedbackDetails.hidden = !details;
    }
    cheffeActionFeedbackClose?.toggleAttribute("hidden", options.closable === false);
    if (options.autoCloseMs) {
      actionFeedbackTimer = window.setTimeout(() => closeActionFeedback(), Number(options.autoCloseMs) || 2200);
    }
  }

  function closeActionFeedback() {
    if (!cheffeActionFeedback) return;
    window.clearTimeout(actionFeedbackTimer);
    cheffeActionFeedback.classList.remove("is-open");
    cheffeActionFeedback.hidden = true;
  }

  function formatFeedbackTime(value = "") {
    const date = new Date(value);
    if (!Number.isFinite(date.getTime())) return String(value || "");
    return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  }

  function buildRuntimeFeedbackDetails(payload = {}) {
    const runtime = payload.runtime || payload.runtimeSummary || {};
    const runtimeSummary = runtime.summary || runtime;
    const publicSummary = payload.summary || {};
    const imageApprovals = runtime.imageApprovals || {};
    const appliedCount = [
      runtimeSummary.imageApprovalsApplied,
      imageApprovals.applied,
      publicSummary.imageApprovalsApplied
    ].find((value) => Number.isFinite(Number(value)));
    const sentToAgentsCount = [
      runtimeSummary.imageApprovalsSentToAgents,
      imageApprovals.sentToAgents,
      publicSummary.imageApprovalsSentToAgents
    ].find((value) => Number.isFinite(Number(value)));
    const lines = [
      publicSummary.totalAgents ? `${publicSummary.totalAgents} agentes visíveis` : "",
      publicSummary.averageAutonomy ? `Autonomia média ${publicSummary.averageAutonomy}%` : "",
      Number.isFinite(Number(appliedCount)) ? `Foto/foco aplicado: ${appliedCount}` : "",
      Number.isFinite(Number(sentToAgentsCount)) ? `Foto/foco para refazer: ${sentToAgentsCount}` : "",
      publicSummary.lastRunAt ? `Última runtime: ${formatFeedbackTime(publicSummary.lastRunAt)}` : ""
    ];
    return lines.filter(Boolean).join("\n");
  }

  function getDecisionFeedbackLabel(decision = "") {
    return {
      "approve-focus": "Aprovar foco",
      "swap-image": "Trocar imagem",
      "keep-fallback": "Manter fallback",
      redo: "Refazer"
    }[decision] || "Registrar decisão";
  }

  function resetPhotoApprovalGate() {
    photoApprovalQueue = [];
    photoApprovalIndex = 0;
    photoApprovalBusy = false;
    if (cheffePhotoApproval) cheffePhotoApproval.hidden = true;
    cheffeAccessCard?.classList.remove("is-reviewing-photos");
    cheffeAccessModal?.classList.remove("has-photo-approval");
    photoApprovalDecisionButtons.forEach((button) => {
      button.disabled = false;
    });
    if (photoApprovalPrev) photoApprovalPrev.disabled = false;
    if (photoApprovalNext) photoApprovalNext.disabled = false;
    if (photoApprovalContinue) photoApprovalContinue.disabled = false;
    if (photoApprovalRunRuntime) photoApprovalRunRuntime.checked = false;
  }

  function openAccessModal(message = "Digite a senha Full Admin para entrar na Cheffe Call.", tone = "") {
    resetPhotoApprovalGate();
    cheffeAccessModal?.classList.remove("is-unlocked");
    document.body.classList.add("cheffe-access-locked");
    setPasswordStatus(message, tone);
    setTimeout(() => quickPasswordInput?.focus(), 30);
  }

  function closeAccessModal() {
    cheffeAccessModal?.classList.add("is-unlocked");
    document.body.classList.remove("cheffe-access-locked");
    resetPhotoApprovalGate();
  }

  function getAdminPassword() {
    const formPassword = formEl ? String(new FormData(formEl).get("password") || "").trim() : "";
    const quickPassword = quickPasswordInput ? String(quickPasswordInput.value || "").trim() : "";
    return quickPassword || formPassword || cheffeAdminPassword;
  }

  function rememberAdminPassword(password, options = {}) {
    const cleanPassword = String(password || "").trim();
    if (!cleanPassword) return;
    cheffeAdminPassword = cleanPassword;
    if (quickPasswordInput && quickPasswordInput.value !== cleanPassword) quickPasswordInput.value = cleanPassword;
    const formPasswordInput = formEl?.querySelector('[name="password"]');
    if (formPasswordInput && formPasswordInput.value !== cleanPassword) formPasswordInput.value = cleanPassword;
    try {
      window.sessionStorage.setItem("cheffeCallFullAdminPassword", cleanPassword);
    } catch (_error) {
      // ignore storage failures
    }
    if (options.close !== false) closeAccessModal();
  }

  async function validateAdminPassword(password) {
    const response = await fetch("/api/real-agents/access", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ password }),
      cache: "no-store"
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || !payload.ok) {
      throw new Error(payload.error || "Senha Full Admin recusada.");
    }
    return payload;
  }

  async function loadRealAgentsReport(password) {
    const response = await fetch(`/api/real-agents?password=${encodeURIComponent(password)}`, {
      headers: { Accept: "application/json" },
      cache: "no-store"
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || !payload.ok) {
      throw new Error(payload.error || "Nao foi possivel carregar agentes reais.");
    }
    return payload;
  }

  function getPhotoApprovalDecisionStatus(item = {}) {
    return String(item.decision?.status || item.latestDecision?.status || item.decisionStatus || "").trim();
  }

  function isPhotoApprovalRuntimeStatus(status = "") {
    return ["queued-for-runtime", "queued-for-agents"].includes(String(status || "").trim());
  }

  function getPhotoApprovalStats(queue = photoApprovalQueue) {
    const list = Array.isArray(queue) ? queue : [];
    const decided = list.filter((entry) => entry.decision).length;
    const pending = list.filter((entry) => !entry.decision).length;
    const runtimeWorkCount = list.filter((entry) => isPhotoApprovalRuntimeStatus(getPhotoApprovalDecisionStatus(entry))).length;
    return {
      total: list.length,
      decided,
      pending,
      runtimeWorkCount
    };
  }

  function hasPhotoApprovalRuntimeWork(payload = {}) {
    const runtimeWorkCount = Number(payload.runtimeWorkCount || 0);
    if (runtimeWorkCount > 0) return true;
    return (Array.isArray(payload.queue) ? payload.queue : []).some((item) =>
      isPhotoApprovalRuntimeStatus(getPhotoApprovalDecisionStatus(item))
    );
  }

  function normalizePhotoApprovalPayload(payload = {}) {
    const selectedQueue = Array.isArray(payload.queue)
      ? payload.queue
      : Array.isArray(payload.queue?.queue)
        ? payload.queue.queue
        : [];
    const allQueue = Array.isArray(payload.allQueue) ? payload.allQueue : [];
    const rawQueueMap = new Map();
    selectedQueue.forEach((item) => {
      const slug = String(item?.slug || "").trim();
      if (slug) rawQueueMap.set(slug, item);
    });
    allQueue.forEach((item) => {
      const slug = String(item?.slug || "").trim();
      if (!slug || rawQueueMap.has(slug)) return;
      const status = String(item?.latestDecision?.status || item?.decisionStatus || "").trim();
      if (isPhotoApprovalRuntimeStatus(status)) rawQueueMap.set(slug, item);
    });
    const rawQueue = Array.from(rawQueueMap.values());
    const queue = rawQueue.map((item) => {
      const latestDecision = item.latestDecision || item.decision || null;
      const isPending = item.pending !== false && !latestDecision;
      return {
        ...item,
        reasonLabels: Array.isArray(item.reasonLabels) && item.reasonLabels.length ? item.reasonLabels : item.reasons || [],
        decision: isPending
          ? null
          : latestDecision
            ? {
                decisionLabel: latestDecision.actionLabel || latestDecision.decisionLabel || latestDecision.action || "decidido",
                action: latestDecision.action || latestDecision.decision || "",
                status: latestDecision.status || item.decisionStatus || "",
                focus: latestDecision.focus || "",
                imageFit: latestDecision.imageFit || "",
                manualAdjustment: latestDecision.manualAdjustment || "",
                replacementImageUrl: latestDecision.replacementImageUrl || "",
                note: latestDecision.note || ""
              }
            : null
      };
    });
    const stats = getPhotoApprovalStats(queue);
    return {
      ...payload,
      queue,
      pendingCount: stats.pending,
      decidedCount: stats.decided,
      runtimeWorkCount: stats.runtimeWorkCount
    };
  }

  async function fetchPhotoApprovals(password) {
    const response = await fetch(`/api/news-image-focus-approvals?newOnly=true&password=${encodeURIComponent(password)}`, {
      headers: { Accept: "application/json" },
      cache: "no-store"
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || !payload.ok) {
      throw new Error(payload.error || "Nao foi possivel carregar a fila de foto/foco.");
    }
    return normalizePhotoApprovalPayload(payload);
  }

  function setPhotoApprovalBusy(isBusy) {
    photoApprovalBusy = Boolean(isBusy);
    photoApprovalDecisionButtons.forEach((button) => {
      button.disabled = photoApprovalBusy;
    });
    if (photoApprovalPrev) photoApprovalPrev.disabled = photoApprovalBusy || photoApprovalIndex <= 0;
    if (photoApprovalNext) photoApprovalNext.disabled = photoApprovalBusy || photoApprovalIndex >= photoApprovalQueue.length - 1;
    if (photoApprovalContinue) photoApprovalContinue.disabled = photoApprovalBusy;
  }

  function updatePhotoApprovalRuntimeControls() {
    const stats = getPhotoApprovalStats();
    const shouldRun = Boolean(photoApprovalRunRuntime?.checked);
    if (photoApprovalRunRuntimeText) {
      photoApprovalRunRuntimeText.textContent = shouldRun
        ? "Rodar agentes e aplicar ao continuar"
        : "Abrir sala sem aplicar agora";
    }
    if (photoApprovalContinue) {
      if (shouldRun && stats.runtimeWorkCount > 0) {
        photoApprovalContinue.textContent = `Rodar ${stats.runtimeWorkCount} e abrir sala`;
      } else if (shouldRun) {
        photoApprovalContinue.textContent = "Rodar agentes e abrir sala";
      } else if (stats.runtimeWorkCount > 0) {
        photoApprovalContinue.textContent = "Abrir sem aplicar";
      } else {
        photoApprovalContinue.textContent = "Continuar para sala";
      }
    }
  }

  function getPhotoApprovalItem() {
    return photoApprovalQueue[photoApprovalIndex] || null;
  }

  function findNextPendingPhotoIndex(startIndex = 0) {
    if (!photoApprovalQueue.length) return 0;
    for (let step = 0; step < photoApprovalQueue.length; step += 1) {
      const index = (startIndex + step) % photoApprovalQueue.length;
      if (!photoApprovalQueue[index]?.decision) return index;
    }
    return Math.min(Math.max(startIndex, 0), photoApprovalQueue.length - 1);
  }

  function syncPhotoFocusPreview() {
    if (!photoApprovalImage || !photoApprovalFocus) return;
    photoApprovalImage.style.objectPosition = photoApprovalFocus.value || "center 42%";
    photoApprovalImage.style.objectFit = photoApprovalImageFit?.value || "cover";
  }

  function parsePhotoFocus(value = "") {
    const raw = String(value || "center 42%").trim().toLowerCase();
    const [xRaw = "center", yRaw = "42%"] = raw.split(/\s+/);
    const x = ["left", "center", "right"].includes(xRaw) ? xRaw : "center";
    const yMap = { top: 30, center: 50, bottom: 66 };
    const yNumber = yRaw.endsWith("%") ? Number.parseInt(yRaw, 10) : yMap[yRaw] || 42;
    const y = Math.max(24, Math.min(76, Number.isFinite(yNumber) ? yNumber : 42));
    return { x, y };
  }

  function syncPhotoManualControls(value = "") {
    const focus = parsePhotoFocus(value || photoApprovalFocus?.value || "center 42%");
    if (photoApprovalFocusX) photoApprovalFocusX.value = focus.x;
    if (photoApprovalFocusY) photoApprovalFocusY.value = String(focus.y);
    if (photoApprovalFocusYValue) photoApprovalFocusYValue.textContent = `${focus.y}%`;
  }

  function getManualPhotoFocusValue() {
    const x = photoApprovalFocusX?.value || "center";
    const y = Number.parseInt(photoApprovalFocusY?.value || "42", 10);
    return `${x} ${Math.max(24, Math.min(76, Number.isFinite(y) ? y : 42))}%`;
  }

  function setPhotoFocusValue(value) {
    if (!photoApprovalFocus) return;
    const cleanValue = String(value || "center 42%").trim() || "center 42%";
    const hasOption = Array.from(photoApprovalFocus.options).some((option) => option.value === cleanValue);
    if (!hasOption) {
      const option = document.createElement("option");
      option.value = cleanValue;
      option.textContent = cleanValue;
      photoApprovalFocus.append(option);
    }
    photoApprovalFocus.value = cleanValue;
    syncPhotoManualControls(cleanValue);
    syncPhotoFocusPreview();
  }

  function renderPhotoApprovalReasons(item) {
    if (!photoApprovalReasons) return;
    photoApprovalReasons.innerHTML = "";
    const labels = (Array.isArray(item?.reasonLabels) && item.reasonLabels.length ? item.reasonLabels : item?.reasons || [])
      .map((label) => String(label || "").trim())
      .filter(Boolean);
    if (!labels.length) {
      const span = document.createElement("span");
      span.textContent = "revisao visual";
      photoApprovalReasons.append(span);
      return;
    }
    labels.slice(0, 5).forEach((label) => {
      const span = document.createElement("span");
      span.textContent = label;
      photoApprovalReasons.append(span);
    });
  }

  function renderPhotoApprovalItem() {
    const item = getPhotoApprovalItem();
    const { total, decided, pending, runtimeWorkCount } = getPhotoApprovalStats();

    if (photoApprovalCounter) {
      photoApprovalCounter.textContent = runtimeWorkCount > 0 && pending <= 0
        ? `${runtimeWorkCount} para rodar`
        : `${pending} pendente${pending === 1 ? "" : "s"}`;
    }
    if (photoApprovalSummary) {
      photoApprovalSummary.textContent = total
        ? [
            `${total} ${total === 1 ? "item" : "itens"} da auditoria de foto/foco`,
            `${decided} já decidido${decided === 1 ? "" : "s"}`,
            runtimeWorkCount > 0 ? `${runtimeWorkCount} aguardando runtime` : ""
          ].filter(Boolean).join(", ") + "."
        : "Sem bloqueio visual pendente.";
    }
    if (photoApprovalProgress) photoApprovalProgress.textContent = total ? `${photoApprovalIndex + 1}/${total}` : "0/0";
    if (photoApprovalList) {
      photoApprovalList.innerHTML = "";
      photoApprovalQueue.forEach((entry, index) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = [
          "photo-approval-queue-item",
          index === photoApprovalIndex ? "is-active" : "",
          entry.decision ? "is-decided" : ""
        ].filter(Boolean).join(" ");
        button.disabled = photoApprovalBusy;
        const title = document.createElement("strong");
        title.textContent = entry.title || entry.slug || "Item sem titulo";
        const meta = document.createElement("span");
        meta.textContent = entry.decision?.decisionLabel || entry.sourceName || "aguardando decisao";
        button.append(title, meta);
        button.addEventListener("click", () => {
          if (photoApprovalBusy) return;
          photoApprovalIndex = index;
          renderPhotoApprovalItem();
        });
        photoApprovalList.append(button);
      });
    }

    if (!item) {
      if (photoApprovalTitle) photoApprovalTitle.textContent = "Fila limpa";
      if (photoApprovalMeta) photoApprovalMeta.textContent = "Nenhuma decisao pendente agora.";
      if (photoApprovalImage) {
        photoApprovalImage.removeAttribute("src");
        photoApprovalImage.alt = "";
      }
      if (photoApprovalImageCaption) photoApprovalImageCaption.textContent = "";
      renderPhotoApprovalReasons(null);
      setPhotoApprovalBusy(false);
      return;
    }

    if (photoApprovalTitle) photoApprovalTitle.textContent = item.title || "Sem titulo";
    if (photoApprovalMeta) {
      photoApprovalMeta.textContent = [
        item.category || "Geral",
        item.sourceName || "fonte nao informada",
        item.decision?.decisionLabel ? `decidido: ${item.decision.decisionLabel}` : "aguardando decisao"
      ]
        .filter(Boolean)
        .join(" | ");
    }
    if (photoApprovalImage) {
      if (item.imageUrl) {
        photoApprovalImage.hidden = false;
        photoApprovalImage.src = item.imageUrl;
      } else {
        photoApprovalImage.hidden = true;
        photoApprovalImage.removeAttribute("src");
      }
      photoApprovalImage.alt = item.title ? `Imagem da noticia: ${item.title}` : "Imagem da noticia";
    }
    if (photoApprovalImageCaption) {
      photoApprovalImageCaption.textContent = item.effectiveFocus
        ? `Foco atual: ${item.effectiveFocus}`
        : "Sem foco manual registrado";
    }
    if (photoApprovalArticle) {
      photoApprovalArticle.href = item.articleUrl || "noticia.html";
      photoApprovalArticle.toggleAttribute("aria-disabled", !item.articleUrl);
    }
    if (photoApprovalImageFit) photoApprovalImageFit.value = item.decision?.imageFit || item.imageFit || "cover";
    if (photoApprovalManualAdjustment) {
      photoApprovalManualAdjustment.value = item.decision?.manualAdjustment || "";
    }
    if (photoApprovalReplacementInput) photoApprovalReplacementInput.value = item.decision?.replacementImageUrl || "";
    if (photoApprovalNote) photoApprovalNote.value = item.decision?.note || "";
    setPhotoFocusValue(item.decision?.focus || item.effectiveFocus || item.suggestedFocus || "center 42%");
    renderPhotoApprovalReasons(item);
    updatePhotoApprovalRuntimeControls();
    setPhotoApprovalBusy(false);
  }

  function openPhotoApprovalQueue(payload) {
    photoApprovalQueue = Array.isArray(payload?.queue) ? payload.queue : [];
    photoApprovalIndex = findNextPendingPhotoIndex(0);
    const stats = getPhotoApprovalStats();
    if (photoApprovalRunRuntime) photoApprovalRunRuntime.checked = true;
    cheffePhotoApproval.hidden = false;
    cheffeAccessCard?.classList.add("is-reviewing-photos");
    cheffeAccessModal?.classList.add("has-photo-approval");
    setPasswordStatus(
      stats.pending > 0
        ? "Senha validada. Revise a fila de foto/foco antes de abrir a sala."
        : `${stats.runtimeWorkCount} decisao${stats.runtimeWorkCount === 1 ? "" : "es"} salva${stats.runtimeWorkCount === 1 ? "" : "s"}. Rode agentes para aplicar antes de abrir a sala.`,
      "pending"
    );
    setStatus("Fila de foto/foco carregada no acesso da Cheffe Call.", "ok");
    renderPhotoApprovalItem();
  }

  async function runAgentsFromAccessGate(password) {
    setActionFeedback({
      badge: "Runtime",
      title: "Rodando agentes agora",
      message: "A fila aprovada foi enviada para a runtime dos agentes.",
      tone: "pending",
      closable: false,
      steps: [
        { label: "Autorização Full Admin validada", state: "done" },
        { label: "Agentes reais em execução", state: "running" },
        { label: "Atualizando sala da Cheffe Call", state: "pending" }
      ]
    });
    const response = await fetch("/api/real-agents/run", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        password,
        message: "Rodada manual disparada pelo popup de aprovacao de foto/foco da Cheffe Call."
      })
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || !payload.ok) {
      throw new Error(payload.error || "Falha ao rodar agentes.");
    }
    setActionFeedback({
      badge: "Runtime",
      title: "Agentes finalizaram",
      message: "Runtime concluída. Atualizando a sala com o feedback dos agentes.",
      tone: "ok",
      steps: [
        { label: "Autorização Full Admin validada", state: "done" },
        { label: "Agentes reais executados", state: "done" },
        { label: "Sala sendo atualizada", state: "running" }
      ],
      details: buildRuntimeFeedbackDetails(payload),
      closable: true
    });
    return payload;
  }

  async function enterCheffeRoom(message = "Senha validada. Sala liberada.") {
    const password = getAdminPassword();
    const shouldRunAgents = Boolean(photoApprovalRunRuntime?.checked);
    closeAccessModal();
    setPasswordStatus(message, "ok");
    try {
      if (shouldRunAgents) {
        setStatus("Rodando agentes reais antes de abrir a sala...");
        await runAgentsFromAccessGate(password);
      }
      await loadCall();
      if (shouldRunAgents) {
        setActionFeedback({
          badge: "Finalizado",
          title: "Sala atualizada",
          message: "Os agentes terminaram e a Cheffe Call já recebeu o feedback da runtime.",
          tone: "ok",
          steps: [
            { label: "Agentes reais executados", state: "done" },
            { label: "Feedback carregado na sala", state: "done" },
            { label: "Fluxo normal liberado", state: "done" }
          ],
          details: "",
          closable: true
        });
      } else {
        setActionFeedback({
          badge: "Sala",
          title: "Cheffe Call liberada",
          message: "A sala abriu sem rodar agentes agora. As decisões pendentes continuam na fila.",
          tone: "ok",
          steps: [
            { label: "Senha validada", state: "done" },
            { label: "Fila mantida para próxima runtime", state: "done" }
          ],
          closable: true,
          autoCloseMs: 3600
        });
      }
      setStatus(
        shouldRunAgents
          ? "Rodada manual dos agentes concluida e sala atualizada."
          : "Cheffe Call liberada. Escreva uma ordem e clique Enviar.",
        "ok"
      );
      quickInstructionInput?.focus();
    } catch (error) {
      setActionFeedback({
        badge: "Falha",
        title: "Ação não concluída",
        message: error.message || "Não foi possível abrir a Cheffe Call.",
        tone: "bad",
        steps: [
          { label: "Ação interrompida", state: "bad" },
          { label: "Sala preservada sem gravar nova etapa", state: "pending" }
        ],
        closable: true
      });
      setStatus(error.message || "Nao foi possivel abrir a Cheffe Call.", "bad");
    }
  }

  async function submitPhotoApprovalDecision(decision) {
    const item = getPhotoApprovalItem();
    const password = getAdminPassword();
    if (!item || !password || photoApprovalBusy) return;
    setPhotoApprovalBusy(true);
    setPasswordStatus("Registrando decisao de foto/foco...", "pending");
    const decisionLabel = getDecisionFeedbackLabel(decision);
    setActionFeedback({
      badge: "Fila visual",
      title: "Registrando decisão",
      message: `${decisionLabel}: ${item.title || item.slug || "item da fila"}`,
      tone: "pending",
      closable: false,
      steps: [
        { label: "Decisão enviada ao administrador", state: "running" },
        { label: "Ordem para agentes preparada", state: "pending" },
        { label: "Fila será recarregada", state: "pending" }
      ]
    });
    try {
      const response = await fetch("/api/news-image-focus-approvals", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          password,
          slug: item.slug,
          decision,
          focus: photoApprovalFocus?.value || item.effectiveFocus || item.suggestedFocus || "",
          imageFit: photoApprovalImageFit?.value || "cover",
          manualAdjustment: photoApprovalManualAdjustment?.value || "",
          replacementImageUrl: photoApprovalReplacementInput?.value || "",
          note: photoApprovalNote?.value || ""
        })
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.ok) {
        throw new Error(payload.error || "Falha ao registrar decisao de foto/foco.");
      }
      const normalizedPayload = await fetchPhotoApprovals(password);
      photoApprovalQueue = Array.isArray(normalizedPayload.queue) ? normalizedPayload.queue : photoApprovalQueue;
      const stats = getPhotoApprovalStats();
      if (photoApprovalRunRuntime && stats.runtimeWorkCount > 0) photoApprovalRunRuntime.checked = true;
      setPasswordStatus("Decisao registrada para a runtime.", "ok");
      setActionFeedback({
        badge: "Fila visual",
        title: "Decisão salva",
        message: `${decisionLabel} registrado. A runtime vai aplicar antes de abrir a sala.`,
        tone: "ok",
        steps: [
          { label: "Decisão gravada", state: "done" },
          { label: "Ordem pronta para runtime", state: "done" },
          { label: "Fila atualizada", state: "done" }
        ],
        details: [
          `Foco: ${photoApprovalFocus?.value || item.suggestedFocus || "sem foco"}`,
          `Fit: ${photoApprovalImageFit?.value || "cover"}`,
          photoApprovalManualAdjustment?.value ? `Ajuste: ${photoApprovalManualAdjustment.value}` : ""
        ].filter(Boolean).join("\n"),
        closable: true,
        autoCloseMs: 2600
      });
      if (Number(normalizedPayload.pendingCount || 0) <= 0) {
        await enterCheffeRoom("Fila de foto/foco registrada. Rodando agentes antes de abrir a sala.");
        return;
      }
      photoApprovalIndex = findNextPendingPhotoIndex(photoApprovalIndex + 1);
      renderPhotoApprovalItem();
    } catch (error) {
      setPasswordStatus(error.message || "Falha ao registrar decisao.", "bad");
      setStatus(error.message || "Falha ao registrar decisao de foto/foco.", "bad");
      setActionFeedback({
        badge: "Falha",
        title: "Decisão não registrada",
        message: error.message || "Falha ao registrar decisão de foto/foco.",
        tone: "bad",
        steps: [
          { label: "Servidor recusou a decisão", state: "bad" },
          { label: "Item continua na fila", state: "pending" }
        ],
        closable: true
      });
      setPhotoApprovalBusy(false);
    }
  }

  function requireAdminPassword(actionLabel = "operar a Cheffe Call") {
    const password = getAdminPassword();
    if (password) return password;
    setStatus(`Digite a senha Full Admin para ${actionLabel}.`, "bad");
    openAccessModal("Senha obrigatória para liberar a Cheffe Call.", "bad");
    return "";
  }

  function updatePromptPreview(payload) {
    activePromptPayload = payload || activePromptPayload;
    if (promptPreviewTitle) promptPreviewTitle.textContent = activePromptPayload.title || "Prompt";
    if (promptPreviewBadge) promptPreviewBadge.textContent = activePromptPayload.badge || "Cheffe Call";
    if (promptPreviewText) promptPreviewText.textContent = activePromptPayload.text || "";
  }

  function getActivePromptText() {
    return String(activePromptPayload?.text || promptPreviewText?.textContent || "").trim();
  }

  function syncVisibleInstruction(value) {
    const text = String(value || "").trim();
    if (instructionInput) instructionInput.value = text;
    if (quickInstructionInput) quickInstructionInput.value = text;
    quickInstructionInput?.focus();
  }

  function setCommandBarPulse() {
    commandBarEl?.classList.remove("is-pulsing");
    window.requestAnimationFrame(() => {
      commandBarEl?.classList.add("is-pulsing");
      window.setTimeout(() => commandBarEl?.classList.remove("is-pulsing"), 1200);
    });
  }

  function fillSelect(select, options, placeholder) {
    if (!select) return;
    select.innerHTML = [`<option value="">${escapeHtml(placeholder)}</option>`]
      .concat(
        options.map((item) => `<option value="${escapeHtml(item.value)}">${escapeHtml(item.label)}</option>`)
      )
      .join("");
  }

  function refreshPromptAgentOptions(selectedOffice = "") {
    if (!promptAgentSelect) return;
    const agents = Array.isArray(promptConsoleData?.agents) ? promptConsoleData.agents : [];
    const filtered = selectedOffice ? agents.filter((item) => item.office === selectedOffice) : agents;
    fillSelect(
      promptAgentSelect,
      filtered.map((item) => ({
        value: item.slug,
        label: `${item.name} • ${item.office} • ${item.role}`
      })),
      "Selecione um agente"
    );
  }

  function selectPromptPayload() {
    if (!promptConsoleData) return;
    const mode = promptModeSelect?.value || "global";
    if (mode === "global") {
      updatePromptPreview({
        title: "Prompt supremo",
        badge: "Cheffe Call",
        text: promptConsoleData.globalPrompt || ""
      });
      return;
    }

    if (mode === "office") {
      const office = promptOfficeSelect?.value || "";
      const officePrompt = (promptConsoleData.offices || []).find((item) => item.office === office);
      updatePromptPreview({
        title: officePrompt?.office || "Prompt por escritório",
        badge: officePrompt ? "Escritório" : "Cheffe Call",
        text: officePrompt?.prompt || "Escolha um escritório para carregar a diretriz da equipe."
      });
      return;
    }

    const agentSlug = promptAgentSelect?.value || "";
    const agentPrompt = (promptConsoleData.agents || []).find((item) => item.slug === agentSlug);
    updatePromptPreview({
      title: agentPrompt?.name || "Prompt por agente",
      badge: agentPrompt ? `${agentPrompt.office} • ${agentPrompt.role}` : "Agente",
      text: agentPrompt?.prompt || "Escolha um agente para abrir o prompt individual."
    });
  }

  async function copyText(value) {
    if (!value) return false;
    try {
      await navigator.clipboard.writeText(value);
      return true;
    } catch (_error) {
      return false;
    }
  }

  async function initPromptConsole() {
    if (!promptPreviewText) return;
    try {
      const response = await fetch("/api/cheffe-call/prompts", { cache: "no-store" });
      if (!response.ok) throw new Error("Nao foi possivel carregar o arquivo de prompts.");
      const payload = await response.json();
      promptConsoleData = payload?.ok ? payload : null;
      if (!promptConsoleData) throw new Error("Nao foi possivel montar a reuniao dos prompts.");
      fillSelect(
        promptOfficeSelect,
        (promptConsoleData.offices || []).map((item) => ({ value: item.office, label: item.office })),
        "Selecione um escritório"
      );
      refreshPromptAgentOptions("");
      selectPromptPayload();
      if (promptConsoleMeta) {
        promptConsoleMeta.textContent = `${promptConsoleData.totalAgents || 0} agentes carregados. Use o prompt supremo, um escritório ou um agente específico.`;
      }
    } catch (error) {
      updatePromptPreview({
        title: "Prompts indisponíveis",
        badge: "Falha",
        text: "Nao foi possivel carregar o console dos 181 agentes agora."
      });
      if (promptConsoleMeta) {
        promptConsoleMeta.textContent = String(error?.message || error || "Falha ao carregar prompts.");
      }
    }
  }

  function setModeBanner(mode, detail) {
    if (!callModeBanner) return;
    callModeBanner.dataset.mode = mode || "report";
    callModeBanner.innerHTML = `
      <span>${escapeHtml(mode === "real" ? "Runtime real" : "Relatório real")}</span>
      <strong>${escapeHtml(detail || (mode === "real" ? "Runtimes pausadas para operação" : "Consulta aberta. Comandos exigem senha Full Admin."))}</strong>
    `;
  }

  function getAgentDisplayName(item) {
    return item?.agent || item?.name || "Agente";
  }

  function getAgentOffice(item) {
    return item?.office || item?.officeLabel || "Escritório";
  }

  function getAgentScore(item) {
    return Number(item?.score || item?.autonomy?.autonomy || item?.autonomy || 0);
  }

  function hashValue(value) {
    return String(value || "")
      .split("")
      .reduce((sum, char) => sum + char.charCodeAt(0), 0);
  }

  function pickVisual(signature, values, salt = 0) {
    if (!Array.isArray(values) || !values.length) return "";
    return values[(hashValue(`${signature}:${salt}`) + salt) % values.length];
  }

  function getAgentPersona(item) {
    const spriteProfile = item?.spriteProfile || null;
    if (spriteProfile) {
      return {
        accent: spriteProfile.accent || "#7fe7ff",
        jacket: spriteProfile.jacket || spriteProfile.secondary || "#1d2740",
        accessory: spriteProfile.accessory || "badge",
        prop: spriteProfile.prop || "tablet",
        hairStyle: spriteProfile.hairStyle || "short",
        skin: spriteProfile.skin || "#f2c5a0",
        hair: spriteProfile.hair || "#17101b",
        face: spriteProfile.face || "calm",
        bodyShape: spriteProfile.bodyShape || "standard",
        pattern: spriteProfile.pattern || "plain"
      };
    }
    const signature = `${getAgentDisplayName(item)} ${getAgentOffice(item)} ${item?.role || ""}`.toLowerCase();
    const photo = item?.photo || {};
    const skin = pickVisual(signature, ["#f2c5a0", "#e8ae83", "#d99b72", "#f0d0aa", "#c98765", "#b97754"], 1);
    const hair = pickVisual(signature, ["#17101b", "#3a2419", "#24283d", "#5a351f", "#111827", "#6b4a2f", "#d7b16a"], 2);
    const profile = {
      accent: photo.primary || pickVisual(signature, ["#7fe7ff", "#f4c96b", "#73eba8", "#f56d7a", "#cda6ff", "#ff7ab6", "#ffb65c"], 3),
      jacket: photo.secondary || pickVisual(signature, ["#1d2740", "#302653", "#113323", "#3a1930", "#4a2813", "#142446", "#26323f"], 4),
      accessory: pickVisual(signature, ["badge", "glasses", "headset", "visor", "cap", "tie", "bow"], 5),
      prop: pickVisual(signature, ["tablet", "clipboard", "stylus", "toolkit", "gamepad", "phone", "book"], 6),
      hairStyle: pickVisual(signature, ["short", "swept", "bob", "wave", "spiky", "bun", "flat", "mohawk"], 7),
      skin,
      hair,
      face: pickVisual(signature, ["calm", "focus", "smile", "serious", "spark"], 8),
      bodyShape: pickVisual(signature, ["standard", "wide", "slim", "tall"], 9),
      pattern: pickVisual(signature, ["plain", "stripe", "badge", "sash", "panel"], 10)
    };
    if (/ceo|coord|gest|admin|produtor|prioridade|comando/.test(signature)) {
      return { ...profile, accent: "#f4c96b", jacket: "#2b2234", accessory: "tie", prop: "tablet", pattern: "sash" };
    }
    if (/review|revis|proof|qualidade|clean|audit/.test(signature)) {
      return { ...profile, accent: "#cda6ff", jacket: "#302653", accessory: "glasses", prop: "clipboard", pattern: "badge" };
    }
    if (/arte|design|foto|visual|pixel|sprite|tag/.test(signature)) {
      return { ...profile, accent: "#ff7ab6", jacket: "#3a1930", accessory: "bow", prop: "stylus", pattern: "stripe" };
    }
    if (/dev|sistema|terminal|code|autom|runtime|dados/.test(signature)) {
      return { ...profile, accent: "#73eba8", jacket: "#113323", accessory: "headset", prop: "toolkit", pattern: "panel" };
    }
    if (/games|game|loop|play|nerd/.test(signature)) {
      return { ...profile, accent: "#7fe7ff", jacket: "#142446", accessory: "visor", prop: "gamepad", pattern: "stripe" };
    }
    if (/venda|promo|market|pix|acesso|social/.test(signature)) {
      return { ...profile, accent: "#ffb65c", jacket: "#4a2813", accessory: "cap", prop: "phone", pattern: "badge" };
    }
    if (/fonte|source|study|educ|kids|ninja|segur/.test(signature)) {
      return { ...profile, accent: "#73eba8", jacket: "#1e3a2f", accessory: "glasses", prop: "book", pattern: "sash" };
    }
    return profile;
  }

  function renderAgentSprite(item, options = {}) {
    const persona = getAgentPersona(item);
    const label = escapeHtml(getAgentDisplayName(item));
    const extraClass = options.large ? " is-large" : "";
    return `
      <span
        class="call-agent-sprite${extraClass}"
        data-accessory="${persona.accessory}"
        data-prop="${persona.prop}"
        data-hair-style="${persona.hairStyle}"
        data-face="${persona.face}"
        data-body="${persona.bodyShape}"
        data-pattern="${persona.pattern}"
        style="--agent-skin:${persona.skin};--agent-hair:${persona.hair};--agent-accent:${persona.accent};--agent-jacket:${persona.jacket}"
        aria-label="${label}"
      >
        <i class="sprite-shadow"></i>
        <i class="sprite-hair"></i>
        <i class="sprite-head"></i>
        <i class="sprite-face"></i>
        <i class="sprite-accessory"></i>
        <i class="sprite-body"></i>
        <i class="sprite-arm left"></i>
        <i class="sprite-arm right"></i>
        <i class="sprite-leg left"></i>
        <i class="sprite-leg right"></i>
        <i class="sprite-prop"></i>
        <i class="sprite-prop-detail"></i>
      </span>
    `;
  }

  function renderAgentPhotoToken(item) {
    const photo = item?.photo || {};
    if (!photo.initials && !photo.badge) return "";
    return `
      <span
        class="call-agent-photo-token"
        style="--photo-a:${escapeHtml(photo.primary || "#7fe7ff")};--photo-b:${escapeHtml(photo.secondary || "#f4c96b")}"
        aria-label="Foto real de ${escapeHtml(getAgentDisplayName(item))}"
      >
        <b>${escapeHtml(photo.initials || "?")}</b>
        <i>${escapeHtml(photo.badge || "AG")}</i>
      </span>
    `;
  }

  function enrichAgentContext(item) {
    const memory = Array.isArray(item?.autonomy?.memory) ? item.autonomy.memory[0] : null;
    return {
      name: getAgentDisplayName(item),
      office: getAgentOffice(item),
      role: item?.role || "agent",
      score: getAgentScore(item),
      intent: item?.intent || item?.autonomy?.intent || memory?.intent || item?.opinion || "intenção em formação",
      action: item?.action || item?.assignment?.action || memory?.action || item?.deliverable || "aguardando sua decisão",
      neural: Math.max(42, Math.min(100, getAgentScore(item) || 72))
    };
  }

  function extractRealAgents(payload) {
    const daily = payload?.dailyContext || {};
    const topAgents = Array.isArray(daily.topAgents) ? daily.topAgents : [];
    const queue = Array.isArray(payload?.queue) ? payload.queue : [];
    const registry = Array.isArray(payload?.agents) ? payload.agents : [];
    const registryBySlug = new Map(registry.map((item) => [item.slug, item]));
    const registryByNameOffice = new Map(
      registry.map((item) => [`${item.name || item.agent}|${item.officeLabel || item.office}`, item])
    );
    const source = queue.length ? queue : topAgents;
    const mapped = source
      .map((item) => {
        const registryMatch =
          registryBySlug.get(item.slug) ||
          registryByNameOffice.get(`${item.name || item.agent}|${item.office || item.officeLabel}`) ||
          null;
        return {
        id: item.id,
        slug: item.slug,
        agent: item.name || item.agent,
        office: item.office || item.officeLabel,
        officeLabel: item.officeLabel || registryMatch?.officeLabel || item.office,
        role: item.role || item.title || "agent",
        score: item.score || item.autonomy?.autonomy || item.autonomy || 0,
        urgency: item.urgency || item.autonomy?.urgency || 0,
        confidence: item.confidence || item.autonomy?.confidence || 0,
        intent: item.intent || item.autonomy?.intent || item.assignment?.idea || "",
        action: item.action || item.assignment?.action || "",
        assignment: item.assignment || null,
        autonomy: item.autonomy || null,
        photo: item.photo || null,
        officeKey: item.officeKey || registryMatch?.officeKey || null,
        spriteProfile: item.spriteProfile || registryMatch?.spriteProfile || null,
        points: item.points || 0,
        awards: Array.isArray(item.awards) ? item.awards : []
      };
      })
      .filter((item) => item.agent);
    return mapped.length ? mapped : fallbackAgents;
  }

  function isWeakOpinionSet(opinions) {
    if (!Array.isArray(opinions) || opinions.length < 3) return true;
    const keys = opinions.map((item) => String(item.opinion || "").toLowerCase().replace(/\s+/g, " ").trim());
    return new Set(keys).size <= Math.ceil(keys.length / 2);
  }

  function buildOpinionsFromAgents(agents, subject) {
    return (Array.isArray(agents) ? agents : [])
      .slice(0, 12)
      .map((agent, index) => ({
        ...agent,
        opinion: buildOpinionForAgent(agent, subject, index),
        approvalRequired: true
      }));
  }

  function mergeCheffeAndRealPayload(cheffePayload, realPayload) {
    if (!realPayload?.ok) return cheffePayload;
    const merged = {
      ...cheffePayload,
      ok: true,
      summary: realPayload.summary || cheffePayload.summary || {},
      dailyContext: realPayload.dailyContext || cheffePayload.dailyContext || null,
      autonomy: realPayload.autonomy || cheffePayload.autonomy || null,
      queue: Array.isArray(realPayload.queue) ? realPayload.queue : cheffePayload.queue || [],
      liveEvents: Array.isArray(realPayload.liveEvents) ? realPayload.liveEvents : cheffePayload.liveEvents || [],
      officeLogs: Array.isArray(realPayload.officeLogs) ? realPayload.officeLogs : cheffePayload.officeLogs || [],
      officeDashboard: Array.isArray(realPayload.officeDashboard) ? realPayload.officeDashboard : cheffePayload.officeDashboard || [],
      executableActions: Array.isArray(realPayload.executableActions) ? realPayload.executableActions : cheffePayload.executableActions || [],
      orders: Array.isArray(realPayload.orders) ? realPayload.orders : cheffePayload.orders || [],
      awards: realPayload.awards || cheffePayload.awards || null,
      scoreboard: realPayload.scoreboard || cheffePayload.scoreboard || null
    };
    const realAgents = extractRealAgents(merged);
    const subject = merged.meeting?.lastInstruction || "tema da reunião";
    if (isWeakOpinionSet(merged.opinions)) {
      merged.opinions = buildOpinionsFromAgents(realAgents, subject);
    } else {
      const byNameOffice = new Map(
        realAgents.map((agent) => [`${getAgentDisplayName(agent)}|${getAgentOffice(agent)}`, agent])
      );
      merged.opinions = merged.opinions.map((item) => ({
        ...(byNameOffice.get(`${getAgentDisplayName(item)}|${getAgentOffice(item)}`) || {}),
        ...item
      }));
    }
    return merged;
  }

  function renderAudience(count, speakerNames = [], agentList = currentRealAgents) {
    if (!audienceEl) return;
    const colors = ["#7fe7ff", "#f4c96b", "#73eba8", "#f56d7a", "#cda6ff"];
    const sourceAgents = Array.isArray(agentList) && agentList.length ? agentList : fallbackAgents;
    const totalSeats = Math.min(181, Number(count || 90));
    const columns = window.matchMedia("(max-width: 980px)").matches ? 10 : 20;
    audienceEl.innerHTML = Array.from({ length: Math.min(181, Number(count || 90)) })
      .map(
        (_, index) => {
          const agent = sourceAgents[index % sourceAgents.length];
          const name = getAgentDisplayName(agent);
          const isSpeaking = speakerNames.includes(name);
          const row = Math.floor(index / columns);
          const column = index % columns;
          const depth = totalSeats > columns ? row / Math.max(1, Math.ceil(totalSeats / columns) - 1) : 0;
          const seatX = -8;
          const seatY = Math.round((depth - 0.5) * 4);
          const seatScale = Number((0.78 + depth * 0.3).toFixed(2));
          return `<span class="seat-agent has-sprite ${isSpeaking ? "is-speaking" : ""}" data-agent-index="${index}" data-agent-name="${escapeHtml(name)}" title="${escapeHtml(
            `${name} • ${getAgentOffice(agent)}`
          )}" style="--agent-color:${colors[index % colors.length]};--agent-hair:${
            index % 3 === 0 ? "#151018" : index % 3 === 1 ? "#47301d" : "#232b44"
          };--seat-x:${seatX}px;--seat-y:${seatY}px;--seat-scale:${seatScale};--delay:${
            (index % 17) * 80
          }ms">${renderAgentPhotoToken(agent)}${renderAgentSprite(agent)}<span class="seat-state-icon" aria-hidden="true"></span><span class="agent-name-tag">${escapeHtml(name)}</span></span>`;
        }
      )
      .join("");
    applyAudienceStates();
  }

  function applyAudienceStates() {
    if (!audienceEl) return;
    const runningNames = new Set(taskQueue.filter((item) => item.state === "running").map((item) => item.agent));
    const fallbackNames = new Set(taskQueue.filter((item) => item.state === "fallback").map((item) => item.agent));
    const terminalNames = new Set(taskQueue.filter((item) => item.state === "terminal").map((item) => item.agent));
    const raisedNames = new Set([raisedHandName, ...raisedHandQueue].filter(Boolean));
    audienceEl.querySelectorAll(".seat-agent").forEach((seat) => {
      const name = seat.dataset.agentName || "";
      seat.classList.toggle("is-implementing", runningNames.has(name));
      seat.classList.toggle("is-fallback", fallbackNames.has(name));
      seat.classList.toggle("is-terminal", terminalNames.has(name));
      seat.classList.toggle("is-hand-raised", raisedNames.has(name));
    });
  }

  function refreshRaisedHandQueue() {
    if (!currentOpinions.length) {
      raisedHandQueue = [];
    } else {
      const activeName = getAgentDisplayName(currentOpinions[activeSpeakerIndex]);
      raisedHandQueue = currentOpinions
        .map((item) => getAgentDisplayName(item))
        .filter((name) => name && name !== activeName)
        .slice(0, 4);
    }

    if (!raisedHandList) return;
    if (!raisedHandQueue.length) {
      raisedHandBoard?.classList.remove("is-live");
      raisedHandList.innerHTML = '<p class="raised-hand-empty">Ninguém aguardando a vez.</p>';
      return;
    }

    raisedHandBoard?.classList.add("is-live");
    raisedHandList.innerHTML = raisedHandQueue
      .map(
        (name, index) => `
          <span class="raised-hand-chip ${index === 0 ? "is-next" : ""}">
            <i>${index === 0 ? "Proximo" : `Fila ${index + 1}`}</i>
            <strong>${escapeHtml(name)}</strong>
          </span>
        `
      )
      .join("");
  }

  function buildOpinionForAgent(item, subject, index) {
    const cleanSubject = subject || "o assunto da reunião";
    const signature = `${item.agent || ""} ${item.office || ""} ${item.role || ""}`.toLowerCase();
    const templates = [
      {
        test: /ceo|coord|gest|admin|produtor|prioridade/,
        text: "Eu separaria isso em prioridade, risco e primeira entrega aprovada. Sem essa ordem, a reunião vira barulho."
      },
      {
        test: /editor|jornal|news|redac|manchete/,
        text: "Minha visão é organizar a narrativa: o visitante precisa entender o assunto, a decisão e o próximo clique sem esforço."
      },
      {
        test: /review|revis|proof|qualidade|clean/,
        text: "Eu atacaria repetição e frase genérica. Cada agente precisa dizer algo diferente ou sair da lista."
      },
      {
        test: /copy|texto|tag/,
        text: "Eu transformaria o pedido em fala curta, humana e acionável, com verbo claro para você mandar executar depois."
      },
      {
        test: /arte|design|foto|visual|pixel|sprite/,
        text: "Eu faria a sala inspirar: personagens reconhecíveis, pose de fala, mão levantada, foto do destaque e prêmio visível."
      },
      {
        test: /dev|sistema|terminal|code|autom|acesso/,
        text: "Eu conectaria a opinião ao terminal: comando recebido, agente responsável, status e próximo patch possível."
      },
      {
        test: /ninja|fonte|audit|segur/,
        text: "Eu entraria como trava de segurança: o que é evidência, o que é sugestão e o que ainda precisa da sua aprovação."
      },
      {
        test: /games|loop|promo|pontua/,
        text: "Eu colocaria regra de mini game: rodada, turno de fala, pontuação, recompensa e histórico de quem ajudou mais."
      }
    ];
    const match = templates.find((template) => template.test.test(signature));
    const fallback = [
      "Eu pegaria uma parte pequena do problema e devolveria uma proposta com dono, prazo e critério de aceite.",
      "Eu compararia duas alternativas e mostraria qual delas dá menos retrabalho agora.",
      "Eu responderia com uma ação prática e uma dúvida objetiva antes de mexer em produção.",
      "Eu marcaria o que é opinião, o que é tarefa e o que precisa de aprovação final."
    ][index % 4];
    return `${match ? match.text : fallback} Assunto: ${cleanSubject}.`;
  }

  function normalizeOpinions(opinions, subject) {
    const list = Array.isArray(opinions) && opinions.length ? opinions : fallbackAgents;
    const seen = new Map();
    return list.map((item, index) => {
      const rawOpinion = String(item.opinion || "").trim();
      const key = rawOpinion.toLowerCase().replace(/\s+/g, " ");
      const repeated = key && seen.has(key);
      seen.set(key, (seen.get(key) || 0) + 1);
      return {
        ...item,
        opinion: !rawOpinion || repeated ? buildOpinionForAgent(item, subject, index) : rawOpinion
      };
    });
  }

  function renderDaily(payload) {
    const daily = payload.dailyContext || {};
    const agent = daily.agentOfDay || {};
    const office = daily.officeOfDay || {};
    const action = daily.actionOfDay || {};
    const matchingRealAgent = currentRealAgents.find((item) => getAgentDisplayName(item) === agent.name) || null;
    currentAgentOfDay = agent.name ? { ...matchingRealAgent, ...agent, agent: agent.name } : currentRealAgents[0] || fallbackAgents[0];
    const neuralScore = Math.max(42, Math.min(100, Number(agent.score || agent.autonomy || 82)));
    if (agentOfDayAvatar) {
      agentOfDayAvatar.innerHTML = `
        <span class="spotlight-rays"></span>
        ${renderAgentPhotoToken(currentAgentOfDay)}
        ${renderAgentSprite(
          {
            agent: currentAgentOfDay.name || currentAgentOfDay.agent,
            office: currentAgentOfDay.office,
            role: currentAgentOfDay.role,
            score: currentAgentOfDay.score,
            photo: currentAgentOfDay.photo,
            assignment: currentAgentOfDay.assignment,
            autonomy: currentAgentOfDay.autonomy
          },
          { large: true }
        )}
        <span class="spotlight-agent-confetti c1"></span>
        <span class="spotlight-agent-confetti c2"></span>
        <span class="spotlight-agent-confetti c3"></span>
      `;
    }

    agentOfDayEl.textContent = agent.name || "Sem rodada";
    agentOfDayMetaEl.textContent = agent.name
      ? `${agent.office} • autonomia ${agent.score || 0}% • ${
          agent.intent || "intencao em formacao"
        }`
      : "Rode os agentes para calcular o destaque.";
    if (agentNeuralBar) agentNeuralBar.style.width = `${neuralScore}%`;
    if (agentAwardNote) {
      agentAwardNote.textContent = agent.name
        ? `${agent.name} atingiu um objetivo importante no fluxo de aprendizado neural: ${neuralScore}% de crescimento aplicado. Esse destaque inspira os outros agentes a subir pontuação, foco e qualidade.`
        : "Objetivo neural em leitura. Quando um agente atinge uma meta, a sala inteira vê o avanço.";
    }

    officeOfDayEl.textContent = office.office || "Sem rodada";
    officeOfDayMetaEl.textContent = office.office
      ? `${office.agents || 0} agentes • autonomia media ${office.averageAutonomy || 0}% • urgencia ${
          office.averageUrgency || 0
        }%`
      : "Aguardando pontuacao diaria.";

    actionOfDayEl.textContent = action.title || "Sem ação";
    actionOfDayMetaEl.textContent = action.action || "As propostas aguardam aprovação do Full Admin.";
  }

  function getPeriodLeader(scoreboard, periodKey) {
    const leaders = scoreboard?.current?.[periodKey]?.leaders;
    return Array.isArray(leaders) && leaders.length ? leaders[0] : null;
  }

  function formatLeaderMeta(leader, fallbackText) {
    if (!leader) return fallbackText;
    return `${leader.office || "Escritório"} • ${leader.points || 0} pts • média ${leader.average || 0}`;
  }

  function renderAchievements(payload) {
    const awards = payload?.awards || {};
    const scoreboard = payload?.scoreboard || {};
    const podium = Array.isArray(awards.podium) ? awards.podium : [];
    const liveLeader = podium[0] || getPeriodLeader(scoreboard, "day") || null;
    const dayLeader = getPeriodLeader(scoreboard, "day");
    const weekLeader = getPeriodLeader(scoreboard, "week");
    const monthLeader = getPeriodLeader(scoreboard, "month");

    if (achievementHeadlineEl) {
      achievementHeadlineEl.textContent = liveLeader
        ? `${liveLeader.name} puxa a reunião agora`
        : "Funcionários e escritórios em disputa real";
    }

    if (achievementChaseLineEl) {
      achievementChaseLineEl.textContent =
        awards.chaseLine ||
        "A evolução dos agentes depende de entregas, constância, autonomia e leitura real do ecossistema.";
    }

    if (achievementHourLeaderEl) achievementHourLeaderEl.textContent = liveLeader?.name || "Sem rodada";
    if (achievementHourMetaEl) {
      achievementHourMetaEl.textContent = liveLeader
        ? `${liveLeader.office || "Escritório"} • ${liveLeader.points || 0} pts • ${liveLeader.awards?.length || 0} awards`
        : "Mais pontos na rodada atual.";
    }

    if (achievementDayLeaderEl) achievementDayLeaderEl.textContent = dayLeader?.name || "Sem líder";
    if (achievementDayMetaEl) {
      achievementDayMetaEl.textContent = formatLeaderMeta(dayLeader, "Corrida diária de pontos e awards.");
    }

    if (achievementWeekLeaderEl) achievementWeekLeaderEl.textContent = weekLeader?.name || "Sem líder";
    if (achievementWeekMetaEl) {
      achievementWeekMetaEl.textContent = formatLeaderMeta(weekLeader, "Acúmulo semanal e consistência.");
    }

    if (achievementMonthLeaderEl) achievementMonthLeaderEl.textContent = monthLeader?.name || "Sem líder";
    if (achievementMonthMetaEl) {
      achievementMonthMetaEl.textContent = formatLeaderMeta(monthLeader, "Quem sustenta a liderança mais longa.");
    }
  }

  function getOpinionKey(item) {
    const context = enrichAgentContext(item);
    return slugify(`${context.name}|${context.office}|${context.action || item.opinion || ""}`).slice(0, 140);
  }

  function getOpinionDecisionMatch(item, session) {
    const decisions = Array.isArray(session?.decisions) ? session.decisions : [];
    const approvals = Array.isArray(session?.approvals) ? session.approvals : [];
    const key = getOpinionKey(item);
    const agentSlug = slugify(getAgentDisplayName(item));
    const context = enrichAgentContext(item);
    const actionSlug = slugify(context.action || item.opinion || "");
    const opinionSlug = slugify(item.opinion || "");
    const byKey = decisions.find((decision) => decision.opinionKey && decision.opinionKey === key);
    if (byKey) return byKey;
    const byAgentAndContent = decisions.find((decision) => {
      if (slugify(decision.agent || "") !== agentSlug) return false;
      const decisionText = slugify([decision.title, decision.text, decision.command].join(" "));
      return (
        (actionSlug && (decisionText.includes(actionSlug.slice(0, 44)) || actionSlug.includes(decisionText.slice(0, 44)))) ||
        (opinionSlug && decisionText.includes(opinionSlug.slice(0, 44)))
      );
    });
    if (byAgentAndContent) return byAgentAndContent;
    const approval = approvals.find((itemApproval) => (
      (itemApproval.opinionKey && itemApproval.opinionKey === key) ||
      slugify(itemApproval.agent || "") === agentSlug
    ));
    return approval
      ? {
          state: "ready",
          kindLabel: "aprovada",
          action: approval.action || "approve",
          agent: approval.agent,
          title: approval.note || "Opiniao aprovada"
        }
      : null;
  }

  function getOpinionFlowStatus(item, session) {
    if (item?.approvalRequired === false) {
      return {
        state: "silent",
        label: "triagem",
        detail: "Sem ligação suficiente para virar ordem agora.",
        action: ""
      };
    }
    const match = getOpinionDecisionMatch(item, session);
    if (!match) {
      return {
        state: "pending",
        label: "pendente",
        detail: "Aguardando decisão Full Admin.",
        action: ""
      };
    }
    const state = match.state || "ready";
    const labelMap = {
      ready: "aprovada",
      queued: "tarefa",
      running: "rodando",
      terminal: "terminal",
      fallback: "terminal",
      published: "implementada",
      dismissed: "ignorada"
    };
    return {
      state,
      label: match.kindLabel || labelMap[state] || "decidida",
      detail: match.title || match.text || "Decisão registrada na reunião.",
      action: match.action || ""
    };
  }

  function updateOpinionFlowSummary(flowItems) {
    const pending = flowItems.filter((item) => item.status.state === "pending").length;
    const ready = flowItems.filter((item) => ["ready", "queued"].includes(item.status.state)).length;
    const running = flowItems.filter((item) => ["running", "terminal", "fallback", "published"].includes(item.status.state)).length;
    if (opinionPendingCount) opinionPendingCount.textContent = String(pending);
    if (opinionReadyCount) opinionReadyCount.textContent = String(ready);
    if (opinionRunningCount) opinionRunningCount.textContent = String(running);
    if (opinionFlowMeta) {
      opinionFlowMeta.textContent = flowItems.length
        ? `${flowItems.length} opinioes na sala. ${pending} aguardam aprovacao, ${ready} estao prontas para implementar em lote e ${running} ja foram enviadas ao terminal/runtime.`
        : "Aprovar guarda uma opiniao. Implementar fila executa todas as aprovadas e mostra o terminal.";
    }
    if (runApprovedOpinions) {
      runApprovedOpinions.textContent = ready ? `Implementar fila (${ready})` : "Implementar fila";
      runApprovedOpinions.disabled = ready === 0;
    }
    const activeStep = ready
      ? "run"
      : pending
        ? "decide"
        : running
          ? "done"
          : flowItems.length
            ? "listen"
            : "";
    opinionFlowSteps.forEach((step) => {
      const key = step.dataset.opinionFlowStep || "";
      step.classList.toggle("is-active", key === activeStep);
      step.classList.toggle(
        "is-done",
        (key === "listen" && flowItems.length > 0) ||
          (key === "decide" && (ready > 0 || running > 0)) ||
          (key === "run" && running > 0) ||
          (key === "done" && flowItems.some((item) => item.status.state === "published"))
      );
    });
  }

  function renderOpinions(payload) {
    const opinions = normalizeOpinions(payload.opinions, payload.meeting?.lastInstruction || "o assunto da reunião");
    if (!opinions.length) {
      opinionsEl.innerHTML = '<p class="opinion-body">Nenhuma opinião registrada ainda.</p>';
      latestOpinionFlow = [];
      updateOpinionFlowSummary([]);
      return;
    }
    const session = getActiveSession(payload);
    latestOpinionFlow = opinions.map((item, index) => ({
      index,
      item,
      status: getOpinionFlowStatus(item, session)
    }));
    updateOpinionFlowSummary(latestOpinionFlow);

    opinionsEl.innerHTML = opinions
      .map(
        (item, index) => {
          const context = enrichAgentContext(item);
          const flowItem = latestOpinionFlow[index] || { status: { state: "pending", label: "pendente", detail: "" } };
          const status = flowItem.status;
          const canRun = ["ready", "queued"].includes(status.state);
          const isClosed = ["running", "terminal", "fallback", "published", "dismissed", "silent"].includes(status.state);
          return `
          <article class="opinion-item is-${escapeHtml(status.state)}" data-opinion-index="${index}" data-opinion-key="${escapeHtml(getOpinionKey(item))}">
            <div class="opinion-id">
              <div class="opinion-avatar-window" aria-hidden="true">
                ${renderAgentPhotoToken(item)}
                ${renderAgentSprite(item, { large: true })}
              </div>
              <strong>${escapeHtml(context.name)}</strong>
              <span>${escapeHtml(context.office)} • ${escapeHtml(context.role)} • ${escapeHtml(context.score)}%</span>
            </div>
            <div class="opinion-context-window">
              <div class="opinion-decision-topline">
                <span>${escapeHtml(status.label)}</span>
                <span>${escapeHtml(status.detail).slice(0, 120)}</span>
              </div>
              <p class="opinion-body">${escapeHtml(item.opinion)}</p>
              <div class="idea-context-grid">
                <span>Neural ${escapeHtml(context.neural)}%</span>
                <span>Objetivo: ${escapeHtml(context.intent).slice(0, 90)}</span>
                <span>Ação: ${escapeHtml(context.action).slice(0, 90)}</span>
              </div>
              <div class="speech-actions compact opinion-decision-actions">
                <button type="button" data-list-idea-action="approve" data-index="${index}" ${isClosed ? "disabled" : ""}>Aprovar card</button>
                <button type="button" data-list-idea-action="implement" data-index="${index}" ${canRun ? "" : "disabled"}>Implementar card</button>
                <button type="button" data-list-idea-action="variation" data-index="${index}" ${status.state === "dismissed" ? "disabled" : ""}>Ajustar</button>
                <button type="button" data-list-idea-action="task" data-index="${index}" ${isClosed ? "disabled" : ""}>Tarefa</button>
                <button type="button" data-list-idea-action="terminal" data-index="${index}">Terminal</button>
                <button type="button" data-list-idea-action="dismiss" data-index="${index}" ${isClosed ? "disabled" : ""}>Ignorar</button>
              </div>
            </div>
          </article>
        `;
        }
      )
      .join("");
    setSpeakerQueue(opinions, false);
  }

  function addMeetingLog(entry) {
    const now = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    meetingLogs.unshift({
      time: now,
      ...entry
    });
    meetingLogs = meetingLogs.slice(0, 24);
    renderMeetingLogs();
  }

  function buildFallbackPrompts(active) {
    const name = getAgentDisplayName(active);
    const office = getAgentOffice(active);
    const assignment = active?.assignment || {};
    const subject = active?.opinion || active?.intent || "ideia da reunião";
    return [
      {
        type: "prompt",
        title: `Prompt alternativo para ${name}`,
        text: `Refine a proposta de ${office} em passos claros, entregáveis e critério de aceite. Base: ${subject.slice(0, 140)}.`
      },
      {
        type: "task",
        title: `Quebrar execução de ${name}`,
        text: `Separar a ação "${assignment.action || "ação sugerida"}" em diagnóstico, patch e validação visual.`
      },
      {
        type: "prompt",
        title: "Escalar para outro agente",
        text: `Se ${name} não concluir, gerar prompt de handoff com contexto neural, risco, arquivo provável e próximo dono.`
      }
    ];
  }

  function buildExecutionPacket(active, mode = "implement") {
    const name = getAgentDisplayName(active);
    const office = getAgentOffice(active);
    const assignment = active?.assignment || {};
    const intent = active?.intent || active?.autonomy?.intent || "executar a proposta";
    const action = assignment.action || active?.action || `executar a ideia de ${name}`;
    const source = active?.opinion || assignment.idea || "sem contexto adicional";
    const howTo = [
      `1. Ler o contexto do agente ${name} em ${office} e confirmar o objetivo: ${intent}.`,
      `2. Abrir o ponto principal da ação: ${action}.`,
      `3. Quebrar a mudança em diagnóstico, alteração e validação visível antes de fechar.`,
      `4. Registrar o que foi feito, o que faltou e a próxima checagem.`
    ].join("\n");
    const prompt = [
      `Implemente esta solicitação no projeto atual.`,
      `Agente de origem: ${name} (${office}, ${active?.role || "agente"}).`,
      `Objetivo neural: ${intent}.`,
      `Ação principal: ${action}.`,
      `Contexto da ideia: ${source}.`,
      `Entregue:`,
      `- a alteração necessária`,
      `- os arquivos prováveis`,
      `- os riscos`,
      `- como validar no navegador`
    ].join("\n");
    return {
      title: mode === "prompt" ? `Prompt pronto de ${name}` : `Plano de execução de ${name}`,
      text: action,
      howTo,
      prompt
    };
  }

  function enqueueTask(item) {
    taskQueue.unshift(item);
    taskQueue = taskQueue.slice(0, 16);
    renderTaskQueue();
    applyAudienceStates();
  }

  function renderTaskQueue() {
    if (!taskQueueList) return;
    if (!taskQueue.length) {
      taskQueueList.innerHTML = '<p class="opinion-body">Quando você aprovar, variar ou escalar uma ideia, a fila aparece aqui.</p>';
      return;
    }
    taskQueueList.innerHTML = taskQueue
      .map(
        (item) => `
          <article class="task-queue-item ${item.state ? `is-${escapeHtml(item.state)}` : ""}">
            <span>${escapeHtml(item.kindLabel || "fila")} • ${escapeHtml(item.agent || "Cheffe Call")}</span>
            <strong>${escapeHtml(item.title || "Tarefa em andamento")}</strong>
            <p>${escapeHtml(item.text || "")}</p>
            ${item.howTo ? `<pre class="task-queue-block">${escapeHtml(item.howTo)}</pre>` : ""}
            ${item.prompt ? `<pre class="task-queue-block is-prompt">${escapeHtml(item.prompt)}</pre>` : ""}
          </article>
        `
      )
      .join("");
  }

  function moveToNextSpeaker(kindLabel = "próxima fala") {
    if (!currentOpinions.length) return;
    activeSpeakerIndex = (activeSpeakerIndex + 1) % currentOpinions.length;
    const active = currentOpinions[activeSpeakerIndex];
    raisedHandName = getAgentDisplayName(active);
    refreshRaisedHandQueue();
    applyAudienceStates();
    showActiveSpeaker();
    addMeetingLog({
      kindLabel,
      agent: getAgentDisplayName(active),
      text: active?.opinion || ""
    });
    setStatus(`${getAgentDisplayName(active)} levantou a mão e assumiu a próxima fala.`, "ok");
    window.setTimeout(() => {
      if (raisedHandName === getAgentDisplayName(active)) {
        raisedHandName = "";
        refreshRaisedHandQueue();
        applyAudienceStates();
      }
    }, 1600);
  }

  function renderMeetingLogs() {
    if (!meetingLogList) return;
    if (!meetingLogs.length) {
      meetingLogList.innerHTML = '<p class="opinion-body">As falas aprovadas e comandos aparecem aqui.</p>';
      return;
    }
    meetingLogList.innerHTML = meetingLogs
      .map(
        (item) => `
          <article class="meeting-log-item ${item.kind === "good" ? "is-good" : ""}">
            <span>${escapeHtml(item.time)} • ${escapeHtml(item.kindLabel || "fala")}</span>
            <strong>${escapeHtml(item.agent || "Cheffe Call")}</strong>
            <p>${escapeHtml(item.text || "")}</p>
          </article>
        `
      )
      .join("");
  }

  function hydrateMeetingArtifacts(payload) {
    const session = payload?.meeting?.currentSession || payload?.meeting?.sessions?.[0] || null;
    currentMeetingSessionId = session?.id || "";

    if (Array.isArray(session?.logs)) {
      meetingLogs = session.logs.map((item) => ({
        time: item.time || String(item.createdAt || "").slice(11, 16) || "--:--",
        kind: item.kind || "",
        kindLabel: item.kindLabel || "fala",
        agent: item.agent || "Cheffe Call",
        text: item.text || ""
      }));
      renderMeetingLogs();
    }

    if (Array.isArray(session?.decisions)) {
      taskQueue = session.decisions.map((item) => ({
        state: item.state || "",
        kindLabel: item.kindLabel || "fila",
        agent: item.agent || "Cheffe Call",
        title: item.title || "Ação da Cheffe Call",
        text: item.text || "",
        howTo: item.howTo || "",
        prompt: item.prompt || ""
      }));
      renderTaskQueue();
      applyAudienceStates();
    }
  }

  function setSpeakerQueue(opinions, reset = true) {
    currentOpinions = Array.isArray(opinions) && opinions.length ? opinions : [];
    if (reset) activeSpeakerIndex = 0;
    refreshRaisedHandQueue();
    showActiveSpeaker();
  }

  function showActiveSpeaker() {
    const active = currentOpinions[activeSpeakerIndex % Math.max(1, currentOpinions.length)];
    if (!active) return;
    const activeName = getAgentDisplayName(active);
    audienceEl?.querySelectorAll(".seat-agent").forEach((seat) => {
      seat.classList.toggle("is-speaking", seat.dataset.agentName === activeName);
    });
    applyAudienceStates();
    if (speechBubbleEl) {
      speechBubbleEl.innerHTML = `
        <div class="active-speaker-card">
          <div class="active-speaker-avatar" aria-hidden="true">
            ${renderAgentPhotoToken(active)}
            ${renderAgentSprite(active, { large: true })}
          </div>
          <div>
            <span>${escapeHtml(getAgentOffice(active))} • ${escapeHtml(active.role || "agente")} • ${escapeHtml(active.score || 0)}%</span>
            <strong>${escapeHtml(activeName)}</strong>
            <p>${escapeHtml(active.opinion || "Aguardando fala.")}</p>
            <div class="speech-actions">
              <button type="button" data-idea-action="approve">Aprovar card</button>
              <button type="button" data-idea-action="implement">Implementar card</button>
              <button type="button" data-idea-action="variation">Ajustar</button>
              <button type="button" data-idea-action="task">Tarefa</button>
              <button type="button" data-idea-action="terminal">Terminal</button>
              <button type="button" data-idea-action="file">Ficha</button>
              <button type="button" data-idea-action="next">Próximo</button>
            </div>
          </div>
        </div>
      `;
    }
    terminalEl.textContent = [
      "> cheffe-call/speaker",
      `agente: ${activeName}`,
      `escritorio: ${getAgentOffice(active)}`,
      `score: ${active.score || 0}%`,
      `fala: ${active.opinion || "aguardando"}`
    ].join("\n");
  }

  function renderGameState() {
    const active = currentOpinions[activeSpeakerIndex % Math.max(1, currentOpinions.length)] || null;
    const visibleAgents = Array.from(document.querySelectorAll(".seat-agent"))
      .slice(0, 12)
      .map((seat) => ({
        name: seat.dataset.agentName || "",
        speaking: seat.classList.contains("is-speaking"),
        handRaised: seat.classList.contains("is-hand-raised"),
        implementing: seat.classList.contains("is-implementing")
      }));
    const sceneMap = buildSceneMap();
    return JSON.stringify({
      mode: document.body.dataset.hud === "hidden" ? "cinematic" : "hud",
      fullscreen: Boolean(document.fullscreenElement),
      lowerDecksOpen,
      speaker: active ? getAgentDisplayName(active) : "",
      instruction: instructionInput?.value || "",
      command: commandInput?.value || "",
      sessionId: currentMeetingSessionId,
      visibleAgents,
      queueSize: taskQueue.length,
      logs: meetingLogs.length,
      raisedHands: raisedHandQueue,
      theater: {
        seats: visibleAgents.length,
        stage: "south",
        background: "nerd-straight-seats",
        sceneMap
      },
      coords: "screen-space, full meeting theater, stage at south/bottom"
    });
  }

  window.render_game_to_text = renderGameState;
  window.advanceTime = (ms = 16) => {
    const turns = Math.max(1, Math.round(ms / 250));
    for (let index = 0; index < turns; index += 1) {
      if (currentOpinions.length) {
        activeSpeakerIndex = (activeSpeakerIndex + 1) % currentOpinions.length;
      }
    }
    showActiveSpeaker();
    applyAudienceStates();
    return renderGameState();
  };

  async function handleIdeaAction(action) {
    const active = currentOpinions[activeSpeakerIndex];
    if (!active) {
      setStatus("Nenhuma ideia ativa para interagir.", "bad");
      return;
    }
    const agentName = getAgentDisplayName(active);
    const idea = active.opinion || "";
    if (action === "approve") {
      if (await postRoomAction("approve", active)) {
        setStatus(`${agentName} recebeu aprovação formal na Cheffe Call.`, "ok");
        moveToNextSpeaker("próxima fala");
        return;
      }
      const packet = buildExecutionPacket(active, "implement");
      addMeetingLog({ kind: "good", kindLabel: "boa ideia", agent: agentName, text: idea });
      enqueueTask({
        state: "ready",
        kindLabel: "aceita",
        agent: agentName,
        title: packet.title,
        text: packet.text,
        howTo: packet.howTo,
        prompt: packet.prompt
      });
      setStatus(`${agentName} recebeu voto positivo nessa ideia.`, "ok");
      moveToNextSpeaker("próxima fala");
      return;
    }
    if (action === "implement") {
      try {
        await runSingleImplementation(active);
        setStatus(`${agentName} entrou em execução real pela Cheffe Call.`, "ok");
        moveToNextSpeaker("próxima fala");
        return;
      } catch (error) {
        setActionFeedback({
          badge: "Falha",
          title: `Falha em ${agentName}`,
          message: error.message || "Não foi possível implementar este card.",
          tone: "bad",
          closable: true,
          steps: [
            { label: "Implementação interrompida", state: "bad" },
            { label: "Card preservado", state: "pending" }
          ]
        });
        throw error;
      }
      const implementation = active?.assignment?.action || `Começar a executar a proposta de ${agentName}.`;
      const packet = buildExecutionPacket(active, "implement");
      enqueueTask({
        state: "running",
        kindLabel: "implementando",
        agent: agentName,
        title: `Execução iniciada por ${agentName}`,
        text: implementation,
        howTo: packet.howTo,
        prompt: packet.prompt
      });
      addMeetingLog({
        kind: "good",
        kindLabel: "implementando",
        agent: agentName,
        text: implementation
      });
      terminalEl.textContent = [
        "> cheffe-call/implementation",
        `owner: ${agentName}`,
        `office: ${getAgentOffice(active)}`,
        `action: ${implementation}`,
        "status: execução iniciada pela reunião"
      ].join("\n");
      setStatus(`${agentName} começou a implementar a ideia aprovada.`, "ok");
      moveToNextSpeaker("próxima fala");
      return;
    }
    if (action === "variation") {
      const packet = buildExecutionPacket(active, "prompt");
      const adjustmentPrompt = packet.prompt || `Ajuste a proposta de ${agentName}: ${idea}`;
      if (await postRoomAction("variation", active, { title: `Ajuste pedido para ${agentName}`, command: adjustmentPrompt, prompt: adjustmentPrompt })) {
        setStatus(`Ajuste de ${agentName} ficou registrado na fila de decisões.`, "ok");
        return;
      }
      enqueueTask({
        state: "terminal",
        kindLabel: "ajuste",
        agent: agentName,
        title: `Prompt de ajuste para ${agentName}`,
        text: adjustmentPrompt,
        prompt: adjustmentPrompt
      });
      addMeetingLog({ kindLabel: "prompt de ajuste", agent: agentName, text: adjustmentPrompt });
      terminalEl.textContent = [
        "> cheffe-call/adjustment-prompt",
        `agent: ${agentName}`,
        `office: ${getAgentOffice(active)}`,
        adjustmentPrompt
      ].join("\n");
      setStatus(`Prompt de ajuste de ${agentName} foi enviado.`, "ok");
      return;
    }
    if (action === "task") {
      if (await postRoomAction("task", active)) {
        setStatus(`Tarefa real registrada para ${agentName}.`, "ok");
        return;
      }
      const task = `Tarefa criada para ${agentName}: transformar a ideia em entrega revisável, com critério de aceite e próxima ação.`;
      const packet = buildExecutionPacket(active, "implement");
      enqueueTask({
        state: "queued",
        kindLabel: "tarefa",
        agent: agentName,
        title: `Fila de tarefa para ${agentName}`,
        text: task,
        howTo: packet.howTo,
        prompt: packet.prompt
      });
      addMeetingLog({ kindLabel: "tarefa criada", agent: agentName, text: task });
      terminalEl.textContent = [
        "> cheffe-call/task",
        `owner: ${agentName}`,
        `source: ${idea}`,
        "status: aguardando aprovação para execução"
      ].join("\n");
      setStatus(`Ideia de ${agentName} virou tarefa aguardando aprovação.`, "ok");
      return;
    }
    if (action === "terminal") {
      if (await postRoomAction("terminal", active, { title: active?.assignment?.action || idea })) {
        setStatus(`Terminal real recebeu a ordem de ${agentName}.`, "ok");
        return;
      }
      enqueueTask({
        state: "terminal",
        kindLabel: "terminal",
        agent: agentName,
        title: `Prompt enviado ao terminal por ${agentName}`,
        text: active?.assignment?.action || idea
      });
      buildFallbackPrompts(active).forEach((item) => {
        const packet = buildExecutionPacket(active, "prompt");
        enqueueTask({
          state: "fallback",
          kindLabel: item.type === "prompt" ? "prompt alternativo" : "tarefa sugerida",
          agent: agentName,
          title: item.title,
          text: item.text,
          prompt: packet.prompt
        });
      });
      addMeetingLog({ kindLabel: "enviado ao terminal", agent: agentName, text: idea });
      terminalEl.textContent = [
        "> cheffe-call/idea-terminal",
        `agent: ${agentName}`,
        `office: ${getAgentOffice(active)}`,
        `idea: ${idea}`,
        "command: aguardando seu complemento no campo Terminal"
      ].join("\n");
      setStatus(`Ideia de ${agentName} foi enviada ao terminal.`, "ok");
      return;
    }
    if (action === "dismiss") {
      if (await postRoomAction("dismiss", active, { title: `Ignorar por enquanto: ${agentName}` })) {
        setStatus(`${agentName} saiu da fila de ação desta rodada.`, "ok");
        moveToNextSpeaker("próxima fala");
        return;
      }
      enqueueTask({
        state: "dismissed",
        kindLabel: "ignorada",
        agent: agentName,
        title: `Opinião ignorada por enquanto`,
        text: idea
      });
      addMeetingLog({ kindLabel: "ignorada", agent: agentName, text: idea });
      setStatus(`${agentName} ficou fora da execução desta rodada.`, "ok");
      moveToNextSpeaker("próxima fala");
      return;
    }
    if (action === "file") {
      window.location.href = `./real-agents.html?agent=${encodeURIComponent(slugify(agentName))}`;
      return;
    }
    if (action === "next") {
      moveToNextSpeaker("levantou a mão");
    }
  }

  function renderTerminal(payload) {
    const meeting = payload.meeting || {};
    const session = meeting.currentSession || meeting.sessions?.[0] || {};
    const sessionStats = session.actionStats || {};
    const summary = payload.summary || {};
    const daily = payload.dailyContext || {};
    const agent = daily.agentOfDay || {};
    const office = daily.officeOfDay || {};
    const action = daily.actionOfDay || {};
    terminalEl.textContent = [
      "> cheffe-call/status",
      `runtime: ${meeting.active ? "PAUSADA PARA REUNIAO" : "ativa em ciclos de 5 minutos"}`,
      `agentes: ${summary.totalAgents || 0}`,
      `autonomos: ${summary.autonomousAgents || 0}`,
      `media_autonomia: ${summary.averageAutonomy || 0}%`,
      `agente_do_dia: ${agent.name || "aguardando"}`,
      `escritorio_do_dia: ${office.office || "aguardando"}`,
      `acao_do_dia: ${action.action || "aguardando aprovacao"}`,
      `aprovacoes: ${sessionStats.approvals || 0}`,
      `fila_reuniao: ${sessionStats.decisions || 0}`,
      `execucoes: ${sessionStats.running || 0}`,
      `orientacao: ${meeting.lastInstruction || "nenhuma orientacao ativa"}`,
      "protocolo: ouvir -> memorizar -> opinar -> aguardar aprovacao"
    ].join("\n");
    setModeBanner(meeting.active ? "real" : "report", meeting.active ? "Runtimes pausadas para reunião em andamento" : "Relatório real aberto. Comandos exigem senha Full Admin.");
  }

  function renderAdminState(payload) {
    const meeting = payload?.meeting || {};
    const session = meeting.currentSession || meeting.sessions?.[0] || {};
    const summary = payload?.summary || {};
    const agentsReady = Boolean(payload?.agentsReady);
    const logsCount = Array.isArray(session?.logs) ? session.logs.length : 0;
    const decisionsCount = Array.isArray(session?.decisions) ? session.decisions.length : 0;

    if (adminRuntimeStateEl) {
      adminRuntimeStateEl.textContent = meeting.active ? "Runtimes pausadas" : "Runtimes livres";
    }
    if (adminRuntimeMetaEl) {
      adminRuntimeMetaEl.textContent = agentsReady
        ? `${summary.totalAgents || 0} agentes visíveis • autonomia média ${summary.averageAutonomy || 0}%`
        : "Aguardando a runtime real publicar a rodada completa dos agentes.";
    }

    if (adminSessionStateEl) {
      adminSessionStateEl.textContent = session?.status || (meeting.active ? "em reunião" : "sem reunião ativa");
    }
    if (adminSessionMetaEl) {
      adminSessionMetaEl.textContent = meeting.lastInstruction
        ? `Assunto: ${String(meeting.lastInstruction).slice(0, 110)}`
        : "Nenhum assunto operacional registrado ainda.";
    }

    if (adminLastActionStateEl) {
      adminLastActionStateEl.textContent = logsCount ? `${logsCount} logs` : "Sem ações recentes";
    }
    if (adminLastActionMetaEl) {
      adminLastActionMetaEl.textContent = `${decisionsCount} decisões na fila • sessão ${session?.id || "não iniciada"}`;
    }
  }

  function renderReportList(container, items, renderItem, emptyText) {
    if (!container) return;
    container.innerHTML = Array.isArray(items) && items.length
      ? items.map(renderItem).join("")
      : `<p class="opinion-body">${escapeHtml(emptyText || "Sem dados nesta rodada.")}</p>`;
  }

  function renderAgentReport(payload) {
    const summary = payload.summary || {};
    const session = payload.meeting?.currentSession || null;
    const actions = Array.isArray(payload.executableActions) ? payload.executableActions.slice(0, 8) : [];
    const queue = Array.isArray(payload.queue) ? payload.queue.slice(0, 8) : [];
    const offices = Array.isArray(payload.officeDashboard) ? payload.officeDashboard.slice(0, 6) : [];
    const logs = [
      ...(Array.isArray(session?.logs) ? session.logs : []),
      ...(Array.isArray(payload.liveEvents) ? payload.liveEvents.slice(0, 8) : [])
    ].slice(0, 10);

    if (callReportSummary) {
      const meetingState = payload.meeting?.active ? "reunião ativa" : "rotina liberada";
      callReportSummary.innerHTML = [
        ["Agentes", summary.totalAgents || 0],
        ["Autônomos", summary.autonomousAgents || 0],
        ["Autonomia média", `${summary.averageAutonomy || 0}%`],
        ["Entregas", summary.deliveredAgents || 0],
        ["Falhas", summary.failedAgents || 0],
        ["Fila", queue.length],
        ["Ações", actions.length],
        ["Estado", meetingState]
      ]
        .map(
          ([label, value]) => `
            <article>
              <span>${escapeHtml(label)}</span>
              <strong>${escapeHtml(value)}</strong>
            </article>
          `
        )
        .join("");
    }

    renderReportList(
      callReportQueue,
      queue,
      (item) => `
        <article class="call-report-item">
          <span>${escapeHtml(item.officeLabel || item.office || "Escritório")} • ${escapeHtml(item.role || "agent")}</span>
          <strong>${escapeHtml(item.name || item.agent || "Agente")}</strong>
          <p>${escapeHtml(item.assignment?.action || item.autonomy?.intent || item.action || "Rodada operacional em leitura.")}</p>
        </article>
      `,
      "Nenhuma tarefa operacional carregada."
    );

    renderReportList(
      callReportOffices,
      offices,
      (office) => `
        <article class="call-report-item">
          <span>${escapeHtml(office.agents || 0)} agentes • risco ${escapeHtml(office.failureRate || 0)}%</span>
          <strong>${escapeHtml(office.office || "Escritório")}</strong>
          <p>Entrega ${escapeHtml(office.deliveryRate || 0)}% • energia ${escapeHtml(office.averageEnergy || 0)}% • moral ${escapeHtml(office.averageMorale || 0)}%</p>
        </article>
      `,
      "Sem dashboard dos escritórios."
    );

    renderReportList(
      callReportActions,
      actions,
      (action) => `
        <article class="call-report-item">
          <span>${escapeHtml(action.status || "aguardando")} • ${escapeHtml(action.kind || "ação")}</span>
          <strong>${escapeHtml(action.agent || "Agente")}</strong>
          <p>${escapeHtml(action.title || action.artifact || "Ação pronta para aprovação.")}</p>
        </article>
      `,
      "Sem ações pendentes para aprovação."
    );

    renderReportList(
      callReportLogs,
      logs,
      (log) => `
        <article class="call-report-item">
          <span>${escapeHtml(log.kindLabel || log.type || "log")}</span>
          <strong>${escapeHtml(log.agent || log.name || "Cheffe Call")}</strong>
          <p>${escapeHtml(log.text || log.title || log.message || "Sinal registrado na rodada.")}</p>
        </article>
      `,
      "Sem logs recentes."
    );
  }

  function updateRealFlow(payload = latestCallPayload) {
    if (!realFlowSteps.length) return;
    const passwordReady = Boolean(getAdminPassword());
    const meeting = payload?.meeting || {};
    const session = meeting.currentSession || meeting.sessions?.[0] || null;
    const opinionsReady = Array.isArray(payload?.opinions) && payload.opinions.length > 0;
    const decisionsReady = Array.isArray(session?.decisions) && session.decisions.length > 0;
    const reportReady = Array.isArray(payload?.queue) && payload.queue.length > 0;
    const completed = new Set([
      passwordReady ? "password" : "",
      session ? "meeting" : "",
      opinionsReady ? "opinions" : "",
      decisionsReady ? "decision" : "",
      reportReady ? "report" : "",
      !meeting.active && session ? "release" : ""
    ].filter(Boolean));
    const nextStep =
      !passwordReady
        ? "password"
        : !session
          ? "meeting"
          : !opinionsReady
            ? "opinions"
            : !decisionsReady
              ? "decision"
              : meeting.active
                ? "release"
                : "report";
    realFlowSteps.forEach((step) => {
      const key = step.dataset.flowStep || "";
      step.classList.toggle("is-done", completed.has(key));
      step.classList.toggle("is-active", key === nextStep);
    });
  }

  function render(payload) {
    latestCallPayload = payload;
    currentRealAgents = extractRealAgents(payload);
    renderAudience(payload.summary?.totalAgents || currentRealAgents.length || 181, [], currentRealAgents);
    renderDaily(payload);
    renderAchievements(payload);
    renderOpinions(payload);
    hydrateMeetingArtifacts(payload);
    renderTerminal(payload);
    renderAdminState(payload);
    renderAgentReport(payload);
    updateRealFlow(payload);
    setStatus(payload.meeting?.active ? "Cheffe Call ativo. Runtimes pausadas." : "Sala pronta.", "ok");
    if (quickInstructionInput && !quickInstructionInput.matches(":focus")) {
      quickInstructionInput.value = instructionInput?.value || payload.meeting?.lastInstruction || "";
    }
    syncGameShellState();
  }

  function activateMeetingResponse(instruction, payload) {
    const subject = String(instruction || payload?.meeting?.lastInstruction || "ordem recebida").trim();
    const session = payload?.meeting?.currentSession || payload?.meeting?.sessions?.[0] || null;
    const opinions = normalizeOpinions(payload?.opinions || session?.opinions || [], subject);
    if (!opinions.length) {
      setStatus("Reunião aberta, mas nenhum agente retornou fala ainda.", "bad");
      return;
    }
    setSpeakerQueue(opinions, true);
    const active = opinions[0];
    raisedHandName = getAgentDisplayName(active);
    raisedHandQueue = opinions.slice(1, 5).map((item) => getAgentDisplayName(item)).filter(Boolean);
    refreshRaisedHandQueue();
    applyAudienceStates();
    showActiveSpeaker();
    addMeetingLog({
      kindLabel: "ordem recebida",
      agent: "Full Admin",
      text: subject
    });
    addMeetingLog({
      kindLabel: "primeira reação",
      agent: getAgentDisplayName(active),
      text: active.opinion || ""
    });
    setStatus(`${getAgentDisplayName(active)} respondeu. Use Próximo para ouvir os outros agentes.`, "ok");
  }

  async function loadCall() {
    const password = getAdminPassword();
    const [callResult, realResult] = await Promise.allSettled([
      fetch("/api/cheffe-call", { headers: { Accept: "application/json" } }),
      password ? loadRealAgentsReport(password) : Promise.resolve(null)
    ]);
    if (callResult.status !== "fulfilled") throw new Error("Nao foi possivel carregar a Cheffe Call.");

    const callPayload = await callResult.value.json();
    if (!callResult.value.ok || !callPayload.ok) throw new Error(callPayload.error || "Nao foi possivel carregar a Cheffe Call.");

    let realPayload = null;
    if (realResult.status === "fulfilled" && realResult.value?.ok) {
      realPayload = realResult.value;
    }
    render(mergeCheffeAndRealPayload(callPayload, realPayload));
  }

  async function postCall(path, body) {
    if (body?.password) rememberAdminPassword(body.password);
    const response = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(body)
    });
    const payload = await response.json();
    if (!response.ok || !payload.ok) throw new Error(payload.error || "Falha na Cheffe Call.");
    render(payload);
    return payload;
  }

  async function postRoomAction(action, active, extras = {}) {
    const password = requireAdminPassword("registrar decisões reais dos agentes");
    if (!password) throw new Error("Senha Full Admin obrigatória para registrar decisões reais dos agentes.");
    const packet = active ? buildExecutionPacket(active, action === "terminal" ? "prompt" : "implement") : null;
    await postCall("/api/cheffe-call/action", {
      password,
      action,
      sessionId: currentMeetingSessionId,
      instruction: instructionInput?.value || "",
      command: commandInput?.value || "",
      agent: active ? getAgentDisplayName(active) : "Cheffe Call",
      office: active ? getAgentOffice(active) : "Sistema",
      role: active?.role || "",
      opinionKey: active ? getOpinionKey(active) : "",
      title: extras.title || active?.assignment?.action || active?.action || active?.opinion || "Ação da reunião",
      opinion: active?.opinion || "",
      howTo: extras.howTo || packet?.howTo || "",
      prompt: extras.prompt || packet?.prompt || "",
      ...extras
    });
    return true;
  }

  function getReadyOpinionFlowItems() {
    return latestOpinionFlow.filter((flow) => ["ready", "queued"].includes(flow.status?.state));
  }

  function formatRuntimeDetailsForTerminal(payload = {}, prefix = "") {
    const details = buildRuntimeFeedbackDetails(payload);
    return [
      prefix,
      details,
      payload?.feedback?.imageApprovalsApplied !== undefined
        ? `Foto/foco aplicado: ${payload.feedback.imageApprovalsApplied}`
        : "",
      payload?.feedback?.imageApprovalsSentToAgents !== undefined
        ? `Foto/foco enviado aos agentes: ${payload.feedback.imageApprovalsSentToAgents}`
        : ""
    ]
      .filter(Boolean)
      .join("\n");
  }

  async function runCheffeRuntime(password, message) {
    const response = await fetch("/api/real-agents/run", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        password,
        message
      })
    });
    const payload = await response.json();
    if (!response.ok || !payload.ok) throw new Error(payload.error || "Falha ao rodar agentes.");
    return payload;
  }

  async function runSingleImplementation(active) {
    const agentName = getAgentDisplayName(active);
    const password = requireAdminPassword("implementar o card aprovado");
    if (!password) throw new Error("Senha Full Admin obrigatória para implementar.");
    setActionFeedback({
      badge: "Implementação",
      title: `Implementando ${agentName}`,
      message: "Registrando a decisão do card e rodando a runtime dos agentes.",
      tone: "pending",
      closable: false,
      steps: [
        { label: "Card aprovado localizado", state: "done" },
        { label: "Registro da execução no servidor", state: "running" },
        { label: "Runtime dos agentes", state: "pending" },
        { label: "Conferência da sala", state: "pending" }
      ],
      details: buildExecutionPacket(active, "implement").howTo
    });

    await postRoomAction("implement", active);
    setActionFeedback({
      badge: "Runtime",
      title: `Runtime de ${agentName}`,
      message: "A execução foi registrada. Agora os agentes estão rodando.",
      tone: "pending",
      closable: false,
      steps: [
        { label: "Execução registrada", state: "done" },
        { label: "Runtime dos agentes", state: "running" },
        { label: "Atualização da sala", state: "pending" }
      ]
    });
    const payload = await runCheffeRuntime(
      password,
      `Implementar card aprovado na Cheffe Call: ${agentName}.`
    );
    await loadCall();
    setActionFeedback({
      badge: "Concluído",
      title: `${agentName} implementado`,
      message: "A runtime terminou e a sala foi atualizada.",
      tone: "ok",
      closable: true,
      steps: [
        { label: "Card enviado", state: "done" },
        { label: "Runtime concluída", state: "done" },
        { label: "Sala atualizada", state: "done" }
      ],
      details: formatRuntimeDetailsForTerminal(payload, `owner: ${agentName}`)
    });
    terminalEl.textContent = [
      "> cheffe-call/card-implementation",
      `owner: ${agentName}`,
      `office: ${getAgentOffice(active)}`,
      formatRuntimeDetailsForTerminal(payload, "status: concluído")
    ].join("\n");
  }

  async function runApprovedOpinionQueue() {
    const readyItems = getReadyOpinionFlowItems();
    if (!readyItems.length) {
      setActionFeedback({
        badge: "Fila",
        title: "Nada aprovado ainda",
        message: "Aprove cards primeiro. Depois este botão implementa todos de uma vez.",
        tone: "bad",
        closable: true,
        steps: [{ label: "Nenhum card pronto", state: "bad" }]
      });
      setStatus("Aprove uma ou mais opiniões antes de implementar a fila.", "bad");
      return;
    }

    const password = requireAdminPassword("implementar a fila aprovada");
    if (!password) return;
    if (runApprovedOpinions) runApprovedOpinions.disabled = true;
    if (refreshOpinionFlow) refreshOpinionFlow.disabled = true;

    const batchNames = readyItems.map((flow) => getAgentDisplayName(flow.item));
    try {
      setActionFeedback({
        badge: "Fila",
        title: `Implementando ${readyItems.length} aprovadas`,
        message: "A Cheffe Call vai registrar cada card aprovado e rodar a runtime uma vez no final.",
        tone: "pending",
        closable: false,
        steps: [
          { label: `${readyItems.length} cards aprovados encontrados`, state: "done" },
          { label: "Registrando execuções", state: "running" },
          { label: "Runtime única da fila", state: "pending" },
          { label: "Conferência final", state: "pending" }
        ],
        details: batchNames.map((name, index) => `${index + 1}. ${name}`).join("\n")
      });

      let completed = 0;
      for (const flow of readyItems) {
        activeSpeakerIndex = flow.index;
        showActiveSpeaker();
        const name = getAgentDisplayName(flow.item);
        terminalEl.textContent = [
          "> cheffe-call/batch-register",
          `item: ${completed + 1}/${readyItems.length}`,
          `owner: ${name}`,
          `status: registrando execução aprovada`
        ].join("\n");
        await postRoomAction("implement", flow.item, {
          title: `Implementar fila: ${flow.item?.assignment?.action || flow.item?.opinion || name}`,
          batch: true
        });
        completed += 1;
        setActionFeedback({
          badge: "Fila",
          title: `Registradas ${completed}/${readyItems.length}`,
          message: "Os cards aprovados estão virando execução real.",
          tone: "pending",
          closable: false,
          steps: [
            { label: `${completed}/${readyItems.length} execuções registradas`, state: "running" },
            { label: "Runtime única da fila", state: "pending" },
            { label: "Conferência final", state: "pending" }
          ],
          details: batchNames.map((name, index) => `${index + 1}. ${index < completed ? "ok" : "aguardando"} - ${name}`).join("\n")
        });
      }

      setActionFeedback({
        badge: "Runtime",
        title: "Rodando fila aprovada",
        message: "Todos os cards aprovados foram registrados. A runtime está executando agora.",
        tone: "pending",
        closable: false,
        steps: [
          { label: `${completed} execuções registradas`, state: "done" },
          { label: "Runtime dos agentes", state: "running" },
          { label: "Atualização da sala", state: "pending" }
        ]
      });
      const payload = await runCheffeRuntime(
        password,
        `Implementar fila aprovada da Cheffe Call com ${completed} cards.`
      );
      await loadCall();
      setActionFeedback({
        badge: "Concluído",
        title: "Fila implementada",
        message: "A runtime terminou e a Cheffe Call foi atualizada.",
        tone: "ok",
        closable: true,
        steps: [
          { label: `${completed} cards enviados`, state: "done" },
          { label: "Runtime concluída", state: "done" },
          { label: "Sala atualizada", state: "done" }
        ],
        details: formatRuntimeDetailsForTerminal(payload, `fila: ${completed} cards`)
      });
      terminalEl.textContent = [
        "> cheffe-call/batch-complete",
        `cards: ${completed}`,
        formatRuntimeDetailsForTerminal(payload, "status: concluído")
      ].join("\n");
      setStatus(`Fila implementada: ${completed} aprovações enviadas e runtime concluída.`, "ok");
    } catch (error) {
      setActionFeedback({
        badge: "Falha",
        title: "Fila interrompida",
        message: error.message || "A implementação da fila falhou.",
        tone: "bad",
        closable: true,
        steps: [
          { label: "Execução interrompida", state: "bad" },
          { label: "Sala preservada", state: "pending" }
        ]
      });
      setStatus(error.message || "Falha ao implementar fila.", "bad");
    } finally {
      if (runApprovedOpinions) runApprovedOpinions.disabled = getReadyOpinionFlowItems().length === 0;
      if (refreshOpinionFlow) refreshOpinionFlow.disabled = false;
    }
  }

  formEl?.addEventListener("submit", (event) => {
    event.preventDefault();
    const form = new FormData(formEl);
    const password = String(form.get("password") || "").trim();
    const instruction = String(form.get("instruction") || "").trim();
    if (!password) {
      setStatus("Digite a senha Full Admin para abrir uma reunião real com os agentes.", "bad");
      formEl?.querySelector('[name="password"]')?.focus();
      return;
    }
    rememberAdminPassword(password);
    setStatus("Abrindo Cheffe Call...");
    postCall("/api/cheffe-call/start", { password, instruction }).catch((error) => setStatus(error.message, "bad"));
  });

  commandBarEl?.addEventListener("submit", (event) => {
    event.preventDefault();
    const quickInstruction = String(quickInstructionInput?.value || "").trim();
    if (!quickInstruction) {
      setStatus("Digite uma ordem da reunião antes de abrir rodada.", "bad");
      return;
    }
    const password = requireAdminPassword("enviar ordem rápida real");
    if (!password) return;
    if (instructionInput) instructionInput.value = quickInstruction;
    setStatus("Abrindo rodada real para os agentes...");
    setActionFeedback({
      badge: "Rodada",
      title: "Abrindo reunião",
      message: "A ordem foi enviada para a Cheffe Call montar opiniões com dono, evidência e ação.",
      tone: "pending",
      closable: false,
      steps: [
        { label: "Senha validada", state: "done" },
        { label: "Criando sessão", state: "running" },
        { label: "Montando fila de opiniões", state: "pending" }
      ],
      details: quickInstruction
    });
    postCall("/api/cheffe-call/start", { password, instruction: quickInstruction })
      .then((payload) => {
        activateMeetingResponse(quickInstruction, payload);
        setActionFeedback({
          badge: "Rodada",
          title: "Fila pronta",
          message: "A sala foi atualizada. Aprove cards individuais ou implemente a fila inteira.",
          tone: "ok",
          closable: true,
          steps: [
            { label: "Sessão criada", state: "done" },
            { label: "Opiniões renderizadas", state: "done" },
            { label: "Aguardando aprovação", state: "running" }
          ],
          autoCloseMs: 2600
        });
      })
      .catch((error) => {
        setActionFeedback({
          badge: "Falha",
          title: "Rodada não abriu",
          message: error.message || "Falha ao abrir a reunião.",
          tone: "bad",
          closable: true,
          steps: [{ label: "Envio interrompido", state: "bad" }]
        });
        setStatus(error.message, "bad");
      });
  });

  quickInstructionInput?.addEventListener("focus", () => {
    quickInstructionInput.select();
  });

  quickPasswordConfirm?.addEventListener("click", async () => {
    const password = String(quickPasswordInput?.value || "").trim();
    if (!password) {
      setStatus("Digite a senha Full Admin e clique em Entrar.", "bad");
      setPasswordStatus("Digite a senha primeiro.", "bad");
      quickPasswordInput?.focus();
      return;
    }
    quickPasswordConfirm.disabled = true;
    setPasswordStatus("Validando senha...", "pending");
    setStatus("Validando senha Full Admin...");
    try {
      await validateAdminPassword(password);
      rememberAdminPassword(password, { close: false });
      setPasswordStatus("Senha validada. Abrindo fila de foto/foco para revisão.", "pending");
      let approvalPayload = null;
      try {
        approvalPayload = await fetchPhotoApprovals(password);
      } catch (approvalError) {
        setPasswordStatus("Senha validada. Fila de foto/foco indisponivel agora.", "bad");
        await enterCheffeRoom(approvalError.message || "Senha validada. Fila indisponivel.");
        return;
      }
      if (Number(approvalPayload.pendingCount || 0) > 0) {
        openPhotoApprovalQueue(approvalPayload);
        return;
      }
      if (hasPhotoApprovalRuntimeWork(approvalPayload)) {
        openPhotoApprovalQueue(approvalPayload);
        return;
      }
      await enterCheffeRoom("Senha validada. Sem foto/foco pendente.");
    } catch (error) {
      cheffeAdminPassword = "";
      try {
        window.sessionStorage.removeItem("cheffeCallFullAdminPassword");
      } catch (_storageError) {
        // ignore storage failures
      }
      openAccessModal(error.message || "Senha recusada.", "bad");
      setPasswordStatus(error.message || "Senha recusada.", "bad");
      setStatus(error.message || "Senha Full Admin recusada.", "bad");
      quickPasswordInput?.focus();
    } finally {
      quickPasswordConfirm.disabled = false;
    }
  });

  quickPasswordInput?.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    quickPasswordConfirm?.click();
  });

  photoApprovalDecisionButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const decision = button.dataset.photoDecision || "";
      submitPhotoApprovalDecision(decision);
    });
  });

  photoApprovalFocus?.addEventListener("change", () => {
    syncPhotoManualControls(photoApprovalFocus.value);
    syncPhotoFocusPreview();
  });
  photoApprovalFocusX?.addEventListener("change", () => setPhotoFocusValue(getManualPhotoFocusValue()));
  photoApprovalFocusY?.addEventListener("input", () => setPhotoFocusValue(getManualPhotoFocusValue()));
  photoApprovalImageFit?.addEventListener("change", syncPhotoFocusPreview);
  photoFocusPresetButtons.forEach((button) => {
    button.addEventListener("click", () => setPhotoFocusValue(button.dataset.photoFocus || "center 42%"));
  });
  cheffeActionFeedbackClose?.addEventListener("click", closeActionFeedback);

  photoApprovalPrev?.addEventListener("click", () => {
    if (photoApprovalBusy || photoApprovalIndex <= 0) return;
    photoApprovalIndex -= 1;
    renderPhotoApprovalItem();
  });

  photoApprovalNext?.addEventListener("click", () => {
    if (photoApprovalBusy || photoApprovalIndex >= photoApprovalQueue.length - 1) return;
    photoApprovalIndex += 1;
    renderPhotoApprovalItem();
  });

  photoApprovalContinue?.addEventListener("click", () => {
    if (photoApprovalBusy) return;
    const stats = getPhotoApprovalStats();
    const message = photoApprovalRunRuntime?.checked
      ? "Rodando agentes para aplicar decisões antes de abrir a sala."
      : stats.runtimeWorkCount > 0
        ? "Acesso liberado sem aplicar agora. Decisoes ficaram na fila."
        : "Acesso liberado. Decisoes pendentes ficaram na fila.";
    enterCheffeRoom(message);
  });

  photoApprovalRunRuntime?.addEventListener("change", updatePhotoApprovalRuntimeControls);

  sendTerminalEl?.addEventListener("click", () => {
    const form = new FormData(formEl);
    const instruction = String(form.get("instruction") || "").trim();
    const command = String(form.get("command") || "").trim();
    const password = requireAdminPassword("enviar comando real ao terminal dos agentes");
    if (!password) return;
    if (!instruction && !command) {
      setStatus("Digite o assunto ou cole um pedido/código antes de enviar ao terminal.", "bad");
      return;
    }
    const active = currentOpinions[activeSpeakerIndex] || null;
    const runTerminal = () =>
      postRoomAction("terminal", active, {
        title: instruction || command || "Pedido direto ao terminal",
        command: command || instruction,
        prompt: command || instruction
      });
    const action = currentMeetingSessionId
      ? runTerminal()
      : postCall("/api/cheffe-call/start", { password, instruction: instruction || "Pedido direto ao terminal" }).then(runTerminal);
    setStatus("Enviando comando real ao terminal da Cheffe Call...");
    action.catch((error) => setStatus(error.message, "bad"));
  });

  nextSpeakerEl?.addEventListener("click", () => {
    if (!currentOpinions.length) {
      setStatus("Envie uma mensagem aos agentes antes de chamar o próximo.", "bad");
      return;
    }
    moveToNextSpeaker("levantou a mão");
  });

  markGoodIdeaEl?.addEventListener("click", () => {
    const active = currentOpinions[activeSpeakerIndex];
    if (!active) {
      setStatus("Nenhuma fala ativa para marcar como boa ideia.", "bad");
      return;
    }
    handleIdeaAction("approve").catch((error) => setStatus(error.message, "bad"));
  });

  speechBubbleEl?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-idea-action]");
    if (!button) {
      speechBubbleEl.classList.toggle("is-expanded");
      return;
    }
    handleIdeaAction(button.dataset.ideaAction).catch((error) => setStatus(error.message, "bad"));
  });

  opinionsEl?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-list-idea-action]");
    if (!button) return;
    const index = Number(button.dataset.index || 0);
    if (Number.isFinite(index)) {
      activeSpeakerIndex = index;
      showActiveSpeaker();
      handleIdeaAction(button.dataset.listIdeaAction).catch((error) => setStatus(error.message, "bad"));
    }
  });

  releaseEl?.addEventListener("click", () => {
    const password = requireAdminPassword("liberar as runtimes");
    if (!password) {
      return;
    }
    setStatus("Liberando runtimes...");
    postCall("/api/cheffe-call/release", { password }).catch((error) => setStatus(error.message, "bad"));
  });

  voteAgentOfDay?.addEventListener("click", () => {
    if (!currentAgentOfDay) return;
    const target = {
      ...currentAgentOfDay,
      opinion: `Destaque aprovado pela Cheffe Call para ${currentAgentOfDay.name || currentAgentOfDay.agent}.`
    };
    postRoomAction("approve", target, {
      title: `Destaque do agente do dia: ${currentAgentOfDay.name || currentAgentOfDay.agent}`,
      opinion: target.opinion
    })
      .then(() => setStatus(`${currentAgentOfDay.name || currentAgentOfDay.agent} recebeu destaque real na Cheffe Call.`, "ok"))
      .catch((error) => setStatus(error.message, "bad"));
  });

  openAgentFile?.addEventListener("click", () => {
    const name = currentAgentOfDay?.name || currentAgentOfDay?.agent || "";
    window.location.href = `./real-agents.html?agent=${encodeURIComponent(slugify(name))}`;
  });

  fullscreenToggleEl?.addEventListener("click", () => {
    toggleFullscreen();
  });

  hudToggleEl?.addEventListener("click", () => {
    toggleHudVisibility();
  });

  lowerDecksToggleEl?.addEventListener("click", () => {
    toggleLowerDecksVisibility();
  });

  focusCommandDetails?.addEventListener("click", () => {
    openCheffeInfoPopup("Log completo da Cheffe Call", buildFullLogText());
  });

  quickNextSpeaker?.addEventListener("click", () => {
    if (currentOpinions.length) {
      moveToNextSpeaker("próxima fala");
      return;
    }
    setStatus("Nenhum agente na fila. Abra uma rodada primeiro.", "bad");
    quickInstructionInput?.focus();
  });

  quickRefreshAgents?.addEventListener("click", () => {
    const password = getAdminPassword();
    if (!password) {
      loadCall()
        .then(() => {
          openCheffeInfoPopup("Resumo da última ordem", buildSessionSummaryText());
          setStatus("Resumo atualizado. Para rodar agentes reais, entre com a senha da Cheffe Call.", "ok");
        })
        .catch((error) => setStatus(error.message, "bad"));
      return;
    }
    setStatus("Recarregando sala e fila de opiniões...");
    setActionFeedback({
      badge: "Recarregar",
      title: "Atualizando sala",
      message: "Buscando estado atual da reunião, fila e runtime.",
      tone: "pending",
      closable: false,
      steps: [
        { label: "Solicitação enviada", state: "running" },
        { label: "Renderizando fila", state: "pending" }
      ]
    });
    loadCall()
      .then(() => {
        setActionFeedback({
          badge: "Recarregar",
          title: "Sala atualizada",
          message: "Fila e terminal foram sincronizados.",
          tone: "ok",
          closable: true,
          steps: [
            { label: "Estado recebido", state: "done" },
            { label: "Fila atualizada", state: "done" }
          ],
          autoCloseMs: 2000
        });
        setStatus("Cheffe Call recarregada.", "ok");
      })
      .catch((error) => {
        setActionFeedback({
          badge: "Falha",
          title: "Não recarregou",
          message: error.message || "Falha ao atualizar sala.",
          tone: "bad",
          closable: true,
          steps: [{ label: "Recarregamento interrompido", state: "bad" }]
        });
        setStatus(error.message, "bad");
      });
  });

  refreshOpinionFlow?.addEventListener("click", () => {
    setStatus("Atualizando fila de opiniões dos agentes...");
    loadCall()
      .then(() => setStatus("Fila de opiniões atualizada.", "ok"))
      .catch((error) => setStatus(error.message, "bad"));
  });

  runApprovedOpinions?.addEventListener("click", () => {
    runApprovedOpinionQueue().catch((error) => setStatus(error.message, "bad"));
  });

  adminRunAgentsNow?.addEventListener("click", () => {
    const password = requireAdminPassword("rodar os agentes reais");
    if (!password) return;
    setStatus("Rodando agentes reais...");
    setActionFeedback({
      badge: "Runtime",
      title: "Rodando agentes agora",
      message: "A Cheffe Call está executando a runtime manual.",
      tone: "pending",
      closable: false,
      steps: [
        { label: "Senha validada", state: "done" },
        { label: "Runtime dos agentes em execução", state: "running" },
        { label: "Sala aguardando feedback", state: "pending" }
      ]
    });
    fetch("/api/real-agents/run", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        password,
        message: instructionInput?.value || "Rodada manual disparada pela Cheffe Call."
      })
    })
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok || !payload.ok) throw new Error(payload.error || "Falha ao rodar agentes.");
        setActionFeedback({
          badge: "Runtime",
          title: "Agentes finalizaram",
          message: "Runtime concluída. Feedback pronto para a sala.",
          tone: "ok",
          steps: [
            { label: "Runtime dos agentes executada", state: "done" },
            { label: "Feedback recebido", state: "done" },
            { label: "Atualizando painel", state: "running" }
          ],
          details: buildRuntimeFeedbackDetails(payload),
          closable: true
        });
        return loadCall();
      })
      .then(() => {
        setActionFeedback({
          badge: "Finalizado",
          title: "Sala atualizada",
          message: "Os agentes terminaram e a Cheffe Call está com dados novos.",
          tone: "ok",
          steps: [
            { label: "Runtime concluída", state: "done" },
            { label: "Sala atualizada", state: "done" }
          ],
          closable: true
        });
        setStatus("Rodada manual dos agentes concluída e sala atualizada.", "ok");
      })
      .catch((error) => {
        setActionFeedback({
          badge: "Falha",
          title: "Runtime não concluiu",
          message: error.message || "Falha ao rodar agentes.",
          tone: "bad",
          steps: [
            { label: "Runtime interrompida", state: "bad" },
            { label: "Sala preservada", state: "pending" }
          ],
          closable: true
        });
        setStatus(error.message, "bad");
      });
  });

  adminReleaseRoom?.addEventListener("click", () => {
    const password = requireAdminPassword("encerrar a reunião real");
    if (!password) return;
    setStatus("Encerrando reunião real...");
    postCall("/api/cheffe-call/release", { password }).catch((error) => setStatus(error.message, "bad"));
  });

  adminClearSession?.addEventListener("click", () => {
    const password = requireAdminPassword("limpar a sessão real");
    if (!password) return;
    setStatus("Limpando sessão atual...");
    postCall("/api/cheffe-call/admin/clear", { password, sessionId: currentMeetingSessionId }).catch((error) =>
      setStatus(error.message, "bad")
    );
  });

  adminExportSnapshot?.addEventListener("click", async () => {
    try {
      if (!latestCallPayload) throw new Error("Ainda não há snapshot carregado.");
      const snapshot = JSON.stringify(latestCallPayload, null, 2);
      const copied = await copyText(snapshot);
      if (!copied) throw new Error("Não foi possível copiar o snapshot para a área de transferência.");
      setStatus("Snapshot da Cheffe Call copiado.", "ok");
    } catch (error) {
      setStatus(error.message, "bad");
    }
  });

  adminOpenRealAgents?.addEventListener("click", () => {
    window.location.href = "./real-agents.html";
  });

  promptModeSelect?.addEventListener("change", () => {
    const mode = promptModeSelect.value || "global";
    if (mode === "global") {
      if (promptOfficeSelect) promptOfficeSelect.value = "";
      if (promptAgentSelect) promptAgentSelect.value = "";
    }
    if (mode === "office" && promptAgentSelect) {
      promptAgentSelect.value = "";
    }
    if (mode === "agent" && !promptOfficeSelect?.value && promptConsoleData?.agents?.[0]?.office && promptOfficeSelect) {
      promptOfficeSelect.value = promptConsoleData.agents[0].office;
      refreshPromptAgentOptions(promptOfficeSelect.value);
    }
    selectPromptPayload();
  });

  promptOfficeSelect?.addEventListener("change", () => {
    refreshPromptAgentOptions(promptOfficeSelect.value || "");
    if (promptModeSelect?.value === "agent" && promptAgentSelect) {
      promptAgentSelect.value = "";
    }
    if (promptModeSelect && promptModeSelect.value === "global") {
      promptModeSelect.value = "office";
    }
    selectPromptPayload();
  });

  promptAgentSelect?.addEventListener("change", () => {
    if (promptAgentSelect?.value && promptModeSelect) {
      promptModeSelect.value = "agent";
      const agentPrompt = (promptConsoleData?.agents || []).find((item) => item.slug === promptAgentSelect.value);
      if (agentPrompt && promptOfficeSelect) {
        promptOfficeSelect.value = agentPrompt.office || "";
        refreshPromptAgentOptions(promptOfficeSelect.value);
        promptAgentSelect.value = agentPrompt.slug;
      }
    }
    selectPromptPayload();
  });

  loadPromptToInstruction?.addEventListener("click", () => {
    const promptText = getActivePromptText();
    if (!promptText) {
      setStatus("Escolha um prompt antes de jogar no assunto.", "bad");
      return;
    }
    syncVisibleInstruction(promptText);
    setCommandBarPulse();
    setStatus("Prompt jogado no Comando rápido. Clique Enviar para falar com os agentes.", "ok");
  });

  loadPromptToTerminal?.addEventListener("click", () => {
    const promptText = getActivePromptText();
    if (!promptText) {
      setStatus("Escolha um prompt antes de jogar no terminal.", "bad");
      return;
    }
    if (commandInput) commandInput.value = promptText;
    syncVisibleInstruction(promptText);
    setCommandBarPulse();
    const password = getAdminPassword();
    if (!password) {
      setStatus("Prompt pronto no Comando rápido. Valide a senha e clique Enviar.", "bad");
      setPasswordStatus("Senha obrigatória para enviar ao terminal.", "bad");
      quickPasswordInput?.focus();
      return;
    }
    setStatus("Enviando prompt ao terminal real da Cheffe Call...");
    postCall("/api/cheffe-call/start", { password, instruction: promptText })
      .then((payload) => {
        activateMeetingResponse(promptText, payload);
        const active = currentOpinions[activeSpeakerIndex] || null;
        return postRoomAction("terminal", active, {
          title: activePromptPayload.title || "Prompt enviado ao terminal",
          command: promptText,
          prompt: promptText
        });
      })
      .then(() => setStatus("Prompt enviado ao terminal e agentes reagiram.", "ok"))
      .catch((error) => setStatus(error.message, "bad"));
  });

  copyPromptText?.addEventListener("click", async () => {
    const copied = await copyText(getActivePromptText());
    setStatus(copied ? "Prompt copiado para a área de transferência." : "Nao foi possivel copiar o prompt.", copied ? "ok" : "bad");
  });

  document.addEventListener("keydown", (event) => {
    const target = event.target;
    if (target instanceof HTMLElement) {
      const tag = target.tagName.toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select" || target.isContentEditable) return;
    }
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    const key = event.key.toLowerCase();
    if (key === "f") {
      event.preventDefault();
      toggleFullscreen();
    }
    if (key === "h") {
      event.preventDefault();
      toggleHudVisibility();
    }
    if (key === "l") {
      event.preventDefault();
      toggleLowerDecksVisibility();
    }
    if (key === "c") {
      event.preventDefault();
      quickInstructionInput?.focus();
    }
    if (key === "n") {
      event.preventDefault();
      moveToNextSpeaker("atalho do palco");
    }
    if (key === "a") {
      event.preventDefault();
      handleIdeaAction("approve").catch((error) => setStatus(error.message, "bad"));
    }
    if (key === "i") {
      event.preventDefault();
      handleIdeaAction("implement").catch((error) => setStatus(error.message, "bad"));
    }
    if (key === "t") {
      event.preventDefault();
      handleIdeaAction("task").catch((error) => setStatus(error.message, "bad"));
    }
    if (key === "r") {
      event.preventDefault();
      quickRefreshAgents?.click();
    }
    if (event.key === "Escape") {
      toggleLowerDecksVisibility(false);
    }
  });

  document.addEventListener("fullscreenchange", () => {
    if (fullscreenToggleEl) {
      fullscreenToggleEl.textContent = document.fullscreenElement ? "Sair da tela" : "Tela cheia";
    }
  });

  document.body.dataset.hud = "visible";
  if (cheffeAdminPassword && formEl?.querySelector('[name="password"]')) {
    formEl.querySelector('[name="password"]').value = cheffeAdminPassword;
  }
  if (quickPasswordInput && cheffeAdminPassword) {
    quickPasswordInput.value = cheffeAdminPassword;
  }
  if (cheffeAdminPassword) {
    closeAccessModal();
    setPasswordStatus("Senha lembrada nesta sessão.", "ok");
  } else {
    openAccessModal();
  }
  formEl?.querySelector('[name="password"]')?.addEventListener("input", () => updateRealFlow());
  syncGameShellState();

  initPromptConsole();
  loadCall().catch((error) => setStatus(error.message, "bad"));
  renderMeetingLogs();
  renderTaskQueue();
  window.setInterval(() => loadCall().catch((error) => setStatus(error.message, "bad")), 60 * 1000);
})();
