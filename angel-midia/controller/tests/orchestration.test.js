// @vitest-environment jsdom
import { beforeEach, expect, it, vi } from 'vitest';
import { createApp } from '../src/app.js';
import { renderLibrary, renderPlaylists, renderSchedule } from '../src/orchestration.js';
import { renderCampaignProgramming } from '../src/campaigns.js';
import { filterMedia, formatMediaFacts } from '../src/library.js';
import { buildPresentationPatch, openMediaEditor } from '../src/media-editor.js';
import { openMediaViewer } from '../src/media-viewer.js';

beforeEach(() => { document.body.innerHTML = '<div id="app"></div>'; });

it('expõe as dez áreas operacionais do Angel Mídia Play', async () => {
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
    'Visão geral', 'Mapa das TVs', 'Biblioteca', 'Playlists', 'Programação', 'Ao vivo', 'Relatórios', 'Empresas', 'Relâmpago', 'Aplicativos',
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
  expect(root.querySelector('.editor-preview video')?.getAttribute('src')).toBe('./api/admin/media/m1/content');
});

it('mostra a imagem real no card da biblioteca', () => {
  const root = document.querySelector('#app');
  renderLibrary(root, { media: [{ id: 'm4', display_name: 'Foto', content_type: 'image/png' }] }, vi.fn(), vi.fn());
  const preview = root.querySelector('.media-preview img');
  expect(preview).not.toBeNull();
  expect(preview.getAttribute('src')).toBe('./api/admin/media/m4/content');
  expect(preview.getAttribute('alt')).toBe('Prévia de Foto');
});

it('aceita mimeType no card e não inventa informação de áudio ausente', () => {
  const root = document.querySelector('#app');
  renderLibrary(root, { media: [{ id: 'm4b', name: 'Filme', mimeType: 'video/mp4' }] }, vi.fn(), vi.fn());
  expect(root.querySelector('.media-preview video')).not.toBeNull();
  expect(root.textContent).toContain('Áudio');
  expect(root.textContent).toContain('Não informado');
});

it('mostra detalhes operacionais no card e abre a mídia inteira', () => {
  const root = document.querySelector('#app');
  const media = {
    id: 'm5', display_name: 'Campanha verão', content_type: 'video/mp4', width: 1920, height: 1080,
    duration_seconds: 12, size_bytes: 10485760, has_audio: true, processing_status: 'ready',
    playlists: [{ name: 'Principal' }, { name: 'Shopping' }], groups: [{ name: 'Shopping Center' }], playing_now_count: 2,
  };
  renderLibrary(root, { media: [media] }, vi.fn(), vi.fn());
  expect(root.textContent).toContain('12 s');
  expect(root.textContent).toContain('2 playlists');
  expect(root.textContent).toContain('1 conjunto');
  expect(root.querySelector('[data-preview-media="m5"]')).not.toBeNull();
  root.querySelector('[data-preview-media="m5"]').click();
  const viewer = root.querySelector('.media-viewer');
  expect(viewer).not.toBeNull();
  expect(viewer.querySelector('video').controls).toBe(true);
  expect(viewer.textContent).toContain('Mostrar inteira');
  viewer.querySelector('[data-close-media-viewer]').click();
  root.querySelector('[data-media-search]').value = 'verão';
  root.querySelector('[data-media-search]').dispatchEvent(new Event('input', { bubbles: true }));
  root.querySelector('[data-preview-media="m5"]').click();
  expect(root.querySelectorAll('.media-viewer')).toHaveLength(1);
});

it('renderiza visualizador acessível sem acumular diálogos', () => {
  const root = document.querySelector('#app');
  const media = { id: 'm6', display_name: '<Oferta>', content_type: 'image/png', width: 1080, height: 1080 };
  openMediaViewer(root, media);
  openMediaViewer(root, media);
  expect(root.querySelectorAll('.media-viewer')).toHaveLength(1);
  expect(root.querySelector('.media-viewer').getAttribute('aria-modal')).toBe('true');
  expect(root.querySelector('.media-viewer img').getAttribute('alt')).toBe('Prévia de <Oferta>');
  root.querySelector('[data-close-media-viewer]').click();
  expect(root.querySelector('.media-viewer')).toBeNull();
});

it('trata fullscreen indisponível e rejeitado sem promessa não tratada', async () => {
  const root = document.querySelector('#app');
  openMediaViewer(root, { id: 'm7', name: 'Vídeo', type: 'video/mp4' });
  const fullscreen = root.querySelector('[data-viewer-fullscreen]');
  fullscreen.click();
  expect(root.querySelector('[data-viewer-status]').textContent).toContain('não está disponível');
  root.querySelector('[data-viewer-stage]').requestFullscreen = vi.fn(() => Promise.reject(new Error('bloqueado')));
  fullscreen.click();
  await vi.waitFor(() => expect(root.querySelector('[data-viewer-status]').textContent).toContain('Não foi possível'));
});

it('mantém foco no diálogo, restaura o acionador e remove listeners ao fechar', () => {
  const root = document.querySelector('#app');
  root.innerHTML = '<button id="trigger">Abrir</button><main id="background">Conteúdo</main>';
  const trigger = root.querySelector('#trigger');
  trigger.focus();
  const addSpy = vi.spyOn(document, 'addEventListener');
  const removeSpy = vi.spyOn(document, 'removeEventListener');
  openMediaViewer(root, { id: 'm8', name: 'Imagem', type: 'image/png' });
  const viewer = root.querySelector('.media-viewer');
  const controls = [...viewer.querySelectorAll('button')];
  expect(document.activeElement).toBe(controls[0]);
  expect(trigger.inert || trigger.hasAttribute('inert')).toBe(true);
  controls.at(-1).focus();
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
  expect(document.activeElement).toBe(controls[0]);
  controls[0].focus();
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true }));
  expect(document.activeElement).toBe(controls.at(-1));
  controls[0].click();
  expect(document.activeElement).toBe(trigger);
  expect(trigger.inert || trigger.hasAttribute('inert')).toBe(false);
  expect(removeSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
  expect(removeSpy).toHaveBeenCalledWith('fullscreenchange', expect.any(Function));
  expect(addSpy).toHaveBeenCalledWith('fullscreenchange', expect.any(Function));
  addSpy.mockRestore();
  removeSpy.mockRestore();
});

it('atualiza o rótulo quando entra e sai da tela cheia', () => {
  const root = document.querySelector('#app');
  openMediaViewer(root, { id: 'm9', name: 'Imagem', type: 'image/png' });
  const stage = root.querySelector('[data-viewer-stage]');
  Object.defineProperty(document, 'fullscreenElement', { configurable: true, value: stage });
  document.dispatchEvent(new Event('fullscreenchange'));
  expect(root.querySelector('[data-viewer-fullscreen]').textContent).toContain('Sair');
  Object.defineProperty(document, 'fullscreenElement', { configurable: true, value: null });
  document.dispatchEvent(new Event('fullscreenchange'));
  expect(root.querySelector('[data-viewer-fullscreen]').textContent).toContain('Tela cheia');
});

it('envia o tipo de cada mídia ao criar uma playlist', async () => {
  const apiClient = vi.fn(async () => ({}));
  const root = document.querySelector('#app');
  renderPlaylists(root, [], { media: [{ id: 'm1', display_name: 'Foto', content_type: 'image/png', duration_seconds: 8 }] }, apiClient, vi.fn());
  root.querySelector('[name=name]').value = 'Vitrine';
  root.querySelector('[name=asset]').checked = true;
  root.querySelector('[data-playlist]').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  await vi.waitFor(() => expect(apiClient).toHaveBeenCalled());
  expect(apiClient.mock.calls[0][1].body.items[0]).toMatchObject({ assetId: 'm1', type: 'image/png', imageDurationSeconds: 8 });
});

it('programa uma playlist contínua por padrão sem enviar datas', async () => {
  const apiClient = vi.fn(async () => ({}));
  const root = document.querySelector('#app');
  renderSchedule(root, { playlists: [{ id: 'p1', name: 'Principal' }], devices: [], groups: [{ id: 'g1', name: 'Lojas Centro' }], schedules: [] }, apiClient, vi.fn());
  const form = root.querySelector('[data-schedule]');
  expect(form.elements.mode.value).toBe('continuous');
  expect(form.querySelector('[data-schedule-window]').hidden).toBe(true);
  expect(form.elements.startsAt.required).toBe(false);
  expect(form.elements.endsAt.required).toBe(false);
  root.querySelector('[name=playlistId]').value = 'p1';
  root.querySelector('[name=target]').value = 'group:g1';
  form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  await vi.waitFor(() => expect(apiClient).toHaveBeenCalled());
  expect(apiClient.mock.calls[0][1].body).toEqual({
    playlistId: 'p1', target: { type: 'group', id: 'g1' }, mode: 'continuous', priority: 'normal',
  });
});

it('mostra a janela agendada e envia as datas em ISO', async () => {
  const apiClient = vi.fn(async () => ({}));
  const root = document.querySelector('#app');
  renderSchedule(root, { playlists: [{ id: 'p1', name: 'Principal' }], devices: [], groups: [], schedules: [] }, apiClient, vi.fn());
  const form = root.querySelector('[data-schedule]');
  form.querySelector('[name=mode][value=scheduled]').checked = true;
  form.querySelector('[name=mode][value=scheduled]').dispatchEvent(new Event('change', { bubbles: true }));
  expect(form.querySelector('[data-schedule-window]').hidden).toBe(false);
  expect(form.elements.startsAt.required).toBe(true);
  expect(form.elements.endsAt.required).toBe(true);
  form.elements.playlistId.value = 'p1';
  form.elements.startsAt.value = '2026-08-20T10:00';
  form.elements.endsAt.value = '2026-08-21T10:00';
  form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  await vi.waitFor(() => expect(apiClient).toHaveBeenCalled());
  expect(apiClient.mock.calls[0][1].body).toMatchObject({
    mode: 'scheduled',
    startsAt: new Date('2026-08-20T10:00').toISOString(),
    endsAt: new Date('2026-08-21T10:00').toISOString(),
  });
});

it.each([
  ['', '', 'Informe o início e o fim da programação.'],
  ['invalid', '2026-08-21T10:00', 'Informe datas e horários válidos.'],
  ['2026-08-21T10:00', '2026-08-20T10:00', 'O fim precisa ser depois do início.'],
])('bloqueia playlist agendada com janela inválida', async (startsAt, endsAt, message) => {
  const apiClient = vi.fn(async () => ({}));
  const root = document.querySelector('#app');
  renderSchedule(root, { playlists: [{ id: 'p1', name: 'Principal' }], devices: [], groups: [], schedules: [] }, apiClient, vi.fn());
  const form = root.querySelector('[data-schedule]');
  form.querySelector('[name=mode][value=scheduled]').checked = true;
  form.querySelector('[name=mode][value=scheduled]').dispatchEvent(new Event('change', { bubbles: true }));
  form.elements.playlistId.value = 'p1';
  if (startsAt === 'invalid') Object.defineProperty(form.elements.startsAt, 'value', { configurable: true, value: startsAt });
  else form.elements.startsAt.value = startsAt;
  form.elements.endsAt.value = endsAt;
  form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  await Promise.resolve();
  expect(apiClient).not.toHaveBeenCalled();
  expect(form.querySelector('[role=status]').textContent).toBe(message);
});

it('reutiliza os modos contínuo e agendado no formulário de campanha', () => {
  const root = document.querySelector('#app');
  renderCampaignProgramming(root, { devices: [], campaigns: [], apiClient: vi.fn() });
  const form = root.querySelector('.campaign-form');
  expect(form.elements.mode.value).toBe('continuous');
  expect(form.querySelector('[data-schedule-window]').hidden).toBe(true);
  form.querySelector('[name=mode][value=scheduled]').checked = true;
  form.querySelector('[name=mode][value=scheduled]').dispatchEvent(new Event('change', { bubbles: true }));
  expect(form.querySelector('[data-schedule-window]').hidden).toBe(false);
  expect(form.elements.startsAt.required).toBe(true);
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

it('oferece nove alinhamentos e centraliza a mídia com indicadores sincronizados', () => {
  const root = document.querySelector('#app');
  openMediaEditor(root, { id: 'align', name: 'Cartaz', type: 'image/png', presentation: { fitMode: 'contain', focalX: 15, focalY: 85, zoom: 1, rotation: 0, backgroundColor: '#000000' } }, vi.fn());
  expect(root.querySelectorAll('[data-align]')).toHaveLength(9);
  root.querySelector('[data-align="center"]').click();
  expect(root.querySelector('[name=focalX]').value).toBe('50');
  expect(root.querySelector('[name=focalY]').value).toBe('50');
  expect(root.querySelector('[data-focal-x-value]').textContent).toBe('50%');
  expect(root.querySelector('[data-focal-y-value]').textContent).toBe('50%');
  const horizontalNumber = root.querySelector('[data-number-for="focalX"]');
  horizontalNumber.value = '72';
  horizontalNumber.dispatchEvent(new Event('input', { bubbles: true }));
  expect(root.querySelector('[name=focalX]').value).toBe('72');
  expect(root.querySelector('[data-focal-x-value]').textContent).toBe('72%');
});

it('inclui proporção da tela, área segura e aviso para modos que deformam ou cortam', () => {
  const root = document.querySelector('#app');
  openMediaEditor(root, { id: 'ratio', name: 'Cartaz', type: 'image/png' }, vi.fn());
  expect(root.querySelectorAll('[name=screenRatio] option')).toHaveLength(4);
  expect(root.querySelector('[data-safe-area]')).not.toBeNull();
  root.querySelector('[name=fitMode]').value = 'cover';
  root.querySelector('[name=fitMode]').dispatchEvent(new Event('input', { bubbles: true }));
  expect(root.querySelector('[data-fit-warning]').hidden).toBe(false);
});

it('normaliza enquadramento e metadados de reprodução por tipo', () => {
  expect(buildPresentationPatch({ fitMode: 'invalid', focalX: '-8', focalY: '120', zoom: '9', rotation: '45', backgroundColor: 'red', mediaType: 'image/png', imageDurationSeconds: '8' })).toMatchObject({ fitMode: 'contain', focalX: 0, focalY: 100, zoom: 4, rotation: 0, backgroundColor: '#000000', durationSeconds: 8 });
  expect(buildPresentationPatch({ fitMode: 'fill', focalX: '50', focalY: '50', zoom: '0', rotation: '270', backgroundColor: '#ABCDEF', mediaType: 'video/mp4', trimStartSeconds: '', trimEndSeconds: '18', volume: '150' })).toMatchObject({ fitMode: 'fill', zoom: 0.25, rotation: 270, backgroundColor: '#abcdef', trimStartSeconds: null, trimEndSeconds: 18, volume: 100 });
});

it('mostra duração para imagem sem controles de corte', async () => {
  const apiClient = vi.fn(async () => ({}));
  const root = document.querySelector('#app');
  openMediaEditor(root, { id: 'photo', name: 'Foto', type: 'image/png', durationSeconds: 11 }, apiClient);
  expect(root.querySelector('[name=imageDurationSeconds]').value).toBe('11');
  expect(root.querySelector('[data-video-timeline]')).toBeNull();
  root.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  await vi.waitFor(() => expect(apiClient).toHaveBeenCalled());
  expect(apiClient.mock.calls[0][1].body.durationSeconds).toBe(11);
  expect(apiClient.mock.calls[0][1].body).not.toHaveProperty('trimStartSeconds');
});

it('mostra timeline, corte e volume para vídeo e envia edição não destrutiva', async () => {
  const apiClient = vi.fn(async () => ({}));
  const root = document.querySelector('#app');
  openMediaEditor(root, { id: 'movie', name: 'Filme', type: 'video/mp4', durationSeconds: 30, trimStartSeconds: 2, trimEndSeconds: 25, volume: 80 }, apiClient);
  expect(root.querySelector('[data-video-timeline]')).not.toBeNull();
  expect(root.querySelector('[name=trimStartSeconds]').value).toBe('2');
  expect(root.querySelector('[name=trimEndSeconds]').value).toBe('25');
  expect(root.querySelector('[name=volume]').value).toBe('80');
  root.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  await vi.waitFor(() => expect(apiClient).toHaveBeenCalled());
  expect(apiClient.mock.calls[0][1].body).toMatchObject({ trimStartSeconds: 2, trimEndSeconds: 25, volume: 80 });
  expect(apiClient.mock.calls[0][1].body).not.toHaveProperty('durationSeconds');
});

it('desfaz a última alteração da sessão e restaura os padrões', () => {
  const root = document.querySelector('#app');
  openMediaEditor(root, { id: 'undo', name: 'Foto', type: 'image/png', presentation: { fitMode: 'cover', focalX: 25, focalY: 75, zoom: 1.5, rotation: 90, backgroundColor: '#112233' } }, vi.fn());
  const zoom = root.querySelector('[name=zoom]');
  zoom.value = '2';
  zoom.dispatchEvent(new Event('input', { bubbles: true }));
  root.querySelector('[data-undo]').click();
  expect(zoom.value).toBe('1.5');
  root.querySelector('[data-reset]').click();
  expect(root.querySelector('[name=fitMode]').value).toBe('contain');
  expect(root.querySelector('[name=focalX]').value).toBe('50');
});

it('restaura todo o estado visual e a duração padrão da imagem', () => {
  const root = document.querySelector('#app');
  openMediaEditor(root, { id: 'reset-image', name: 'Foto', type: 'image/png', durationSeconds: 27, presentation: { fitMode: 'fill', focalX: 20, focalY: 80, zoom: 2, rotation: 270, backgroundColor: '#abcdef' } }, vi.fn());
  root.querySelector('[name=screenRatio]').value = '9-16';
  root.querySelector('[name=imageDurationSeconds]').value = '22';
  root.querySelector('[data-reset]').click();
  expect(Object.fromEntries(new FormData(root.querySelector('form')))).toMatchObject({ fitMode: 'contain', focalX: '50', focalY: '50', zoom: '1', rotation: '0', backgroundColor: '#000000', screenRatio: '16-9', imageDurationSeconds: '10' });
});

it('restaura todo o playback padrão do vídeo', () => {
  const root = document.querySelector('#app');
  openMediaEditor(root, { id: 'reset-video', name: 'Filme', type: 'video/mp4', trimStartSeconds: 3, trimEndSeconds: 20, volume: 45 }, vi.fn());
  root.querySelector('[name=screenRatio]').value = '4-3';
  root.querySelector('[data-reset]').click();
  expect(Object.fromEntries(new FormData(root.querySelector('form')))).toMatchObject({ screenRatio: '16-9', trimStartSeconds: '', trimEndSeconds: '', volume: '100' });
});
