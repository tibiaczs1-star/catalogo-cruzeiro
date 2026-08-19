import { api } from './api.js';
import { renderTvs as renderTvManagement } from './tvs.js';
import { renderCampaignProgramming } from './campaigns.js';

const NAV_ITEMS = ['Visão geral', 'TVs', 'Campanhas', 'Programação'];

function loginView(root, apiClient) {
  root.innerHTML = `
    <main class="login" data-view="login">
      <section class="login-panel" aria-labelledby="login-title">
        <p class="eyebrow">Angel Mídia Play</p>
        <h1 id="login-title">AppStation</h1>
        <p class="login-copy">Controle suas TVs e programações de qualquer lugar.</p>
        <form class="login-form">
          <label>E-mail<input name="email" type="email" autocomplete="username" required></label>
          <label>Senha<input name="password" type="password" autocomplete="current-password" required></label>
          <p class="form-error" role="alert" hidden></p>
          <button class="primary" type="submit">Entrar</button>
        </form>
        <div class="app-downloads" aria-label="Baixar aplicativos">
          <a href="./downloads/angel-midia-admin.apk" download>Baixar app Admin</a>
          <a href="./downloads/angel-midia-tv.apk" download>Baixar app da TV</a>
        </div>
      </section>
      <aside class="brand-plane" aria-hidden="true"><span>TV</span><strong>online</strong></aside>
    </main>`;

  root.querySelector('form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const submit = form.querySelector('button');
    const error = form.querySelector('[role="alert"]');
    submit.disabled = true;
    error.hidden = true;
    try {
      await apiClient('/auth/login', {
        method: 'POST',
        body: {
          email: form.querySelector('[name="email"]').value.trim(),
          password: form.querySelector('[name="password"]').value,
        },
      });
      await authenticatedView(root, apiClient);
    } catch {
      error.textContent = 'E-mail ou senha inválidos.';
      error.hidden = false;
    } finally {
      submit.disabled = false;
    }
  });
}

function metric(label, value, key, note) {
  return `<div class="metric"><span>${label}</span><strong data-count="${key}">${value}</strong><small>${note}</small></div>`;
}

async function authenticatedView(root, apiClient) {
  const [adminResult, devicesResult, campaignsResult] = await Promise.allSettled([
    apiClient('/auth/me'),
    apiClient('/admin/devices'),
    apiClient('/admin/campaigns'),
  ]);
  if (adminResult.status !== 'fulfilled') return loginView(root, apiClient);
  const admin = adminResult.value;
  const devicesAvailable = devicesResult.status === 'fulfilled' && Array.isArray(devicesResult.value);
  const campaignsAvailable = campaignsResult.status === 'fulfilled' && Array.isArray(campaignsResult.value);
  const devices = devicesAvailable ? devicesResult.value : [];
  const campaigns = campaignsAvailable ? campaignsResult.value : [];
  const dataAvailable = devicesAvailable && campaignsAvailable;
  const online = devices.filter((item) => item.status === 'active' && item.online).length;
  const offline = devices.filter((item) => item.status === 'active' && !item.online).length;
  const pending = devices.filter((item) => item.status === 'pending').length;
  const activeCampaigns = campaigns.filter((item) => item.status === 'approved' || item.status === 'active').length;

  root.innerHTML = `
    <div class="shell">
      <aside class="sidebar">
        <a class="brand" href="#overview" aria-label="Angel AppStation — início"><span>Angel</span><strong>AppStation</strong></a>
        <nav aria-label="Áreas principais">
          ${NAV_ITEMS.map((label, index) => `<button type="button" data-nav="${index}" aria-current="${index === 0 ? 'page' : 'false'}">${label}</button>`).join('')}
        </nav>
        <div class="account"><span>Conectado como</span><strong>${escapeHtml(admin.name || admin.email || 'Administrador')}</strong><button type="button" data-logout>Sair</button></div>
      </aside>
      <main class="workspace"></main>
    </div>`;

  const workspace = root.querySelector('.workspace');
  const views = ['overview', 'tvs', 'campaigns', 'schedule'];
  const retry = () => authenticatedView(root, apiClient);
  const renderOverview = () => `
    <header class="topbar"><div><p class="eyebrow">Agora</p><h1>Visão geral</h1></div><p class="live${dataAvailable ? '' : ' is-error'}" role="status" aria-live="polite"><span></span>${dataAvailable ? 'Sistema disponível' : 'Dados indisponíveis'}</p></header>
    <section class="summary" aria-label="Resumo operacional">
      ${metric('TVs online', devicesAvailable ? online : '—', 'online', 'contato nos últimos 90 s')}
      ${metric('TVs offline', devicesAvailable ? offline : '—', 'offline', 'sem contato recente')}
      ${metric('Pendentes', devicesAvailable ? pending : '—', 'pending', 'aguardando aprovação')}
      ${metric('Campanhas ativas', campaignsAvailable ? activeCampaigns : '—', 'campaigns', 'aprovadas para exibição')}
    </section>
    <section class="next-action" aria-labelledby="next-title"><div><p class="eyebrow">Próximo passo</p><h2 id="next-title">${dataAvailable ? (pending ? `${pending} ${pending === 1 ? 'TV precisa' : 'TVs precisam'} de aprovação` : 'Operação em dia') : 'Não foi possível carregar todos os dados'}</h2><p>${dataAvailable ? (pending ? 'Revise o nome e o local antes de liberar a exibição.' : 'As TVs aprovadas estão prontas para receber programação.') : 'Confira sua conexão e tente novamente.'}</p></div><button type="button" class="primary" ${dataAvailable ? 'data-go-tvs' : 'data-retry'}>${dataAvailable ? (pending ? 'Revisar TVs' : 'Ver TVs') : 'Tentar novamente'}</button></section>`;
  const renderTvsArea = () => devicesAvailable ? '' : '<section class="area-panel" data-area="tvs"><p class="eyebrow">Inventário</p><h1>TVs</h1><p>TVs indisponíveis no momento.</p><button type="button" class="primary" data-retry>Tentar novamente</button></section>';
  const renderCampaigns = () => campaignsAvailable ? '' : '<section class="area-panel" data-area="campaigns"><p class="eyebrow">Conteúdo</p><h1>Campanhas</h1><p>Campanhas indisponíveis no momento.</p><button type="button" class="primary" data-retry>Tentar novamente</button></section>';
  const renderSchedule = () => campaignsAvailable ? '' : '<section class="area-panel" data-area="schedule"><p class="eyebrow">Exibição</p><h1>Programação</h1><p>Programação indisponível no momento.</p><button type="button" class="primary" data-retry>Tentar novamente</button></section>';
  const templates = [renderOverview, renderTvsArea, renderCampaigns, renderSchedule];

  function showView(index) {
    root.querySelectorAll('[data-nav]').forEach((item) => item.setAttribute('aria-current', 'false'));
    root.querySelector(`[data-nav="${index}"]`).setAttribute('aria-current', 'page');
    workspace.dataset.view = views[index];
    workspace.innerHTML = templates[index]();
    if (index === 1 && devicesAvailable) renderTvManagement(workspace, devices, apiClient);
    if (index === 2 && campaignsAvailable) renderCampaignProgramming(workspace, { devices, campaigns, apiClient, heading: 'Nova campanha' });
    if (index === 3 && campaignsAvailable) renderCampaignProgramming(workspace, { devices, campaigns, apiClient, heading: 'Programação', area: 'schedule' });
    workspace.querySelector('[data-go-tvs]')?.addEventListener('click', () => showView(1));
    workspace.querySelector('[data-retry]')?.addEventListener('click', retry);
  }

  root.querySelectorAll('[data-nav]').forEach((button) => button.addEventListener('click', () => showView(Number(button.dataset.nav))));
  showView(0);
  root.querySelector('[data-logout]').addEventListener('click', async () => {
    try { await apiClient('/auth/logout', { method: 'POST' }); } finally { loginView(root, apiClient); }
  });
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
}

export async function createApp({ root = document.querySelector('#app'), apiClient = api } = {}) {
  if (!root) throw new Error('App root not found');
  if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
    try {
      Promise.resolve(navigator.serviceWorker.register('./sw.js', { scope: './' })).catch(() => {});
    } catch {
      // A interface continua funcional quando o navegador bloqueia instalação/offline.
    }
  }
  try {
    await apiClient('/auth/me');
    await authenticatedView(root, apiClient);
  } catch {
    loginView(root, apiClient);
  }
}

if (typeof document !== 'undefined' && document.querySelector('#app')) createApp();
