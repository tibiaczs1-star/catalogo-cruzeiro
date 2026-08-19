const escapeHtml = (value) => String(value ?? '').replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
const statusLabel = (device) => device.status === 'pending' ? 'Pendente' : device.status === 'active' ? 'Ativa' : device.status === 'blocked' ? 'Bloqueada' : 'Offline';
const normalized = (value) => String(value ?? '').trim().replace(/\s+/g, ' ');
const coordinate = (value, min, max) => value !== null && value !== '' && Number.isFinite(Number(value)) && Number(value) >= min && Number(value) <= max;
const hasCoordinates = (device) => coordinate(device.latitude, -90, 90) && coordinate(device.longitude, -180, 180);

function defaultMapFactory(root, devices, openDevice) {
  const mapped = devices.filter(hasCoordinates);
  if (!mapped.length) root.innerHTML = '<p>Nenhuma TV com coordenadas.</p>';
  else {
    const latitudes = mapped.map((device) => Number(device.latitude)); const longitudes = mapped.map((device) => Number(device.longitude));
    const minLat = Math.min(...latitudes); const maxLat = Math.max(...latitudes); const minLon = Math.min(...longitudes); const maxLon = Math.max(...longitudes);
    const project = (value, min, max) => min === max ? 50 : 8 + ((value - min) / (max - min)) * 84;
    root.innerHTML = `<div class="map-plot" data-map-plot role="region" aria-label="Mapa simplificado com ${mapped.length} TVs" style="position:relative;min-height:18rem;overflow:hidden;border:1px solid currentColor;border-radius:.65rem">${mapped.map((device) => {
      const left = project(Number(device.longitude), minLon, maxLon); const top = 100 - project(Number(device.latitude), minLat, maxLat);
      return `<button type="button" class="map-marker" data-map-device="${escapeHtml(device.id)}" style="position:absolute;left:${left}%;top:${top}%;transform:translate(-50%,-50%)" aria-label="Abrir TV ${escapeHtml(device.name)}" title="${escapeHtml(device.name)}"><span>${escapeHtml(device.name)}</span></button>`;
    }).join('')}</div>`;
  }
  root.querySelectorAll('[data-map-device]').forEach((button) => button.addEventListener('click', () => openDevice(button.dataset.mapDevice)));
  return { select(id, text) { root.querySelectorAll('[data-map-device]').forEach((button) => button.setAttribute('aria-current', String(button.dataset.mapDevice === id))); root.dataset.selectedCoordinates = text; } };
}

export function renderTvs(root, initialDevices, apiClient, { mapAvailable = true, mapFactory = defaultMapFactory } = {}) {
  const devices = [...initialDevices].sort((a, b) => Number(b.status === 'pending') - Number(a.status === 'pending') || String(a.name).localeCompare(String(b.name), 'pt-BR'));
  root.innerHTML = `<section class="tv-management" data-area="tvs"><header class="tv-heading"><div><p class="eyebrow">Inventário</p><h1>TVs</h1></div><label class="tv-filter">Pesquisar TV<input data-tv-search type="search" placeholder="Nome, endereço ou código"></label></header><div class="tv-layout"><div><div class="item-list tv-list" data-device-list></div></div><aside class="map-support" aria-label="Mapa de apoio"><p>Mapa de apoio</p><div data-map-root></div><div data-marker aria-live="polite"></div></aside></div><div data-tv-details></div></section>`;
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
    details.innerHTML = `<section class="tv-details" aria-labelledby="tv-detail-name"><div><p class="eyebrow">Detalhes da TV</p><h2 id="tv-detail-name">${escapeHtml(device.name)}</h2></div><dl><div><dt>Endereço</dt><dd>${escapeHtml(device.address || 'Não informado')}</dd></div><div><dt>Código</dt><dd>${escapeHtml(device.linkCode || '—')}</dd></div><div><dt>Coordenadas</dt><dd>${coords}</dd></div><div><dt>Status</dt><dd>${statusLabel(device)}</dd></div></dl><div class="marker-controls"><label>Latitude<input name="latitude" type="number" step="any" value="${valid ? device.latitude : ''}"></label><label>Longitude<input name="longitude" type="number" step="any" value="${valid ? device.longitude : ''}"></label><button type="button" data-move-marker>Ajustar marcador</button></div><label class="location-search">Buscar outro local<input data-location-search type="search" placeholder="Digite pelo menos 3 caracteres"></label><div data-location-results></div>${device.status === 'pending' ? '<button type="button" class="primary" data-approve>Aprovar TV</button>' : ''}<p role="status" aria-live="polite"></p></section>`;
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
