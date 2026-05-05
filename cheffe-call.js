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
  const agentCompetitionScoreEl = document.querySelector("#agentCompetitionScore");
  const agentIntelligenceScoreEl = document.querySelector("#agentIntelligenceScore");
  const agentExecutionScoreEl = document.querySelector("#agentExecutionScore");
  const agentImpactScoreEl = document.querySelector("#agentImpactScore");
  const agentNeuralBar = document.querySelector("#agentNeuralBar");
  const agentAwardNote = document.querySelector("#agentAwardNote");
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
  const cheffeActionFeedbackHome = document.querySelector("#cheffeActionFeedbackHome");
  const quickInstructionInput = document.querySelector("#quickInstructionInput");
  const focusCommandDetails = document.querySelector("#focusCommandDetails");
  const quickNextSpeaker = document.querySelector("#quickNextSpeaker");
  const quickRefreshAgents = document.querySelector("#quickRefreshAgents");
  const agentResponsePanel = document.querySelector("#agentResponsePanel");
  const agentResponseBadge = document.querySelector("#agentResponseBadge");
  const agentResponseTitle = document.querySelector("#agentResponseTitle");
  const agentResponseText = document.querySelector("#agentResponseText");
  const agentResponseSummary = document.querySelector("#agentResponseSummary");
  const agentResponseResolved = document.querySelector("#agentResponseResolved");
  const agentResponseEvidence = document.querySelector("#agentResponseEvidence");
  const agentResponsePending = document.querySelector("#agentResponsePending");
  const agentResponseOrder = document.querySelector("#agentResponseOrder");
  const agentResponseList = document.querySelector("#agentResponseList");
  const agentResponseNext = document.querySelector("#agentResponseNext");
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
  const promptAdjustmentSelect = document.querySelector("#promptAdjustmentSelect");
  const promptCommandCenter = document.querySelector(".prompt-command-center");
  const promptPreviewTitle = document.querySelector("#promptPreviewTitle");
  const promptPreviewBadge = document.querySelector("#promptPreviewBadge");
  const promptPreviewText = document.querySelector("#promptPreviewText");
  const promptConsoleMeta = document.querySelector("#promptConsoleMeta");
  const loadPromptToInstruction = document.querySelector("#loadPromptToInstruction");
  const loadPromptToTerminal = document.querySelector("#loadPromptToTerminal");
  const copyPromptText = document.querySelector("#copyPromptText");
  const decisionDesk = document.querySelector(".decision-desk");
  const decisionOfficeSelect = document.querySelector("#decisionOfficeSelect");
  const decisionAgentSelect = document.querySelector("#decisionAgentSelect");
  const decisionActionSelect = document.querySelector("#decisionActionSelect");
  const decisionDeskMeta = document.querySelector("#decisionDeskMeta");
  const decisionContextTitle = document.querySelector("#decisionContextTitle");
  const decisionContextPreview = document.querySelector("#decisionContextPreview");
  const decisionOpenComposer = document.querySelector("#decisionOpenComposer");
  const decisionUseActiveIdea = document.querySelector("#decisionUseActiveIdea");
  const decisionComposer = document.querySelector("#decisionComposer");
  const decisionComposerBadge = document.querySelector("#decisionComposerBadge");
  const decisionComposerTitle = document.querySelector("#decisionComposerTitle");
  const decisionComposerClose = document.querySelector("#decisionComposerClose");
  const decisionComposerCancel = document.querySelector("#decisionComposerCancel");
  const decisionComposerSubmit = document.querySelector("#decisionComposerSubmit");
  const decisionComposerText = document.querySelector("#decisionComposerText");
  const decisionComposerMeta = document.querySelector("#decisionComposerMeta");
  const decisionComposerHint = document.querySelector("#decisionComposerHint");
  const decisionComposerStatus = document.querySelector("#decisionComposerStatus");
  const decisionResolutionActions = document.querySelector("#decisionResolutionActions");
  const decisionResolutionMeta = document.querySelector("#decisionResolutionMeta");
  const decisionAcceptOrder = document.querySelector("#decisionAcceptOrder");
  const decisionImplementOrder = document.querySelector("#decisionImplementOrder");
  const decisionReviseOrder = document.querySelector("#decisionReviseOrder");
  const directCommandDesk = document.querySelector(".direct-command-desk");
  const directCommandMeta = document.querySelector("#directCommandMeta");
  const directOrderText = document.querySelector("#directOrderText");
  const directOrderUrl = document.querySelector("#directOrderUrl");
  const directOrderMode = document.querySelector("#directOrderMode");
  const pullAgentIdeasToDirectOrder = document.querySelector("#pullAgentIdeasToDirectOrder");
  const directOrderAnalyze = document.querySelector("#directOrderAnalyze");
  const directOrderRunAgents = document.querySelector("#directOrderRunAgents");
  const directOrderRunQueue = document.querySelector("#directOrderRunQueue");
  const directOrderStatus = document.querySelector("#directOrderStatus");
  const executionControlPanel = document.querySelector("#executionControlPanel");
  const executionControlBadge = document.querySelector("#executionControlBadge");
  const executionControlTitle = document.querySelector("#executionControlTitle");
  const executionControlText = document.querySelector("#executionControlText");
  const executionControlResolved = document.querySelector("#executionControlResolved");
  const executionControlEvidence = document.querySelector("#executionControlEvidence");
  const executionControlPending = document.querySelector("#executionControlPending");
  const executionControlOrder = document.querySelector("#executionControlOrder");
  const executionControlLog = document.querySelector("#executionControlLog");
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
  let activePromptPayload = { title: "Prompt Mestre", badge: "Cheffe Call", text: "" };
  let pendingAdjustmentContext = null;
  let lowerDecksOpen = false;
  let currentMeetingSessionId = "";
  let latestCallPayload = null;
  let cheffeAdminPassword = window.sessionStorage.getItem("cheffeCallFullAdminPassword") || "";
  let photoApprovalQueue = [];
  let photoApprovalIndex = 0;
  let photoApprovalBusy = false;
  let actionFeedbackTimer = 0;
  let latestOpinionFlow = [];
  let decisionComposerSeed = null;
  let latestDecisionOrder = null;
  let pendingDecisionResolution = null;
  let latestDirectOrder = null;

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

  function setDirectOrderStatus(message, tone = "") {
    if (!directOrderStatus) return;
    directOrderStatus.textContent = message;
    directOrderStatus.dataset.tone = tone;
  }

  function setExecutionControl(options = {}) {
    if (!executionControlPanel) return;
    const summary = options.summary || {};
    executionControlPanel.dataset.state = options.tone || options.state || "idle";
    if (executionControlBadge) executionControlBadge.textContent = options.badge || "Controle";
    if (executionControlTitle) executionControlTitle.textContent = options.title || "Aguardando comando real";
    if (executionControlText) {
      executionControlText.textContent =
        options.text || "A ordem direta, a runtime e a fila deixam o estado aqui, mesmo se o popup for fechado.";
    }
    if (executionControlResolved) executionControlResolved.textContent = summary.resolved || "Nada executado";
    if (executionControlEvidence) executionControlEvidence.textContent = summary.evidence || "Sem prova ainda";
    if (executionControlPending) executionControlPending.textContent = summary.pending || "Aguardando ordem";
    if (executionControlOrder) executionControlOrder.textContent = summary.order || "Nenhuma";
    if (executionControlLog) {
      executionControlLog.textContent = String(options.log || "controle pronto").trim() || "controle pronto";
    }
  }

  function normalizeFeedbackState(state) {
    const value = String(state || "pending").toLowerCase();
    if (value === "ok" || value === "success" || value === "complete" || value === "completed") return "done";
    if (value === "error" || value === "fail" || value === "failed") return "bad";
    return value;
  }

  function setAgentResponse(options = {}) {
    if (!agentResponsePanel) return;
    const items = Array.isArray(options.items) ? options.items : [];
    const summary = options.summary && typeof options.summary === "object" ? options.summary : null;
    agentResponsePanel.dataset.tone = options.tone || "idle";
    if (agentResponseBadge) agentResponseBadge.textContent = options.badge || "Resposta dos agentes";
    if (agentResponseTitle) agentResponseTitle.textContent = options.title || "Aguardando sua ordem";
    if (agentResponseText) {
      agentResponseText.textContent =
        options.text || "A Cheffe Call vai registrar aqui o recebimento, a resposta dos agentes e o próximo passo.";
    }
    if (agentResponseNext) {
      agentResponseNext.textContent = options.next || "Abra uma rodada ou escolha uma ação em um card.";
    }
    if (agentResponseSummary) {
      agentResponseSummary.hidden = !summary;
      if (summary) {
        if (agentResponseResolved) agentResponseResolved.textContent = summary.resolved || "Nada confirmado ainda.";
        if (agentResponseEvidence) agentResponseEvidence.textContent = summary.evidence || "Sem prova registrada.";
        if (agentResponsePending) agentResponsePending.textContent = summary.pending || "Aguardando próxima ação.";
        if (agentResponseOrder) agentResponseOrder.textContent = summary.order || "Nenhuma ordem real gravada.";
      }
    }
    if (agentResponseList) {
      agentResponseList.innerHTML = items.length
        ? items
            .map((item) => {
              const data = typeof item === "object" ? item : { text: String(item || "") };
              return `
                <li data-state="${escapeHtml(normalizeFeedbackState(data.state || "pending"))}">
                  <span>${escapeHtml(data.label || "resposta")}</span>
                  <strong>${escapeHtml(data.agent || data.title || "Cheffe Call")}</strong>
                  <p>${escapeHtml(data.text || "")}</p>
                </li>
              `;
            })
            .join("")
        : `
          <li data-state="pending">
            <span>aguardando</span>
            <strong>Cheffe Call</strong>
            <p>Nenhuma resposta nova registrada ainda.</p>
          </li>
        `;
    }
    if (!options.decisionActions) {
      hideDecisionResolutionActions(true);
    }
  }

  function setDecisionResolutionBusy(isBusy) {
    [decisionAcceptOrder, decisionImplementOrder, decisionReviseOrder].forEach((button) => {
      if (button) button.disabled = Boolean(isBusy);
    });
  }

  function hideDecisionResolutionActions(clear = false) {
    if (clear) pendingDecisionResolution = null;
    if (decisionResolutionActions) decisionResolutionActions.hidden = true;
    if (decisionResolutionMeta) {
      decisionResolutionMeta.textContent = "Analise pronta. Escolha se isso vira ordem real.";
    }
    setDecisionResolutionBusy(false);
  }

  function showDecisionResolutionActions(decision) {
    if (!decisionResolutionActions || !decision) return;
    pendingDecisionResolution = decision;
    decisionResolutionActions.hidden = false;
    const selection = decision.selection || {};
    const guide = selection.guide || {};
    const accepted = Boolean(decision.acceptedAt);
    if (decisionResolutionMeta) {
      decisionResolutionMeta.textContent = accepted
        ? "Ordem real aceita e registrada. Agora você pode implementar ou ajustar antes de executar."
        : "Resposta analisada. Nada foi implementado ainda: escolha aceitar como ordem real, implementar agora ou ajustar o contexto.";
    }
    if (decisionAcceptOrder) {
      decisionAcceptOrder.textContent =
        guide.value === "task" || guide.value === "study" ? "Criar tarefa real" : "Aceitar como ordem real";
      decisionAcceptOrder.disabled = accepted;
    }
    if (decisionImplementOrder) {
      decisionImplementOrder.textContent = accepted ? "Implementar ordem aceita" : "Implementar agora";
      decisionImplementOrder.disabled = false;
    }
    if (decisionReviseOrder) {
      decisionReviseOrder.disabled = false;
    }
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
      const state = normalizeFeedbackState(typeof step === "object" ? step.state || "pending" : "pending");
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
    if (cheffeActionFeedbackHome) {
      cheffeActionFeedbackHome.hidden = !options.home;
    }
    cheffeActionFeedbackClose?.toggleAttribute("hidden", options.closable === false);
    if (options.autoCloseMs && options.autoClose === true) {
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
    payload = payload || {};
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
      (payload.runGeneratedAt || publicSummary.lastRunAt)
        ? `Última runtime: ${formatFeedbackTime(payload.runGeneratedAt || publicSummary.lastRunAt)}`
        : ""
    ];
    return lines.filter(Boolean).join("\n");
  }

  function firstFiniteNumber(values = []) {
    const found = values.find((value) => Number.isFinite(Number(value)));
    return found === undefined ? null : Number(found);
  }

  function getListCount(value) {
    if (Array.isArray(value)) return value.length;
    if (value && typeof value === "object") return Object.keys(value).length;
    return 0;
  }

  function firstText(values = []) {
    const found = values.find((value) => String(value || "").trim());
    return found === undefined ? "" : String(found || "").trim();
  }

  function compactProofList(values = [], limit = 6) {
    return values
      .map((value) => String(value || "").trim())
      .filter(Boolean)
      .slice(0, limit);
  }

  function getRuntimeEvidence(payload = {}) {
    payload = payload || {};
    const runtime = payload.runtime || payload.runtimeSummary || {};
    const runtimeSummary = runtime.summary || runtime;
    const publicSummary = payload.summary || {};
    const feedback = payload.feedback || {};
    const proof = payload.proof || payload.executionProof || runtime.executionProof || {};
    const proofApplication = proof.application || {};
    const ecosystemStudy = proof.ecosystemStudy || payload.ecosystemStudy || runtime.ecosystemStudy || {};
    const executionSummary = payload.executionSummary || runtime.executionSummary || {};
    const imageApprovals = runtime.imageApprovals || {};
    const generatedAt = firstText([
      proof.generatedAt,
      payload.generatedAt,
      payload.runGeneratedAt,
      publicSummary.generatedAt,
      publicSummary.lastRunAt,
      runtimeSummary.generatedAt
    ]);
    const reportJson = firstText([proof.reportJson, runtimeSummary.reportJson, payload.reportJson]);
    const reportMd = firstText([proof.reportMd, runtimeSummary.reportMd, payload.reportMd]);
    const registry = firstText([proof.registry, runtimeSummary.registry, payload.registry]);
    const ecosystemStudyFile = firstText([
      proof.ecosystemStudyFile,
      ecosystemStudy.proof?.file,
      payload.ecosystemStudyFile
    ]);
    const ecosystemCycle = firstFiniteNumber([
      ecosystemStudy.learningCycle,
      proof.ecosystemLearningCycle,
      payload.ecosystemLearningCycle
    ]);
    const ecosystemFocus = Array.isArray(ecosystemStudy.focusModules)
      ? ecosystemStudy.focusModules
      : Array.isArray(proof.ecosystemFocus)
        ? proof.ecosystemFocus.map((area) => ({ area }))
        : [];
    const ecosystemSignals = Array.isArray(ecosystemStudy.currentSignals)
      ? ecosystemStudy.currentSignals
      : Array.isArray(ecosystemStudy.impactGate?.currentSignals)
        ? ecosystemStudy.impactGate.currentSignals
        : [];
    const endpoint = firstText([proof.endpoint, payload.endpoint, payload.ok ? "POST /api/real-agents/run" : ""]);
    const httpStatus = firstText([proof.httpStatus, proof.status, payload.httpStatus, payload.ok ? "201" : ""]);
    const deliveredAgents = firstFiniteNumber([
      proof.deliveredAgents,
      publicSummary.deliveredAgents,
      runtimeSummary.deliveredAgents,
      payload.deliveredAgents
    ]);
    const totalAgents = firstFiniteNumber([
      proof.totalAgents,
      publicSummary.totalAgents,
      runtimeSummary.totalAgents,
      payload.totalAgents
    ]);
    const failedAgents = firstFiniteNumber([
      proof.failedAgents,
      publicSummary.failedAgents,
      runtimeSummary.failedAgents,
      payload.failedAgents
    ]);
    const queueItems = firstFiniteNumber([
      proof.queueItems,
      publicSummary.activeQueue,
      payload.queueItems,
      getListCount(payload.queue),
      getListCount(runtime.queue)
    ]);
    const ordersReturned = firstFiniteNumber([
      proof.ordersReturned,
      proof.ordersAfter,
      getListCount(payload.orders),
      getListCount(runtime.orders)
    ]);
    const orderDelta = firstFiniteNumber([proof.orderDelta, payload.orderDelta]);
    const officeOrderId = firstText([proof.officeOrderId, proof.orderId, payload.officeOrderId]);
    const proofFiles = compactProofList(
      Array.isArray(proof.files)
        ? proof.files.map((file) => file?.path || file?.label || file)
        : []
    );
    const changedFilesCount = Math.max(
      getListCount(proof.changedFiles),
      getListCount(payload.changedFiles),
      getListCount(runtime.changedFiles),
      getListCount(publicSummary.changedFiles),
      getListCount(feedback.changedFiles)
    );
    const artifactsCount = Math.max(
      getListCount(proof.artifacts),
      getListCount(payload.artifacts),
      getListCount(runtime.artifacts),
      getListCount(publicSummary.artifacts),
      getListCount(feedback.artifacts)
    );
    const deliveredCount = firstFiniteNumber([
      executionSummary.delivered,
      runtimeSummary.delivered,
      publicSummary.delivered,
      feedback.delivered,
      payload.delivered
    ]);
    const generatedCount = firstFiniteNumber([
      runtimeSummary.generatedArticles,
      publicSummary.generatedArticles,
      feedback.generatedArticles,
      runtimeSummary.articlesGenerated,
      publicSummary.articlesGenerated
    ]);
    const publishedCount = firstFiniteNumber([
      runtimeSummary.publishedArticles,
      publicSummary.publishedArticles,
      feedback.publishedArticles,
      runtimeSummary.published,
      publicSummary.published
    ]);
    const appliedFocusCount = firstFiniteNumber([
      runtimeSummary.imageApprovalsApplied,
      imageApprovals.applied,
      publicSummary.imageApprovalsApplied,
      feedback.imageApprovalsApplied,
      proofApplication.imageApprovalsApplied
    ]);
    const executionSignals = [
      endpoint ? `${endpoint}${httpStatus ? ` HTTP ${httpStatus}` : ""}` : "",
      reportJson ? `relatório JSON: ${reportJson}` : "",
      reportMd ? `relatório MD: ${reportMd}` : "",
      registry ? `registro de agentes: ${registry}` : "",
      ecosystemStudyFile ? `estudo do ecossistema: ${ecosystemStudyFile}` : "",
      ecosystemCycle ? `ciclo de aprendizado ${ecosystemCycle}` : "",
      ecosystemFocus.length
        ? `módulos estudados: ${ecosystemFocus.map((item) => item.area || item).filter(Boolean).slice(0, 4).join(", ")}`
        : "",
      ecosystemSignals.length ? `sinais de impacto: ${ecosystemSignals.slice(0, 3).join("; ")}` : "",
      generatedAt ? `runtime gerada em ${formatFeedbackTime(generatedAt) || generatedAt}` : "",
      deliveredAgents > 0 ? `${deliveredAgents}${totalAgents ? `/${totalAgents}` : ""} agentes entregaram` : "",
      failedAgents > 0 ? `${failedAgents} agente${failedAgents === 1 ? "" : "s"} falharam` : "",
      queueItems > 0 ? `${queueItems} item${queueItems === 1 ? "" : "s"} na fila real` : "",
      ordersReturned > 0 ? `${ordersReturned} ordem${ordersReturned === 1 ? "" : "s"} retornada${ordersReturned === 1 ? "" : "s"}` : "",
      orderDelta > 0 ? `${orderDelta} ordem${orderDelta === 1 ? "" : "s"} gravada${orderDelta === 1 ? "" : "s"} em office-orders.json` : "",
      officeOrderId ? `ordem registrada: ${officeOrderId}` : "",
      ...proofFiles
    ].filter(Boolean);
    const applicationSignals = [
      changedFilesCount > 0 ? `${changedFilesCount} arquivo${changedFilesCount === 1 ? "" : "s"} de aplicação alterado${changedFilesCount === 1 ? "" : "s"}` : "",
      artifactsCount > 0 ? `${artifactsCount} artefato${artifactsCount === 1 ? "" : "s"} retornado${artifactsCount === 1 ? "" : "s"}` : "",
      deliveredCount > 0 ? `${deliveredCount} entrega${deliveredCount === 1 ? "" : "s"} operacional${deliveredCount === 1 ? "" : "s"} registrada${deliveredCount === 1 ? "" : "s"}` : "",
      generatedCount > 0 ? `${generatedCount} artigo${generatedCount === 1 ? "" : "s"} gerado${generatedCount === 1 ? "" : "s"}` : "",
      publishedCount > 0 ? `${publishedCount} ${publishedCount === 1 ? "publicação confirmada" : "publicações confirmadas"}` : "",
      appliedFocusCount > 0 ? `foto/foco aplicado: ${appliedFocusCount}` : ""
    ].filter(Boolean);
    const hasExecutionProof = executionSignals.length > 0;
    const hasApplicationProof = applicationSignals.length > 0;
    const evidenceLines = [
      hasExecutionProof ? `Execução provada: ${executionSignals.slice(0, 5).join("; ")}` : "",
      hasApplicationProof
        ? `Aplicação provada: ${applicationSignals.join("; ")}`
        : hasExecutionProof
          ? "Aplicação/publicação: ainda não provada no alvo final."
          : ""
    ].filter(Boolean);
    return {
      hasEvidence: hasExecutionProof || hasApplicationProof,
      hasExecutionProof,
      hasApplicationProof,
      proofLevel: hasApplicationProof ? "application" : hasExecutionProof ? "execution" : "none",
      isResolved: hasApplicationProof,
      evidence: evidenceLines.length
        ? evidenceLines.join(" ")
        : "Runtime concluiu, mas não retornou endpoint, relatório, arquivo, contador ou aplicação verificável.",
      pending: hasApplicationProof
        ? "Conferir visualmente a tela, dado ou rotina afetada antes de encerrar."
        : hasExecutionProof
          ? "Falta provar mudança aplicada/publicada no alvo final. Peça validação por URL, arquivo ou tela específica."
          : "Reenviar com alvo mais específico ou pedir validação explícita de URL/arquivo/tela.",
      signals: hasApplicationProof ? applicationSignals : executionSignals,
      executionSignals,
      applicationSignals,
      ecosystemStudy
    };
  }

  function getRuntimeProofUi(outcome = {}) {
    if (outcome?.hasApplicationProof) {
      return {
        badge: "Aplicação provada",
        shortBadge: "Com aplicação",
        responseBadge: "Ordem aplicada",
        title: "Runtime provou aplicação no alvo",
        responseTitle: "Execução aplicada com prova",
        actionTitle: "Aplicação confirmada",
        text: "A runtime devolveu sinal de alteração, artefato, publicação ou aplicação no alvo final.",
        state: "done",
        tone: "ok",
        stepLabel: "Aplicação provada",
        itemLabel: "aplicação",
        terminalStatus: "status: aplicação provada"
      };
    }
    if (outcome?.hasExecutionProof) {
      return {
        badge: "Execução provada",
        shortBadge: "Aplicação pendente",
        responseBadge: "Execução provada",
        title: "Runtime provou execução, não aplicação",
        responseTitle: "Execução concluída; aplicação pendente",
        actionTitle: "Execução provada",
        text: "A runtime retornou endpoint, relatório, arquivo ou contador, mas ainda falta provar mudança aplicada/publicada no alvo final.",
        state: "pending",
        tone: "pending",
        stepLabel: "Aplicação pendente",
        itemLabel: "aplicação pendente",
        terminalStatus: "status: execução provada; aplicação pendente"
      };
    }
    return {
      badge: "Sem prova real",
      shortBadge: "Pendente",
      responseBadge: "Runtime rodada",
      title: "Runtime sem prova verificável",
      responseTitle: "Runtime sem prova real",
      actionTitle: "Runtime sem prova",
      text: "A runtime foi chamada, mas não retornou endpoint, relatório, arquivo, contador ou aplicação comprovada.",
      state: "pending",
      tone: "pending",
      stepLabel: "Prova pendente",
      itemLabel: "pendente",
      terminalStatus: "status: prova pendente"
    };
  }

  function buildRuntimeOutcomeSummary(payload = {}, orderText = "", scopeLabel = "ordem") {
    const outcome = getRuntimeEvidence(payload);
    return {
      resolved: outcome.hasApplicationProof
        ? `Runtime da ${scopeLabel} provou aplicação no alvo.`
        : outcome.hasExecutionProof
          ? `Runtime da ${scopeLabel} tem prova real de execução, mas não de aplicação/publicação.`
          : `Runtime da ${scopeLabel} foi rodada, mas ainda não provou execução verificável.`,
      evidence: outcome.evidence,
      pending: outcome.pending,
      order: summarizeOneLine(orderText, "Ordem enviada aos agentes.")
    };
  }

  function getRuntimeOutcomeTone(payload = {}) {
    return getRuntimeProofUi(getRuntimeEvidence(payload)).tone;
  }

  function buildSessionProofSummary(payload = {}, replies = [], orderText = "") {
    const session = payload?.meeting?.currentSession || payload?.session || {};
    const proof = session.proof || payload.proof || {};
    const research = session.directUrlResearch || payload.directUrlResearch || {};
    const ecosystemStudy = session.ecosystemStudy || payload.ecosystemStudy || {};
    const lines = [
      proof.sessionId ? `sessão: ${proof.sessionId}` : session.id ? `sessão: ${session.id}` : "",
      proof.officeOrderId ? `ordem em office-orders.json: ${proof.officeOrderId}` : "",
      proof.ecosystemStudyFile ? `estudo do ecossistema: ${proof.ecosystemStudyFile}` : "",
      proof.ecosystemLearningCycle ? `ciclo de aprendizado ${proof.ecosystemLearningCycle}` : "",
      Array.isArray(ecosystemStudy.focusModules) && ecosystemStudy.focusModules.length
        ? `módulos estudados: ${ecosystemStudy.focusModules.map((item) => item.area).filter(Boolean).slice(0, 4).join(", ")}`
        : "",
      research.url
        ? research.ok
          ? `URL lida HTTP ${research.status}: ${research.title || research.h1 || research.description || research.url}`
          : `URL não comprovada: ${research.error || research.url}`
        : "",
      `${replies.length} resposta${replies.length === 1 ? "" : "s"} registrada${replies.length === 1 ? "" : "s"} na sessão`
    ].filter(Boolean);
    return {
      resolved: "Ordem direta recebeu resposta analisada e registro rastreável.",
      evidence: lines.length ? `Resposta provada: ${lines.join("; ")}` : "Resposta registrada, mas sem identificador de sessão retornado.",
      pending: "Aceitar, ajustar ou rodar agentes para tentar provar aplicação.",
      order: summarizeOneLine(orderText, "Ordem direta registrada.")
    };
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

  function syncVisibleInstruction(value, options = {}) {
    const text = String(value || "").trim();
    const visibleText = String(options.visibleText ?? text).trim();
    if (instructionInput) instructionInput.value = text;
    if (quickInstructionInput && options.quick !== false) quickInstructionInput.value = visibleText;
    if (options.focus !== false) quickInstructionInput?.focus();
  }

  function clampPercent(value, fallback = 0) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return fallback;
    return Math.max(0, Math.min(100, Math.round(numeric)));
  }

  function normalizePromptKey(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  }

  function getAdjustmentGuide() {
    const guides = {
      "no-repeat": {
        label: "Sem repetição",
        directive: "Reescreva a opinião para ficar única. Corte frases genéricas, repetições de outros agentes e qualquer fala sem ação própria."
      },
      specific: {
        label: "Mais específico",
        directive: "Troque abstração por contexto concreto: tela, arquivo provável, dado, rotina afetada, risco e validação."
      },
      task: {
        label: "Virar tarefa",
        directive: "Transforme a opinião em tarefa executável com dono, primeiro passo, critério de aceite e bloqueio."
      },
      validation: {
        label: "Virar validação",
        directive: "Transforme a opinião em checklist de validação: o que testar, onde observar e qual sinal prova que funcionou."
      },
      implementation: {
        label: "Virar implementação",
        directive: "Transforme a opinião em prompt de implementação pronto para rodar, com escopo pequeno e resultado verificável."
      },
      visual: {
        label: "Ajuste visual",
        directive: "Ajuste a opinião para apontar o problema visual real, o efeito na leitura e a mudança mínima de interface."
      }
    };
    return guides[promptAdjustmentSelect?.value || "no-repeat"] || guides["no-repeat"];
  }

  function getDecisionActionGuide(value = decisionActionSelect?.value || "analyze") {
    const guides = {
      analyze: {
        value: "analyze",
        label: "Analisar e responder",
        roomAction: "terminal",
        directive: "Analise a ordem, explique o entendimento, diga o que pode ser resolvido agora e aponte a próxima ação concreta.",
        after: "A resposta entra na reunião para você aprovar, ajustar ou transformar em tarefa."
      },
      rethink: {
        value: "rethink",
        label: "Repensar opinião",
        roomAction: "terminal",
        directive: "Reescreva a opinião com mais inteligência: corte repetição, traga evidência, diferença real e próxima ação verificável.",
        after: "Use a nova resposta para decidir se aprova, transforma em tarefa ou manda implementar."
      },
      study: {
        value: "study",
        label: "Estudar melhor",
        roomAction: "task",
        directive: "Levante contexto, riscos, arquivos/telas prováveis, perguntas em aberto e um roteiro de validação antes de qualquer execução.",
        after: "O estudo vira tarefa rastreável e volta com lacunas claras."
      },
      accept: {
        value: "accept",
        label: "Aceitar ideia como ordem",
        roomAction: "approve",
        directive: "Trate a ideia como decisão aprovada: explique o que foi aceito, qual entrega ela exige e qual critério prova que ficou bom.",
        after: "A análise volta primeiro; depois você confirma se a ideia vira ordem real."
      },
      task: {
        value: "task",
        label: "Criar tarefa rastreável",
        roomAction: "task",
        directive: "Transforme a ordem em tarefa com dono, escopo, primeiro passo, critério de aceite, risco e bloqueio.",
        after: "A tarefa fica registrada para execução posterior."
      },
      implement: {
        value: "implement",
        label: "Implementar agora",
        roomAction: "implement",
        directive: "Implemente a decisão como ordem real. Se não puder implementar, explique bloqueio, arquivo/tela faltante e a menor próxima ação segura.",
        after: "A análise volta primeiro; a runtime só roda quando você clicar em Implementar agora no painel."
      },
      validate: {
        value: "validate",
        label: "Validar resultado",
        roomAction: "terminal",
        directive: "Monte uma validação objetiva: o que conferir, como testar, qual evidência aceita e qual falha reprova.",
        after: "A resposta vira checklist para conferir se a ordem foi cumprida."
      },
      visual: {
        value: "visual",
        label: "Ajuste visual",
        roomAction: "terminal",
        directive: "Analise tela, hierarquia, legibilidade e fluxo. Proponha mudança visual pequena, útil e verificável.",
        after: "A resposta volta como ajuste visual pronto para aprovar ou implementar."
      },
      confirm: {
        value: "confirm",
        label: "Confirmar se implementou",
        roomAction: "terminal",
        directive: "Responda como auditor: o que foi implementado, onde verificar, o que ainda não foi provado e o próximo teste.",
        after: "A resposta precisa separar concluído, pendente e evidência."
      }
    };
    return guides[value] || guides.analyze;
  }

  function getDecisionAgents() {
    if (Array.isArray(promptConsoleData?.agents) && promptConsoleData.agents.length) {
      return promptConsoleData.agents;
    }
    const source = currentRealAgents.length ? currentRealAgents : fallbackAgents;
    return source.map((item, index) => ({
      slug: slugify(getAgentDisplayName(item) || `agent-${index}`),
      name: getAgentDisplayName(item),
      office: getAgentOffice(item),
      role: item.role || item.function || "agente",
      prompt: item.prompt || ""
    }));
  }

  function getDecisionAgentBySlug(slug) {
    const normalizedSlug = String(slug || "").trim();
    if (!normalizedSlug) return null;
    return getDecisionAgents().find((item) => item.slug === normalizedSlug) || null;
  }

  function syncDecisionSelectors() {
    const agents = getDecisionAgents();
    const officeValue = decisionOfficeSelect?.value || "";
    const agentValue = decisionAgentSelect?.value || "";
    const offices = Array.from(new Set(agents.map((item) => item.office).filter(Boolean))).sort((a, b) =>
      a.localeCompare(b, "pt-BR")
    );
    fillSelect(
      decisionOfficeSelect,
      offices.map((office) => ({ value: office, label: office })),
      "Todos os escritórios"
    );
    if (decisionOfficeSelect && offices.includes(officeValue)) {
      decisionOfficeSelect.value = officeValue;
    }
    refreshDecisionAgentOptions(decisionOfficeSelect?.value || "", agentValue);
    refreshDecisionPreview();
  }

  function refreshDecisionAgentOptions(selectedOffice = "", preferredSlug = "") {
    if (!decisionAgentSelect) return;
    const agents = getDecisionAgents();
    const filtered = selectedOffice ? agents.filter((item) => item.office === selectedOffice) : agents;
    fillSelect(
      decisionAgentSelect,
      filtered.map((item) => ({
        value: item.slug,
        label: `${item.name} • ${item.office} • ${item.role || "agente"}`
      })),
      "Cheffe Call escolhe o melhor"
    );
    const preferred = preferredSlug || "";
    if (preferred && filtered.some((item) => item.slug === preferred)) {
      decisionAgentSelect.value = preferred;
    }
  }

  function getDecisionSelection() {
    const guide = getDecisionActionGuide();
    const agent = getDecisionAgentBySlug(decisionAgentSelect?.value || "");
    const office = decisionOfficeSelect?.value || agent?.office || "Todos os escritórios";
    return {
      guide,
      agent,
      office,
      officeLabel: office || "Todos os escritórios",
      agentLabel: agent ? `${agent.name} (${agent.role || "agente"})` : "Competição automática dos agentes"
    };
  }

  function refreshDecisionPreview(context = "") {
    if (!decisionContextTitle || !decisionContextPreview) return;
    const selection = getDecisionSelection();
    const subject = String(
      context || quickInstructionInput?.value || instructionInput?.value || latestCallPayload?.meeting?.lastInstruction || ""
    ).trim();
    decisionContextTitle.textContent = `${selection.guide.label} • ${selection.officeLabel}`;
    decisionContextPreview.textContent = subject
      ? `${selection.agentLabel}: ${subject.slice(0, 180)}`
      : `${selection.agentLabel}. Abra a decisão para escrever contexto, evidência esperada e ordem real.`;
    if (decisionDeskMeta) {
      decisionDeskMeta.textContent = selection.guide.after;
    }
  }

  function selectDecisionAgentForOpinion(active) {
    if (!active) return null;
    const promptAgent = findPromptAgentForOpinion(active);
    const office = promptAgent?.office || getAgentOffice(active);
    if (decisionOfficeSelect) decisionOfficeSelect.value = office || "";
    refreshDecisionAgentOptions(office || "", promptAgent?.slug || "");
    if (decisionAgentSelect) decisionAgentSelect.value = promptAgent?.slug || "";
    refreshDecisionPreview(active.opinion || active.assignment?.idea || "");
    return promptAgent;
  }

  function buildDecisionDefaultText(seed = {}) {
    const active = seed.active || currentOpinions[activeSpeakerIndex] || null;
    const baseOrder = String(quickInstructionInput?.value || instructionInput?.value || latestCallPayload?.meeting?.lastInstruction || "").trim();
    const activeIdea = String(seed.text || active?.opinion || active?.assignment?.idea || "").trim();
    const pieces = [];
    if (baseOrder) pieces.push(`Ordem atual: ${baseOrder}`);
    if (activeIdea) pieces.push(`Opinião/ideia em análise: ${activeIdea}`);
    pieces.push("Quero resposta objetiva: o que foi entendido, o que será resolvido, evidência, pendências e próxima ação.");
    return pieces.join("\n\n");
  }

  function buildDecisionPrompt(contextText, selection) {
    const agentPrompt = selection.agent?.prompt || "";
    return [
      "ORDEM REAL DA CHEFFE CALL",
      `Escritório responsável: ${selection.officeLabel}`,
      `Agente principal: ${selection.agentLabel}`,
      `Tipo de ação: ${selection.guide.label}`,
      "",
      "Contexto do operador:",
      contextText,
      "",
      "Diretriz da ação:",
      selection.guide.directive,
      "",
      "Resposta obrigatória dos agentes:",
      "1. O que foi entendido",
      "2. O que foi resolvido ou será resolvido agora",
      "3. Evidência concreta, tela, dado, rotina, arquivo ou comportamento afetado",
      "4. O que ainda falta, risco ou bloqueio",
      "5. Próxima ação implementável ou validação",
      "",
      "Regra de autonomia:",
      "Se a fala repetir outra opinião ou não trouxer evidência útil, o agente deve ficar em silêncio e perder prioridade na competição.",
      agentPrompt ? ["", "Prompt base do agente principal:", agentPrompt].join("\n") : ""
    ]
      .filter(Boolean)
      .join("\n");
  }

  function getDirectModeGuide(value = directOrderMode?.value || "research") {
    const guides = {
      research: {
        label: "Pesquisar URL e responder",
        directive:
          "Pesquisar a URL específica quando existir, resumir fatos úteis, separar o que foi comprovado do que ainda é inferência e propor alteração verificável."
      },
      rewrite: {
        label: "Alterar com minhas instruções",
        directive:
          "Usar as ideias dos agentes como matéria-prima, aplicar as instruções do operador e devolver uma versão alterada sem repetir pedidos antigos."
      },
      run: {
        label: "Rodar agentes com esta ordem",
        directive:
          "Executar a ordem na runtime real. Se não houver alvo suficiente para alterar arquivo, dado ou rotina, explicar o bloqueio e pedir o menor complemento possível."
      },
      validate: {
        label: "Validar o que foi feito",
        directive:
          "Auditar o resultado: dizer o que foi implementado, onde verificar, qual evidência existe e qual parte ainda não foi provada."
      }
    };
    return guides[value] || guides.research;
  }

  function cleanAgentIdeaForDirectOrder(value = "") {
    const normalized = String(value || "").replace(/\s+/g, " ").trim();
    if (!normalized) return "";
    const subjectIndex = normalized.search(/\bAssunto:\s*(ORDEM DIRETA|Ordem direta|CHEFFE CALL|Prompt Mestre)/i);
    const withoutSubject = subjectIndex > 0 ? normalized.slice(0, subjectIndex).trim() : normalized;
    const hardStopIndex = withoutSubject.search(/\bIdeias dos agentes que podem ser aproveitadas\b/i);
    const withoutNestedIdeas = hardStopIndex > 0 ? withoutSubject.slice(0, hardStopIndex).trim() : withoutSubject;
    return summarizeOneLine(withoutNestedIdeas, "").slice(0, 260).trim();
  }

  function collectAgentIdeas(limit = 4) {
    const fromFlow = latestOpinionFlow.map((flow) => ({ ...flow.item, status: flow.status }));
    const source = fromFlow.length ? fromFlow : currentOpinions;
    const seen = new Set();
    return source
      .map((item) => {
        const text = cleanAgentIdeaForDirectOrder(item?.opinion || item?.assignment?.action || item?.assignment?.idea || "");
        const key = text.toLowerCase().replace(/\s+/g, " ").slice(0, 140);
        if (!text || seen.has(key)) return null;
        seen.add(key);
        return {
          agent: getAgentDisplayName(item),
          office: getAgentOffice(item),
          status: item.status?.label || item.status?.state || "opinião",
          text
        };
      })
      .filter(Boolean)
      .slice(0, limit);
  }

  function formatDirectIdeasForPrompt(ideas = []) {
    return ideas.length
      ? ideas.map((idea, index) => `${index + 1}. ${idea.agent} (${idea.office}, ${idea.status}): ${idea.text}`).join("\n")
      : "Nenhuma ideia de agente carregada. Responda só com a ordem direta do operador.";
  }

  function buildDirectOrderPrompt(options = {}) {
    const guide = getDirectModeGuide(options.mode);
    const selection = getDecisionSelection();
    const orderText = String(options.orderText ?? directOrderText?.value ?? "").trim();
    const urlText = String(options.urlText ?? directOrderUrl?.value ?? "").trim();
    const shouldIncludeIdeas = options.includeIdeas === true ||
      (options.includeIdeas !== false && directOrderMode?.value === "rewrite" && !/Ideias puxadas dos agentes:/i.test(orderText));
    const ideas = Array.isArray(options.ideas) ? options.ideas : shouldIncludeIdeas ? collectAgentIdeas() : [];
    const promptParts = [
      "ORDEM DIRETA DA CHEFFE CALL",
      `Modo: ${guide.label}`,
      `Escritório preferencial: ${selection.officeLabel}`,
      `Agente principal: ${selection.agentLabel}`,
      urlText ? `URL específica a pesquisar: ${urlText}` : "URL específica a pesquisar: nenhuma URL informada",
      "",
      "Ordem do operador:",
      orderText || "Pedir esclarecimento se faltar alvo concreto.",
      ""
    ];
    if (ideas.length) {
      promptParts.push(
        "Ideias dos agentes que podem ser aproveitadas ou corrigidas:",
        formatDirectIdeasForPrompt(ideas),
        ""
      );
    }
    promptParts.push(
      "Diretriz obrigatória:",
      guide.directive,
      "",
      "Resposta obrigatória:",
      "1. Resultado analisado ou executado",
      "2. Evidência real: URL, arquivo, tela, dado, rotina ou comportamento afetado",
      "3. O que não ficou provado",
      "4. Próxima ação concreta",
      "5. Se estiver repetindo pedido antigo, cortar a repetição e trazer uma decisão nova"
    );
    return {
      guide,
      selection,
      orderText,
      urlText,
      ideas,
      prompt: promptParts.join("\n")
    };
  }

  function setDirectOrderBusy(isBusy) {
    [directOrderAnalyze, directOrderRunAgents, directOrderRunQueue, pullAgentIdeasToDirectOrder].forEach((button) => {
      if (button) button.disabled = Boolean(isBusy);
    });
  }

  function pullAgentIdeasIntoDirectOrder(active = null) {
    const ideas = active
      ? [{ agent: getAgentDisplayName(active), office: getAgentOffice(active), status: "fala ativa", text: active.opinion || active.assignment?.action || "" }]
      : collectAgentIdeas();
    const cleanIdeas = ideas.filter((idea) => String(idea.text || "").trim());
    if (!cleanIdeas.length) {
      setDirectOrderStatus("Ainda não há ideia útil dos agentes para puxar. Abra uma rodada primeiro.", "bad");
      return "";
    }
    const current = String(directOrderText?.value || "").trim();
    const block = [
      current,
      current ? "" : "Quero aproveitar estas ideias, ajustar com minhas instruções e devolver uma ordem melhor:",
      "Ideias puxadas dos agentes:",
      formatDirectIdeasForPrompt(cleanIdeas),
      "",
      "Minhas alterações:",
      current ? "" : "- "
    ]
      .filter((line) => line !== null && line !== undefined)
      .join("\n");
    if (directOrderText) {
      directOrderText.value = block;
      directOrderText.focus();
      directOrderText.setSelectionRange(directOrderText.value.length, directOrderText.value.length);
    }
    if (directOrderMode) directOrderMode.value = "rewrite";
    setDirectOrderStatus(`${cleanIdeas.length} ideia${cleanIdeas.length === 1 ? "" : "s"} puxada${cleanIdeas.length === 1 ? "" : "s"} para ordem direta.`, "ok");
    directCommandDesk?.scrollIntoView({ behavior: "smooth", block: "center" });
    return block;
  }

  async function submitDirectOrder(shouldRunRuntime = false) {
    const password = getAdminPassword();
    if (!password) {
      setDirectOrderStatus("Senha Full Admin obrigatória para enviar ordem direta.", "bad");
      setStatus("Valide a senha Full Admin antes de enviar ordem direta.", "bad");
      quickPasswordInput?.focus();
      return;
    }
    const order = buildDirectOrderPrompt();
    if (!order.orderText && !order.urlText && !order.ideas.length) {
      setDirectOrderStatus("Escreva uma ordem, cole uma URL ou puxe ideias dos agentes.", "bad");
      directOrderText?.focus();
      return;
    }
    latestDirectOrder = { ...order, shouldRunRuntime, createdAt: new Date().toISOString() };
    setDirectOrderBusy(true);
    setDirectOrderStatus(shouldRunRuntime ? "Rodando ordem direta nos agentes..." : "Enviando ordem direta para análise...", "ok");
    setExecutionControl({
      badge: shouldRunRuntime ? "Runtime" : "Ordem direta",
      title: shouldRunRuntime ? "Rodando agentes com ordem direta" : "Analisando ordem direta",
      text: shouldRunRuntime
        ? "A ordem foi montada com URL, ideias puxadas e instruções do operador. A runtime vai rodar e o painel vai separar evidência de pendência."
        : "A ordem foi enviada para resposta analisada. Nada será chamado de implementação sem evidência.",
      tone: "idle",
      summary: {
        resolved: "Em andamento",
        evidence: "Aguardando resposta",
        pending: shouldRunRuntime ? "Runtime dos agentes" : "Aceite ou execução posterior",
        order: summarizeOneLine(order.orderText || order.urlText, "Ordem direta montada.")
      },
      log: order.prompt
    });
    setActionFeedback({
      badge: shouldRunRuntime ? "Runtime" : "Ordem direta",
      title: shouldRunRuntime ? "Rodando agentes" : "Analisando ordem direta",
      message: shouldRunRuntime
        ? "A Cheffe Call está executando a ordem direta na runtime real."
        : "A Cheffe Call está enviando a ordem direta para resposta dos agentes.",
      tone: "pending",
      closable: false,
      steps: [
        { label: "Ordem direta montada", state: "done" },
        { label: "Resposta dos agentes", state: "running" },
        { label: shouldRunRuntime ? "Runtime real" : "Aguardando decisão", state: shouldRunRuntime ? "pending" : "running" },
        { label: "Controle persistente", state: "pending" }
      ],
      details: order.prompt
    });
    try {
      syncVisibleInstruction(order.prompt, {
        visibleText: order.orderText || order.urlText || "",
        focus: false
      });
      if (commandInput) commandInput.value = order.prompt;
      const payload = await postCall("/api/cheffe-call/start", { password, instruction: order.prompt });
      activateMeetingResponse(order.prompt, payload);
      const replies = getPayloadOpinions(payload, order.prompt);
      const active = replies[0] || null;
      await postRoomAction("terminal", active, {
        title: `Ordem direta: ${order.guide.label}`,
        command: order.prompt,
        prompt: order.prompt,
        directOrder: true,
        directUrl: order.urlText,
        directMode: order.guide.label
      });
      let runtimePayload = null;
      if (shouldRunRuntime) {
        setActionFeedback({
          badge: "Runtime",
          title: "Runtime da ordem direta",
          message: "Os agentes responderam. Agora a runtime real tenta executar ou provar bloqueio.",
          tone: "pending",
          closable: false,
          steps: [
            { label: "Resposta dos agentes recebida", state: "done" },
            { label: "Ordem direta registrada", state: "done" },
            { label: "Runtime real em andamento", state: "running" },
            { label: "Prova e aprendizado em conferência", state: "pending" }
          ],
          details: order.prompt
        });
        runtimePayload = await runCheffeRuntime(password, order.prompt);
        await loadCall();
      }
      const summary = shouldRunRuntime
        ? buildRuntimeOutcomeSummary(runtimePayload, order.orderText || order.urlText || order.prompt, "ordem direta")
        : buildSessionProofSummary(payload, replies, order.orderText || order.urlText || order.prompt);
      const tone = shouldRunRuntime ? getRuntimeOutcomeTone(runtimePayload) : "ok";
      const outcome = shouldRunRuntime ? getRuntimeEvidence(runtimePayload) : null;
      const proofUi = shouldRunRuntime ? getRuntimeProofUi(outcome) : null;
      terminalEl.textContent = [
        shouldRunRuntime ? "> cheffe-call/direct-runtime" : "> cheffe-call/direct-order",
        `modo: ${order.guide.label}`,
        order.urlText ? `url: ${order.urlText}` : "",
        `respostas: ${replies.length}`,
        shouldRunRuntime ? `prova: ${proofUi.terminalStatus}` : "status: resposta analisada",
        "",
        shouldRunRuntime ? formatRuntimeDetailsForTerminal(runtimePayload, "runtime: ordem direta") : formatAgentReplies(replies, 5)
      ]
        .filter(Boolean)
        .join("\n");
      setExecutionControl({
        badge: shouldRunRuntime ? proofUi.badge : "Ordem direta",
        title: shouldRunRuntime
          ? proofUi.title
          : "Ordem direta analisada",
        text: shouldRunRuntime
          ? "O painel separou o que a runtime provou do que ainda precisa ser validado."
          : "A resposta ficou visível para você editar, aceitar ou mandar rodar agentes.",
        tone,
        summary,
        log: shouldRunRuntime ? formatRuntimeDetailsForTerminal(runtimePayload, order.prompt) : formatAgentReplies(replies, 5)
      });
      setAgentResponse({
        badge: shouldRunRuntime ? proofUi.responseBadge : "Ordem direta",
        title: shouldRunRuntime
          ? proofUi.responseTitle
          : `${replies.length} agentes responderam à ordem direta`,
        text: shouldRunRuntime
          ? proofUi.text
          : "A ordem direta foi recebida e virou resposta analisada sem fechar o controle.",
        next: shouldRunRuntime
          ? summary.pending
          : "Edite a ordem direta, puxe ideias, ou clique Rodar agentes para executar com a mesma base.",
        tone,
        summary,
        items: replies.length
          ? buildAgentReplyItems(replies, 4).map((item) => ({ ...item, state: shouldRunRuntime ? "done" : item.state }))
          : [{ state: "done", label: "ordem", agent: "Cheffe Call", text: order.orderText || order.urlText || order.prompt }]
      });
      setActionFeedback({
        badge: shouldRunRuntime ? proofUi.shortBadge : "Ordem direta",
        title: shouldRunRuntime
          ? proofUi.actionTitle
          : "Resposta analisada",
        message: shouldRunRuntime ? summary.evidence : "Os agentes responderam. O controle persistente guarda o resultado.",
        tone,
        closable: true,
        steps: [
          { label: "Ordem direta enviada", state: "done" },
          { label: "Resposta registrada", state: "done" },
          { label: shouldRunRuntime ? "Runtime concluída" : "Aguardando execução", state: shouldRunRuntime ? "done" : "running" },
          { label: shouldRunRuntime ? proofUi.stepLabel : "Controle atualizado", state: shouldRunRuntime ? proofUi.state : "pending" }
        ],
        details: shouldRunRuntime ? formatRuntimeDetailsForTerminal(runtimePayload, order.prompt) : formatAgentReplies(replies, 5)
      });
      setDirectOrderStatus(shouldRunRuntime ? "Ordem direta rodada. Confira evidência e pendências no controle." : "Ordem direta analisada. Você ainda controla a execução.", tone === "bad" ? "bad" : "ok");
      setStatus(shouldRunRuntime ? "Ordem direta rodada; evidência separada no controle." : "Ordem direta analisada pelos agentes.", "ok");
    } catch (error) {
      setExecutionControl({
        badge: "Falha",
        title: "Ordem direta não concluiu",
        text: error.message || "A Cheffe Call não conseguiu concluir a ordem direta.",
        tone: "bad",
        summary: {
          resolved: "Nada confirmado.",
          evidence: "Falha antes de resposta ou runtime completa.",
          pending: "Corrigir senha, URL ou ordem e tentar novamente.",
          order: summarizeOneLine(order.orderText || order.urlText || order.prompt, "Ordem preservada.")
        },
        log: error.message || "falha"
      });
      setActionFeedback({
        badge: "Falha",
        title: "Ordem direta falhou",
        message: error.message || "Não foi possível concluir a ordem direta.",
        tone: "bad",
        closable: true,
        steps: [
          { label: "Fluxo interrompido", state: "bad" },
          { label: "Ordem preservada no painel", state: "pending" }
        ],
        details: order.prompt
      });
      setAgentResponse({
        badge: "Falha",
        title: "Ordem direta não retornou resultado",
        text: error.message || "A ordem não chegou ao fim.",
        next: "Revise senha, URL e texto antes de reenviar.",
        tone: "bad",
        items: [{ state: "bad", label: "erro", agent: "Cheffe Call", text: error.message || "Falha na ordem direta." }]
      });
      setDirectOrderStatus(error.message || "Falha ao enviar ordem direta.", "bad");
      setStatus(error.message || "Falha ao enviar ordem direta.", "bad");
    } finally {
      setDirectOrderBusy(false);
      if (runApprovedOpinions) runApprovedOpinions.disabled = getReadyOpinionFlowItems().length === 0;
      if (directOrderRunQueue) directOrderRunQueue.disabled = getReadyOpinionFlowItems().length === 0;
    }
  }

  function summarizeOneLine(value, fallback = "Sem detalhe registrado.") {
    const text = String(value || "").replace(/\s+/g, " ").trim();
    if (!text) return fallback;
    return text.length > 190 ? `${text.slice(0, 187)}...` : text;
  }

  function findDecisionTargetReply(replies, selection, seed = {}) {
    const activeName = seed.active ? normalizePromptKey(getAgentDisplayName(seed.active)) : "";
    const selectedName = selection.agent ? normalizePromptKey(selection.agent.name) : "";
    const officeKey = normalizePromptKey(selection.officeLabel);
    return (
      replies.find((item) => selectedName && normalizePromptKey(getAgentDisplayName(item)) === selectedName) ||
      replies.find((item) => activeName && normalizePromptKey(getAgentDisplayName(item)) === activeName) ||
      replies.find((item) => officeKey && normalizePromptKey(getAgentOffice(item)) === officeKey) ||
      replies[0] ||
      seed.active ||
      null
    );
  }

  function setDecisionComposerStatus(message, tone = "") {
    if (!decisionComposerStatus) return;
    decisionComposerStatus.textContent = message;
    decisionComposerStatus.dataset.tone = tone;
  }

  function openDecisionComposer(seed = {}) {
    decisionComposerSeed = seed;
    if (seed.active) {
      selectDecisionAgentForOpinion(seed.active);
    }
    if (seed.action && decisionActionSelect) {
      decisionActionSelect.value = seed.action;
    }
    const selection = getDecisionSelection();
    const text = String(seed.contextText || "").trim() || buildDecisionDefaultText(seed);
    if (decisionComposerBadge) decisionComposerBadge.textContent = selection.guide.label;
    if (decisionComposerTitle) decisionComposerTitle.textContent = "Escrever ordem com contexto";
    if (decisionComposerMeta) {
      decisionComposerMeta.textContent = `${selection.officeLabel} • ${selection.agentLabel}`;
    }
    if (decisionComposerHint) decisionComposerHint.textContent = selection.guide.after;
    if (decisionComposerText) decisionComposerText.value = text;
    setDecisionComposerStatus("Aguardando envio.");
    refreshDecisionPreview(text);
    if (decisionComposer) {
      decisionComposer.hidden = false;
      decisionComposerText?.focus();
    }
  }

  function closeDecisionComposer() {
    if (decisionComposer) decisionComposer.hidden = true;
  }

  function buildDecisionTerminalText(selection, contextText, replies, runtimePayload = null) {
    const firstReply = replies[0] || {};
    return [
      "> cheffe-call/decision-desk",
      `escritorio: ${selection.officeLabel}`,
      `agente: ${selection.agentLabel}`,
      `acao: ${selection.guide.label}`,
      `respostas: ${replies.length}`,
      runtimePayload ? "runtime: concluida" : `registro: ${selection.guide.roomAction}`,
      "",
      "ordem:",
      contextText,
      "",
      firstReply.opinion ? `primeira resposta: ${firstReply.opinion}` : ""
    ]
      .filter(Boolean)
      .join("\n");
  }

  function buildDecisionResponseSummary(selection, replies, runtimePayload = null) {
    const firstReply = replies[0] || {};
    const implemented = selection.guide.value === "implement" && runtimePayload;
    const outcome = implemented ? getRuntimeEvidence(runtimePayload) : null;
    const evidence = implemented
      ? outcome.evidence
      : `${replies.length} resposta${replies.length === 1 ? "" : "s"} registrada${replies.length === 1 ? "" : "s"} na reunião.`;
    return {
      resolved: implemented
        ? outcome.hasApplicationProof
          ? "Decisão registrada e runtime executada com aplicação provada."
          : outcome.hasExecutionProof
            ? "Decisão registrada e runtime executada com prova de execução; aplicação ainda pendente."
            : "Decisão registrada e runtime rodada sem prova de implementação."
        : `${selection.guide.label} concluído para decisão.`,
      evidence,
      pending: implemented
        ? outcome.pending
        : selection.guide.value === "accept"
          ? "Ideia aceita. Falta implementar a fila ou abrir como Implementar agora."
          : selection.guide.after,
      order: implemented
        ? "Ordem enviada aos agentes; evidência define se pode chamar de implementada."
        : summarizeOneLine(firstReply.assignment?.action || firstReply.opinion || selection.guide.directive, "Ordem registrada para a próxima etapa.")
    };
  }

  function buildDecisionAnalysisSummary(selection, replies) {
    const firstReply = replies[0] || {};
    return {
      resolved: "Resposta analisada. Ainda não virou execução.",
      evidence: `${replies.length} resposta${replies.length === 1 ? "" : "s"} com dono, escritório e critério de ação.`,
      pending: "Escolher Aceitar como ordem real ou Implementar agora.",
      order: summarizeOneLine(
        firstReply.assignment?.action || firstReply.opinion || selection.guide.directive,
        "Aguardando aceite do operador."
      )
    };
  }

  function getDecisionCommitAction(selection, mode = "accept") {
    if (mode === "implement") return "implement";
    const value = selection?.guide?.value || "analyze";
    if (value === "task" || value === "study") return "task";
    if (value === "accept" || value === "implement") return "approve";
    return "terminal";
  }

  function buildDecisionCommitSummary(decision, mode, runtimePayload = null) {
    const selection = decision?.selection || getDecisionSelection();
    const contextText = decision?.contextText || "";
    const implemented = mode === "implement";
    const outcome = implemented ? getRuntimeEvidence(runtimePayload) : null;
    return {
      resolved: implemented
        ? outcome.hasApplicationProof
          ? "Ordem real registrada e runtime executada com aplicação provada."
          : outcome.hasExecutionProof
            ? "Ordem real registrada e runtime executada com prova de execução; aplicação ainda pendente."
            : "Ordem real registrada e runtime rodada sem prova de implementação."
        : "Ordem real aceita e registrada.",
      evidence: implemented
        ? outcome.evidence
        : "Servidor registrou a decisão; terminal e fila da reunião foram atualizados.",
      pending: implemented
        ? outcome.pending
        : "Implementar a ordem aceita ou ajustar o contexto antes de executar.",
      order: summarizeOneLine(
        contextText || decision?.targetReply?.assignment?.action || decision?.targetReply?.opinion || selection.guide?.directive,
        "Ordem real registrada."
      )
    };
  }

  async function commitDecisionOrder(mode = "accept") {
    const decision = pendingDecisionResolution || latestDecisionOrder;
    if (!decision) {
      setStatus("Nenhuma análise pronta para aceitar ou implementar.", "bad");
      return;
    }
    const password = getAdminPassword();
    if (!password) {
      setStatus("Valide a senha Full Admin antes de aceitar ou implementar a ordem.", "bad");
      quickPasswordInput?.focus();
      return;
    }
    const selection = decision.selection || getDecisionSelection();
    const contextText = decision.contextText || "";
    const replies = Array.isArray(decision.replies) ? decision.replies : [];
    const targetReply = decision.targetReply || findDecisionTargetReply(replies, selection, decision.seed || {});
    const roomAction = getDecisionCommitAction(selection, mode);
    const label = mode === "implement" ? "Implementar ordem real" : "Aceitar ordem real";
    setDecisionResolutionBusy(true);
    setActionFeedback({
      badge: mode === "implement" ? "Implementar" : "Aceitar",
      title: label,
      message:
        mode === "implement"
          ? "Registrando a ordem real e acionando a runtime dos agentes."
          : "Gravando a decisão como ordem real antes de qualquer execução.",
      tone: "pending",
      closable: false,
      steps: [
        { label: "Análise escolhida", state: "done" },
        { label: "Registro da ordem real", state: "running" },
        { label: mode === "implement" ? "Runtime dos agentes" : "Aguardando implementação", state: "pending" }
      ],
      details: decision.promptText || contextText
    });
    try {
      await postRoomAction(roomAction, targetReply, {
        title: `${label}: ${selection.guide?.label || "Mesa de decisão"}`,
        command: decision.promptText || contextText,
        prompt: decision.promptText || contextText,
        howTo: selection.guide?.directive || "",
        decisionType: selection.guide?.value || "analyze",
        decisionStage: mode,
        acceptedAt: new Date().toISOString(),
        text: contextText,
        agent: selection.agent?.name || getAgentDisplayName(targetReply) || "Cheffe Call",
        office: selection.officeLabel || getAgentOffice(targetReply),
        role: selection.agent?.role || targetReply?.role || "agente principal"
      });
      let runtimePayload = null;
      if (mode === "implement") {
        setActionFeedback({
          badge: "Runtime",
          title: "Executando ordem real",
          message: "A decisão já foi aceita; a runtime real dos agentes está rodando agora.",
          tone: "pending",
          closable: false,
          steps: [
            { label: "Ordem real registrada", state: "done" },
            { label: "Runtime em execução", state: "running" },
            { label: "Atualização da sala", state: "pending" }
          ],
          details: contextText
        });
        runtimePayload = await runCheffeRuntime(
          password,
          `Implementar ordem real da Mesa de Decisão: ${selection.guide?.label || "ação"} / ${
            selection.officeLabel || "Todos os escritórios"
          } / ${selection.agentLabel || "competição automática"}. ${contextText}`
        );
        await loadCall();
      }
      terminalEl.textContent = buildDecisionTerminalText(selection, contextText, replies, runtimePayload);
      const updatedDecision = {
        ...decision,
        acceptedAt: decision.acceptedAt || new Date().toISOString(),
        implementedAt: mode === "implement" ? new Date().toISOString() : decision.implementedAt || "",
        runtimePayload
      };
      latestDecisionOrder = updatedDecision;
      const commitSummary = buildDecisionCommitSummary(updatedDecision, mode, runtimePayload);
      const commitOutcome = mode === "implement" ? getRuntimeEvidence(runtimePayload) : null;
      const commitProofUi = mode === "implement" ? getRuntimeProofUi(commitOutcome) : null;
      const commitTone = mode === "implement" ? getRuntimeOutcomeTone(runtimePayload) : "ok";
      setExecutionControl({
        badge: mode === "implement" ? commitProofUi.badge : "Ordem aceita",
        title:
          mode === "implement"
            ? commitProofUi.title
            : "Mesa registrou a ordem real",
        text:
          mode === "implement"
            ? "A Mesa de decisão separou runtime concluída de implementação comprovada."
            : "A ordem foi registrada e continua disponível para implementar depois.",
        tone: commitTone,
        summary: commitSummary,
        log: runtimePayload ? formatRuntimeDetailsForTerminal(runtimePayload, decision.promptText || contextText) : decision.promptText || contextText
      });
      setAgentResponse({
        badge: mode === "implement" ? commitProofUi.responseBadge : "Ordem aceita",
        title:
          mode === "implement"
            ? commitProofUi.responseTitle
            : "A decisão virou ordem real",
        text:
          mode === "implement"
            ? commitProofUi.text
            : "A Mesa de Decisão registrou a ordem real. Nada foi executado automaticamente além do registro.",
        next:
          mode === "implement"
            ? commitSummary.pending
            : "Use Implementar ordem aceita quando quiser executar, ou ajuste o contexto se algo ficou fraco.",
        tone: commitTone,
        decisionActions: mode !== "implement",
        summary: commitSummary,
        items: replies.length
          ? buildAgentReplyItems(replies, 4).map((item) => ({ ...item, state: "done" }))
          : [{ state: "done", label: "ordem", agent: selection.agentLabel || "Cheffe Call", text: contextText }]
      });
      setActionFeedback({
        badge: mode === "implement" ? commitProofUi.shortBadge : "Aceito",
        title:
          mode === "implement"
            ? commitProofUi.actionTitle
            : "Ordem real registrada",
        message:
          mode === "implement"
            ? commitSummary.evidence
            : "A ordem está registrada. O painel ainda permite implementar esta ordem aceita.",
        tone: commitTone,
        closable: true,
        steps: [
          { label: "Registro concluído", state: "done" },
          { label: mode === "implement" ? "Runtime concluída" : "Implementação aguardando comando", state: "done" },
          { label: mode === "implement" ? commitProofUi.stepLabel : "Terminal atualizado", state: mode === "implement" ? commitProofUi.state : "done" }
        ],
        details: runtimePayload ? formatRuntimeDetailsForTerminal(runtimePayload, "mesa: ordem rodada") : contextText
      });
      if (mode === "implement") {
        hideDecisionResolutionActions(true);
      } else {
        showDecisionResolutionActions(updatedDecision);
      }
      setStatus(
        mode === "implement"
          ? commitOutcome?.hasApplicationProof
            ? "Ordem real aplicada com prova pela Mesa de decisão."
            : commitOutcome?.hasExecutionProof
              ? "Ordem real executada com prova; aplicação ainda pendente."
              : "Ordem real rodada, mas sem prova de implementação ainda."
          : "Ordem real aceita e registrada.",
        "ok"
      );
    } catch (error) {
      setAgentResponse({
        badge: "Falha",
        title: mode === "implement" ? "Implementação não concluiu" : "Ordem não foi aceita",
        text: error.message || "A Mesa de Decisão não conseguiu concluir esta etapa.",
        next: "Confira senha/conexão e tente novamente pelos botões da resposta analisada.",
        tone: "bad",
        decisionActions: true,
        summary: {
          resolved: "Nada confirmado nesta etapa.",
          evidence: "Falha antes do registro ou execução completa.",
          pending: "Tentar aceitar/implementar novamente.",
          order: summarizeOneLine(contextText, "Ordem preservada.")
        },
        items: [{ state: "bad", label: "erro", agent: "Mesa de decisão", text: error.message || "Falha." }]
      });
      showDecisionResolutionActions(decision);
      setActionFeedback({
        badge: "Falha",
        title: "Mesa não concluiu",
        message: error.message || "A ordem real não foi concluída.",
        tone: "bad",
        closable: true,
        steps: [
          { label: "Etapa interrompida", state: "bad" },
          { label: "Análise preservada", state: "pending" }
        ],
        details: decision.promptText || contextText
      });
      setStatus(error.message || "Falha na Mesa de decisão.", "bad");
    } finally {
      setDecisionResolutionBusy(false);
      if (pendingDecisionResolution && decisionResolutionActions && !decisionResolutionActions.hidden) {
        showDecisionResolutionActions(pendingDecisionResolution);
      }
    }
  }

  async function submitDecisionOrder() {
    const password = getAdminPassword();
    const contextText = String(decisionComposerText?.value || "").trim();
    if (!password) {
      setDecisionComposerStatus("Senha Full Admin obrigatória para analisar a decisão.", "bad");
      setStatus("Valide a senha Full Admin para enviar a decisão aos agentes.", "bad");
      quickPasswordInput?.focus();
      return;
    }
    if (!contextText) {
      setDecisionComposerStatus("Escreva o contexto da ordem antes de enviar.", "bad");
      decisionComposerText?.focus();
      return;
    }
    const selection = getDecisionSelection();
    const promptText = buildDecisionPrompt(contextText, selection);
    latestDecisionOrder = { selection, contextText, promptText, createdAt: new Date().toISOString(), seed: decisionComposerSeed || {} };
    if (decisionComposerSubmit) decisionComposerSubmit.disabled = true;
    hideDecisionResolutionActions(true);
    setDecisionComposerStatus("Enviando para análise dos agentes...", "pending");
    setActionFeedback({
      badge: "Mesa",
      title: "Analisando decisão",
      message: "A ordem foi montada com escritório, agente principal e tipo de ação. Nada será implementado sem aceite.",
      tone: "pending",
      closable: false,
      steps: [
        { label: "Contexto escrito", state: "done" },
        { label: "Rodada dos agentes", state: "running" },
        { label: "Resposta auditável", state: "pending" },
        { label: "Aceite do operador", state: "pending" }
      ],
      details: promptText
    });
    try {
      syncVisibleInstruction(promptText, {
        visibleText: contextText,
        focus: false
      });
      if (commandInput) commandInput.value = promptText;
      const payload = await postCall("/api/cheffe-call/start", { password, instruction: promptText });
      activateMeetingResponse(promptText, payload);
      const replies = getPayloadOpinions(payload, promptText);
      const targetReply = findDecisionTargetReply(replies, selection, decisionComposerSeed || {});
      const decision = {
        selection,
        contextText,
        promptText,
        replies,
        targetReply,
        payload,
        seed: decisionComposerSeed || {},
        createdAt: new Date().toISOString()
      };
      latestDecisionOrder = decision;
      pendingDecisionResolution = decision;
      terminalEl.textContent = [
        "> cheffe-call/decision-analysis",
        `escritorio: ${selection.officeLabel}`,
        `agente: ${selection.agentLabel}`,
        `acao solicitada: ${selection.guide.label}`,
        `respostas: ${replies.length}`,
        "status: aguardando aceite do operador",
        "",
        "contexto:",
        contextText,
        "",
        formatAgentReplies(replies, 5)
      ].join("\n");
      setActionFeedback({
        badge: "Análise",
        title: "Resposta analisada",
        message: "Os agentes responderam. A decisão ainda precisa ser aceita ou implementada por você.",
        tone: "ok",
        closable: true,
        steps: [
          { label: "Rodada dos agentes concluída", state: "done" },
          { label: "Resposta auditável montada", state: "done" },
          { label: "Aguardando aceite/implementação", state: "running" }
        ],
        details: formatAgentReplies(replies, 5)
      });
      setAgentResponse({
        badge: "Mesa de decisão",
        title: "Resposta pronta para decisão final",
        text: `${selection.officeLabel} / ${selection.agentLabel}: análise pronta, mas ainda sem execução real.`,
        next: "Clique Aceitar como ordem real para registrar, ou Implementar agora para executar depois da análise.",
        tone: "ok",
        decisionActions: true,
        summary: buildDecisionAnalysisSummary(selection, replies),
        items: replies.length
          ? buildAgentReplyItems(replies, 4).map((item) => ({ ...item, state: "done" }))
          : [{ state: "done", label: "analisado", agent: selection.agentLabel, text: contextText }]
      });
      showDecisionResolutionActions(decision);
      setDecisionComposerStatus("Análise pronta. Escolha aceitar ou implementar no painel.", "ok");
      refreshDecisionPreview(contextText);
      closeDecisionComposer();
      setStatus("Mesa de decisão analisou a ordem. Aguardando aceite ou implementação.", "ok");
    } catch (error) {
      setActionFeedback({
        badge: "Falha",
        title: "Decisão não concluiu",
        message: error.message || "A ordem não foi concluída.",
        tone: "bad",
        closable: true,
        steps: [
          { label: "Fluxo interrompido", state: "bad" },
          { label: "Ordem preservada no popup", state: "pending" }
        ],
        details: promptText
      });
      setAgentResponse({
        badge: "Falha",
        title: "A decisão não virou resposta útil",
        text: error.message || "A Cheffe Call não conseguiu concluir o fluxo.",
        next: "Revise senha/contexto e envie de novo pela Mesa de decisão.",
        tone: "bad",
        summary: {
          resolved: "Nada confirmado.",
          evidence: "Fluxo interrompido antes de resposta válida.",
          pending: "Reenviar com senha e contexto.",
          order: "Ordem preservada no popup."
        },
        items: [{ state: "bad", label: "erro", agent: "Cheffe Call", text: error.message || "Falha na decisão." }]
      });
      setDecisionComposerStatus(error.message || "Falha ao enviar decisão.", "bad");
      setStatus(error.message || "Falha ao enviar decisão.", "bad");
    } finally {
      if (decisionComposerSubmit) decisionComposerSubmit.disabled = false;
    }
  }

  function findPromptAgentForOpinion(active) {
    if (!promptConsoleData?.agents?.length || !active) return null;
    const nameKey = normalizePromptKey(getAgentDisplayName(active));
    const officeKey = normalizePromptKey(getAgentOffice(active));
    const roleKey = normalizePromptKey(active.role || "");
    const agents = promptConsoleData.agents || [];
    return (
      agents.find((item) => normalizePromptKey(item.name) === nameKey && normalizePromptKey(item.office) === officeKey) ||
      agents.find((item) => normalizePromptKey(item.name) === nameKey) ||
      agents.find((item) => normalizePromptKey(item.office) === officeKey && normalizePromptKey(item.role).includes(roleKey)) ||
      agents.find((item) => normalizePromptKey(item.office) === officeKey) ||
      null
    );
  }

  function selectPromptAgentForOpinion(active) {
    const promptAgent = findPromptAgentForOpinion(active);
    const office = promptAgent?.office || getAgentOffice(active);
    if (promptModeSelect) promptModeSelect.value = "agent";
    if (promptOfficeSelect) promptOfficeSelect.value = office || "";
    refreshPromptAgentOptions(office || "");
    if (promptAgentSelect) promptAgentSelect.value = promptAgent?.slug || "";
    return promptAgent;
  }

  function buildMasterAdjustmentPrompt(active) {
    const guide = getAdjustmentGuide();
    const packet = buildExecutionPacket(active, "prompt");
    const agentName = getAgentDisplayName(active);
    const office = getAgentOffice(active);
    const subject = String(quickInstructionInput?.value || instructionInput?.value || latestCallPayload?.meeting?.lastInstruction || "").trim();
    const opinion = String(active?.opinion || active?.assignment?.idea || packet.text || "").trim();
    return [
      "PROMPT MESTRE - AJUSTE DE OPINIAO",
      `Escritorio selecionado: ${office}`,
      `Agente selecionado: ${agentName} (${active?.role || "agente"})`,
      `Tipo de ajuste: ${guide.label}`,
      "",
      "Opiniao original:",
      opinion || "Sem opiniao original registrada.",
      "",
      "Ordem do ajuste:",
      guide.directive,
      "",
      "Saida esperada:",
      "- uma nova opiniao curta e diferente das demais",
      "- utilidade real para a Cheffe Call",
      "- proxima acao executavel ou criterio claro de validacao",
      "- se nao houver evidencia ou impacto, responder que o agente fica em silencio",
      "",
      subject ? `Contexto da reuniao: ${subject}` : "Contexto da reuniao: usar a ordem atual da sala.",
      "",
      "Prompt base do agente:",
      packet.prompt
    ].join("\n");
  }

  function pulsePromptMaster() {
    promptCommandCenter?.classList.remove("is-pulsing");
    window.requestAnimationFrame(() => {
      promptCommandCenter?.classList.add("is-pulsing");
      window.setTimeout(() => promptCommandCenter?.classList.remove("is-pulsing"), 1400);
    });
  }

  function stageAdjustmentInPromptMaster(active, options = {}) {
    if (!active) return "";
    pendingAdjustmentContext = active;
    const promptAgent = selectPromptAgentForOpinion(active);
    const promptText = buildMasterAdjustmentPrompt(active);
    updatePromptPreview({
      title: `Ajustar ${getAgentDisplayName(active)}`,
      badge: `${getAgentOffice(active)} • ${getAdjustmentGuide().label}`,
      text: promptText
    });
    if (commandInput) commandInput.value = promptText;
    if (decisionActionSelect) decisionActionSelect.value = "rethink";
    selectDecisionAgentForOpinion(active);
    refreshDecisionPreview(promptText);
    if (promptConsoleMeta) {
      promptConsoleMeta.textContent = promptAgent
        ? `Ajuste preparado para ${promptAgent.name} em ${promptAgent.office}. Envie ao terminal para executar.`
        : `Ajuste preparado com o escritório ${getAgentOffice(active)}. Selecione outro agente se quiser redirecionar.`;
    }
    terminalEl.textContent = [
      "> prompt-master/adjustment-ready",
      `agent: ${getAgentDisplayName(active)}`,
      `office: ${getAgentOffice(active)}`,
      `adjustment: ${getAdjustmentGuide().label}`,
      "status: pronto no Prompt Mestre; Executar no terminal envia aos agentes"
    ].join("\n");
    pulsePromptMaster();
    if (options.scroll !== false) {
      promptCommandCenter?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    return promptText;
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
        title: "Prompt Mestre",
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
      syncDecisionSelectors();
      selectPromptPayload();
      if (promptConsoleMeta) {
        promptConsoleMeta.textContent = `${promptConsoleData.totalAgents || 0} agentes carregados. Use o Prompt Mestre, um escritório ou um agente específico.`;
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
      syncDecisionSelectors();
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
        competitionScore: item.competitionScore || item.competition?.competitionScore || 0,
        intelligence: item.intelligence || item.competition?.intelligence || 0,
        execution: item.execution || item.competition?.execution || 0,
        impact: item.impact || item.competition?.impact || 0,
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

  function looksLikeRepeatedOpinion(text = "") {
    const clean = String(text || "").toLowerCase().replace(/\s+/g, " ").trim();
    if (!clean) return true;
    const templateHits = [
      "prioridade e decisão: eu compito trazendo evidência útil",
      "placar 62%",
      "se não mudar tela, dado ou rotina",
      "tem memória própria para prioridade e decisão",
      "eu saio da disputa"
    ].filter((piece) => clean.includes(piece)).length;
    return templateHits >= 2;
  }

  function normalizeOpinionSkeleton(text = "") {
    return String(text || "")
      .toLowerCase()
      .replace(/r\$\s*[\d.,]+/g, "valor")
      .replace(/\d+%/g, "pct")
      .replace(/\d+/g, "num")
      .replace(/[^\p{L}\p{N}\s]/gu, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 180);
  }

  function normalizeOpinions(opinions, subject) {
    const list = Array.isArray(opinions) && opinions.length ? opinions : fallbackAgents;
    const seen = new Map();
    const seenSkeleton = new Map();
    return list.map((item, index) => {
      const rawOpinion = String(item.opinion || "").trim();
      const key = rawOpinion.toLowerCase().replace(/\s+/g, " ");
      const skeleton = normalizeOpinionSkeleton(rawOpinion);
      const repeated = (key && seen.has(key)) || (skeleton && seenSkeleton.has(skeleton)) || looksLikeRepeatedOpinion(rawOpinion);
      seen.set(key, (seen.get(key) || 0) + 1);
      if (skeleton) seenSkeleton.set(skeleton, (seenSkeleton.get(skeleton) || 0) + 1);
      return {
        ...item,
        opinion: !rawOpinion || repeated ? buildOpinionForAgent(item, subject, index) : rawOpinion
      };
    });
  }

  function getPayloadOpinions(payload, subject) {
    const session = payload?.meeting?.currentSession || payload?.meeting?.sessions?.[0] || null;
    return normalizeOpinions(payload?.opinions || session?.opinions || [], subject || payload?.meeting?.lastInstruction || "ordem da sala");
  }

  function buildAgentReplyItems(opinions, limit = 4) {
    const list = Array.isArray(opinions) ? opinions : [];
    return list.slice(0, limit).map((item, index) => ({
      state: index === 0 ? "running" : "done",
      label: index === 0 ? "falando agora" : "respondeu",
      agent: `${getAgentDisplayName(item)} • ${getAgentOffice(item)}`,
      text: item?.opinion || item?.assignment?.action || "Resposta registrada."
    }));
  }

  function formatAgentReplies(opinions, limit = 5) {
    const list = Array.isArray(opinions) ? opinions : [];
    return list
      .slice(0, limit)
      .map((item) => `${getAgentDisplayName(item)} (${getAgentOffice(item)}): ${item?.opinion || item?.assignment?.action || ""}`)
      .join("\n\n");
  }

  function renderDaily(payload) {
    const daily = payload.dailyContext || {};
    const agent = daily.agentOfDay || {};
    const office = daily.officeOfDay || {};
    const action = daily.actionOfDay || {};
    const matchingRealAgent = currentRealAgents.find((item) => getAgentDisplayName(item) === agent.name) || null;
    currentAgentOfDay = agent.name ? { ...matchingRealAgent, ...agent, agent: agent.name } : currentRealAgents[0] || fallbackAgents[0];
    const hasDailyAgent = Boolean(agent.name);
    const autonomyScore = hasDailyAgent ? clampPercent(agent.score || agent.autonomy || currentAgentOfDay?.score || 0, 0) : 0;
    const intelligenceScore = hasDailyAgent ? clampPercent(agent.intelligence || agent.confidence || currentAgentOfDay?.confidence || autonomyScore, autonomyScore) : 0;
    const executionScore = hasDailyAgent ? clampPercent(agent.execution || agent.urgency || currentAgentOfDay?.urgency || autonomyScore, autonomyScore) : 0;
    const impactScore = hasDailyAgent ? clampPercent(agent.impact || currentAgentOfDay?.impact || Math.round((autonomyScore + executionScore) / 2), autonomyScore) : 0;
    const competitionScore = clampPercent(
      hasDailyAgent ? agent.competitionScore || Math.round(autonomyScore * 0.3 + intelligenceScore * 0.25 + executionScore * 0.25 + impactScore * 0.2) : 0,
      autonomyScore
    );
    const neuralScore = hasDailyAgent ? Math.max(42, competitionScore || autonomyScore || 82) : 0;
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
      ? `${agent.office} • autonomia ${autonomyScore}% • ${agent.intent || "intencao em formacao"}`
      : "Rode os agentes para calcular o destaque.";
    if (agentCompetitionScoreEl) agentCompetitionScoreEl.textContent = String(competitionScore || 0);
    if (agentIntelligenceScoreEl) agentIntelligenceScoreEl.textContent = String(intelligenceScore || 0);
    if (agentExecutionScoreEl) agentExecutionScoreEl.textContent = String(executionScore || 0);
    if (agentImpactScoreEl) agentImpactScoreEl.textContent = String(impactScore || 0);
    if (agentNeuralBar) agentNeuralBar.style.width = `${neuralScore}%`;
    if (agentAwardNote) {
      agentAwardNote.textContent = agent.name
        ? `${agent.name} venceu a rodada por combinação de autonomia, inteligência, execução e impacto. O próximo agente só passa na frente se entregar mais com menos dependência.`
        : "Aguardando a próxima rodada para calcular quem resolveu melhor.";
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
        : "Agentes e escritórios em disputa real";
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
      running: "em runtime",
      executed: "execução provada",
      terminal: "no terminal",
      fallback: "no terminal",
      published: "aplicação provada",
      dismissed: "ignorada"
    };
    const detailMap = {
      running: "Execução enviada; aguardando evidência verificável.",
      executed: "Runtime retornou prova de execução; aplicação/publicação ainda pendente.",
      terminal: "Registrada no terminal; ainda não prova alteração real.",
      fallback: "Registrada como apoio; ainda não prova alteração real.",
      published: "Servidor marcou aplicação com evidência no alvo final.",
      queued: "Tarefa rastreável criada; ainda precisa execução."
    };
    return {
      state,
      label: match.kindLabel || labelMap[state] || "decidida",
      detail: detailMap[state] || match.title || match.text || "Decisão registrada na reunião.",
      action: match.action || ""
    };
  }

  function updateOpinionFlowSummary(flowItems) {
    const pending = flowItems.filter((item) => item.status.state === "pending").length;
    const ready = flowItems.filter((item) => ["ready", "queued"].includes(item.status.state)).length;
    const running = flowItems.filter((item) => ["running", "executed", "terminal", "fallback", "published"].includes(item.status.state)).length;
    if (opinionPendingCount) opinionPendingCount.textContent = String(pending);
    if (opinionReadyCount) opinionReadyCount.textContent = String(ready);
    if (opinionRunningCount) opinionRunningCount.textContent = String(running);
    if (opinionFlowMeta) {
      opinionFlowMeta.textContent = flowItems.length
        ? `${flowItems.length} opinioes na sala. ${pending} aguardam aprovacao, ${ready} estao prontas para fila de ordens e ${running} estao no terminal/runtime aguardando conferência.`
        : "Aprovar guarda uma opiniao. Implementar fila de ordens roda aprovadas e mostra evidência ou pendência.";
    }
    if (runApprovedOpinions) {
      runApprovedOpinions.textContent = ready ? `Implementar fila de ordens (${ready})` : "Implementar fila de ordens";
      runApprovedOpinions.disabled = ready === 0;
    }
    if (directOrderRunQueue) {
      directOrderRunQueue.textContent = ready ? `Implementar fila de ordens (${ready})` : "Implementar fila de ordens";
      directOrderRunQueue.disabled = ready === 0;
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
          (key === "done" && flowItems.some((item) => ["executed", "published"].includes(item.status.state)))
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
          const isClosed = ["running", "executed", "terminal", "fallback", "published", "dismissed", "silent"].includes(status.state);
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
                <button type="button" data-list-idea-action="variation" data-index="${index}" title="Leva esta opinião para o Prompt Mestre com escritório e agente selecionados." ${status.state === "dismissed" ? "disabled" : ""}>Ajustar</button>
                <button type="button" data-list-idea-action="task" data-index="${index}" title="Cria uma tarefa rastreável para o agente transformar a opinião em entrega." ${isClosed ? "disabled" : ""}>Criar tarefa</button>
                <button type="button" data-list-idea-action="terminal" data-index="${index}" title="Envia a opinião deste agente ao terminal da sala.">Terminal</button>
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

  function moveToNextSpeaker(kindLabel = "próxima fala", options = {}) {
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
    if (options.updateResponse !== false) {
      setAgentResponse({
        badge: "Próximo agente",
        title: `${getAgentDisplayName(active)} assumiu a fala`,
        text: "A resposta ativa mudou. Os botões do card agora agem sobre este agente.",
        next: "Aprove, ajuste, transforme em tarefa ou envie ao terminal.",
        tone: "ok",
        items: [{ state: "running", label: "falando agora", agent: `${getAgentDisplayName(active)} • ${getAgentOffice(active)}`, text: active?.opinion || "" }]
      });
    }
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
              <button type="button" data-idea-action="variation" title="Leva esta opinião para o Prompt Mestre com escritório e agente selecionados.">Ajustar</button>
              <button type="button" data-idea-action="task" title="Cria uma tarefa rastreável para o agente transformar a opinião em entrega.">Criar tarefa</button>
              <button type="button" data-idea-action="terminal" title="Envia a opinião deste agente ao terminal da sala.">Terminal</button>
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
      const packet = buildExecutionPacket(active, "implement");
      await postRoomAction("approve", active);
      addMeetingLog({ kind: "good", kindLabel: "boa ideia", agent: agentName, text: idea });
      setAgentResponse({
        badge: "Card aprovado",
        title: `${agentName} recebeu aprovação`,
        text: "A opinião entrou na fila de execução. Ela ainda não mexe no site até você implementar o card ou a fila.",
        next: "Clique Implementar card para executar só este, ou Implementar fila para rodar todas as aprovadas.",
        tone: "ok",
        summary: {
          resolved: "Ideia aceita e registrada como aprovação.",
          evidence: "Card entrou na fila de decisões da reunião.",
          pending: "Ainda falta implementar para alterar tela, dado ou rotina.",
          order: "Aprovação vira ordem pronta para Implementar card ou Implementar fila."
        },
        items: [
          { state: "done", label: "aprovado", agent: agentName, text: idea },
          { state: "running", label: "pronto para executar", agent: getAgentOffice(active), text: packet.text }
        ]
      });
      setActionFeedback({
        badge: "Aprovação",
        title: `${agentName} aprovado`,
        message: "Card guardado. A execução só acontece quando você mandar implementar.",
        tone: "ok",
        closable: true,
        steps: [
          { label: "Opinião recebida", state: "done" },
          { label: "Aprovação registrada", state: "done" },
          { label: "Aguardando implementação", state: "running" }
        ],
        details: packet.howTo,
        autoCloseMs: 2400
      });
      setStatus(`${agentName} recebeu aprovação formal na Cheffe Call.`, "ok");
      moveToNextSpeaker("próxima fala", { updateResponse: false });
      return;
    }
    if (action === "implement") {
      try {
        const payload = await runSingleImplementation(active);
        const outcome = getRuntimeEvidence(payload);
        const proofUi = getRuntimeProofUi(outcome);
        const summary = buildRuntimeOutcomeSummary(payload, active?.assignment?.action || idea || `Card de ${agentName}`, "card");
        const tone = getRuntimeOutcomeTone(payload);
        setAgentResponse({
          badge: proofUi.responseBadge,
          title: `${agentName}: ${proofUi.responseTitle}`,
          text: proofUi.text,
          next: summary.pending,
          tone,
          summary,
          items: [
            { state: "done", label: "enviado", agent: agentName, text: active?.assignment?.action || idea },
            { state: proofUi.state, label: proofUi.itemLabel, agent: "Cheffe Call", text: outcome.evidence }
          ]
        });
        setStatus(
          outcome.hasApplicationProof
            ? `${agentName} retornou aplicação provada.`
            : outcome.hasExecutionProof
              ? `${agentName} retornou execução provada; aplicação pendente.`
              : `${agentName} rodou, mas ainda falta prova real.`,
          "ok"
        );
        moveToNextSpeaker("próxima fala", { updateResponse: false });
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
    }
    if (action === "variation") {
      const adjustmentPrompt = stageAdjustmentInPromptMaster(active);
      pullAgentIdeasIntoDirectOrder(active);
      enqueueTask({
        state: "terminal",
        kindLabel: "ajuste pronto",
        agent: agentName,
        title: `Prompt Mestre ajustando ${agentName}`,
        text: adjustmentPrompt,
        prompt: adjustmentPrompt
      });
      addMeetingLog({ kindLabel: "prompt de ajuste", agent: agentName, text: adjustmentPrompt });
      setActionFeedback({
        badge: "Prompt Mestre",
        title: `Ajuste pronto para ${agentName}`,
        message: "A ideia foi puxada para a Ordem direta e também preparada no Prompt Mestre.",
        tone: "ok",
        steps: [
          { label: "Opinião original capturada", state: "ok" },
          { label: "Escritório selecionado", state: "ok" },
          { label: "Agente selecionado", state: promptAgentSelect?.value ? "ok" : "pending" },
          { label: "Terminal aguardando envio", state: "pending" }
        ],
        details: adjustmentPrompt,
        closable: true
      });
      setAgentResponse({
        badge: "Ajuste preparado",
        title: `${agentName} foi enviado ao Prompt Mestre`,
        text: "A opinião original, o escritório e o agente foram carregados na Ordem direta para você alterar com suas instruções. Nada foi executado ainda.",
        next: "Edite Minhas alterações no painel Comando real e clique Ordem direta ou Rodar agentes.",
        tone: "ok",
        summary: {
          resolved: "Opinião carregada com escritório e agente.",
          evidence: "Ordem direta, Prompt Mestre e Mesa de decisão receberam o contexto.",
          pending: "Editar a ordem direta e escolher análise ou runtime.",
          order: "Ajuste ainda não implementa; ele prepara uma ordem melhor."
        },
        items: [
          { state: "done", label: "capturado", agent: agentName, text: idea },
          { state: "running", label: "aguardando terminal", agent: getAgentOffice(active), text: getAdjustmentGuide().directive }
        ]
      });
      setStatus(`Ajuste de ${agentName} preparado no Prompt Mestre.`, "ok");
      return;
    }
    if (action === "task") {
      const task = `Tarefa criada para ${agentName}: transformar a ideia em entrega revisável, com critério de aceite e próxima ação.`;
      const packet = buildExecutionPacket(active, "implement");
      await postRoomAction("task", active, {
        title: `Tarefa para ${agentName}`,
        howTo: packet.howTo,
        prompt: packet.prompt,
        text: task
      });
      addMeetingLog({ kindLabel: "tarefa criada", agent: agentName, text: task });
      terminalEl.textContent = [
        "> cheffe-call/task",
        `owner: ${agentName}`,
        `source: ${idea}`,
        "status: aguardando aprovação para execução"
      ].join("\n");
      setAgentResponse({
        badge: "Tarefa criada",
        title: `${agentName} virou tarefa rastreável`,
        text: "A fala foi transformada em uma entrega com dono e critério. Ela aparece na fila de tarefas.",
        next: "Aprove/implemente quando quiser transformar a tarefa em execução real.",
        tone: "ok",
        summary: {
          resolved: "Tarefa com dono e critério registrada.",
          evidence: "Terminal recebeu owner, source e status.",
          pending: "A tarefa ainda precisa ser aprovada ou implementada.",
          order: "Tarefa criada para acompanhamento."
        },
        items: [
          { state: "done", label: "dono", agent: agentName, text: task },
          { state: "running", label: "critério", agent: "Cheffe Call", text: packet.howTo }
        ]
      });
      setActionFeedback({
        badge: "Tarefa",
        title: "Tarefa registrada",
        message: `${agentName} recebeu uma tarefa com próximo passo.`,
        tone: "ok",
        closable: true,
        steps: [
          { label: "Opinião lida", state: "done" },
          { label: "Tarefa registrada", state: "done" },
          { label: "Aguardando execução", state: "running" }
        ],
        details: packet.prompt,
        autoCloseMs: 2600
      });
      setStatus(`Tarefa real registrada para ${agentName}.`, "ok");
      return;
    }
    if (action === "terminal") {
      const packet = buildExecutionPacket(active, "prompt");
      await postRoomAction("terminal", active, {
        title: active?.assignment?.action || idea,
        command: packet.prompt,
        prompt: packet.prompt
      });
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
        "status: terminal recebeu a ordem e registrou a resposta",
        "",
        packet.prompt
      ].join("\n");
      setAgentResponse({
        badge: "Terminal",
        title: `${agentName} recebeu a ordem`,
        text: "O terminal registrou a fala do agente e preparou prompts de apoio para continuar.",
        next: "Use o campo Terminal para complementar, ou execute pelo Prompt Mestre se quiser uma nova resposta dos agentes.",
        tone: "ok",
        summary: {
          resolved: "Pedido registrado no terminal.",
          evidence: "Terminal recebeu agente, escritório, ideia e prompt.",
          pending: "Terminal não implementa sozinho; falta aprovar ou rodar runtime.",
          order: "Prompt pronto para continuidade."
        },
        items: [
          { state: "done", label: "ordem recebida", agent: agentName, text: idea },
          { state: "running", label: "terminal", agent: getAgentOffice(active), text: active?.assignment?.action || packet.text }
        ]
      });
      setActionFeedback({
        badge: "Terminal",
        title: "Ordem enviada ao terminal",
        message: `${agentName} respondeu e o prompt ficou registrado no terminal da sala.`,
        tone: "ok",
        closable: true,
        steps: [
          { label: "Agente selecionado", state: "done" },
          { label: "Terminal recebeu", state: "done" },
          { label: "Resposta registrada", state: "done" }
        ],
        details: packet.prompt,
        autoCloseMs: 2600
      });
      setStatus(`Terminal real recebeu a ordem de ${agentName}.`, "ok");
      return;
    }
    if (action === "dismiss") {
      if (await postRoomAction("dismiss", active, { title: `Ignorar por enquanto: ${agentName}` })) {
        setAgentResponse({
          badge: "Ignorado",
          title: `${agentName} saiu da fila`,
          text: "A opinião foi marcada para não entrar na execução desta rodada.",
          next: "Continue ouvindo os próximos agentes ou implemente as aprovadas.",
          tone: "ok",
          items: [{ state: "done", label: "fora da rodada", agent: agentName, text: idea }]
        });
        setStatus(`${agentName} saiu da fila de ação desta rodada.`, "ok");
        moveToNextSpeaker("próxima fala", { updateResponse: false });
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
      moveToNextSpeaker("próxima fala", { updateResponse: false });
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
    if (quickCommandContext) {
      const lastInstruction = String(payload.meeting?.lastInstruction || "").replace(/\s+/g, " ").trim();
      quickCommandContext.textContent = lastInstruction
        ? `Digite uma nova ordem. Última rodada: ${lastInstruction.slice(0, 120)}${lastInstruction.length > 120 ? "..." : ""}`
        : "Digite uma ordem nova. Abrir rodada monta a fila; Implementar fila executa somente cards aprovados.";
    }
    syncDecisionSelectors();
    syncGameShellState();
  }

  function activateMeetingResponse(instruction, payload) {
    const subject = String(instruction || payload?.meeting?.lastInstruction || "ordem recebida").trim();
    const opinions = getPayloadOpinions(payload, subject);
    if (!opinions.length) {
      setStatus("Reunião aberta, mas nenhum agente retornou fala ainda.", "bad");
      setAgentResponse({
        badge: "Sem resposta",
        title: "A ordem foi enviada, mas a fila veio vazia",
        text: "A sala abriu sem fala de agente. Recarregue ou envie uma ordem mais específica.",
        next: "Clique Recarregar ou Abra rodada novamente.",
        tone: "bad",
        items: [{ state: "bad", label: "sem fala", agent: "Cheffe Call", text: subject }]
      });
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
    setAgentResponse({
      badge: "Rodada aberta",
      title: `${opinions.length} agentes responderam`,
      text: `${getAgentDisplayName(active)} começou a resposta. A fila abaixo mostra quem recebeu a ordem e o que cada um propôs.`,
      next: "Aprove um card, peça ajuste, crie tarefa ou implemente a fila aprovada.",
      tone: "ok",
      items: buildAgentReplyItems(opinions, 4)
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
    return postCall("/api/cheffe-call/action", {
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
  }

  function getReadyOpinionFlowItems() {
    return latestOpinionFlow.filter((flow) => ["ready", "queued"].includes(flow.status?.state));
  }

  function formatRuntimeDetailsForTerminal(payload = {}, prefix = "") {
    const details = buildRuntimeFeedbackDetails(payload);
    const outcome = getRuntimeEvidence(payload);
    const proofBlock = [
      outcome.executionSignals?.length ? "prova de execução:" : "",
      ...(outcome.executionSignals || []).map((line) => `- ${line}`),
      outcome.applicationSignals?.length ? "prova de aplicação:" : "",
      ...(outcome.applicationSignals || []).map((line) => `- ${line}`),
      !outcome.applicationSignals?.length && outcome.hasExecutionProof ? "- aplicação/publicação ainda não provada" : ""
    ]
      .filter(Boolean)
      .join("\n");
    return [
      prefix,
      proofBlock,
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
    const outcome = getRuntimeEvidence(payload);
    const proofUi = getRuntimeProofUi(outcome);
    await postRoomAction("complete", active, {
      title: `${agentName}: ${proofUi.actionTitle}`,
      proofLevel: outcome.proofLevel,
      runtimeEvidence: outcome.evidence,
      howTo: proofUi.text
    });
    await loadCall();
    const tone = getRuntimeOutcomeTone(payload);
    const orderText = active?.assignment?.action || active?.opinion || `Card aprovado de ${agentName}`;
    const summary = buildRuntimeOutcomeSummary(payload, orderText, "card");
    setExecutionControl({
      badge: proofUi.badge,
      title: `${agentName}: ${proofUi.title}`,
      text: "A execução individual foi registrada no controle persistente.",
      tone,
      summary,
      log: formatRuntimeDetailsForTerminal(payload, `owner: ${agentName}`)
    });
    setActionFeedback({
      badge: proofUi.shortBadge,
      title: `${agentName}: ${proofUi.actionTitle}`,
      message: outcome.evidence,
      tone,
      closable: true,
      steps: [
        { label: "Card enviado", state: "done" },
        { label: "Runtime concluída", state: "done" },
        { label: proofUi.stepLabel, state: proofUi.state }
      ],
      details: formatRuntimeDetailsForTerminal(payload, `owner: ${agentName}`)
    });
    terminalEl.textContent = [
      "> cheffe-call/card-implementation",
      `owner: ${agentName}`,
      `office: ${getAgentOffice(active)}`,
      formatRuntimeDetailsForTerminal(payload, proofUi.terminalStatus)
    ].join("\n");
    return payload;
  }

  async function runApprovedOpinionQueue() {
    const readyItems = getReadyOpinionFlowItems();
    if (!readyItems.length) {
      setActionFeedback({
        badge: "Fila",
        title: "Nada aprovado ainda",
        message: "Aprove cards primeiro. Depois este botão roda a fila de ordens.",
        tone: "bad",
        closable: true,
        steps: [{ label: "Nenhum card pronto", state: "bad" }]
      });
      setStatus("Aprove uma ou mais opiniões antes de rodar a fila de ordens.", "bad");
      return;
    }

    const password = requireAdminPassword("rodar a fila de ordens aprovada");
    if (!password) return;
    if (runApprovedOpinions) runApprovedOpinions.disabled = true;
    if (directOrderRunQueue) directOrderRunQueue.disabled = true;
    if (refreshOpinionFlow) refreshOpinionFlow.disabled = true;

    const batchNames = readyItems.map((flow) => getAgentDisplayName(flow.item));
    try {
      setActionFeedback({
        badge: "Fila",
        title: `Registrando ${readyItems.length} ordens aprovadas`,
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
          `status: registrando ordem aprovada`
        ].join("\n");
        await postRoomAction("implement", flow.item, {
          title: `Implementar fila: ${flow.item?.assignment?.action || flow.item?.opinion || name}`,
          batch: true
        });
        completed += 1;
        setActionFeedback({
          badge: "Fila",
          title: `Registradas ${completed}/${readyItems.length}`,
          message: "Os cards aprovados estão virando fila de ordens para runtime.",
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
      const outcome = getRuntimeEvidence(payload);
      const proofUi = getRuntimeProofUi(outcome);
      for (const flow of readyItems) {
        await postRoomAction("complete", flow.item, {
          title: `${getAgentDisplayName(flow.item)}: ${proofUi.actionTitle}`,
          proofLevel: outcome.proofLevel,
          runtimeEvidence: outcome.evidence,
          howTo: proofUi.text
        });
      }
      await loadCall();
      const tone = getRuntimeOutcomeTone(payload);
      const queueOrder = `Fila aprovada da Cheffe Call com ${completed} cards.`;
      const summary = buildRuntimeOutcomeSummary(payload, queueOrder, "fila de ordens");
      setExecutionControl({
        badge: proofUi.badge,
        title: `Fila: ${proofUi.title}`,
        text: "A fila de ordens foi separada entre runtime concluída, evidência e pendência.",
        tone,
        summary,
        log: formatRuntimeDetailsForTerminal(payload, `fila: ${completed} cards`)
      });
      setActionFeedback({
        badge: proofUi.shortBadge,
        title: `Fila: ${proofUi.actionTitle}`,
        message: outcome.evidence,
        tone,
        closable: true,
        steps: [
          { label: `${completed} cards enviados`, state: "done" },
          { label: "Runtime concluída", state: "done" },
          { label: proofUi.stepLabel, state: proofUi.state }
        ],
        details: formatRuntimeDetailsForTerminal(payload, `fila: ${completed} cards`)
      });
      terminalEl.textContent = [
        "> cheffe-call/batch-complete",
        `cards: ${completed}`,
        formatRuntimeDetailsForTerminal(payload, proofUi.terminalStatus)
      ].join("\n");
      setAgentResponse({
        badge: proofUi.responseBadge,
        title: `${completed} ordens: ${proofUi.responseTitle}`,
        text: proofUi.text,
        next: summary.pending,
        tone,
        summary,
        items: readyItems.slice(0, 4).map((flow, index) => ({
          state: proofUi.state,
          label: `${proofUi.itemLabel} ${index + 1}`,
          agent: getAgentDisplayName(flow.item),
          text: flow.item?.assignment?.action || flow.item?.opinion || "Card enviado para runtime."
        }))
      });
      setStatus(
        outcome.hasApplicationProof
          ? `Fila de ordens aplicada com prova: ${completed} aprovações enviadas.`
          : outcome.hasExecutionProof
            ? `Fila de ordens executada com prova; aplicação ainda pendente.`
            : `Fila de ordens rodada, mas evidência real ainda está pendente.`,
        "ok"
      );
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
      setAgentResponse({
        badge: "Falha na fila",
        title: "A implementação foi interrompida",
        text: error.message || "A Cheffe Call preservou a fila para você tentar novamente.",
        next: "Confira a senha, recarregue a fila e tente Implementar fila de ordens outra vez.",
        tone: "bad",
        items: [{ state: "bad", label: "erro", agent: "Cheffe Call", text: error.message || "Falha ao implementar fila." }]
      });
      setStatus(error.message || "Falha ao implementar fila.", "bad");
    } finally {
      if (runApprovedOpinions) runApprovedOpinions.disabled = getReadyOpinionFlowItems().length === 0;
      if (directOrderRunQueue) directOrderRunQueue.disabled = getReadyOpinionFlowItems().length === 0;
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
    setActionFeedback({
      badge: "Rodada",
      title: "Enviando ordem aos agentes",
      message: "A sala vai receber a ordem e devolver respostas por agente.",
      tone: "pending",
      closable: false,
      steps: [
        { label: "Senha recebida", state: "done" },
        { label: "Enviando ordem", state: "running" },
        { label: "Aguardando respostas", state: "pending" }
      ],
      details: instruction || "Abrir reunião sem assunto específico."
    });
    postCall("/api/cheffe-call/start", { password, instruction })
      .then((payload) => {
        activateMeetingResponse(instruction, payload);
        const replies = getPayloadOpinions(payload, instruction);
        setActionFeedback({
          badge: "Rodada",
          title: "Agentes responderam",
          message: "A ordem foi recebida. Agora você pode aprovar, ajustar, criar tarefa ou mandar implementar.",
          tone: "ok",
          closable: true,
          steps: [
            { label: "Ordem enviada", state: "done" },
            { label: "Respostas recebidas", state: "done" },
            { label: "Aguardando decisão", state: "running" }
          ],
          details: formatAgentReplies(replies, 5),
          autoCloseMs: 2800
        });
      })
      .catch((error) => {
        setActionFeedback({
          badge: "Falha",
          title: "Ordem não enviada",
          message: error.message || "Não foi possível abrir a rodada.",
          tone: "bad",
          closable: true,
          steps: [{ label: "Envio interrompido", state: "bad" }]
        });
        setAgentResponse({
          badge: "Falha",
          title: "A ordem não chegou aos agentes",
          text: error.message || "Verifique a senha e tente novamente.",
          next: "Digite a senha Full Admin e clique Abrir rodada.",
          tone: "bad",
          items: [{ state: "bad", label: "erro", agent: "Cheffe Call", text: error.message || "Falha ao abrir rodada." }]
        });
        setStatus(error.message, "bad");
      });
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
        const replies = getPayloadOpinions(payload, quickInstruction);
        setActionFeedback({
          badge: "Rodada",
          title: "Fila pronta",
          message: "A sala respondeu. Aprove cards individuais, ajuste uma fala ou implemente a fila inteira.",
          tone: "ok",
          closable: true,
          steps: [
            { label: "Sessão criada", state: "done" },
            { label: "Opiniões renderizadas", state: "done" },
            { label: "Aguardando aprovação", state: "running" }
          ],
          details: formatAgentReplies(replies, 5),
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
        setAgentResponse({
          badge: "Falha",
          title: "Os agentes não receberam a ordem",
          text: error.message || "A rodada não abriu.",
          next: "Confira a senha e tente Abrir rodada novamente.",
          tone: "bad",
          items: [{ state: "bad", label: "erro", agent: "Cheffe Call", text: error.message || "Falha ao abrir reunião." }]
        });
        setStatus(error.message, "bad");
      });
  });

  quickInstructionInput?.addEventListener("focus", () => {
    const end = String(quickInstructionInput.value || "").length;
    if (typeof quickInstructionInput.setSelectionRange === "function") {
      quickInstructionInput.setSelectionRange(end, end);
    }
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

  sendTerminalEl?.addEventListener("click", async () => {
    const form = new FormData(formEl);
    const instruction = String(form.get("instruction") || "").trim();
    const command = String(form.get("command") || "").trim();
    const password = requireAdminPassword("enviar comando real ao terminal dos agentes");
    if (!password) return;
    if (!instruction && !command) {
      setStatus("Digite uma ordem ou cole um pedido/código antes de enviar ao terminal.", "bad");
      return;
    }
    const terminalOrder = command || instruction;
    setStatus("Enviando comando real ao terminal da Cheffe Call...");
    setActionFeedback({
      badge: "Terminal",
      title: "Enviando ordem direta",
      message: "O terminal vai abrir uma rodada com resposta dos agentes e registrar o pedido.",
      tone: "pending",
      closable: false,
      steps: [
        { label: "Pedido lido", state: "done" },
        { label: "Enviando aos agentes", state: "running" },
        { label: "Registrando no terminal", state: "pending" }
      ],
      details: terminalOrder
    });
    try {
      if (instructionInput) instructionInput.value = terminalOrder;
      if (quickInstructionInput) quickInstructionInput.value = summarizeOneLine(terminalOrder, "Ordem enviada ao terminal.");
      const payload = await postCall("/api/cheffe-call/start", { password, instruction: terminalOrder });
      activateMeetingResponse(terminalOrder, payload);
      const replies = getPayloadOpinions(payload, terminalOrder);
      const active = replies[0] || currentOpinions[activeSpeakerIndex] || null;
      await postRoomAction("terminal", active, {
        title: instruction || command || "Pedido direto ao terminal",
        command: terminalOrder,
        prompt: terminalOrder
      });
      terminalEl.textContent = [
        "> cheffe-call/direct-terminal",
        `order: ${terminalOrder}`,
        "status: agentes responderam e terminal registrou",
        "",
        formatAgentReplies(replies, 5)
      ].join("\n");
      setAgentResponse({
        badge: "Terminal executado",
        title: `${replies.length} agentes responderam ao terminal`,
        text: "O pedido direto foi recebido e virou uma nova fila de respostas.",
        next: "Aprove a melhor resposta, ajuste no Prompt Mestre ou implemente a fila aprovada.",
        tone: "ok",
        items: buildAgentReplyItems(replies, 4)
      });
      setActionFeedback({
        badge: "Terminal",
        title: "Ordem executada",
        message: "Os agentes responderam e o terminal foi atualizado.",
        tone: "ok",
        closable: true,
        steps: [
          { label: "Pedido enviado", state: "done" },
          { label: "Respostas recebidas", state: "done" },
          { label: "Terminal registrado", state: "done" }
        ],
        details: formatAgentReplies(replies, 5),
        autoCloseMs: 3000
      });
      setStatus("Terminal recebeu a ordem e os agentes responderam.", "ok");
    } catch (error) {
      setActionFeedback({
        badge: "Falha",
        title: "Terminal não executou",
        message: error.message || "Não foi possível enviar ao terminal.",
        tone: "bad",
        closable: true,
        steps: [
          { label: "Pedido lido", state: "done" },
          { label: "Execução interrompida", state: "bad" }
        ]
      });
      setAgentResponse({
        badge: "Falha",
        title: "O terminal não devolveu resposta",
        text: error.message || "A ordem não foi concluída.",
        next: "Confira a senha e tente Enviar ao terminal novamente.",
        tone: "bad",
        items: [{ state: "bad", label: "erro", agent: "Cheffe Call", text: error.message || "Falha no terminal." }]
      });
      setStatus(error.message, "bad");
    }
  });

  nextSpeakerEl?.addEventListener("click", () => {
    if (!currentOpinions.length) {
      setStatus("Abra uma rodada para os agentes antes de chamar o próximo.", "bad");
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
    setActionFeedback({
      badge: "Encerrar",
      title: "Fechando reunião",
      message: "A Cheffe Call está liberando as automações e preparando retorno para a home.",
      tone: "pending",
      closable: false,
      steps: [
        { label: "Senha Full Admin validada", state: "done" },
        { label: "Liberando agentes", state: "running" },
        { label: "Retorno para home", state: "pending" }
      ]
    });
    postCall("/api/cheffe-call/release", { password })
      .then(() => {
        setActionFeedback({
          badge: "Encerrada",
          title: "Reunião encerrada",
          message: "A sala foi fechada. Use Voltar para home para retomar a página principal.",
          tone: "ok",
          closable: true,
          home: true,
          steps: [
            { label: "Automações liberadas", state: "done" },
            { label: "Sessão fechada", state: "done" },
            { label: "Home disponível", state: "done" }
          ]
        });
        setAgentResponse({
          badge: "Sala liberada",
          title: "Automações devolvidas aos agentes",
          text: "A reunião foi encerrada e as rotinas podem voltar ao ciclo automático.",
          next: "Clique Voltar para home no popup, ou abra uma nova rodada se quiser comandar de novo.",
          tone: "ok",
          summary: {
            resolved: "Reunião encerrada e automações liberadas.",
            evidence: "Servidor confirmou release da Cheffe Call.",
            pending: "Voltar para home ou iniciar outra rodada.",
            order: "Sem ordem pendente nesta reunião."
          },
          items: [{ state: "done", label: "liberado", agent: "Cheffe Call", text: "Runtimes livres." }]
        });
        setStatus("Runtimes liberadas.", "ok");
      })
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
        setAgentResponse({
          badge: "Sala sincronizada",
          title: "Estado atual carregado",
          text: buildSessionSummaryText(),
          next: "Continue a rodada atual ou digite uma nova ordem.",
          tone: "ok",
          items: currentOpinions.length
            ? buildAgentReplyItems(currentOpinions, 3)
            : [{ state: "pending", label: "sem rodada", agent: "Cheffe Call", text: "Abra uma rodada para receber respostas." }]
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
      .then(() => {
        setAgentResponse({
          badge: "Fila atualizada",
          title: "Opiniões sincronizadas",
          text: currentOpinions.length ? "A lista de agentes foi recarregada com o estado mais recente." : "Ainda não há rodada com respostas.",
          next: currentOpinions.length ? "Aprove, ajuste ou implemente uma resposta." : "Abra uma rodada com uma ordem.",
          tone: "ok",
          items: currentOpinions.length
            ? buildAgentReplyItems(currentOpinions, 3)
            : [{ state: "pending", label: "sem respostas", agent: "Cheffe Call", text: "Digite uma ordem para os agentes responderem." }]
        });
        setStatus("Fila de opiniões atualizada.", "ok");
      })
      .catch((error) => {
        setAgentResponse({
          badge: "Falha",
          title: "Fila não atualizou",
          text: error.message || "Não foi possível recarregar as opiniões.",
          next: "Tente novamente em alguns segundos.",
          tone: "bad",
          items: [{ state: "bad", label: "erro", agent: "Cheffe Call", text: error.message || "Falha ao atualizar fila." }]
        });
        setStatus(error.message, "bad");
      });
  });

  runApprovedOpinions?.addEventListener("click", () => {
    runApprovedOpinionQueue().catch((error) => setStatus(error.message, "bad"));
  });

  pullAgentIdeasToDirectOrder?.addEventListener("click", () => {
    pullAgentIdeasIntoDirectOrder();
  });

  directOrderAnalyze?.addEventListener("click", () => {
    submitDirectOrder(false);
  });

  directOrderRunAgents?.addEventListener("click", () => {
    submitDirectOrder(true);
  });

  directOrderRunQueue?.addEventListener("click", () => {
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
    let manualRuntimePayload = null;
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
        manualRuntimePayload = payload;
        const outcome = getRuntimeEvidence(payload);
        setActionFeedback({
          badge: "Runtime",
          title: "Agentes finalizaram",
          message: outcome.evidence,
          tone: getRuntimeOutcomeTone(payload),
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
        const outcome = getRuntimeEvidence(manualRuntimePayload);
        const proofUi = getRuntimeProofUi(outcome);
        const tone = getRuntimeOutcomeTone(manualRuntimePayload);
        const summary = buildRuntimeOutcomeSummary(
          manualRuntimePayload,
          instructionInput?.value || "Rodada manual disparada pela Cheffe Call.",
          "rodada manual"
        );
        setExecutionControl({
          badge: proofUi.badge,
          title: `Rodada manual: ${proofUi.title}`,
          text: "Rodar agentes agora atualizou este controle com evidência ou pendência.",
          tone,
          summary,
          log: formatRuntimeDetailsForTerminal(manualRuntimePayload, "manual: rodar agentes")
        });
        setActionFeedback({
          badge: proofUi.shortBadge,
          title: `Sala atualizada: ${proofUi.actionTitle}`,
          message: outcome.evidence,
          tone,
          steps: [
            { label: "Runtime concluída", state: "done" },
            { label: proofUi.stepLabel, state: proofUi.state }
          ],
          closable: true
        });
        setAgentResponse({
          badge: proofUi.responseBadge,
          title: proofUi.responseTitle,
          text: proofUi.text,
          next: summary.pending,
          tone,
          summary,
          items: currentOpinions.length
            ? buildAgentReplyItems(currentOpinions, 4)
            : [{ state: proofUi.state, label: proofUi.itemLabel, agent: "Cheffe Call", text: outcome.evidence }]
        });
        setStatus(
          outcome.hasApplicationProof
            ? "Rodada manual com aplicação provada."
            : outcome.hasExecutionProof
              ? "Rodada manual com execução provada; aplicação pendente."
              : "Rodada manual concluída, mas evidência ainda pendente.",
          "ok"
        );
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
        setAgentResponse({
          badge: "Falha",
          title: "Runtime não concluiu",
          text: error.message || "Os agentes não finalizaram a rodada manual.",
          next: "Confira senha/conexão e tente Rodar agentes agora novamente.",
          tone: "bad",
          items: [{ state: "bad", label: "erro", agent: "Runtime", text: error.message || "Falha ao rodar agentes." }]
        });
        setStatus(error.message, "bad");
      });
  });

  adminReleaseRoom?.addEventListener("click", () => {
    const password = requireAdminPassword("encerrar a reunião real");
    if (!password) return;
    setStatus("Encerrando reunião real...");
    setActionFeedback({
      badge: "Encerrar",
      title: "Fechando reunião",
      message: "Liberando agentes e preparando retorno para a home.",
      tone: "pending",
      closable: false,
      steps: [
        { label: "Senha validada", state: "done" },
        { label: "Release da sala", state: "running" },
        { label: "Home disponível", state: "pending" }
      ]
    });
    postCall("/api/cheffe-call/release", { password })
      .then(() => {
        setActionFeedback({
          badge: "Encerrada",
          title: "Reunião encerrada",
          message: "A Cheffe Call fechou a sessão. O botão abaixo volta para a home.",
          tone: "ok",
          closable: true,
          home: true,
          steps: [
            { label: "Release confirmado", state: "done" },
            { label: "Agentes liberados", state: "done" },
            { label: "Retorno pronto", state: "done" }
          ]
        });
        setAgentResponse({
          badge: "Reunião encerrada",
          title: "Sala fechada com sucesso",
          text: "A Cheffe Call saiu do modo reunião e liberou os agentes.",
          next: "Clique Voltar para home no popup, ou use Abrir rodada para iniciar outra ordem.",
          tone: "ok",
          summary: {
            resolved: "Sala fechada e agentes liberados.",
            evidence: "Release confirmado pelo servidor.",
            pending: "Voltar para home ou abrir nova rodada.",
            order: "Nenhuma ordem ativa depois do encerramento."
          },
          items: [{ state: "done", label: "encerrado", agent: "Cheffe Call", text: "Runtimes liberadas." }]
        });
        setStatus("Reunião encerrada.", "ok");
      })
      .catch((error) => setStatus(error.message, "bad"));
  });

  adminClearSession?.addEventListener("click", () => {
    const password = requireAdminPassword("limpar a sessão real");
    if (!password) return;
    setStatus("Limpando sessão atual...");
    postCall("/api/cheffe-call/admin/clear", { password, sessionId: currentMeetingSessionId })
      .then(() => {
        setAgentResponse({
          badge: "Sessão limpa",
          title: "Fila zerada",
          text: "A sessão atual foi limpa. Nenhuma ação antiga fica confundindo a próxima rodada.",
          next: "Digite uma nova ordem e abra rodada.",
          tone: "ok",
          items: [{ state: "done", label: "limpo", agent: "Cheffe Call", text: "Sessão atual removida." }]
        });
        setStatus("Sessão atual limpa.", "ok");
      })
      .catch((error) => setStatus(error.message, "bad"));
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
    pendingAdjustmentContext = null;
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
    pendingAdjustmentContext = null;
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
    pendingAdjustmentContext = null;
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

  promptAdjustmentSelect?.addEventListener("change", () => {
    if (pendingAdjustmentContext) {
      stageAdjustmentInPromptMaster(pendingAdjustmentContext, { scroll: false });
      setStatus(`Tipo de ajuste alterado para ${getAdjustmentGuide().label}.`, "ok");
    }
  });

  decisionOfficeSelect?.addEventListener("change", () => {
    refreshDecisionAgentOptions(decisionOfficeSelect.value || "");
    refreshDecisionPreview();
  });

  decisionAgentSelect?.addEventListener("change", () => {
    const agent = getDecisionAgentBySlug(decisionAgentSelect.value || "");
    if (agent?.office && decisionOfficeSelect) {
      decisionOfficeSelect.value = agent.office;
      refreshDecisionAgentOptions(agent.office, agent.slug);
    }
    refreshDecisionPreview();
  });

  decisionActionSelect?.addEventListener("change", () => {
    const selection = getDecisionSelection();
    if (decisionComposerBadge) decisionComposerBadge.textContent = selection.guide.label;
    if (decisionComposerHint) decisionComposerHint.textContent = selection.guide.after;
    refreshDecisionPreview(decisionComposerText?.value || "");
  });

  decisionOpenComposer?.addEventListener("click", () => {
    openDecisionComposer({
      text: quickInstructionInput?.value || instructionInput?.value || latestCallPayload?.meeting?.lastInstruction || ""
    });
    decisionDesk?.scrollIntoView({ behavior: "smooth", block: "center" });
  });

  decisionUseActiveIdea?.addEventListener("click", () => {
    const active = currentOpinions[activeSpeakerIndex];
    if (!active) {
      setStatus("Abra uma rodada ou selecione um card antes de usar a fala ativa.", "bad");
      openDecisionComposer();
      return;
    }
    openDecisionComposer({ active, text: active.opinion || active.assignment?.idea || "", action: "accept" });
    setStatus(`Fala de ${getAgentDisplayName(active)} carregada na Mesa de decisão.`, "ok");
  });

  decisionComposerClose?.addEventListener("click", closeDecisionComposer);
  decisionComposerCancel?.addEventListener("click", closeDecisionComposer);
  decisionComposer?.addEventListener("click", (event) => {
    if (event.target === decisionComposer) closeDecisionComposer();
  });
  decisionComposerText?.addEventListener("input", () => refreshDecisionPreview(decisionComposerText.value));
  decisionComposerSubmit?.addEventListener("click", () => {
    submitDecisionOrder();
  });
  decisionAcceptOrder?.addEventListener("click", () => {
    commitDecisionOrder("accept");
  });
  decisionImplementOrder?.addEventListener("click", () => {
    commitDecisionOrder("implement");
  });
  decisionReviseOrder?.addEventListener("click", () => {
    const decision = pendingDecisionResolution || latestDecisionOrder;
    if (!decision) {
      openDecisionComposer();
      return;
    }
    openDecisionComposer({
      active: decision.targetReply,
      action: decision.selection?.guide?.value || "analyze",
      contextText: decision.contextText || ""
    });
    setStatus("Contexto da análise reaberto para ajuste.", "ok");
  });

  loadPromptToInstruction?.addEventListener("click", () => {
    const promptText = getActivePromptText();
    if (!promptText) {
      setStatus("Escolha um prompt antes de usar como ordem.", "bad");
      return;
    }
    syncVisibleInstruction(promptText, {
      visibleText: `Usar ${activePromptPayload.title || "Prompt Mestre"} como base da próxima rodada.`,
      focus: true
    });
    setCommandBarPulse();
    setAgentResponse({
      badge: "Ordem preparada",
      title: "Prompt carregado na ordem da reunião",
      text: "Nada foi executado ainda. A barra recebeu uma ordem curta; use Copiar texto se quiser o prompt inteiro.",
      next: "Edite a ordem curta ou clique Abrir rodada para mandar aos agentes.",
      tone: "ok",
      items: [{ state: "running", label: "aguardando envio", agent: activePromptPayload.title || "Prompt Mestre", text: promptText.slice(0, 220) }]
    });
    setStatus("Ordem preenchida. Ela só roda quando você abre a rodada.", "ok");
  });

  loadPromptToTerminal?.addEventListener("click", async () => {
    const promptText = getActivePromptText();
    if (!promptText) {
      setStatus("Escolha um prompt antes de enviar ao terminal.", "bad");
      return;
    }
    if (commandInput) commandInput.value = promptText;
    syncVisibleInstruction(promptText, {
      visibleText: `Executar ${activePromptPayload.title || "Prompt Mestre"} no terminal.`,
      focus: false
    });
    setCommandBarPulse();
    const password = getAdminPassword();
    if (!password) {
      setStatus("Prompt pronto. Valide a senha Full Admin para executar no terminal.", "bad");
      setPasswordStatus("Senha obrigatória para executar no terminal.", "bad");
      quickPasswordInput?.focus();
      return;
    }
    setActionFeedback({
      badge: "Terminal",
      title: "Executando Prompt Mestre",
      message: "A Cheffe Call está enviando o prompt para a rodada real dos agentes.",
      tone: "pending",
      steps: [
        { label: "Prompt recebido", state: "ok" },
        { label: "Senha Full Admin validada", state: "ok" },
        { label: "Rodada dos agentes em execução", state: "pending" },
        { label: "Resultado será registrado no terminal", state: "pending" }
      ],
      details: promptText,
      closable: false
    });
    setStatus("Enviando Prompt Mestre ao terminal real da Cheffe Call...");
    try {
      const payload = await postCall("/api/cheffe-call/start", { password, instruction: promptText });
      activateMeetingResponse(promptText, payload);
      const active = pendingAdjustmentContext || currentOpinions[activeSpeakerIndex] || null;
      await postRoomAction("terminal", active, {
        title: activePromptPayload.title || "Prompt enviado ao terminal",
        command: promptText,
        prompt: promptText
      });
      const replies = getPayloadOpinions(payload, promptText);
      setActionFeedback({
        badge: "Terminal",
        title: "Prompt executado",
        message: "Os agentes receberam o Prompt Mestre e a resposta entrou na reunião.",
        tone: "ok",
        steps: [
          { label: "Prompt recebido", state: "ok" },
          { label: "Rodada executada", state: "ok" },
          { label: "Decisão registrada", state: "ok" },
          { label: "Terminal atualizado", state: "ok" }
        ],
        details: formatAgentReplies(replies, 5),
        closable: true
      });
      setAgentResponse({
        badge: "Prompt executado",
        title: `${replies.length} agentes responderam`,
        text: "O Prompt Mestre foi enviado ao terminal real da Cheffe Call.",
        next: "Escolha uma resposta para aprovar, ajustar ou implementar.",
        tone: "ok",
        summary: {
          resolved: "Prompt enviado aos agentes e resposta registrada.",
          evidence: `${replies.length} resposta${replies.length === 1 ? "" : "s"} entrou${replies.length === 1 ? "" : "aram"} na reunião.`,
          pending: "Aprovar, ajustar, criar tarefa ou implementar.",
          order: "Prompt Mestre executado no terminal da sala."
        },
        items: buildAgentReplyItems(replies, 4)
      });
      setStatus("Prompt Mestre enviado ao terminal e agentes reagiram.", "ok");
    } catch (error) {
      setActionFeedback({
        badge: "Terminal",
        title: "Falha ao executar",
        message: error.message || "Não foi possível enviar o Prompt Mestre ao terminal.",
        tone: "bad",
        steps: [
          { label: "Prompt recebido", state: "ok" },
          { label: "Execução interrompida", state: "bad" }
        ],
        closable: true
      });
      setAgentResponse({
        badge: "Falha",
        title: "Prompt não executou",
        text: error.message || "O terminal não conseguiu receber o Prompt Mestre.",
        next: "Confira a senha e tente Executar no terminal de novo.",
        tone: "bad",
        items: [{ state: "bad", label: "erro", agent: "Prompt Mestre", text: error.message || "Falha no terminal." }]
      });
      setStatus(error.message, "bad");
    }
  });

  copyPromptText?.addEventListener("click", async () => {
    const promptText = getActivePromptText();
    const copied = await copyText(promptText);
    setAgentResponse({
      badge: copied ? "Copiado" : "Falha",
      title: copied ? "Texto copiado sem executar" : "Não foi possível copiar",
      text: copied
        ? "Copiar só manda o prompt para a área de transferência. Nenhum agente foi acionado."
        : "O navegador bloqueou a cópia automática.",
      next: copied ? "Cole onde precisar, ou use Executar no terminal para receber resposta dos agentes." : "Selecione o texto manualmente ou tente novamente.",
      tone: copied ? "ok" : "bad",
      items: [{ state: copied ? "done" : "bad", label: copied ? "copiado" : "erro", agent: activePromptPayload.title || "Prompt", text: promptText.slice(0, 220) }]
    });
    setStatus(copied ? "Prompt copiado. Copiar não executa nada sozinho." : "Nao foi possivel copiar o prompt.", copied ? "ok" : "bad");
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
