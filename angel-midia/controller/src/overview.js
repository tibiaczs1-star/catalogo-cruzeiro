import { renderDeviceMap } from './tvs.js';
import { angelIcon } from './angel-icons.js';
import { bindHudPersonalization } from './personalization.js';

const esc = (value) => String(value ?? '').replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));

export const LOCAL_DEMO_DEVICES = [
  { id: 'demo-tv-1', name: 'TV Recepção', company: 'Clínica Vale do Juruá', address: 'Av. 25 de Agosto, Cruzeiro do Sul', linkCode: 'AMP-DEMO1', latitude: -7.6297, longitude: -72.6722, status: 'active', online: true, campaign: 'Setembro Azul', currentMediaName: 'Setembro Azul', lastSeen: 'agora' },
  { id: 'demo-tv-2', name: 'TV Vitrine', company: 'Mercado Juruá', address: 'Centro, Cruzeiro do Sul', linkCode: 'AMP-DEMO2', latitude: -7.6335, longitude: -72.6692, status: 'active', online: true, campaign: 'Ofertas da Semana', currentMediaName: 'Ofertas da Semana', lastSeen: 'há 1 min' },
  { id: 'demo-tv-3', name: 'TV Salão', company: 'Hotel Cruzeiro', address: 'Aeroporto Velho, Cruzeiro do Sul', linkCode: 'AMP-DEMO3', latitude: -7.6228, longitude: -72.6795, status: 'active', online: false, campaign: 'Institucional', currentMediaName: 'Institucional', lastSeen: 'há 18 min' },
];

const localHosts = new Set(['localhost', '127.0.0.1']);
export function devicesForDashboard(devices, hostname = globalThis.location?.hostname) {
  return devices.length || !localHosts.has(hostname) ? devices : LOCAL_DEMO_DEVICES.map((device) => ({ ...device }));
}

const asList = (value, key) => Array.isArray(value) ? value : Array.isArray(value?.[key]) ? value[key] : [];
const deviceId = (device) => String(device?.id ?? device?.deviceId ?? device?.device_id ?? '');
const companyName = (company) => company.name || company.advertiser_name || 'Empresa';
const companyAsset = (company) => company.photo_asset_id || company.photoAssetId || company.logo_asset_id || company.logoAssetId;
const initials = (name) => name.split(/\s+/).slice(0, 2).map((word) => word[0]).join('').toUpperCase();
const healthLabels = { online: 'Online', unstable: 'Instável', offline: 'Offline' };
const commandLabels = { refresh_sync: 'Atualizar conteúdo', restart_player: 'Reiniciar player', clear_media_cache: 'Limpar cache de mídia' };
const LOW_STORAGE_BYTES = 512 * 1024 * 1024;

function googleMapsUrl(device) {
  const query = `${Number(device.latitude)},${Number(device.longitude)}`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

function operationalHealth(device) {
  const candidate = String(device.health ?? device.healthStatus ?? device.connectionStatus ?? '').toLowerCase();
  if (['online', 'unstable', 'offline'].includes(candidate)) return candidate;
  const status = String(device.status ?? '').toLowerCase();
  if (['online', 'unstable', 'offline'].includes(status)) return status;
  return device.online === false ? 'offline' : 'online';
}

function relativeLastSeen(lastSeenAt, generatedAt) {
  const seenAt = new Date(lastSeenAt).getTime();
  const snapshotAt = new Date(generatedAt).getTime();
  if (!Number.isFinite(seenAt) || !Number.isFinite(snapshotAt)) return String(lastSeenAt || 'Não informado');
  const elapsedMinutes = Math.max(0, Math.floor((snapshotAt - seenAt) / 60_000));
  if (elapsedMinutes < 1) return 'agora';
  if (elapsedMinutes < 60) return `há ${elapsedMinutes} min`;
  const elapsedHours = Math.floor(elapsedMinutes / 60);
  if (elapsedHours < 24) return `há ${elapsedHours} h`;
  return new Date(seenAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

function mergeOperationalDevices(baseDevices, liveDevices, nocDevices, generatedAt) {
  const records = new Map();
  [baseDevices, liveDevices, nocDevices].forEach((source) => source.forEach((item) => {
    const id = deviceId(item);
    if (!id) return;
    records.set(id, { ...(records.get(id) || {}), ...item, id });
  }));
  return [...records.values()].map((device) => {
    const health = operationalHealth(device);
    const lastSeenAt = device.lastSeenAt ?? device.last_seen_at ?? device.telemetryAt ?? device.telemetry_at;
    const storageValue = device.freeStorageBytes ?? device.free_storage_bytes;
    return {
      ...device,
      health,
      online: health === 'online',
      company: device.company ?? device.companyName ?? device.advertiserName ?? 'Sem empresa',
      currentMediaName: device.currentMediaName ?? device.current_media_name ?? device.mediaName ?? device.campaign ?? 'Sem mídia em exibição',
      lastSeen: lastSeenAt ? relativeLastSeen(lastSeenAt, generatedAt) : device.lastSeen ?? device.last_seen ?? (health === 'online' ? 'agora' : 'sem sinal'),
      appVersion: device.appVersion ?? device.app_version ?? 'Não informada',
      freeStorageBytes: storageValue == null ? null : Number(storageValue),
      errorMessage: device.errorMessage ?? device.error_message ?? '',
    };
  });
}

const hasLowStorage = (device) => device.freeStorageBytes != null && Number.isFinite(device.freeStorageBytes) && device.freeStorageBytes < LOW_STORAGE_BYTES;
const needsAttention = (device) => device.health !== 'online' || Boolean(device.errorMessage) || hasLowStorage(device);
const formatStorage = (bytes) => bytes != null && Number.isFinite(bytes) ? `${(bytes / 1_000_000_000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} GB livres` : 'Não informado';
const idempotencyKey = (device, type) => `${device.id}:${type}:${globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`}`;

function deriveOperationalAlerts(devices) {
  return devices.flatMap((device) => {
    const alerts = [];
    if (device.health === 'offline') alerts.push({ deviceId: device.id, deviceName: device.name, severity: 'critical', message: 'TV offline' });
    if (device.health === 'unstable') alerts.push({ deviceId: device.id, deviceName: device.name, severity: 'warning', message: 'Conexão instável' });
    if (device.errorMessage) alerts.push({ deviceId: device.id, deviceName: device.name, severity: 'critical', message: `Erro no player: ${device.errorMessage}` });
    if (hasLowStorage(device)) alerts.push({ deviceId: device.id, deviceName: device.name, severity: 'warning', message: 'Armazenamento baixo' });
    return alerts;
  });
}

export function renderOperationsOverview(root, payload, openView, options = {}) {
  const organizationId = String(
    options.organizationId
      ?? payload.selectedOrganizationId
      ?? payload.organizationId
      ?? asList(payload.organizations, 'organizations')[0]?.id
      ?? '',
  );
  const sourceDevices = asList(payload.devices, 'devices');
  const dashboardDevices = devicesForDashboard(sourceDevices);
  const liveDevices = asList(payload.live, 'devices');
  const noc = payload.noc || {};
  const devices = mergeOperationalDevices(dashboardDevices, liveDevices, asList(noc, 'devices'), noc.generatedAt);
  const alerts = [...asList(noc, 'alerts'), ...deriveOperationalAlerts(devices)].filter((alert, index, all) => {
    const key = `${alert.deviceId ?? alert.device_id}|${alert.message || ''}`;
    return all.findIndex((candidate) => `${candidate.deviceId ?? candidate.device_id}|${candidate.message || ''}` === key) === index;
  });
  const isDemo = sourceDevices.length === 0 && dashboardDevices.length > 0;
  const companies = asList(payload.advertisers, 'advertisers');
  const media = asList(payload.media, 'media');
  const playlists = asList(payload.playlists, 'playlists');
  const schedules = asList(payload.schedules, 'schedules');
  const counts = {
    online: devices.filter((device) => device.health === 'online').length,
    unstable: devices.filter((device) => device.health === 'unstable').length,
    offline: devices.filter((device) => device.health === 'offline').length,
    attention: devices.filter(needsAttention).length,
  };
  const availability = devices.length ? Math.round((counts.online / devices.length) * 1000) / 10 : 0;
  const gallery = companies.slice(0, 3);
  const emptyInspector = `<button class="inspector-close" aria-label="Fechar orientação">×</button><div class="noc-empty-selection"><img src="./assets/angel-noc-empty.webp" alt="Central Angel Mídia conectando e monitorando telas de TV"><b>${devices.length ? 'Selecione uma TV' : 'Sua rede começa aqui'}</b><small>${devices.length ? 'Clique em uma TV ou marcador para ver telemetria e ações seguras.' : 'Cadastre a primeira TV para acompanhar sinal, mídia e alertas.'}</small></div>`;

  root.innerHTML = `<section class="operations-dashboard" data-view="operations">
    <header class="operations-heading">
      <div><p class="eyebrow">Central de operações</p><h1>Sua rede, <em>sob controle.</em></h1><p>Monitore sinal, conteúdo e alertas. Ações remotas ficam solicitadas até a TV confirmar.</p></div>
      <div class="heading-actions"><label class="network-search">${angelIcon('search')}<input type="search" data-noc-search placeholder="Buscar TV, empresa ou mídia" aria-label="Buscar TV, empresa ou mídia"></label><button class="ghost hud-customize-button" data-hud-personalize aria-pressed="false">${angelIcon('dashboard')} Personalizar HUD</button><button class="primary publish-button" data-publish-network>${angelIcon('play')} Publicar na rede</button></div>
    </header>
    <aside class="hud-customizer" data-hud-customizer hidden aria-label="Personalização do painel">
      <header><div><p class="eyebrow">Seu espaço de trabalho</p><h2>Personalizar HUD</h2></div><p>Arraste os quadros ou use as setas. O layout fica salvo neste dispositivo.</p></header>
      <div class="hud-preference-group"><span>Aparência</span><div><button data-hud-theme="light" aria-pressed="true">Claro</button><button data-hud-theme="dark" aria-pressed="false">Noturno</button></div></div>
      <div class="hud-preference-group"><span>Densidade</span><div><button data-hud-density="comfortable" aria-pressed="true">Confortável</button><button data-hud-density="compact" aria-pressed="false">Compacta</button></div></div>
      <div class="hud-preference-group"><span>Movimento</span><div><button data-hud-motion="full" aria-pressed="true">Suave</button><button data-hud-motion="reduced" aria-pressed="false">Reduzido</button></div></div>
      <div class="hud-preference-group hud-visibility-group"><span>Setores visíveis</span><div><button data-hud-visibility="summary" aria-pressed="true">Resumo</button><button data-hud-visibility="map" aria-pressed="true">Mapa</button><button data-hud-visibility="inventory" aria-pressed="true">TVs</button><button data-hud-visibility="companies" aria-pressed="true">Empresas</button><button data-hud-visibility="sync" aria-pressed="true">Sincronização</button></div></div>
      <button class="ghost hud-reset" data-hud-reset>Restaurar layout</button>
    </aside>
    ${isDemo ? '<p class="demo-notice">Dados de demonstração local — as três TVs abaixo existem apenas para validar o mapa e o layout.</p>' : ''}
    <section class="hud-widgets" data-hud-grid>
      <section class="hud-widget hud-widget-summary" data-hud-widget="summary" draggable="false">
        <div class="hud-widget-tools"><span title="Arrastar quadro">••</span><button data-hud-move="previous" aria-label="Mover resumo para cima">↑</button><button data-hud-move="next" aria-label="Mover resumo para baixo">↓</button></div>
        <div class="operations-ribbon" aria-label="Saúde operacional da rede">
          <article class="noc-kpi is-online" data-noc-kpi="online"><span class="status-orb">●</span><div><small>Online agora</small><strong>${counts.online}</strong></div></article>
          <article class="noc-kpi is-unstable" data-noc-kpi="unstable"><span class="status-orb">≈</span><div><small>Instáveis</small><strong>${counts.unstable}</strong></div></article>
          <article class="noc-kpi is-offline" data-noc-kpi="offline"><span class="status-orb">×</span><div><small>Offline</small><strong>${counts.offline}</strong></div></article>
          <article class="noc-kpi is-attention" data-noc-kpi="attention"><span class="status-orb">!</span><div><small>Pedem atenção</small><strong>${counts.attention}</strong></div></article>
          <article class="ribbon-progress"><div><small>Disponibilidade agora</small><strong>${availability}%</strong></div><i><b style="width:${availability}%"></b></i></article>
        </div>
      </section>
      <section class="network-map-card hud-widget hud-widget-map" data-hud-widget="map" draggable="false">
        <div class="hud-widget-tools"><span title="Arrastar quadro">••</span><button data-hud-move="previous" aria-label="Mover mapa para cima">↑</button><button data-hud-move="next" aria-label="Mover mapa para baixo">↓</button></div>
        <header><div><p class="eyebrow">Rede em campo</p><h2>Mapa da rede</h2></div><div class="map-legend"><span><i class="online"></i>Online</span><span><i class="attention"></i>Atenção</span><button class="ghost" data-open-tvs>Mapa completo →</button></div></header>
        <div class="network-map-stage"><div data-network-map></div><aside class="network-inspector is-open is-empty" data-network-inspector aria-live="polite">${emptyInspector}</aside></div>
      </section>
      <article class="inventory-card hud-widget hud-widget-inventory" data-hud-widget="inventory" draggable="false" data-tv-inventory>
        <div class="hud-widget-tools"><span title="Arrastar quadro">••</span><button data-hud-move="previous" aria-label="Mover inventário para cima">↑</button><button data-hud-move="next" aria-label="Mover inventário para baixo">↓</button></div>
        <header class="inventory-heading"><div><p class="eyebrow">Central de TVs</p><h2>Saúde, mídia e comandos</h2></div><div class="inventory-actions"><button class="ghost" data-noc-refresh>${angelIcon('rotate')} Atualizar</button><button class="ghost" data-open-tvs>Gerenciar TVs →</button></div></header>
        <div class="noc-filters" aria-label="Filtrar TVs por saúde"><button data-noc-filter="all" aria-pressed="true">Todas <b>${devices.length}</b></button><button data-noc-filter="online" aria-pressed="false">Online <b>${counts.online}</b></button><button data-noc-filter="unstable" aria-pressed="false">Instáveis <b>${counts.unstable}</b></button><button data-noc-filter="offline" aria-pressed="false">Offline <b>${counts.offline}</b></button></div>
        <section class="noc-alerts" aria-label="Alertas operacionais"><header><b>Alertas ativos</b><span>${alerts.length}</span></header>${alerts.length ? alerts.map((alert) => `<button data-noc-alert data-device-id="${esc(alert.deviceId ?? alert.device_id)}"><span class="alert-severity is-${esc(alert.severity || 'warning')}">!</span><span><b>${esc(alert.message || 'Atenção necessária')}</b><small>${esc(alert.deviceName || devices.find((device) => device.id === String(alert.deviceId ?? alert.device_id))?.name || 'TV da rede')}</small></span></button>`).join('') : '<p class="noc-all-clear">Nenhum alerta ativo na rede.</p>'}</section>
        <div class="table-wrap"><table><thead><tr><th>TV</th><th>Empresa</th><th>Mídia atual</th><th>Último sinal</th><th>Aplicativo</th><th>Saúde</th></tr></thead><tbody>${devices.map((device, index) => `<tr data-overview-device="${esc(device.id)}" data-health="${device.health}" data-search="${esc(`${device.name || ''} ${device.company || ''} ${device.currentMediaName || ''} ${device.address || ''}`.toLowerCase())}"><td><span class="table-device-index">${index + 1}</span><b>${esc(device.name || 'TV sem nome')}</b><small>${esc(device.address || 'Local não informado')}</small></td><td>${esc(device.company)}</td><td><b class="current-media-name">${esc(device.currentMediaName)}</b><small>${device.errorMessage ? esc(device.errorMessage) : 'Conteúdo informado pela TV'}</small></td><td>${esc(device.lastSeen)}</td><td>v${esc(device.appVersion)}</td><td><span class="status-pill is-${device.health}">${healthLabels[device.health]}</span></td></tr>`).join('')}</tbody></table>${devices.length ? '' : `<div class="noc-network-empty"><img src="./assets/angel-noc-empty.webp" alt="Central Angel Mídia pronta para receber a primeira TV"><b>Nenhuma TV cadastrada</b><small>Cadastre um aparelho para começar a monitorar a rede.</small></div>`}</div>
      </article>
      <aside class="company-card hud-widget hud-widget-companies" data-hud-widget="companies" draggable="false" data-company-gallery>
        <div class="hud-widget-tools"><span title="Arrastar quadro">••</span><button data-hud-move="previous" aria-label="Mover empresas para cima">↑</button><button data-hud-move="next" aria-label="Mover empresas para baixo">↓</button></div>
        <header><div><p class="eyebrow">Clientes</p><h2>Empresas em destaque</h2></div><button class="ghost" data-open-companies>Ver todas →</button></header><div class="company-gallery">${gallery.length ? gallery.map((company) => { const name = companyName(company); const asset = companyAsset(company); return `<button data-open-companies class="company-tile">${asset ? `<img src="./api/admin/media/${esc(asset)}/content" alt="Foto de ${esc(name)}">` : `<span>${esc(initials(name))}</span>`}<b>${esc(name)}</b></button>`; }).join('') : `<button data-open-companies class="company-upload-empty"><span>${angelIcon('company')}</span><b>Adicione fotos das empresas</b><small>Cadastre fachada e logo para identificar cada cliente.</small></button>`}</div><button class="company-photo-cta" data-open-companies>${angelIcon('image')} Cadastrar empresa com foto</button>
      </aside>
      <footer class="publication-status hud-widget hud-widget-sync" data-hud-widget="sync" draggable="false">
        <div class="hud-widget-tools"><span title="Arrastar quadro">••</span><button data-hud-move="previous" aria-label="Mover sincronização para cima">↑</button><button data-hud-move="next" aria-label="Mover sincronização para baixo">↓</button></div>
        <span class="status-orb is-green">✓</span><div><b>Conteúdo preparado</b><small>${media.length} mídias, ${playlists.length} playlists e ${schedules.length} programações disponíveis.</small></div><button class="primary" data-publish-network>Revisar e publicar</button>
      </footer>
    </section>
  </section>`;

  const inspector = root.querySelector('[data-network-inspector]');
  const rows = [...root.querySelectorAll('[data-overview-device]')];
  let selectedDeviceId = '';
  let healthFilter = 'all';

  const applyFilters = () => {
    const query = root.querySelector('[data-noc-search]').value.trim().toLowerCase();
    rows.forEach((row) => {
      row.hidden = (healthFilter !== 'all' && row.dataset.health !== healthFilter) || !row.dataset.search.includes(query);
    });
  };

  const requestCommand = async (device, type, button) => {
    const disruptive = type === 'restart_player' || type === 'clear_media_cache';
    if (disruptive && !globalThis.confirm(`${commandLabels[type]} em ${device.name}? A TV pode interromper a exibição por alguns instantes.`)) return;
    const status = inspector.querySelector('[data-noc-command-status]');
    button.disabled = true;
    status.dataset.state = 'sending';
    status.textContent = `Solicitando: ${commandLabels[type]}…`;
    try {
      await options.client(`/admin/devices/${encodeURIComponent(device.id)}/remote-commands`, {
        method: 'POST',
        body: { organizationId, commandType: type, idempotencyKey: idempotencyKey(device, type) },
      });
      status.dataset.state = 'requested';
      status.textContent = `Solicitado: ${commandLabels[type]}. Aguardando a TV confirmar a execução.`;
    } catch (error) {
      status.dataset.state = 'failed';
      status.textContent = `Falha ao solicitar: ${error?.message || 'tente novamente'}.`;
    } finally {
      button.disabled = false;
    }
  };

  const selectDevice = (id) => {
    const device = devices.find((item) => item.id === String(id));
    if (!device) return;
    selectedDeviceId = device.id;
    rows.forEach((row) => {
      const selected = row.dataset.overviewDevice === device.id;
      row.setAttribute('aria-current', String(selected));
      row.classList.toggle('is-selected', selected);
    });
    inspector.classList.remove('is-empty');
    const canRequestCommands = options.client && organizationId;
    inspector.innerHTML = `<button class="inspector-close" aria-label="Fechar detalhes">×</button><span class="status-pill is-${device.health}">${healthLabels[device.health]}</span><p class="eyebrow">TV selecionada</p><h3>${esc(device.name || 'TV sem nome')}</h3><p>${esc(device.company)}</p>${device.errorMessage ? `<p class="inspector-alert">${esc(device.errorMessage)}</p>` : ''}<dl><div><dt>Mídia atual</dt><dd>${esc(device.currentMediaName)}</dd></div><div><dt>Último sinal</dt><dd>${esc(device.lastSeen)}</dd></div><div><dt>Aplicativo</dt><dd>v${esc(device.appVersion)}</dd></div><div><dt>Armazenamento</dt><dd>${esc(formatStorage(device.freeStorageBytes))}</dd></div><div><dt>Endereço</dt><dd>${esc(device.address || 'Não informado')}</dd></div></dl>${Number.isFinite(Number(device.latitude)) && Number.isFinite(Number(device.longitude)) ? `<a class="google-maps-link" href="${googleMapsUrl(device)}" target="_blank" rel="noopener noreferrer">Abrir no Google Maps ↗</a>` : ''}<div class="noc-command-grid" aria-label="Ações remotas"><button data-noc-command="refresh_sync" ${canRequestCommands ? '' : 'disabled'}>${angelIcon('rotate')} Atualizar conteúdo</button><button data-noc-command="restart_player" class="is-disruptive" ${canRequestCommands ? '' : 'disabled'}>${angelIcon('play')} Reiniciar player</button><button data-noc-command="clear_media_cache" class="is-disruptive" ${canRequestCommands ? '' : 'disabled'}>${angelIcon('image')} Limpar cache</button></div><p class="noc-command-status" data-noc-command-status data-state="idle">${organizationId ? 'Nenhuma ação solicitada nesta sessão.' : 'Selecione uma organização para solicitar ações remotas.'}</p><button class="ghost" data-configure-device>Ver configuração</button>`;
    inspector.classList.add('is-open');
    inspector.querySelector('.inspector-close').onclick = () => inspector.classList.remove('is-open');
    inspector.querySelector('[data-configure-device]').onclick = () => openView(1, { deviceId: device.id });
    inspector.querySelectorAll('[data-noc-command]').forEach((button) => { button.onclick = () => requestCommand(device, button.dataset.nocCommand, button); });
  };

  renderDeviceMap(root.querySelector('[data-network-map]'), devices, selectDevice);
  inspector.querySelector('.inspector-close').onclick = () => inspector.classList.remove('is-open');
  rows.forEach((row) => row.addEventListener('click', () => selectDevice(row.dataset.overviewDevice)));
  root.querySelector('[data-noc-search]').addEventListener('input', applyFilters);
  root.querySelectorAll('[data-noc-filter]').forEach((button) => { button.onclick = () => {
    healthFilter = button.dataset.nocFilter;
    root.querySelectorAll('[data-noc-filter]').forEach((item) => item.setAttribute('aria-pressed', String(item === button)));
    applyFilters();
  }; });
  root.querySelectorAll('[data-noc-alert]').forEach((button) => { button.onclick = () => selectDevice(button.dataset.deviceId); });
  root.querySelector('[data-noc-refresh]').onclick = () => options.refresh?.();
  root.querySelectorAll('[data-open-tvs]').forEach((button) => { button.onclick = () => openView(1, selectedDeviceId ? { deviceId: selectedDeviceId } : {}); });
  root.querySelectorAll('[data-open-companies]').forEach((button) => { button.onclick = () => openView(8); });
  root.querySelectorAll('[data-publish-network]').forEach((button) => { button.onclick = () => openView(4); });
  bindHudPersonalization(root);
}
