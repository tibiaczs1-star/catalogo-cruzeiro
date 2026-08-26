(() => {
  const API = "/api/arizona-ranch";
  const COUVERT_ARTISTICO_LABEL = "Couvert artístico: R$ 7,00";
  const CONTRACT_WHATSAPP_NUMBER = "556892260598";
  const OPENING_PRESENTATION_MAX_MS = 16500;
  const OPENING_MUSIC_READY_TIMEOUT_MS = 4200;
  const OPENING_VOICE_TEXT = "Bem-vindo ao Arizona Ranch. No dia cinco de setembro, a porteira se abre para a inauguração oficial. Entre nesta experiência e descubra o lugar onde a sua noite vai acontecer.";
  let soundscape = null;
  let openingJourneyStarted = false;
  const tableSectors = [
    { id: "entrada", label: "Entrada & buffet", detail: "Mesas 01 a 12", numbers: range(1, 12) },
    { id: "frente", label: "Frente do salão", detail: "Mesas 13 a 24", numbers: range(13, 24) },
    { id: "centro", label: "Centro do salão", detail: "Mesas 25 a 45", numbers: range(25, 45) },
    { id: "palco", label: "Próximo ao palco", detail: "Mesas 46 a 67", numbers: range(46, 67) },
  ];
  const flow = ["table", "payment"];
  const state = { activeSector: "all", config: null, flowStep: "table", reservation: null, reservationToken: window.sessionStorage.getItem("arizonaReservationToken") || "", selectedSeats: 2, selectedTable: null, tables: [] };
  const elements = {
    mapDialog: document.querySelector("#map-dialog"),
    overviewMap: document.querySelector("#full-map"), paymentDialog: document.querySelector("#payment-dialog"), paymentInfo: document.querySelector("#payment-summary"), paymentQr: document.querySelector("#pix-qr"), pixAmountValue: document.querySelector("#pix-amount-value"), pixCodeDisplay: document.querySelector("#pix-code-display"), pixKeyDisplay: document.querySelector("#pix-key-display"), pixInfoToggle: document.querySelector("#pix-info-toggle"), pixInfoBody: document.querySelector("#pix-info-body"), pixShareBtn: document.querySelector("#pix-share-btn"), reservationPanel: document.querySelector("#reservation-panel"),
    reservationFinale: document.querySelector("#reservation-finale"), finaleTable: document.querySelector("#finale-table"), finaleContinue: document.querySelector("[data-continue-payment]"), finaleBack: document.querySelector("[data-back-to-map]"),
    sectorCaption: document.querySelector("#sector-caption"), sectorNav: document.querySelector("#sector-nav"), selectionDescription: document.querySelector("#selection-description"), selectionTitle: document.querySelector("#selection-title"), tableGrid: document.querySelector("#table-grid"), tableNext: document.querySelector("#table-next"), toast: document.querySelector("#toast")
  };

  function range(start, end) { return Array.from({ length: end - start + 1 }, (_, index) => start + index); }
  function selectedAmountCents() { return state.selectedSeats === 2 ? 10000 : 20000; }
  function tableLabel(number) { return String(number).padStart(2, "0"); }
  function tableByNumber(number) { return state.tables.find((table) => table.number === number); }
  function tableSector(number) { return tableSectors.find((sector) => sector.numbers.includes(number))?.id || "centro"; }
  function tableAvailability(table, compact = false) {
    const labels = {
      available: { yes: "✓ Livre", no: "Livre", icon: "✓" },
      pending: { yes: "Pedido", no: "Pedido", icon: "!" },
      reserved: { yes: "✕ Comprada", no: "Comprada", icon: "✕" },
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
      released: "Mesa liberada",
      pre_sold: "Pré-venda",
    };
    return map[status] || "Pedido criado";
  }
  function reservationCode(reservation) { return reservation?.code || reservation?.id || ""; }
  function formatCurrency(cents) { return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100); }
  function clientContactPhone() { return state.reservation?.customer?.phone || ""; }
  function buildProofMessage(reservation = state.reservation) {
    const code = reservationCode(reservation);
    const customer = reservation?.customer || state.config?.user || {};
    const phone = clientContactPhone();
    const table = tableLabel(reservation?.tableNumber || state.selectedTable || "");
    const seats = reservation?.seats || state.selectedSeats;
    const amount = formatCurrency(reservation?.amountCents || selectedAmountCents());
    return [
      `Comprei a mesa ${table} no Arizona Ranch.`,
      "Já enviei o comprovante e este é o contato para confirmação.",
      "",
      "Evento: Inauguração Oficial do Arizona Ranch - 05 de setembro",
      code ? `Pedido: ${code}` : "",
      `Mesa: ${table}`,
      seats ? `Lugares: ${seats}` : "",
      `Valor pago: ${amount}`,
      "Couvert artístico: R$ 7,00 por pessoa",
      customer.name ? `Nome: ${customer.name}` : "",
      customer.email ? `E-mail: ${customer.email}` : "",
      phone ? `WhatsApp do cliente: ${phone}` : "",
    ].filter(Boolean).join("\n");
  }
  function buildProofWhatsAppUrl(reservation = state.reservation) {
    return `https://wa.me/${CONTRACT_WHATSAPP_NUMBER}?text=${encodeURIComponent(buildProofMessage(reservation))}`;
  }
  function wait(ms) { return new Promise((resolve) => window.setTimeout(resolve, ms)); }
  function updateWhatsAppProofLink(reservation = state.reservation) {
    const link = document.querySelector("#whatsapp-proof");
    if (link) link.href = buildProofWhatsAppUrl(reservation);
  }

  function showToast(message, tone = "normal") {
    elements.toast.textContent = message;
    elements.toast.classList.toggle("is-error", tone === "error");
    elements.toast.classList.add("is-visible"); elements.toast.hidden = false;
    window.clearTimeout(showToast.timeout);
    showToast.timeout = window.setTimeout(() => { elements.toast.classList.remove("is-visible"); elements.toast.hidden = true; }, 4200);
  }

  async function request(path, options = {}) {
    const reservationHeaders = state.reservationToken ? { "x-arizona-reservation-token": state.reservationToken } : {};
    const response = await fetch(`${API}${path}`, { credentials: "same-origin", headers: { "content-type": "application/json", ...reservationHeaders, ...(options.headers || {}) }, ...options });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || "Não foi possível concluir esta etapa.");
    return payload;
  }

  function showFlowStep(step, { scroll = true } = {}) {
    if (!flow.includes(step)) return;
    state.flowStep = step;
    document.querySelectorAll("[data-flow-step]").forEach((section) => { section.hidden = section.dataset.flowStep !== step; });
    document.querySelectorAll("[data-flow-nav]").forEach((item) => { item.classList.toggle("is-active", item.dataset.flowNav === step); item.classList.toggle("is-complete", flow.indexOf(item.dataset.flowNav) < flow.indexOf(step)); });
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

  function renderSelection() {
    const table = state.selectedTable ? tableByNumber(state.selectedTable) : null;
    if (!table) { elements.selectionTitle.textContent = "Selecione uma mesa no mapa"; elements.selectionDescription.textContent = "Somente mesas com ✓ Livre podem ser escolhidas."; elements.tableNext.disabled = true; return; }
    elements.selectionTitle.textContent = `Mesa ${tableLabel(table.number)} selecionada`; elements.selectionDescription.textContent = `${state.selectedSeats} lugares · ${formatCurrency(selectedAmountCents())} · pagamento integral via Pix. ${COUVERT_ARTISTICO_LABEL} por pessoa no evento.`; elements.tableNext.disabled = false;
  }
  function renderPaymentStep() { const table = state.selectedTable ? tableByNumber(state.selectedTable) : null; elements.paymentInfo.textContent = ""; document.querySelector("#payment-summary-inline").textContent = table ? `Mesa ${tableLabel(table.number)} · ${state.selectedSeats} lugares · ${formatCurrency(selectedAmountCents())}. ${COUVERT_ARTISTICO_LABEL} por pessoa no evento.` : "Escolha uma mesa antes de gerar o Pix."; }
  function renderReservation() {
    elements.reservationPanel.replaceChildren(); if (!state.reservation) return;
    const card = document.createElement("div"); card.className = "active-reservation"; card.dataset.status = state.reservation.status; card.innerHTML = `<strong>Pedido ${escapeHtml(reservationCode(state.reservation))} — ${escapeHtml(statusText(state.reservation.status))}</strong><span>Mesa ${tableLabel(state.reservation.tableNumber)} · ${formatCurrency(state.reservation.amountCents)} · ${COUVERT_ARTISTICO_LABEL} por pessoa · confirmação manual em até 24 horas após o pagamento.</span>`;
    if (["awaiting_payment", "receipt_submitted"].includes(state.reservation.status)) { const action = document.createElement("button"); action.type = "button"; action.className = "button button-secondary"; action.textContent = "Ver dados do Pix"; action.addEventListener("click", () => openPayment(state.reservation)); card.append(action); }
    elements.reservationPanel.append(card);
  }
  function escapeHtml(value) { const node = document.createElement("span"); node.textContent = value || ""; return node.innerHTML; }

  async function loadTables() { const payload = await request("/tables"); state.tables = payload.tables || []; renderTables(); renderOverviewMap(); }
  async function loadConfig() { state.config = await request("/config"); renderSelection(); }

  function selectTable(number) { const table = tableByNumber(number); if (!table || table.status !== "available") { showToast("Esta mesa já está comprada.", "error"); return; } state.selectedTable = number; renderTables(); renderOverviewMap(); renderSelection(); }
  async function reserveSelectedTable() {
    if (!state.selectedTable) { showToast("Escolha uma mesa antes de gerar o Pix.", "error"); return; }
    const button = document.querySelector("#payment-pix"); button.disabled = true; button.querySelector("strong").textContent = "Gerando Pix…";
    try { const payload = await request("/reservations", { method: "POST", body: JSON.stringify({ tableNumber: state.selectedTable, seats: state.selectedSeats, amountCents: selectedAmountCents(), customer: { name: "Cliente Arizona Ranch", email: "" } }) }); state.reservationToken = payload.accessToken || ""; if (state.reservationToken) window.sessionStorage.setItem("arizonaReservationToken", state.reservationToken); state.reservation = { ...payload.reservation, payment: payload.payment }; renderReservation(); await loadTables(); openPayment(state.reservation); showToast("Pedido criado. Pague o Pix e envie o comprovante.", "success"); }
    catch (error) { showToast(error.message, "error"); await loadTables().catch(() => undefined); }
    finally { button.disabled = false; button.querySelector("strong").textContent = "Gerar QR Code Pix"; }
  }
  function openPayment(reservation) {
    state.reservation = reservation; const payment = reservation.payment || {}; const qrSrc = payment.qrCodeDataUrl || ""; const code = reservationCode(reservation); elements.paymentInfo.textContent = `Mesa ${tableLabel(reservation.tableNumber)} · ${formatCurrency(reservation.amountCents)} · Pedido ${code}`; elements.paymentQr.removeAttribute("src"); if (qrSrc) elements.paymentQr.src = qrSrc;
    elements.pixAmountValue.textContent = payment.amountLabel || formatCurrency(reservation.amountCents); elements.pixCodeDisplay.textContent = payment.pixCode || ""; elements.pixKeyDisplay.textContent = payment.pixKey || "";
    document.querySelector("#payment-title").textContent = `Mesa ${tableLabel(reservation.tableNumber)} bloqueada por 24 horas`; document.querySelector("#order-id").textContent = code;
    updateWhatsAppProofLink(reservation);
    const uploadStatus = document.querySelector("#upload-status"); if (uploadStatus) uploadStatus.textContent = reservation.expiresAt ? `Envie o comprovante até ${new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(reservation.expiresAt))}.` : "Envie o comprovante após realizar o pagamento."; elements.pixInfoBody.hidden = true; elements.pixInfoToggle.setAttribute("aria-expanded", "false"); elements.paymentDialog.showModal();
  }
  async function copyPixText(text) { try { await navigator.clipboard.writeText(text); } catch { const ta = document.createElement("textarea"); ta.value = text; document.body.append(ta); ta.select(); document.execCommand("copy"); ta.remove(); } }
  async function copyPixCode() { await copyPixText(elements.pixCodeDisplay.textContent); showToast("Código Pix copiado.", "success"); }
  async function copyPixKey() { await copyPixText(elements.pixKeyDisplay.textContent); showToast("Chave Pix copiada.", "success"); }
  function readAsDataUrl(file) { return new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = () => reject(new Error("Não foi possível ler este arquivo.")); reader.readAsDataURL(file); }); }
  async function uploadReceipt(file) {
    if (!file || !state.reservation) return; if (file.size > 4 * 1024 * 1024) { showToast("O comprovante deve ter no máximo 4 MB.", "error"); return; }
    const receiptStatus = document.querySelector("#upload-status"); receiptStatus.textContent = "Enviando comprovante…";
    try { const dataUrl = await readAsDataUrl(file); const payload = await request(`/reservations/${state.reservation.id}/receipt`, { method: "POST", body: JSON.stringify({ dataUrl, fileName: file.name, mimeType: file.type }) }); state.reservation = { ...payload.reservation, payment: state.reservation.payment }; renderReservation(); await loadTables(); updateWhatsAppProofLink(state.reservation); receiptStatus.textContent = "Comprovante enviado. Sua confirmação segue pelo WhatsApp."; showToast("Comprovante enviado com segurança.", "success"); elements.paymentDialog.close(); window.ArizonaEpisodes?.completePurchase?.(); } catch (error) { showToast(error.message, "error"); } finally { if (!receiptStatus.textContent.includes("enviado")) receiptStatus.textContent = ""; }
  }


  

function togglePixInfo() { const expanded = elements.pixInfoToggle.getAttribute("aria-expanded") === "true"; elements.pixInfoToggle.setAttribute("aria-expanded", String(!expanded)); elements.pixInfoBody.hidden = expanded; }
  async function sharePix() {
    const shareText = `Pix para mesa ${tableLabel(state.reservation?.tableNumber || "")} — ${elements.pixAmountValue.textContent}
Código: ${elements.pixCodeDisplay.textContent}
Chave: ${elements.pixKeyDisplay.textContent}`;
    if (navigator.share) { try { await navigator.share({ title: "Pagamento Pix - Arizona Ranch", text: shareText }); return; } catch {} }
    await copyPixText(shareText); showToast("Conteúdo copiado para compartilhar.", "success"); }
  function setupOpening() {
    const openingButton = document.querySelector("#start-experience");
    const openingVideos = Array.from(document.querySelectorAll("[data-opening-video]"));
    const openingVoice = document.querySelector("#opening-voice");
    if (openingButton) { openingButton.disabled = false; openingButton.textContent = "Entrar no Arizona"; }
    openingVideos.forEach((openingVideo) => {
      openingVideo.muted = true;
      openingVideo.volume = 0;
      openingVideo.load();
    });
    if (openingVoice) openingVoice.load();
  }
  function setupGallery() {
    const dialog = document.querySelector("#gallery-dialog");
    const image = document.querySelector("#gallery-dialog-image");
    const caption = document.querySelector("#gallery-dialog-caption");
    const cards = Array.from(document.querySelectorAll(".gallery-card"));
    if (!dialog || !image || !cards.length) return;
    let activeCards = cards;
    let currentIndex = 0;
    const showImage = (index) => {
      currentIndex = (index + activeCards.length) % activeCards.length;
      const source = activeCards[currentIndex].querySelector("img");
      image.src = source.src;
      image.alt = source.alt;
      if (caption) caption.textContent = activeCards[currentIndex].querySelector("span")?.textContent || source.alt;
    };
    cards.forEach((card) => card.addEventListener("click", () => {
      const gallery = card.closest(".editorial-gallery");
      activeCards = Array.from(gallery?.querySelectorAll(".gallery-card") || [card]);
      showImage(activeCards.indexOf(card));
      dialog.showModal();
    }));
    dialog.querySelector("[data-close-gallery]")?.addEventListener("click", () => dialog.close());
    dialog.querySelector("[data-gallery-prev]")?.addEventListener("click", () => showImage(currentIndex - 1));
    dialog.querySelector("[data-gallery-next]")?.addEventListener("click", () => showImage(currentIndex + 1));
    dialog.addEventListener("click", (event) => { if (event.target === dialog) dialog.close(); });
    document.addEventListener("keydown", (event) => {
      if (!dialog.open) return;
      if (event.key === "ArrowLeft") showImage(currentIndex - 1);
      if (event.key === "ArrowRight") showImage(currentIndex + 1);
    });
  }
  function setupEventCountdown() {
    const countdown = document.querySelector(".event-countdown");
    if (!countdown) return;
    const eventDate = new Date(countdown.dataset.eventDate).getTime();
    const fields = {
      days: countdown.querySelector("[data-countdown-days]"),
      hours: countdown.querySelector("[data-countdown-hours]"),
      minutes: countdown.querySelector("[data-countdown-minutes]"),
    };
    const update = () => {
      const remaining = Math.max(0, eventDate - Date.now());
      const totalMinutes = Math.floor(remaining / 60000);
      fields.days.textContent = String(Math.floor(totalMinutes / 1440)).padStart(2, "0");
      fields.hours.textContent = String(Math.floor((totalMinutes % 1440) / 60)).padStart(2, "0");
      fields.minutes.textContent = String(totalMinutes % 60).padStart(2, "0");
      countdown.classList.toggle("is-today", remaining === 0);
    };
    update();
    window.setInterval(update, 30000);
  }
  function setupCinematicScroll() {
    const progress = document.querySelector("#trail-progress");
    const heroImage = document.querySelector(".sales-hero-image");
    const props = document.querySelectorAll(".decor-prop");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const scenes = document.querySelectorAll(".story-section,.ranch-moment,.gallery-section,.offer-section,.how-section,.faq-section,#mapa-de-mesas,.western-scene,.event-countdown");
    scenes.forEach((scene) => scene.classList.add("reveal-scene"));
    if ("IntersectionObserver" in window && !reducedMotion) {
      const observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
        if (entry.isIntersecting) { entry.target.classList.add("is-visible"); observer.unobserve(entry.target); }
      }), { threshold: .12, rootMargin: "0px 0px -6%" });
      scenes.forEach((scene) => observer.observe(scene));
    } else scenes.forEach((scene) => scene.classList.add("is-visible"));
    let ticking = false;
    const render = () => {
      const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      if (progress) progress.style.transform = `scaleX(${Math.min(1, window.scrollY / maxScroll)})`;
      if (!reducedMotion) {
        const offset = Math.min(42, window.scrollY * .045);
        if (heroImage) heroImage.style.transform = `scale(1.035) translate3d(0,${offset}px,0)`;
        props.forEach((prop, index) => prop.style.setProperty("--prop-drift", `${(index ? -1 : 1) * Math.max(-14, 14 - window.scrollY * .008)}px`));
      }
      ticking = false;
    };
    window.addEventListener("scroll", () => { if (!ticking) { ticking = true; window.requestAnimationFrame(render); } }, { passive: true });
    render();
  }

  function closeReservationFinale() {
    if (!elements.reservationFinale) return;
    elements.reservationFinale.classList.remove("is-visible");
    elements.reservationFinale.setAttribute("aria-hidden", "true");
    document.body.classList.remove("is-finale");
    window.setTimeout(() => { elements.reservationFinale.hidden = true; }, 520);
  }

  function openReservationFinale() {
    if (!state.selectedTable) {
      showToast("Escolha uma mesa livre para continuar.", "error");
      return;
    }
    if (elements.finaleTable) {
      elements.finaleTable.textContent = `Mesa ${tableLabel(state.selectedTable)} · ${state.selectedSeats} lugares · ${formatCurrency(selectedAmountCents())}`;
    }
    elements.reservationFinale.hidden = false;
    elements.reservationFinale.setAttribute("aria-hidden", "false");
    document.body.classList.add("is-finale");
    window.requestAnimationFrame(() => elements.reservationFinale.classList.add("is-visible"));
    window.ArizonaSoundscapeInstance?.playScene?.("finale");
    window.ArizonaSoundscapeInstance?.playSceneNarration?.("finale", "/pagamentos/reservaranch/assets/voice/scene-finale.mp3");
  }

  function continueFromFinale() {
    closeReservationFinale();
    showFlowStep("payment");
  }

  async function startExperience() {
    if (openingJourneyStarted) return;
    openingJourneyStarted = true;
    const openingButton = document.querySelector("#start-experience");
    const openingVideos = Array.from(document.querySelectorAll("[data-opening-video]"));
    const openingVideo = openingVideos.find((video) => window.getComputedStyle(video).display !== "none") || openingVideos[0];
    const openingVoice = document.querySelector("#opening-voice");
    const openingScreen = document.getElementById("opening-screen");
    openingScreen?.classList.add("is-live");
    if (openingButton) openingButton.disabled = true;
    openingVideos.forEach((video) => {
      video.muted = true;
      video.volume = 0;
      if (video !== openingVideo) video.pause();
    });
    if (openingVideo) {
      // O MP4 possui uma narração própria. Mantê-lo mudo evita sobrepor
      // essa voz à narradora oficial reproduzida pelo soundscape.
      openingVideo.muted = true;
      openingVideo.volume = 0;
      const videoPlay = openingVideo.play();
      await Promise.race([videoPlay, wait(850)]).catch(() => {});
    }
    const createSoundscape = window.ArizonaSoundscape?.createSoundscape;
    soundscape ||= createSoundscape?.({ voice: openingVoice });
    window.ArizonaSoundscapeInstance = soundscape;
    const openingDuration = soundscape?.hasPlayedIntro?.() ? OPENING_MUSIC_READY_TIMEOUT_MS : OPENING_PRESENTATION_MAX_MS;
    if (soundscape) soundscape.start().catch(() => {});
    window.setTimeout(() => {
      openingScreen?.classList.add("is-leaving");
      window.ArizonaEpisodes?.begin?.();
      window.setTimeout(() => openingScreen?.remove(), 900);
    }, openingDuration);
  }
  function bindEvents() {
    document.addEventListener("click", (event) => {
      const table = event.target.closest("[data-table]"); if (table) selectTable(Number(table.dataset.table));
      const sector = event.target.closest("[data-sector]"); if (sector) { state.activeSector = sector.dataset.sector; renderSectors(); renderTables(); }
      if (event.target.closest("[data-open-map]")) elements.mapDialog.showModal(); if (event.target.closest("[data-close-map]")) elements.mapDialog.close(); if (event.target.closest("[data-close-payment]")) elements.paymentDialog.close();
    });
    document.querySelectorAll("[data-seats]").forEach((button) => button.addEventListener("click", () => { state.selectedSeats = Number(button.dataset.seats); document.querySelectorAll("[data-seats]").forEach((item) => { item.setAttribute("aria-pressed", String(item === button)); item.classList.toggle("is-selected", item === button); }); renderSelection(); }));
    elements.tableNext.addEventListener("click", openReservationFinale);
    elements.finaleContinue?.addEventListener("click", continueFromFinale); elements.finaleBack?.addEventListener("click", closeReservationFinale);
    document.addEventListener("keydown", (event) => { if (event.key === "Escape" && !elements.reservationFinale?.hidden) closeReservationFinale(); });
    document.querySelector("#payment-pix").addEventListener("click", reserveSelectedTable); document.querySelector("#payment-card").addEventListener("click", () => showToast("Pagamento por cartão em construção. Use Pix para finalizar agora.")); document.querySelector("#copy-pix-code-btn").addEventListener("click", copyPixCode); document.querySelector("#copy-pix-key-btn").addEventListener("click", copyPixKey); elements.pixInfoToggle.addEventListener("click", togglePixInfo); elements.pixInfoToggle.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); togglePixInfo(); } }); elements.pixShareBtn.addEventListener("click", sharePix); document.querySelector("#receipt-file")?.addEventListener("change", (event) => uploadReceipt(event.target.files?.[0])); document.querySelector("#start-experience")?.addEventListener("click", startExperience); }
  async function initialize() { bindEvents(); renderSectors(); renderSelection(); setupEventCountdown(); setupCinematicScroll(); setupOpening(); setupGallery(); window.requestAnimationFrame(() => window.ArizonaCinematic?.createCinematic().catch(() => {})); try { await Promise.all([loadTables(), loadConfig()]); } catch (error) { showToast("Não foi possível carregar as mesas agora. Atualize a página e tente novamente.", "error"); } }
  initialize();
})();
