// @vitest-environment jsdom
import { beforeEach, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { renderNetwork } from '../src/network.js';

const ORG_ID = '11111111-1111-4111-8111-111111111111';
const TV_ID = '33333333-3333-4333-8333-333333333333';

function responseFor(path) {
  if (path === '/admin/organizations') return { organizations: [{ id: ORG_ID, name: 'Rede Angel', kind: 'matrix', status: 'active', memberCount: 4, deviceCount: 3, locationCount: 3 }] };
  if (path.endsWith('/resources')) return { locations: [{ id: 'loc-1', label: 'Mercado Juruá', venueType: 'supermercado' }], devices: [{ id: 'tv-1', name: 'TV Mercado Juruá', status: 'online', venueType: 'supermercado' }] };
  if (path.endsWith('/members')) return { members: [{ adminId: '22222222-2222-4222-8222-222222222222', name: 'Ana Souza', email: 'ana@angel.test', role: 'manager', status: 'active' }] };
  if (path.endsWith('/crm/contacts')) return { contacts: [{ id: 'contact-1', name: 'Carlos Lima', company: 'Mercado Juruá', status: 'qualified' }] };
  if (path.endsWith('/crm/opportunities')) return { opportunities: [{ id: 'opp-1', title: 'Rede Mercado Juruá', valueCents: 240000, stage: 'proposal', probability: 70 }] };
  if (path.endsWith('/crm/tasks')) return { tasks: [{ id: 'task-1', title: 'Apresentar plano de mídia', status: 'open', dueAt: '2026-08-27T12:00:00.000Z', assigneeName: 'Ana Souza' }] };
  return {};
}

beforeEach(() => { document.body.innerHTML = '<main id="root"></main>'; });

it('mostra hierarquia, equipe, pipeline CRM e pontos da rede sem aparência de protótipo', async () => {
  const api = vi.fn(async (path) => responseFor(path));
  await renderNetwork(document.querySelector('#root'), api);
  expect(document.querySelector('[data-view="network"]')).not.toBeNull();
  expect(document.querySelector('[data-network-tree]')).not.toBeNull();
  expect(document.querySelector('[data-crm-board]')).not.toBeNull();
  expect(document.querySelector('[data-network-team]')).not.toBeNull();
  expect(document.querySelector('[data-network-locations]')).not.toBeNull();
  expect(document.body.textContent).toContain('Rede Mercado Juruá');
  expect(document.body.textContent).toContain('Ana Souza');
  expect(document.body.textContent).toContain('Mercado Juruá');
  expect(document.body.textContent).toContain('R$ 2.400,00');
});

it('cadastra afiliada dentro da organização selecionada e atualiza a rede', async () => {
  const api = vi.fn(async (path, options) => options?.method === 'POST' ? { id: 'new-org' } : responseFor(path));
  const refresh = vi.fn();
  await renderNetwork(document.querySelector('#root'), api, refresh);
  document.querySelector('[data-network-add-company]').click();
  const form = document.querySelector('[data-network-org-form]');
  form.querySelector('[name="name"]').value = 'Afiliada Tarauacá';
  form.querySelector('[name="kind"]').value = 'affiliate';
  form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  await vi.waitFor(() => expect(api).toHaveBeenCalledWith('/admin/network/organizations', expect.objectContaining({ method: 'POST', body: { name: 'Afiliada Tarauacá', kind: 'affiliate', organizationId: ORG_ID } })));
  await vi.waitFor(() => expect(refresh).toHaveBeenCalled());
});

it('permite gerenciar funções reais da equipe da organização', async () => {
  const api = vi.fn(async (path, options) => options?.method === 'PUT' ? { member: options.body } : responseFor(path));
  await renderNetwork(document.querySelector('#root'), api);
  document.querySelector('[data-network-team-manage]').click();
  const drawer = document.querySelector('[data-network-team-drawer]');
  expect(drawer.hidden).toBe(false);
  const role = drawer.querySelector('[data-member-role]');
  role.value = 'sales';
  drawer.querySelector('[data-network-team-form]').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  await vi.waitFor(() => expect(api).toHaveBeenCalledWith(`/admin/organizations/${ORG_ID}/members`, expect.objectContaining({
    method: 'PUT', body: { adminId: '22222222-2222-4222-8222-222222222222', role: 'sales' },
  })));
});

it('registra oportunidade comercial no CRM da organização ativa', async () => {
  const api = vi.fn(async (path, options) => options?.method === 'POST' ? { id: 'new-opp' } : responseFor(path));
  await renderNetwork(document.querySelector('#root'), api);
  document.querySelector('[data-crm-add]').click();
  const form = document.querySelector('[data-crm-form]');
  form.querySelector('[name="title"]').value = 'Campanha Supermercado';
  form.querySelector('[name="value"]').value = '1250';
  form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  await vi.waitFor(() => expect(api).toHaveBeenCalledWith('/admin/network/opportunities', expect.objectContaining({ method: 'POST', body: expect.objectContaining({ organizationId: ORG_ID, title: 'Campanha Supermercado', valueCents: 125000, stage: 'lead' }) })));
});

it('explica o tipo de empresa e vincula uma TV disponível à empresa da rede', async () => {
  const api = vi.fn(async (path, options) => options?.method === 'PUT' ? { device: options.body } : responseFor(path));
  await renderNetwork(document.querySelector('#root'), api, undefined, ORG_ID, {
    allDevices: [{ id: TV_ID, name: 'TV Livre', status: 'active', organizationId: null, locationId: null }],
  });
  expect(document.body.textContent).toContain('Empresa da rede');
  expect(document.body.textContent).toContain('Empresa em Empresas');
  const form = document.querySelector('[data-network-device-link]');
  expect(form).not.toBeNull();
  form.elements.deviceId.value = TV_ID;
  form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  await vi.waitFor(() => expect(api).toHaveBeenCalledWith(`/admin/organizations/${ORG_ID}/devices/${TV_ID}`, {
    method: 'PUT', body: { locationId: null },
  }));
});

it('mantém o módulo com cores sólidas e responsivo', () => {
  const css = readFileSync(`${process.cwd()}/src/network.css`, 'utf8');
  expect(css).not.toMatch(/(?:linear|radial|conic)-gradient/i);
  expect(css).toContain('.network-crm-board');
  expect(css).toContain('@media(max-width:');
});
