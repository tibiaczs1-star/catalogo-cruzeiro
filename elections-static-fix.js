(function () {
  const normalizeOffice = (value) =>
    String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/dep\.\s*/g, "deputado-")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

  const officeAliases = {
    governador: "governador",
    senador: "senador",
    "dep-federal": "deputado-federal",
    "deputado-federal": "deputado-federal",
    federal: "deputado-federal",
    "dep-estadual": "deputado-estadual",
    "deputado-estadual": "deputado-estadual",
    estadual: "deputado-estadual",
    municipal: "municipal",
    todos: "todos"
  };

  const userVotesStorageKey = "catalogo_election_user_votes_v1";

  const readUserVotes = () => {
    try {
      const parsed = JSON.parse(localStorage.getItem(userVotesStorageKey) || "{}");
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch (_error) {
      return {};
    }
  };

  const initStaticElectionFix = () => {
    const section = document.getElementById("eleicoes");
    const fallback = document.getElementById("election-static-fallback");
    if (!section || !fallback) return;

    const richGrid = section.querySelector(".elections-grid");
    const hasRichCards = Boolean(richGrid?.querySelector(".candidate-card[data-candidate]"));

    if (hasRichCards) {
      fallback.hidden = true;
      return;
    }

    if (fallback.dataset.staticFixReady === "1") {
      return;
    }

    fallback.dataset.staticFixReady = "1";

    const oldCandidateArea = section.querySelector("#election-candidates");
    if (oldCandidateArea && oldCandidateArea !== fallback) {
      oldCandidateArea.setAttribute("hidden", "");
      oldCandidateArea.classList.add("election-hidden-loader");
    }

    const controls = section.querySelector(".election-controls");
    const panels = Array.from(fallback.querySelectorAll("[data-static-office]"));
    const availableOfficeIds = new Set(
      Array.isArray(window.ELECTIONS_DATA?.offices)
        ? window.ELECTIONS_DATA.offices.map((office) => String(office?.id || "").trim()).filter(Boolean)
        : []
    );
    const filteredPanels = availableOfficeIds.size
      ? panels.filter((panel) => availableOfficeIds.has(String(panel.dataset.staticOffice || "").trim()))
      : panels;
    const resultTitle = section.querySelector("#election-results-title");
    const resultMeta = section.querySelector("#election-results-meta");

    controls?.querySelectorAll("button").forEach((button) => {
      const officeId =
        officeAliases[button.dataset.office || ""] ||
        officeAliases[normalizeOffice(button.dataset.office || button.textContent)] ||
        normalizeOffice(button.dataset.office || button.textContent);
      const isAvailable = !availableOfficeIds.size || availableOfficeIds.has(officeId);

      button.hidden = !isAvailable;
      button.disabled = !isAvailable;

      if (!isAvailable) {
        button.classList.remove("is-active");
        button.setAttribute("aria-selected", "false");
      }
    });

    panels.forEach((panel) => {
      const officeId = String(panel.dataset.staticOffice || "").trim();
      if (availableOfficeIds.size && !availableOfficeIds.has(officeId)) {
        panel.hidden = true;
      }
    });

    const syncStaticVoteButtons = () => {
      const userVotes = readUserVotes();

      fallback.querySelectorAll("[data-static-vote]").forEach((button) => {
        const officeId = officeAliases[button.dataset.staticVote] || officeAliases[normalizeOffice(button.dataset.staticVote)] || button.dataset.staticVote;
        const selectedCandidateId = userVotes[officeId];
        const isSelected = selectedCandidateId && selectedCandidateId === button.dataset.staticCandidate;

        button.disabled = Boolean(selectedCandidateId);
        button.textContent = selectedCandidateId
          ? isSelected
            ? "voto registrado"
            : "voto já registrado neste cargo"
          : "votar com cidade";
      });
    };

    const setOffice = (officeId) => {
      const selected = officeAliases[officeId] || officeAliases[normalizeOffice(officeId)] || "governador";
      const visiblePanels = filteredPanels.filter((panel) => panel.dataset.staticOffice === selected);

      filteredPanels.forEach((panel) => {
        panel.hidden = selected !== "todos" && panel.dataset.staticOffice !== selected;
      });

      if (resultTitle) {
        const firstPanel = visiblePanels[0] || filteredPanels[0];
        const label = firstPanel?.querySelector(".election-office-title h3")?.textContent || "cargo";
        resultTitle.textContent = selected === "todos" ? "Preferência de Leitores por Cargo" : `Preferência de Leitores - ${label}`;
      }

      if (resultMeta) {
        const selectedCandidateId = readUserVotes()[selected];
        resultMeta.textContent = selectedCandidateId
          ? "Seu voto neste cargo já foi registrado. Cidade e observações ajudam a mapear sinais eleitorais."
          : "Clique em um nome para votar com cidade obrigatória. Nome, partido e observações continuam opcionais.";
      }

      controls?.querySelectorAll("button").forEach((button) => {
        const raw = button.dataset.office || button.dataset.officeId || button.textContent;
        const id = officeAliases[raw] || officeAliases[normalizeOffice(raw)] || normalizeOffice(raw);
        button.classList.toggle("is-active", id === selected);
        button.setAttribute("aria-selected", id === selected ? "true" : "false");
      });
    };

    controls?.addEventListener("click", (event) => {
      const button = event.target.closest("button");
      if (!button) return;
      const raw = button.dataset.office || button.dataset.officeId || button.textContent;
      setOffice(raw);
    });

    fallback.addEventListener("click", (event) => {
      const button = event.target.closest("[data-static-vote]");
      if (!button) return;

      const officeId = officeAliases[button.dataset.staticVote] || officeAliases[normalizeOffice(button.dataset.staticVote)] || button.dataset.staticVote;
      const candidateId = String(button.dataset.staticCandidate || "").trim();
      const userVotes = readUserVotes();

      if (userVotes[officeId]) {
        syncStaticVoteButtons();
        setOffice(officeId);
        return;
      }

      if (!candidateId || typeof window.openElectionVoteModal !== "function") {
        if (resultMeta) {
          resultMeta.textContent = "A enquete detalhada ainda está abrindo. Tente novamente em instantes.";
        }
        return;
      }

      window.openElectionVoteModal(officeId, candidateId);
    });

    window.addEventListener("storage", (event) => {
      if (event.key === userVotesStorageKey) {
        syncStaticVoteButtons();
        setOffice(section.querySelector(".election-controls .is-active")?.dataset.office || "governador");
      }
    });

    window.addEventListener("catalogo:election-vote-updated", () => {
      syncStaticVoteButtons();
      setOffice(section.querySelector(".election-controls .is-active")?.dataset.office || "governador");
    });

    setOffice(filteredPanels[0]?.dataset.staticOffice || "governador");
    syncStaticVoteButtons();
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initStaticElectionFix);
  } else {
    initStaticElectionFix();
  }

  window.addEventListener("load", () => window.setTimeout(initStaticElectionFix, 250));
})();
