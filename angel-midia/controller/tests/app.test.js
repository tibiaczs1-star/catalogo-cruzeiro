// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { createApp } from '../src/app.js';

const controllerRoot = process.cwd();

describe('Angel AppStation shell', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="app"></div>';
  });

  it('mostra login quando a sessão está ausente', async () => {
    const apiClient = vi.fn().mockRejectedValue(new Error('unauthorized'));
    await createApp({ root: document.querySelector('#app'), apiClient });

    expect(document.querySelector('[data-view="login"]')).not.toBeNull();
    expect(document.querySelectorAll('[data-nav]')).toHaveLength(0);
  });

  it('renderiza somente as quatro áreas principais após autenticação', async () => {
    const apiClient = vi.fn(async (path) => {
      if (path === '/auth/me') return { id: '1', name: 'Administrador' };
      if (path === '/admin/devices') return [];
      if (path === '/admin/campaigns') return [];
      throw new Error(`unexpected ${path}`);
    });

    await createApp({ root: document.querySelector('#app'), apiClient });

    expect([...document.querySelectorAll('[data-nav]')].map((node) => node.textContent.trim()))
      .toEqual(['Visão geral', 'TVs', 'Campanhas', 'Programação']);
  });

  it('resume TVs e campanhas ativas sem gráficos', async () => {
    const apiClient = vi.fn(async (path) => {
      if (path === '/auth/me') return { id: '1', name: 'Ana' };
      if (path === '/admin/devices') return [
        { id: '1', status: 'active', online: true },
        { id: '2', status: 'active', online: false },
        { id: '3', status: 'pending', online: false },
        { id: '4', status: 'blocked', online: false },
      ];
      if (path === '/admin/campaigns') return [
        { id: 'c1', status: 'approved' },
        { id: 'c2', status: 'draft' },
      ];
      throw new Error(`unexpected ${path}`);
    });

    await createApp({ root: document.querySelector('#app'), apiClient });

    expect(document.querySelector('[data-count="online"]').textContent).toBe('1');
    expect(document.querySelector('[data-count="offline"]').textContent).toBe('1');
    expect(document.querySelector('[data-count="pending"]').textContent).toBe('1');
    expect(document.querySelector('[data-count="campaigns"]').textContent).toBe('1');
    expect(document.querySelector('canvas, svg')).toBeNull();
  });

  it('informa falha de dados e permite tentar novamente sem exibir zeros falsos', async () => {
    let unavailable = true;
    const apiClient = vi.fn(async (path) => {
      if (path === '/auth/me') return { id: '1', name: 'Ana' };
      if (path === '/admin/devices' || path === '/admin/campaigns') {
        if (unavailable) throw new Error('network');
        return path.endsWith('devices') ? [{ id: '1', status: 'active', online: true }] : [];
      }
      throw new Error(`unexpected ${path}`);
    });

    await createApp({ root: document.querySelector('#app'), apiClient });

    expect(document.querySelector('[role="status"]').textContent).toContain('Dados indisponíveis');
    expect([...document.querySelectorAll('[data-count]')].map((node) => node.textContent)).toEqual(['—', '—', '—', '—']);
    unavailable = false;
    document.querySelector('[data-retry]').click();
    await vi.waitFor(() => expect(document.querySelector('[role="status"]').textContent).toContain('Sistema disponível'));
    expect(document.querySelector('[data-count="online"]').textContent).toBe('1');
  });

  it('abre a área real de TVs pelo próximo passo', async () => {
    const apiClient = vi.fn(async (path) => {
      if (path === '/auth/me') return { id: '1', name: 'Ana' };
      if (path === '/admin/devices') return [{ id: 'tv-1', name: 'Recepção', status: 'pending' }];
      if (path === '/admin/campaigns') return [];
      throw new Error(`unexpected ${path}`);
    });

    await createApp({ root: document.querySelector('#app'), apiClient });
    document.querySelector('[data-go-tvs]').click();

    expect(document.querySelector('[data-nav="1"]').getAttribute('aria-current')).toBe('page');
    expect(document.querySelector('.workspace').dataset.view).toBe('tvs');
    expect(document.querySelector('.workspace h1').textContent).toBe('TVs');
    expect(document.querySelector('.workspace').textContent).toContain('Recepção');
  });

  it('renderiza conteúdo próprio ao selecionar cada área', async () => {
    const apiClient = vi.fn(async (path) => {
      if (path === '/auth/me') return { id: '1', name: 'Ana' };
      if (path === '/admin/devices' || path === '/admin/campaigns') return [];
      throw new Error(`unexpected ${path}`);
    });
    await createApp({ root: document.querySelector('#app'), apiClient });

    document.querySelector('[data-nav="2"]').click();
    expect(document.querySelector('.workspace').dataset.view).toBe('campaigns');
    expect(document.querySelector('.workspace [data-area="campaigns"]')).not.toBeNull();
    expect(document.querySelector('[data-count]')).toBeNull();
    document.querySelector('[data-nav="3"]').click();
    expect(document.querySelector('.workspace [data-area="schedule"]')).not.toBeNull();
  });

  it('limita aria-live às mensagens de status', async () => {
    expect(readFileSync(`${controllerRoot}/index.html`, 'utf8')).not.toMatch(/id="app"[^>]*aria-live/);
    const apiClient = vi.fn(async (path) => {
      if (path === '/auth/me') return { id: '1', name: 'Ana' };
      if (path === '/admin/devices' || path === '/admin/campaigns') return [];
      throw new Error(`unexpected ${path}`);
    });
    await createApp({ root: document.querySelector('#app'), apiClient });
    expect(document.querySelector('#app').hasAttribute('aria-live')).toBe(false);
    expect(document.querySelectorAll('[aria-live="polite"]')).toHaveLength(1);
    expect(document.querySelector('[role="status"][aria-live="polite"]')).not.toBeNull();
  });

  it('envia login e abre a visão geral', async () => {
    let authenticated = false;
    const apiClient = vi.fn(async (path, options = {}) => {
      if (path === '/auth/me') {
        if (!authenticated) throw new Error('unauthorized');
        return { id: '1', name: 'Ana' };
      }
      if (path === '/auth/login' && options.method === 'POST') {
        authenticated = true;
        return { id: '1', name: 'Ana' };
      }
      if (path === '/admin/devices' || path === '/admin/campaigns') return [];
      throw new Error(`unexpected ${path}`);
    });

    await createApp({ root: document.querySelector('#app'), apiClient });
    document.querySelector('[name="email"]').value = 'ana@example.com';
    document.querySelector('[name="password"]').value = 'segredo';
    document.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await vi.waitFor(() => expect(document.querySelector('[data-view="overview"]')).not.toBeNull());

    expect(apiClient).toHaveBeenCalledWith('/auth/login', {
      method: 'POST',
      body: { email: 'ana@example.com', password: 'segredo' },
    });
  });

  it('oferece manifest instalável com ícones válidos e maskable', () => {
    const manifest = JSON.parse(readFileSync(`${controllerRoot}/manifest.webmanifest`, 'utf8'));
    expect(manifest.icons).toEqual(expect.arrayContaining([
      expect.objectContaining({ sizes: '192x192', purpose: expect.stringContaining('any') }),
      expect.objectContaining({ sizes: '512x512', purpose: expect.stringContaining('any') }),
      expect.objectContaining({ sizes: '512x512', purpose: expect.stringContaining('maskable') }),
    ]));
    for (const icon of manifest.icons) {
      const path = `${controllerRoot}/${icon.src.replace(/^\//, '')}`;
      expect(existsSync(path), `${icon.src} deve existir`).toBe(true);
      expect(readFileSync(path, 'utf8')).toContain('<svg');
    }
  });

  it('registra o service worker no carregamento', async () => {
    const register = vi.fn().mockResolvedValue({});
    Object.defineProperty(navigator, 'serviceWorker', { configurable: true, value: { register } });
    const apiClient = vi.fn().mockRejectedValue(new Error('unauthorized'));

    await createApp({ root: document.querySelector('#app'), apiClient });

    expect(register).toHaveBeenCalledWith('./sw.js', { scope: './' });
  });

  it('mantém o shell offline sem armazenar respostas da API', () => {
    const worker = readFileSync(`${controllerRoot}/sw.js`, 'utf8');
    expect(worker).toContain("request.url.includes('/api/')");
    expect(worker).toContain('caches.open');
    expect(worker).toContain("'./index.html'");
  });

  it('permite que o formulário encolha sem transbordar em 360 px', () => {
    const styles = readFileSync(`${controllerRoot}/src/responsive.css`, 'utf8');
    expect(styles).toMatch(/\.login-panel\{[^}]*min-width:0/);
    expect(styles).toMatch(/\.login-form\{[^}]*min-width:0/);
  });
});
