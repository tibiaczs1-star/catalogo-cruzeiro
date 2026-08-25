(() => {
  const API = "/api/arizona-ranch";
  const COUVERT_ARTISTICO_LABEL = "Couvert artístico: R$ 7,00";
  const CONTRACT_WHATSAPP_NUMBER = "556892260598";
  const YOUTUBE_MUSIC_VIDEO_ID = "CxKRaR6kFYs";
  const OPENING_MUSIC_PRESENTATION_VOLUME = 18;
  const RESERVATION_MUSIC_VOLUME = 38;
  const OPENING_PRESENTATION_MAX_MS = 16500;
  const OPENING_MUSIC_READY_TIMEOUT_MS = 4200;
  const OPENING_VOICE_TEXT = "Bem-vindo à reserva de mesas do Arizona Ranch. Dia cinco de setembro, a porteira se abre para a inauguração oficial, com a voz de Luzienne Lucena. Escolha sua mesa, faça seu Pix e envie o comprovante. Arizona Ranch: sua noite começa aqui.";
  let openingMusicPlayer = null;
  let openingMusicReady = null;
  let openingMusicError = null;
  let openingMusicResolve = null;
  let openingMusicReject = null;
  let openingMusicStartedResolve = null;
  let openingMusicIsReady = false;
  let openingMusicLoadTimedOut = false;
  const PIX_PAYMENT_OPTIONS = {
    10000: {
      amountLabel: "R$ 100,00",
      pixKey: "(68) 99205-6283",
      qrCodeImage: "/pagamentos/reservaranch/assets/pix-arizona-100.png",
      pixCode: "00020126530014br.gov.bcb.pix0114+55689920562830213Arizona Ranch5204000053039865406100.005802BR5920SILEN DE PAULO SOUZA6014RIO DE JANEIRO62070503***63042013",
    },
    20000: {
      amountLabel: "R$ 200,00",
      pixKey: "(68) 99205-6283",
      qrCodeImage: "/pagamentos/reservaranch/assets/pix-arizona-200.png",
      pixCode: "00020126530014br.gov.bcb.pix0114+55689920562830213Arizona Ranch5204000053039865406200.005802BR5920SILEN DE PAULO SOUZA6014RIO DE JANEIRO62070503***63048038",
    },
  };
  const tableSectors = [
    { id: "entrada", label: "Entrada & buffet", detail: "Mesas 01 a 12", numbers: range(1, 12) },
    { id: "frente", label: "Frente do salão", detail: "Mesas 13 a 24", numbers: range(13, 24) },
    { id: "centro", label: "Centro do salão", detail: "Mesas 25 a 45", numbers: range(25, 45) },
    { id: "palco", label: "Próximo ao palco", detail: "Mesas 46 a 67", numbers: range(46, 67) },
  ];
  const flow = ["table", "login", "payment"];
  const state = { activeSector: "all", auth: null, config: null, flowStep: "table", reservation: null, selectedSeats: 2, selectedTable: null, tables: [] };
  const elements = {
    account: document.querySelector("#google-login"), accountDescription: document.querySelector("#account-description"), accountTitle: document.querySelector("#account-title"),
    loginNext: document.querySelector("#login-next"), mapDialog: document.querySelector("#map-dialog"),
    overviewMap: document.querySelector("#full-map"), paymentDialog: document.querySelector("#payment-dialog"), paymentInfo: document.querySelector("#payment-summary"), paymentQr: document.querySelector("#pix-qr"), pixAmountValue: document.querySelector("#pix-amount-value"), pixCodeDisplay: document.querySelector("#pix-code-display"), pixKeyDisplay: document.querySelector("#pix-key-display"), pixInfoToggle: document.querySelector("#pix-info-toggle"), pixInfoBody: document.querySelector("#pix-info-body"), pixShareBtn: document.querySelector("#pix-share-btn"), reservationPanel: document.querySelector("#reservation-panel"),
    sectorCaption: document.querySelector("#sector-caption"), sectorNav: document.querySelector("#sector-nav"), selectionDescription: document.querySelector("#selection-description"), selectionTitle: document.querySelector("#selection-title"), tableGrid: document.querySelector("#table-grid"), tableNext: document.querySelector("#table-next"), toast: document.querySelector("#toast")
  };

  function range(start, end) { return Array.from({ length: end - start + 1 }, (_, index) => start + index); }
  function selectedAmountCents() { return state.selectedSeats === 2 ? 10000 : 20000; }
  function pixForAmount(amountCents) { return PIX_PAYMENT_OPTIONS[Number(amountCents)] || null; }
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
  function setOpeningMusicVolume(volume) { if (!openingMusicPlayer?.setVolume) return; const safeVolume = Math.max(0, Math.min(100, volume)); openingMusicPlayer.setVolume(safeVolume); }
  function ensureOpeningMusicPlayer() {
    if (!document.querySelector("#opening-player")) {
      openingMusicIsReady = false;
      return Promise.reject(new Error("Player de música não encontrado."));
    }
    if (openingMusicPlayer) return openingMusicReady;
    openingMusicReady = new Promise((resolve, reject) => {
      openingMusicResolve = resolve;
      openingMusicReject = reject;
    });
    const createPlayer = () => {
      if (openingMusicPlayer || !window.YT?.Player) return;
      openingMusicPlayer = new window.YT.Player("opening-player", {
        height: "90",
        width: "160",
        videoId: YOUTUBE_MUSIC_VIDEO_ID,
        playerVars: {
          autoplay: 0,
          controls: 0,
          loop: 1,
          modestbranding: 1,
          origin: window.location.origin,
          playlist: YOUTUBE_MUSIC_VIDEO_ID,
          playsinline: 1,
          rel: 0,
        },
        events: {
          onReady: (event) => {
            event.target.setVolume(OPENING_MUSIC_PRESENTATION_VOLUME);
            event.target.cueVideoById(YOUTUBE_MUSIC_VIDEO_ID);
            event.target.getIframe?.()?.setAttribute("allow", "autoplay; encrypted-media; picture-in-picture");
            openingMusicIsReady = true;
            openingMusicResolve?.(event.target);
          },
          onStateChange: (event) => {
            const state = window.YT?.PlayerState;
            if (!state) return;
            if (event.data === state.PLAYING || event.data === state.BUFFERING) {
              openingMusicStartedResolve?.();
              openingMusicStartedResolve = null;
            }
          },
          onError: () => {
            openingMusicIsReady = false;
            openingMusicError = new Error("A trilha do YouTube não carregou.");
            openingMusicReject?.(openingMusicError);
          },
        },
      });
    };
    if (window.YT?.Player) createPlayer();
    else {
      const previousYouTubeReady = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (typeof previousYouTubeReady === "function") previousYouTubeReady();
        createPlayer();
      };
    }
    return openingMusicReady;
  }
  async function startOpeningMusic() {
    if (openingMusicError) throw openingMusicError;
    if (!openingMusicIsReady || !openingMusicPlayer) throw new Error("A trilha ainda não terminou de carregar.");
    const player = openingMusicPlayer;
    openingMusicStartedResolve = null;
    player.unMute?.();
    setOpeningMusicVolume(OPENING_MUSIC_PRESENTATION_VOLUME);
    player.playVideo?.();
    const stateNow = typeof player.getPlayerState === "function" ? player.getPlayerState() : null;
    if (window.YT?.PlayerState && stateNow !== window.YT.PlayerState.PLAYING && stateNow !== window.YT.PlayerState.BUFFERING) {
      await Promise.race([
        new Promise((resolve) => { openingMusicStartedResolve = resolve; }),
        wait(6000).then(() => { throw new Error("A música não iniciou."); }),
      ]);
    }
  }
  function playBrowserVoice() {
    if (!("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window)) return Promise.resolve();
    return new Promise((resolve) => {
      const utterance = new SpeechSynthesisUtterance(OPENING_VOICE_TEXT);
      utterance.lang = "pt-BR";
      utterance.rate = 0.88;
      utterance.pitch = 0.72;
      utterance.volume = 1;
      utterance.onend = resolve;
      utterance.onerror = resolve;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    });
  }
  function playOpeningVoice(openingVoice) {
    if (!openingVoice) return playBrowserVoice();
    openingVoice.currentTime = 0;
    openingVoice.volume = 1;
    return new Promise((resolve) => {
      const cleanup = () => {
        openingVoice.removeEventListener("ended", onDone);
        openingVoice.removeEventListener("error", onError);
        window.clearTimeout(timeout);
      };
      const onDone = () => {
        cleanup();
        resolve();
      };
      const onError = () => {
        cleanup();
        playBrowserVoice().then(resolve);
      };
      const timeout = window.setTimeout(onDone, 22000);
      openingVoice.addEventListener("ended", onDone, { once: true });
      openingVoice.addEventListener("error", onError, { once: true });
      openingVoice.play().catch(onError);
    });
  }
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
    if (step === "payment") renderPaymentStep();
    if (step === "table") setOpeningMusicVolume(RESERVATION_MUSIC_VOLUME);
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
    if (user?.signedIn) { const card = document.createElement("div"); card.className = "account-card"; card.innerHTML = `<p>Google conectado.</p><small>${escapeHtml(user.name || user.email || "Identidade confirmada")} · pronto para pagar.</small>`; elements.account.append(card); elements.accountTitle.textContent = "Google conectado"; elements.accountDescription.textContent = "Sua mesa está escolhida. Continue para gerar o Pix."; return; }
    elements.accountTitle.textContent = "Conectar com Google"; elements.accountDescription.textContent = state.auth?.clientId ? "Toque no botão para continuar." : "A conexão está sendo preparada. Atualize a página em alguns segundos.";
    if (!state.auth?.clientId) return;
    const buttonMount = document.createElement("div"); buttonMount.className = "google-button-mount"; elements.account.append(buttonMount);
    if (window.google?.accounts?.id) { window.google.accounts.id.initialize({ client_id: state.auth.clientId, callback: handleGoogleCredential }); window.google.accounts.id.renderButton(buttonMount, { shape: "pill", size: "large", text: "continue_with", theme: "filled_black", width: 300 }); return; }
    const fallback = document.createElement("button"); fallback.className = "button button-secondary"; fallback.type = "button"; fallback.textContent = "Conectar com Google"; fallback.addEventListener("click", () => window.location.reload()); elements.account.append(fallback);
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
  async function loadAuth() {
    state.auth = await fetch("/api/auth/config", { credentials: "same-origin" }).then(async (response) => { const payload = await response.json().catch(() => ({})); return response.ok ? payload : {}; });
    const config = await request("/config"); state.config = { ...config, user: config.session }; renderAccount(); renderSelection(); if (state.config.user?.signedIn) await loadExistingReservation();
  }
  async function loadExistingReservation() { const payload = await request("/reservations/me"); const latest = payload.reservations?.[0]; if (!latest || !["awaiting_payment", "receipt_submitted"].includes(latest.status)) return; const details = await request(`/reservations/${latest.id}`); state.reservation = { ...details.reservation, payment: details.payment }; renderReservation(); }
  async function handleGoogleCredential(response) {
    try { await fetch("/api/auth/google", { method: "POST", credentials: "same-origin", headers: { "content-type": "application/json" }, body: JSON.stringify({ credential: response.credential }) }).then(async (result) => { if (!result.ok) { const payload = await result.json().catch(() => ({})); throw new Error(payload.error || "Não foi possível entrar com Google."); } }); await loadAuth(); showFlowStep("payment"); showToast("Google conectado. Agora é só gerar o Pix.", "success"); } catch { showToast("Não foi possível conectar com Google agora. Tente novamente.", "error"); }
  }

  function selectTable(number) { const table = tableByNumber(number); if (!table || table.status !== "available") { showToast("Esta mesa já está comprada.", "error"); return; } state.selectedTable = number; renderTables(); renderOverviewMap(); renderSelection(); }
  async function reserveSelectedTable() {
    const user = state.config?.user;
    if (!state.selectedTable || !user?.signedIn || !user.name || !user.email) { showToast("Escolha uma mesa e conecte com Google antes de gerar o Pix.", "error"); return; }
    const button = document.querySelector("#payment-pix"); button.disabled = true; button.querySelector("strong").textContent = "Gerando Pix…";
    try { const payload = await request("/reservations", { method: "POST", body: JSON.stringify({ tableNumber: state.selectedTable, seats: state.selectedSeats, amountCents: selectedAmountCents(), customer: { name: user.name, email: user.email } }) }); state.reservation = { ...payload.reservation, payment: payload.payment }; renderReservation(); await loadTables(); openPayment(state.reservation); showToast("Pedido criado. Pague o Pix e envie o comprovante.", "success"); }
    catch (error) { showToast(error.message, "error"); await loadTables().catch(() => undefined); }
    finally { button.disabled = false; button.querySelector("strong").textContent = "Gerar QR Code Pix"; }
  }
  function openPayment(reservation) {
    state.reservation = reservation; const payment = reservation.payment; const pixOption = pixForAmount(reservation.amountCents); const qrSrc = pixOption?.qrCodeImage || payment?.qrCodeDataUrl || ""; const code = reservationCode(reservation); elements.paymentInfo.textContent = `Mesa ${tableLabel(reservation.tableNumber)} · ${formatCurrency(reservation.amountCents)} · Pedido ${code}`; elements.paymentQr.removeAttribute("src"); if (qrSrc) elements.paymentQr.src = qrSrc;
    elements.pixAmountValue.textContent = pixOption?.amountLabel || payment?.amountLabel || formatCurrency(reservation.amountCents); elements.pixCodeDisplay.textContent = pixOption?.pixCode || payment?.pixCode || ""; elements.pixKeyDisplay.textContent = pixOption?.pixKey || payment?.pixKey || "(68) 99205-6283";
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
    try { const dataUrl = await readAsDataUrl(file); const payload = await request(`/reservations/${state.reservation.id}/receipt`, { method: "POST", body: JSON.stringify({ dataUrl, fileName: file.name, mimeType: file.type }) }); state.reservation = { ...payload.reservation, payment: state.reservation.payment }; renderReservation(); await loadTables(); const whatsappUrl = buildProofWhatsAppUrl(state.reservation); updateWhatsAppProofLink(state.reservation); receiptStatus.textContent = "Comprovante enviado. Abrindo WhatsApp com a mensagem pronta…"; showToast("Comprovante enviado. Confirme agora pelo WhatsApp.", "success"); window.setTimeout(() => { window.location.href = whatsappUrl; }, 250); } catch (error) { showToast(error.message, "error"); } finally { if (!receiptStatus.textContent.includes("enviado")) receiptStatus.textContent = ""; }
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
    const openingVideo = document.querySelector("#opening-video");
    const openingVoice = document.querySelector("#opening-voice");
    if (openingVideo) {
      openingVideo.muted = true;
      openingVideo.volume = 0;
      openingVideo.load();
      openingVideo.pause();
      openingVideo.currentTime = 0;
    }
    if (openingVoice) openingVoice.load();
    const progress = document.querySelector("#opening-progress");
    if (openingButton) { openingButton.disabled = true; openingButton.textContent = "Preparando a entrada…"; }
    if (progress) progress.style.width = "72%";
    const releaseStart = () => {
      if (openingButton) { openingButton.disabled = false; openingButton.textContent = "Entrar no Arizona"; }
      if (progress) progress.style.width = "100%";
    };
    const fallbackTimer = window.setTimeout(() => {
      openingMusicLoadTimedOut = true;
      releaseStart();
    }, OPENING_MUSIC_READY_TIMEOUT_MS);
    ensureOpeningMusicPlayer()
      .then(() => {
        window.clearTimeout(fallbackTimer);
        releaseStart();
      })
      .catch(() => {
        window.clearTimeout(fallbackTimer);
        openingMusicLoadTimedOut = true;
        releaseStart();
      });
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
  function setupRanchSound() {
    let context;
    let ambience;
    let ambienceGain;
    let cowTimer;
    let started = false;
    const createNoise = (seconds) => {
      const buffer = context.createBuffer(1, context.sampleRate * seconds, context.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i += 1) data[i] = Math.random() * 2 - 1;
      return buffer;
    };
    const playWesternCue = () => {
      const source = context.createBufferSource();
      const gain = context.createGain();
      const filter = context.createBiquadFilter();
      source.buffer = createNoise(.22); filter.type = "highpass"; filter.frequency.value = 520;
      gain.gain.setValueAtTime(.17, context.currentTime); gain.gain.exponentialRampToValueAtTime(.001, context.currentTime + .22);
      source.connect(filter).connect(gain).connect(context.destination); source.start();
    };
    const playHoofbeats = () => {
      [0, .19, .43, .62].forEach((delay, index) => {
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.type = "triangle";
        oscillator.frequency.setValueAtTime(index % 2 ? 82 : 96, context.currentTime + delay);
        gain.gain.setValueAtTime(.001, context.currentTime + delay);
        gain.gain.linearRampToValueAtTime(.045, context.currentTime + delay + .018);
        gain.gain.exponentialRampToValueAtTime(.001, context.currentTime + delay + .12);
        oscillator.connect(gain).connect(context.destination);
        oscillator.start(context.currentTime + delay); oscillator.stop(context.currentTime + delay + .13);
      });
    };
    const playDistantMoo = () => {
      if (!context || context.state !== "running") return;
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const filter = context.createBiquadFilter();
      oscillator.type = "sawtooth"; oscillator.frequency.setValueAtTime(112, context.currentTime); oscillator.frequency.exponentialRampToValueAtTime(78, context.currentTime + 1.45);
      filter.type = "lowpass"; filter.frequency.value = 420;
      gain.gain.setValueAtTime(.001, context.currentTime); gain.gain.linearRampToValueAtTime(.025, context.currentTime + .32); gain.gain.exponentialRampToValueAtTime(.001, context.currentTime + 1.7);
      oscillator.connect(filter).connect(gain).connect(context.destination); oscillator.start(); oscillator.stop(context.currentTime + 1.75);
    };
    const start = async () => {
      if (started) return;
      started = true;
      context ||= new (window.AudioContext || window.webkitAudioContext)(); await context.resume();
      ambience = context.createBufferSource(); ambienceGain = context.createGain(); const filter = context.createBiquadFilter();
      ambience.buffer = createNoise(8); ambience.loop = true; ambienceGain.gain.value = .018; filter.type = "lowpass"; filter.frequency.value = 950;
      ambience.connect(filter).connect(ambienceGain).connect(context.destination); ambience.start(); playWesternCue(); playHoofbeats(); window.setTimeout(playDistantMoo, 1200); cowTimer = window.setInterval(playDistantMoo, 14000);
    };
    window.startRanchAmbience = start;
  }
  async function startExperience() {
    const openingButton = document.querySelector("#start-experience");
    const openingVideo = document.querySelector("#opening-video");
    const openingVoice = document.querySelector("#opening-voice");
    const openingScreen = document.getElementById("opening-screen");
    if (openingButton) { openingButton.disabled = true; openingButton.textContent = "Apresentando o Arizona Ranch…"; }
    try {
      window.startRanchAmbience?.();
      openingScreen?.classList.add("is-live");
      if (openingVideo) {
        openingVideo.muted = false;
        openingVideo.volume = .52;
        openingVideo.playsInline = true;
        const videoPlay = openingVideo.play();
        videoPlay.catch((error) => {
          console.info("Vídeo de abertura seguindo sem bloquear a reserva.", error);
        });
        await Promise.race([videoPlay, wait(850)]).catch(() => {});
      }
      await Promise.race([
        playOpeningVoice(openingVoice),
        wait(OPENING_PRESENTATION_MAX_MS),
      ]);
    } catch {
      showToast("A apresentação não iniciou completa, mas a reserva foi liberada.", "error");
    }
    if (openingButton) openingButton.textContent = "Iniciando trilha…";
    try {
      await startOpeningMusic();
    } catch (error) {
      openingMusicLoadTimedOut = true;
      if (!openingMusicIsReady && !openingMusicError) {
        console.info("Abertura seguindo sem bloquear pela trilha externa.", error);
      }
    }
    window.setTimeout(() => {
      openingScreen?.classList.add("is-complete");
      document.body.classList.remove("is-opening");
    }, 240);
  }
  function bindEvents() {
    document.addEventListener("click", (event) => {
      const table = event.target.closest("[data-table]"); if (table) selectTable(Number(table.dataset.table));
      const sector = event.target.closest("[data-sector]"); if (sector) { state.activeSector = sector.dataset.sector; renderSectors(); renderTables(); }
      if (event.target.closest("[data-open-map]")) elements.mapDialog.showModal(); if (event.target.closest("[data-close-map]")) elements.mapDialog.close(); if (event.target.closest("[data-close-payment]")) elements.paymentDialog.close();
    });
    document.querySelectorAll("[data-seats]").forEach((button) => button.addEventListener("click", () => { state.selectedSeats = Number(button.dataset.seats); document.querySelectorAll("[data-seats]").forEach((item) => { item.setAttribute("aria-pressed", String(item === button)); item.classList.toggle("is-selected", item === button); }); renderSelection(); }));
    elements.loginNext.addEventListener("click", () => showFlowStep("payment")); elements.tableNext.addEventListener("click", () => showFlowStep(state.config?.user?.signedIn ? "payment" : "login"));
    document.querySelector("#payment-pix").addEventListener("click", reserveSelectedTable); document.querySelector("#payment-card").addEventListener("click", () => showToast("Pagamento por cartão em construção. Use Pix para finalizar agora.")); document.querySelector("#copy-pix-code-btn").addEventListener("click", copyPixCode); document.querySelector("#copy-pix-key-btn").addEventListener("click", copyPixKey); elements.pixInfoToggle.addEventListener("click", togglePixInfo); elements.pixInfoToggle.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); togglePixInfo(); } }); elements.pixShareBtn.addEventListener("click", sharePix); document.querySelector("#receipt-file")?.addEventListener("change", (event) => uploadReceipt(event.target.files?.[0])); document.querySelector("#start-experience")?.addEventListener("click", startExperience); }
  async function initialize() { bindEvents(); renderSectors(); renderSelection(); setupGallery(); setupEventCountdown(); setupCinematicScroll(); setupRanchSound(); setupOpening(); try { await Promise.all([loadTables(), loadAuth()]); } catch (error) { showToast("Não foi possível carregar as mesas agora. Atualize a página e tente novamente.", "error"); } }
  initialize();
})();
