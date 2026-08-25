import test from 'node:test';
import assert from 'node:assert/strict';
import {
  composeDynamicCycle,
  estimateMonthlyRevenueCents,
  parseLatestCzsNews,
  validateDynamicPolicy,
} from '../src/services/dynamic-cycle.js';

const baseItem = (position) => ({
  assetId: `base-${position}`,
  type: 'image/png',
  sha256: String(position).padStart(64, 'a'),
  position,
  durationSeconds: 10,
  presentation: { fitMode: 'contain' },
  playback: { transition: 'none' },
});

const candidate = (assetId, sourceType, contentKind, displayName = '') => ({
  assetId,
  type: 'image/png',
  sha256: assetId.padEnd(64, 'b'),
  durationSeconds: 8,
  sourceType,
  contentKind,
  displayName,
  presentation: { fitMode: 'cover' },
  playback: { transition: 'fade' },
});

const policy = {
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
};

test('compõe um ciclo limitado com anúncio, notícia e meme identificados para o APK', () => {
  const base = Array.from({ length: 12 }, (_, index) => baseItem(index));
  const result = composeDynamicCycle(base, [
    candidate('direct-ad', 'direct', 'advertisement'),
    candidate('local-news', 'editorial', 'news', 'Notícia enviada pelo painel'),
    candidate('safe-meme', 'editorial', 'meme'),
    candidate('open-ad', 'programmatic', 'advertisement'),
  ], policy, new Date('2026-08-24T16:00:00Z'), {
    latestNews: { title: 'Festival movimenta Cruzeiro do Sul', url: 'https://catalogo-cruzeiro-web.onrender.com/' },
  });

  const insertions = result.filter((item) => item.insertion);
  assert.equal(result.length, 15);
  assert.deepEqual(insertions.map((item) => item.insertion.kind), ['advertisement', 'news', 'meme']);
  assert.equal(insertions.some((item) => item.assetId === 'open-ad'), false);
  assert.equal(insertions[0].insertion.billable, true);
  assert.deepEqual(insertions[1].visualEffect, {
    transition: 'slide', intensity: 'balanced', overlay: true,
    ticker: {
      enabled: true,
      text: 'Festival movimenta Cruzeiro do Sul',
      speed: 'normal',
      position: 'bottom',
      source: 'Catálogo CZS',
    },
    qrCode: {
      enabled: true,
      url: 'https://catalogo-cruzeiro-web.onrender.com/',
      label: 'SIGA O CATÁLOGO CZS',
    },
  });
  assert.ok(result.every((item, index) => item.position === index));
});

test('desativa todas as inserções sem alterar a playlist base', () => {
  const base = [baseItem(0), baseItem(1)];
  assert.deepEqual(composeDynamicCycle(base, [candidate('ad', 'direct', 'advertisement')], { ...policy, enabled: false }), base);
});

test('estima receita apenas a partir de impressões e CPM configurados', () => {
  assert.equal(estimateMonthlyRevenueCents({ activeTvs: 3, paidSlotsPerCycle: 1, policy }), 27000);
  assert.equal(estimateMonthlyRevenueCents({ activeTvs: 0, paidSlotsPerCycle: 1, policy }), 0);
});

test('valida limites de frequência, participação dinâmica e efeitos', () => {
  assert.equal(validateDynamicPolicy(policy).ok, true);
  assert.equal(validateDynamicPolicy({ ...policy, maxDynamicPercent: 41 }).ok, false);
  assert.equal(validateDynamicPolicy({ ...policy, transition: 'glitch' }).ok, false);
  assert.equal(validateDynamicPolicy({ ...policy, effectIntensity: 'extreme' }).ok, false);
  for (const transition of ['wipe', 'rise', 'flip', 'blur', 'impact']) {
    assert.equal(validateDynamicPolicy({ ...policy, transition }).ok, true);
  }
  assert.equal(validateDynamicPolicy({ ...policy, newsSourceUrl: 'https://example.com/' }).ok, false);
  assert.equal(validateDynamicPolicy({ ...policy, newsFeedUrl: 'http://catalogo-cruzeiro-web.onrender.com/api/news' }).ok, false);
  assert.equal(validateDynamicPolicy({ ...policy, windowStart: '25:00' }).ok, false);
  assert.equal(validateDynamicPolicy({ ...policy, scheduleDays: 'mondays' }).ok, false);
});

test('respeita dias e janela local de programação', () => {
  const rules = { ...policy, scheduleDays: 'weekdays', windowStart: '08:00', windowEnd: '18:00' };
  const candidateItems = [candidate('local-news', 'editorial', 'news')];
  const monday = composeDynamicCycle(Array.from({ length: 4 }, (_, index) => baseItem(index)), candidateItems, rules, new Date('2026-08-24T16:00:00Z'));
  const sunday = composeDynamicCycle(Array.from({ length: 4 }, (_, index) => baseItem(index)), candidateItems, rules, new Date('2026-08-23T16:00:00Z'));
  assert.equal(monday.some((item) => item.insertion), true);
  assert.equal(sunday.some((item) => item.insertion), false);
});

test('prioriza receita ou editorial sem misturar os rótulos', () => {
  const base = Array.from({ length: 8 }, (_, index) => baseItem(index));
  const candidates = [
    candidate('news', 'editorial', 'news'),
    candidate('programmatic', 'programmatic', 'advertisement'),
  ];
  const result = composeDynamicCycle(base, candidates, { ...policy, allowProgrammaticAds: true, priorityMode: 'revenue' }, new Date('2026-08-24T16:00:00Z'));
  assert.equal(result.find((item) => item.insertion)?.assetId, 'programmatic');
});

test('interpreta o feed público real do Catálogo CZS de forma segura', () => {
  assert.deepEqual(parseLatestCzsNews({ items: [
    { title: 'Notícia antiga', publishedAt: '2026-08-20T12:00:00Z' },
    { title: '  Nova ponte avança no Juruá  ', publishedAt: '2026-08-25T12:00:00Z', slug: 'nova-ponte' },
  ] }), {
    title: 'Nova ponte avança no Juruá',
    url: 'https://catalogo-cruzeiro-web.onrender.com/',
  });
  assert.equal(parseLatestCzsNews({ items: [] }), null);
});
