// @vitest-environment jsdom
import { beforeEach, expect, it, vi } from 'vitest';
import { api, resolveApiBase } from '../src/api.js';

beforeEach(() => {
  vi.restoreAllMocks();
});

it('resolve a API canônica mesmo quando o controller é aberto por uma pasta local', () => {
  expect(resolveApiBase('/angel-midia/controller/')).toBe('/angel-midia/api');
  expect(resolveApiBase('/angel-midia/')).toBe('/angel-midia/api');
  expect(resolveApiBase('/')).toBe('/api');
});

it('preserva status e código do erro de autenticação', async () => {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: false,
    status: 503,
    json: vi.fn().mockResolvedValue({ error: 'angel_media_unavailable' }),
  });
  vi.stubGlobal('fetch', fetchMock);
  await expect(api('/auth/login', { method: 'POST', body: { identifier: 'admin', password: 'secret' } }))
    .rejects.toMatchObject({ status: 503, code: 'angel_media_unavailable' });
  expect(fetchMock).toHaveBeenCalledWith('/api/auth/login', expect.any(Object));
});
