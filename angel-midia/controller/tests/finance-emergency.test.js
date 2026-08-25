// @vitest-environment jsdom
import { expect, it, vi } from 'vitest';
import { renderFinance } from '../src/finance.js';
import { renderEmergency } from '../src/emergency.js';

it('renders company finance, display metrics and charts', () => {
  const root=document.createElement('div');
  renderFinance(root,{advertisers:[{id:'a',name:'Loja A',monthly_amount_cents:10000,displays:25,cost_per_display_cents:400}],totals:{amountCents:10000,displays:25}},[],vi.fn(),vi.fn());
  expect(root.textContent).toContain('Empresas & resultados');
  expect(root.textContent).toContain('Custo por exibição');
  expect(root.querySelector('[data-chart=displays]')).not.toBeNull();
});

it('renders Alerta Geral with activate and stop controls', () => {
  const root=document.createElement('div');
  renderEmergency(root,{active:false},[],vi.fn(),vi.fn());
  expect(root.textContent).toContain('Alerta Geral da Rede');
  expect(root.querySelector('[data-emergency-activate]')).not.toBeNull();
});
