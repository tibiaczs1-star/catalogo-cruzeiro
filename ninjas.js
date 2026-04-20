(function () {
  "use strict";

  const RESUME_TEMPLATES = {
    "primeiro-emprego": {
      objective:
        "Busco minha primeira oportunidade para aprender rapido, ajudar a equipe e construir experiencia real com responsabilidade.",
      summary:
        "Pessoa organizada, comunicativa e com vontade de crescer. Tenho facilidade para aprender, seguir orientacoes, lidar com publico e manter rotina com compromisso.",
      skills: ["comunicacao", "pontualidade", "aprendizado rapido", "organizacao", "atendimento"],
      suggestions: [
        "Liste projeto escolar, igreja, evento, venda informal ou ajuda em negocio da familia como experiencia.",
        "Use um objetivo direto e evite frase vaga demais.",
        "Se ainda nao tem portfolio, monte uma pasta simples no Drive com exemplos do que ja fez."
      ]
    },
    atendimento: {
      objective:
        "Busco atuar com atendimento e apoio ao cliente, ajudando na organizacao do fluxo, na escuta do publico e na boa experiencia de quem chega.",
      summary:
        "Tenho perfil calmo, boa comunicacao e facilidade para atender pessoas com respeito, clareza e atencao aos detalhes.",
      skills: ["atendimento ao publico", "escuta ativa", "educacao no contato", "organizacao", "agilidade"],
      suggestions: [
        "Mostre situacoes reais em que voce falou com pessoas, organizou fila, respondeu mensagens ou ajudou clientes.",
        "Se ja vendeu algo, isso tambem conta como atendimento."
      ]
    },
    vendas: {
      objective:
        "Quero oportunidade em vendas e apoio comercial para ajudar no contato com clientes, apresentacao de produtos e alcance de metas.",
      summary:
        "Perfil comunicativo, com energia para abordagem, boa leitura de publico e interesse em aprender tecnicas de venda e fechamento.",
      skills: ["abordagem", "argumentacao", "comunicacao", "pos-venda", "metas"],
      suggestions: [
        "Inclua qualquer experiencia com caixa, feira, revenda, loja, afiliado ou vendas pelo WhatsApp.",
        "Metas pequenas e resultados simples ja ajudam a dar credibilidade."
      ]
    },
    administrativo: {
      objective:
        "Procuro vaga de apoio administrativo para ajudar com rotinas, documentos, planilhas, recepcao e organizacao diaria.",
      summary:
        "Tenho perfil detalhista, organizado e confiavel, com interesse em aprender processos, manter fluxo de informacoes e apoiar a equipe.",
      skills: ["organizacao", "documentos", "planilhas", "rotina de escritorio", "responsabilidade"],
      suggestions: [
        "Cursos de informatica, digitacao e pacote Office ajudam bastante nessa area.",
        "Experiencias com cadastro, agenda ou anotacoes entram como repertorio administrativo."
      ]
    },
    digital: {
      objective:
        "Busco atuar com criacao digital, social media ou apoio visual, ajudando com ideias, posts, organizacao de conteudo e ritmo de publicacao.",
      summary:
        "Perfil criativo, conectado e com vontade de transformar ideias em pecas, posts, videos curtos ou materiais digitais mais organizados.",
      skills: ["Canva", "edicao basica", "social media", "criatividade", "conteudo"],
      suggestions: [
        "Mesmo com portfolio simples, junte 3 exemplos de artes, posts, videos ou copys.",
        "Explique as ferramentas que voce ja usa de verdade."
      ]
    }
  };

  const state = {
    currentTemplate: "primeiro-emprego",
    requestTxid: "",
    profileTxid: "",
    profilePlan: "gratis",
    profileAmount: 0,
    opportunities: [],
    activeOpportunityFilter: "todos"
  };
  const PORTAL_WHATSAPP_NUMBER = "5568992269296";

  function $(selector, root = document) {
    return root.querySelector(selector);
  }

  function $$(selector, root = document) {
    return Array.from(root.querySelectorAll(selector));
  }

  function normalize(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();
  }

  function escapeHtml(value) {
    return String(value || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function openPortalWhatsApp(lines) {
    const text = lines.filter(Boolean).join("\n");
    const url = `https://wa.me/${PORTAL_WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
    const opened = window.open(url, "_blank", "noopener,noreferrer");
    if (!opened) {
      location.href = url;
    }
  }

  function splitList(value) {
    return String(value || "")
      .split(/\r?\n|,/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  function buildTxid(prefix) {
    return `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`
      .replace(/[^A-Za-z0-9]/g, "")
      .toUpperCase()
      .slice(0, 25);
  }

  async function requestJson(url, options = {}) {
    const response = await fetch(url, options);
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload?.error || payload?.message || "Falha ao processar a solicitação.");
    }
    return payload;
  }

  async function copyText(value) {
    const text = String(value || "");
    if (!text) return false;

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch (_error) {
      // fallback below
    }

    const helper = document.createElement("textarea");
    helper.value = text;
    helper.setAttribute("readonly", "readonly");
    helper.style.position = "fixed";
    helper.style.opacity = "0";
    document.body.appendChild(helper);
    helper.select();
    const copied = document.execCommand("copy");
    helper.remove();
    return copied;
  }

  function getPaymentNodes(card) {
    return {
      key: $("[data-pix-key]", card),
      txid: $("[data-pix-txid]", card),
      qr: $("[data-pix-qr]", card),
      code: $("[data-pix-code]", card),
      note: $("[data-payment-note]", card),
      copyButton: $("[data-copy-pix]", card),
      refreshButton: $("[data-refresh-pix]", card)
    };
  }

  function setPaymentCopy(card, title, body) {
    const titleNode = $("h3", card);
    const bodyNode = $("p:not(.eyebrow):not(.ninjas-payment-note)", card);
    if (titleNode) titleNode.textContent = title;
    if (bodyNode) bodyNode.textContent = body;
  }

  function renderFreeProfileCard() {
    const card = $('[data-payment-card="profile"]');
    if (!card) return;
    const nodes = getPaymentNodes(card);
    setPaymentCopy(
      card,
      "Plano gratuito ativo",
      "Ao escolher destaque ou pacote de creditos, o QR code sera exibido neste painel."
    );
    nodes.key.textContent = "oculta no QR";
    nodes.txid.textContent = "sem pagamento";
    nodes.qr.innerHTML = "<p>O plano gratuito nao precisa de QR code.</p>";
    nodes.code.value = "";
    nodes.note.textContent = "Plano gratuito nao exige pagamento. Planos pagos usam QR Code e confirmacao manual.";
    $("#ninjas-profile-amount").value = "0";
    $("#ninjas-profile-txid-input").value = "";
  }

  async function renderPixCard(kind, amount, txid, description) {
    const card = $(`[data-payment-card="${kind}"]`);
    if (!card) return;
    const nodes = getPaymentNodes(card);

    nodes.qr.innerHTML = "<p>Gerando QR code...</p>";

    try {
      const url = new URL("/api/ninjas/pix", window.location.origin);
      url.searchParams.set("amount", String(amount));
      url.searchParams.set("txid", txid);
      url.searchParams.set("description", description);
      const payload = await requestJson(url.toString(), { headers: { Accept: "application/json" } });

      nodes.key.textContent = "oculta no QR";
      nodes.txid.textContent = payload.txid || "";
      nodes.qr.innerHTML = payload.qrSvg || "<p>QR indisponivel no momento.</p>";
      nodes.code.value = "";
      nodes.note.textContent =
        payload.confirmationMode === "manual"
          ? "Confirmacao manual: use o QR Code, guarde a referencia e o comprovante."
          : "Pagamento pronto.";

      if (kind === "request") {
        state.requestTxid = payload.txid || txid;
        $("#ninjas-request-txid-input").value = state.requestTxid;
      }

      if (kind === "profile") {
        state.profileTxid = payload.txid || txid;
        $("#ninjas-profile-txid-input").value = state.profileTxid;
        $("#ninjas-profile-amount").value = String(payload.amount || amount || 0);
      }
    } catch (error) {
      nodes.qr.innerHTML = `<p>${escapeHtml(error.message)}</p>`;
      nodes.note.textContent = "Nao foi possivel gerar o pagamento agora. Tente atualizar o codigo.";
    }
  }

  function getActiveProfilePlan() {
    return $('input[name="plan"]:checked', $("#ninjas-profile-form"))?.value || "gratis";
  }

  function getActivePackageButton() {
    return $(".ninjas-package-button.is-active");
  }

  async function syncProfilePayment(forceNewTxid = false) {
    const plan = getActiveProfilePlan();
    const packageRow = $("#ninjas-package-row");
    state.profilePlan = plan;

    if (plan === "gratis") {
      if (packageRow) packageRow.hidden = true;
      state.profileAmount = 0;
      renderFreeProfileCard();
      return;
    }

    if (packageRow) packageRow.hidden = plan !== "creditos";

    state.profileAmount =
      plan === "destaque" ? 5 : Number(getActivePackageButton()?.dataset.packageAmount || 20);

    if (forceNewTxid || !state.profileTxid) {
      state.profileTxid = buildTxid(plan === "destaque" ? "DEST" : "CRED");
    }

    const card = $('[data-payment-card="profile"]');
    if (card) {
      const title = plan === "destaque" ? "Destaque profissional por R$ 5" : "Pacote de creditos para curriculos";
      const body =
        plan === "destaque"
          ? "Esse codigo libera o destaque visual do perfil assim que o Pix for conferido."
          : "Escolha o pacote e use esse QR code para liberar os creditos do seu perfil.";
      setPaymentCopy(card, title, body);
    }

    await renderPixCard(
      "profile",
      state.profileAmount,
      state.profileTxid,
      plan === "destaque" ? "Destaque Ninjas Cruzeiro" : "Creditos Ninjas Cruzeiro"
    );
  }

  function renderSuggestions() {
    const list = $("#ninjas-resume-suggestions");
    if (!list) return;

    const template = RESUME_TEMPLATES[state.currentTemplate] || RESUME_TEMPLATES["primeiro-emprego"];
    const suggestions = [...template.suggestions];
    const firstJob = $("#resume-first-job")?.checked;

    if (firstJob) {
      suggestions.unshift("Se e sua primeira vaga, destaque vontade de aprender, pontualidade e responsabilidade.");
    }

    if (!$("#resume-email")?.value.trim()) {
      suggestions.push("Adicione um email simples e profissional para nao perder retorno.");
    }

    if (normalize(state.currentTemplate) === "digital" && !$("#resume-portfolio")?.value.trim()) {
      suggestions.push("Monte um portfolio basico com 3 exemplos e um link facil de abrir.");
    }

    list.innerHTML = suggestions.slice(0, 6).map((item) => `<li>${escapeHtml(item)}</li>`).join("");
  }

  function renderPreview() {
    const name = $("#resume-name")?.value.trim() || "Nome do profissional";
    const area = $("#resume-area")?.value.trim() || "Area principal";
    const city = $("#resume-city")?.value.trim() || "Cruzeiro do Sul - AC";
    const phone = $("#resume-phone")?.value.trim();
    const email = $("#resume-email")?.value.trim();
    const objective = $("#resume-objective")?.value.trim();
    const summary = $("#resume-summary")?.value.trim();
    const skills = splitList($("#resume-skills")?.value || "").slice(0, 8);
    const experience = $("#resume-experience")?.value.trim();
    const education = $("#resume-education")?.value.trim();
    const firstJob = $("#resume-first-job")?.checked;

    $("#preview-name").textContent = name;
    $("#preview-role").textContent = area;
    $("#preview-contact").textContent = [city, phone, email].filter(Boolean).join(" · ");
    $("#preview-objective").textContent =
      objective ||
      (firstJob
        ? `Buscar a primeira oportunidade em ${area.toLowerCase()} para aprender rapido e crescer com a equipe.`
        : `Atuar em ${area.toLowerCase()} com foco em resultado, organizacao e boa execucao.`);
    $("#preview-summary").textContent =
      summary ||
      (firstJob
        ? `${name} esta em fase de entrada no mercado e quer transformar rotina, estudo e projetos em experiencia real.`
        : `${name} quer consolidar sua trajetoria em ${area.toLowerCase()} com presenca, responsabilidade e entrega.`);
    $("#preview-experience").textContent =
      experience || "Experiencias, projetos, bicos, voluntariado ou atividades relevantes entram aqui.";
    $("#preview-education").textContent =
      education || "Formacao escolar, faculdade, cursos livres, oficinas e estudos em andamento entram aqui.";
    $("#preview-skills").innerHTML = (skills.length ? skills : ["comunicacao", "organizacao", "aprendizado rapido"])
      .map((item) => `<li>${escapeHtml(item)}</li>`)
      .join("");

    renderSuggestions();
  }

  function applyTemplate(templateId) {
    const key = Object.prototype.hasOwnProperty.call(RESUME_TEMPLATES, templateId)
      ? templateId
      : "primeiro-emprego";
    const template = RESUME_TEMPLATES[key];
    state.currentTemplate = key;

    $$(".ninjas-template-button").forEach((button) => {
      button.classList.toggle("is-active", button.dataset.resumeTemplate === key);
    });

    $("#resume-objective").value = template.objective;
    $("#resume-summary").value = template.summary;
    $("#resume-skills").value = template.skills.join("\n");
    renderPreview();
  }

  function opportunityCardHtml(item) {
    return `
      <article class="ninjas-opportunity-card" data-kind="${escapeHtml(item.kind)}">
        <header>
          <span class="badge">${escapeHtml(item.badge || item.kind)}</span>
          <strong>${escapeHtml(item.title)}</strong>
        </header>
        <p>${escapeHtml(item.summary || "")}</p>
        <div class="ninjas-opportunity-meta">
          <div>
            <span>Local</span>
            <strong>${escapeHtml(item.city || "Cruzeiro do Sul")}</strong>
          </div>
          <div>
            <span>Status</span>
            <strong>${escapeHtml(item.status || "acompanhar fonte")}</strong>
          </div>
          <div>
            <span>Data base</span>
            <strong>${escapeHtml(item.publishedLabel || "Sem data")}</strong>
          </div>
          <div>
            <span>Prazo</span>
            <strong>${escapeHtml(item.deadlineLabel || "Sem prazo divulgado")}</strong>
          </div>
        </div>
        <a class="outline-button" href="${escapeHtml(item.sourceUrl || "#")}" target="_blank" rel="noreferrer">
          Abrir fonte oficial
        </a>
      </article>
    `;
  }

  function renderOpportunities() {
    const grid = $("#ninjas-opportunity-grid");
    if (!grid) return;

    const items = state.opportunities.filter((item) => {
      return state.activeOpportunityFilter === "todos" || item.kind === state.activeOpportunityFilter;
    });

    grid.innerHTML = items.length
      ? items.map(opportunityCardHtml).join("")
      : "<p>Nenhuma oportunidade encontrada para esse filtro agora.</p>";
  }

  async function loadOpportunities() {
    const updated = $("#ninjas-opportunities-updated");
    try {
      const payload = await requestJson("/api/ninjas/opportunities", { headers: { Accept: "application/json" } });
      state.opportunities = Array.isArray(payload.items) ? payload.items : [];
      if (updated) {
        updated.textContent = `Pesquisa atualizada em ${payload.updatedLabel || "data recente"}.`;
      }
      renderOpportunities();
    } catch (error) {
      if (updated) {
        updated.textContent = error.message;
      }
    }
  }

  function initOpportunityFilters() {
    $$(".ninjas-filter-button").forEach((button) => {
      button.addEventListener("click", () => {
        state.activeOpportunityFilter = button.dataset.ninjasFilter || "todos";
        $$(".ninjas-filter-button").forEach((chip) => chip.classList.toggle("is-active", chip === button));
        renderOpportunities();
      });
    });
  }

  function initRequestForm() {
    const form = $("#ninjas-request-form");
    if (!form) return;
    const status = $("#ninjas-request-status");
    const submitButton = $('button[type="submit"]', form);
    state.requestTxid = buildTxid("REQ");
    renderPixCard("request", 5, state.requestTxid, "Pedido Ninjas Cruzeiro");

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const payload = Object.fromEntries(new FormData(form).entries());
      payload.paymentTxid = state.requestTxid;

      submitButton.disabled = true;
      submitButton.textContent = "Salvando pedido...";

      try {
        const result = await requestJson("/api/ninjas/requests", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        status.textContent = `${result.message} Codigo: ${result.item?.id || "pedido salvo"}.`;
        openPortalWhatsApp([
          "Novo pedido Ninjas Cruzeiro pelo Catalogo.",
          "",
          `Servico: ${payload.service || payload.requestTitle || payload.requestType || ""}`,
          `Cliente: ${payload.name || ""}`,
          `WhatsApp/telefone: ${payload.phone || payload.whatsapp || payload.contactPhone || ""}`,
          `Bairro/cidade: ${[payload.neighborhood || payload.bairro, payload.city].filter(Boolean).join(" / ")}`,
          payload.urgency ? `Urgencia: ${payload.urgency}` : "",
          payload.budget ? `Orcamento: ${payload.budget}` : "",
          payload.availability ? `Horario: ${payload.availability}` : "",
          payload.details || payload.description ? `Detalhes: ${payload.details || payload.description}` : "",
          `Pix/txid: ${payload.paymentTxid || ""}`,
          `Codigo: ${result.item?.id || "pedido salvo"}`
        ]);
        state.requestTxid = buildTxid("REQ");
        renderPixCard("request", 5, state.requestTxid, "Pedido Ninjas Cruzeiro");
      } catch (error) {
        status.textContent = error.message;
      } finally {
        submitButton.disabled = false;
        submitButton.textContent = "Registrar pedido no radar";
      }
    });
  }

  function initProfileForm() {
    const form = $("#ninjas-profile-form");
    if (!form) return;
    const status = $("#ninjas-profile-status");
    const submitButton = $('button[type="submit"]', form);

    $$(".ninjas-template-button").forEach((button) => {
      button.addEventListener("click", () => applyTemplate(button.dataset.resumeTemplate || "primeiro-emprego"));
    });

    $$("input, textarea, select", form).forEach((field) => {
      field.addEventListener("input", renderPreview);
      field.addEventListener("change", renderPreview);
    });

    $$('input[name="plan"]', form).forEach((radio) => {
      radio.addEventListener("change", () => syncProfilePayment(true));
    });

    $$(".ninjas-package-button").forEach((button) => {
      button.addEventListener("click", () => {
        $$(".ninjas-package-button").forEach((item) => item.classList.toggle("is-active", item === button));
        syncProfilePayment(true);
      });
    });

    $("#ninjas-copy-summary")?.addEventListener("click", async () => {
      const ok = await copyText($("#resume-summary")?.value || $("#preview-summary")?.textContent || "");
      status.textContent = ok ? "Resumo copiado." : "Nao consegui copiar o resumo agora.";
    });

    $("#ninjas-print-cv")?.addEventListener("click", () => {
      document.body.classList.add("printing-ninjas-cv");
      window.print();
    });

    window.addEventListener("afterprint", () => {
      document.body.classList.remove("printing-ninjas-cv");
    });

    applyTemplate("primeiro-emprego");
    syncProfilePayment(false);

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const payload = Object.fromEntries(new FormData(form).entries());
      payload.paymentTxid = state.profileAmount > 0 ? state.profileTxid : "";
      payload.paymentAmount = state.profileAmount;

      submitButton.disabled = true;
      submitButton.textContent = "Enviando perfil...";

      try {
        const result = await requestJson("/api/ninjas/profiles", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        status.textContent = `${result.message} Codigo: ${result.item?.id || "perfil salvo"}.`;
        openPortalWhatsApp([
          "Novo curriculo/perfil Ninjas Cruzeiro pelo Catalogo.",
          "",
          `Nome: ${payload.name || ""}`,
          `Area: ${payload.area || payload.role || payload.profession || ""}`,
          `WhatsApp/telefone: ${payload.phone || payload.whatsapp || ""}`,
          `E-mail: ${payload.email || ""}`,
          `Cidade: ${payload.city || "Cruzeiro do Sul - AC"}`,
          `Disponibilidade: ${payload.availability || ""}`,
          `Plano: ${payload.plan || "gratis"}`,
          payload.paymentAmount ? `Valor/creditos: R$ ${payload.paymentAmount}` : "",
          payload.summary ? `Resumo: ${payload.summary}` : "",
          `Codigo: ${result.item?.id || "perfil salvo"}`
        ]);
      } catch (error) {
        status.textContent = error.message;
      } finally {
        submitButton.disabled = false;
        submitButton.textContent = "Enviar perfil profissional";
      }
    });
  }

  function initPaymentButtons() {
    $$("[data-payment-card]").forEach((card) => {
      const kind = card.getAttribute("data-payment-card");
      const nodes = getPaymentNodes(card);

      nodes.copyButton?.addEventListener("click", async () => {
        if (nodes.note) {
          nodes.note.textContent = "Por seguranca, o pagamento fica somente no QR Code desta referencia.";
        }
      });

      nodes.refreshButton?.addEventListener("click", () => {
        if (kind === "request") {
          state.requestTxid = buildTxid("REQ");
          renderPixCard("request", 5, state.requestTxid, "Pedido Ninjas Cruzeiro");
          return;
        }

        if (kind === "profile") {
          syncProfilePayment(true);
        }
      });
    });
  }

  function init() {
    initPaymentButtons();
    initRequestForm();
    initProfileForm();
    initOpportunityFilters();
    loadOpportunities();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
