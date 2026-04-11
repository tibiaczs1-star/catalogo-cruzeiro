"use strict";

(function () {
  function safeText(value, max = 220) {
    return String(value || "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, max);
  }

  function apiBase() {
    if (typeof window.CATALOGO_API_BASE === "string" && window.CATALOGO_API_BASE) {
      return window.CATALOGO_API_BASE.replace(/\/$/, "");
    }
    if (location.protocol === "file:") return "http://localhost:8787";
    return location.origin;
  }

  const API = apiBase();

  function patchVotingButtonsGlobal() {
    const buttons = Array.from(document.querySelectorAll("button, a")).filter((el) =>
      /simular voto|votar/i.test(el.textContent || "")
    );

    buttons.forEach((button) => {
      if (!button.hasAttribute("data-ranking-url")) {
        button.setAttribute("data-ranking-url", "https://www.politicos.org.br/Ranking");
      }

      const card = button.closest(
        "[data-candidate-card], .candidate-card, .election-card, article, .card"
      );
      if (!card || card.querySelector(".ranking-politicos-link")) return;

      const link = document.createElement("a");
      link.href = "https://www.politicos.org.br/Ranking";
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.className = "ranking-politicos-link";
      link.textContent = "ranking nacional";
      card.appendChild(link);
    });
  }

  async function loadScope(scope) {
    const url = `${API}/api/elections/acre?scope=${encodeURIComponent(scope)}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error("Falha ao buscar eleições");
    return response.json();
  }

  function findAnchor() {
    const headings = Array.from(document.querySelectorAll("h2, h3"));
    const electionHeading = headings.find((el) =>
      /elei[cç][õo]es|voto|governo|senado/i.test(el.textContent || "")
    );
    if (electionHeading) {
      return electionHeading.closest("section, article, .block, .panel, .card") || null;
    }

    return document.querySelector("main") || document.body;
  }

  function getCandidateList(payload) {
    const offices = Array.isArray(payload?.offices) ? payload.offices : [];
    return offices.flatMap((office) => {
      const top = Array.isArray(office.candidates) ? office.candidates : [];
      const extras = Array.isArray(office.alsoCurrent) ? office.alsoCurrent : [];
      return [...top, ...extras].map((candidate) => ({
        ...candidate,
        officeLabel: office.office || candidate.office || "Cargo"
      }));
    });
  }

  function patchLegacyElectionCards(candidates) {
    if (!candidates.length) return;
    const voteButtons = Array.from(document.querySelectorAll("button, a")).filter((el) =>
      /simular voto|votar/i.test(el.textContent || "")
    );

    const cards = voteButtons
      .map((button) =>
        button.closest("[data-candidate-card], .candidate-card, .election-card, article, .card")
      )
      .filter(Boolean);

    const uniqueCards = [...new Set(cards)].slice(0, candidates.length);
    uniqueCards.forEach((card, index) => {
      const candidate = candidates[index];
      if (!candidate || card.dataset.realCandidatePatched === "1") return;
      card.dataset.realCandidatePatched = "1";

      const avatar = card.querySelector(
        ".candidate-avatar, .avatar, .candidate-photo, [class*='avatar'], [class*='foto'], [class*='photo'], [class*='circle']"
      );
      if (avatar && candidate.photoUrl) {
        avatar.classList.add("real-candidate-photo");
        avatar.innerHTML = `<img src="${candidate.photoUrl}" alt="Foto de ${candidate.name}" loading="lazy">`;
      }

      const title =
        card.querySelector(".candidate-name, h3, h4, strong") ||
        card.querySelector("h2");
      if (title) title.textContent = candidate.name;

      const officeEl = card.querySelector(".candidate-office, .party, .kicker, .meta");
      if (officeEl) officeEl.textContent = `${candidate.party || ""} • ${candidate.officeLabel}`;

      const voteButton = Array.from(card.querySelectorAll("button, a")).find((el) =>
        /simular voto|votar/i.test(el.textContent || "")
      );
      if (voteButton) {
        voteButton.setAttribute("data-vote-candidate", candidate.name);
        voteButton.setAttribute("data-vote-office", candidate.officeLabel);
        voteButton.setAttribute("data-vote-scope", "acre");
        voteButton.setAttribute("data-ranking-url", candidate.rankUrl || "");
      }
    });
  }

  function createPanel() {
    const panel = document.createElement("section");
    panel.className = "election-real-panel";
    panel.innerHTML = `
      <header class="election-real-head">
        <div>
          <p class="election-real-kicker">Eleições reais • Acre</p>
          <h3>Painel eleitoral com cargos do ciclo atual</h3>
        </div>
        <div class="election-real-tabs">
          <button class="election-real-tab is-active" data-scope="federal">Federal</button>
          <button class="election-real-tab" data-scope="estadual">Estadual</button>
          <button class="election-real-tab" data-scope="municipal">Municipal</button>
        </div>
      </header>
      <p class="election-real-summary" id="electionRealSummary"></p>
      <div class="election-real-grid" id="electionRealGrid"></div>
      <footer class="election-real-foot">
        <a href="https://www.politicos.org.br/Ranking" target="_blank" rel="noopener noreferrer">
          Ver ranking nacional de políticos
        </a>
      </footer>
    `;
    return panel;
  }

  function findExistingElectionSection() {
    const sections = Array.from(document.querySelectorAll("section, article, .panel, .block"));
    return (
      sections.find((section) =>
        /elei[cç][õo]es|simular voto|federal|estadual|municipal/i.test(
          section.textContent || ""
        )
      ) || null
    );
  }

  function renderCards(container, payload) {
    const grid = container.querySelector("#electionRealGrid");
    const summary = container.querySelector("#electionRealSummary");
    if (!grid || !summary) return;

    summary.textContent =
      safeText(payload?.summary, 280) ||
      "Dados eleitorais públicos para facilitar comparação e voto consciente.";

    const offices = Array.isArray(payload?.offices) ? payload.offices : [];
    grid.innerHTML = offices
      .map((office) => {
        const candidates = Array.isArray(office.candidates) ? office.candidates : [];
        const extra = Array.isArray(office.alsoCurrent) ? office.alsoCurrent : [];

        const candidateHtml = candidates
          .map((candidate) => {
            const imagePart = candidate.photoUrl
              ? `<img src="${candidate.photoUrl}" alt="Foto de ${candidate.name}" loading="lazy">`
              : `<div class="election-real-empty-photo">Sem foto</div>`;

            return `
              <article class="election-real-candidate" data-candidate-card>
                <div class="election-real-photo">${imagePart}</div>
                <div class="election-real-text">
                  <h4 class="candidate-name">${candidate.name}</h4>
                  <p class="candidate-office">${candidate.party || ""} • ${
              office.office || candidate.office || "Cargo"
            }</p>
                  <p class="election-real-status">${candidate.status || ""}</p>
                  <div class="election-real-actions">
                    <button
                      class="election-vote-btn"
                      data-vote-candidate="${candidate.name}"
                      data-vote-office="${office.office || candidate.office || "Cargo"}"
                      data-vote-scope="${safeText(payload?.scope, 30) || "acre"}"
                      data-ranking-url="${candidate.rankUrl || "https://www.politicos.org.br/Ranking"}"
                    >
                      Simular voto
                    </button>
                    <a href="${candidate.rankUrl || "https://www.politicos.org.br/Ranking"}" target="_blank" rel="noopener noreferrer">
                      ranking nacional
                    </a>
                  </div>
                </div>
              </article>
            `;
          })
          .join("");

        const extraHtml = extra.length
          ? `
          <details class="election-real-extra">
            <summary>Também no Senado do Acre (fora da disputa neste ciclo)</summary>
            <div class="election-real-extra-list">
              ${extra
                .map(
                  (candidate) => `
                <div>
                  <strong>${candidate.name}</strong> • ${candidate.status || "mandato vigente"}
                </div>
              `
                )
                .join("")}
            </div>
          </details>
        `
          : "";

        return `
          <section class="election-real-office">
            <h4>${office.office || "Cargo"}</h4>
            <p>${office.message || ""}</p>
            ${candidateHtml || "<p>Candidaturas oficiais ainda não registradas no TSE.</p>"}
            ${extraHtml}
          </section>
        `;
      })
      .join("");

    patchLegacyElectionCards(getCandidateList(payload));
  }

  async function init() {
    const existingElectionSection = findExistingElectionSection();
    const anchor = findAnchor();
    if (!anchor && !existingElectionSection) return;

    const panel = createPanel();

    if (existingElectionSection) {
      existingElectionSection.insertAdjacentElement("afterend", panel);
    } else {
      anchor.insertAdjacentElement("afterend", panel);
    }

    const tabs = Array.from(panel.querySelectorAll(".election-real-tab"));

    async function renderScope(scope) {
      tabs.forEach((tab) => {
        const active = tab.getAttribute("data-scope") === scope;
        tab.classList.toggle("is-active", active);
      });

      const payload = await loadScope(scope);
      renderCards(panel, payload);
    }

    tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        const scope = tab.getAttribute("data-scope") || "federal";
        renderScope(scope).catch(() => {
          const summary = panel.querySelector("#electionRealSummary");
          if (summary) {
            summary.textContent =
              "Não foi possível carregar o painel eleitoral no momento.";
          }
        });
      });
    });

    renderScope("federal").catch(() => {
      const summary = panel.querySelector("#electionRealSummary");
      if (summary) {
        summary.textContent = "Painel eleitoral indisponível no momento.";
      }
    });

    patchVotingButtonsGlobal();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
