(function () {
  const FALLBACK_OFFICES = [
    {
      id: "governador",
      label: "Governador",
      scope: "Executivo estadual",
      candidates: [
        {
          id: "gladson-cameli",
          name: "Gladson Cameli",
          party: "PP",
          summary: "Nome em evidência no debate estadual e acompanhado pela cobertura política local.",
          proposals: ["gestão estadual", "infraestrutura", "serviços públicos"]
        },
        {
          id: "mailza-assis",
          name: "Mailza Assis",
          party: "PP",
          summary: "Nome em evidência no Executivo estadual e nas agendas de governo.",
          proposals: ["assistência social", "obras", "interiorização"]
        },
        {
          id: "alan-rick",
          name: "Alan Rick",
          party: "UNIÃO",
          summary: "Nome federal com presença frequente em debates estaduais.",
          proposals: ["saúde", "segurança", "recursos federais"]
        },
        {
          id: "jorge-viana",
          name: "Jorge Viana",
          party: "PT",
          summary: "Nome histórico da política acreana, monitorado em cenários estaduais.",
          proposals: ["desenvolvimento", "meio ambiente", "política social"]
        }
      ]
    },
    {
      id: "senador",
      label: "Senador",
      scope: "Representação federal",
      candidates: [
        {
          id: "marcio-bittar",
          name: "Márcio Bittar",
          party: "UNIÃO",
          summary: "Nome em atividade no Senado e acompanhado por sua influência em Brasília.",
          proposals: ["orçamento", "infraestrutura", "Amazônia"]
        },
        {
          id: "sergio-petecao",
          name: "Sérgio Petecão",
          party: "PSD",
          summary: "Nome tradicional da política acreana com atuação federal.",
          proposals: ["municípios", "emendas", "esporte"]
        },
        {
          id: "jessica-sales",
          name: "Jéssica Sales",
          party: "MDB",
          summary: "Nome com base política no Juruá e presença em pautas de saúde e interior.",
          proposals: ["Juruá", "saúde", "famílias"]
        },
        {
          id: "mara-rocha",
          name: "Mara Rocha",
          party: "MDB",
          summary: "Nome citado em cenários eleitorais e debates de oposição.",
          proposals: ["segurança", "fiscalização", "família"]
        }
      ]
    },
    {
      id: "deputado-federal",
      label: "Deputado Federal",
      scope: "Câmara dos Deputados",
      candidates: [
        {
          id: "zezinho-barbary",
          name: "Zezinho Barbary",
          party: "PP",
          summary: "Nome regional acompanhado em articulações para representação federal.",
          proposals: ["interior", "produção rural", "infraestrutura"]
        },
        {
          id: "socorro-neri",
          name: "Socorro Neri",
          party: "PP",
          summary: "Nome com atuação federal e histórico de gestão pública.",
          proposals: ["educação", "cidades", "gestão"]
        },
        {
          id: "antonia-lucia",
          name: "Antônia Lúcia",
          party: "Republicanos",
          summary: "Nome com presença em pautas conservadoras e representação federal.",
          proposals: ["família", "assistência", "valores"]
        },
        {
          id: "gerlen-diniz",
          name: "Gerlen Diniz",
          party: "PP",
          summary: "Nome parlamentar monitorado em pautas estaduais e federais.",
          proposals: ["segurança", "interior", "fiscalização"]
        }
      ]
    },
    {
      id: "deputado-estadual",
      label: "Deputado Estadual",
      scope: "Assembleia Legislativa",
      candidates: [
        {
          id: "nicolau-junior",
          name: "Nicolau Júnior",
          party: "PP",
          summary: "Nome de destaque na Aleac, com influência em articulações estaduais.",
          proposals: ["legislativo", "Juruá", "municípios"]
        },
        {
          id: "pedro-longo",
          name: "Pedro Longo",
          party: "PDT",
          summary: "Nome acompanhado em debates de infraestrutura e legislação estadual.",
          proposals: ["obras", "direitos", "interior"]
        },
        {
          id: "michelle-melo",
          name: "Michelle Melo",
          party: "PDT",
          summary: "Nome presente em pautas de saúde e fiscalização pública.",
          proposals: ["saúde", "mulheres", "serviço público"]
        },
        {
          id: "edvaldo-magalhaes",
          name: "Edvaldo Magalhães",
          party: "PCdoB",
          summary: "Nome experiente no parlamento estadual e no debate político acreano.",
          proposals: ["trabalhadores", "fiscalização", "serviço público"]
        }
      ]
    }
  ];

  const slugify = (value) =>
    String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

  const escapeHtml = (value) =>
    String(value || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");

  const getElectionData = () => {
    const raw = window.ELECTIONS_DATA;
    const offices = Array.isArray(raw?.offices) && raw.offices.length ? raw.offices : FALLBACK_OFFICES;

    return offices.map((office) => {
      const label = office.label || office.name || office.title || office.office || "Cargo";
      const id = office.id || office.slug || slugify(label);
      const candidates = Array.isArray(office.candidates)
        ? office.candidates
        : Array.isArray(office.people)
          ? office.people
          : Array.isArray(office.options)
            ? office.options
            : [];

      return {
        id,
        label,
        scope: office.scope || office.description || office.level || "Cargo em monitoramento",
        candidates: candidates.map((candidate) => {
          const name = candidate.name || candidate.nome || candidate.title || "Nome em monitoramento";
          return {
            id: candidate.id || candidate.slug || slugify(name),
            name,
            party: candidate.party || candidate.partido || candidate.partyLabel || "partido a confirmar",
            imageUrl: candidate.imageUrl || candidate.photoUrl || candidate.avatarUrl || "",
            sourceUrl: candidate.sourceUrl || candidate.imageSourceUrl || candidate.url || "",
            summary:
              candidate.summary ||
              candidate.bio ||
              candidate.description ||
              candidate.context ||
              "Nome listado para acompanhamento editorial e pesquisa informal de leitores.",
            proposals:
              candidate.proposals ||
              candidate.priorities ||
              candidate.tags ||
              candidate.focus ||
              []
          };
        })
      };
    });
  };

  const getContainer = (section) => {
    const existing =
      section.querySelector("#election-candidates") ||
      section.querySelector("[data-election-candidates]") ||
      section.querySelector(".candidate-grid") ||
      section.querySelector(".election-candidates");

    if (existing) {
      existing.id = "election-candidates";
      existing.classList.add("election-office-grid");
      return existing;
    }

    const container = document.createElement("div");
    container.id = "election-candidates";
    container.className = "election-office-grid";

    const controls = section.querySelector(".election-controls");
    if (controls) {
      controls.insertAdjacentElement("afterend", container);
    } else {
      section.appendChild(container);
    }

    return container;
  };

  const getControls = (section, offices) => {
    let controls = section.querySelector(".election-controls");
    if (!controls) {
      controls = document.createElement("div");
      controls.className = "election-controls reveal";
      section.querySelector(".section-heading")?.insertAdjacentElement("afterend", controls);
    }

    controls.innerHTML = offices
      .map(
        (office) =>
          `<button class="election-office-button" type="button" data-office-id="${escapeHtml(office.id)}">${escapeHtml(office.label)}</button>`
      )
      .join("");

    return controls;
  };

  const getStoredVotes = () => {
    try {
      return JSON.parse(localStorage.getItem("catalogo_election_votes_local_v2") || "{}");
    } catch {
      return {};
    }
  };

  const saveStoredVotes = (votes) => {
    try {
      localStorage.setItem("catalogo_election_votes_local_v2", JSON.stringify(votes));
    } catch {
      // Local storage can be blocked in private mode; rendering still works.
    }
  };

  const getVotedOffice = (officeId) => {
    try {
      return localStorage.getItem(`catalogo_election_vote_${officeId}`);
    } catch {
      return null;
    }
  };

  const setVotedOffice = (officeId, candidateId) => {
    try {
      localStorage.setItem(`catalogo_election_vote_${officeId}`, candidateId);
    } catch {
      // Voting remains visual if storage is unavailable.
    }
  };

  const renderResults = (section, offices, selectedOfficeId) => {
    const title = section.querySelector("#election-results-title");
    const meta = section.querySelector("#election-results-meta");
    const bars = section.querySelector("#election-results-bars");
    const votes = getStoredVotes();
    const visibleOffices = offices.filter((office) => office.id === selectedOfficeId);
    const candidates = visibleOffices.flatMap((office) =>
      office.candidates.map((candidate) => ({
        ...candidate,
        officeLabel: office.label,
        count: Number(votes[office.id]?.[candidate.id] || 0)
      }))
    );
    const total = candidates.reduce((sum, candidate) => sum + candidate.count, 0);

    if (title) title.textContent = `Preferência para ${visibleOffices[0]?.label || "cargo"}`;
    if (meta) meta.textContent = total ? `${total} voto(s) local(is) neste recorte.` : "Sem votos locais registrados ainda.";
    if (!bars) return;

    bars.innerHTML = candidates
      .slice()
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
      .map((candidate) => {
        const percent = total ? Math.round((candidate.count / total) * 100) : 0;
        return `
          <div class="result-bar election-result-bar">
            <div class="result-label">
              <strong>${escapeHtml(candidate.name)}</strong>
              <span>${escapeHtml(candidate.officeLabel)} • ${percent}%</span>
            </div>
            <div class="result-track"><span style="width:${percent}%"></span></div>
          </div>
        `;
      })
      .join("");
  };

  const renderCandidates = (section, offices, selectedOfficeId) => {
    const container = getContainer(section);
    const visibleOffices = offices.filter((office) => office.id === selectedOfficeId);

    container.innerHTML = visibleOffices
      .map((office) => {
        const votedCandidate = getVotedOffice(office.id);
        const candidateCards = office.candidates
          .map((candidate) => {
            const proposals = Array.isArray(candidate.proposals) ? candidate.proposals.slice(0, 3) : [];
            const voted = votedCandidate === candidate.id;
            const disabled = Boolean(votedCandidate);
            const initials =
              String(candidate.name || "")
                .split(/\s+/)
                .filter(Boolean)
                .slice(0, 2)
                .map((part) => part[0])
                .join("")
                .toUpperCase() || "?";
            const safeImageUrl = escapeHtml(String(candidate.imageUrl || ""));

            return `
              <article class="election-candidate-card">
                <div class="candidate-avatar${safeImageUrl ? " has-photo" : ""}"${safeImageUrl ? ` style="--candidate-photo:url('${safeImageUrl}');"` : ""}>${safeImageUrl ? "" : initials}</div>
                <div class="election-candidate-top">
                  <span>${escapeHtml(candidate.party)}</span>
                  <b>pré-candidato</b>
                </div>
                <h4>${escapeHtml(candidate.name)}</h4>
                <p>${escapeHtml(candidate.summary)}</p>
                <div class="election-candidate-tags">
                  ${proposals.map((proposal) => `<span>${escapeHtml(proposal)}</span>`).join("")}
                </div>
                <button
                  class="election-vote-button"
                  type="button"
                  data-election-vote
                  data-office-id="${escapeHtml(office.id)}"
                  data-candidate-id="${escapeHtml(candidate.id)}"
                  ${disabled ? "disabled" : ""}
                >
                  ${voted ? "voto registrado" : disabled ? "voto já registrado neste cargo" : "votar neste cargo"}
                </button>
              </article>
            `;
          })
          .join("");

        return `
          <article class="election-office-panel" data-rendered-office="${escapeHtml(office.id)}">
            <header class="election-office-title">
              <div>
                <span>cargo</span>
                <h3>${escapeHtml(office.label)}</h3>
              </div>
              <p>${escapeHtml(office.scope)}</p>
            </header>
            <div class="election-candidate-grid">${candidateCards}</div>
          </article>
        `;
      })
      .join("");

    renderResults(section, offices, selectedOfficeId);
  };

  const initElectionOfficeRender = () => {
    const section = document.getElementById("eleicoes");
    if (!section) return;

    const offices = getElectionData().filter((office) => office.candidates.length);
    if (!offices.length) return;

    const controls = getControls(section, offices);
    let selectedOfficeId = section.dataset.selectedElectionOffice || offices[0]?.id || "governador";

    const setActive = () => {
      controls.querySelectorAll("[data-office-id]").forEach((button) => {
        button.classList.toggle("active", button.dataset.officeId === selectedOfficeId);
      });
    };

    controls.onclick = (event) => {
      const button = event.target.closest("[data-office-id]");
      if (!button) return;
      selectedOfficeId = button.dataset.officeId || offices[0]?.id || "governador";
      section.dataset.selectedElectionOffice = selectedOfficeId;
      setActive();
      renderCandidates(section, offices, selectedOfficeId);
    };

    section.onclick = (event) => {
      const button = event.target.closest("[data-election-vote]");
      if (!button) return;

      const officeId = button.dataset.officeId;
      const candidateId = button.dataset.candidateId;
      if (!officeId || !candidateId || getVotedOffice(officeId)) return;

      const votes = getStoredVotes();
      votes[officeId] = votes[officeId] || {};
      votes[officeId][candidateId] = Number(votes[officeId][candidateId] || 0) + 1;
      saveStoredVotes(votes);
      setVotedOffice(officeId, candidateId);
      renderCandidates(section, offices, selectedOfficeId);
    };

    setActive();
    renderCandidates(section, offices, selectedOfficeId);
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initElectionOfficeRender);
  } else {
    initElectionOfficeRender();
  }

  window.addEventListener("load", () => {
    window.setTimeout(initElectionOfficeRender, 300);
  });
})();
