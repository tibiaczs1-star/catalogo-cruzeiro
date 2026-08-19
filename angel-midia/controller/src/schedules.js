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

export function scheduleBody(form, campaignId) {
  const targetType = form.elements.targetType.value;
  return {
    campaignId,
    target: { type: targetType, id: targetType === 'all' ? null : form.elements.targetId.value },
    startsAt: new Date(form.elements.startsAt.value).toISOString(),
    endsAt: new Date(form.elements.endsAt.value).toISOString(),
    priority: Number(form.elements.priority.value),
  };
}

export function naturalSummary(form, devices) {
  const type = form.elements.targetType.value;
  const target = targetLabel(type, form.elements.targetId.value, devices);
  const priorityValue = form.elements.priority.value;
  const priority = `${PRIORITIES[priorityValue] || 'Normal'} ${priorityValue || 10}`;
  const campaign = form.elements.campaignName.value.trim() || 'campanha sem nome';
  const media = form.elements.media.files?.[0]?.name || 'mídia não selecionada';
  const start = form.elements.startsAt.value ? new Date(form.elements.startsAt.value).toLocaleString('pt-BR') : 'início não definido';
  const end = form.elements.endsAt.value ? new Date(form.elements.endsAt.value).toLocaleString('pt-BR') : 'fim não definido';
  return `Exibir “${campaign}” (${media}) em ${target}, de ${start} até ${end}, prioridade ${priority}.`;
}
