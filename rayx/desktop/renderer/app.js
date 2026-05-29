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
  missionInput: $("#missionInput"),
  missionButton: $("#missionButton"),
  conversationState: $("#conversationState"),
  chatThread: $("#chatThread"),
  evidenceCount: $("#evidenceCount"),
  evidenceList: $("#evidenceList"),
  activityCount: $("#activityCount"),
  activityList: $("#activityList"),
  refreshButton: $("#refreshButton"),
  bootButton: $("#bootButton"),
  cycleButton: $("#cycleButton"),
  catalogButton: $("#catalogButton"),
  hermesButton: $("#hermesButton"),
  chromeBridgeButton: $("#chromeBridgeButton"),
  dashboardButton: $("#dashboardButton"),
  companionButton: $("#companionButton"),
  toast: $("#toast")
};

let latestState = null;
let toastTimer = null;
let activityItems = [];

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

function setButtonBusy(button, isBusy) {
  if (!button) return;
  button.disabled = isBusy;
}

function appendActivity(title, detail = "") {
  activityItems.unshift({
    title,
    detail,
    at: new Date().toISOString()
  });
  activityItems = activityItems.slice(0, 40);
  renderActivity();
}

function renderActivity() {
  refs.activityCount.textContent = `${activityItems.length} passos`;
  if (!activityItems.length) {
    refs.activityList.innerHTML = `<div class="activity"><small>Nenhuma atividade ainda.</small></div>`;
    return;
  }

  refs.activityList.innerHTML = activityItems.map((item) => `
    <div class="activity">
      <strong>${escapeHtml(item.title)}</strong>
      <small>${escapeHtml(formatDate(item.at))}${item.detail ? ` - ${escapeHtml(item.detail)}` : ""}</small>
    </div>
  `).join("");
}

function addMessage(role, body, meta = "") {
  const message = document.createElement("div");
  message.className = `message ${role}`;
  message.innerHTML = `
    <div class="message-meta">${escapeHtml(meta || role)}</div>
    <div class="message-body">${escapeHtml(body)}</div>
  `;
  refs.chatThread.appendChild(message);
  refs.chatThread.scrollTop = refs.chatThread.scrollHeight;
}

function renderMissionEvidence(turn) {
  const jobs = turn?.mission?.jobs || [];
  refs.evidenceCount.textContent = `${jobs.length} itens`;

  if (!jobs.length) {
    refs.evidenceList.innerHTML = `<div class="evidence"><small>Sem evidencias de missao.</small></div>`;
    return;
  }

  refs.evidenceList.innerHTML = jobs.map((job) => `
    <div class="evidence">
      <strong>${escapeHtml(job.id)} ${job.ok ? "ok" : "falhou"}</strong>
      <small>${escapeHtml(job.lane)} - ${escapeHtml(job.command)} - ${escapeHtml(job.durationMs)}ms</small>
    </div>
  `).join("");
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
  refs.statusText.textContent = [
    state.statusText || JSON.stringify(state.report || {}, null, 2),
    "",
    state.catalog
      ? `Catalogo: ${state.catalog.toolsFound}/${state.catalog.toolsTotal} ferramentas, ${state.catalog.skills} skills, ${state.catalog.prompts} prompts`
      : "",
    state.chromeBridge
      ? `Chrome/CDP: porta ${state.chromeBridge.remoteDebuggingPort}, abas ${state.chromeBridge.tabs?.length || 0}, allow ${state.chromeBridge.policy?.allowCount || 0}`
      : ""
  ].filter(Boolean).join("\n");

  renderMetrics(state);
  renderAdapters(state);
  renderWorkers(state);
  renderTasks(state);
  renderEvents(state);
  renderProfiles(state);
}

async function loadState() {
  setButtonBusy(refs.refreshButton, true);
  appendActivity("Atualizando estado", "orquestrador");
  try {
    const state = await window.rayx.getState();
    renderState(state);
    showToast("RayX atualizado.");
    appendActivity("Estado atualizado", `${state.mode || "modo"} / ${state.adapters?.length || 0} adaptadores`);
  } catch (error) {
    refs.statusText.textContent = error.stack || error.message || String(error);
    showToast("Falha ao carregar estado RayX.");
    appendActivity("Falha ao atualizar estado", error.message || String(error));
  } finally {
    setButtonBusy(refs.refreshButton, false);
  }
}

async function runCycle() {
  setButtonBusy(refs.cycleButton, true);
  showToast("Rodando ciclo local...");
  appendActivity("Ciclo iniciado", "orquestrador");
  try {
    const state = await window.rayx.runCycle();
    renderState(state);
    showToast("Ciclo local concluido.");
    appendActivity("Ciclo concluido", `${state.lastCycle?.adapters?.ready || 0} adaptadores ready`);
  } catch (error) {
    refs.statusText.textContent = error.stack || error.message || String(error);
    showToast("Falha no ciclo local.");
    appendActivity("Falha no ciclo", error.message || String(error));
  } finally {
    setButtonBusy(refs.cycleButton, false);
  }
}

async function runPayloadAction(label, action, button = null) {
  setButtonBusy(button, true);
  showToast(`${label} em andamento...`);
  appendActivity(`${label} iniciado`);
  try {
    const payload = await action();
    refs.statusText.textContent = JSON.stringify(payload, null, 2);
    showToast(`${label} concluido.`);
    appendActivity(`${label} concluido`);
    return payload;
  } catch (error) {
    refs.statusText.textContent = error.stack || error.message || String(error);
    showToast(`${label} falhou.`);
    appendActivity(`${label} falhou`, error.message || String(error));
    return null;
  } finally {
    setButtonBusy(button, false);
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

async function sendMission() {
  const message = refs.missionInput.value.trim();
  if (!message) {
    showToast("Digite uma missao para o RayX.");
    return;
  }

  setButtonBusy(refs.missionButton, true);
  refs.conversationState.textContent = "coletando";
  addMessage("user", message, "voce");
  addMessage("system", "RayX coletando doctor, catalogo, Hermes e Chrome/CDP em paralelo...", "missao");
  appendActivity("Missao iniciada", message.slice(0, 80));
  showToast("Missao RayX em andamento...");
  try {
    const turn = await window.rayx.ask(message);
    addMessage("rayx", turn.answer, "RayX");
    renderMissionEvidence(turn);
    refs.missionInput.value = "";
    refs.conversationState.textContent = "respondido";
    showToast("Missao respondida.");
    appendActivity("Missao respondida", `${turn.mission?.jobs?.length || 0} lanes`);
    await loadState();
  } catch (error) {
    addMessage("system", error.stack || error.message || String(error), "erro");
    refs.conversationState.textContent = "erro";
    showToast("Missao falhou.");
    appendActivity("Missao falhou", error.message || String(error));
  } finally {
    setButtonBusy(refs.missionButton, false);
  }
}

refs.missionButton.addEventListener("click", sendMission);
refs.missionInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
    sendMission();
  }
});
refs.refreshButton.addEventListener("click", loadState);
refs.bootButton.addEventListener("click", async () => {
  await runPayloadAction("Boot RayX", () => window.rayx.runBoot(), refs.bootButton);
  await loadState();
});
refs.cycleButton.addEventListener("click", runCycle);
refs.catalogButton.addEventListener("click", () => runPayloadAction("Catalogo", () => window.rayx.scanCatalog(), refs.catalogButton));
refs.hermesButton.addEventListener("click", () => runPayloadAction("Hermes", () => window.rayx.getHermes(), refs.hermesButton));
refs.chromeBridgeButton.addEventListener("click", () => runPayloadAction("Chrome/CDP", () => window.rayx.getChromeBridge(), refs.chromeBridgeButton));
refs.dashboardButton.addEventListener("click", () => openTarget("dashboard"));
refs.companionButton.addEventListener("click", () => openTarget("companion"));

addMessage("rayx", "Area de trabalho pronta. Escreva uma missao e eu coleto contexto nas lanes locais antes de responder.", "RayX");
renderMissionEvidence(null);
renderActivity();
loadState();
setInterval(() => {
  if (!document.hidden && latestState) loadState();
}, 60000);
