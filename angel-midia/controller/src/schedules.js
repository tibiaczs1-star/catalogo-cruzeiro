const escapeHtml = (value) => String(value ?? '').replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));

export const PRIORITIES = { 10: 'Normal', 50: 'Alta', 100: 'Urgente' };

export function availableGroups(devices) {
  return [...new Set(devices.map((device) => device.groupId).filter(Boolean))];
}

export function targetOptions(type, devices) {
  if (type === 'device') return devices.filter((device) => device.status === 'active').map((device) => ({ id: device.id, label: device.name || device.id }));
  if (type === 'group') return availableGroups(devices).map((id, index) => ({ id, label: `Grupo ${index + 1}` }));
  return [];
}

export function targetLabel(type, id, devices) {
  if (type === 'all') return 'todas as TVs';
  if (type === 'group') return 'o grupo selecionado';
  return devices.find((device) => device.id === id)?.name || 'a TV selecionada';
}

export function renderTargetSelect(root, type, devices) {
  const field = root.querySelector('[data-target-id-field]');
  const select = root.querySelector('[name="targetId"]');
  const options = targetOptions(type, devices);
  field.hidden = type === 'all';
  select.required = type !== 'all';
  select.innerHTML = options.map((item) => `<option value="${escapeHtml(item.id)}">${escapeHtml(item.label)}</option>`).join('');
}

export function syncScheduleMode(form) {
  const scheduled = form.elements.mode?.value === 'scheduled';
  const window = form.querySelector('[data-schedule-window]');
  if (window) window.hidden = !scheduled;
  for (const name of ['startsAt', 'endsAt']) {
    if (form.elements[name]) form.elements[name].required = scheduled;
  }
  return scheduled;
}

export function parseScheduleWindow(form) {
  const mode = form.elements.mode?.value || 'continuous';
  if (mode !== 'scheduled') return { valid: true, fields: { mode } };
  const startValue = form.elements.startsAt?.value;
  const endValue = form.elements.endsAt?.value;
  if (!startValue || !endValue) return { valid: false, error: 'Informe o início e o fim da programação.' };
  const start = new Date(startValue);
  const end = new Date(endValue);
  if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime())) return { valid: false, error: 'Informe datas e horários válidos.' };
  if (end <= start) return { valid: false, error: 'O fim precisa ser depois do início.' };
  return { valid: true, fields: { mode, startsAt: start.toISOString(), endsAt: end.toISOString() } };
}

export function scheduleBody(form, campaignId) {
  const targetType = form.elements.targetType.value;
  const window = parseScheduleWindow(form);
  if (!window.valid) throw new Error(window.error);
  const body = {
    campaignId,
    target: { type: targetType, id: targetType === 'all' ? null : form.elements.targetId.value },
    priority: Number(form.elements.priority.value),
    ...window.fields,
  };
  return body;
}

export function naturalSummary(form, devices) {
  const type = form.elements.targetType.value;
  const target = targetLabel(type, form.elements.targetId.value, devices);
  const priorityValue = form.elements.priority.value;
  const priority = `${PRIORITIES[priorityValue] || 'Normal'} ${priorityValue || 10}`;
  const campaign = form.elements.campaignName.value.trim() || 'campanha sem nome';
  const media = form.elements.media.files?.[0]?.name || 'mídia não selecionada';
  if (form.elements.mode.value === 'continuous') {
    const ignoredDates = form.elements.startsAt.value && form.elements.endsAt.value
      ? ` As datas preenchidas (${new Date(form.elements.startsAt.value).toLocaleString('pt-BR')} até ${new Date(form.elements.endsAt.value).toLocaleString('pt-BR')}) não serão usadas neste modo.`
      : '';
    return `Exibir “${campaign}” (${media}) em ${target}, em loop contínuo sem data final, prioridade ${priority}.${ignoredDates}`;
  }
  const start = form.elements.startsAt.value ? new Date(form.elements.startsAt.value).toLocaleString('pt-BR') : 'início não definido';
  const end = form.elements.endsAt.value ? new Date(form.elements.endsAt.value).toLocaleString('pt-BR') : 'fim não definido';
  return `Exibir “${campaign}” (${media}) em ${target}, de ${start} até ${end}, prioridade ${priority}.`;
}
