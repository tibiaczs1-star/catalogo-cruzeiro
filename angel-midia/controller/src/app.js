import { api } from "./api.js";
import { renderDeviceMap, renderTvs } from "./tvs.js";
import {
  renderLibrary,
  renderPlaylists,
  renderSchedule,
  renderLive,
  renderReports,
} from "./orchestration.js";
import { getSoundPreferences, playUiSound, toggleUiSounds } from "./sound.js";
import { renderAppsPage } from "./apps.js";
import { renderFinance } from "./finance.js";
import { renderEmergency } from "./emergency.js";
import { angelIcon } from "./angel-icons.js";
const NAV = [
  "Visão geral",
  "Mapa das TVs",
  "Biblioteca",
  "Playlists",
  "Programação",
  "Ao vivo",
  "Relatórios",
  "Empresas",
  "Relâmpago",
  "Aplicativos",
  "Ajuda",
];
const RELEASE = "2026.08.21.2";
const HELP_SECTION_TITLE = "Primeiros passos";
const NAV_ICONS = [
  "dashboard",
  "pin",
  "image",
  "playlist",
  "clock",
  "live",
  "chart",
  "company",
  "emergency",
  "apk",
  "help",
];
const esc = (v) =>
  String(v ?? "").replace(
    /[&<>'"]/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[
        c
      ],
  );
const asList = (v, k) =>
  Array.isArray(v) ? v : Array.isArray(v?.[k]) ? v[k] : [];
function loginView(root, client) {
  root.innerHTML = `<main class="login" data-view="login"><section class="login-panel"><div class="logo-mark">AM</div><p class="eyebrow">Angel Mídia Play</p><h1>Comande sua rede.</h1><p class="login-copy">Mídias, playlists, mapas e cada tela sob controle — de qualquer lugar.</p><form class="login-form"><label>Usuário<input name="identifier" autocomplete="username" required value="admin"></label><label>Senha<input name="password" type="password" autocomplete="current-password" required></label><p class="form-error" role="alert" hidden></p><button class="primary">Entrar no painel</button></form><button class="ghost" type="button" data-sound-toggle>${getSoundPreferences().muted ? "Ativar sons" : "Silenciar sons"}</button><div class="app-downloads"><a href="./downloads/angel-midia-admin.apk?v=${RELEASE}" download>↓ APK Admin</a><a href="./downloads/angel-midia-tv.apk?v=${RELEASE}" download>↓ APK TV</a></div><small class="release">Versão ${RELEASE}</small></section><aside class="brand-plane"><span>PLAY</span><div><b>online</b><small>sincronizado</small></div></aside></main>`;
  root.querySelector("[data-sound-toggle]").onclick = (e) => {
    const prefs = toggleUiSounds();
    e.currentTarget.textContent = prefs.muted
      ? "Ativar sons"
      : "Silenciar sons";
  };
  root.querySelector("form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const f = e.currentTarget,
      b = f.querySelector("button"),
      err = f.querySelector("[role=alert]");
    b.disabled = true;
    err.hidden = true;
    try {
      await client("/auth/login", {
        method: "POST",
        body: {
          identifier: f.querySelector("[name=identifier]").value.trim(),
          password: f.querySelector("[name=password]").value,
        },
      });
      playUiSound("start");
      await authenticatedView(root, client);
    } catch {
      playUiSound("error");
      err.textContent = "Usuário ou senha inválidos.";
      err.hidden = false;
    } finally {
      b.disabled = false;
    }
  });
}
async function loadAll(client) {
  const competence = new Date().toISOString().slice(0, 7);
  const paths = [
    "/admin/devices",
    "/admin/campaigns",
    "/admin/media",
    "/admin/playlists",
    "/admin/groups",
    "/admin/schedules",
    "/admin/live",
    "/admin/reports",
    "/admin/advertisers",
    `/admin/financial-report?competence=${competence}`,
    "/admin/emergency",
  ];
  const keys = [
    "devices",
    "campaigns",
    "media",
    "playlists",
    "groups",
    "schedules",
    "live",
    "reports",
    "advertisers",
    "financial",
    "emergency",
  ];
  const values = await Promise.allSettled(paths.map((p) => client(p)));
  return Object.fromEntries(
    keys.map((k, i) => [
      k,
      values[i].status === "fulfilled" ? values[i].value : null,
    ]),
  );
}
async function authenticatedView(root, client) {
  let admin;
  try {
    admin = await client("/auth/me");
  } catch {
    return loginView(root, client);
  }
  let data = await loadAll(client);
  root.innerHTML = `<div class="shell"><aside class="sidebar"><div class="brand"><div class="logo-mark">AM</div><span>Angel Mídia</span><strong>Play</strong></div><nav>${NAV.map((n, i) => `<button data-nav="${i}" aria-current="${i ? "false" : "page"}"><span>${String(i + 1).padStart(2, "0")}</span>${angelIcon(NAV_ICONS[i])}${n}</button>`).join("")}</nav><button class="sidebar-help" data-help>${angelIcon("help")}<span><b>Precisa de ajuda?</b><small>Acesse tutoriais e dúvidas.</small></span></button><div class="account"><span>SUPERADMIN</span><strong>${esc(admin.name || admin.email || "admin")}</strong><small>v${RELEASE}</small><button data-logout>${angelIcon("user")}Sair</button></div></aside><main class="workspace"></main></div>`;
  const workspace = root.querySelector(".workspace");
  const refresh = async (index) => {
    data = await loadAll(client);
    show(index);
  };
  function overview() {
    const devices = asList(data.devices, "devices"),
      live = asList(data.live, "devices"),
      media = asList(data.media, "media"),
      playlists = asList(data.playlists, "playlists"),
      schedules = asList(data.schedules, "schedules");
    const online =
      live.filter((d) => d.online).length ||
      devices.filter((d) => d.online).length;
    workspace.innerHTML = `<header class="page-head hero"><div><p class="eyebrow">Central de comando</p><h1>O que você quer<br><em>colocar no ar?</em></h1><p>Siga as etapas abaixo. O painel mostra o próximo passo e mantém toda a rede visível.</p></div><span class="live-dot">sistema online</span></header><section class="dashboard-guide" aria-label="Atividades principais"><button class="action-card" data-jump="2">${angelIcon("image")}<span><b>1. Enviar mídia</b><small>Adicione fotos e vídeos à biblioteca.</small></span><i>Começar →</i></button><button class="action-card" data-jump="3">${angelIcon("playlist")}<span><b>2. Montar playlist</b><small>Defina a ordem, duração e repetição.</small></span><i>Organizar →</i></button><button class="action-card" data-jump="1">${angelIcon("tv")}<span><b>3. Escolher TVs</b><small>Confira aparelhos, grupos e locais.</small></span><i>Ver TVs →</i></button><button class="action-card action-card-primary" data-jump="4">${angelIcon("play")}<span><b>4. Colocar no ar</b><small>Programe a playlist no conjunto certo.</small></span><i>Publicar →</i></button></section><section class="kpi-grid"><article><span>TVs online</span><strong data-count="online">${online}</strong><small>de ${devices.length} cadastradas</small></article><article><span>Biblioteca</span><strong>${media.length}</strong><small>arquivos disponíveis</small></article><article><span>Playlists</span><strong>${playlists.length}</strong><small>sequências prontas</small></article><article><span>Programações</span><strong>${schedules.length}</strong><small>regras publicadas</small></article></section><section class="glass overview-map"><header><div><p class="eyebrow">Rede em campo</p><h2>Mapa geral das TVs</h2></div><button class="ghost" data-jump="1">Abrir mapa completo →</button></header><div data-overview-map></div></section>`;
    renderDeviceMap(
      workspace.querySelector("[data-overview-map]"),
      devices,
      () => show(1),
    );
    workspace
      .querySelectorAll("[data-jump]")
      .forEach((b) => (b.onclick = () => show(Number(b.dataset.jump))));
  }
  function help() {
    workspace.innerHTML = `<section data-view="help" class="help-center"><header class="page-head"><div><p class="eyebrow">Suporte Angel Mídia</p><h1>Central de Ajuda</h1><p>Do primeiro aparelho à comprovação de exibições, tudo explicado sem linguagem técnica.</p></div></header><section class="help-steps"><article><b>01</b>${angelIcon("tv")}<h2>Cadastre a TV</h2><p>Abra o APK TV, informe nome e local. O aparelho aparece no Mapa das TVs.</p></article><article><b>02</b>${angelIcon("image")}<h2>Envie as mídias</h2><p>Na Biblioteca, envie imagens ou vídeos e confira a prévia completa.</p></article><article><b>03</b>${angelIcon("playlist")}<h2>Monte a playlist</h2><p>Adicione, repita e ordene conteúdos. Ajuste duração, corte, volume e enquadramento.</p></article><article><b>04</b>${angelIcon("play")}<h2>Coloque no ar</h2><p>Vincule a playlist a um conjunto de TVs. No modo contínuo, o último item volta ao primeiro.</p></article></section><section class="help-docs"><article><h2>${angelIcon("apk")} APK Administrador</h2><ul><li>Use no celular para administrar TVs, mídias, empresas e relatórios.</li><li>Instale atualizações sobre o aplicativo atual para preservar o acesso.</li><li>A senha nunca aparece nos relatórios ou nas telas das TVs.</li></ul></article><article><h2>${angelIcon("tv")} APK TV</h2><ul><li>Instale no stick/TV e faça o cadastro inicial do local.</li><li>Mantenha atualizações automáticas ativadas.</li><li>O conteúdo baixa para o cache e continua tocando durante oscilações de internet.</li></ul></article></section><section class="help-faq"><h2>Dúvidas frequentes</h2><details open><summary>A playlist volta ao primeiro conteúdo?</summary><p>Sim. Programações contínuas repetem toda a sequência sem parar.</p></details><details><summary>A TV ficou offline. O que verificar?</summary><p>Confira internet, energia e se o APK TV está aberto. O painel registra a última conexão.</p></details><details><summary>Como interromper todas as TVs?</summary><p>Use Relâmpago para publicar uma mídia emergencial em toda a rede, com prioridade imediata.</p></details><details><summary>Onde vejo a comprovação?</summary><p>Relatórios mostram TV, local, mídia, quantidade de exibições e segundos reproduzidos.</p></details></section></section>`;
    workspace
      .querySelector(".help-steps")
      .insertAdjacentHTML(
        "beforebegin",
        `<h2 class="help-section-title">${HELP_SECTION_TITLE}</h2>`,
      );
  }
  function show(i) {
    root
      .querySelectorAll("[data-nav]")
      .forEach((b, n) =>
        b.setAttribute("aria-current", n === i ? "page" : "false"),
      );
    workspace.dataset.view = [
      "overview",
      "tvs",
      "library",
      "playlists",
      "schedule",
      "live",
      "reports",
      "finance",
      "emergency",
      "apps",
      "help",
    ][i];
    if (i === 0) overview();
    if (i === 1) renderTvs(workspace, asList(data.devices, "devices"), client);
    if (i === 2) renderLibrary(workspace, data.media, client, () => refresh(i));
    if (i === 3)
      renderPlaylists(workspace, data.playlists, data.media, client, () =>
        refresh(i),
      );
    if (i === 4)
      renderSchedule(
        workspace,
        {
          playlists: data.playlists,
          devices: data.devices,
          groups: data.groups,
          schedules: data.schedules,
        },
        client,
        () => refresh(i),
      );
    if (i === 5) renderLive(workspace, data.live);
    if (i === 6) renderReports(workspace, data.reports);
    if (i === 7)
      renderFinance(
        workspace,
        {
          ...(data.financial || {}),
          companies: asList(data.advertisers, "advertisers"),
        },
        asList(data.media, "media"),
        client,
        () => refresh(i),
      );
    if (i === 8)
      renderEmergency(
        workspace,
        data.emergency,
        asList(data.media, "media"),
        client,
        () => refresh(i),
      );
    if (i === 9) void renderAppsPage(workspace);
    if (i === 10) help();
  }
  root.querySelectorAll("[data-nav]").forEach(
    (b) =>
      (b.onclick = () => {
        playUiSound("selection");
        show(Number(b.dataset.nav));
      }),
  );
  root.querySelector("[data-help]").onclick = () => show(10);
  root.querySelector("[data-logout]").onclick = async () => {
    try {
      await client("/auth/logout", { method: "POST" });
    } finally {
      loginView(root, client);
    }
  };
  show(0);
}
export async function createApp({
  root = document.querySelector("#app"),
  apiClient = api,
} = {}) {
  if (!root) throw new Error("App root not found");
  if (typeof navigator !== "undefined" && "serviceWorker" in navigator) {
    try {
      Promise.resolve(
        navigator.serviceWorker.register("./sw.js", { scope: "./" }),
      ).catch(() => {});
    } catch {}
  }
  try {
    await apiClient("/auth/me");
    await authenticatedView(root, apiClient);
  } catch {
    loginView(root, apiClient);
  }
}
if (typeof document !== "undefined" && document.querySelector("#app"))
  createApp();
