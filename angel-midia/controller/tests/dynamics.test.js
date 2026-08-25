// @vitest-environment jsdom
import { beforeEach, expect, it, vi } from 'vitest';
import { buildDynamicsViewModel, renderDynamics } from '../src/dynamics.js';

beforeEach(() => { document.body.innerHTML = '<main id="root"></main>'; });

const payload = {
  policy: {
    enabled: true,
    intervalItems: 4,
    maxDynamicPercent: 20,
    allowDirectAds: true,
    allowProgrammaticAds: false,
    allowNews: true,
    allowMemes: true,
    transition: 'slide',
    effectIntensity: 'balanced',
    overlayEnabled: true,
    tickerEnabled: true,
    tickerMode: 'live-news',
    tickerText: 'Acompanhe o Catálogo CZS',
    tickerSpeed: 'normal',
    tickerPosition: 'bottom',
    newsSourceUrl: 'https://catalogo-cruzeiro-web.onrender.com/',
    newsFeedUrl: 'https://catalogo-cruzeiro-web.onrender.com/api/news',
    newsQrEnabled: true,
    scheduleDays: 'all',
    windowStart: '00:00',
    windowEnd: '23:59',
    priorityMode: 'balanced',
    directCpmCents: 2500,
    programmaticFloorCpmCents: 1200,
    estimatedDailyCycles: 120,
  },
  inventory: { activeTvs: 3, directAds: 2, programmaticAds: 0, news: 4, memes: 3, proofOfPlay30d: 1840 },
};

it('resume receita, inventário e o ciclo sem prometer rede programática conectada', () => {
  const model = buildDynamicsViewModel(payload);
  expect(model.estimatedMonthlyRevenueCents).toBe(27000);
  expect(model.cycleSlots.filter((slot) => slot.kind !== 'owned').map((slot) => slot.kind)).toEqual(['direct', 'news', 'meme']);

  renderDynamics(document.querySelector('#root'), payload, [], vi.fn(), vi.fn());
  expect(document.body.textContent).toContain('Receita & dinâmica');
  expect(document.body.textContent).toContain('R$ 270,00');
  expect(document.body.textContent).toContain('1.840');
  expect(document.body.textContent).toContain('Conector SSP necessário');
  expect(document.querySelectorAll('[data-dynamic-slot]')).toHaveLength(15);
  expect(document.querySelector('[data-effect-preview]').dataset.effect).toBe('slide');
});

it('oferece transições atuais, letreiro ao vivo e ligação real com o Catálogo CZS', () => {
  renderDynamics(document.querySelector('#root'), payload, [], vi.fn(), vi.fn());

  const text = document.body.textContent;
  expect(text).toContain('Impacto rápido');
  expect(text).toContain('Cortina lateral');
  expect(text).toContain('Subir');
  expect(text).toContain('Giro 3D');
  expect(text).toContain('Foco suave');
  expect(text).toContain('Letreiro animado');
  expect(text).toContain('Catálogo CZS');
  expect(document.querySelector('[data-czs-connection]').getAttribute('href')).toBe('https://catalogo-cruzeiro-web.onrender.com/');
  expect(document.querySelector('[data-czs-qr]').getAttribute('alt')).toContain('QR Code');
});

it('abre com valores seguros quando a API dinâmica ainda não está disponível', () => {
  const model = buildDynamicsViewModel(null);
  expect(model.policy).toMatchObject({ enabled: false, maxDynamicPercent: 20 });
  expect(model.inventory).toMatchObject({ activeTvs: 0, directAds: 0, news: 0, memes: 0 });

  expect(() => renderDynamics(document.querySelector('#root'), null, [], vi.fn(), vi.fn())).not.toThrow();
  expect(document.body.textContent).toContain('MOTOR PAUSADO');
});

it('salva uma política completa e atualiza os manifestos das TVs', async () => {
  const apiClient = vi.fn(async () => ({}));
  const refresh = vi.fn();
  renderDynamics(document.querySelector('#root'), payload, [], apiClient, refresh);
  const form = document.querySelector('[data-dynamics-form]');
  form.elements.maxDynamicPercent.value = '30';
  form.elements.allowProgrammaticAds.checked = true;
  form.elements.transition.value = 'impact';
  form.elements.tickerText.value = 'Siga o Catálogo CZS pelo QR Code';
  form.elements.tickerSpeed.value = 'fast';
  form.elements.tickerPosition.value = 'top';
  form.elements.scheduleDays.value = 'weekdays';
  form.elements.windowStart.value = '08:00';
  form.elements.windowEnd.value = '22:30';
  form.elements.priorityMode.value = 'editorial';
  form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

  await vi.waitFor(() => expect(apiClient).toHaveBeenCalled());
  expect(apiClient).toHaveBeenCalledWith('/admin/dynamic-policy', {
    method: 'PUT',
    body: expect.objectContaining({
      maxDynamicPercent: 30,
      allowProgrammaticAds: true,
      transition: 'impact',
      tickerText: 'Siga o Catálogo CZS pelo QR Code',
      tickerSpeed: 'fast',
      tickerPosition: 'top',
      scheduleDays: 'weekdays',
      windowStart: '08:00',
      windowEnd: '22:30',
      priorityMode: 'editorial',
      newsSourceUrl: 'https://catalogo-cruzeiro-web.onrender.com/',
      newsFeedUrl: 'https://catalogo-cruzeiro-web.onrender.com/api/news',
      newsQrEnabled: true,
    }),
  });
  expect(refresh).toHaveBeenCalled();
});
