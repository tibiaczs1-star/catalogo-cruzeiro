(() => {
  const API = "/api/arizona-ranch";
  const tableSectors = [
    { id: "entrada", label: "Entrada & buffet", detail: "Mesas 01 a 12", numbers: range(1, 12) },
    { id: "frente", label: "Frente do salão", detail: "Mesas 13 a 24", numbers: range(13, 24) },
    { id: "centro", label: "Centro do salão", detail: "Mesas 25 a 45", numbers: range(25, 45) },
    { id: "palco", label: "Próximo ao palco", detail: "Mesas 46 a 67", numbers: range(46, 67) },
  ];
  const flow = ["login", "details", "table", "whatsapp", "payment"];
  const state = { activeSector: "all", auth: null, config: null, contactPhone: "", customer: { name: "", email: "" }, flowStep: "login", reservation: null, selectedSeats: 2, selectedTable: null, tables: [] };
  const elements = {
    account: document.querySelector("#google-login"), accountDescription: document.querySelector("#account-description"), accountTitle: document.querySelector("#account-title"),
    detailsConsent: document.querySelector("#details-consent"), detailsEmail: document.querySelector("#details-email"), detailsName: document.querySelector("#details-name"),
    loginNext: document.querySelector("#login-next"), mapDialog: document.querySelector("#map-dialog"),
    overviewMap: document.querySelector("#full-map"), paymentDialog: document.querySelector("#payment-dialog"), paymentInfo: document.querySelector("#payment-summary"), paymentQr: document.querySelector("#pix-qr"), pixAmountValue: document.querySelector("#pix-amount-value"), pixCodeDisplay: document.querySelector("#pix-code-display"), pixKeyDisplay: document.querySelector("#pix-key-display"), pixInfoToggle: document.querySelector("#pix-info-toggle"), pixInfoBody: document.querySelector("#pix-info-body"), pixShareBtn: document.querySelector("#pix-share-btn"), reservationPanel: document.querySelector("#reservation-panel"),
    sectorCaption: document.querySelector("#sector-caption"), sectorNav: document.querySelector("#sector-nav"), selectionDescription: document.querySelector("#selection-description"), selectionTitle: document.querySelector("#selection-title"), tableGrid: document.querySelector("#table-grid"), tableNext: document.querySelector("#table-next"), toast: document.querySelector("#toast"), whatsappSelection: document.querySelector("#whatsapp-selection")
  };

  function range(start, end) { return Array.from({ length: end - start + 1 }, (_, index) => start + index); }
  function tableLabel(number) { return String(number).padStart(2, "0"); }
  function tableByNumber(number) { return state.tables.find((table) => table.number === number); }
  function tableSector(number) { return tableSectors.find((sector) => sector.numbers.includes(number))?.id || "centro"; }
  function tableAvailability(table, compact = false) {
    const labels = {
      available: { yes: "✓ Livre", no: "Livre", icon: "✓" },
      pending: { yes: "Pedido", no: "Pedido", icon: "!" },
      reserved: { yes: "Vendida", no: "Vendida", icon: "V" },
      unavailable: { yes: "Indisponível", no: "—", icon: "×" },
      pre_sold: { yes: "Pré-venda", no: "Pré-venda", icon: "P" },
    };
    const t = labels[table.status] || labels.available;
    return compact ? t.icon : t.yes;
  }
  function statusText(status) {
    const map = {
      awaiting_payment: "Aguardando comprovante",
      confirmed: "Reserva confirmada",
      expired: "Prazo expirado",
      receipt_submitted: "Comprovante em análise",
      rejected: "Pagamento não aprovado",
      pre_sold: "Pré-venda",
    };
    return map[status] || "Pedido criado";
  }
  function formatCurrency(cents) { return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100); }

  function showToast(message, tone = "normal") {
    elements.toast.textContent = message;
    elements.toast.classList.toggle("is-error", tone === "error");
    elements.toast.classList.add("is-visible"); elements.toast.hidden = false;
    window.clearTimeout(showToast.timeout);
    showToast.timeout = window.setTimeout(() => { elements.toast.classList.remove("is-visible"); elements.toast.hidden = true; }, 4200);
  }

  async function request(path, options = {}) {
    const response = await fetch(`${API}${path}`, { credentials: "same-origin", headers: { "content-type": "application/json", ...(options.headers || {}) }, ...options });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || "Não foi possível concluir esta etapa.");
    return payload;
  }

  function showFlowStep(step, { scroll = true } = {}) {
    if (!flow.includes(step)) return;
    state.flowStep = step;
    document.querySelectorAll("[data-flow-step]").forEach((section) => { section.hidden = section.dataset.flowStep !== step; });
    document.querySelectorAll("[data-flow-nav]").forEach((item) => { item.classList.toggle("is-active", item.dataset.flowNav === step); item.classList.toggle("is-complete", flow.indexOf(item.dataset.flowNav) < flow.indexOf(step)); });
    if (step === "whatsapp") renderWhatsAppStep();
    if (step === "payment") renderPaymentStep();
    if (scroll) document.querySelector(`[data-flow-step="${step}"]`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function renderSectors() {
    elements.sectorNav.replaceChildren();
    [{ id: "all", label: "Todas" }, ...tableSectors].forEach((sector) => {
      const button = document.createElement("button");
      button.className = `sector-button${state.activeSector === sector.id ? " is-active" : ""}`; button.type = "button"; button.dataset.sector = sector.id; button.textContent = sector.label; button.setAttribute("aria-pressed", String(state.activeSector === sector.id));
      elements.sectorNav.append(button);
    });
  }

  function createTableButton(table, className = "table-button") {
    const button = document.createElement("button"); const isSelected = state.selectedTable === table.number;
    button.type = "button"; button.className = `${className} status-${table.status}${isSelected ? " is-selected" : ""}`; button.dataset.table = String(table.number); button.dataset.status = table.status; button.disabled = table.status !== "available";
    button.title = `Mesa ${tableLabel(table.number)} — ${tableAvailability(table)}`; button.setAttribute("aria-label", button.title); button.setAttribute("aria-pressed", String(isSelected));
    const number = document.createElement("strong"); number.textContent = tableLabel(table.number);
    const availability = document.createElement("span"); availability.className = "table-availability"; availability.textContent = tableAvailability(table, className === "overview-table");
    button.append(number, availability); return button;
  }

  function renderTables() {
    elements.tableGrid.replaceChildren();
    const visible = state.tables.filter((table) => state.activeSector === "all" || tableSector(table.number) === state.activeSector);
    const active = tableSectors.find((sector) => sector.id === state.activeSector); elements.sectorCaption.textContent = active ? active.detail : "Todas as mesas do salão";
    visible.forEach((table) => elements.tableGrid.append(createTableButton(table)));
  }

  function renderOverviewMap() {
    elements.overviewMap.replaceChildren();
    [["map-stage", "PALCO"], ["map-bar", "BAR"], ["map-kitchen", "COZINHA"], ["map-entry", "ENTRADA • BUFFET"]].forEach(([className, text]) => { const zone = document.createElement("div"); zone.className = `map-zone ${className}`; zone.textContent = text; elements.overviewMap.append(zone); });
    state.tables.forEach((table) => { const button = createTableButton(table, "overview-table"); button.style.gridColumn = String(((table.number - 1) % 10) + 1); button.style.gridRow = String(Math.floor((table.number - 1) / 10) + 2); elements.overviewMap.append(button); });
  }

  function renderAccount() {
    const user = state.config?.user; elements.account.replaceChildren(); elements.loginNext.hidden = !user?.signedIn;
    if (user?.signedIn) { const card = document.createElement("div"); card.className = "account-card"; card.innerHTML = "<p>Google conectado.</p><small>Pronto para continuar com a reserva.</small>"; elements.account.append(card); elements.accountTitle.textContent = "Google conectado"; elements.accountDescription.textContent = "Pronto. Confira seus dados e continue."; renderDetails(); return; }
    elements.accountTitle.textContent = "Conectar com Google"; elements.accountDescription.textContent = state.auth?.clientId ? "Toque no botão para continuar." : "A conexão está sendo preparada. Atualize a página em alguns segundos.";
    if (!state.auth?.clientId) return;
    const buttonMount = document.createElement("div"); buttonMount.className = "google-button-mount"; elements.account.append(buttonMount);
    if (window.google?.accounts?.id) { window.google.accounts.id.initialize({ client_id: state.auth.clientId, callback: handleGoogleCredential }); window.google.accounts.id.renderButton(buttonMount, { shape: "pill", size: "large", text: "continue_with", theme: "filled_black", width: 300 }); return; }
    const fallback = document.createElement("button"); fallback.className = "button button-secondary"; fallback.type = "button"; fallback.textContent = "Conectar com Google"; fallback.addEventListener("click", () => window.location.reload()); elements.account.append(fallback);
  }

  function renderDetails() { const user = state.config?.user; elements.detailsName.value = state.customer.name || user?.name || ""; elements.detailsEmail.value = state.customer.email || user?.email || ""; elements.detailsConsent.checked = false; elements.detailsConsent.dispatchEvent(new Event("change")); }
  function saveCustomerDetails() { const name = elements.detailsName.value.trim().replace(/\s+/g, " "); const email = elements.detailsEmail.value.trim().toLowerCase(); if (name.length < 2) { showToast("Informe seu nome completo.", "error"); return false; } if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { showToast("Informe um e-mail válido.", "error"); return false; } state.customer = { name, email }; return true; }
  function renderSelection() {
    const table = state.selectedTable ? tableByNumber(state.selectedTable) : null;
    if (!table) { elements.selectionTitle.textContent = "Selecione uma mesa no mapa"; elements.selectionDescription.textContent = "Somente mesas com ✓ Livre podem ser escolhidas."; elements.tableNext.disabled = true; return; }
    elements.selectionTitle.textContent = `Mesa ${tableLabel(table.number)} selecionada`; elements.selectionDescription.textContent = `${state.selectedSeats} lugares · ${formatCurrency(state.selectedSeats === 2 ? 10000 : 20000)} · pagamento integral via Pix.`; elements.tableNext.disabled = false;
  }
  function renderWhatsAppStep() { const table = state.selectedTable ? tableByNumber(state.selectedTable) : null; elements.whatsappSelection.textContent = table ? `Você está reservando a mesa ${tableLabel(table.number)} para ${state.selectedSeats} lugares.` : ""; }
  function renderPaymentStep() { const table = state.selectedTable ? tableByNumber(state.selectedTable) : null; elements.paymentInfo.textContent = ""; document.querySelector("#payment-summary-inline").textContent = table ? `Mesa ${tableLabel(table.number)} · ${state.selectedSeats} lugares · ${formatCurrency(state.selectedSeats === 2 ? 10000 : 20000)}.` : "Escolha uma mesa antes de gerar o Pix."; }
  function renderReservation() {
    elements.reservationPanel.replaceChildren(); if (!state.reservation) return;
    const card = document.createElement("div"); card.className = "active-reservation"; card.innerHTML = `<strong>Pedido ${escapeHtml(state.reservation.code)} — ${escapeHtml(statusText(state.reservation.status))}</strong><span>Mesa ${tableLabel(state.reservation.tableNumber)} · ${formatCurrency(state.reservation.amountCents)} · confirmação manual em até 24 horas após o pagamento.</span>`;
    if (["awaiting_payment", "receipt_submitted"].includes(state.reservation.status)) { const action = document.createElement("button"); action.type = "button"; action.className = "button button-secondary"; action.textContent = "Ver dados do Pix"; action.addEventListener("click", () => openPayment(state.reservation)); card.append(action); }
    elements.reservationPanel.append(card);
  }
  function escapeHtml(value) { const node = document.createElement("span"); node.textContent = value || ""; return node.innerHTML; }

  async function loadTables() { const payload = await request("/tables"); state.tables = payload.tables || []; renderTables(); renderOverviewMap(); }
  async function loadAuth() {
    state.auth = await fetch("/api/auth/config", { credentials: "same-origin" }).then(async (response) => { const payload = await response.json().catch(() => ({})); return response.ok ? payload : {}; });
    const config = await request("/config"); state.config = { ...config, user: config.session }; renderAccount(); renderSelection(); if (state.config.user?.signedIn) await loadExistingReservation();
  }
  async function loadExistingReservation() { const payload = await request("/reservations/me"); const latest = payload.reservations?.[0]; if (!latest || !["awaiting_payment", "receipt_submitted"].includes(latest.status)) return; const details = await request(`/reservations/${latest.id}`); state.reservation = { ...details.reservation, payment: details.payment }; renderReservation(); }
  async function handleGoogleCredential(response) {
    try { await fetch("/api/auth/google", { method: "POST", credentials: "same-origin", headers: { "content-type": "application/json" }, body: JSON.stringify({ credential: response.credential }) }).then(async (result) => { if (!result.ok) { const payload = await result.json().catch(() => ({})); throw new Error(payload.error || "Não foi possível entrar com Google."); } }); await loadAuth(); showFlowStep("details"); showToast("Google conectado.", "success"); } catch { showToast("Não foi possível conectar com Google agora. Tente novamente.", "error"); }
  }

  function selectTable(number) { const table = tableByNumber(number); if (!table || table.status !== "available") { showToast("Esta mesa já está comprada.", "error"); return; } state.selectedTable = number; renderTables(); renderOverviewMap(); renderSelection(); }
  async function reserveSelectedTable() {
    if (!state.selectedTable || !state.contactPhone || !state.customer.name || !state.customer.email) { showToast("Confira seus dados, mesa e WhatsApp antes de gerar o Pix.", "error"); return; }
    const button = document.querySelector("#payment-pix"); button.disabled = true; button.querySelector("strong").textContent = "Gerando Pix…";
    try { const payload = await request("/reservations", { method: "POST", body: JSON.stringify({ tableNumber: state.selectedTable, seats: state.selectedSeats, phone: state.contactPhone, customer: { name: state.customer.name, email: state.customer.email } }) }); state.reservation = { ...payload.reservation, payment: payload.payment }; renderReservation(); await loadTables(); openPayment(state.reservation); showToast("Pedido criado. Pague o Pix e envie o comprovante.", "success"); }
    catch (error) { showToast(error.message, "error"); await loadTables().catch(() => undefined); }
    finally { button.disabled = false; button.querySelector("strong").textContent = "Gerar QR Code Pix"; }
  }
  function openPayment(reservation) {
    state.reservation = reservation; const payment = reservation.payment; elements.paymentInfo.textContent = `Mesa ${tableLabel(reservation.tableNumber)} · ${formatCurrency(reservation.amountCents)} · Pedido ${reservation.code}`; elements.paymentQr.removeAttribute("src"); if (payment?.qrCodeDataUrl) elements.paymentQr.src = payment.qrCodeDataUrl;
    elements.pixAmountValue.textContent = payment?.amountLabel || formatCurrency(reservation.amountCents); elements.pixCodeDisplay.textContent = payment?.pixCode || ""; elements.pixKeyDisplay.textContent = payment?.pixKey || "(68) 99205-6283";
    document.querySelector("#payment-title").textContent = `Mesa ${tableLabel(reservation.tableNumber)} bloqueada por 24 horas`; document.querySelector("#order-id").textContent = reservation.code;
    document.querySelector("#whatsapp-proof").href = payment?.whatsappUrl || "#"; document.querySelector("#upload-status").textContent = reservation.expiresAt ? `Envie o comprovante até ${new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(reservation.expiresAt))}.` : "Envie o comprovante após realizar o pagamento."; elements.pixInfoBody.hidden = true; elements.pixInfoToggle.setAttribute("aria-expanded", "false"); elements.paymentDialog.showModal();
  }
  async function copyPixText(text) { try { await navigator.clipboard.writeText(text); } catch { const ta = document.createElement("textarea"); ta.value = text; document.body.append(ta); ta.select(); document.execCommand("copy"); ta.remove(); } }
  async function copyPixCode() { await copyPixText(elements.pixCodeDisplay.textContent); showToast("Código Pix copiado.", "success"); }
  async function copyPixKey() { await copyPixText(elements.pixKeyDisplay.textContent); showToast("Chave Pix copiada.", "success"); }
  function readAsDataUrl(file) { return new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = () => reject(new Error("Não foi possível ler este arquivo.")); reader.readAsDataURL(file); }); }
  async function uploadReceipt(file) {
    if (!file || !state.reservation) return; if (file.size > 4 * 1024 * 1024) { showToast("O comprovante deve ter no máximo 4 MB.", "error"); return; }
    const receiptStatus = document.querySelector("#upload-status"); receiptStatus.textContent = "Enviando comprovante…";
    try { const dataUrl = await readAsDataUrl(file); const payload = await request(`/reservations/${state.reservation.id}/receipt`, { method: "POST", body: JSON.stringify({ dataUrl, fileName: file.name, mimeType: file.type }) }); state.reservation = { ...payload.reservation, payment: state.reservation.payment }; renderReservation(); await loadTables(); receiptStatus.textContent = "Comprovante enviado. Aguarde a confirmação manual."; showToast("Comprovante enviado. A confirmação é feita em até 24h.", "success"); } catch (error) { showToast(error.message, "error"); } finally { if (!receiptStatus.textContent.includes("enviado")) receiptStatus.textContent = ""; }
  }


  

function togglePixInfo() { const expanded = elements.pixInfoToggle.getAttribute("aria-expanded") === "true"; elements.pixInfoToggle.setAttribute("aria-expanded", String(!expanded)); elements.pixInfoBody.hidden = expanded; }
  async function sharePix() {
    const shareText = `Pix para mesa ${tableLabel(state.reservation?.tableNumber || "")} — ${elements.pixAmountValue.textContent}
Código: ${elements.pixCodeDisplay.textContent}
Chave: ${elements.pixKeyDisplay.textContent}`;
    if (navigator.share) { try { await navigator.share({ title: "Pagamento Pix - Arizona Ranch", text: shareText }); return; } catch {} }
    await copyPixText(shareText); showToast("Conteúdo copiado para compartilhar.", "success"); }
  function setupOpening() {
    const btn = document.querySelector("#start-experience");
    if (btn) { btn.disabled = false; btn.textContent = "Reservar mesa"; }
    const progress = document.querySelector("#opening-progress");
    if (progress) progress.style.width = "100%";
  }
  function startExperience() {
    document.getElementById("opening-screen")?.classList.add("is-complete");
    document.body.classList.remove("is-opening");
  }
  function bindEvents() {
    document.addEventListener("click", (event) => {
      const table = event.target.closest("[data-table]"); if (table) selectTable(Number(table.dataset.table));
      const sector = event.target.closest("[data-sector]"); if (sector) { state.activeSector = sector.dataset.sector; renderSectors(); renderTables(); }
      if (event.target.closest("[data-open-map]")) elements.mapDialog.showModal(); if (event.target.closest("[data-close-map]")) elements.mapDialog.close(); if (event.target.closest("[data-close-payment]")) elements.paymentDialog.close();
    });
    document.querySelectorAll("[data-seats]").forEach((button) => button.addEventListener("click", () => { state.selectedSeats = Number(button.dataset.seats); document.querySelectorAll("[data-seats]").forEach((item) => { item.setAttribute("aria-pressed", String(item === button)); item.classList.toggle("is-selected", item === button); }); renderSelection(); }));
    elements.loginNext.addEventListener("click", () => showFlowStep("details")); elements.detailsConsent.addEventListener("change", () => { document.querySelector("#details-next").disabled = !elements.detailsConsent.checked; }); document.querySelector("#details-next").addEventListener("click", () => { if (saveCustomerDetails()) showFlowStep("table"); }); elements.tableNext.addEventListener("click", () => showFlowStep("whatsapp"));
    document.querySelector("#whatsapp-next").addEventListener("click", () => { const phone = document.querySelector("#contact-phone").value.trim(); if (phone.replace(/\D/g, "").length < 10) { showToast("Informe um WhatsApp válido com DDD.", "error"); return; } state.contactPhone = phone; showFlowStep("payment"); });
    document.querySelector("#payment-pix").addEventListener("click", reserveSelectedTable); document.querySelector("#payment-card").addEventListener("click", () => showToast("Pagamento por cartão em construção. Use Pix para finalizar agora.")); document.querySelector("#copy-pix-code-btn").addEventListener("click", copyPixCode); document.querySelector("#copy-pix-key-btn").addEventListener("click", copyPixKey); elements.pixInfoToggle.addEventListener("click", togglePixInfo); elements.pixInfoToggle.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); togglePixInfo(); } }); elements.pixShareBtn.addEventListener("click", sharePix); document.querySelector("#receipt-file").addEventListener("change", (event) => uploadReceipt(event.target.files?.[0])); document.querySelector("#start-experience")?.addEventListener("click", startExperience); }
  async function initialize() { bindEvents(); renderSectors(); renderSelection(); setupOpening(); try { await Promise.all([loadTables(), loadAuth()]); } catch (error) { showToast("Não foi possível carregar as mesas agora. Atualize a página e tente novamente.", "error"); } }
  initialize();
})();
