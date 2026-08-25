// @vitest-environment jsdom
import { beforeEach, expect, it, vi } from 'vitest';
import { renderOperationsOverview } from '../src/overview.js';

const ORGANIZATION_ID = '11111111-1111-4111-8111-111111111111';

const devices = [
  { id: 'tv-1', name: 'TV Recepção', company: 'Clínica Juruá', address: 'Centro', latitude: -7.63, longitude: -72.67, online: true },
  { id: 'tv-2', name: 'TV Mercado', company: 'Mercado Norte', address: 'Aeroporto Velho', latitude: -7.62, longitude: -72.68, online: true },
  { id: 'tv-3', name: 'TV Hotel', company: 'Hotel Cruzeiro', address: '25 de Agosto', latitude: -7.64, longitude: -72.66, online: false },
];

const noc = {
  generatedAt: '2026-08-25T12:00:00.000Z',
  summary: { total: 3, online: 1, unstable: 1, offline: 1, lowStorage: 1, pendingCommands: 0, failedCommands: 0 },
  devices: [
    { id: 'tv-1', health: 'online', currentMediaName: 'Campanha Vacinação', appVersion: '2.4.0', freeStorageBytes: 8_000_000_000, lastSeenAt: '2026-08-25T11:59:40.000Z' },
    { id: 'tv-2', health: 'unstable', currentMediaName: 'Ofertas do Mercado', appVersion: '2.3.8', freeStorageBytes: 300_000_000, errorMessage: 'Sincronização lenta', lastSeenAt: '2026-08-25T11:55:00.000Z' },
    { id: 'tv-3', health: 'offline', currentMediaName: 'Institucional Hotel', appVersion: '2.4.0', freeStorageBytes: 4_000_000_000, lastSeenAt: '2026-08-25T11:30:00.000Z' },
  ],
};

beforeEach(() => {
  document.body.innerHTML = '<main id="root"></main>';
  localStorage.clear();
});

it('renderiza saúde operacional, mídia atual, alertas e filtra a lista sem criar outra tela', () => {
  renderOperationsOverview(document.querySelector('#root'), { devices, live: [], noc, media: [], playlists: [], schedules: [], advertisers: [] }, vi.fn());

  expect(document.querySelector('[data-noc-kpi="online"] strong').textContent).toBe('1');
  expect(document.querySelector('[data-noc-kpi="unstable"] strong').textContent).toBe('1');
  expect(document.querySelector('[data-noc-kpi="offline"] strong').textContent).toBe('1');
  expect(document.querySelector('[data-noc-kpi="attention"] strong').textContent).toBe('2');
  expect(document.body.textContent).toContain('Campanha Vacinação');
  expect(document.querySelectorAll('[data-noc-alert]')).toHaveLength(4);
  expect(document.querySelector('.noc-alerts header span').textContent).toBe('4');
  expect(document.querySelector('.noc-alerts').textContent).toContain('Conexão instável');
  expect(document.querySelector('.noc-alerts').textContent).toContain('Erro no player');
  expect(document.querySelector('.noc-alerts').textContent).toContain('Armazenamento baixo');
  expect(document.querySelector('.noc-alerts').textContent).toContain('TV offline');
  expect(document.querySelector('[data-overview-device="tv-2"]').textContent).toContain('há 5 min');

  document.querySelector('[data-noc-filter="unstable"]').click();
  expect(document.querySelector('[data-overview-device="tv-1"]').hidden).toBe(true);
  expect(document.querySelector('[data-overview-device="tv-2"]').hidden).toBe(false);
  document.querySelector('[data-noc-filter="all"]').click();
  const search = document.querySelector('[data-noc-search]');
  search.value = 'hotel';
  search.dispatchEvent(new Event('input', { bubbles: true }));
  expect(document.querySelector('[data-overview-device="tv-1"]').hidden).toBe(true);
  expect(document.querySelector('[data-overview-device="tv-3"]').hidden).toBe(false);
});

it('seleciona uma TV e solicita comandos remotos com confirmação nos disruptivos', async () => {
  const client = vi.fn().mockResolvedValue({ status: 'queued' });
  const refresh = vi.fn();
  const confirm = vi.spyOn(globalThis, 'confirm').mockReturnValue(true);
  renderOperationsOverview(document.querySelector('#root'), { devices, live: [], noc, media: [], playlists: [], schedules: [], advertisers: [], selectedOrganizationId: ORGANIZATION_ID }, vi.fn(), { client, refresh });

  document.querySelector('[data-overview-device="tv-2"]').click();
  document.querySelector('[data-noc-command="refresh_sync"]').click();
  await vi.waitFor(() => expect(client).toHaveBeenCalledTimes(1));
  expect(client).toHaveBeenLastCalledWith('/admin/devices/tv-2/remote-commands', {
    method: 'POST',
    body: { organizationId: ORGANIZATION_ID, commandType: 'refresh_sync', idempotencyKey: expect.any(String) },
  });
  expect(document.querySelector('[data-noc-command-status]').textContent).toContain('Solicitado');
  expect(document.querySelector('[data-noc-command-status]').textContent).not.toContain('Executado');
  expect(confirm).not.toHaveBeenCalled();

  document.querySelector('[data-noc-command="restart_player"]').click();
  await vi.waitFor(() => expect(client).toHaveBeenCalledTimes(2));
  expect(client).toHaveBeenLastCalledWith('/admin/devices/tv-2/remote-commands', {
    method: 'POST',
    body: { organizationId: ORGANIZATION_ID, commandType: 'restart_player', idempotencyKey: expect.any(String) },
  });
  expect(confirm).toHaveBeenCalledTimes(1);
  document.querySelector('[data-noc-command="clear_media_cache"]').click();
  await vi.waitFor(() => expect(client).toHaveBeenCalledTimes(3));
  expect(client).toHaveBeenLastCalledWith('/admin/devices/tv-2/remote-commands', {
    method: 'POST',
    body: { organizationId: ORGANIZATION_ID, commandType: 'clear_media_cache', idempotencyKey: expect.any(String) },
  });
  expect(confirm).toHaveBeenCalledTimes(2);
  expect(refresh).not.toHaveBeenCalled();
  confirm.mockRestore();
});

it('cancela comando disruptivo e abre Empresas no índice correto', () => {
  const client = vi.fn();
  const openView = vi.fn();
  const confirm = vi.spyOn(globalThis, 'confirm').mockReturnValue(false);
  renderOperationsOverview(document.querySelector('#root'), { devices, live: [], noc, media: [], playlists: [], schedules: [], advertisers: [] }, openView, { client, refresh: vi.fn() });
  document.querySelector('[data-overview-device="tv-1"]').click();
  document.querySelector('[data-noc-command="restart_player"]').click();
  expect(client).not.toHaveBeenCalled();
  document.querySelector('[data-open-companies]').click();
  expect(openView).toHaveBeenCalledWith(8);
  confirm.mockRestore();
});
