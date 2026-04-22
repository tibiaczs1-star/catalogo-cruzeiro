(function () {
  const fallbackAgents = [
    {
      id: "game-loop",
      name: "Iris Loop",
      title: "Game design e fluxo da noite",
      specialty: "loop principal, onboarding e ritmo de interação",
      lines: ["A entrada precisa ensinar sem virar aula. Primeiro a pessoa entende a porta, depois escolhe mesa."]
    },
    {
      id: "ui-hud",
      name: "Beto HUD",
      title: "Interface, HUD e leitura rápida",
      specialty: "HUD, prompts e clareza de informação",
      lines: ["Saldo, objetivo e ação precisam caber em uma olhada. HUD bom deixa jogar, não disputa a tela."]
    },
    {
      id: "pixo-fx",
      name: "Pixo FX",
      title: "Pixel art, VFX e presença visual",
      specialty: "sprites, partículas, neon e pequenas animações",
      lines: ["O próximo salto visual é sair dos bonecos provisórios e separar spritesheets animáveis por estado."]
    },
    {
      id: "otto-physics",
      name: "Otto Physics",
      title: "Movimento, colisão e sensação física",
      specialty: "controle, clique no cenário e colisão",
      lines: ["Se o personagem trava em canto invisível, a fantasia quebra. Primeiro vem movimento confiável."]
    },
    {
      id: "zed-engine",
      name: "Zed Engine",
      title: "Sistemas, eventos e estabilidade",
      specialty: "Phaser, scenes, estado e integração",
      lines: ["A migração boa é por camada: scene, HUD, estados, minigames e só depois matchmaking real."]
    },
    {
      id: "tami-qa",
      name: "Tami QA",
      title: "Playtest, QA e polimento",
      specialty: "testes de fluxo, clareza e responsividade",
      lines: ["Eu testaria entrada, clique, Enter, troca de cena, painel e mobile antes de prometer jogo final."]
    }
  ];

  const quickQuestions = [
    "Qual é o próximo passo do PubPaid?",
    "Como vão ser os sprites?",
    "Por que usar Phaser?",
    "O que falta para virar jogo real?",
    "Como melhorar a física?",
    "Como testar no mobile?"
  ];

  const rootId = "nerdTeamChat";

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function normalize(value) {
    return String(value || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  }

  function getAgents() {
    const configured = window.__OFFICE_CONFIG__?.agents;
    return Array.isArray(configured) && configured.length ? configured : fallbackAgents;
  }

  function pickAgent(message) {
    const text = normalize(message);
    const agents = getAgents();
    const byId = (id) => agents.find((agent) => agent.id === id) || fallbackAgents.find((agent) => agent.id === id);
    if (/sprite|pixel|arte|visual|neon|anim/.test(text)) return byId("pixo-fx");
    if (/avatar|roupa|acessor|personagem|skin/.test(text)) return byId("gabi-avatar") || byId("pixo-fx");
    if (/fisica|colis|movimento|andar|clique|controle/.test(text)) return byId("otto-physics");
    if (/hud|interface|botao|menu|texto|leitura/.test(text)) return byId("ui-hud");
    if (/phaser|engine|codigo|sistema|scene|estado|tecnologia/.test(text)) return byId("zed-engine");
    if (/teste|bug|mobile|responsiv|qa|validar/.test(text)) return byId("tami-qa");
    return byId("game-loop") || agents[0] || fallbackAgents[0];
  }

  function buildReply(agent, message) {
    const text = normalize(message);
    const intro = `${agent.name}: `;
    if (/sprite|pixel|arte|visual|neon|anim/.test(text)) {
      return `${intro}eu começaria pelos spritesheets do jogador, bartender, cantora e clientes. Primeiro idle e caminhada; depois acessórios e efeitos de mesa.`;
    }
    if (/phaser|engine|codigo|sistema|scene|estado|tecnologia/.test(text)) {
      return `${intro}Phaser ajuda porque separa rua, salão, HUD e minigames em scenes. Isso tira o PubPaid do arquivo gigante e deixa cada mesa crescer sem bagunçar o resto.`;
    }
    if (/fisica|colis|movimento|andar|clique|controle/.test(text)) {
      return `${intro}a prioridade é sensação de controle. Clique deve levar perto do ponto ativo, colisão precisa ser previsível e o Enter só deve aparecer quando a interação estiver justa.`;
    }
    if (/hud|interface|botao|menu|texto|leitura/.test(text)) {
      return `${intro}o HUD tem que mostrar objetivo, saldo e ação disponível sem cobrir o jogo. No modo produção eu faria ele recolhível no mobile.`;
    }
    if (/falta|proximo|pr[oó]ximo|roadmap|real/.test(text)) {
      return `${intro}o próximo passo bom é: sprites animáveis, uma mesa real em Phaser, depois carteira/matchmaking. Sem pular etapa, senão o jogo vira vitrine bonita com sistema frágil.`;
    }
    if (/mobile|teste|bug|qa|validar/.test(text)) {
      return `${intro}eu testaria desktop e mobile com screenshot, clique na porta, Enter, painel do bartender, saída do salão e leitura do HUD. Se a mão estranha, a build volta para ajuste.`;
    }
    const line = Array.isArray(agent.lines) && agent.lines.length ? agent.lines[0] : agent.specialty || agent.title;
    return `${intro}${line} Sobre o PubPaid, eu focaria em uma melhoria concreta por rodada para o jogo ficar mais vivo sem perder estabilidade.`;
  }

  function createChat() {
    if (document.getElementById(rootId)) return;
    const root = document.createElement("section");
    root.id = rootId;
    root.className = "nerd-team-chat";
    root.innerHTML = `
      <button class="nerd-team-chat-toggle" type="button" data-nerd-chat-toggle>
        Falar com agentes dev
      </button>
      <article class="nerd-team-chat-panel" data-nerd-chat-panel aria-label="Chat com agentes desenvolvedores do PubPaid">
        <header>
          <div>
            <span>Escritório Nerd</span>
            <strong>Converse sobre o jogo e a tecnologia</strong>
          </div>
          <button type="button" data-nerd-chat-close>Fechar</button>
        </header>
        <div class="nerd-team-chat-log" data-nerd-chat-log></div>
        <div class="nerd-team-chat-quick" data-nerd-chat-quick></div>
        <form class="nerd-team-chat-form" data-nerd-chat-form>
          <label>
            Pergunte para a equipe
            <textarea name="message" rows="3" placeholder="Ex.: como vocês vão melhorar os sprites do PubPaid?"></textarea>
          </label>
          <button type="submit">Perguntar</button>
        </form>
      </article>
    `;
    document.body.appendChild(root);
    return root;
  }

  const root = createChat();
  const panel = root.querySelector("[data-nerd-chat-panel]");
  const log = root.querySelector("[data-nerd-chat-log]");
  const form = root.querySelector("[data-nerd-chat-form]");
  const quick = root.querySelector("[data-nerd-chat-quick]");

  function setOpen(open) {
    root.classList.toggle("is-open", open);
  }

  function addMessage(kind, agent, message) {
    const item = document.createElement("article");
    item.className = `nerd-chat-message is-${kind}`;
    item.innerHTML =
      kind === "user"
        ? `<strong>Você</strong><p>${escapeHtml(message)}</p>`
        : `<strong>${escapeHtml(agent?.name || "Escritório Nerd")}</strong><span>${escapeHtml(agent?.title || "Agente desenvolvedor")}</span><p>${escapeHtml(message)}</p>`;
    log.appendChild(item);
    log.scrollTop = log.scrollHeight;
  }

  function ask(message) {
    const clean = String(message || "").trim();
    if (!clean) return;
    const agent = pickAgent(clean);
    addMessage("user", null, clean);
    window.setTimeout(() => addMessage("agent", agent, buildReply(agent, clean)), 180);
  }

  quick.innerHTML = quickQuestions
    .map((question) => `<button type="button" data-nerd-question="${escapeHtml(question)}">${escapeHtml(question)}</button>`)
    .join("");

  addMessage(
    "agent",
    getAgents()[0] || fallbackAgents[0],
    "Pode perguntar sobre PubPaid, sprites, Phaser, física, HUD, mobile, minigames ou tecnologia. A equipe nerd responde por especialidade."
  );

  root.querySelector("[data-nerd-chat-toggle]")?.addEventListener("click", () => setOpen(!root.classList.contains("is-open")));
  root.querySelector("[data-nerd-chat-close]")?.addEventListener("click", () => setOpen(false));
  document.addEventListener("click", (event) => {
    const trigger = event.target.closest("[data-open-nerd-team-chat]");
    if (!trigger) return;
    event.preventDefault();
    setOpen(true);
  });
  quick.addEventListener("click", (event) => {
    const button = event.target.closest("[data-nerd-question]");
    if (!button) return;
    ask(button.dataset.nerdQuestion);
  });
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(form);
    ask(data.get("message"));
    form.reset();
  });
})();
