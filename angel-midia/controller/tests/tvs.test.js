// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderTvs } from '../src/tvs.js';

const pending = {
  id: 'tv-1', name: 'Mercado Centro', address: 'Av. Mâncio Lima, 100',
  linkCode: 'AMP-ABC123', latitude: -7.6301, longitude: -72.6701,
  status: 'pending', online: false,
};

describe('gestão lean de TVs', () => {
  beforeEach(() => { document.body.innerHTML = '<main id="tvs"></main>'; });

  it('abre detalhes e aprova em dois cliques com todos os dados visíveis antes da aprovação', async () => {
    const apiClient = vi.fn(async () => ({ status: 'active' }));
    renderTvs(document.querySelector('#tvs'), [
      { ...pending },
      { id: 'tv-2', name: 'Recepção', address: 'Rua 2', linkCode: 'AMP-DEF456', latitude: -7.5, longitude: -72.5, status: 'active', online: true },
    ], apiClient);

    expect(document.querySelector('h1 [data-angel-icon="tv"]')).not.toBeNull();

    document.querySelector('[data-device-id="tv-1"]').click();
    const details = document.querySelector('[data-tv-details]');
    expect(details.querySelector('[data-angel-icon="settings"]')).not.toBeNull();
    expect(details.textContent).toContain('Mercado Centro');
    expect(details.textContent).toContain('Av. Mâncio Lima, 100');
    expect(details.textContent).toContain('AMP-ABC123');
    expect(details.textContent).toContain('-7.6301');
    expect(details.textContent).toContain('-72.6701');

    details.querySelector('[data-approve]').click();
    await vi.waitFor(() => expect(apiClient).toHaveBeenCalledWith('/admin/devices/tv-1/approve', { method: 'POST' }));
    expect(document.querySelector('[data-device-id="tv-1"]').textContent).toContain('Ativa');
  });

  it('mantém pendências no topo e filtra a lista por nome, endereço ou código', () => {
    renderTvs(document.querySelector('#tvs'), [
      { id: 'tv-2', name: 'Loja Norte', address: 'Bairro Norte', linkCode: 'AMP-NORTE1', status: 'active' },
      { ...pending },
    ], vi.fn());
    expect(document.querySelector('[data-device-list] button').dataset.deviceId).toBe('tv-1');
    const search = document.querySelector('[data-tv-search]');
    search.value = 'norte1';
    search.dispatchEvent(new Event('input', { bubbles: true }));
    expect(document.querySelectorAll('[data-device-id]')).toHaveLength(1);
    expect(document.querySelector('[data-device-id]').dataset.deviceId).toBe('tv-2');
  });

  it('continua funcional sem mapa e permite ajustar marcador manualmente', () => {
    renderTvs(document.querySelector('#tvs'), [{ ...pending }], vi.fn(), { mapAvailable: false });
    expect(document.querySelector('[data-map-fallback]').textContent).toContain('Mapa indisponível');
    document.querySelector('[data-device-id="tv-1"]').click();
    document.querySelector('[name="latitude"]').value = '-7.64';
    document.querySelector('[name="longitude"]').value = '-72.68';
    document.querySelector('[data-move-marker]').click();
    expect(document.querySelector('[data-marker]').textContent).toContain('-7.6400, -72.6800');
  });

  it('faz busca de local somente após 400 ms e a partir de três caracteres', async () => {
    vi.useFakeTimers();
    const apiClient = vi.fn(async () => [{ label: 'Mercado', latitude: -7.63, longitude: -72.67 }]);
    renderTvs(document.querySelector('#tvs'), [{ ...pending }], apiClient);
    document.querySelector('[data-device-id="tv-1"]').click();
    const search = document.querySelector('[data-location-search]');
    search.value = 'me';
    search.dispatchEvent(new Event('input', { bubbles: true }));
    await vi.advanceTimersByTimeAsync(400);
    expect(apiClient).not.toHaveBeenCalled();
    search.value = '  mercado   central ';
    search.dispatchEvent(new Event('input', { bubbles: true }));
    await vi.advanceTimersByTimeAsync(399);
    expect(apiClient).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    expect(apiClient).toHaveBeenCalledWith('/locations/search?q=mercado%20central');
    expect(document.querySelectorAll('[data-location-result]')).toHaveLength(1);
    vi.useRealTimers();
  });

  it('mostra marcadores de todas as TVs e abre o detalhe pelo marcador', () => {
    renderTvs(document.querySelector('#tvs'), [
      { ...pending },
      { id: 'tv-2', name: 'Recepção', address: 'Rua 2', linkCode: 'AMP-2', latitude: -7.5, longitude: -72.5, status: 'active' },
    ], vi.fn());
    const markers = [...document.querySelectorAll('[data-map-device]')];
    expect(markers).toHaveLength(2);
    expect(document.querySelector('[data-map-plot]').getAttribute('role')).toBe('region');
    expect(markers[0].style.left).not.toBe(markers[1].style.left);
    expect(markers[0].style.top).not.toBe(markers[1].style.top);
    document.querySelector('[data-map-device="tv-1"]').click();
    expect(document.querySelector('[data-tv-details]').textContent).toContain('Mercado Centro');
    expect(document.querySelector('[data-map-device="tv-1"]').getAttribute('aria-current')).toBe('true');
    expect(document.querySelector('[data-map-device="tv-2"]').getAttribute('aria-current')).toBe('false');
  });

  it('serializa ajustes concorrentes e mantém a localização mais recente', async () => {
    const releases = [];
    const apiClient = vi.fn((_path, options) => new Promise((resolve) => releases.push(() => resolve(options.body))));
    renderTvs(document.querySelector('#tvs'), [{ ...pending }], apiClient);
    document.querySelector('[data-device-id="tv-1"]').click();
    document.querySelector('[name="latitude"]').value = '-7.61';
    document.querySelector('[name="longitude"]').value = '-72.61';
    document.querySelector('[data-move-marker]').click();
    document.querySelector('[name="latitude"]').value = '-7.62';
    document.querySelector('[name="longitude"]').value = '-72.62';
    document.querySelector('[data-move-marker]').click();
    await vi.waitFor(() => expect(apiClient).toHaveBeenCalledTimes(1));
    releases.shift()();
    await vi.waitFor(() => expect(apiClient).toHaveBeenCalledTimes(2));
    releases.shift()();
    await vi.waitFor(() => expect(document.querySelector('[data-marker]').textContent).toContain('-7.6200, -72.6200'));
  });

  it('detecta falha real do mapa e mantém a lista como fallback', () => {
    renderTvs(document.querySelector('#tvs'), [{ ...pending }], vi.fn(), { mapFactory: () => { throw new Error('map failed'); } });
    expect(document.querySelector('[data-map-fallback]').textContent).toContain('Mapa indisponível');
    expect(document.querySelector('[data-device-id="tv-1"]')).not.toBeNull();
  });

  it('persiste coordenadas válidas antes de aprovar e não converte null em zero', async () => {
    const device = { ...pending, latitude: null, longitude: null };
    const apiClient = vi.fn(async (path) => path.endsWith('/approve') ? { status: 'active' } : ({ latitude: -7.64, longitude: -72.68, address: device.address }));
    renderTvs(document.querySelector('#tvs'), [device], apiClient);
    document.querySelector('[data-device-id="tv-1"]').click();
    expect(document.querySelector('[data-tv-details]').textContent).toContain('Não informadas');
    document.querySelector('[name="latitude"]').value = '-7.64';
    document.querySelector('[name="longitude"]').value = '-72.68';
    document.querySelector('[data-move-marker]').click();
    await vi.waitFor(() => expect(apiClient).toHaveBeenCalledWith('/admin/devices/tv-1', {
      method: 'PATCH', body: { address: 'Av. Mâncio Lima, 100', latitude: -7.64, longitude: -72.68 },
    }));
    document.querySelector('[data-approve]').click();
    await vi.waitFor(() => expect(apiClient).toHaveBeenCalledWith('/admin/devices/tv-1/approve', { method: 'POST' }));
    expect(apiClient.mock.invocationCallOrder[0]).toBeLessThan(apiClient.mock.invocationCallOrder[1]);
  });

  it('descarta resposta antiga e anuncia erros de busca e coordenadas', async () => {
    vi.useFakeTimers();
    const resolvers = [];
    const apiClient = vi.fn((path) => path.startsWith('/locations/') ? new Promise((resolve) => resolvers.push(resolve)) : Promise.resolve({}));
    renderTvs(document.querySelector('#tvs'), [{ ...pending }], apiClient);
    document.querySelector('[data-device-id="tv-1"]').click();
    const latitude = document.querySelector('[name="latitude"]');
    latitude.value = '99';
    document.querySelector('[data-move-marker]').click();
    expect(document.querySelector('[role="status"]').textContent).toContain('Coordenadas inválidas');
    const search = document.querySelector('[data-location-search]');
    search.value = 'centro'; search.dispatchEvent(new Event('input', { bubbles: true }));
    await vi.advanceTimersByTimeAsync(400);
    search.value = 'norte'; search.dispatchEvent(new Event('input', { bubbles: true }));
    await vi.advanceTimersByTimeAsync(400);
    resolvers[1]([{ label: 'Norte novo', latitude: -7.5, longitude: -72.5 }]);
    await Promise.resolve();
    resolvers[0]([{ label: 'Centro antigo', latitude: -7.6, longitude: -72.6 }]);
    await Promise.resolve();
    expect(document.querySelector('[data-location-results]').textContent).toContain('Norte novo');
    expect(document.querySelector('[data-location-results]').textContent).not.toContain('Centro antigo');
    vi.useRealTimers();
  });
});
