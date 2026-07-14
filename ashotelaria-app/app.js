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
  inspected: "Inspecionado", maintenance: "Em manutenção", out_of_order: "Interditado",
  confirmed: "Confirmada", checked_in: "Hospedado", checked_out: "Finalizada",
  cancelled: "Cancelada", pending: "Pendente", in_progress: "Em andamento",
  done: "Concluída", open: "Aberta", closed: "Fechada", sandbox: "Ambiente de testes",
});

const NAVIGATION = Object.freeze([
  { id: "now", label: "Agora", icon: "◉", permission: "hotel.bootstrap.read" },
  { id: "reservations", label: "Reservas", icon: "▤", permission: "reservations.read" },
  { id: "rooms", label: "Quartos", icon: "▦", permission: "rooms.operational.read" },
  { id: "housekeeping", label: "Governança", icon: "◇", permission: "tasks.housekeeping.read" },
  { id: "maintenance", label: "Manutenção", icon: "△", permission: "tasks.maintenance.read" },
  { id: "finance", label: "Financeiro", icon: "R$", permission: "finance.cashflow.read" },
  { id: "settings", label: "Integrações", icon: "⌁", permission: "admin.settings.manage" },
  { id: "security", label: "Senhas", icon: "○", permission: "credentials.reset" },
]);

const state = { session: null, bootstrap: null, activeView: "now", loading: false };
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
  setBusy(elements.loginForm, true);
  showLoginError("");
  const body = Object.fromEntries(new FormData(elements.loginForm));
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
    button.innerHTML = `<span class="nav-icon" aria-hidden="true">${item.icon}</span><span>${item.label}</span>`;
    button.addEventListener("click", () => {
      state.activeView = item.id;
      renderNavigation();
      renderActiveView();
    });
    return button;
  }));
}

function renderActiveView() {
  if (!state.bootstrap) return;
  const renderer = {
    now: renderNow, reservations: renderReservations, rooms: renderRooms,
    housekeeping: renderHousekeeping, maintenance: renderMaintenance,
    finance: renderFinance, settings: renderSettings, security: renderSecurity,
  }[state.activeView] ?? renderNow;
  const nav = NAVIGATION.find((item) => item.id === state.activeView);
  elements.title.textContent = nav?.label ?? "Agora";
  elements.content.innerHTML = renderer();
  bindViewActions();
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
        ${activity.length ? `<div class="data-list">${activity.map(reservationRow).join("")}</div>` : emptyMarkup()}
      </div>
      <aside class="context-panel"><h3>Seu acesso</h3><dl class="context-list">
        <div><dt>Usuário</dt><dd>${escapeHtml(state.session.username)}</dd></div>
        <div><dt>Cargo</dt><dd>${escapeHtml(ROLE_LABELS[state.session.role] ?? state.session.role)}</dd></div>
        <div><dt>Escopo</dt><dd>${escapeHtml(state.bootstrap.property?.name ?? "Unidade atual")}</dd></div>
        <div><dt>Dados</dt><dd>Atualizados pelo servidor</dd></div>
      </dl></aside>
    </div>`;
}

function renderReservations() {
  const reservations = state.bootstrap.reservations ?? [];
  return `<div class="section-heading"><div><h2>Reservas da unidade</h2><p>Estadias confirmadas, em andamento e finalizadas.</p></div><strong>${reservations.length}</strong></div>
    ${reservations.length ? `<div class="data-list">${reservations.map(reservationRow).join("")}</div>` : emptyMarkup()}`;
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
    ${orders.length ? `<div class="data-list">${orders.map((order) => `<div class="data-row"><strong>${escapeHtml(order.title ?? "Ordem técnica")}</strong><span>Quarto ${escapeHtml(rooms.get(order.roomId)?.number ?? "—")}</span><span>${escapeHtml(order.id)}</span>${statusMarkup(order.status)}</div>`).join("")}</div>` : emptyMarkup()}`;
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
  ${active.length ? `<div class="data-list">${active.map((row) => `<div class="data-row"><strong>${escapeHtml(row.id)}</strong><span>${formatDate(row.checkIn)} → ${formatDate(row.checkOut)}</span><span>${money(row.total)}</span>${statusMarkup(row.status)}</div>`).join("")}</div>` : emptyMarkup()}`;
}

function renderSettings() {
  const integrations = state.bootstrap.integrations ?? [];
  return `<div class="section-heading"><div><h2>Integrações</h2><p>Conexões externas permanecem em ambiente de testes até a homologação.</p></div></div>
    ${integrations.length ? `<div class="data-list">${integrations.map((item) => `<div class="data-row"><strong>${escapeHtml(item.provider)}</strong><span>${escapeHtml(item.id)}</span><span>Conexão protegida</span>${statusMarkup(item.status)}</div>`).join("")}</div>` : emptyMarkup()}`;
}

function renderSecurity() {
  return `<div class="view-columns"><div><div class="section-heading"><div><h2>Controle de senhas</h2><p>O administrador principal pode redefinir a senha temporária de cada equipe.</p></div></div>
    <div class="data-list"><div class="data-row"><strong>Redefinição por cargo</strong><span>Invalida sessões anteriores</span><span>Troca obrigatória no próximo acesso</span><button class="button button--secondary" data-open-security>Gerenciar</button></div></div></div>
    <aside class="context-panel"><h3>Proteções ativas</h3><dl class="context-list"><div><dt>Senhas</dt><dd>Armazenadas com hash e salt</dd></div><div><dt>Sessões</dt><dd>Cookie seguro e revogável</dd></div><div><dt>Tentativas</dt><dd>Bloqueio progressivo</dd></div><div><dt>Escopo</dt><dd>Hotel e cargo isolados</dd></div></dl></aside></div>`;
}

function bindViewActions() {
  elements.content.querySelectorAll("[data-room-id]").forEach((button) => button.addEventListener("click", updateRoom));
  elements.content.querySelector("[data-open-security]")?.addEventListener("click", () => openAccount());
}

async function updateRoom(event) {
  if (!hasPermission("rooms.operational.update")) return;
  const roomId = event.currentTarget.dataset.roomId;
  const room = (state.bootstrap.rooms ?? []).find((item) => item.id === roomId);
  if (!room) return;
  const statuses = state.session.role === "camareira"
    ? ["dirty", "available", "inspected"]
    : ["available", "occupied", "dirty", "inspected", "maintenance", "out_of_order"];
  const next = statuses[(statuses.indexOf(room.status) + 1) % statuses.length];
  event.currentTarget.disabled = true;
  try {
    await api(`/rooms/${encodeURIComponent(roomId)}/status`, { method: "PATCH", body: JSON.stringify({ status: next }) });
    await refreshBootstrap();
  } catch (error) {
    showViewError(error.message);
  }
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
function countStatus(rows, status) { return rows.filter((row) => row.status === status).length; }
function money(cents) { return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(cents || 0) / 100); }
function formatDate(value) { if (!value) return "—"; const [year, month, day] = value.slice(0, 10).split("-"); return `${day}/${month}/${year}`; }
function setToday() { elements.todayLabel.textContent = new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "2-digit", month: "long", timeZone: "America/Rio_Branco" }).format(new Date()); }
function escapeHtml(value) { return String(value ?? "").replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[character]); }
function emptyMarkup() { return `<div class="empty-state"><span>AS</span><h2>Nada pendente aqui</h2><p>Os dados atualizados aparecerão nesta área.</p></div>`; }
function metricMarkup([label, value, detail]) { return `<div class="metric"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong><small>${escapeHtml(detail)}</small></div>`; }
function statusMarkup(status) {
  const modifier = ["dirty", "pending", "open"].includes(status) ? " status--warning" : ["maintenance", "out_of_order", "cancelled"].includes(status) ? " status--danger" : ["checked_out", "closed"].includes(status) ? " status--neutral" : "";
  return `<span class="status${modifier}">${escapeHtml(STATUS_LABELS[status] ?? status)}</span>`;
}
function reservationRow(row) { return `<div class="data-row"><strong>${escapeHtml(row.id)}</strong><span>${formatDate(row.checkIn)} → ${formatDate(row.checkOut)}</span><span>${money(row.total)}</span>${statusMarkup(row.status)}</div>`; }
function taskRow(task, rooms) { return `<div class="data-row"><strong>Quarto ${escapeHtml(rooms.get(task.roomId)?.number ?? "—")}</strong><span>${escapeHtml(task.id)}</span><span>Governança</span>${statusMarkup(task.status)}</div>`; }
function roomMarkup(room) { return `<button class="room-tile" type="button" data-room-id="${escapeHtml(room.id)}" ${hasPermission("rooms.operational.update") ? "" : "disabled"}><span class="room-tile__number">${escapeHtml(room.number)}</span><span class="room-tile__status">${escapeHtml(STATUS_LABELS[room.status] ?? room.status)}</span>${hasPermission("rooms.operational.update") ? '<span class="room-tile__action">Atualizar situação →</span>' : ""}</button>`; }
