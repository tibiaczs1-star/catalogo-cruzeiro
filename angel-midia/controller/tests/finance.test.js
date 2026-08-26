// @vitest-environment jsdom
import { beforeEach, expect, it, vi } from 'vitest';
import { renderFinance } from '../src/finance.js';

beforeEach(() => { document.body.innerHTML = '<main id="finance"></main>'; });

it('oferece foto e logo com prévia no cadastro da empresa', () => {
  renderFinance(document.querySelector('#finance'), { advertisers: [], companies: [], totals: {} }, [], vi.fn(), vi.fn());
  expect(document.querySelector('.company-photo-input[name="photo"]')).not.toBeNull();
  expect(document.querySelector('.company-photo-input[name="logo"]')).not.toBeNull();
  expect(document.querySelector('[data-company-photo-preview]')).not.toBeNull();
  expect(document.querySelector('[data-company-logo-preview]')).not.toBeNull();
});

it('envia os arquivos à biblioteca e salva seus ids na empresa', async () => {
  const photoId = '11111111-1111-4111-8111-111111111111';
  const logoId = '22222222-2222-4222-8222-222222222222';
  const api = vi.fn(async (path) => path === '/admin/media'
    ? { id: api.mock.calls.filter(([called]) => called === '/admin/media').length === 1 ? photoId : logoId }
    : { id: 'empresa-1' });
  const refresh = vi.fn();
  renderFinance(document.querySelector('#finance'), { advertisers: [], companies: [], totals: {} }, [], api, refresh);
  const form = document.querySelector('[data-company]');
  form.querySelector('[name="name"]').value = 'Mercado Juruá';
  const photo = new File(['foto'], 'fachada.jpg', { type: 'image/jpeg' });
  const logo = new File(['logo'], 'logo.png', { type: 'image/png' });
  Object.defineProperty(form.querySelector('[name="photo"]'), 'files', { configurable: true, value: [photo] });
  Object.defineProperty(form.querySelector('[name="logo"]'), 'files', { configurable: true, value: [logo] });
  form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  await vi.waitFor(() => expect(refresh).toHaveBeenCalled());
  const uploads = api.mock.calls.filter(([path]) => path === '/admin/media');
  expect(uploads).toHaveLength(2);
  expect(uploads.every(([, options]) => options.body instanceof FormData)).toBe(true);
  expect(api).toHaveBeenCalledWith('/admin/advertisers', {
    method: 'POST',
    body: expect.objectContaining({ name: 'Mercado Juruá', photoAssetId: photoId, logoAssetId: logoId }),
  });
});

it('explica que a tela trata anunciantes e direciona acesso e TVs para Rede & CRM', () => {
  const root = document.querySelector('#finance');
  renderFinance(root, { advertisers: [], companies: [], totals: {} }, [], vi.fn(), vi.fn());
  const navigate = vi.fn();
  root.addEventListener('angel:navigate', navigate);
  expect(document.body.textContent).toContain('Empresa nesta tela = anunciante');
  root.querySelector('[data-go-network]').click();
  expect(navigate).toHaveBeenCalled();
  expect(navigate.mock.calls[0][0].detail).toEqual({ view: 'network' });
});
