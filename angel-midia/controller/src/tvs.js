import { angelIcon } from './angel-icons.js';

const escapeHtml = (value) => String(value ?? '').replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
const statusLabel = (device) => device.status === 'pending' ? 'Pendente' : device.status === 'active' ? 'Ativa' : device.status === 'blocked' ? 'Bloqueada' : 'Offline';
const normalized = (value) => String(value ?? '').trim().replace(/\s+/g, ' ');
const coordinate = (value, min, max) => value !== null && value !== '' && Number.isFinite(Number(value)) && Number(value) >= min && Number(value) <= max;
const hasCoordinates = (device) => coordinate(device.latitude, -90, 90) && coordinate(device.longitude, -180, 180);

export function renderDeviceMap(root, devices, openDevice) {
  const mapped = devices.filter(hasCoordinates);
  if (!mapped.length) root.innerHTML = '<p>Nenhuma TV com coordenadas.</p>';
  else {
    const zoom = 14; const tileCount = 2 ** zoom; const tileSize = 256;
    const worldPoint = (lat, lon) => {
      const latitude = Math.max(-85.0511, Math.min(85.0511, Number(lat))) * Math.PI / 180;
      return { x: ((Number(lon) + 180) / 360) * tileCount * tileSize, y: (0.5 - Math.log((1 + Math.sin(latitude)) / (1 - Math.sin(latitude))) / (4 * Math.PI)) * tileCount * tileSize };
    };
    const points = mapped.map((device) => ({ device, ...worldPoint(device.latitude, device.longitude) }));
    const centerX = points.reduce((sum, point) => sum + point.x, 0) / points.length; const centerY = points.reduce((sum, point) => sum + point.y, 0) / points.length;
    const startTileX = Math.floor(centerX / tileSize) - 2; const startTileY = Math.floor(centerY / tileSize) - 1;
    const leftWorld = startTileX * tileSize; const topWorld = startTileY * tileSize; const mapWidth = tileSize * 4; const mapHeight = tileSize * 2;
    const tiles = Array.from({ length: 8 }, (_, index) => { const x = startTileX + (index % 4); const y = startTileY + Math.floor(index / 4); return `<img data-map-tile loading="lazy" alt="" src="https://tile.openstreetmap.org/${zoom}/${x}/${y}.png">`; }).join('');
    const positioned = points.map((point, index) => ({ ...point, left: ((point.x - leftWorld) / mapWidth) * 100, top: ((point.y - topWorld) / mapHeight) * 100, index: index + 1 }));
    const route = positioned.map((point) => `${point.left},${point.top}`).join(' ');
    root.innerHTML = `<div class="map-plot osm-map" data-map-plot data-map-provider="openstreetmap" role="region" aria-label="Mapa da rede com ${mapped.length} TVs"><div class="osm-tile-grid" aria-hidden="true">${tiles}</div><svg class="map-route" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><polyline data-map-route points="${route}"></polyline></svg>${positioned.map(({ device, left, top, index }) => {
      const attention = !device.online || device.status === 'pending' || device.status === 'blocked';
      return `<button type="button" class="map-marker${attention ? ' is-attention' : ''}" data-map-device="${escapeHtml(device.id)}" style="position:absolute;left:${left}%;top:${top}%;transform:translate(-50%,-50%)" aria-label="Abrir TV ${escapeHtml(device.name)}" title="${escapeHtml(device.name)}"><b><i>${index}</i></b><span>${escapeHtml(device.name)}</span></button>`;
    }).join('')}<small class="map-attribution">© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a></small></div>`;
  }
  root.querySelectorAll('[data-map-device]').forEach((button) => button.addEventListener('click', () => openDevice(button.dataset.mapDevice)));
  return { select(id, text) { root.querySelectorAll('[data-map-device]').forEach((button) => button.setAttribute('aria-current', String(button.dataset.mapDevice === id))); root.dataset.selectedCoordinates = text; } };
}

const defaultMapFactory = renderDeviceMap;

export function renderTvs(root, initialDevices, apiClient, { mapAvailable = true, mapFactory = defaultMapFactory } = {}) {
  const devices = [...initialDevices].sort((a, b) => Number(b.status === 'pending') - Number(a.status === 'pending') || String(a.name).localeCompare(String(b.name), 'pt-BR'));
  root.innerHTML = `<section class="tv-management" data-area="tvs"><header class="tv-heading"><div><p class="eyebrow">Inventário</p><h1>${angelIcon('tv')} TVs</h1></div><label class="tv-filter">Pesquisar TV<input data-tv-search type="search" placeholder="Nome, endereço ou código"></label></header><div class="tv-layout"><div><div class="item-list tv-list" data-device-list></div></div><aside class="map-support" aria-label="Mapa de apoio"><p>Mapa de apoio</p><div data-map-root></div><div data-marker aria-live="polite"></div></aside></div><div data-tv-details></div></section>`;
  const list = root.querySelector('[data-device-list]'); const details = root.querySelector('[data-tv-details]'); const marker = root.querySelector('[data-marker]'); const mapRoot = root.querySelector('[data-map-root]');
  let map;
  function drawList(filter = '') {
    const needle = normalized(filter).toLocaleLowerCase('pt-BR');
    const visible = devices.filter((device) => [device.name, device.address, device.linkCode].some((value) => String(value ?? '').toLocaleLowerCase('pt-BR').includes(needle)));
    list.innerHTML = visible.length ? visible.map((device) => `<button type="button" class="tv-row" data-device-id="${escapeHtml(device.id)}"><span><strong>${escapeHtml(device.name || device.id)}</strong><small>${escapeHtml(device.address || 'Local não informado')}</small></span><b>${statusLabel(device)}</b></button>`).join('') : '<p class="empty-state">Nenhuma TV encontrada.</p>';
    list.querySelectorAll('[data-device-id]').forEach((button) => button.addEventListener('click', () => showDetails(devices.find((device) => device.id === button.dataset.deviceId))));
  }
  function initializeMap() {
    try {
      if (!mapAvailable) throw new Error('map disabled');
      map = mapFactory(mapRoot, devices, (id) => showDetails(devices.find((device) => device.id === id)));
      if (!map || typeof map.select !== 'function') throw new Error('invalid map adapter');
    } catch { map = null; mapRoot.innerHTML = '<p data-map-fallback>Mapa indisponível. Use a lista normalmente.</p>'; }
  }
  function showDetails(device) {
    const valid = hasCoordinates(device); const coords = valid ? `${Number(device.latitude).toFixed(4)}, ${Number(device.longitude).toFixed(4)}` : 'Não informadas';
    marker.textContent = coords; map?.select(device.id, coords);
    const mapsUrl = valid ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${Number(device.latitude)},${Number(device.longitude)}`)}` : '';
    details.innerHTML = `<section class="tv-details tv-inspector" aria-labelledby="tv-detail-name"><div><p class="eyebrow">Detalhes da TV</p><h2 id="tv-detail-name">${escapeHtml(device.name)}</h2></div><dl><div><dt>Endereço</dt><dd>${escapeHtml(device.address || 'Não informado')}</dd></div><div><dt>Código</dt><dd>${escapeHtml(device.linkCode || '—')}</dd></div><div><dt>Coordenadas</dt><dd>${coords}</dd></div><div><dt>Status</dt><dd>${statusLabel(device)}</dd></div></dl>${valid ? `<a class="google-maps-link" data-open-google-maps href="${mapsUrl}" target="_blank" rel="noopener noreferrer">Abrir localização exata no Google Maps</a>` : ''}<div class="marker-controls"><label>Latitude<input name="latitude" type="number" step="any" value="${valid ? device.latitude : ''}"></label><label>Longitude<input name="longitude" type="number" step="any" value="${valid ? device.longitude : ''}"></label><button type="button" data-move-marker>Ajustar marcador</button></div><label class="location-search">Buscar outro local<input data-location-search type="search" placeholder="Digite pelo menos 3 caracteres"></label><div data-location-results></div>${device.status === 'pending' ? '<button type="button" class="primary" data-approve>Aprovar TV</button>' : ''}<p role="status" aria-live="polite"></p></section>`;
    details.querySelector('#tv-detail-name').insertAdjacentHTML('afterbegin', `${angelIcon('settings')} `);
    const status = details.querySelector('[role="status"]'); let savePromise = Promise.resolve(); let saveRevision = 0;
    const persist = (latitude, longitude, address = device.address) => {
      const revision = ++saveRevision;
      status.textContent = 'Salvando localização…';
      marker.textContent = `${Number(latitude).toFixed(4)}, ${Number(longitude).toFixed(4)}`;
      savePromise = savePromise.catch(() => {}).then(() => apiClient(`/admin/devices/${device.id}`, { method: 'PATCH', body: { address, latitude, longitude } })).then((saved = {}) => {
        device.latitude = saved.latitude ?? latitude; device.longitude = saved.longitude ?? longitude; device.address = saved.address ?? address;
        if (revision === saveRevision) { marker.textContent = `${Number(device.latitude).toFixed(4)}, ${Number(device.longitude).toFixed(4)}`; status.textContent = 'Localização salva.'; initializeMap(); map?.select(device.id, marker.textContent); }
      }).catch(() => { if (revision === saveRevision) status.textContent = 'Não foi possível salvar a localização.'; throw new Error('location_save_failed'); });
      return savePromise;
    };
    details.querySelector('[data-move-marker]').addEventListener('click', () => {
      const latValue = details.querySelector('[name="latitude"]').value; const lonValue = details.querySelector('[name="longitude"]').value;
      if (!coordinate(latValue, -90, 90) || !coordinate(lonValue, -180, 180)) { status.textContent = 'Coordenadas inválidas.'; return; }
      persist(Number(latValue), Number(lonValue)).catch(() => {});
    });
    let timer; let requestVersion = 0;
    details.querySelector('[data-location-search]').addEventListener('input', (event) => {
      clearTimeout(timer); const version = ++requestVersion; const query = normalized(event.target.value); const resultsRoot = details.querySelector('[data-location-results]');
      resultsRoot.innerHTML = ''; status.textContent = query && query.length < 3 ? 'Digite pelo menos 3 caracteres para buscar.' : '';
      if (query.length < 3) return;
      timer = setTimeout(async () => {
        try {
          const results = await apiClient(`/locations/search?q=${encodeURIComponent(query)}`);
          if (version !== requestVersion) return;
          resultsRoot.innerHTML = results.slice(0, 5).map((item, index) => `<button type="button" data-location-result="${index}">${escapeHtml(item.label)}</button>`).join('') || '<p>Nenhum local encontrado.</p>';
          resultsRoot.querySelectorAll('[data-location-result]').forEach((button) => button.addEventListener('click', () => { const item = results[Number(button.dataset.locationResult)]; details.querySelector('[name="latitude"]').value = item.latitude; details.querySelector('[name="longitude"]').value = item.longitude; persist(Number(item.latitude), Number(item.longitude), item.label).catch(() => {}); }));
        } catch { if (version === requestVersion) { resultsRoot.innerHTML = '<p>Busca indisponível. Ajuste o marcador manualmente.</p>'; status.textContent = 'Busca de local indisponível.'; } }
      }, 400);
    });
    details.querySelector('[data-approve]')?.addEventListener('click', async (event) => {
      const button = event.currentTarget; button.disabled = true;
      try { await savePromise; await apiClient(`/admin/devices/${device.id}/approve`, { method: 'POST' }); device.status = 'active'; drawList(root.querySelector('[data-tv-search]').value); showDetails(device); }
      catch { button.disabled = false; status.textContent = 'Não foi possível aprovar a TV.'; }
    });
  }
  root.querySelector('[data-tv-search]').addEventListener('input', (event) => drawList(event.target.value));
  drawList(); initializeMap();
}
