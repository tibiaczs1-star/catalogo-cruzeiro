"use strict";

const API = "/api/ashotelaria/v1";

const ROLE_LABELS = Object.freeze({
  superadmin: "Administrador principal",
  proprietario: "Proprietário",
  administrador: "Administrador",
  gerente: "Gerente",
  recepcionista: "Recepção",
  camareira: "Camareira",
  supervisor_governanca: "Supervisão de governança",
  contador: "Contador",
  financeiro: "Financeiro",
  caixa: "Caixa",
  manutencao: "Manutenção",
  revenue_manager: "Gestão de tarifas",
  auditor: "Auditoria",
  hospede: "Hóspede",
});

const STATUS_LABELS = Object.freeze({
  available: "Disponível", occupied: "Ocupado", dirty: "Limpeza pendente",
  cleaning: "Em limpeza", inspected: "Inspecionado", maintenance: "Em manutenção",
  blocked: "Interditado", do_not_disturb: "Não perturbe",
  confirmed: "Confirmada", checked_in: "Hospedado", checked_out: "Finalizada",
  cancelled: "Cancelada", pending: "Pendente", in_progress: "Em andamento",
  done: "Concluída", open: "Aberta", closed: "Fechada", sandbox: "Homologação",
});

const NAVIGATION = Object.freeze([
  { id: "now", label: "Agora", icon: "◉", permission: "hotel.bootstrap.read", help: "Visão rápida da operação da unidade." },
  { id: "admin_center", label: "Central", icon: "▣", permission: "hotel.bootstrap.read", help: "Painel completo para administrador e gerente acompanharem operação, chamados, pedidos e gráficos." },
  { id: "frontdesk", label: "Balcão", icon: "+", permission: "reservations.create", help: "Cadastrar hóspede que chegou direto no balcão." },
  { id: "reservations", label: "Reservas", icon: "▤", permission: "reservations.read", help: "Consulte chegadas, saídas e reservas da unidade." },
  { id: "rooms", label: "Quartos", icon: "▦", permission: "rooms.operational.read", help: "Veja a situação de cada quarto e atualize o status." },
  { id: "housekeeping", label: "Governança", icon: "◇", permission: "tasks.housekeeping.read", help: "Acompanhe as tarefas de limpeza e inspeção." },
  { id: "maintenance", label: "Manutenção", icon: "△", permission: "tasks.maintenance.read", help: "Acompanhe ocorrências técnicas e ordens abertas." },
  { id: "finance", label: "Financeiro", icon: "R$", permission: "finance.cashflow.read", help: "Consulte receita prevista e movimento financeiro." },
  { id: "settings", label: "Integrações", icon: "⌁", permission: "admin.settings.manage", help: "Veja conexões externas e o estado de cada integração." },
  { id: "security", label: "Senhas", icon: "○", permission: "credentials.reset", help: "Troque sua senha ou redefina a senha de uma equipe." },
]);

const AREA_HELP = Object.freeze({
  "Movimento da unidade": "Reúne as reservas mais próximas para uma leitura rápida da operação.",
  "Seu acesso": "Confirma usuário, cargo, unidade e origem dos dados desta sessão.",
  "Central do administrador": "Resumo total da unidade: quartos, governança, pedidos, chamados, parceiros, finanças e ações diretas.",
  "Entrada no balcão": "Cadastro direto de hóspede que chegou sem reserva.",
  "Quartos prontos": "Quartos disponíveis ou inspecionados que podem receber entrada imediata.",
  "Reservas da unidade": "Lista o período, valor, situação e ações disponíveis para cada reserva.",
  "Situação dos quartos": "Mostra o estado operacional atual de cada quarto da unidade.",
  "Minhas tarefas": "Mostra somente as tarefas de governança atribuídas a esta conta.",
  "Tarefas de governança": "Lista as tarefas de limpeza e inspeção registradas na unidade.",
  "Ordens de manutenção": "Lista ocorrências técnicas, quartos relacionados e andamento do serviço.",
  "Resumo financeiro": "Consolida valores das reservas visíveis para cargos financeiros autorizados.",
  Integrações: "Mostra as conexões externas, status de conexão e última atualização.",
  "Controle de senhas": "Abre a troca da própria senha e a redefinição por cargo quando permitida.",
  "Proteções ativas": "Resume as proteções aplicadas a senhas, sessões e tentativas de acesso.",
});

const METRIC_HELP = Object.freeze({
  Quartos: "Total de quartos cadastrados nesta unidade.",
  Disponíveis: "Quartos livres ou inspecionados para nova hospedagem.",
  Ocupados: "Quartos marcados como ocupados neste momento.",
  Limpeza: "Quartos aguardando limpeza e quantidade de tarefas abertas.",
  Reservas: "Quantidade de reservas não canceladas no período visível.",
  "Receita prevista": "Soma dos valores das reservas não canceladas exibidas no painel.",
  "Ticket médio": "Valor médio calculado por reserva não cancelada.",
});

const state = { session: null, bootstrap: null, adminOverview: null, activeView: "now", loading: false };
const elements = {};

document.addEventListener("DOMContentLoaded", init);

function init() {
  Object.assign(elements, {
    banner: document.querySelector("#connection-banner"),
    loginScreen: document.querySelector("#login-screen"),
    loginForm: document.querySelector("#login-form"),
    loginError: document.querySelector("#login-error"),
    workspace: document.querySelector("#workspace"),
    navigation: document.querySelector("#app-navigation"),
    propertyName: document.querySelector("#property-name"),
    roleName: document.querySelector("#role-name"),
    todayLabel: document.querySelector("#today-label"),
    title: document.querySelector("#view-title"),
    content: document.querySelector("#view-content"),
    refresh: document.querySelector("#refresh-button"),
    logout: document.querySelector("#logout-button"),
    account: document.querySelector("#open-account"),
    accountDialog: document.querySelector("#account-dialog"),
    accountClose: document.querySelector("#account-close"),
    accountUsername: document.querySelector("#account-username"),
    accountRole: document.querySelector("#account-role"),
    accountMessage: document.querySelector("#account-message"),
    adminResetSection: document.querySelector("#admin-reset-section"),
  });

  elements.loginForm.addEventListener("submit", handleLogin);
  elements.refresh.addEventListener("click", refreshBootstrap);
  elements.logout.addEventListener("click", logout);
  elements.account.addEventListener("click", openAccount);
  document.querySelector("#change-password-button").addEventListener("click", changePassword);
  document.querySelector("#reset-password-button").addEventListener("click", resetPassword);
  document.querySelectorAll(".password-toggle").forEach((button) => button.addEventListener("click", togglePassword));
  window.addEventListener("online", updateConnectionState);
  window.addEventListener("offline", updateConnectionState);
  elements.accountDialog.addEventListener("cancel", (event) => {
    if (state.session?.forceChange) event.preventDefault();
  });
  elements.accountDialog.addEventListener("close", () => {
    if (state.session?.forceChange) queueMicrotask(() => elements.accountDialog.showModal());
  });
  updateConnectionState();
  setToday();
  bindTooltips(document);
  restoreServerSession();
}

async function api(path, options = {}) {
  const headers = { accept: "application/json", ...(options.headers ?? {}) };
  if (options.body) headers["content-type"] = "application/json";
  let response;
  try {
    response = await fetch(`${API}${path}`, { ...options, headers, credentials: "same-origin", cache: "no-store" });
  } catch {
    updateConnectionState(false);
    throw new Error("Não foi possível alcançar o sistema. Verifique sua conexão.");
  }
  updateConnectionState(true);
  if (response.status === 204) return null;
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(publicError(payload?.error?.code));
    error.status = response.status;
    error.code = payload?.error?.code;
    throw error;
  }
  return payload;
}

function publicError(code) {
  return ({
    INVALID_CREDENTIALS: "Usuário, cargo ou senha incorretos.",
    ACCOUNT_LOCKED: "Este acesso foi temporariamente bloqueado por segurança.",
    RATE_LIMITED: "Muitas tentativas. Aguarde um instante e tente novamente.",
    PASSWORD_CHANGE_REQUIRED: "Troque a senha temporária para continuar.",
    INVENTORY_CONFLICT: "A disponibilidade mudou. Atualize os dados e tente novamente.",
    FORBIDDEN: "Seu cargo não tem permissão para esta ação.",
    AUTHENTICATION_REQUIRED: "Sua sessão terminou. Entre novamente.",
    INVALID_PASSWORD: "A senha precisa ter pelo menos 8 caracteres.",
    CREDENTIAL_NOT_CONFIGURED: "Acesso inicial não configurado para este cargo.",
    CONFIGURATION_ERROR: "Acesso indisponível no momento.",
    INTERNAL_ERROR: "Servidor indisponível no momento.",
    INVALID_REQUEST: "Confira os campos informados.",
    ROLE_REQUIRED: "Selecione o cargo para entrar.",
    INVALID_RESERVATION_TRANSITION: "Esta ação não é permitida no estado atual da reserva.",
    CHECK_IN_NOT_ALLOWED: "Check-in disponível somente na data de entrada.",
    ROOM_NOT_READY: "O quarto não está pronto para check-in.",
  })[code] ?? "Não foi possível concluir a ação. Tente novamente.";
}

async function restoreServerSession() {
  try {
    const payload = await api("/auth/session");
    state.session = payload.session;
    if (state.session.forceChange) requirePasswordChange();
    else await enterWorkspace();
  } catch (error) {
    if (error.status !== 401) showLoginError(error.message);
  }
}

async function handleLogin(event) {
  event.preventDefault();
  if (!navigator.onLine) return showLoginError("Conecte-se à internet para entrar.");
  const body = Object.fromEntries(new FormData(elements.loginForm));
  setBusy(elements.loginForm, true);
  showLoginError("");
  try {
    const payload = await api("/auth/login", { method: "POST", body: JSON.stringify(body) });
    state.session = payload.session;
    if (state.session.forceChange) requirePasswordChange();
    else await enterWorkspace();
    elements.loginForm.reset();
    elements.loginForm.elements.username.value = "admin";
    elements.loginForm.elements.propertySlug.value = "hotel-jurua-palace";
  } catch (error) {
    showLoginError(error.message);
  } finally {
    setBusy(elements.loginForm, false);
  }
}

async function enterWorkspace() {
  await refreshBootstrap();
  if (!state.bootstrap) return;
  elements.loginScreen.hidden = true;
  elements.workspace.hidden = false;
  elements.propertyName.textContent = state.bootstrap.property?.name ?? "Hotel";
  elements.roleName.textContent = ROLE_LABELS[state.session.role] ?? state.session.role;
  renderNavigation();
  renderActiveView();
}

function requirePasswordChange() {
  elements.workspace.hidden = true;
  elements.loginScreen.hidden = false;
  elements.accountClose.hidden = true;
  openAccount("Sua senha é temporária. Defina uma nova senha antes de acessar o sistema.");
}

async function refreshBootstrap() {
  if (state.loading || !state.session) return;
  state.loading = true;
  elements.refresh?.classList.add("is-loading");
  try {
    const payload = await api("/bootstrap");
    state.session = payload.session;
    state.bootstrap = payload.bootstrap;
    if (!elements.workspace.hidden) renderActiveView();
  } catch (error) {
    if (error.status === 401) return showLogin();
    showViewError(error.message);
  } finally {
    state.loading = false;
    elements.refresh?.classList.remove("is-loading");
  }
}

function renderNavigation() {
  const permissions = new Set(state.session.permissions ?? []);
  const items = NAVIGATION.filter((item) => permissions.has(item.permission));
  if (!items.some((item) => item.id === state.activeView)) state.activeView = items[0]?.id ?? "now";
  elements.navigation.replaceChildren(...items.map((item) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `nav-button${item.id === state.activeView ? " active" : ""}`;
    button.dataset.view = item.id;
    button.dataset.help = item.help;
    button.innerHTML = `<span class="nav-icon" aria-hidden="true">${item.icon}</span><span>${item.label}</span>`;
    button.addEventListener("click", () => {
      state.activeView = item.id;
      renderNavigation();
      renderActiveView();
    });
    return button;
  }));
  bindTooltips(elements.navigation);
}

function renderActiveView() {
  if (!state.bootstrap) return;
  const renderer = {
    now: renderNow, admin_center: renderAdminCenter, frontdesk: renderFrontdesk, reservations: renderReservations, rooms: renderRooms,
    housekeeping: renderHousekeeping, maintenance: renderMaintenance,
    finance: renderFinance, settings: renderSettings, security: renderSecurity,
  }[state.activeView] ?? renderNow;
  const nav = NAVIGATION.find((item) => item.id === state.activeView);
  elements.title.textContent = nav?.label ?? "Agora";
  elements.content.innerHTML = renderer();
  bindViewActions();
}

function canSeeFullChain(role = state.session?.role) {
  return role === "administrador" || role === "gerente" || role === "proprietario" || role === "superadmin";
}

function renderNow() {
  const summary = state.bootstrap.summary ?? {};
  const rooms = state.bootstrap.rooms ?? [];
  const tasks = state.bootstrap.housekeepingTasks ?? [];
  const reservations = state.bootstrap.reservations ?? [];
  const metrics = [
    ["Quartos", summary.totalRooms ?? rooms.length, "na unidade"],
    ["Disponíveis", summary.availableRooms ?? countStatus(rooms, "available"), "agora"],
    ["Ocupados", summary.occupiedRooms ?? countStatus(rooms, "occupied"), "agora"],
    ["Limpeza", summary.dirtyRooms ?? countStatus(rooms, "dirty"), `${tasks.filter((task) => task.status !== "done").length} tarefa(s)`],
  ];
  const activity = reservations.slice(0, 6);
  return `
    <div class="metric-strip">${metrics.map(metricMarkup).join("")}</div>
    <div class="view-columns">
      <div>
        <div class="section-heading"><div><h2>Movimento da unidade</h2><p>Reservas e tarefas visíveis para seu cargo.</p></div></div>
        ${activity.length ? `<div class="data-list">${activity.map((row) => reservationRow(row)).join("")}</div>` : emptyMarkup()}
      </div>
      <aside class="context-panel"><h3>Seu acesso</h3><dl class="context-list">
        <div><dt>Usuário</dt><dd>${escapeHtml(state.session.username)}</dd></div>
        <div><dt>Cargo</dt><dd>${escapeHtml(ROLE_LABELS[state.session.role] ?? state.session.role)}</dd></div>
        <div><dt>Escopo</dt><dd>${escapeHtml(state.bootstrap.property?.name ?? "Unidade atual")}</dd></div>
        <div><dt>Dados</dt><dd>Atualizados pelo servidor</dd></div>
      </dl></aside>
    </div>`;
}

function renderAdminCenter() {
  if (!canSeeFullChain()) {
    return `<div class="empty-state"><span>AS</span><h2>Acesso limitado</h2><p>Esta central é liberada para administrador, gerente, proprietário e superadmin.</p></div>`;
  }
  const overview = state.adminOverview ?? {
    roomReadiness: state.bootstrap.rooms ?? [],
    housekeepingTasks: state.bootstrap.housekeepingTasks ?? [],
    roomServiceOrders: state.bootstrap.roomServiceOrders ?? [],
    guestMessages: state.bootstrap.guestMessages ?? [],
    partners: state.bootstrap.clientPartners ?? [],
    charts: {
      housekeepingByStatus: countBy(state.bootstrap.housekeepingTasks ?? [], "status"),
      roomsByStatus: countBy(state.bootstrap.rooms ?? [], "status"),
      revenue: { totalConfirmedCents: (state.bootstrap.reservations ?? []).reduce((sum, row) => sum + Number(row.total || 0), 0) },
    },
  };
  const roomServiceOrders = overview.roomServiceOrders ?? [];
  const guestMessages = overview.guestMessages ?? [];
  const housekeepingByStatus = overview.charts?.housekeepingByStatus ?? {};
  const roomsByStatus = overview.charts?.roomsByStatus ?? {};
  return `<div class="admin-center">
    <div class="section-heading"><div><h2>Central do administrador</h2><p>admin/overview · visão completa de quartos, clientes, equipe, chamados, pedidos e financeiro.</p></div><button class="button button--secondary button--compact" data-admin-overview-refresh>Atualizar central</button></div>
    <div class="metric-strip">
      ${metricMarkup(["Quartos", overview.roomReadiness?.length ?? 0, "monitorados"])}
      ${metricMarkup(["Limpeza", Object.values(housekeepingByStatus).reduce((sum, value) => sum + Number(value || 0), 0), "tarefas"])}
      ${metricMarkup(["Reservas", guestMessages.length, "chamado(s) cliente"])}
      ${metricMarkup(["Receita prevista", money(overview.charts?.revenue?.totalConfirmedCents ?? 0), "confirmada"])}
    </div>
    <div class="chart-grid">
      ${chartBlock("Governança", housekeepingByStatus)}
      ${chartBlock("Quartos", roomsByStatus)}
    </div>
    <div class="view-columns">
      <section>
        <div class="section-heading"><div><h2>Quarto arrumado e prova</h2><p>Última foto de entrega e leitura operacional por quarto.</p></div><button class="button button--primary button--compact" data-distribute-housekeeping>Distribuir limpezas</button></div>
        <div class="data-list">${(overview.roomReadiness ?? []).map((room) => `<div class="data-row" tabindex="0" data-help="Quarto ${escapeHtml(room.number ?? room.roomId)}: mostra estado e se existe foto de entrega."><strong>Quarto ${escapeHtml(room.number ?? room.roomId)}</strong><span>${escapeHtml(room.lastDeliveryPhoto ? "Foto registrada" : "Sem foto")}</span><span>Correção automática via imagem: fila de revisão</span>${statusMarkup(room.status)}</div>`).join("") || emptyMarkup()}</div>
      </section>
      <aside class="context-panel"><h3>Mensagens rápidas</h3><form class="operation-form" data-admin-message-form><label><span>Enviar mensagem</span><input name="message" placeholder="Cliente ou funcionário" data-help="Campo reservado para disparo direto ao hóspede ou colaborador."></label><button class="button button--secondary button--compact" type="submit">Enviar mensagem</button><p class="form-message" data-admin-message-status></p></form></aside>
    </div>
    <div class="view-columns">
      <section><div class="section-heading"><div><h2>Pedidos no quarto</h2><p>Fast food e room service exclusivo do hotel.</p></div><strong>${roomServiceOrders.length}</strong></div>${roomServiceOrders.length ? `<div class="data-list">${roomServiceOrders.map((order) => `<div class="data-row" tabindex="0" data-help="Pedido do quarto: acompanha total, situação e entrega."><strong>${escapeHtml(order.id)}</strong><span>Quarto ${escapeHtml(order.roomId)}</span><span>${money(order.total)}</span>${statusMarkup(order.status)}</div>`).join("")}</div>` : emptyMarkup()}</section>
      <section><div class="section-heading"><div><h2>Chamados do cliente</h2><p>Mensagens e solicitações abertas pelo portal do cliente.</p></div><strong>${guestMessages.length}</strong></div>${guestMessages.length ? `<div class="data-list">${guestMessages.map((message) => `<div class="data-row" tabindex="0" data-help="Chamado de cliente: destino, quarto, status e conteúdo resumido."><strong>${escapeHtml(message.target)}</strong><span>Quarto ${escapeHtml(message.roomId)}</span><span>${escapeHtml(message.message)}</span>${statusMarkup(message.status)}</div>`).join("")}</div>` : emptyMarkup()}</section>
    </div>
  </div>`;
}

function renderFrontdesk() {
  const readyRooms = (state.bootstrap.rooms ?? [])
    .filter((room) => ["available", "inspected"].includes(room.status));
  const roomOptions = readyRooms.map((room) => {
    const type = (state.bootstrap.roomTypes ?? []).find((row) => row.id === room.roomTypeId);
    return `<option value="${escapeHtml(room.id)}">Quarto ${escapeHtml(room.number)} · ${escapeHtml(type?.name ?? "Acomodação")}</option>`;
  }).join("");
  return `<div class="view-columns">
    <div>
      <div class="section-heading"><div><h2>Entrada no balcão</h2><p>Cadastro imediato para hóspede presente na recepção.</p></div></div>
      <form class="operation-form" data-walkin-form>
        <div class="field-grid field-grid--compact">
          <label class="field-span"><span>Hóspede</span><input name="guestName" data-help="Nome do hóspede que está entrando agora." required></label>
          <label><span>Quarto</span><select name="roomId" data-help="Somente quartos livres ou inspecionados aparecem aqui." required>${roomOptions}</select></label>
          <label><span>Saída prevista</span><input name="checkOut" type="date" min="${escapeHtml(tomorrowDate())}" value="${escapeHtml(tomorrowDate())}" data-help="Data prevista para encerramento da hospedagem." required></label>
          <label><span>Adultos</span><input name="adults" type="number" min="1" max="10" value="1" data-help="Quantidade de adultos no cadastro." required></label>
          <label><span>Crianças</span><input name="children" type="number" min="0" max="10" value="0" data-help="Quantidade de crianças no cadastro." required></label>
          <label><span>Telefone</span><input name="guestPhone" type="tel" data-help="Contato do hóspede para a ficha do hotel."></label>
          <label><span>Documento</span><input name="document" data-help="Documento apresentado no balcão."></label>
          <label><span>E-mail</span><input name="guestEmail" type="email" data-help="E-mail do hóspede, quando informado."></label>
        </div>
        <p class="form-message" data-walkin-message role="status"></p>
        <button class="button button--primary" type="submit" data-walkin-submit data-help="Registrar entrada e marcar o quarto como ocupado.">Registrar entrada</button>
      </form>
    </div>
    <aside class="context-panel"><h3>Quartos prontos</h3>
      ${readyRooms.length ? `<div class="mini-room-list">${readyRooms.map((room) => `<span>Quarto ${escapeHtml(room.number)}</span>`).join("")}</div>` : `<p class="muted-text">Nenhum quarto pronto neste momento.</p>`}
    </aside>
  </div>`;
}

function renderReservations() {
  const reservations = state.bootstrap.reservations ?? [];
  return `<div class="section-heading"><div><h2>Reservas da unidade</h2><p>Estadias confirmadas, em andamento e finalizadas.</p></div><strong>${reservations.length}</strong></div>
    ${reservations.length ? `<div class="data-list">${reservations.map((row) => reservationRow(row, true)).join("")}</div>` : emptyMarkup()}`;
}

function renderRooms() {
  const rooms = state.bootstrap.rooms ?? [];
  return `<div class="section-heading"><div><h2>Situação dos quartos</h2><p>Selecione um quarto para atualizar sua condição operacional.</p></div><strong>${rooms.length}</strong></div>
    ${rooms.length ? `<div class="room-grid">${rooms.map(roomMarkup).join("")}</div>` : emptyMarkup()}`;
}

function renderHousekeeping() {
  const tasks = state.bootstrap.housekeepingTasks ?? [];
  const rooms = new Map((state.bootstrap.rooms ?? []).map((room) => [room.id, room]));
  return `<div class="section-heading"><div><h2>${state.session.role === "camareira" ? "Minhas tarefas" : "Tarefas de governança"}</h2><p>${state.session.role === "camareira" ? "Somente os quartos atribuídos a esta conta." : "Acompanhamento da limpeza e inspeção."}</p></div><strong>${tasks.length}</strong></div>
    ${tasks.length ? `<div class="data-list">${tasks.map((task) => taskRow(task, rooms)).join("")}</div>` : emptyMarkup()}`;
}

function renderMaintenance() {
  const orders = state.bootstrap.maintenanceOrders ?? [];
  const rooms = new Map((state.bootstrap.rooms ?? []).map((room) => [room.id, room]));
  return `<div class="section-heading"><div><h2>Ordens de manutenção</h2><p>Ocorrências técnicas da unidade.</p></div><strong>${orders.length}</strong></div>
    ${orders.length ? `<div class="data-list">${orders.map((order) => maintenanceRow(order, rooms)).join("")}</div>` : emptyMarkup()}`;
}

function renderFinance() {
  const reservations = state.bootstrap.reservations ?? [];
  const active = reservations.filter((row) => !["cancelled"].includes(row.status));
  const revenue = active.reduce((sum, row) => sum + Number(row.total || 0), 0);
  return `<div class="metric-strip">
    ${metricMarkup(["Reservas", active.length, "não canceladas"])}
    ${metricMarkup(["Receita prevista", money(revenue), "no período visível"])}
    ${metricMarkup(["Ticket médio", active.length ? money(Math.round(revenue / active.length)) : money(0), "por reserva"])}
  </div><div class="section-heading"><div><h2>Resumo financeiro</h2><p>Exibido somente para financeiro, contador, proprietário e administrador.</p></div></div>
  ${active.length ? `<div class="data-list">${active.map((row) => `<div class="data-row" tabindex="0" data-help="Linha financeira: apresenta período, valor e situação de uma reserva não cancelada."><strong>${escapeHtml(row.id)}</strong><span>${formatDate(row.checkIn)} → ${formatDate(row.checkOut)}</span><span>${money(row.total)}</span>${statusMarkup(row.status)}</div>`).join("")}</div>` : emptyMarkup()}`;
}

function renderSettings() {
  const integrations = state.bootstrap.integrations ?? [];
  return `<div class="section-heading"><div><h2>Integrações</h2><p>Conexões externas, status operacional e última conferência.</p></div></div>
    ${integrations.length ? `<div class="data-list">${integrations.map((item) => `<div class="data-row" tabindex="0" data-help="Integração externa: mostra o provedor e o estado atual da conexão."><strong>${escapeHtml(item.provider)}</strong><span>${escapeHtml(item.id)}</span><span>Conexão protegida</span>${statusMarkup(item.status)}</div>`).join("")}</div>` : emptyMarkup()}`;
}

function renderSecurity() {
  return `<div class="view-columns"><div><div class="section-heading"><div><h2>Controle de senhas</h2><p>O administrador principal pode redefinir a senha temporária de cada equipe.</p></div></div>
    <div class="data-list"><div class="data-row" tabindex="0" data-help="Redefinição por cargo: substitui a senha temporária e invalida sessões anteriores."><strong>Redefinição por cargo</strong><span>Invalida sessões anteriores</span><span>Troca obrigatória no próximo acesso</span><button class="button button--secondary" data-open-security data-help="Abre os controles de troca e redefinição de senha.">Gerenciar</button></div></div></div>
    <aside class="context-panel"><h3>Proteções ativas</h3><dl class="context-list"><div><dt>Senhas</dt><dd>Armazenadas com hash e salt</dd></div><div><dt>Sessões</dt><dd>Cookie seguro e revogável</dd></div><div><dt>Tentativas</dt><dd>Bloqueio progressivo</dd></div><div><dt>Escopo</dt><dd>Hotel e cargo isolados</dd></div></dl></aside></div>`;
}

function bindViewActions() {
  elements.content.querySelectorAll("[data-room-id]").forEach((button) => button.addEventListener("click", updateRoom));
  elements.content.querySelectorAll("[data-reservation-status]").forEach((button) => button.addEventListener("click", updateReservation));
  elements.content.querySelectorAll("[data-maintenance-order-id]").forEach((button) => button.addEventListener("click", updateMaintenance));
  elements.content.querySelector("[data-walkin-form]")?.addEventListener("submit", createWalkIn);
  elements.content.querySelector("[data-admin-overview-refresh]")?.addEventListener("click", refreshAdminOverview);
  elements.content.querySelector("[data-distribute-housekeeping]")?.addEventListener("click", distributeHousekeeping);
  elements.content.querySelector("[data-admin-message-form]")?.addEventListener("submit", sendAdminMessage);
  elements.content.querySelectorAll("[data-room-photo-form]").forEach((form) => form.addEventListener("submit", uploadRoomPhoto));
  elements.content.querySelector("[data-open-security]")?.addEventListener("click", () => openAccount());
  elements.content.querySelectorAll(".section-heading, .context-panel").forEach((element) => {
    const title = element.querySelector("h2, h3")?.textContent?.trim();
    if (AREA_HELP[title]) element.dataset.help = AREA_HELP[title];
  });
  elements.content.querySelectorAll("[data-help]").forEach((element) => {
    if (!element.matches("button, input, select, a, [tabindex]")) element.tabIndex = 0;
  });
  bindTooltips(elements.content);
}

async function refreshAdminOverview() {
  if (!canSeeFullChain()) return;
  try {
    const payload = await api("/admin/overview");
    state.adminOverview = payload.overview;
    renderActiveView();
  } catch (error) {
    showViewError(error.message);
  }
}

async function distributeHousekeeping(event) {
  event.currentTarget.disabled = true;
  try {
    await api("/housekeeping/distribute", { method: "POST", body: JSON.stringify({ date: operationalDate() }) });
    await refreshBootstrap();
    await refreshAdminOverview();
  } catch (error) {
    showViewError(error.message);
  }
}

function sendAdminMessage(event) {
  event.preventDefault();
  const status = event.currentTarget.querySelector("[data-admin-message-status]");
  const value = event.currentTarget.elements.message.value.trim();
  status.textContent = value ? "Mensagem preparada para envio no próximo conector de notificação." : "Digite uma mensagem.";
  if (value) event.currentTarget.reset();
}

function bindTooltips(root) {
  root?.querySelectorAll("[data-help]").forEach((element) => {
    if (element.dataset.helpBound === "true") return;
    element.dataset.helpBound = "true";
    let timer = null;
    let tooltip = null;
    const hide = () => {
      if (timer) clearTimeout(timer);
      timer = null;
      tooltip?.remove();
      tooltip = null;
    };
    const show = () => {
      hide();
      timer = setTimeout(() => {
        tooltip = document.createElement("div");
        tooltip.className = "help-tooltip";
        tooltip.setAttribute("role", "tooltip");
        tooltip.textContent = element.dataset.help;
        document.body.appendChild(tooltip);
        const rect = element.getBoundingClientRect();
        const width = tooltip.offsetWidth;
        const left = Math.min(Math.max(10, rect.left), window.innerWidth - width - 10);
        tooltip.style.left = `${left}px`;
        tooltip.style.top = `${Math.min(window.innerHeight - tooltip.offsetHeight - 10, rect.bottom + 10)}px`;
        requestAnimationFrame(() => tooltip?.classList.add("visible"));
      }, 650);
    };
    element.addEventListener("mouseenter", show);
    element.addEventListener("mouseleave", hide);
    element.addEventListener("focus", show);
    element.addEventListener("blur", hide);
  });
}

async function updateRoom(event) {
  if (!hasPermission("rooms.operational.update")) return;
  const roomId = event.currentTarget.dataset.roomId;
  const room = (state.bootstrap.rooms ?? []).find((item) => item.id === roomId);
  if (!room) return;
  const statuses = state.session.role === "camareira"
    ? ["dirty", "available", "inspected"]
    : ["available", "occupied", "dirty", "inspected", "maintenance", "blocked"];
  const next = statuses[(statuses.indexOf(room.status) + 1) % statuses.length];
  event.currentTarget.disabled = true;
  try {
    await api(`/rooms/${encodeURIComponent(roomId)}/status`, { method: "PATCH", body: JSON.stringify({ status: next }) });
    await refreshBootstrap();
  } catch (error) {
    showViewError(error.message);
  }
}

async function updateReservation(event) {
  if (!hasPermission("reservations.manage")) return;
  const reservationId = event.currentTarget.dataset.reservationId;
  const status = event.currentTarget.dataset.reservationStatus;
  if (!reservationId || !status) return;
  event.currentTarget.disabled = true;
  try {
    await api(`/reservations/${encodeURIComponent(reservationId)}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
    await refreshBootstrap();
  } catch (error) {
    showViewError(error.message);
  }
}

async function updateMaintenance(event) {
  if (!canManageMaintenance()) return;
  const orderId = event.currentTarget.dataset.maintenanceOrderId;
  const status = event.currentTarget.dataset.maintenanceStatus;
  if (!orderId || !status) return;
  event.currentTarget.disabled = true;
  try {
    await api(`/maintenance-orders/${encodeURIComponent(orderId)}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
    await refreshBootstrap();
  } catch (error) {
    showViewError(error.message);
  }
}

async function createWalkIn(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const body = Object.fromEntries(new FormData(form));
  const message = form.querySelector("[data-walkin-message]");
  message.textContent = "";
  setBusy(form, true);
  try {
    await api("/walk-ins", { method: "POST", body: JSON.stringify({
      ...body,
      adults: Number(body.adults || 1),
      children: Number(body.children || 0),
    }) });
    await refreshBootstrap();
    elements.content.querySelector("[data-walkin-message]")?.replaceChildren(document.createTextNode("Entrada registrada."));
  } catch (error) {
    message.textContent = error.message;
  } finally {
    setBusy(form, false);
  }
}

async function uploadRoomPhoto(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const roomId = form.dataset.roomPhotoForm;
  const file = form.querySelector('input[type="file"]')?.files?.[0];
  const note = form.querySelector('input[name="note"]')?.value ?? "";
  const message = form.querySelector("[data-photo-message]");
  if (!file) {
    message.textContent = "Selecione a foto do quarto.";
    return;
  }
  setBusy(form, true);
  try {
    const imageDataUrl = await fileToDataUrl(file);
    await api(`/rooms/${encodeURIComponent(roomId)}/photos`, {
      method: "POST",
      body: JSON.stringify({ kind: "delivery", imageDataUrl, note }),
    });
    message.textContent = "Foto de entrega salva.";
    form.reset();
    await refreshBootstrap();
  } catch (error) {
    message.textContent = error.message;
  } finally {
    setBusy(form, false);
  }
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => resolve(reader.result));
    reader.addEventListener("error", () => reject(new Error("Não foi possível ler a foto.")));
    reader.readAsDataURL(file);
  });
}

function openAccount(message = "") {
  elements.accountClose.hidden = Boolean(state.session.forceChange);
  elements.accountUsername.textContent = state.session.username;
  elements.accountRole.textContent = ROLE_LABELS[state.session.role] ?? state.session.role;
  elements.accountMessage.textContent = message;
  const canReset = hasPermission("credentials.reset");
  elements.adminResetSection.hidden = !canReset;
  if (canReset) {
    const select = document.querySelector("#reset-password-form select");
    select.replaceChildren(...Object.entries(ROLE_LABELS).filter(([role]) => !["superadmin", "hospede"].includes(role)).map(([role, label]) => new Option(label, role)));
  }
  if (!elements.accountDialog.open) elements.accountDialog.showModal();
}

async function changePassword() {
  const box = document.querySelector("#change-password-form");
  const values = Object.fromEntries([...box.querySelectorAll("input")].map((input) => [input.name, input.value]));
  elements.accountMessage.textContent = "";
  try {
    await api("/auth/change-password", { method: "POST", body: JSON.stringify(values) });
    elements.accountMessage.textContent = "Senha alterada. Entre novamente com a nova senha.";
    setTimeout(showLogin, 900);
  } catch (error) {
    elements.accountMessage.textContent = error.message;
  }
}

async function resetPassword() {
  const box = document.querySelector("#reset-password-form");
  const body = Object.fromEntries([...box.querySelectorAll("input, select")].map((input) => [input.name, input.value]));
  elements.accountMessage.textContent = "";
  try {
    await api("/admin/credentials/reset", { method: "POST", body: JSON.stringify(body) });
    elements.accountMessage.textContent = `Senha temporária de ${ROLE_LABELS[body.role] ?? body.role} redefinida.`;
    box.querySelector("input").value = "";
  } catch (error) {
    elements.accountMessage.textContent = error.message;
  }
}

async function logout() {
  try { await api("/auth/logout", { method: "POST" }); } catch { /* cookie expires client-side on successful server reach */ }
  showLogin();
}

function showLogin() {
  state.session = null;
  state.bootstrap = null;
  elements.accountDialog.open && elements.accountDialog.close();
  elements.workspace.hidden = true;
  elements.loginScreen.hidden = false;
}

function showLoginError(message) {
  elements.loginError.textContent = message;
  elements.loginError.hidden = !message;
}

function showViewError(message) {
  elements.content.innerHTML = `<p class="form-error">${escapeHtml(message)}</p>`;
}

function updateConnectionState(forced) {
  const online = typeof forced === "boolean" ? forced : navigator.onLine;
  elements.banner.hidden = online;
  document.querySelectorAll("button[type=submit], button[data-room-id]").forEach((button) => { button.disabled = !online; });
}

function setBusy(container, busy) {
  container.querySelectorAll("button, input, select").forEach((element) => { element.disabled = busy; });
}

function togglePassword(event) {
  const input = event.currentTarget.parentElement.querySelector("input");
  const show = input.type === "password";
  input.type = show ? "text" : "password";
  event.currentTarget.textContent = show ? "Ocultar" : "Mostrar";
}

function hasPermission(permission) { return state.session.permissions?.includes(permission); }
function canManageRooms() { return hasPermission("rooms.operational.update"); }
function canManageHousekeeping() { return hasPermission("tasks.housekeeping.update"); }
function canManageMaintenance() { return hasPermission("tasks.maintenance.update"); }
function countStatus(rows, status) { return rows.filter((row) => row.status === status).length; }
function countBy(rows, field) { return rows.reduce((acc, row) => ({ ...acc, [row[field]]: (acc[row[field]] ?? 0) + 1 }), {}); }
function money(cents) { return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(cents || 0) / 100); }
function formatDate(value) { if (!value) return "—"; const [year, month, day] = value.slice(0, 10).split("-"); return `${day}/${month}/${year}`; }
function operationalDate(now = new Date(), timeZone = state.bootstrap?.property?.timeZone ?? "America/Rio_Branco") {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone, year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(now);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${values.year}-${values.month}-${values.day}`;
}
function tomorrowDate() {
  const current = new Date(`${operationalDate()}T12:00:00`);
  current.setDate(current.getDate() + 1);
  return `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, "0")}-${String(current.getDate()).padStart(2, "0")}`;
}
function setToday() { elements.todayLabel.textContent = new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "2-digit", month: "long", timeZone: "America/Rio_Branco" }).format(new Date()); }
function escapeHtml(value) { return String(value ?? "").replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[character]); }
function emptyMarkup() { return `<div class="empty-state" tabindex="0" data-help="Esta área não possui registros pendentes neste momento."><span>AS</span><h2>Nada pendente aqui</h2><p>Os dados atualizados aparecerão nesta área.</p></div>`; }
function metricMarkup([label, value, detail]) { return `<div class="metric" tabindex="0" data-help="${escapeHtml(METRIC_HELP[label] ?? "Indicador calculado com os dados atuais da unidade.")}"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong><small>${escapeHtml(detail)}</small></div>`; }
function statusMarkup(status) {
  const modifier = ["dirty", "pending", "open"].includes(status) ? " status--warning" : ["maintenance", "blocked", "cancelled"].includes(status) ? " status--danger" : ["checked_out", "closed"].includes(status) ? " status--neutral" : "";
  return `<span class="status${modifier}">${escapeHtml(STATUS_LABELS[status] ?? status)}</span>`;
}
function chartBlock(title, entries) {
  const rows = Object.entries(entries ?? {});
  const max = Math.max(1, ...rows.map(([, value]) => Number(value || 0)));
  return `<section class="chart-panel" tabindex="0" data-help="Gráfico ${escapeHtml(title)}: barras proporcionais calculadas com os dados atuais."><h3>${escapeHtml(title)}</h3>${rows.length ? rows.map(([label, value]) => `<div class="chart-row"><span>${escapeHtml(STATUS_LABELS[label] ?? label)}</span><div class="chart-bar"><i style="width:${Math.max(6, Math.round((Number(value || 0) / max) * 100))}%"></i></div><strong>${escapeHtml(value)}</strong></div>`).join("") : `<p class="muted-text">Sem dados para gráfico.</p>`}</section>`;
}
function reservationActions(row) {
  if (!hasPermission("reservations.manage")) return "";
  const checkInToday = row.status === "confirmed" && row.checkIn === operationalDate();
  const actions = row.status === "confirmed"
    ? [...(checkInToday ? [["checked_in", "Fazer check-in"]] : []), ["cancelled", "Cancelar"]]
    : ({
      pending: [["confirmed", "Confirmar"], ["cancelled", "Cancelar"]],
      checked_in: [["checked_out", "Fazer check-out"]],
    })[row.status] ?? [];
  const checkInNote = row.status === "confirmed" && !checkInToday
    ? `<span class="reservation-action-note" tabindex="0" data-help="Check-in disponível somente na data de entrada, conforme o dia operacional em America/Rio_Branco.">Check-in em ${formatDate(row.checkIn)}</span>`
    : "";
  if (!actions.length && !checkInNote) return "";
  return `<span class="reservation-actions">${checkInNote}${actions.map(([status, label]) => `<button class="button button--secondary button--compact" type="button" data-reservation-id="${escapeHtml(row.id)}" data-reservation-status="${status}" data-help="Ação de reserva: ${escapeHtml(label)} altera a situação desta hospedagem.">${label}</button>`).join("")}</span>`;
}
function reservationRow(row, interactive = false) { return `<div class="data-row${interactive ? " data-row--reservation" : ""}" tabindex="0" data-help="Resumo da reserva: período, valor, situação${interactive ? " e ações operacionais permitidas" : ""}."><strong>${escapeHtml(row.id)}</strong><span>${formatDate(row.checkIn)} → ${formatDate(row.checkOut)}</span><span>${money(row.total)}</span>${statusMarkup(row.status)}${interactive ? reservationActions(row) : ""}</div>`; }
function taskRow(task, rooms) { return `<div class="data-row" tabindex="0" data-help="Tarefa de governança: identifica o quarto e o andamento da limpeza ou inspeção."><strong>Quarto ${escapeHtml(rooms.get(task.roomId)?.number ?? "—")}</strong><span>${escapeHtml(task.id)}</span><span>Governança</span>${statusMarkup(task.status)}</div>`; }
function maintenanceRow(order, rooms) {
  return `<div class="data-row" tabindex="0" data-help="Ordem técnica: identifica o serviço, o quarto relacionado e a situação atual. Administrador e gerente podem alterar daqui sem trocar de cargo."><strong>${escapeHtml(order.title ?? "Ordem técnica")}</strong><span>Quarto ${escapeHtml(rooms.get(order.roomId)?.number ?? "—")}</span><span>${escapeHtml(order.id)}</span>${statusMarkup(order.status)}${maintenanceActions(order)}</div>`;
}
function maintenanceActions(order) {
  if (!canManageMaintenance()) return "";
  const actions = ({
    open: [["in_progress", "Iniciar"], ["closed", "Fechar"]],
    in_progress: [["closed", "Fechar"], ["open", "Reabrir"]],
    closed: [["open", "Reabrir"]],
  })[order.status] ?? [["open", "Abrir"]];
  return `<span class="reservation-actions">${actions.map(([status, label]) => `<button class="button button--secondary button--compact" type="button" data-maintenance-order-id="${escapeHtml(order.id)}" data-maintenance-status="${status}" data-help="Ação de manutenção: ${escapeHtml(label)} altera a situação desta ordem técnica.">${label}</button>`).join("")}</span>`;
}
function roomMarkup(room) {
  const latestDelivery = room.deliveryPhotos?.[0];
  const photoPreview = room.photoUrl
    ? `<span class="room-photo-preview" style="background-image:url('${escapeHtml(room.photoUrl)}')" aria-label="Foto do quarto"></span>`
    : `<span class="room-photo-slot">Foto do quarto</span>`;
  const delivery = latestDelivery
    ? `<span class="room-delivery-proof">Foto de entrega salva</span>`
    : `<span class="room-delivery-proof room-delivery-proof--empty">Sem foto de entrega</span>`;
  const photoForm = canManageHousekeeping()
    ? `<form class="room-photo-form" data-room-photo-form="${escapeHtml(room.id)}"><label><span>Foto de entrega</span><input type="file" accept="image/*" capture="environment" data-help="A camareira pode tirar foto do quarto pronto para registrar a entrega."></label><input name="note" placeholder="Observação" data-help="Observação curta sobre a entrega do quarto."><p data-photo-message class="form-message"></p><button class="button button--secondary button--compact" type="submit" data-help="Salvar foto de entrega deste quarto.">Salvar foto</button></form>`
    : "";
  return `<div class="room-tile" data-help="Situação operacional do quarto ${escapeHtml(room.number)}. ${canManageRooms() ? "Atualize o estado ou registre foto quando necessário." : "Seu cargo possui acesso somente para consulta."}">
    ${photoPreview}
    <button type="button" data-room-id="${escapeHtml(room.id)}" ${canManageRooms() ? "" : "disabled"}>
      <span class="room-tile__number">${escapeHtml(room.number)}</span>
      <span class="room-tile__status">${escapeHtml(STATUS_LABELS[room.status] ?? room.status)}</span>
      ${canManageRooms() ? '<span class="room-tile__action">Atualizar situação →</span>' : ""}
    </button>
    ${delivery}
    ${photoForm}
  </div>`;
}
