import { renderDeviceMap } from './tvs.js';
import { angelIcon } from './angel-icons.js';

const esc = (value) => String(value ?? '').replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));

export const LOCAL_DEMO_DEVICES = [
  { id: 'demo-tv-1', name: 'TV Recepção', company: 'Clínica Vale do Juruá', address: 'Av. 25 de Agosto, Cruzeiro do Sul', linkCode: 'AMP-DEMO1', latitude: -7.6297, longitude: -72.6722, status: 'active', online: true, campaign: 'Setembro Azul', lastSeen: 'agora' },
  { id: 'demo-tv-2', name: 'TV Vitrine', company: 'Mercado Juruá', address: 'Centro, Cruzeiro do Sul', linkCode: 'AMP-DEMO2', latitude: -7.6335, longitude: -72.6692, status: 'active', online: true, campaign: 'Ofertas da Semana', lastSeen: 'há 1 min' },
  { id: 'demo-tv-3', name: 'TV Salão', company: 'Hotel Cruzeiro', address: 'Aeroporto Velho, Cruzeiro do Sul', linkCode: 'AMP-DEMO3', latitude: -7.6228, longitude: -72.6795, status: 'active', online: false, campaign: 'Institucional', lastSeen: 'há 18 min' },
];

const localHosts = new Set(['localhost', '127.0.0.1']);
export function devicesForDashboard(devices, hostname = globalThis.location?.hostname) {
  return devices.length || !localHosts.has(hostname) ? devices : LOCAL_DEMO_DEVICES.map((device) => ({ ...device }));
}

const companyName = (company) => company.name || company.advertiser_name || 'Empresa';
const companyAsset = (company) => company.photo_asset_id || company.photoAssetId || company.logo_asset_id || company.logoAssetId;
const initials = (name) => name.split(/\s+/).slice(0, 2).map((word) => word[0]).join('').toUpperCase();
const googleMapsUrl = (device) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${Number(device.latitude)},${Number(device.longitude)}`)}`;

export function renderOperationsOverview(root, payload, openView) {
  const sourceDevices = Array.isArray(payload.devices) ? payload.devices : [];
  const devices = devicesForDashboard(sourceDevices);
  const isDemo = sourceDevices.length === 0 && devices.length > 0;
  const companies = Array.isArray(payload.advertisers) ? payload.advertisers : [];
  const media = Array.isArray(payload.media) ? payload.media : [];
  const playlists = Array.isArray(payload.playlists) ? payload.playlists : [];
  const schedules = Array.isArray(payload.schedules) ? payload.schedules : [];
  const online = devices.filter((device) => device.online).length;
  const attention = devices.length - online;
  const gallery = companies.slice(0, 3);

  root.innerHTML = `<section class="operations-dashboard" data-view="operations">
    <header class="operations-heading">
      <div><p class="eyebrow">Central de operações</p><h1>Bom dia. Sua rede está <em>${attention ? 'quase pronta' : 'pronta'}.</em></h1><p>Veja o que está no ar, localize cada TV e publique sem sair desta tela.</p></div>
      <div class="heading-actions"><label class="network-search">${angelIcon('search')}<input type="search" placeholder="Buscar TV, empresa ou campanha" aria-label="Buscar na rede"></label><button class="primary publish-button" data-publish-network>${angelIcon('play')} Publicar na rede</button></div>
    </header>
    ${isDemo ? '<p class="demo-notice">Dados de demonstração local — as três TVs abaixo existem apenas para validar o mapa e o layout.</p>' : ''}
    <section class="operations-ribbon" aria-label="Resumo da rede">
      <article><span class="status-orb is-blue">${angelIcon('tv')}</span><div><small>TVs cadastradas</small><strong>${devices.length}</strong></div></article>
      <article><span class="status-orb is-green">●</span><div><small>Online agora</small><strong>${online}</strong></div></article>
      <article><span class="status-orb is-amber">!</span><div><small>Precisam de atenção</small><strong>${attention}</strong></div></article>
      <article><span class="status-orb is-blue">${angelIcon('company')}</span><div><small>Empresas</small><strong>${companies.length || (isDemo ? 3 : 0)}</strong></div></article>
      <article class="ribbon-progress"><div><small>Disponibilidade estimada</small><strong>${devices.length ? Math.round((online / devices.length) * 1000) / 10 : 0}%</strong></div><i><b style="width:${devices.length ? (online / devices.length) * 100 : 0}%"></b></i></article>
    </section>
    <section class="network-map-card">
      <header><div><p class="eyebrow">Rede em campo</p><h2>Mapa da rede</h2></div><div class="map-legend"><span><i class="online"></i>Online</span><span><i class="attention"></i>Atenção</span><button class="ghost" data-open-tvs>Mapa completo →</button></div></header>
      <div class="network-map-stage"><div data-network-map></div><aside class="network-inspector" data-network-inspector aria-live="polite"></aside></div>
    </section>
    <section class="operations-lower">
      <article class="inventory-card" data-tv-inventory><header><div><p class="eyebrow">Inventário</p><h2>TVs e campanhas</h2></div><button class="ghost" data-open-tvs>Gerenciar TVs →</button></header><div class="table-wrap"><table><thead><tr><th>TV</th><th>Empresa</th><th>Campanha atual</th><th>Último sinal</th><th>Status</th></tr></thead><tbody>${devices.map((device, index) => `<tr data-overview-device="${esc(device.id)}"><td><span class="table-device-index">${index + 1}</span><b>${esc(device.name)}</b><small>${esc(device.address || 'Local não informado')}</small></td><td>${esc(device.company || 'Sem empresa')}</td><td>${esc(device.campaign || 'Sem campanha')}</td><td>${esc(device.lastSeen || (device.online ? 'agora' : 'sem sinal'))}</td><td><span class="status-pill ${device.online ? 'is-online' : 'is-attention'}">${device.online ? 'Online' : 'Atenção'}</span></td></tr>`).join('')}</tbody></table></div></article>
      <aside class="company-card" data-company-gallery><header><div><p class="eyebrow">Clientes</p><h2>Empresas em destaque</h2></div><button class="ghost" data-open-companies>Ver todas →</button></header><div class="company-gallery">${gallery.length ? gallery.map((company) => { const name = companyName(company); const asset = companyAsset(company); return `<button data-open-companies class="company-tile">${asset ? `<img src="./api/admin/media/${esc(asset)}/content" alt="Foto de ${esc(name)}">` : `<span>${esc(initials(name))}</span>`}<b>${esc(name)}</b></button>`; }).join('') : `<button data-open-companies class="company-upload-empty"><span>${angelIcon('company')}</span><b>Adicione fotos das empresas</b><small>Cadastre fachada e logo para identificar cada cliente.</small></button>`}</div><button class="company-photo-cta" data-open-companies>${angelIcon('image')} Cadastrar empresa com foto</button></aside>
    </section>
    <footer class="publication-status"><span class="status-orb is-green">✓</span><div><b>Rede sincronizada</b><small>${media.length} mídias, ${playlists.length} playlists e ${schedules.length} programações disponíveis.</small></div><button class="primary" data-publish-network>Revisar e publicar</button></footer>
  </section>`;

  const inspector = root.querySelector('[data-network-inspector]');
  const rows = root.querySelectorAll('[data-overview-device]');
  const selectDevice = (id) => {
    const device = devices.find((item) => String(item.id) === String(id));
    if (!device) return;
    rows.forEach((row) => row.setAttribute('aria-current', String(row.dataset.overviewDevice === String(id))));
    inspector.innerHTML = `<button class="inspector-close" aria-label="Fechar detalhes">×</button><span class="status-pill ${device.online ? 'is-online' : 'is-attention'}">${device.online ? 'Online' : 'Atenção'}</span><p class="eyebrow">TV selecionada</p><h3>${esc(device.name)}</h3><p>${esc(device.company || 'Sem empresa vinculada')}</p><dl><div><dt>Campanha</dt><dd>${esc(device.campaign || 'Sem campanha')}</dd></div><div><dt>Último sinal</dt><dd>${esc(device.lastSeen || 'não informado')}</dd></div><div><dt>Endereço</dt><dd>${esc(device.address || 'Não informado')}</dd></div></dl><a class="google-maps-link" href="${googleMapsUrl(device)}" target="_blank" rel="noopener noreferrer">Abrir no Google Maps ↗</a><button class="ghost" data-configure-device>Ver configuração</button>`;
    inspector.classList.add('is-open');
    inspector.querySelector('.inspector-close').onclick = () => inspector.classList.remove('is-open');
    inspector.querySelector('[data-configure-device]').onclick = () => openView(1);
    rows.forEach((row) => row.classList.toggle('is-selected', row.dataset.overviewDevice === String(id)));
  };
  renderDeviceMap(root.querySelector('[data-network-map]'), devices, selectDevice);
  rows.forEach((row) => row.addEventListener('click', () => selectDevice(row.dataset.overviewDevice)));
  root.querySelectorAll('[data-open-tvs]').forEach((button) => { button.onclick = () => openView(1); });
  root.querySelectorAll('[data-open-companies]').forEach((button) => { button.onclick = () => openView(7); });
  root.querySelectorAll('[data-publish-network]').forEach((button) => { button.onclick = () => openView(4); });
}
