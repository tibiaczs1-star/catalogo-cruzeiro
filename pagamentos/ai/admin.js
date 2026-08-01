(() => {
  const API = "/api/arizona-ranch";
  const state = { config: null, auth: null, reservations: [] };
  const elements = {
    access: document.querySelector("#admin-access"),
    auth: document.querySelector("#admin-auth"),
    google: document.querySelector("#admin-google-login"),
    list: document.querySelector("#admin-list"),
    reservations: document.querySelector("#admin-reservations"),
    summary: document.querySelector("#admin-summary"),
    toast: document.querySelector("#admin-toast"),
  };

  function showToast(message, tone = "normal") {
    elements.toast.textContent = message;
    elements.toast.classList.toggle("is-error", tone === "error");
    elements.toast.hidden = false;
    elements.toast.classList.add("is-visible");
    window.clearTimeout(showToast.timeout);
    showToast.timeout = window.setTimeout(() => {
      elements.toast.classList.remove("is-visible");
      elements.toast.hidden = true;
    }, 4200);
  }

  async function request(path, options = {}) {
    const response = await fetch(`${API}${path}`, {
      credentials: "same-origin",
      headers: { "content-type": "application/json", ...(options.headers || {}) },
      ...options,
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || "Não foi possível carregar os pedidos.");
    return payload;
  }

  function formatCurrency(cents) {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);
  }

  function formatDate(value) {
    return value ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value)) : "—";
  }

  function statusText(status) {
    return {
      awaiting_payment: "Aguardando comprovante",
      confirmed: "Confirmada",
      expired: "Expirada",
      receipt_submitted: "Comprovante recebido",
      rejected: "Não aprovada",
    }[status] || status;
  }

  function renderGoogleLogin() {
    elements.google.replaceChildren();
    const user = state.config?.user;
    if (user?.signedIn && user?.isAdmin) {
      elements.access.textContent = `Acesso autorizado: ${user.name || user.email}`;
      return;
    }
    if (user?.signedIn) {
      elements.access.textContent = "Esta conta Google não possui acesso administrativo.";
      return;
    }
    if (!state.auth?.clientId) {
      elements.access.textContent = "O login Google não está disponível nesta instalação.";
      return;
    }
    if (!window.google?.accounts?.id) {
      const reload = document.createElement("button");
      reload.className = "button button-secondary";
      reload.type = "button";
      reload.textContent = "Carregar login Google";
      reload.addEventListener("click", () => window.location.reload());
      elements.google.append(reload);
      return;
    }
    window.google.accounts.id.initialize({ client_id: state.auth.clientId, callback: signIn });
    window.google.accounts.id.renderButton(elements.google, {
      shape: "pill", size: "large", text: "continue_with", theme: "filled_black", width: 300,
    });
  }

  function renderSummary(summary) {
    elements.summary.replaceChildren();
    for (const [label, value] of [["Aguardando", summary.awaitingPayment], ["Em análise", summary.receiptSubmitted], ["Confirmadas", summary.confirmed]]) {
      const card = document.createElement("div");
      const count = document.createElement("strong");
      count.textContent = String(value || 0);
      const text = document.createElement("span");
      text.textContent = label;
      card.append(count, text);
      elements.summary.append(card);
    }
  }

  function summarize(reservations) {
    return reservations.reduce(
      (summary, reservation) => {
        if (reservation.status === "awaiting_payment") summary.awaitingPayment += 1;
        if (reservation.status === "receipt_submitted") summary.receiptSubmitted += 1;
        if (reservation.status === "confirmed") summary.confirmed += 1;
        return summary;
      },
      { awaitingPayment: 0, receiptSubmitted: 0, confirmed: 0 }
    );
  }

  function renderReservations() {
    elements.list.replaceChildren();
    if (!state.reservations.length) {
      const empty = document.createElement("p");
      empty.className = "empty-state";
      empty.textContent = "Nenhum pedido encontrado.";
      elements.list.append(empty);
      return;
    }
    for (const reservation of state.reservations) {
      const card = document.createElement("article");
      card.className = "admin-card";
      const heading = document.createElement("div");
      const title = document.createElement("h3");
      title.textContent = `Mesa ${String(reservation.tableNumber).padStart(2, "0")} · ${reservation.code}`;
      const status = document.createElement("span");
      status.className = "status-pill";
      status.dataset.status = reservation.status;
      status.textContent = statusText(reservation.status);
      heading.append(title, status);
      const details = document.createElement("p");
      details.textContent = `${reservation.customer?.name || "Cliente"} · ${reservation.customer?.email || ""} · ${reservation.seats} lugares · ${formatCurrency(reservation.amountCents)}`;
      const created = document.createElement("small");
      created.textContent = `Criado em ${formatDate(reservation.createdAt)}${reservation.receipt?.submittedAt ? ` · comprovante em ${formatDate(reservation.receipt.submittedAt)}` : ""}`;
      const actions = document.createElement("div");
      actions.className = "admin-actions";
      if (reservation.receipt?.url) {
        const proof = document.createElement("a");
        proof.className = "button button-secondary";
        proof.href = reservation.receipt.url;
        proof.target = "_blank";
        proof.rel = "noreferrer";
        proof.textContent = "Abrir comprovante";
        actions.append(proof);
      }
      if (["awaiting_payment", "receipt_submitted"].includes(reservation.status)) {
        const confirm = document.createElement("button");
        confirm.className = "button";
        confirm.type = "button";
        confirm.textContent = "Confirmar mesa";
        confirm.addEventListener("click", () => updateReservation(reservation.id, "confirmed", confirm));
        const reject = document.createElement("button");
        reject.className = "button button-danger";
        reject.type = "button";
        reject.textContent = "Recusar pedido";
        reject.addEventListener("click", () => updateReservation(reservation.id, "rejected", reject));
        actions.append(confirm, reject);
      }
      card.append(heading, details, created, actions);
      elements.list.append(card);
    }
  }

  async function loadAdmin() {
    const payload = await request("/admin/reservations");
    state.reservations = payload.reservations || [];
    renderSummary(summarize(state.reservations));
    renderReservations();
    elements.summary.hidden = false;
    elements.reservations.hidden = false;
  }

  async function updateReservation(id, status, button) {
    const question = status === "confirmed" ? "Confirmar esta mesa como paga?" : "Recusar este pedido e liberar a mesa?";
    if (!window.confirm(question)) return;
    button.disabled = true;
    try {
      await request(`/admin/reservations/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ action: status === "confirmed" ? "confirm" : "reject" }),
      });
      await loadAdmin();
      showToast(status === "confirmed" ? "Mesa confirmada." : "Pedido recusado e mesa liberada.", "success");
    } catch (error) {
      showToast(error.message, "error");
      button.disabled = false;
    }
  }

  async function signIn(response) {
    try {
      const result = await fetch("/api/auth/google", {
        method: "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ credential: response.credential }),
      });
      if (!result.ok) throw new Error("Não foi possível entrar com Google.");
      await initialize();
    } catch (error) {
      showToast(error.message, "error");
    }
  }

  async function initialize() {
    try {
      state.auth = await fetch("/api/auth/config", { credentials: "same-origin" }).then((response) => response.json().catch(() => ({})));
      const config = await request("/config");
      state.config = { ...config, user: config.session };
      renderGoogleLogin();
      if (state.config.user?.isAdmin) await loadAdmin();
    } catch (error) {
      showToast(error.message, "error");
    }
  }

  document.querySelector("#refresh-admin")?.addEventListener("click", () => loadAdmin().catch((error) => showToast(error.message, "error")));
  initialize();
})();
