// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderCampaignProgramming } from '../src/campaigns.js';

const TV_ID = '11111111-1111-4111-8111-111111111111';
const GROUP_ID = '22222222-2222-4222-8222-222222222222';
const CAMPAIGN_ID = '33333333-3333-4333-8333-333333333333';
const devices = [
  { id: TV_ID, name: 'Mercado Centro', status: 'active', groupId: GROUP_ID },
  { id: '44444444-4444-4444-8444-444444444444', name: 'Recepção', status: 'active', groupId: null },
];

function fillForm(targetType, priority = '10') {
  const file = new File(['video'], 'oferta.mp4', { type: 'video/mp4' });
  Object.defineProperty(document.querySelector('[name="media"]'), 'files', { configurable: true, value: [file] });
  document.querySelector('[name="campaignName"]').value = 'Oferta de agosto';
  document.querySelector('[name="targetType"]').value = targetType;
  document.querySelector('[name="targetType"]').dispatchEvent(new Event('change', { bubbles: true }));
  if (targetType === 'device') document.querySelector('[name="targetId"]').value = TV_ID;
  if (targetType === 'group') document.querySelector('[name="targetId"]').value = GROUP_ID;
  document.querySelector('[name="startsAt"]').value = '2026-08-20T08:00';
  document.querySelector('[name="endsAt"]').value = '2026-08-21T18:00';
  document.querySelector('[name="priority"]').value = priority;
  document.querySelector('[name="priority"]').dispatchEvent(new Event('change', { bubbles: true }));
}

function apiRecorder(affectedDevices = 1) {
  return vi.fn(async (path, options = {}) => {
    if (path === '/admin/campaigns') return { id: CAMPAIGN_ID, name: 'Oferta de agosto', status: 'approved' };
    if (path === '/admin/schedules') return { id: 'schedule-1', affectedDevices };
    throw new Error(`unexpected ${path} ${options.method ?? 'GET'}`);
  });
}

function submit() {
  document.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
}

describe('campanhas e programação lean', () => {
  beforeEach(() => { document.body.innerHTML = '<main id="root"></main>'; });

  it.each([
    ['device', { type: 'device', id: TV_ID }, 'Mercado Centro'],
    ['group', { type: 'group', id: GROUP_ID }, 'grupo'],
    ['all', { type: 'all', id: null }, 'todas as TVs'],
  ])('publica para %s com uma única chamada de programação', async (targetType, expectedTarget, targetText) => {
    const apiClient = apiRecorder(targetType === 'all' ? 2 : 1);
    renderCampaignProgramming(document.querySelector('#root'), { devices, campaigns: [], apiClient });
    fillForm(targetType, targetType === 'all' ? '100' : '50');

    expect(document.querySelector('[data-schedule-summary]').textContent).toContain(targetText);
    submit();
    expect(apiClient).not.toHaveBeenCalled();
    expect(document.querySelector('[data-confirmation]').hidden).toBe(false);
    expect(document.querySelector('[data-publish]').textContent).toBe('Confirmar e publicar');
    submit();

    await vi.waitFor(() => expect(apiClient.mock.calls.filter(([path]) => path === '/admin/schedules')).toHaveLength(1));
    expect(apiClient).toHaveBeenCalledWith('/admin/schedules', {
      method: 'POST',
      body: expect.objectContaining({ campaignId: CAMPAIGN_ID, target: expectedTarget, priority: targetType === 'all' ? 100 : 50 }),
    });
    expect(document.querySelector('[role="status"]').textContent).toContain(targetType === 'all' ? '2 TVs' : '1 TV');
  });

  it('envia nome, aprovação e arquivo antes de programar', async () => {
    const apiClient = apiRecorder();
    renderCampaignProgramming(document.querySelector('#root'), { devices, campaigns: [], apiClient });
    fillForm('device');
    submit();
    expect(apiClient).not.toHaveBeenCalled();
    submit();

    await vi.waitFor(() => expect(apiClient).toHaveBeenCalledTimes(2));
    const [campaignPath, campaignOptions] = apiClient.mock.calls[0];
    expect(campaignPath).toBe('/admin/campaigns');
    expect(campaignOptions.method).toBe('POST');
    expect(campaignOptions.body).toBeInstanceOf(FormData);
    expect(campaignOptions.body.get('name')).toBe('Oferta de agosto');
    expect(campaignOptions.body.get('status')).toBe('approved');
    expect(campaignOptions.body.get('media').name).toBe('oferta.mp4');
    expect(apiClient.mock.calls[1][0]).toBe('/admin/schedules');
  });

  it('não chama a API ao cancelar', () => {
    const apiClient = apiRecorder();
    renderCampaignProgramming(document.querySelector('#root'), { devices, campaigns: [], apiClient });
    fillForm('device');
    submit();
    document.querySelector('[data-cancel]').click();
    expect(apiClient).not.toHaveBeenCalled();
    expect(document.querySelector('[name="campaignName"]').value).toBe('');
  });

  it('exige confirmação explícita e nunca publica ao apenas preencher', () => {
    const apiClient = apiRecorder();
    renderCampaignProgramming(document.querySelector('#root'), { devices, campaigns: [], apiClient });
    fillForm('all');
    expect(document.querySelector('[data-publish]').textContent).toBe('Publicar programação');
    expect(apiClient).not.toHaveBeenCalled();
  });

  it('expõe aprovação e os valores numéricos das prioridades', () => {
    renderCampaignProgramming(document.querySelector('#root'), { devices, campaigns: [], apiClient: apiRecorder() });
    expect(document.querySelector('[name="status"]')).not.toBeNull();
    expect(document.querySelector('[name="status"]').value).toBe('approved');
    expect([...document.querySelector('[name="priority"]').options].map(({ textContent }) => textContent)).toEqual([
      'Normal 10', 'Alta 50', 'Urgente 100',
    ]);
  });

  it('resume o que, onde, quando e a prioridade antes da confirmação', () => {
    renderCampaignProgramming(document.querySelector('#root'), { devices, campaigns: [], apiClient: apiRecorder() });
    fillForm('device', '50');
    document.querySelector('[name="media"]').dispatchEvent(new Event('change', { bubbles: true }));
    const summary = document.querySelector('[data-schedule-summary]').textContent;
    expect(summary).toContain('Oferta de agosto');
    expect(summary).toContain('oferta.mp4');
    expect(summary).toContain('Mercado Centro');
    expect(summary).toContain('20/08/2026');
    expect(summary).toContain('Alta 50');
  });

  it('bloqueia submits simultâneos e desabilita os controles durante o envio', async () => {
    let releaseCampaign;
    const pendingCampaign = new Promise((resolve) => { releaseCampaign = resolve; });
    const apiClient = vi.fn((path) => path === '/admin/campaigns'
      ? pendingCampaign
      : Promise.resolve({ id: 'schedule-1', affectedDevices: 1 }));
    renderCampaignProgramming(document.querySelector('#root'), { devices, campaigns: [], apiClient });
    fillForm('device');
    submit();
    expect(document.activeElement).toBe(document.querySelector('[data-publish]'));
    submit();
    submit();

    expect(apiClient.mock.calls.filter(([path]) => path === '/admin/campaigns')).toHaveLength(1);
    expect(document.querySelector('[data-publish]').disabled).toBe(true);
    expect(document.querySelector('[data-cancel]').disabled).toBe(true);
    expect(document.querySelector('[name="campaignName"]').disabled).toBe(true);

    releaseCampaign({ id: CAMPAIGN_ID });
    await vi.waitFor(() => expect(apiClient.mock.calls.filter(([path]) => path === '/admin/schedules')).toHaveLength(1));
  });

  it('reutiliza a campanha criada ao tentar novamente após falha da programação', async () => {
    let scheduleAttempts = 0;
    const apiClient = vi.fn(async (path) => {
      if (path === '/admin/campaigns') return { id: CAMPAIGN_ID };
      if (path === '/admin/schedules' && scheduleAttempts++ === 0) throw new Error('falha temporária');
      if (path === '/admin/schedules') return { id: 'schedule-1', affectedDevices: 1 };
      throw new Error(`unexpected ${path}`);
    });
    renderCampaignProgramming(document.querySelector('#root'), { devices, campaigns: [], apiClient });
    fillForm('device');
    submit();
    submit();
    await vi.waitFor(() => expect(document.querySelector('[role="status"]').textContent).toContain('programação falhou'));
    expect(document.querySelector('[name="campaignName"]').disabled).toBe(true);
    expect(document.querySelector('[name="media"]').disabled).toBe(true);
    expect(document.querySelector('[name="status"]').disabled).toBe(true);
    expect(document.querySelector('[name="targetType"]').disabled).toBe(false);
    expect(document.querySelector('[name="startsAt"]').disabled).toBe(false);
    expect(document.querySelector('[name="priority"]').disabled).toBe(false);
    expect(document.querySelector('[role="status"]').textContent).toContain('destino, período ou prioridade');
    submit();

    await vi.waitFor(() => expect(document.querySelector('[role="status"]').textContent).toContain('1 TV'));
    expect(apiClient.mock.calls.filter(([path]) => path === '/admin/campaigns')).toHaveLength(1);
    expect(apiClient.mock.calls.filter(([path]) => path === '/admin/schedules')).toHaveLength(2);
  });

  it('destrava a campanha ao cancelar depois de uma falha da programação', async () => {
    let failSchedule = true;
    const apiClient = vi.fn(async (path) => {
      if (path === '/admin/campaigns') return { id: CAMPAIGN_ID };
      if (path === '/admin/schedules' && failSchedule) {
        failSchedule = false;
        throw new Error('falha temporária');
      }
      if (path === '/admin/schedules') return { id: 'schedule-2', affectedDevices: 1 };
      throw new Error(`unexpected ${path}`);
    });
    renderCampaignProgramming(document.querySelector('#root'), { devices, campaigns: [], apiClient });
    fillForm('device');
    submit();
    submit();
    await vi.waitFor(() => expect(document.querySelector('[role="status"]').textContent).toContain('programação falhou'));
    expect(document.querySelector('[name="campaignName"]').disabled).toBe(true);

    document.querySelector('[data-cancel]').click();
    expect(document.querySelector('[name="campaignName"]').disabled).toBe(false);
    expect(document.querySelector('[name="media"]').disabled).toBe(false);
    expect(document.querySelector('[name="status"]').disabled).toBe(false);
    fillForm('device');
    submit();
    submit();

    await vi.waitFor(() => expect(document.querySelector('[role="status"]').textContent).toContain('1 TV'));
    expect(apiClient.mock.calls.filter(([path]) => path === '/admin/campaigns')).toHaveLength(2);
  });
});
