// @vitest-environment jsdom
import { beforeEach, expect, it } from 'vitest';
import {
  DEFAULT_HUD_PREFERENCES,
  applyHudPreferences,
  getHudPreferences,
  moveHudWidget,
  normalizeHudPreferences,
  saveHudPreferences,
} from '../src/personalization.js';

beforeEach(() => {
  localStorage.clear();
  delete document.documentElement.dataset.theme;
  delete document.documentElement.dataset.density;
  delete document.documentElement.dataset.motion;
});

it('começa em modo claro com movimento e ordem completa dos quadros', () => {
  expect(getHudPreferences(localStorage)).toEqual(DEFAULT_HUD_PREFERENCES);
});

it('normaliza preferências antigas sem perder novos quadros do HUD', () => {
  localStorage.setItem('angel-hud-preferences', JSON.stringify({ theme: 'dark', widgetOrder: ['map', 'summary', 'map', 'unknown'] }));
  expect(getHudPreferences(localStorage)).toEqual({
    theme: 'dark',
    density: 'comfortable',
    motion: 'full',
    widgetOrder: ['map', 'summary', 'inventory', 'companies', 'sync'],
    hiddenWidgets: [],
  });
});

it('mantém somente setores conhecidos na lista de quadros ocultos', () => {
  expect(normalizeHudPreferences({ hiddenWidgets: ['companies', 'unknown', 'companies'] }).hiddenWidgets).toEqual(['companies']);
});

it('move um quadro e persiste o novo layout', () => {
  const nextOrder = moveHudWidget(DEFAULT_HUD_PREFERENCES.widgetOrder, 'companies', 'map');
  expect(nextOrder).toEqual(['summary', 'companies', 'map', 'inventory', 'sync']);
  saveHudPreferences({ ...DEFAULT_HUD_PREFERENCES, widgetOrder: nextOrder }, localStorage);
  expect(JSON.parse(localStorage.getItem('angel-hud-preferences')).widgetOrder).toEqual(nextOrder);
});

it('aplica modo noturno, densidade e preferência de movimento no documento', () => {
  applyHudPreferences({ theme: 'dark', density: 'compact', motion: 'reduced', widgetOrder: [] }, document);
  expect(document.documentElement.dataset.theme).toBe('dark');
  expect(document.documentElement.dataset.density).toBe('compact');
  expect(document.documentElement.dataset.motion).toBe('reduced');
});
