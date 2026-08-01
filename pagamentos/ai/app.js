(() => {
  const API = "/api/arizona-ranch";
  const tableSectors = [
    { id: "entrada", label: "Entrada & buffet", detail: "Mesas 01 a 12", numbers: range(1, 12) },
    { id: "frente", label: "Frente do salão", detail: "Mesas 13 a 24", numbers: range(13, 24) },
    { id: "centro", label: "Centro do salão", detail: "Mesas 25 a 45", numbers: range(25, 45) },
    { id: "palco", label: "Próximo ao palco", detail: "Mesas 46 a 67", numbers: range(46, 67) },
  ];

  const state = {
    activeSector: "all",
    auth: null,
    config: null,
    reservation: null,
    selectedSeats: 2,
    selectedTable: null,
    tables: [],
  };

  const elements = {
    account: document.querySelector("#google-login"),
    accountDescription: document.querySelector("#account-description"),
    accountTitle: document.querySelector("#account-title"),
    mapDialog: document.querySelector("#map-dialog"),
    overviewMap: document.querySelector("#full-map"),
    paymentDialog: document.querySelector("#payment-dialog"),
    paymentInfo: document.querySelector("#payment-summary"),
    paymentQr: document.querySelector("#pix-qr"),
    reservationPanel: document.querySelector("#reservation-panel"),
    sectorNav: document.querySelector("#sector-nav"),
    selectionDescription: document.querySelector("#selection-description"),
    selectionTitle: document.querySelector("#selection-title"),
    sectorCaption: document.querySelector("#sector-caption"),
    tableGrid: document.querySelector("#table-grid"),
    toast: document.querySelector("#toast"),
  };

  function range(start, end) {
    return Array.from({ length: end - start + 1 }, (_, index) => start + index);
  }

  function tableSector(number) {
    return tableSectors.find((sector) => sector.numbers.includes(number))?.id || "centro";
  }

  function tableLabel(number) {
    return String(number).padStart(2, "0");
  }

  function tableByNumber(number) {
    return state.tables.find((table) => table.number === number);
  }

  function showToast(message, tone = "normal") {
    elements.toast.textContent = message;
    elements.toast.classList.toggle("is-error", tone === "error");
    elements.toast.classList.add("is-visible");
    elements.toast.hidden = false;
    window.clearTimeout(showToast.timeout);
    showToast.timeout = window.setTimeout(() => {
      elements.toast.classList.remove("is-visible");
      elements.toast.hidden = true;
    }, 4200);
  }

  async function request(path, options = {}) {
    const response = await fetch(`${API}${path}`, {
      credentials: "same-origin",
      headers: {
        "content-type": "application/json",
        ...(options.headers || {}),
      },
      ...options,
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload.error || "Não foi possível concluir esta etapa.");
    }
    return payload;
  }

  function statusText(status) {
    return {
      awaiting_payment: "Aguardando comprovante",
      confirmed: "Reserva confirmada",
      expired: "Prazo expirado",
      receipt_submitted: "Comprovante em análise",
      rejected: "Pagamento não aprovado",
    }[status] || "Em andamento";
  }

  function renderSectors() {
    elements.sectorNav.replaceChildren();
    const options = [{ id: "all", label: "Todas" }, ...tableSectors];
    for (const sector of options) {
      const button = document.createElement("button");
      button.className = `sector-button${state.activeSector === sector.id ? " is-active" : ""}`;
      button.type = "button";
      button.dataset.sector = sector.id;
      button.textContent = sector.label;
      button.setAttribute("aria-pressed", String(state.activeSector === sector.id));
      elements.sectorNav.append(button);
    }
  }

  function createTableButton(table, className = "table-button") {
    const button = document.createElement("button");
    const isSelected = state.selectedTable === table.number;
    button.type = "button";
    button.className = `${className} status-${table.status}${isSelected ? " is-selected" : ""}`;
    button.dataset.table = String(table.number);
    button.dataset.status = table.status;
    button.title = `Mesa ${tableLabel(table.number)} — ${statusText(table.status)}`;
    button.setAttribute("aria-label", `Mesa ${tableLabel(table.number)} — ${statusText(table.status)}`);
    button.setAttribute("aria-pressed", String(isSelected));
    button.disabled = table.status !== "available";

    const number = document.createElement("strong");
    number.textContent = tableLabel(table.number);
    const availability = document.createElement("span");
    availability.className = "table-availability";
    availability.textContent = table.status === "available" ? "Livre" : statusText(table.status);
    button.append(number, availability);
    return button;
  }

  function renderTables() {
    elements.tableGrid.replaceChildren();
    const tables = state.tables.filter((table) => state.activeSector === "all" || tableSector(table.number) === state.activeSector);
    const activeSector = tableSectors.find((sector) => sector.id === state.activeSector);
    elements.sectorCaption.textContent = activeSector ? activeSector.detail : "Todas as mesas do salão";
    for (const table of tables) {
      elements.tableGrid.append(createTableButton(table));
    }
  }

  function renderOverviewMap() {
    elements.overviewMap.replaceChildren();
    const stage = document.createElement("div");
    stage.className = "map-zone map-stage";
    stage.textContent = "PALCO";
    elements.overviewMap.append(stage);

    const bar = document.createElement("div");
    bar.className = "map-zone map-bar";
    bar.textContent = "BAR";
    elements.overviewMap.append(bar);

    const kitchen = document.createElement("div");
    kitchen.className = "map-zone map-kitchen";
    kitchen.textContent = "COZINHA";
    elements.overviewMap.append(kitchen);

    const entrance = document.createElement("div");
    entrance.className = "map-zone map-entry";
    entrance.textContent = "ENTRADA • BUFFET";
    elements.overviewMap.append(entrance);

    for (const table of state.tables) {
      const button = createTableButton(table, "overview-table");
      button.style.gridColumn = String(((table.number - 1) % 10) + 1);
      button.style.gridRow = String(Math.floor((table.number - 1) / 10) + 2);
      elements.overviewMap.append(button);
    }
  }

  function renderAccount() {
    const user = state.config?.user;
    elements.account.replaceChildren();
    if (user?.signedIn) {
      const card = document.createElement("div");
      card.className = "account-card";
      const identity = document.createElement("p");
      identity.textContent = `Conectado como ${user.name || user.email}`;
      const hint = document.createElement("small");
      hint.textContent = "Sua identificação é usada somente para acompanhar esta reserva.";
      card.append(identity, hint);
      elements.account.append(card);
      elements.accountTitle.textContent = `Conectado como ${user.name || user.email}`;
      elements.accountDescription.textContent = "Conta Google conectada. Agora escolha uma mesa e gere o Pix.";
      return;
    }

    elements.accountTitle.textContent = "Entre com Google para reservar";
    elements.accountDescription.textContent = "Sua conta serve somente para localizar e acompanhar este pedido.";
    if (!state.auth?.clientId) {
      elements.accountDescription.textContent = "O login Google ainda não está disponível. Você pode consultar as mesas enquanto isso.";
      return;
    }

    const buttonMount = document.createElement("div");
    buttonMount.className = "google-button-mount";
    elements.account.append(buttonMount);
    if (window.google?.accounts?.id) {
      window.google.accounts.id.initialize({
        client_id: state.auth.clientId,
        callback: handleGoogleCredential,
      });
      window.google.accounts.id.renderButton(buttonMount, {
        shape: "pill",
        size: "large",
        text: "continue_with",
        theme: "filled_black",
        width: 300,
      });
      return;
    }

    const fallback = document.createElement("button");
    fallback.className = "button button-secondary";
    fallback.type = "button";
    fallback.textContent = "Carregar login Google";
    fallback.addEventListener("click", () => window.location.reload());
    elements.account.append(fallback);
  }

  function renderSelection() {
    const table = state.selectedTable ? tableByNumber(state.selectedTable) : null;
    if (!table) {
      elements.selectionTitle.textContent = "Selecione uma mesa no mapa";
      elements.selectionDescription.textContent = "A mesa fica bloqueada por 24 horas enquanto você realiza o Pix e envia o comprovante.";
      document.querySelector("#reserve-button").disabled = true;
      return;
    }

    elements.selectionTitle.textContent = `Mesa ${tableLabel(table.number)} selecionada`;
    elements.selectionDescription.textContent = `${state.selectedSeats} lugares • ${formatCurrency(state.selectedSeats === 2 ? 10000 : 20000)} à vista via Pix. Você confere o QR Code na próxima etapa.`;
    document.querySelector("#reserve-button").disabled = !state.config?.user?.signedIn;
  }

  function renderReservation() {
    elements.reservationPanel.replaceChildren();
    if (!state.reservation) return;
    const card = document.createElement("div");
    card.className = "active-reservation";
    const title = document.createElement("strong");
    title.textContent = `Pedido ${state.reservation.code} — ${statusText(state.reservation.status)}`;
    const description = document.createElement("span");
    description.textContent = `Mesa ${tableLabel(state.reservation.tableNumber)} • ${formatCurrency(state.reservation.amountCents)} • confirmação manual em até 24h após o pagamento.`;
    card.append(title, description);
    if (state.reservation.status === "awaiting_payment" || state.reservation.status === "receipt_submitted") {
      const action = document.createElement("button");
      action.type = "button";
      action.className = "button button-secondary";
      action.textContent = "Ver dados do Pix";
      action.addEventListener("click", () => openPayment(state.reservation));
      card.append(action);
    }
    elements.reservationPanel.append(card);
  }

  function formatCurrency(cents) {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);
  }

  async function loadTables() {
    const payload = await request("/tables");
    state.tables = payload.tables || [];
    renderTables();
    renderOverviewMap();
  }

  async function loadAuth() {
    state.auth = await fetch("/api/auth/config", { credentials: "same-origin" }).then(async (response) => {
      const payload = await response.json().catch(() => ({}));
      return response.ok ? payload : {};
    });
    const config = await request("/config");
    state.config = { ...config, user: config.session };
    renderAccount();
    renderSelection();
    if (state.config.user?.signedIn) await loadExistingReservation();
  }

  async function loadExistingReservation() {
    const payload = await request("/reservations/me");
    const latest = payload.reservations?.[0];
    if (!latest || !["awaiting_payment", "receipt_submitted"].includes(latest.status)) return;
    const details = await request(`/reservations/${latest.id}`);
    state.reservation = { ...details.reservation, payment: details.payment };
    renderReservation();
  }

  async function handleGoogleCredential(response) {
    try {
      await fetch("/api/auth/google", {
        method: "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ credential: response.credential }),
      }).then(async (result) => {
        if (!result.ok) {
          const payload = await result.json().catch(() => ({}));
          throw new Error(payload.error || "Não foi possível entrar com Google.");
        }
      });
      await loadAuth();
      showToast("Conta Google conectada. Escolha a mesa desejada.", "success");
    } catch (error) {
      showToast(error.message, "error");
    }
  }

  function selectTable(number) {
    const table = tableByNumber(number);
    if (!table || table.status !== "available") {
      showToast("Esta mesa não está disponível no momento.", "error");
      return;
    }
    state.selectedTable = number;
    renderTables();
    renderOverviewMap();
    renderSelection();
    document.querySelector("#selection-panel")?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  async function reserveSelectedTable() {
    if (!state.selectedTable) {
      showToast("Escolha uma mesa livre primeiro.", "error");
      return;
    }
    if (!state.config?.user?.signedIn) {
      document.querySelector("#account-strip")?.scrollIntoView({ behavior: "smooth", block: "center" });
      showToast("Entre com sua conta Google para criar a reserva.", "error");
      return;
    }

    const button = document.querySelector("#reserve-button");
    button.disabled = true;
    button.textContent = "Gerando Pix…";
    try {
      const payload = await request("/reservations", {
        method: "POST",
        body: JSON.stringify({
          tableNumber: state.selectedTable,
          seats: state.selectedSeats,
          phone: document.querySelector("#contact-phone")?.value.trim() || "",
        }),
      });
      state.reservation = { ...payload.reservation, payment: payload.payment };
      renderReservation();
      await loadTables();
      openPayment(state.reservation);
      showToast("Pedido criado. Pague o Pix e envie o comprovante.", "success");
    } catch (error) {
      showToast(error.message, "error");
      await loadTables().catch(() => undefined);
    } finally {
      button.disabled = false;
      button.textContent = "Gerar Pix da reserva";
    }
  }

  function openPayment(reservation) {
    state.reservation = reservation;
    const payment = reservation.payment;
    elements.paymentInfo.textContent = `Mesa ${tableLabel(reservation.tableNumber)} • ${formatCurrency(reservation.amountCents)} • Pedido ${reservation.code}`;
    elements.paymentQr.removeAttribute("src");
    if (payment?.qrCodeDataUrl) elements.paymentQr.src = payment.qrCodeDataUrl;
    document.querySelector("#pix-code").value = payment?.pixCode || "";
    document.querySelector("#payment-title").textContent = `Mesa ${tableLabel(reservation.tableNumber)} bloqueada por 24 horas`;
    document.querySelector("#order-id").textContent = reservation.code;
    const whatsapp = document.querySelector("#whatsapp-proof");
    whatsapp.href = payment?.whatsappUrl || "#";
    document.querySelector("#upload-status").textContent = reservation.expiresAt
      ? `Envie o comprovante até ${new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(reservation.expiresAt))}.`
      : "Envie o comprovante após realizar o pagamento.";
    elements.paymentDialog.showModal();
  }

  async function copyPixCode() {
    const input = document.querySelector("#pix-code");
    try {
      await navigator.clipboard.writeText(input.value);
      showToast("Código Pix copiado.", "success");
    } catch {
      input.select();
      document.execCommand("copy");
      showToast("Código Pix copiado.", "success");
    }
  }

  async function uploadReceipt(file) {
    if (!file || !state.reservation) return;
    if (file.size > 4 * 1024 * 1024) {
      showToast("O comprovante deve ter no máximo 4 MB.", "error");
      return;
    }
    const receiptStatus = document.querySelector("#upload-status");
    receiptStatus.textContent = "Enviando comprovante…";
    try {
      const dataUrl = await readAsDataUrl(file);
      const payload = await request(`/reservations/${state.reservation.id}/receipt`, {
        method: "POST",
        body: JSON.stringify({ dataUrl, fileName: file.name, mimeType: file.type }),
      });
      state.reservation = { ...payload.reservation, payment: state.reservation.payment };
      renderReservation();
      await loadTables();
      receiptStatus.textContent = "Comprovante enviado. Aguarde a confirmação manual.";
      showToast("Comprovante enviado. A confirmação é feita em até 24h.", "success");
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      if (!receiptStatus.textContent.includes("enviado")) receiptStatus.textContent = "";
    }
  }

  function readAsDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error("Não foi possível ler este arquivo."));
      reader.readAsDataURL(file);
    });
  }

  function bindEvents() {
    document.addEventListener("click", (event) => {
      const table = event.target.closest("[data-table]");
      if (table) selectTable(Number(table.dataset.table));
      const sector = event.target.closest("[data-sector]");
      if (sector) {
        state.activeSector = sector.dataset.sector;
        renderSectors();
        renderTables();
      }
      if (event.target.closest("[data-open-map]")) elements.mapDialog.showModal();
      if (event.target.closest("[data-close-map]")) elements.mapDialog.close();
      if (event.target.closest("[data-close-payment]")) elements.paymentDialog.close();
    });

    document.querySelectorAll("[data-seats]").forEach((button) => {
      button.addEventListener("click", () => {
        state.selectedSeats = Number(button.dataset.seats);
        document.querySelectorAll("[data-seats]").forEach((item) => {
          item.setAttribute("aria-pressed", String(item === button));
          item.classList.toggle("is-selected", item === button);
        });
        renderSelection();
      });
    });
    document.querySelector("#reserve-button")?.addEventListener("click", reserveSelectedTable);
    document.querySelector("#copy-pix")?.addEventListener("click", copyPixCode);
    document.querySelector("#receipt-file")?.addEventListener("change", (event) => uploadReceipt(event.target.files?.[0]));
  }

  async function initialize() {
    bindEvents();
    renderSectors();
    renderSelection();
    try {
      await Promise.all([loadTables(), loadAuth()]);
    } catch (error) {
      showToast("Não foi possível carregar as mesas agora. Atualize a página e tente novamente.", "error");
    }
  }

  initialize();
})();
