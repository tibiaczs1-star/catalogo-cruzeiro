// @vitest-environment jsdom
import { beforeEach, expect, it, vi } from 'vitest';
import { createApp } from '../src/app.js';
import { renderLibrary } from '../src/orchestration.js';

beforeEach(() => { document.body.innerHTML = '<div id="app"></div>'; });

it('expõe as sete áreas operacionais do Angel Mídia Play', async () => {
  const apiClient = vi.fn(async (path) => {
    if (path === '/auth/me') return { name: 'admin' };
    if (path === '/admin/devices' || path === '/admin/campaigns') return [];
    if (path === '/admin/media') return { media: [] };
    if (path === '/admin/playlists') return { playlists: [] };
    if (path === '/admin/schedules') return { schedules: [] };
    if (path === '/admin/live') return { devices: [] };
    if (path === '/admin/reports') return { totals: {}, events: [] };
    throw new Error(path);
  });
  await createApp({ root: document.querySelector('#app'), apiClient });
  expect([...document.querySelectorAll('[data-nav]')].map((n) => n.textContent.trim().slice(2))).toEqual([
    'Visão geral', 'Mapa das TVs', 'Biblioteca', 'Playlists', 'Programação', 'Ao vivo', 'Relatórios',
  ]);
});

it('faz login usando o usuário administrador', async () => {
  let logged = false;
  const apiClient = vi.fn(async (path, options = {}) => {
    if (path === '/auth/me') { if (!logged) throw new Error('401'); return { name: 'admin' }; }
    if (path === '/auth/login') { logged = options.body.identifier === 'admin'; return {}; }
    if (path === '/admin/devices' || path === '/admin/campaigns') return [];
    if (path.startsWith('/admin/')) return path.endsWith('/live') ? { devices: [] } : {};
    throw new Error(path);
  });
  await createApp({ root: document.querySelector('#app'), apiClient });
  document.querySelector('[name="identifier"]').value = 'admin';
  document.querySelector('[name="password"]').value = 'secret';
  document.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  await vi.waitFor(() => expect(apiClient).toHaveBeenCalledWith('/auth/login', { method: 'POST', body: { identifier: 'admin', password: 'secret' } }));
});

it('envia o nome da mídia usando o contrato multipart da API', async () => {
  const apiClient = vi.fn(async () => ({}));
  const root = document.querySelector('#app');
  renderLibrary(root, { media: [] }, apiClient, vi.fn());
  const form = root.querySelector('[data-upload]');
  const mediaInput = form.querySelector('[name="media"]');
  const file = new File(['imagem'], 'foto.png', { type: 'image/png' });
  Object.defineProperty(mediaInput, 'files', { configurable: true, value: [file] });
  form.querySelector('[name="displayName"]').value = 'Foto 2';
  form.querySelector('[name="durationSeconds"]').value = '10';
  form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  await vi.waitFor(() => expect(apiClient).toHaveBeenCalled());
  const [path, options] = apiClient.mock.calls[0];
  expect(path).toBe('/admin/media');
  expect(options.body.get('name')).toBe('Foto 2');
  expect(options.body.has('displayName')).toBe(false);
});
