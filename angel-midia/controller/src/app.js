import { api } from "./api.js";
import { renderTvs } from "./tvs.js";
import { renderOperationsOverview } from "./overview.js";
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
import { applyHudPreferences, getHudPreferences } from "./personalization.js";
import { renderDynamics } from "./dynamics.js";
import { renderNetwork } from "./network.js";
import { mountSystemIntro } from "./intro.js";
const NAV = [
  "Visão geral",
  "Mapa das TVs",
  "Biblioteca",
  "Playlists",
  "Programação",
  "Receita & dinâmica",
  "Ao vivo",
  "Relatórios",
  "Empresas",
  "Rede & CRM",
  "Alerta Geral",
  "Aplicativos",
  "Ajuda",
];
const RELEASE = "1.0.0-beta.1";
const HELP_SECTION_TITLE = "Primeiros passos";
const NAV_ICONS = [
  "dashboard",
  "pin",
  "image",
  "playlist",
  "clock",
  "chart",
  "live",
  "chart",
  "company",
  "user",
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
  document.body.classList.remove("is-shell-active");
  root.innerHTML = `<main class="login" data-view="login">
    <section class="system-intro" data-system-intro role="dialog" aria-modal="true" aria-label="Abertura Angel Mídia Play">
      <button class="intro-skip" type="button" data-intro-skip>Entrar agora <span aria-hidden="true">→</span></button>
      <div class="intro-stage">
        <div class="intro-grid" aria-hidden="true"><i></i><i></i><i></i><i></i></div>
        <div class="intro-logo-shell">
          <span class="intro-signal intro-signal-a" aria-hidden="true"></span>
          <span class="intro-signal intro-signal-b" aria-hidden="true"></span>
          <img src="./assets/angel-midia-logo.png" alt="Angel Mídia — Painéis Digitais">
        </div>
        <p class="intro-kicker"><i aria-hidden="true"></i> Angel Mídia Play</p>
        <h2>Sua rede <span>vai entrar no ar.</span></h2>
        <p class="intro-copy">Conteúdo, programação e telas conectadas em um único comando.</p>
        <ol class="intro-steps">
          <li data-intro-step>${angelIcon("image")}<span><b>Mídias</b><small>prontas</small></span></li>
          <li data-intro-step>${angelIcon("playlist")}<span><b>Playlists</b><small>sincronizadas</small></span></li>
          <li data-intro-step>${angelIcon("tv")}<span><b>TVs</b><small>conectadas</small></span></li>
        </ol>
        <div class="intro-progress" aria-hidden="true"><span></span></div>
        <small class="intro-version">BETA 1.0</small>
      </div>
    </section>
    <section class="login-panel">
      <div class="login-logo" data-login-logo>
        <span class="login-logo-surface"><img src="./assets/angel-midia-logo.png" alt="Angel Mídia — Painéis Digitais"><i aria-hidden="true"></i></span>
        <span class="login-logo-status"><i aria-hidden="true"></i> Sistema pronto</span>
      </div>
      <p class="eyebrow">Angel Mídia Play</p>
      <h1>Comande sua rede.</h1>
      <p class="login-copy">Mídias, playlists, mapas e cada tela sob controle — de qualquer lugar.</p>
      <form class="login-form">
        <label>Usuário<input name="identifier" autocomplete="username" required value="admin"></label>
        <label>Senha<div class="password-control"><input name="password" type="password" autocomplete="current-password" required><button class="password-toggle" type="button" data-password-toggle aria-label="Mostrar senha" aria-pressed="false" title="Mostrar senha">${angelIcon("eye")}</button></div></label>
        <p class="form-error" role="alert" hidden></p>
        <button class="primary" type="submit">Entrar no painel</button>
      </form>
      <button class="ghost" type="button" data-sound-toggle>${getSoundPreferences().muted ? "Ativar sons" : "Silenciar sons"}</button>
      <div class="app-downloads"><a href="./downloads/angel-midia-admin.apk?v=${RELEASE}" download>↓ APK Admin</a><a href="./downloads/angel-midia-tv.apk?v=${RELEASE}" download>↓ APK TV</a></div>
      <small class="release">Beta 1.0 <span>•</span> ${RELEASE}</small>
    </section>
    <aside class="brand-plane" aria-label="A Angel Mídia conecta conteúdo, playlists e telas">
      <div class="brand-story">
        <div class="brand-live-status" data-brand-live>${angelIcon("live")}<span><b>ESTÚDIO VIVO</b> Rede pronta para transmitir</span></div>
        <span class="brand-orbit brand-orbit-cyan" data-brand-orbit aria-hidden="true"></span>
        <span class="brand-orbit brand-orbit-yellow" data-brand-orbit aria-hidden="true"></span>
        <span class="brand-orbit brand-orbit-coral" data-brand-orbit aria-hidden="true"></span>
        <span class="brand-orbit brand-orbit-green" data-brand-orbit aria-hidden="true"></span>
        <svg class="brand-connections" viewBox="0 0 720 620" aria-hidden="true" focusable="false">
          <path d="M171 147 C238 147 250 212 310 248"/>
          <path d="M550 178 C484 184 469 226 412 254"/>
          <path d="M172 473 C247 463 264 408 320 377"/>
          <path class="brand-connection-live" d="M171 147 C238 147 250 212 310 248 M550 178 C484 184 469 226 412 254 M172 473 C247 463 264 408 320 377"/>
        </svg>
        <article class="brand-core-card">
          <header class="brand-studio-bar"><span aria-hidden="true"><i></i><i></i><i></i></span><b>ANGEL STUDIO</b><em>AO VIVO</em></header>
          <div class="brand-logo-window">
            <img src="./assets/angel-midia-logo.png" alt="Angel Mídia — Painéis Digitais">
            <div class="brand-scene-deck">
              <article class="brand-scene brand-scene-ad" data-brand-scene>
                <span class="brand-scene-icon">${angelIcon("chart")}</span>
                <span><small>ADS • 15 SEG</small><strong>Oferta patrocinada</strong><em>Espaço pronto para gerar receita</em></span>
                <b class="brand-price">R$</b>
              </article>
              <article class="brand-scene brand-scene-news" data-brand-scene>
                <span class="brand-scene-icon">${angelIcon("live")}</span>
                <span><small>CZS AGORA</small><strong>Notícia local</strong><em>Informação útil entre campanhas</em></span>
                <b class="brand-signal-dot" aria-hidden="true"></b>
              </article>
              <article class="brand-scene brand-scene-qr" data-brand-scene>
                <span class="brand-qr-mark" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></span>
                <span><small>INTERAÇÃO</small><strong>Siga pelo QR</strong><em>Da TV direto para o celular</em></span>
                <b>↗</b>
              </article>
              <article class="brand-scene brand-scene-campaign" data-brand-scene>
                <span class="brand-scene-icon">${angelIcon("image")}</span>
                <span><small>DESTAQUE</small><strong>Campanha da semana</strong><em>Programação inteligente por horário</em></span>
                <b>PLAY</b>
              </article>
              <article class="brand-scene brand-scene-network" data-brand-scene>
                <span class="brand-scene-icon">${angelIcon("tv")}</span>
                <span><small>NOC ANGEL</small><strong>Rede de telas</strong><em>Status, conteúdo e comando remoto</em></span>
                <b class="brand-screen-count">03</b>
              </article>
            </div>
          </div>
          <div class="brand-core-copy"><strong>Sua rede em movimento</strong><span>Conteúdo certo, na tela certa — automaticamente.</span></div>
        </article>
        <article class="brand-capability brand-capability-media" data-brand-capability>${angelIcon("image")}<span><strong>Conteúdo</strong><small>Imagens e vídeos</small></span></article>
        <article class="brand-capability brand-capability-playlist" data-brand-capability>${angelIcon("playlist")}<span><strong>Playlists</strong><small>Programação inteligente</small></span></article>
        <article class="brand-capability brand-capability-screen" data-brand-capability>${angelIcon("tv")}<span><strong>Telas</strong><small>Rede sob controle</small></span></article>
        <div class="brand-ticker" aria-hidden="true"><span>ANÚNCIOS PAGOS&nbsp;&nbsp;•&nbsp;&nbsp; NOTÍCIAS LOCAIS&nbsp;&nbsp;•&nbsp;&nbsp; MEMES&nbsp;&nbsp;•&nbsp;&nbsp; QR CODE&nbsp;&nbsp;•&nbsp;&nbsp; CAMPANHAS&nbsp;&nbsp;•&nbsp;&nbsp; CONTEÚDO EM TEMPO REAL</span></div>
      </div>
      <footer class="brand-plane-footer"><img src="./assets/angel-wing.svg" alt=""><span><b>Angel Mídia Play</b><small>Controle, programação e transmissão</small></span></footer>
    </aside>
  </main>`;
  mountSystemIntro(root);
  const password = root.querySelector('[name="password"]');
  root.querySelector("[data-password-toggle]").onclick = (event) => {
    const toggle = event.currentTarget;
    const shouldShow = password.type === "password";
    password.type = shouldShow ? "text" : "password";
    toggle.setAttribute("aria-pressed", String(shouldShow));
    toggle.setAttribute("aria-label", shouldShow ? "Ocultar senha" : "Mostrar senha");
    toggle.setAttribute("title", shouldShow ? "Ocultar senha" : "Mostrar senha");
    toggle.innerHTML = angelIcon(shouldShow ? "eyeOff" : "eye");
    password.focus({ preventScroll: true });
  };
  root.querySelector("[data-sound-toggle]").onclick = (e) => {
    const prefs = toggleUiSounds();
    e.currentTarget.textContent = prefs.muted
      ? "Ativar sons"
      : "Silenciar sons";
  };
  root.querySelector("form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const f = e.currentTarget,
      b = f.querySelector('button[type="submit"]'),
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
    } catch (error) {
      playUiSound("error");
      const isInvalidCredentials = error?.status === 401 || error?.code === 'invalid_credentials';
      err.textContent = isInvalidCredentials
        ? "Usuário ou senha inválidos."
        : "O servidor de autenticação está indisponível nesta prévia. Abra o painel conectado ou tente novamente.";
      err.hidden = false;
    } finally {
      b.disabled = false;
    }
  });
}
async function loadAll(client, preferredOrganizationId = '') {
  const competence = new Date().toISOString().slice(0, 7);
  let organizations = null;
  try {
    organizations = await client('/admin/organizations');
  } catch {}
  const organizationList = asList(organizations, 'organizations');
  const preferred = String(preferredOrganizationId || '');
  const selectedOrganizationId = String(
    organizationList.find((organization) => String(organization.id) === preferred)?.id
      ?? organizationList[0]?.id
      ?? preferred,
  );
  const paths = [
    "/admin/devices",
    "/admin/campaigns",
    "/admin/media",
    "/admin/playlists",
    "/admin/groups",
    "/admin/schedules",
    "/admin/dynamic-policy",
    "/admin/live",
    selectedOrganizationId ? `/admin/noc?organizationId=${encodeURIComponent(selectedOrganizationId)}` : null,
    selectedOrganizationId ? `/admin/organizations/${encodeURIComponent(selectedOrganizationId)}/resources` : null,
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
    "dynamics",
    "live",
    "noc",
    "organizationResources",
    "reports",
    "advertisers",
    "financial",
    "emergency",
  ];
  const values = await Promise.allSettled(paths.map((p) => p ? client(p) : Promise.resolve(null)));
  return {
    ...Object.fromEntries(
    keys.map((k, i) => [
      k,
      values[i].status === "fulfilled" ? values[i].value : null,
    ]),
    ),
    organizations,
    selectedOrganizationId,
  };
}
async function authenticatedView(root, client) {
  let admin;
  try {
    admin = await client("/auth/me");
  } catch {
    return loginView(root, client);
  }
  let selectedOrganizationId = String(admin.organizationId ?? admin.organization_id ?? '');
  let scheduleAllOrganizations = false;
  let data = await loadAll(client, selectedOrganizationId);
  selectedOrganizationId = data.selectedOrganizationId;
  document.body.classList.add("is-shell-active");
  root.innerHTML = `<div class="shell"><aside class="sidebar"><div class="brand"><img src="./assets/angel-midia-logo.png" alt="Angel Mídia"><div><span>Angel Mídia</span><strong>Play</strong></div></div><nav>${NAV.map((n, i) => `<button data-nav="${i}" aria-current="${i ? "false" : "page"}">${angelIcon(NAV_ICONS[i])}<span>${n}</span></button>`).join("")}</nav><button class="sidebar-help" data-help>${angelIcon("help")}<span><b>Precisa de ajuda?</b><small>Tutoriais e respostas rápidas</small></span></button><div class="account"><span class="account-avatar">${esc((admin.name || admin.email || "A").slice(0, 1).toUpperCase())}</span><div><small>SUPERADMIN</small><strong>${esc(admin.name || admin.email || "admin")}</strong><em>v${RELEASE}</em></div><button data-logout aria-label="Sair">${angelIcon("user")}</button></div></aside><main class="workspace"></main></div>`;
  const workspace = root.querySelector(".workspace");
  let currentView = 0;
  let viewGeneration = 0;
  let dataGeneration = 0;
  let scopeLoading = false;
  const reloadData = async (organizationId = selectedOrganizationId) => {
    const generation = ++dataGeneration;
    const nextData = await loadAll(client, organizationId);
    if (generation !== dataGeneration) return false;
    data = nextData;
    selectedOrganizationId = nextData.selectedOrganizationId;
    return true;
  };
  const refresh = async (index) => {
    if (scopeLoading) return;
    const generation = viewGeneration;
    if (await reloadData() && generation === viewGeneration) show(index);
  };
  const changeOrganization = async (organizationId, allowEntireNetwork = false) => {
    scopeLoading = true;
    show(currentView);
    if (!await reloadData(organizationId || selectedOrganizationId)) return;
    scheduleAllOrganizations = allowEntireNetwork && !organizationId;
    scopeLoading = false;
    if ([0, 4, 9].includes(currentView)) show(currentView);
  };
  function overview() {
    renderOperationsOverview(workspace, {
      devices: asList(data.devices, "devices"),
      live: asList(data.live, "devices"),
      noc: data.noc || {},
      media: asList(data.media, "media"),
      playlists: asList(data.playlists, "playlists"),
      schedules: asList(data.schedules, "schedules"),
      advertisers: asList(data.advertisers, "advertisers"),
      organizations: data.organizations,
      selectedOrganizationId,
    }, show, {
      client,
      refresh: () => refresh(0),
      organizationId: selectedOrganizationId,
    });
  }
  function help() {
    workspace.innerHTML = `<section data-view="help" class="help-center"><header class="page-head"><div><p class="eyebrow">Suporte Angel Mídia</p><h1>Central de Ajuda</h1><p>Do primeiro aparelho à comprovação de exibições, tudo explicado sem linguagem técnica.</p></div></header><section class="help-concepts workflow-note"><div><b>Empresa da rede</b><p>Use Rede & CRM para organizar a empresa, vincular suas TVs e gerenciar as permissões da equipe já cadastrada.</p></div><div><b>Empresa anunciante</b><p>Use Empresas para cadastrar a marca, vincular suas mídias, mensalidades e resultados.</p></div></section><section class="help-steps"><article><b>01</b>${angelIcon("tv")}<h2>Cadastre a TV</h2><p>Abra o APK TV, informe nome e local. Depois use Rede & CRM para vinculá-la à empresa da rede.</p></article><article><b>02</b>${angelIcon("image")}<h2>Envie as mídias</h2><p>Na Biblioteca, envie imagens ou vídeos e confira a prévia. Se for anúncio, associe a mídia em Empresas.</p></article><article><b>03</b>${angelIcon("playlist")}<h2>Monte a playlist</h2><p>Adicione, repita e ordene conteúdos. Ajuste duração, corte, volume e enquadramento.</p></article><article><b>04</b>${angelIcon("play")}<h2>Coloque no ar</h2><p>Na Programação, escolha a playlist e o destino, confira o resumo e confirme. No modo contínuo, o último item volta ao primeiro.</p></article></section><section class="help-docs"><article><h2>${angelIcon("apk")} APK Administrador</h2><ul><li>Use no celular para administrar TVs, mídias, empresas e relatórios.</li><li>Instale atualizações sobre o aplicativo atual para preservar o acesso.</li><li>A senha nunca aparece nos relatórios ou nas telas das TVs.</li></ul></article><article><h2>${angelIcon("tv")} APK TV</h2><ul><li>Instale no stick/TV e faça o cadastro inicial do local.</li><li>Mantenha atualizações automáticas ativadas.</li><li>O conteúdo baixa para o cache e continua tocando durante oscilações de internet.</li></ul></article></section><section class="help-faq"><h2>Dúvidas frequentes</h2><details open><summary>Qual é a diferença entre as duas áreas de empresa?</summary><p>Rede & CRM controla acesso e TVs da empresa da rede. Empresas controla o anunciante, suas mídias e cobrança.</p></details><details><summary>A playlist volta ao primeiro conteúdo?</summary><p>Sim. Programações contínuas repetem toda a sequência sem parar.</p></details><details><summary>A TV ficou offline. O que verificar?</summary><p>Confira internet, energia e se o APK TV está aberto. O painel registra a última conexão.</p></details><details><summary>Como interromper todas as TVs?</summary><p>Use Alerta Geral para publicar uma mídia emergencial em toda a rede, com prioridade imediata.</p></details><details><summary>Onde vejo a comprovação?</summary><p>Relatórios mostram TV, local, mídia, quantidade de exibições e segundos reproduzidos.</p></details></section></section>`;
    workspace
      .querySelector(".help-steps")
      .insertAdjacentHTML(
        "beforebegin",
        `<h2 class="help-section-title">${HELP_SECTION_TITLE}</h2>`,
      );
  }
  function show(i, context = {}) {
    currentView = i;
    const generation = ++viewGeneration;
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
      "dynamics",
      "live",
      "reports",
      "finance",
      "network",
      "emergency",
      "apps",
      "help",
    ][i];
    if (scopeLoading && [0, 4, 9].includes(i)) {
      workspace.innerHTML = '<section class="network-loading" data-scope-loading role="status"><span></span><b>Carregando a empresa e suas TVs…</b></section>';
      return;
    }
    if (i === 0) overview();
    if (i === 1)
      renderTvs(workspace, asList(data.devices, "devices"), client, {
        selectedDeviceId: context.deviceId,
      });
    if (i === 2) renderLibrary(workspace, data.media, client, () => refresh(i), { initialSourceType: context.sourceType });
    if (i === 3)
      renderPlaylists(
        workspace,
        data.playlists,
        data.media,
        client,
        () => refresh(i),
        { selectedMediaId: context.mediaId },
      );
    if (i === 4) {
      const scheduleOrganizationId = scheduleAllOrganizations ? '' : selectedOrganizationId;
      const selectedOrganization = asList(data.organizations, "organizations").find((organization) => String(organization.id) === String(scheduleOrganizationId));
      const scopedDevices = scheduleOrganizationId ? asList(data.organizationResources, "devices") : asList(data.devices, "devices");
      const scopedDeviceIds = new Set(scopedDevices.map((device) => String(device.id)));
      const scopedGroups = scheduleOrganizationId ? asList(data.groups, "groups").filter((group) => {
        const groupDevices = asList(group.devices, "devices");
        return groupDevices.length > 0 && groupDevices.every((device) => scopedDeviceIds.has(String(typeof device === 'string' ? device : device.id)));
      }) : asList(data.groups, "groups");
      renderSchedule(
        workspace,
        {
          playlists: data.playlists,
          devices: scopedDevices,
          groups: scopedGroups,
          schedules: data.schedules,
        },
        client,
        () => refresh(i),
        {
          organizationId: scheduleOrganizationId,
          organizationName: selectedOrganization?.name || '',
          organizations: data.organizations,
          onScopeChange: (organizationId) => changeOrganization(organizationId, true),
        },
      );
    }
    if (i === 5) renderDynamics(workspace, data.dynamics, asList(data.media, "media"), client, () => refresh(i));
    if (i === 6) renderLive(workspace, data.live);
    if (i === 7) renderReports(workspace, data.reports);
    if (i === 8)
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
    if (i === 9) void renderNetwork(workspace, client, async () => {
      if (!scopeLoading) await reloadData();
    }, selectedOrganizationId, {
      allDevices: asList(data.devices, "devices"),
      isCurrent: () => generation === viewGeneration,
      onOrganizationChange: (organizationId) => changeOrganization(organizationId),
    });
    if (i === 10)
      renderEmergency(
        workspace,
        data.emergency,
        asList(data.media, "media"),
        client,
        () => refresh(i),
      );
    if (i === 11) void renderAppsPage(workspace);
    if (i === 12) help();
    workspace.classList.remove("is-view-entering");
    void workspace.offsetWidth;
    workspace.classList.add("is-view-entering");
  }
  workspace.addEventListener("angel:navigate", (event) => {
    const targetIndex = {
      overview: 0,
      tvs: 1,
      library: 2,
      playlists: 3,
      schedule: 4,
      dynamics: 5,
      live: 6,
      reports: 7,
      finance: 8,
      network: 9,
      emergency: 10,
      apps: 11,
      help: 12,
    }[event.detail?.view];
    if (Number.isInteger(targetIndex)) show(targetIndex, event.detail ?? {});
  });
  root.querySelectorAll("[data-nav]").forEach(
    (b) =>
      (b.onclick = () => {
        playUiSound("selection");
        show(Number(b.dataset.nav));
      }),
  );
  root.querySelector("[data-help]").onclick = () => show(12);
  root.querySelector("[data-logout]").onclick = async () => {
    try {
      await client("/auth/logout", { method: "POST" });
    } finally {
      document.body.classList.remove("is-shell-active");
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
  applyHudPreferences(getHudPreferences());
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
