import { naturalSummary, renderTargetSelect, scheduleBody } from './schedules.js';

const escapeHtml = (value) => String(value ?? '').replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));

export function renderCampaignProgramming(root, { devices, campaigns, apiClient, heading = 'Nova campanha', area = 'campaigns' }) {
  root.innerHTML = `<section class="campaign-programming" data-area="${escapeHtml(area)}">
    <header class="campaign-heading"><div><p class="eyebrow">Conteúdo e exibição</p><h1>${escapeHtml(heading)}</h1></div><p>${campaigns.length} ${campaigns.length === 1 ? 'campanha cadastrada' : 'campanhas cadastradas'}</p></header>
    <form class="campaign-form">
      <fieldset><legend>1. Anúncio</legend>
        <label>Nome da campanha<input name="campaignName" maxlength="160" required placeholder="Ex.: Oferta de agosto"></label>
        <label>Mídia<input name="media" type="file" accept="video/mp4,image/jpeg,image/png,image/webp" required></label>
        <p class="media-preview" data-media-preview>Nenhuma mídia selecionada.</p>
        <label>Estado<select name="status"><option value="approved">Aprovada</option></select></label>
      </fieldset>
      <fieldset><legend>2. Onde e quando</legend>
        <label>Destino<select name="targetType"><option value="device">Uma TV</option><option value="group">Um grupo</option><option value="all">Todas as TVs</option></select></label>
        <label data-target-id-field>Selecionar<select name="targetId" required></select></label>
        <div class="date-fields"><label>Início<input name="startsAt" type="datetime-local" required></label><label>Fim<input name="endsAt" type="datetime-local" required></label></div>
        <label>Prioridade<select name="priority"><option value="10">Normal 10</option><option value="50">Alta 50</option><option value="100">Urgente 100</option></select></label>
      </fieldset>
      <aside class="schedule-confirmation" data-confirmation aria-labelledby="confirmation-title" hidden><p class="eyebrow">Confirmação</p><h2 id="confirmation-title">Revise antes de publicar</h2><p data-schedule-summary></p></aside>
      <div class="form-actions"><button type="button" data-cancel>Cancelar</button><button type="submit" class="primary" data-publish>Publicar programação</button></div>
      <p class="publish-status" role="status" aria-live="polite"></p>
    </form>
  </section>`;

  const form = root.querySelector('form');
  const status = root.querySelector('[role="status"]');
  const publish = root.querySelector('[data-publish]');
  const confirmation = root.querySelector('[data-confirmation]');
  let confirming = false;
  let submitting = false;
  let campaignId = null;

  const update = () => { root.querySelector('[data-schedule-summary]').textContent = naturalSummary(form, devices); };
  const closeConfirmation = () => { confirming = false; confirmation.hidden = true; publish.textContent = 'Publicar programação'; };
  const setSubmitting = (value) => {
    submitting = value;
    for (const control of form.querySelectorAll('input, select, button')) control.disabled = value;
    if (!value && campaignId) {
      form.elements.campaignName.disabled = true;
      form.elements.media.disabled = true;
      form.elements.status.disabled = true;
    }
  };
  const reset = () => {
    campaignId = null;
    setSubmitting(false);
    form.reset();
    renderTargetSelect(form, 'device', devices);
    root.querySelector('[data-media-preview]').textContent = 'Nenhuma mídia selecionada.';
    status.textContent = '';
    closeConfirmation();
    update();
  };

  renderTargetSelect(form, 'device', devices);
  update();
  form.elements.targetType.addEventListener('change', () => { renderTargetSelect(form, form.elements.targetType.value, devices); closeConfirmation(); update(); });
  form.addEventListener('input', () => { closeConfirmation(); update(); });
  form.elements.priority.addEventListener('change', () => { closeConfirmation(); update(); });
  form.elements.media.addEventListener('change', () => {
    const file = form.elements.media.files?.[0];
    root.querySelector('[data-media-preview]').textContent = file ? `${file.name} · ${file.type || 'arquivo de mídia'}` : 'Nenhuma mídia selecionada.';
    closeConfirmation();
    update();
  });
  root.querySelector('[data-cancel]').addEventListener('click', reset);

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (submitting) return;
    const file = form.elements.media.files?.[0];
    const startsAt = new Date(form.elements.startsAt.value);
    const endsAt = new Date(form.elements.endsAt.value);
    if (!file || !form.elements.campaignName.value.trim() || !Number.isFinite(startsAt.getTime()) || !Number.isFinite(endsAt.getTime()) || endsAt <= startsAt || (form.elements.targetType.value !== 'all' && !form.elements.targetId.value)) {
      status.textContent = endsAt <= startsAt ? 'O fim precisa ser depois do início.' : 'Preencha todos os campos antes de publicar.';
      return;
    }
    if (!confirming) {
      confirming = true;
      confirmation.hidden = false;
      publish.textContent = 'Confirmar e publicar';
      status.textContent = 'Confira o resumo e confirme a publicação.';
      publish.focus();
      return;
    }

    setSubmitting(true);
    status.textContent = 'Publicando programação…';
    try {
      if (!campaignId) {
        const upload = new FormData();
        upload.append('name', form.elements.campaignName.value.trim());
        upload.append('status', form.elements.status.value);
        upload.append('media', file, file.name);
        const campaign = await apiClient('/admin/campaigns', { method: 'POST', body: upload });
        campaignId = campaign.id;
      }
      const result = await apiClient('/admin/schedules', { method: 'POST', body: scheduleBody(form, campaignId) });
      const count = Number(result.affectedDevices) || 0;
      status.textContent = `Programação publicada para ${count} ${count === 1 ? 'TV' : 'TVs'}.`;
      campaignId = null;
      closeConfirmation();
    } catch {
      status.textContent = campaignId
        ? 'A campanha foi salva, mas a programação falhou. Você pode ajustar destino, período ou prioridade e tentar novamente.'
        : 'Não foi possível publicar. Revise os dados e tente novamente.';
    } finally {
      setSubmitting(false);
    }
  });
}
