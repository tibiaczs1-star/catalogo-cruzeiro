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
  const speechBubbleEl = document.querySelector("#activeSpeechBubble");
  const meetingLogList = document.querySelector("#meetingLogList");
  const agentOfDayEl = document.querySelector("#agentOfDay");
  const agentOfDayMetaEl = document.querySelector("#agentOfDayMeta");
  const agentOfDayAvatar = document.querySelector("#agentOfDayAvatar");
  const agentNeuralBar = document.querySelector("#agentNeuralBar");
  const agentAwardNote = document.querySelector("#agentAwardNote");
  const voteAgentOfDay = document.querySelector("#voteAgentOfDay");
  const openAgentFile = document.querySelector("#openAgentFile");
  const officeOfDayEl = document.querySelector("#officeOfDay");
  const officeOfDayMetaEl = document.querySelector("#officeOfDayMeta");
  const actionOfDayEl = document.querySelector("#actionOfDay");
  const actionOfDayMetaEl = document.querySelector("#actionOfDayMeta");
  const theaterEl = document.querySelector(".bitmap-theater");

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

  function slugify(value) {
    return String(value || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function getVoteKey(agent) {
    return `cheffe_agent_vote:${slugify(agent?.name || agent?.agent || "agente")}`;
  }

  function getAgentVotes(agent) {
    try {
      return Number(window.localStorage.getItem(getVoteKey(agent)) || 0);
    } catch (_error) {
      return 0;
    }
  }

  function addAgentVote(agent) {
    const nextVotes = getAgentVotes(agent) + 1;
    try {
      window.localStorage.setItem(getVoteKey(agent), String(nextVotes));
    } catch (_error) {
      // ignore storage failures
    }
    return nextVotes;
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function setStatus(message, tone) {
    if (!statusEl) return;
    statusEl.textContent = message;
    statusEl.style.color = tone === "bad" ? "var(--call-red)" : tone === "ok" ? "var(--call-green)" : "";
  }

  function getAgentDisplayName(item) {
    return item?.agent || item?.name || "Agente";
  }

  function getAgentOffice(item) {
    return item?.office || item?.officeLabel || "Escritório";
  }

  function getAgentScore(item) {
    return Number(item?.score || item?.autonomy || item?.autonomy?.autonomy || 0);
  }

  function hashValue(value) {
    return String(value || "")
      .split("")
      .reduce((sum, char) => sum + char.charCodeAt(0), 0);
  }

  function getAgentPersona(item) {
    const signature = `${getAgentDisplayName(item)} ${getAgentOffice(item)} ${item?.role || ""}`.toLowerCase();
    const skin = ["#f2c5a0", "#e8ae83", "#d99b72", "#f0d0aa"][hashValue(signature) % 4];
    const hair = ["#17101b", "#3a2419", "#24283d", "#5a351f", "#111827"][hashValue(signature) % 5];
    const profile = {
      accent: "#7fe7ff",
      jacket: "#1d2740",
      accessory: "badge",
      prop: "tablet",
      hairStyle: "short",
      skin,
      hair
    };
    if (/ceo|coord|gest|admin|produtor|prioridade|comando/.test(signature)) {
      return { ...profile, accent: "#f4c96b", jacket: "#2b2234", accessory: "tie", prop: "tablet", hairStyle: "swept" };
    }
    if (/review|revis|proof|qualidade|clean|audit/.test(signature)) {
      return { ...profile, accent: "#cda6ff", jacket: "#302653", accessory: "glasses", prop: "clipboard", hairStyle: "bob" };
    }
    if (/arte|design|foto|visual|pixel|sprite|tag/.test(signature)) {
      return { ...profile, accent: "#ff7ab6", jacket: "#3a1930", accessory: "bow", prop: "stylus", hairStyle: "wave" };
    }
    if (/dev|sistema|terminal|code|autom|runtime|dados/.test(signature)) {
      return { ...profile, accent: "#73eba8", jacket: "#113323", accessory: "headset", prop: "toolkit", hairStyle: "short" };
    }
    if (/games|game|loop|play|nerd/.test(signature)) {
      return { ...profile, accent: "#7fe7ff", jacket: "#142446", accessory: "visor", prop: "gamepad", hairStyle: "spiky" };
    }
    if (/venda|promo|market|pix|acesso|social/.test(signature)) {
      return { ...profile, accent: "#ffb65c", jacket: "#4a2813", accessory: "cap", prop: "phone", hairStyle: "swept" };
    }
    if (/fonte|source|study|educ|kids|ninja|segur/.test(signature)) {
      return { ...profile, accent: "#73eba8", jacket: "#1e3a2f", accessory: "glasses", prop: "book", hairStyle: "bun" };
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

  function extractRealAgents(payload) {
    const daily = payload?.dailyContext || {};
    const topAgents = Array.isArray(daily.topAgents) ? daily.topAgents : [];
    const queue = Array.isArray(payload?.queue) ? payload.queue : [];
    const source = topAgents.length ? topAgents : queue;
    const mapped = source
      .map((item) => ({
        agent: item.name || item.agent,
        office: item.office || item.officeLabel,
        role: item.role || item.title || "agent",
        score: item.score || item.autonomy || item.autonomy?.autonomy || 0,
        intent: item.intent || item.autonomy?.intent || item.assignment?.idea || ""
      }))
      .filter((item) => item.agent);
    return mapped.length ? mapped : fallbackAgents;
  }

  function renderAudience(count, speakerNames = [], agentList = currentRealAgents) {
    if (!audienceEl) return;
    const colors = ["#7fe7ff", "#f4c96b", "#73eba8", "#f56d7a", "#cda6ff"];
    const sourceAgents = Array.isArray(agentList) && agentList.length ? agentList : fallbackAgents;
    audienceEl.innerHTML = Array.from({ length: Math.min(181, Number(count || 90)) })
      .map(
        (_, index) => {
          const agent = sourceAgents[index % sourceAgents.length];
          const name = getAgentDisplayName(agent);
          const isSpeaking = speakerNames.includes(name);
          return `<span class="seat-agent has-sprite ${isSpeaking ? "is-speaking" : ""}" data-agent-index="${index}" data-agent-name="${escapeHtml(name)}" title="${escapeHtml(
            `${name} • ${getAgentOffice(agent)}`
          )}" style="--agent-color:${colors[index % colors.length]};--agent-hair:${
            index % 3 === 0 ? "#151018" : index % 3 === 1 ? "#47301d" : "#232b44"
          };--delay:${
            (index % 17) * 80
          }ms">${renderAgentSprite(agent)}<span class="agent-name-tag">${escapeHtml(name)}</span></span>`;
        }
      )
      .join("");
  }

  function buildLocalOpinions(subject, command) {
    const cleanSubject = subject || "a reunião dos agentes";
    const cleanCommand = command || "sem código colado ainda";
    const templates = [
      "Eu começaria definindo o objetivo da sala e a primeira ação que você quer aprovar.",
      "A reunião precisa mostrar resposta visual: sentado, levantando a mão, falando e pontuando.",
      "O terminal deve receber pedido específico sem misturar com senha; senha só para operação real.",
      "Eu criaria pontuação visível para dar vontade de acompanhar funcionário do dia, semana, mês e ano.",
      "A sala precisa inspirar: luz, mesa central, gente conversando e painel vivo, não um palco vazio.",
      "Se tiver código, eu separaria análise, risco e patch antes de executar qualquer coisa."
    ];
    return fallbackAgents.slice(0, 10).map((agent, index) => ({
      ...agent,
      opinion: `${templates[index % templates.length]} Assunto: ${cleanSubject}. Terminal: ${cleanCommand.slice(0, 120)}.`
    }));
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
    currentAgentOfDay = agent.name ? agent : fallbackAgents[0];
    const neuralScore = Math.max(42, Math.min(100, Number(agent.score || agent.autonomy || 82)));
    const votes = getAgentVotes(currentAgentOfDay);
    if (agentOfDayAvatar) {
      agentOfDayAvatar.innerHTML = `
        <span class="spotlight-rays"></span>
        ${renderAgentSprite(
          {
            agent: currentAgentOfDay.name || currentAgentOfDay.agent,
            office: currentAgentOfDay.office,
            role: currentAgentOfDay.role,
            score: currentAgentOfDay.score
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
      ? `${agent.office} • autonomia ${agent.score || 0}% • ${votes} votos no avatar • ${
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

  function renderOpinions(payload) {
    const opinions = normalizeOpinions(payload.opinions, payload.meeting?.lastInstruction || "o assunto da reunião");
    if (!opinions.length) {
      opinionsEl.innerHTML = '<p class="opinion-body">Nenhuma opinião registrada ainda.</p>';
      return;
    }

    opinionsEl.innerHTML = opinions
      .map(
        (item) => `
          <article class="opinion-item">
            <div class="opinion-id">
              <strong>${escapeHtml(item.agent)}</strong>
              <span>${escapeHtml(item.office)} • ${escapeHtml(item.role)} • ${escapeHtml(item.score || 0)}%</span>
            </div>
            <p class="opinion-body">${escapeHtml(item.opinion)}</p>
          </article>
        `
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

  function setSpeakerQueue(opinions, reset = true) {
    currentOpinions = Array.isArray(opinions) && opinions.length ? opinions : [];
    if (reset) activeSpeakerIndex = 0;
    showActiveSpeaker();
  }

  function showActiveSpeaker() {
    const active = currentOpinions[activeSpeakerIndex % Math.max(1, currentOpinions.length)];
    if (!active) return;
    const activeName = getAgentDisplayName(active);
    audienceEl?.querySelectorAll(".seat-agent").forEach((seat) => {
      seat.classList.toggle("is-speaking", seat.dataset.agentName === activeName);
    });
    if (speechBubbleEl) {
      speechBubbleEl.innerHTML = `
        <span>${escapeHtml(getAgentOffice(active))} • ${escapeHtml(active.role || "agente")} • ${escapeHtml(active.score || 0)}%</span>
        <strong>${escapeHtml(activeName)}</strong>
        <p>${escapeHtml(active.opinion || "Aguardando fala.")}</p>
        <div class="speech-actions">
          <button type="button" data-idea-action="approve">Boa ideia</button>
          <button type="button" data-idea-action="variation">Pedir variação</button>
          <button type="button" data-idea-action="task">Virar tarefa</button>
          <button type="button" data-idea-action="terminal">Mandar ao terminal</button>
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

  function handleIdeaAction(action) {
    const active = currentOpinions[activeSpeakerIndex];
    if (!active) {
      setStatus("Nenhuma ideia ativa para interagir.", "bad");
      return;
    }
    const agentName = getAgentDisplayName(active);
    const idea = active.opinion || "";
    if (action === "approve") {
      addMeetingLog({ kind: "good", kindLabel: "boa ideia", agent: agentName, text: idea });
      setStatus(`${agentName} recebeu voto positivo nessa ideia.`, "ok");
      return;
    }
    if (action === "variation") {
      const variation = `${buildOpinionForAgent(active, "variação solicitada", activeSpeakerIndex)} Quero uma segunda opção antes de executar.`;
      active.opinion = variation;
      addMeetingLog({ kindLabel: "variação pedida", agent: agentName, text: variation });
      showActiveSpeaker();
      setStatus(`${agentName} reformulou a ideia em outra direção.`, "ok");
      return;
    }
    if (action === "task") {
      const task = `Tarefa criada para ${agentName}: transformar a ideia em entrega revisável, com critério de aceite e próxima ação.`;
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
      addMeetingLog({ kindLabel: "enviado ao terminal", agent: agentName, text: idea });
      terminalEl.textContent = [
        "> cheffe-call/idea-terminal",
        `agent: ${agentName}`,
        `office: ${getAgentOffice(active)}`,
        `idea: ${idea}`,
        "command: aguardando seu complemento no campo Terminal"
      ].join("\n");
      setStatus(`Ideia de ${agentName} foi enviada ao terminal.`, "ok");
    }
  }

  function renderTerminal(payload) {
    const meeting = payload.meeting || {};
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
      `orientacao: ${meeting.lastInstruction || "nenhuma orientacao ativa"}`,
      "protocolo: ouvir -> memorizar -> opinar -> aguardar aprovacao"
    ].join("\n");
  }

  function render(payload) {
    currentRealAgents = extractRealAgents(payload);
    renderAudience(payload.summary?.totalAgents || currentRealAgents.length || 181, [], currentRealAgents);
    renderDaily(payload);
    renderOpinions(payload);
    renderTerminal(payload);
    setStatus(payload.meeting?.active ? "Cheffe Call ativo. Runtimes pausadas." : "Sala pronta.", "ok");
  }

  function renderLocalMeeting(subject, command) {
    const opinions = buildLocalOpinions(subject, command);
    const payload = {
      summary: {
        totalAgents: 181,
        autonomousAgents: 181,
        averageAutonomy: 86
      },
      meeting: {
        active: true,
        lastInstruction: subject || "reunião visual aberta"
      },
      dailyContext: {
        agentOfDay: {
          name: opinions[0].agent,
          office: opinions[0].office,
          score: opinions[0].score,
          intent: "abrir a conversa e organizar prioridade"
        },
        officeOfDay: {
          office: "Cheffe Call",
          agents: 181,
          averageAutonomy: 86,
          averageUrgency: 72
        },
        actionOfDay: {
          title: "Reunião interativa",
          action: command || "Ouvir, opinar, pontuar e aguardar aprovação."
        }
      },
      opinions
    };
    theaterEl?.classList.add("is-meeting-live");
    currentRealAgents = opinions;
    renderAudience(181, opinions.slice(0, 1).map((item) => item.agent), currentRealAgents);
    renderDaily(payload);
    renderOpinions(payload);
    setSpeakerQueue(opinions);
    addMeetingLog({
      kindLabel: "reunião aberta",
      agent: "Cheffe Call",
      text: subject || "Reunião visual aberta."
    });
    terminalEl.textContent = [
      "> cheffe-call/visual-meeting",
      "modo: reunião interativa local",
      "senha: não exigida para ouvir opiniões visuais",
      `assunto: ${subject || "sem assunto informado"}`,
      `terminal: ${command || "aguardando pedido específico ou código"}`,
      "protocolo: ouvir -> comparar opiniões -> pedir execução específica -> aprovar"
    ].join("\n");
    setStatus("Reunião visual aberta. Agentes levantaram a mão e responderam.", "ok");
  }

  async function loadCall() {
    const response = await fetch("/api/cheffe-call", { headers: { Accept: "application/json" } });
    const payload = await response.json();
    if (!response.ok || !payload.ok) throw new Error(payload.error || "Nao foi possivel carregar a Cheffe Call.");
    render(payload);
  }

  async function postCall(path, body) {
    const response = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(body)
    });
    const payload = await response.json();
    if (!response.ok || !payload.ok) throw new Error(payload.error || "Falha na Cheffe Call.");
    render(payload);
  }

  formEl?.addEventListener("submit", (event) => {
    event.preventDefault();
    const form = new FormData(formEl);
    const password = String(form.get("password") || "").trim();
    const instruction = String(form.get("instruction") || "").trim();
    const command = String(form.get("command") || "").trim();
    if (!password) {
      renderLocalMeeting(instruction, command);
      return;
    }
    setStatus("Abrindo Cheffe Call...");
    postCall("/api/cheffe-call/start", { password, instruction }).catch((error) => setStatus(error.message, "bad"));
  });

  sendTerminalEl?.addEventListener("click", () => {
    const form = new FormData(formEl);
    const instruction = String(form.get("instruction") || "").trim();
    const command = String(form.get("command") || "").trim();
    if (!instruction && !command) {
      setStatus("Digite o assunto ou cole um pedido/código antes de enviar ao terminal.", "bad");
      return;
    }
    renderLocalMeeting(instruction || "pedido direto ao terminal", command);
    terminalEl.textContent += "\nacao: pedido enviado ao terminal visual dos agentes";
    addMeetingLog({
      kindLabel: "comando terminal",
      agent: "Você",
      text: command || instruction
    });
  });

  nextSpeakerEl?.addEventListener("click", () => {
    if (!currentOpinions.length) {
      setStatus("Envie uma mensagem aos agentes antes de chamar o próximo.", "bad");
      return;
    }
    activeSpeakerIndex = (activeSpeakerIndex + 1) % currentOpinions.length;
    showActiveSpeaker();
    const active = currentOpinions[activeSpeakerIndex];
    addMeetingLog({
      kindLabel: "fala",
      agent: getAgentDisplayName(active),
      text: active?.opinion || ""
    });
  });

  markGoodIdeaEl?.addEventListener("click", () => {
    const active = currentOpinions[activeSpeakerIndex];
    if (!active) {
      setStatus("Nenhuma fala ativa para marcar como boa ideia.", "bad");
      return;
    }
    addMeetingLog({
      kind: "good",
      kindLabel: "boa ideia",
      agent: getAgentDisplayName(active),
      text: active.opinion
    });
    setStatus(`${getAgentDisplayName(active)} ganhou sinal positivo nessa rodada.`, "ok");
  });

  speechBubbleEl?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-idea-action]");
    if (!button) return;
    handleIdeaAction(button.dataset.ideaAction);
  });

  releaseEl?.addEventListener("click", () => {
    const password = String(new FormData(formEl).get("password") || "").trim();
    if (!password) {
      setStatus("Digite a senha Full Admin para liberar as runtimes.", "bad");
      return;
    }
    setStatus("Liberando runtimes...");
    postCall("/api/cheffe-call/release", { password }).catch((error) => setStatus(error.message, "bad"));
  });

  voteAgentOfDay?.addEventListener("click", () => {
    if (!currentAgentOfDay) return;
    const votes = addAgentVote(currentAgentOfDay);
    setStatus(`${currentAgentOfDay.name || currentAgentOfDay.agent} recebeu seu voto no avatar. Total local: ${votes}.`, "ok");
    renderDaily({
      dailyContext: {
        agentOfDay: currentAgentOfDay,
        officeOfDay: { office: officeOfDayEl?.textContent || "", agents: 181, averageAutonomy: 86, averageUrgency: 72 },
        actionOfDay: { title: actionOfDayEl?.textContent || "", action: actionOfDayMetaEl?.textContent || "" }
      }
    });
  });

  openAgentFile?.addEventListener("click", () => {
    const name = currentAgentOfDay?.name || currentAgentOfDay?.agent || "";
    window.location.href = `./real-agents.html?agent=${encodeURIComponent(slugify(name))}`;
  });

  loadCall().catch((error) => setStatus(error.message, "bad"));
  renderMeetingLogs();
  window.setInterval(() => loadCall().catch((error) => setStatus(error.message, "bad")), 60 * 1000);
})();
