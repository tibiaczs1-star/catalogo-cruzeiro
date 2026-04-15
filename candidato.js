(function () {
  const container = document.getElementById("candidate-portal");

  if (!container) {
    return;
  }

  const escapeHtml = (value) =>
    String(value || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");

  const normalize = (value) =>
    String(value || "")
      .trim()
      .toLowerCase()
      .replace(/^\/+|\/+$/g, "")
      .replace(/[_\s]+/g, "-")
      .replace(/-+/g, "-");

  const buildCandidateUrl = (officeId, candidateId) =>
    `./candidato.html?office=${encodeURIComponent(officeId)}&candidate=${encodeURIComponent(candidateId)}`;

  const getCandidateInitials = (name = "") =>
    String(name || "")
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "?";

  const formatMetricValue = (value) => {
    const numeric = Number(value || 0);
    return Number.isFinite(numeric) ? Math.max(0, Math.min(10, numeric)) : 0;
  };

  const buildLinks = (items = []) => {
    if (!Array.isArray(items) || !items.length) {
      return `<article class="candidate-portal-empty">Nenhum link público foi vinculado ainda.</article>`;
    }

    return `
      <div class="candidate-portal-links">
        ${items
          .map(
            (item) => `
              <a href="${escapeHtml(item.url || "#")}" target="_blank" rel="noreferrer">
                <strong>${escapeHtml(item.label || "Abrir fonte")}</strong>
                <span>${escapeHtml(item.url || "")}</span>
              </a>
            `
          )
          .join("")}
      </div>
    `;
  };

  const buildTimeline = (items = []) => {
    if (!Array.isArray(items) || !items.length) {
      return `<article class="candidate-portal-empty">Linha do tempo em atualização.</article>`;
    }

    return `
      <div class="candidate-timeline">
        ${items
          .map(
            (item) => `
              <article class="candidate-timeline-item">
                <strong>${escapeHtml(item.period || "Período")}</strong>
                <p><strong>${escapeHtml(item.title || "Marco")}</strong>${escapeHtml(item.detail ? ` ${item.detail}` : "")}</p>
              </article>
            `
          )
          .join("")}
      </div>
    `;
  };

  const renderNotFound = (offices = []) => {
    const available = offices
      .flatMap((office) =>
        (office.candidates || []).map((candidate) => ({
          office,
          candidate
        }))
      )
      .slice(0, 8);

    container.innerHTML = `
      <article class="candidate-portal-empty">
        <strong>Candidato não encontrado.</strong>
        <p>Abra um nome disponível abaixo para ver histórico, posição política e pontuação.</p>
      </article>
      <section class="candidate-portal-section">
        <h2>Nomes disponíveis</h2>
        <div class="candidate-portal-links">
          ${available
            .map(
              ({ office, candidate }) => `
                <a href="${buildCandidateUrl(office.id, candidate.id)}">
                  <strong>${escapeHtml(candidate.name || "Nome em monitoramento")}</strong>
                  <span>${escapeHtml(office.label || "Cargo")} • ${escapeHtml(candidate.party || "partido em atualização")}</span>
                </a>
              `
            )
            .join("")}
        </div>
      </section>
    `;
  };

  const offices = Array.isArray(window.ELECTIONS_DATA?.offices) ? window.ELECTIONS_DATA.offices : [];
  const search = new URLSearchParams(window.location.search);
  const officeId = normalize(search.get("office"));
  const candidateId = normalize(search.get("candidate"));
  const office =
    offices.find((item) => normalize(item.id || item.label) === officeId) ||
    offices.find((item) =>
      (item.candidates || []).some((candidate) => normalize(candidate.id || candidate.name) === candidateId)
    );
  const candidate = office?.candidates?.find(
    (item) => normalize(item.id || item.name) === candidateId
  );

  if (!office || !candidate) {
    renderNotFound(offices);
    return;
  }

  const score = candidate.score || {};
  const summary =
    candidate.historySummary ||
    candidate.summary ||
    "Perfil em atualização com base no acompanhamento editorial do Catalogo CZS.";
  const currentPosition =
    candidate.currentPosition || `${candidate.name} segue monitorado no debate do cargo ${office.label}.`;
  const politicalPosition =
    candidate.politicalPosition ||
    candidate.politicalPositionShort ||
    "Leitura editorial em atualização.";
  const achievements = Array.isArray(candidate.achievements) && candidate.achievements.length
    ? candidate.achievements
    : Array.isArray(candidate.proposals) && candidate.proposals.length
      ? candidate.proposals
      : ["Entregas e focos públicos em atualização."];
  const metrics = [
    { label: "Trajetória", value: formatMetricValue(score.trajectory) },
    { label: "Institucional", value: formatMetricValue(score.institution) },
    { label: "Realizações", value: formatMetricValue(score.deliveries) },
    { label: "Visibilidade", value: formatMetricValue(score.visibility) }
  ];

  container.innerHTML = `
    <article class="candidate-portal-hero">
      <div class="candidate-portal-photo" id="candidate-portal-photo">${escapeHtml(getCandidateInitials(candidate.name))}</div>
      <div class="candidate-portal-copy">
        <p class="candidate-portal-kicker">portal do candidato</p>
        <h1>${escapeHtml(candidate.name)}</h1>
        <div class="candidate-portal-tags">
          <div class="candidate-portal-tag">${escapeHtml(office.label)} • ${escapeHtml(candidate.party || "partido em atualização")}</div>
          <div class="candidate-portal-tag">${escapeHtml(candidate.role || "nome em monitoramento")}</div>
          <div class="candidate-portal-tag">Pontuação editorial: ${escapeHtml(String(score.total || "em análise"))}</div>
        </div>
        <p>${escapeHtml(currentPosition)}</p>
        <p>${escapeHtml(summary)}</p>
      </div>
    </article>

    <div class="candidate-portal-grid">
      <div class="candidate-portal-main">
        <section class="candidate-portal-section">
          <h2>Resumo histórico</h2>
          <p>${escapeHtml(summary)}</p>
        </section>

        <section class="candidate-portal-section">
          <h2>Posição política</h2>
          <p>${escapeHtml(politicalPosition)}</p>
        </section>

        <section class="candidate-portal-section">
          <h2>Realizações e focos</h2>
          <ul>
            ${achievements.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
          </ul>
        </section>

        <section class="candidate-portal-section">
          <h2>Linha do tempo</h2>
          ${buildTimeline(candidate.timeline || [])}
        </section>
      </div>

      <aside class="candidate-portal-side">
        <section class="candidate-score-card">
          <h2>Pontuação editorial</h2>
          <p>
            Nota sintética do Catalogo CZS com base em trajetória pública documentada,
            presença institucional, entregas registradas e peso atual no debate.
          </p>
          <div class="candidate-score-grid">
            ${metrics
              .map(
                (metric) => `
                  <article class="candidate-score-metric">
                    <header>
                      <span>${escapeHtml(metric.label)}</span>
                      <strong>${metric.value}/10</strong>
                    </header>
                    <div class="candidate-score-bar"><span style="width:${metric.value * 10}%"></span></div>
                  </article>
                `
              )
              .join("")}
          </div>
          <p><strong>Total:</strong> ${escapeHtml(String(score.total || "em análise"))}</p>
          <p>${escapeHtml(score.note || "Pontuação editorial em atualização.")}</p>
        </section>

        <section class="candidate-portal-section">
          <h2>Acesso ao histórico</h2>
          ${buildLinks(candidate.portalLinks || [])}
        </section>

        <section class="candidate-portal-section">
          <h2>Fontes usadas</h2>
          ${buildLinks(candidate.sources || [])}
        </section>
      </aside>
    </div>
  `;

  document.title = `${candidate.name} | Portal do Candidato | Catalogo Cruzeiro do Sul`;

  const photoNode = document.getElementById("candidate-portal-photo");
  const photoUrl = String(candidate.imageUrl || "").trim().replace(/'/g, "%27");
  if (photoNode && photoUrl) {
    photoNode.style.setProperty("--candidate-photo", `url('${photoUrl}')`);
  }
})();
