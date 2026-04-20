(() => {
  const officeTabs = document.getElementById("pollOfficeTabs");
  const officeBadge = document.getElementById("pollOfficeBadge");
  const officeTitle = document.getElementById("pollOfficeTitle");
  const officeSummary = document.getElementById("pollOfficeSummary");
  const officeScope = document.getElementById("pollOfficeScope");
  const officeRule = document.getElementById("pollOfficeRule");
  const updatedAt = document.getElementById("pollUpdatedAt");
  const feedback = document.getElementById("pollFeedback");
  const candidateGrid = document.getElementById("pollCandidateGrid");
  const resultsTitle = document.getElementById("pollResultsTitle");
  const resultsNote = document.getElementById("pollResultsNote");
  const resultsList = document.getElementById("pollResultsList");

  const DEVICE_KEY = "catalogo_election_device_id_v2";
  const state = {
    offices: [],
    activeOfficeId: "",
    votes: {},
    userVotes: {},
    deviceId: "",
    busyCandidateId: ""
  };

  const numberFormatter = new Intl.NumberFormat("pt-BR");

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  async function readJson(response) {
    try {
      return await response.json();
    } catch (_error) {
      return {};
    }
  }

  function getDeviceId() {
    try {
      const saved = window.localStorage.getItem(DEVICE_KEY);
      if (saved) return saved;
      const next = `device-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
      window.localStorage.setItem(DEVICE_KEY, next);
      return next;
    } catch (_error) {
      return `device-fallback-${Math.random().toString(36).slice(2, 10)}`;
    }
  }

  function currentOffice() {
    return state.offices.find((office) => office.id === state.activeOfficeId) || null;
  }

  function buildInitials(name = "") {
    return String(name || "")
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0))
      .join("")
      .toUpperCase();
  }

  function setFeedback(kind, title, text) {
    if (!feedback) return;
    feedback.hidden = false;
    feedback.className = `poll-feedback is-${kind}`;
    feedback.innerHTML = `<strong>${escapeHtml(title)}</strong><p>${escapeHtml(text)}</p>`;
  }

  function clearFeedback() {
    if (!feedback) return;
    feedback.hidden = true;
    feedback.className = "poll-feedback";
    feedback.innerHTML = "";
  }

  function renderOfficeTabs() {
    if (!officeTabs) return;
    officeTabs.innerHTML = state.offices
      .map(
        (office) => `
          <button
            type="button"
            class="poll-office-tab"
            data-office-tab="${escapeHtml(office.id)}"
            aria-selected="${office.id === state.activeOfficeId ? "true" : "false"}"
            role="tab"
          >
            ${escapeHtml(office.label)}
          </button>
        `
      )
      .join("");
  }

  function renderOfficePanel() {
    const office = currentOffice();
    if (!office) return;
    if (officeBadge) officeBadge.textContent = office.badge || office.label || "Cargo";
    if (officeTitle) officeTitle.textContent = office.label || "Cargo";
    if (officeSummary) {
      officeSummary.textContent =
        office.summary || "Escolha um nome abaixo para registrar o voto neste cargo.";
    }
    if (officeScope) {
      officeScope.textContent = office.scope === "federal" ? "Escopo federal" : "Escopo estadual";
    }
    if (officeRule) {
      officeRule.textContent = "1 voto por dispositivo neste cargo";
    }
  }

  function renderCandidates() {
    const office = currentOffice();
    if (!candidateGrid || !office) return;
    const currentVote = state.userVotes?.[office.id] || "";
    const candidates = Array.isArray(office.candidates) ? office.candidates : [];

    if (!candidates.length) {
      candidateGrid.innerHTML = `<p class="poll-empty">Nenhum nome disponível neste cargo.</p>`;
      return;
    }

    candidateGrid.innerHTML = candidates
      .map((candidate) => {
        const alreadyVoted = currentVote === candidate.id;
        const isBusy = state.busyCandidateId === candidate.id;
        const buttonLabel = alreadyVoted
          ? "Você já votou"
          : isBusy
            ? "Registrando..."
            : "Votar neste nome";

        return `
          <article class="poll-candidate-card${alreadyVoted ? " is-voted" : ""}">
            <div class="poll-candidate-head">
              <div class="poll-candidate-avatar">
                ${
                  candidate.imageUrl
                    ? `<img src="${escapeHtml(candidate.imageUrl)}" alt="${escapeHtml(candidate.name)}" loading="lazy" />`
                    : `<span>${escapeHtml(buildInitials(candidate.name))}</span>`
                }
              </div>
              <div>
                <h3>${escapeHtml(candidate.name)}</h3>
                <p class="poll-candidate-role">${escapeHtml(candidate.role || office.label)}</p>
              </div>
            </div>
            <span class="poll-candidate-party">${escapeHtml(candidate.party || "Sem partido")}</span>
            <p class="poll-candidate-summary">
              ${escapeHtml(candidate.historySummary || candidate.currentPosition || "Perfil em acompanhamento.")}
            </p>
            <p class="poll-candidate-foot">
              ${escapeHtml(candidate.currentPosition || "Nome monitorado nesta rodada semanal.")}
            </p>
            <button
              type="button"
              class="poll-vote-button"
              data-vote-button="${escapeHtml(candidate.id)}"
              ${alreadyVoted || isBusy ? "disabled" : ""}
            >
              ${escapeHtml(buttonLabel)}
            </button>
          </article>
        `;
      })
      .join("");
  }

  function renderResults() {
    const office = currentOffice();
    if (!office || !resultsList) return;

    const officeVotes = state.votes?.[office.id] || {};
    const rows = (Array.isArray(office.candidates) ? office.candidates : [])
      .map((candidate) => ({
        candidate,
        total: Number(officeVotes[candidate.id] || 0)
      }))
      .sort((left, right) => right.total - left.total || left.candidate.name.localeCompare(right.candidate.name, "pt-BR"));

    const totalVotes = rows.reduce((sum, row) => sum + row.total, 0);
    if (resultsTitle) {
      resultsTitle.textContent = office.label ? `Parcial para ${office.label}` : "Resultado parcial";
    }
    if (resultsNote) {
      resultsNote.textContent = totalVotes
        ? `${numberFormatter.format(totalVotes)} voto(s) computado(s) nesta semana`
        : "Sem votos registrados por enquanto.";
    }

    if (!totalVotes) {
      resultsList.innerHTML = `<p class="poll-empty">Sem votos registrados por enquanto.</p>`;
      return;
    }

    resultsList.innerHTML = rows
      .map((row) => {
        const percent = totalVotes ? (row.total / totalVotes) * 100 : 0;
        return `
          <article class="poll-result-row">
            <div class="poll-result-meta">
              <strong>${escapeHtml(row.candidate.name)}</strong>
              <span>${numberFormatter.format(row.total)} voto(s) • ${percent.toFixed(1).replace(".", ",")}%</span>
            </div>
            <div class="poll-result-bar">
              <span style="width:${Math.max(0, Math.min(100, percent))}%"></span>
            </div>
          </article>
        `;
      })
      .join("");
  }

  function renderAll() {
    renderOfficeTabs();
    renderOfficePanel();
    renderCandidates();
    renderResults();
  }

  async function loadConfig() {
    const response = await fetch("/api/elections/acre", { headers: { Accept: "application/json" } });
    const payload = await readJson(response);
    if (!response.ok || !Array.isArray(payload.offices)) {
      throw new Error(payload.error || "Falha ao carregar os cargos.");
    }
    state.offices = payload.offices;
    state.activeOfficeId = state.activeOfficeId || payload.offices[0]?.id || "";
    if (updatedAt) {
      updatedAt.textContent = payload.updatedAt
        ? `Atualizado em ${payload.updatedAt}`
        : "Painel carregado";
    }
  }

  async function loadVotes() {
    const response = await fetch(`/api/elections/votes?voterId=${encodeURIComponent(state.deviceId)}`, {
      headers: { Accept: "application/json" }
    });
    const payload = await readJson(response);
    if (!response.ok) {
      throw new Error(payload.message || payload.error || "Falha ao carregar os votos.");
    }
    state.votes = payload.votes || {};
    state.userVotes = payload.userVotes || {};
  }

  async function handleVote(candidateId) {
    const office = currentOffice();
    const candidate = office?.candidates?.find((item) => item.id === candidateId);
    if (!office || !candidate) return;

    const userVote = state.userVotes?.[office.id];
    if (userVote) {
      setFeedback("warn", "Este dispositivo já votou.", "Esse cargo já está bloqueado neste navegador.");
      renderCandidates();
      return;
    }

    const confirmed = window.confirm(`Confirmar voto em ${candidate.name} para ${office.label}?`);
    if (!confirmed) return;

    state.busyCandidateId = candidate.id;
    renderCandidates();
    clearFeedback();

    try {
      const response = await fetch("/api/elections/votes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify({
          officeId: office.id,
          candidateId: candidate.id,
          voterId: state.deviceId,
          city: "Cruzeiro do Sul",
          sourcePage: location.pathname,
          pageTitle: document.title
        })
      });
      const payload = await readJson(response);

      if (!response.ok || !payload.ok) {
        throw new Error(payload.message || payload.error || "Falha ao registrar o voto.");
      }

      state.votes = payload.votes || state.votes;
      state.userVotes = payload.userVotes || state.userVotes;
      setFeedback(
        "success",
        "Obrigado por votar.",
        "Seu voto foi registrado e este cargo agora fica bloqueado neste dispositivo."
      );
      renderAll();
    } catch (error) {
      const message = String(error.message || "");
      if (message.toLowerCase().includes("já votou")) {
        await loadVotes();
        setFeedback(
          "warn",
          "Este dispositivo já votou.",
          "Esse cargo já estava registrado neste navegador. As parciais foram atualizadas."
        );
        renderAll();
      } else {
        setFeedback("error", "Não foi possível votar.", message || "Tente novamente em instantes.");
        renderCandidates();
      }
    } finally {
      state.busyCandidateId = "";
      renderCandidates();
    }
  }

  function bindEvents() {
    officeTabs?.addEventListener("click", (event) => {
      const button = event.target.closest("[data-office-tab]");
      if (!button) return;
      state.activeOfficeId = button.getAttribute("data-office-tab") || "";
      clearFeedback();
      renderAll();
    });

    candidateGrid?.addEventListener("click", (event) => {
      const button = event.target.closest("[data-vote-button]");
      if (!button) return;
      handleVote(button.getAttribute("data-vote-button") || "");
    });
  }

  async function init() {
    state.deviceId = getDeviceId();
    bindEvents();
    await loadConfig();
    await loadVotes();
    renderAll();
  }

  init().catch((error) => {
    if (candidateGrid) {
      candidateGrid.innerHTML = `<p class="poll-empty">${escapeHtml(error.message || "Falha ao carregar a pesquisa.")}</p>`;
    }
    setFeedback("error", "Painel indisponível.", error.message || "Não foi possível iniciar a pesquisa.");
  });
})();
