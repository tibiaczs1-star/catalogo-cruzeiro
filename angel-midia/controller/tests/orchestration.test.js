// @vitest-environment jsdom
import { beforeEach, expect, it, vi } from 'vitest';
import { createApp } from '../src/app.js';
import { renderLibrary } from '../src/orchestration.js';
import { filterMedia, formatMediaFacts } from '../src/library.js';
import { buildPresentationPatch, openMediaEditor } from '../src/media-editor.js';

beforeEach(() => { document.body.innerHTML = '<div id="app"></div>'; });

it('expõe as oito áreas operacionais do Angel Mídia Play', async () => {
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
    'Visão geral', 'Mapa das TVs', 'Biblioteca', 'Playlists', 'Programação', 'Ao vivo', 'Relatórios', 'Aplicativos',
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

it('mostra todos os detalhes da mídia e abre o editor de enquadramento', async () => {
  const apiClient = vi.fn(async (path) => path.endsWith('/m1') ? { id: 'm1', name: 'Anúncio', type: 'video/mp4', width: 1920, height: 1080, hasAudio: true, sizeBytes: 10485760, durationSeconds: 12, status: 'ready', presentation: { fitMode: 'cover', focalX: 50, focalY: 50, zoom: 1, rotation: 0, backgroundColor: '#000000' }, usage: { playlists: [{ name: 'Principal' }], playingNow: [{ deviceName: 'TV 1' }, { deviceName: 'TV 2' }] } } : {});
  const root = document.querySelector('#app');
  renderLibrary(root, { media: [{ id: 'm1', display_name: 'Anúncio', content_type: 'video/mp4', width: 1920, height: 1080, has_audio: true, size_bytes: 10485760, duration_seconds: 12, processing_status: 'ready', playing_now_count: 2 }] }, apiClient, vi.fn());
  expect(root.textContent).toContain('VÍDEO');
  expect(root.textContent).toContain('MP4 · 1920×1080 · 16:9');
  expect(root.textContent).toContain('Rodando agora em 2 TVs');
  root.querySelector('[data-edit-media]').click();
  await vi.waitFor(() => expect(root.querySelector('[aria-label="Centralização horizontal"]')).not.toBeNull());
  expect(root.querySelector('[aria-label="Modo de ajuste"]')).not.toBeNull();
});

it('filtra mídias e monta patches seguros para edição não destrutiva', () => {
  const media = [{ display_name: 'Foto vitrine', content_type: 'image/png' }, { display_name: 'Oferta', content_type: 'video/mp4' }];
  expect(filterMedia(media, { query: 'oferta', type: 'video' })).toHaveLength(1);
  expect(formatMediaFacts({ content_type: 'image/png', width: 1080, height: 1080 })).toContain('1:1');
  expect(buildPresentationPatch({ fitMode: 'contain', focalX: '25', focalY: '75', zoom: '1.2', rotation: '90', backgroundColor: '#ffffff' })).toEqual({ fitMode: 'contain', focalX: 25, focalY: 75, zoom: 1.2, rotation: 90, backgroundColor: '#ffffff' });
});

it('abre o editor quando o detalhe usa mimeType em vez de type', () => {
  const root = document.querySelector('#app');
  openMediaEditor(root, {
    id: 'm2', name: 'Vídeo institucional', mimeType: 'video/mp4', width: 1080, height: 1920,
    hasAudio: true, presentation: { fitMode: 'contain', focalX: 50, focalY: 50, zoom: 1, rotation: 0, backgroundColor: '#000000' },
    usage: { playlists: [], playingNow: [] },
  }, vi.fn());
  expect(root.querySelector('.media-type').textContent).toBe('VÍDEO');
});

it('abre o editor com metadados brutos compatíveis com versões anteriores da API', () => {
  const root = document.querySelector('#app');
  openMediaEditor(root, {
    id: 'm3', name: 'Oferta', content_type: 'video/mp4', width: 1920, height: 1080,
    has_audio: true, fit_mode: 'cover', focal_x: 25, focal_y: 75, zoom: 1.2,
    rotation: 90, background_color: '#112233', usage: { playlists: [], playingNow: [] },
  }, vi.fn());
  expect(root.querySelector('[name=fitMode]').value).toBe('cover');
  expect(root.querySelector('[name=focalX]').value).toBe('25');
  expect(root.textContent).toContain('com áudio');
});
