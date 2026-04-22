(function () {
  const MAX_ARCHIVE_ITEMS = 180;
  const state = {
    archiveItems: [],
    authSession: null,
    authConfig: null
  };

  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => [...document.querySelectorAll(selector)];

  function safeText(value, fallback = "") {
    const text = String(value || "").trim();
    return text || fallback;
  }

  function trimText(value, max = 160) {
    const text = safeText(value).replace(/\s+/g, " ");
    return text.length > max ? `${text.slice(0, max - 1).trim()}…` : text;
  }

  function articleHref(item) {
    return item?.slug ? `/noticia.html?slug=${encodeURIComponent(item.slug)}` : item?.url || "/noticia.html";
  }

  async function requestJson(url, options = {}) {
    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...(options.headers || {})
      },
      ...options
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload?.error || payload?.message || `Falha ${response.status}`);
    }
    return payload;
  }

  function setFeedback(node, message, tone = "") {
    if (!node) return;
    node.textContent = message || "";
    node.classList.remove("is-error", "is-success");
    if (tone) node.classList.add(tone);
  }

  function renderTags(target, entries = []) {
    if (!target) return;
    target.innerHTML = entries.map((entry) => `<span>${entry}</span>`).join("");
  }

  async function loadAuthState() {
    const [config, session] = await Promise.all([
      requestJson("/api/auth/config"),
      requestJson("/api/auth/session")
    ]);

    state.authConfig = config;
    state.authSession = session;

    const user = session?.user;
    const authText = $("#index2-auth-status-text");
    authText.textContent = user
      ? `Sessão ativa para ${safeText(user.name, user.email || "usuário")} e reaproveitável nas áreas que exigem Google.`
      : config.enabled
        ? "Google Auth está ativo no ecossistema, mas esta sessão ainda não entrou em uma conta."
        : "Google Auth não está ligado em produção neste momento.";

    renderTags($("#index2-auth-status-chips"), [
      config.enabled ? "Google auth enabled" : "Google auth off",
      user?.email ? user.email : "No active session",
      ...(Array.isArray(config.requiredFor) ? config.requiredFor.map((item) => `For ${item}`) : [])
    ]);
  }

  function renderArchiveResults(items = []) {
    const results = $("#index2-archive-results");
    if (!results) return;

    if (!items.length) {
      results.innerHTML = `<div class="bridge-empty">Nenhum resultado apareceu para esse filtro no acervo carregado da home.</div>`;
      return;
    }

    results.innerHTML = items.slice(0, 8).map((item) => `
      <article class="bridge-result-card">
        <h4>${safeText(item.title, "Sem título")}</h4>
        <p class="bridge-result-summary">${trimText(item.summary || item.lede, 180)}</p>
        <div class="bridge-result-meta">
          <span>${safeText(item.category, "edição")}</span>
          <span>${safeText(item.sourceName || item.sourceLabel, "fonte")}</span>
          <span>${item.publishedAt ? new Date(item.publishedAt).toLocaleDateString("pt-BR") : "agora"}</span>
        </div>
        <a href="${articleHref(item)}">Open article</a>
      </article>
    `).join("");
  }

  async function loadArchiveItems() {
    const payload = await requestJson(`/api/news/archive?limit=${MAX_ARCHIVE_ITEMS}`);
    state.archiveItems = Array.isArray(payload.items) ? payload.items : [];
    renderArchiveResults(state.archiveItems.slice(0, 6));
  }

  function attachArchiveSearch() {
    const form = $("#index2-archive-form");
    const input = $("#index2-archive-query");
    if (!form || !input) return;

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const query = safeText(input.value).toLowerCase();
      if (!query) {
        renderArchiveResults(state.archiveItems.slice(0, 6));
        return;
      }

      const filtered = state.archiveItems.filter((item) => {
        const haystack = [
          item.title,
          item.summary,
          item.lede,
          item.category,
          item.sourceName,
          item.sourceLabel
        ]
          .map((entry) => safeText(entry).toLowerCase())
          .join(" ");
        return haystack.includes(query);
      });

      renderArchiveResults(filtered);
    });
  }

  function renderComments(items = []) {
    const feed = $("#index2-comments-feed");
    if (!feed) return;
    if (!items.length) {
      feed.innerHTML = `<div class="bridge-empty">Ainda não há comentários para espelhar aqui.</div>`;
      return;
    }
    feed.innerHTML = items.slice(0, 6).map((item) => `
      <article class="bridge-feed-item">
        <h4>${safeText(item.name || item.author, "Leitor local")}</h4>
        <p>${trimText(item.message || item.text, 210)}</p>
        <div class="bridge-feed-item-meta">
          <span>${safeText(item.badge, "Leitor local")}</span>
          <span>${item.createdAt ? new Date(item.createdAt).toLocaleDateString("pt-BR") : "agora"}</span>
        </div>
      </article>
    `).join("");
  }

  async function loadComments() {
    const payload = await requestJson("/api/comments?limit=8");
    const items = Array.isArray(payload.items) ? payload.items : [];
    renderComments(items);
    return items;
  }

  function attachCommentForm() {
    const form = $("#index2-comment-form");
    if (!form) return;

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const feedback = $("#index2-comment-feedback");
      setFeedback(feedback, "Enviando comentário...");
      try {
        await requestJson("/api/comments", {
          method: "POST",
          body: JSON.stringify({
            articleId: "index2-home",
            pagePath: "/index2.html",
            name: $("#index2-comment-name")?.value || "",
            author: $("#index2-comment-name")?.value || "",
            message: $("#index2-comment-message")?.value || "",
            badge: "Leitor index2"
          })
        });
        form.reset();
        setFeedback(feedback, "Comentário enviado para o backend do jornal.", "is-success");
        await loadComments();
      } catch (error) {
        setFeedback(feedback, error.message, "is-error");
      }
    });
  }

  function renderCommunity(items = []) {
    const feed = $("#index2-community-feed");
    if (!feed) return;
    if (!items.length) {
      feed.innerHTML = `<div class="bridge-empty">Nenhum relato comunitário recente entrou na fila ainda.</div>`;
      return;
    }
    feed.innerHTML = items.slice(0, 6).map((item) => `
      <article class="bridge-feed-item">
        <h4>${safeText(item.title, "Relato comunitário")}</h4>
        <p>${trimText(item.message || item.description, 210)}</p>
        <div class="bridge-feed-item-meta">
          <span>${safeText(item.location || item.neighborhood || "local")}</span>
          <span>${safeText(item.status || "novo")}</span>
        </div>
      </article>
    `).join("");
  }

  async function loadCommunityReports() {
    const payload = await requestJson("/api/community/reports?limit=6");
    const items = Array.isArray(payload.items) ? payload.items : [];
    renderCommunity(items);
    return items;
  }

  function attachCommunityForm() {
    const form = $("#index2-community-form");
    if (!form) return;

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const feedback = $("#index2-community-feedback");
      setFeedback(feedback, "Enviando relato para a fila comunitária...");
      try {
        await requestJson("/api/community/reports", {
          method: "POST",
          body: JSON.stringify({
            title: $("#index2-community-title")?.value || "",
            location: $("#index2-community-location")?.value || "",
            message: $("#index2-community-message")?.value || "",
            sourcePage: "/index2.html"
          })
        });
        form.reset();
        setFeedback(feedback, "Relato enviado para a equipe verificar.", "is-success");
        await loadCommunityReports();
      } catch (error) {
        setFeedback(feedback, error.message, "is-error");
      }
    });
  }

  function renderFounders(founders = [], totals = {}) {
    const wall = $("#index2-founders-wall");
    const summary = $("#index2-founders-summary");
    summary.textContent = `${Number(totals.founders || 0)} fundador(es) confirmados, ${Number(totals.pendingFounders || 0)} aguardando confirmação e ${Number(totals.subscriptions || 0)} assinaturas totais.`;

    renderTags($("#index2-founders-totals"), [
      `${Number(totals.subscriptions || 0)} subscriptions`,
      `${Number(totals.founders || 0)} founders`,
      `${Number(totals.pendingFounders || 0)} pending founders`
    ]);

    if (!wall) return;
    if (!founders.length) {
      wall.innerHTML = `<div class="bridge-empty">O mural de fundadores ainda não tem confirmações públicas.</div>`;
      return;
    }
    wall.innerHTML = founders.map((founder) => `
      <article class="bridge-founder-card">
        <strong>${safeText(founder.name, "Fundador do Catálogo")}</strong>
        <span>R$ ${Number(founder.amount || 0).toFixed(2)}</span>
      </article>
    `).join("");
  }

  async function loadFounders() {
    const payload = await requestJson("/api/subscriptions");
    renderFounders(Array.isArray(payload.founders) ? payload.founders : [], payload.totals || {});
    return payload;
  }

  function toggleFounderAmount() {
    const plan = $("#index2-subscription-plan")?.value || "";
    const wrap = $("#index2-founder-amount-wrap");
    if (!wrap) return;
    wrap.hidden = plan !== "fundadores";
  }

  function attachSubscriptionForm() {
    const form = $("#index2-subscription-form");
    const plan = $("#index2-subscription-plan");
    plan?.addEventListener("change", toggleFounderAmount);
    toggleFounderAmount();
    if (!form) return;

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const feedback = $("#index2-subscription-feedback");
      setFeedback(feedback, "Enviando assinatura...");
      try {
        const payload = await requestJson("/api/subscriptions", {
          method: "POST",
          body: JSON.stringify({
            name: $("#index2-subscription-name")?.value || "",
            email: $("#index2-subscription-email")?.value || "",
            plan: $("#index2-subscription-plan")?.value || "resumo-7h-gratis",
            amount: $("#index2-founder-amount")?.value || "5",
            sourcePage: "/index2.html"
          })
        });
        form.reset();
        toggleFounderAmount();
        setFeedback(
          feedback,
          payload?.item?.plan === "fundadores"
            ? "Apoio de fundador registrado. Se a sessão Google já estiver ativa, o backend guardou a referência para confirmação manual."
            : "Assinatura registrada no backend do jornal.",
          "is-success"
        );
        await loadFounders();
      } catch (error) {
        setFeedback(
          feedback,
          `${error.message} Se precisar, entre com Google em /pubpaid.html ou na home original e tente de novo aqui.`,
          "is-error"
        );
      }
    });
  }

  function attachAgentForm() {
    const form = $("#index2-agent-form");
    if (!form) return;
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const feedback = $("#index2-agent-feedback");
      setFeedback(feedback, "Enviando mensagem para os agentes...");
      try {
        await requestJson("/api/agent-messages", {
          method: "POST",
          body: JSON.stringify({
            name: $("#index2-agent-name")?.value || "",
            email: $("#index2-agent-email")?.value || "",
            subject: $("#index2-agent-subject")?.value || "",
            message: $("#index2-agent-message")?.value || ""
          })
        });
        form.reset();
        setFeedback(feedback, "Mensagem enviada para a equipe.", "is-success");
      } catch (error) {
        setFeedback(feedback, error.message, "is-error");
      }
    });
  }

  function renderActivitySummary({ comments = [], community = [] }) {
    $("#index2-activity-summary").textContent =
      `A index2 já lê ${comments.length} comentário(s) recentes e ${community.length} relato(s) comunitário(s) diretamente do mesmo backend do jornal.`;
    renderTags($("#index2-activity-chips"), [
      `${comments.length} comments mirrored`,
      `${community.length} community reports`,
      `${state.archiveItems.length} archive items loaded`
    ]);
  }

  async function init() {
    attachArchiveSearch();
    attachCommentForm();
    attachCommunityForm();
    attachSubscriptionForm();
    attachAgentForm();

    const [comments, community] = await Promise.all([
      loadComments().catch(() => []),
      loadCommunityReports().catch(() => [])
    ]);

    await Promise.all([
      loadAuthState().catch(() => {
        $("#index2-auth-status-text").textContent = "Não foi possível ler a sessão agora.";
      }),
      loadArchiveItems().catch(() => {
        renderArchiveResults([]);
      }),
      loadFounders().catch(() => {
        $("#index2-founders-summary").textContent = "Não foi possível carregar o mural de fundadores agora.";
      })
    ]);

    renderActivitySummary({ comments, community });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
