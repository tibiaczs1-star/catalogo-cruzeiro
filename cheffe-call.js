(function () {
  const audienceEl = document.querySelector("#agentAudience");
  const statusEl = document.querySelector("#callStatus");
  const terminalEl = document.querySelector("#callTerminal");
  const formEl = document.querySelector("#cheffeCallForm");
  const releaseEl = document.querySelector("#releaseCall");
  const opinionsEl = document.querySelector("#opinionsList");
  const agentOfDayEl = document.querySelector("#agentOfDay");
  const agentOfDayMetaEl = document.querySelector("#agentOfDayMeta");
  const officeOfDayEl = document.querySelector("#officeOfDay");
  const officeOfDayMetaEl = document.querySelector("#officeOfDayMeta");
  const actionOfDayEl = document.querySelector("#actionOfDay");
  const actionOfDayMetaEl = document.querySelector("#actionOfDayMeta");

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

  function renderAudience(count) {
    if (!audienceEl) return;
    const colors = ["#7fe7ff", "#f4c96b", "#73eba8", "#f56d7a", "#cda6ff"];
    audienceEl.innerHTML = Array.from({ length: Math.min(181, Number(count || 90)) })
      .map(
        (_, index) =>
          `<span class="seat-agent" style="--agent-color:${colors[index % colors.length]};--delay:${
            (index % 17) * 80
          }ms"></span>`
      )
      .join("");
  }

  function renderDaily(payload) {
    const daily = payload.dailyContext || {};
    const agent = daily.agentOfDay || {};
    const office = daily.officeOfDay || {};
    const action = daily.actionOfDay || {};

    agentOfDayEl.textContent = agent.name || "Sem rodada";
    agentOfDayMetaEl.textContent = agent.name
      ? `${agent.office} • autonomia ${agent.score || 0}% • ${agent.intent || "intencao em formacao"}`
      : "Rode os agentes para calcular o destaque.";

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
    const opinions = Array.isArray(payload.opinions) ? payload.opinions : [];
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
    renderAudience(payload.summary?.totalAgents || 181);
    renderDaily(payload);
    renderOpinions(payload);
    renderTerminal(payload);
    setStatus(payload.meeting?.active ? "Cheffe Call ativo. Runtimes pausadas." : "Sala pronta.", "ok");
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
    if (!password) {
      setStatus("Digite a senha Full Admin.", "bad");
      return;
    }
    setStatus("Abrindo Cheffe Call...");
    postCall("/api/cheffe-call/start", { password, instruction }).catch((error) => setStatus(error.message, "bad"));
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

  loadCall().catch((error) => setStatus(error.message, "bad"));
  window.setInterval(() => loadCall().catch((error) => setStatus(error.message, "bad")), 60 * 1000);
})();
