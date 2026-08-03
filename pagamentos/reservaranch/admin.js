(() => {
  const API = "/api/arizona-ranch";
  const state = { reservations: [] };
  const elements = {
    access: document.querySelector("#admin-access"),
    auth: document.querySelector("#admin-auth"),
    form: document.querySelector("#admin-login-form"),
    username: document.querySelector("#admin-username"),
    password: document.querySelector("#admin-password"),
    loginButton: document.querySelector("#admin-login-button"),
    logoutButton: document.querySelector("#logout-admin"),
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
    if (!response.ok) {
      const error = new Error(payload.error || "Não foi possível carregar os pedidos.");
      error.status = response.status;
      throw error;
    }
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

  function setAuthenticated(authenticated) {
    elements.auth.hidden = authenticated;
    elements.summary.hidden = !authenticated;
    elements.reservations.hidden = !authenticated;
    if (elements.logoutButton) elements.logoutButton.hidden = !authenticated;
    if (!authenticated) {
      elements.access.textContent = "Use seu acesso de administrador.";
      elements.summary.replaceChildren();
      elements.list.replaceChildren();
    }
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

  async function signIn(event) {
    event.preventDefault();
    const username = elements.username.value.trim();
    const password = elements.password.value;
    if (!username || !password) {
      elements.access.textContent = "Informe usuário e senha para continuar.";
      return;
    }
    elements.loginButton.disabled = true;
    try {
      await request("/admin/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });
      elements.form.reset();
      setAuthenticated(true);
      await loadAdmin();
      showToast("Painel liberado.", "success");
    } catch (error) {
      elements.access.textContent = error.status === 401 ? "Usuário ou senha inválidos." : error.message;
      showToast(error.message, "error");
    } finally {
      elements.loginButton.disabled = false;
    }
  }

  async function logout() {
    elements.logoutButton.disabled = true;
    try {
      await request("/admin/session", { method: "DELETE" });
      elements.form.reset();
      setAuthenticated(false);
      elements.username.focus();
      showToast("Você saiu do painel.", "success");
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      elements.logoutButton.disabled = false;
    }
  }

  async function initialize() {
    try {
      const session = await request("/admin/session");
      const authenticated = Boolean(session.authenticated);
      setAuthenticated(authenticated);
      if (authenticated) await loadAdmin();
      else elements.username.focus();
    } catch (error) {
      setAuthenticated(false);
      showToast(error.message, "error");
    }
  }

  document.querySelector("#refresh-admin")?.addEventListener("click", () => loadAdmin().catch((error) => showToast(error.message, "error")));
  elements.form?.addEventListener("submit", signIn);
  elements.logoutButton?.addEventListener("click", logout);
  initialize();
})();
