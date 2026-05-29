"use strict";

const $ = (selector) => document.querySelector(selector);

const refs = {
  modeDot: $("#modeDot"),
  modeText: $("#modeText"),
  subtitle: $("#subtitle"),
  codexMetric: $("#codexMetric"),
  codexDetail: $("#codexDetail"),
  hermesMetric: $("#hermesMetric"),
  hermesDetail: $("#hermesDetail"),
  ollamaMetric: $("#ollamaMetric"),
  ollamaDetail: $("#ollamaDetail"),
  chromeMetric: $("#chromeMetric"),
  chromeDetail: $("#chromeDetail"),
  adapterCount: $("#adapterCount"),
  workerCount: $("#workerCount"),
  taskCount: $("#taskCount"),
  eventCount: $("#eventCount"),
  profileCount: $("#profileCount"),
  statePath: $("#statePath"),
  adaptersTable: $("#adaptersTable"),
  workersTable: $("#workersTable"),
  tasksList: $("#tasksList"),
  eventsList: $("#eventsList"),
  profilesTable: $("#profilesTable"),
  statusText: $("#statusText"),
  refreshButton: $("#refreshButton"),
  cycleButton: $("#cycleButton"),
  dashboardButton: $("#dashboardButton"),
  companionButton: $("#companionButton"),
  toast: $("#toast")
};

let latestState = null;
let toastTimer = null;

function text(value, fallback = "--") {
  if (value === null || value === undefined || value === "") return fallback;
  return String(value);
}

function setStatusClass(element, status) {
  element.className = `badge ${String(status || "planned").toLowerCase()}`;
}

function badge(status) {
  const value = text(status, "planned").toLowerCase();
  return `<span class="badge ${escapeHtml(value)}">${escapeHtml(value)}</span>`;
}

function escapeHtml(value) {
  return text(value, "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatDate(value) {
  if (!value) return "--";
  try {
    return new Date(value).toLocaleString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      day: "2-digit",
      month: "2-digit"
    });
  } catch {
    return value;
  }
}

function showToast(message) {
  refs.toast.textContent = message;
  refs.toast.classList.add("visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => refs.toast.classList.remove("visible"), 3800);
}

function setBusy(isBusy) {
  refs.refreshButton.disabled = isBusy;
  refs.cycleButton.disabled = isBusy;
}

function adapterById(state, id) {
  return (state.adapters || []).find((adapter) => adapter.id === id) || {};
}

function renderMetrics(state) {
  const codex = adapterById(state, "codex");
  const hermes = adapterById(state, "hermes");
  const ollama = adapterById(state, "ollama");
  const chrome = adapterById(state, "chrome");

  refs.codexMetric.textContent = text(codex.status);
  refs.codexDetail.textContent = text(codex.detail, "aguardando leitura");
  refs.hermesMetric.textContent = text(hermes.status);
  refs.hermesDetail.textContent = text(hermes.detail, "aguardando leitura");
  refs.ollamaMetric.textContent = text(ollama.status);
  refs.ollamaDetail.textContent = text(ollama.detail, "aguardando leitura");
  refs.chromeMetric.textContent = text(chrome.status);
  refs.chromeDetail.textContent = text(chrome.detail, "aguardando leitura");
}

function renderRows(container, rows, mapper) {
  if (!rows.length) {
    container.innerHTML = `<div class="item"><p>Nenhum item encontrado.</p></div>`;
    return;
  }

  container.innerHTML = rows.map(mapper).join("");
}

function renderAdapters(state) {
  const adapters = state.adapters || [];
  refs.adapterCount.textContent = `${adapters.length} linhas`;
  renderRows(refs.adaptersTable, adapters, (adapter) => `
    <div class="row">
      <div>
        <strong>${escapeHtml(adapter.name)}</strong>
        <small>${escapeHtml(adapter.role)}</small>
      </div>
      <div>${badge(adapter.status)}</div>
      <small>${escapeHtml(adapter.detail)}</small>
    </div>
  `);
}

function renderWorkers(state) {
  const workers = state.workers || [];
  const active = workers.filter((worker) => worker.status === "ready" || worker.status === "awake").length;
  refs.workerCount.textContent = `${active} ativos`;
  renderRows(refs.workersTable, workers, (worker) => `
    <div class="row">
      <div>
        <strong>${escapeHtml(worker.name)}</strong>
        <small>${escapeHtml(worker.current)}</small>
      </div>
      <div>${badge(worker.status)}</div>
      <small>${escapeHtml(worker.lane)} / cap ${escapeHtml(worker.capacity)}</small>
    </div>
  `);
}

function renderTasks(state) {
  const tasks = state.tasks || [];
  refs.taskCount.textContent = `${tasks.length} tarefas`;
  renderRows(refs.tasksList, tasks, (task) => `
    <div class="item">
      <div class="item-top">
        <strong>${escapeHtml(task.title)}</strong>
        ${badge(task.status)}
      </div>
      <p>${escapeHtml(task.priority)} / ${escapeHtml(task.lane)} - ${escapeHtml(task.detail)}</p>
    </div>
  `);
}

function renderEvents(state) {
  const events = (state.events || []).slice(0, 8);
  refs.eventCount.textContent = `${state.events?.length || 0} eventos`;
  renderRows(refs.eventsList, events, (event) => `
    <div class="item">
      <div class="item-top">
        <strong>${escapeHtml(event.message)}</strong>
        <small>${escapeHtml(formatDate(event.at))}</small>
      </div>
      <p>${escapeHtml(event.type)}</p>
    </div>
  `);
}

function renderProfiles(state) {
  const profiles = state.profiles?.profiles || [];
  refs.profileCount.textContent = `${profiles.length} perfis`;
  renderRows(refs.profilesTable, profiles, (profile) => `
    <div class="row">
      <div>
        <strong>${escapeHtml(profile.alias || profile.name)}</strong>
        <small>${escapeHtml(profile.name)}</small>
      </div>
      <div>${badge(profile.permission)}</div>
      <small>${escapeHtml(profile.purpose || profile.notes || "sem finalidade definida")}</small>
    </div>
  `);
}

function renderState(state) {
  latestState = state;
  refs.modeText.textContent = text(state.mode, "trabalho");
  refs.subtitle.textContent = `ultima leitura ${formatDate(state.generatedAt)}`;
  refs.modeDot.style.background = state.mode === "economia" ? "var(--warn)" : "var(--good)";
  refs.statePath.textContent = text(state.statePath, "sem arquivo");
  refs.statusText.textContent = state.statusText || JSON.stringify(state.report || {}, null, 2);

  renderMetrics(state);
  renderAdapters(state);
  renderWorkers(state);
  renderTasks(state);
  renderEvents(state);
  renderProfiles(state);
}

async function loadState() {
  setBusy(true);
  try {
    const state = await window.rayx.getState();
    renderState(state);
    showToast("RayX atualizado.");
  } catch (error) {
    refs.statusText.textContent = error.stack || error.message || String(error);
    showToast("Falha ao carregar estado RayX.");
  } finally {
    setBusy(false);
  }
}

async function runCycle() {
  setBusy(true);
  showToast("Rodando ciclo local...");
  try {
    const state = await window.rayx.runCycle();
    renderState(state);
    showToast("Ciclo local concluido.");
  } catch (error) {
    refs.statusText.textContent = error.stack || error.message || String(error);
    showToast("Falha no ciclo local.");
  } finally {
    setBusy(false);
  }
}

async function openTarget(target) {
  try {
    const result = await window.rayx.open(target);
    const file = Array.isArray(result) && result[0] ? result[0].file : target;
    showToast(`Abrindo ${target}: ${file}`);
  } catch (error) {
    showToast(error.message || String(error));
  }
}

refs.refreshButton.addEventListener("click", loadState);
refs.cycleButton.addEventListener("click", runCycle);
refs.dashboardButton.addEventListener("click", () => openTarget("dashboard"));
refs.companionButton.addEventListener("click", () => openTarget("companion"));

loadState();
setInterval(() => {
  if (!document.hidden && latestState) loadState();
}, 60000);
