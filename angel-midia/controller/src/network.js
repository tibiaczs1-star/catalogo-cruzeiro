import { angelIcon } from './angel-icons.js';

const esc = (value) => String(value ?? '').replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
const list = (value, key) => Array.isArray(value) ? value : Array.isArray(value?.[key]) ? value[key] : [];
const field = (item, camel, snake = camel) => item?.[camel] ?? item?.[snake];
const money = (cents = 0) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(cents || 0) / 100);
const compact = (value) => new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 }).format(Number(value || 0));
const dateLabel = (value) => value ? new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' }).format(new Date(value)) : 'Sem prazo';

const KIND = Object.freeze({
  matrix: { label: 'Matriz', tone: 'blue' },
  affiliate: { label: 'Afiliada', tone: 'violet' },
  branch: { label: 'Filial', tone: 'cyan' },
  client: { label: 'Cliente', tone: 'green' },
});
const ROLE = Object.freeze({ owner: 'Proprietário', admin: 'Administrador', manager: 'Gestor', operator: 'Operação', sales: 'Comercial', viewer: 'Consulta' });
const STAGES = Object.freeze([
  ['lead', 'Novos', 'blue'],
  ['qualified', 'Qualificados', 'cyan'],
  ['proposal', 'Propostas', 'violet'],
  ['won', 'Fechados', 'green'],
]);
const VENUES = Object.freeze({ supermercado: 'Supermercado', varejo: 'Varejo', saude: 'Saúde', alimentacao: 'Alimentação', hotel: 'Hotel', educacao: 'Educação', publico: 'Órgão público', escritorio: 'Escritório', outro: 'Outro local' });

async function safe(client, path, key) {
  try { return list(await client(path), key); } catch { return []; }
}

function hierarchyRows(organizations, selectedId) {
  const byParent = new Map();
  for (const org of organizations) {
    const parent = field(org, 'parentId', 'parent_id') || 'root';
    if (!byParent.has(parent)) byParent.set(parent, []);
    byParent.get(parent).push(org);
  }
  const seen = new Set();
  const walk = (parent, depth = 0) => (byParent.get(parent) || []).flatMap((org) => {
    if (seen.has(org.id)) return [];
    seen.add(org.id);
    const kind = KIND[org.kind] || KIND.client;
    return [`<button class="network-org-row is-${kind.tone}" data-network-org="${esc(org.id)}" aria-current="${org.id === selectedId ? 'true' : 'false'}" style="--tree-depth:${depth}"><span class="network-org-icon">${angelIcon(org.kind === 'client' ? 'company' : 'dashboard')}</span><span><b>${esc(org.name)}</b><small>${kind.label} · ${Number(field(org, 'deviceCount', 'device_count') || 0)} TVs</small></span><i>${field(org, 'status') === 'inactive' ? 'Pausada' : 'Ativa'}</i></button>`, ...walk(org.id, depth + 1)];
  });
  const rows = walk('root');
  for (const org of organizations) {
    if (seen.has(org.id)) continue;
    const kind = KIND[org.kind] || KIND.client;
    seen.add(org.id);
    rows.push(`<button class="network-org-row is-${kind.tone}" data-network-org="${esc(org.id)}" aria-current="${org.id === selectedId ? 'true' : 'false'}" style="--tree-depth:0"><span class="network-org-icon">${angelIcon(org.kind === 'client' ? 'company' : 'dashboard')}</span><span><b>${esc(org.name)}</b><small>${kind.label} · ${Number(field(org, 'deviceCount', 'device_count') || 0)} TVs</small></span><i>${field(org, 'status') === 'inactive' ? 'Pausada' : 'Ativa'}</i></button>`);
    rows.push(...walk(org.id, 1));
  }
  return rows.join('');
}

function opportunityCard(item) {
  const stageProbability = { lead: 20, qualified: 50, proposal: 75, won: 100, lost: 0 };
  const probability = Math.min(100, Math.max(0, Number(item.probability ?? stageProbability[item.stage] ?? 0)));
  return `<article class="crm-opportunity" data-opportunity="${esc(item.id)}"><div><span>${esc(item.company || 'Oportunidade')}</span><b>${esc(item.title)}</b></div><strong>${money(field(item, 'valueCents', 'value_cents'))}</strong><footer><span>${probability}% de chance</span><span class="crm-probability"><i style="width:${probability}%"></i></span></footer></article>`;
}

function renderShell(root, payload) {
  const { organizations, selected, members, contacts, opportunities, tasks, locations, devices } = payload;
  const openTasks = tasks.filter((task) => !['done', 'completed', 'cancelled'].includes(task.status));
  const pipelineValue = opportunities.filter((item) => item.stage !== 'lost').reduce((sum, item) => sum + Number(field(item, 'valueCents', 'value_cents') || 0), 0);
  const online = devices.filter((device) => ['online', 'active'].includes(device.status)).length;
  const selectedKind = KIND[selected?.kind] || KIND.matrix;
  root.innerHTML = `<section class="network-page" data-view="network">
    <header class="page-head network-page-head"><div><p class="eyebrow">Rede, equipe e relacionamento</p><h1>Rede Angel</h1><p>Organize matriz, afiliadas, filiais, clientes e cada TV em uma única operação.</p></div><div class="network-head-actions"><button class="ghost" data-network-add-company>${angelIcon('company')} Nova empresa</button><button class="primary" data-crm-add ${selected ? '' : 'disabled'}>${angelIcon('chart')} Nova oportunidade</button></div></header>
    <section class="network-kpis" aria-label="Resumo da rede"><article class="is-blue">${angelIcon('company')}<span><small>Organizações</small><b>${compact(organizations.length)}</b></span></article><article class="is-cyan">${angelIcon('tv')}<span><small>TVs online</small><b>${online}/${devices.length}</b></span></article><article class="is-violet">${angelIcon('user')}<span><small>Equipe</small><b>${compact(members.length)}</b></span></article><article class="is-green">${angelIcon('chart')}<span><small>Pipeline</small><b>${money(pipelineValue)}</b></span></article><article class="is-amber">${angelIcon('clock')}<span><small>Próximas ações</small><b>${openTasks.length}</b></span></article></section>
    <section class="network-main-grid">
      <aside class="surface-card network-tree-card"><header><div><p class="eyebrow">Estrutura comercial</p><h2>Empresas da rede</h2></div><span>${organizations.length}</span></header><label class="network-search">${angelIcon('search')}<input type="search" data-network-search placeholder="Buscar empresa ou unidade" aria-label="Buscar empresa ou unidade"></label><div class="network-tree" data-network-tree>${hierarchyRows(organizations, selected?.id) || '<div class="network-empty"><b>Comece pela matriz</b><p>Cadastre a organização principal para distribuir sua tecnologia.</p></div>'}</div></aside>
      <section class="surface-card network-profile"><header><span class="network-profile-icon is-${selectedKind.tone}">${angelIcon('company')}</span><div><small>${selectedKind.label}</small><h2>${esc(selected?.name || 'Nenhuma organização')}</h2><p>${esc(selected?.city || selected?.email || 'Operação Angel Mídia')}</p></div></header><div class="network-profile-stats"><span><b>${locations.length}</b><small>Locais</small></span><span><b>${devices.length}</b><small>TVs</small></span><span><b>${contacts.length}</b><small>Contatos</small></span><span><b>${members.length}</b><small>Membros</small></span></div><div class="network-capabilities"><span>✓ Gestão compartilhada</span><span>✓ Permissões por função</span><span>✓ Conteúdo por local</span><span>✓ Receita por empresa</span></div></section>
    </section>
    <section class="surface-card crm-board-shell"><header><div><p class="eyebrow">CRM comercial</p><h2>Pipeline de oportunidades</h2></div><div class="crm-summary"><span>${opportunities.length} negócios</span><b>${money(pipelineValue)}</b></div></header><div class="network-crm-board" data-crm-board>${STAGES.map(([stage, label, tone]) => { const items = opportunities.filter((item) => item.stage === stage); const total = items.reduce((sum, item) => sum + Number(field(item, 'valueCents', 'value_cents') || 0), 0); return `<section class="crm-column is-${tone}" data-crm-stage="${stage}"><header><span>${label}</span><b>${items.length}</b></header><small>${money(total)}</small><div>${items.map(opportunityCard).join('') || '<p class="crm-column-empty">Nenhum negócio nesta etapa</p>'}</div></section>`; }).join('')}</div></section>
    <section class="network-bottom-grid">
      <section class="surface-card network-team" data-network-team><header><div><p class="eyebrow">Acesso e colaboração</p><h2>Equipe</h2></div><button class="ghost" data-network-team-manage ${members.length ? '' : 'disabled'}>${angelIcon('user')} Gerenciar</button></header><div class="network-team-list">${members.map((member) => `<article><span class="network-avatar">${esc((member.name || member.email || 'A').slice(0, 2).toUpperCase())}</span><div><b>${esc(member.name || 'Membro da equipe')}</b><small>${esc(member.email || 'Sem e-mail')}</small></div><span class="role-chip">${esc(ROLE[member.role] || member.role || 'Membro')}</span><i class="status-dot is-${member.status === 'inactive' ? 'off' : 'on'}"></i></article>`).join('') || '<div class="network-empty"><b>Nenhum membro nesta unidade</b><p>Os usuários autorizados aparecerão aqui.</p></div>'}</div></section>
      <section class="surface-card network-locations" data-network-locations><header><div><p class="eyebrow">Pontos de exibição</p><h2>Locais e TVs</h2></div><span>${devices.length}</span></header><div>${locations.map((location) => { const venue = field(location, 'venueType', 'venue_type') || 'outro'; const localDevices = devices.filter((device) => field(device, 'locationId', 'location_id') === location.id || (!field(device, 'locationId', 'location_id') && devices.length === 1)); const onlineCount = localDevices.filter((device) => ['online', 'active'].includes(device.status)).length; return `<article><span class="venue-icon">${angelIcon('pin')}</span><div><b>${esc(location.label || location.name)}</b><small>${esc(VENUES[venue] || VENUES.outro)} · ${onlineCount}/${localDevices.length} online</small></div><button class="ghost" data-open-map="${esc(location.id)}">Ver no mapa</button></article>`; }).join('') || '<div class="network-empty"><b>Nenhum ponto vinculado</b><p>Vincule supermercados, lojas e outras unidades às empresas da rede.</p></div>'}</div></section>
      <section class="surface-card network-tasks"><header><div><p class="eyebrow">Agenda da equipe</p><h2>Próximas ações</h2></div><span>${openTasks.length}</span></header><div>${openTasks.slice(0, 5).map((task) => `<article><time>${esc(dateLabel(field(task, 'dueAt', 'due_at')))}</time><div><b>${esc(task.title)}</b><small>${esc(field(task, 'assigneeName', 'assignee_name') || 'Equipe comercial')}</small></div><button class="task-check" data-task-done="${esc(task.id)}" aria-label="Concluir ${esc(task.title)}">✓</button></article>`).join('') || '<div class="network-empty"><b>Agenda em dia</b><p>As próximas ações comerciais aparecerão aqui.</p></div>'}</div></section>
    </section>
    <section class="network-drawer" data-network-org-drawer hidden><div class="network-drawer-panel"><header><div><p class="eyebrow">Expansão da rede</p><h2>Nova empresa ou unidade</h2></div><button class="ghost" type="button" data-close-drawer aria-label="Fechar">×</button></header><form data-network-org-form><label>Nome<input name="name" required placeholder="${organizations.length ? 'Ex.: Afiliada Tarauacá' : 'Ex.: Rede Angel'}"></label><label>Tipo<select name="kind">${organizations.length ? '<option value="affiliate">Afiliada</option><option value="branch">Filial</option><option value="client">Cliente</option>' : '<option value="matrix">Matriz</option>'}</select></label>${organizations.length ? `<label>Vincular a<select name="parentId" required>${organizations.map((org) => `<option value="${esc(org.id)}" ${org.id === selected?.id ? 'selected' : ''}>${esc(org.name)}</option>`).join('')}</select></label>` : ''}<p role="status" aria-live="polite"></p><button class="primary">Cadastrar na rede</button></form></div></section>
    <section class="network-drawer" data-crm-drawer hidden><div class="network-drawer-panel"><header><div><p class="eyebrow">Nova receita</p><h2>Criar oportunidade</h2></div><button class="ghost" type="button" data-close-drawer aria-label="Fechar">×</button></header><form data-crm-form><label>Negócio<input name="title" required placeholder="Ex.: Campanha Mercado Central"></label><label>Empresa ou contato<input name="company" placeholder="Nome do cliente"></label><label>Valor estimado (R$)<input name="value" type="number" min="0" step="0.01" required></label><label>Etapa<select name="stage">${STAGES.map(([stage, label]) => `<option value="${stage}">${label}</option>`).join('')}</select></label><label>Chance de fechamento<input name="probability" type="number" min="0" max="100" value="20"></label><p role="status" aria-live="polite"></p><button class="primary">Adicionar ao pipeline</button></form></div></section>
    <section class="network-drawer" data-network-team-drawer hidden><div class="network-drawer-panel"><header><div><p class="eyebrow">Permissões da rede</p><h2>Funções da equipe</h2></div><button class="ghost" type="button" data-close-drawer aria-label="Fechar">×</button></header><form data-network-team-form><div class="network-role-list">${members.map((member) => `<label><span><b>${esc(member.name || 'Membro da equipe')}</b><small>${esc(member.email || '')}</small></span><select data-member-role data-admin-id="${esc(field(member, 'adminId', 'admin_id'))}" aria-label="Função de ${esc(member.name || member.email || 'membro')}">${Object.entries(ROLE).map(([role, label]) => `<option value="${role}" ${role === member.role ? 'selected' : ''}>${label}</option>`).join('')}</select></label>`).join('')}</div><p role="status" aria-live="polite"></p><button class="primary">Salvar permissões</button></form></div></section>
  </section>`;
}

function bindDrawer(root, openSelector, drawerSelector) {
  const drawer = root.querySelector(drawerSelector);
  root.querySelector(openSelector)?.addEventListener('click', () => { drawer.hidden = false; drawer.querySelector('input,select')?.focus(); });
  drawer?.querySelector('[data-close-drawer]')?.addEventListener('click', () => { drawer.hidden = true; });
  drawer?.addEventListener('click', (event) => { if (event.target === drawer) drawer.hidden = true; });
}

export async function renderNetwork(root, apiClient, externalRefresh, selectedOrganizationId) {
  root.innerHTML = '<section class="network-loading" aria-live="polite"><span></span><b>Organizando a Rede Angel…</b></section>';
  const organizations = await safe(apiClient, '/admin/organizations', 'organizations');
  const selected = organizations.find((org) => org.id === selectedOrganizationId) || organizations[0] || null;
  let members = [], contacts = [], opportunities = [], tasks = [], locations = [], devices = [];
  if (selected) {
    const base = `/admin/organizations/${selected.id}`;
    const [resources, membersResult, contactsResult, opportunitiesResult, tasksResult] = await Promise.all([
      apiClient(`${base}/resources`).catch(() => ({})),
      safe(apiClient, `${base}/members`, 'members'),
      safe(apiClient, `${base}/crm/contacts`, 'contacts'),
      safe(apiClient, `${base}/crm/opportunities`, 'opportunities'),
      safe(apiClient, `${base}/crm/tasks`, 'tasks'),
    ]);
    locations = list(resources, 'locations'); devices = list(resources, 'devices');
    members = membersResult; contacts = contactsResult; opportunities = opportunitiesResult; tasks = tasksResult;
  }
  renderShell(root, { organizations, selected, members, contacts, opportunities, tasks, locations, devices });
  const refresh = async () => { await externalRefresh?.(selected?.id); return renderNetwork(root, apiClient, externalRefresh, selected?.id); };
  bindDrawer(root, '[data-network-add-company]', '[data-network-org-drawer]');
  bindDrawer(root, '[data-crm-add]', '[data-crm-drawer]');
  bindDrawer(root, '[data-network-team-manage]', '[data-network-team-drawer]');
  root.querySelectorAll('[data-network-org]').forEach((button) => button.addEventListener('click', () => renderNetwork(root, apiClient, externalRefresh, button.dataset.networkOrg)));
  root.querySelector('[data-network-search]')?.addEventListener('input', (event) => { const query = event.currentTarget.value.trim().toLocaleLowerCase('pt-BR'); root.querySelectorAll('[data-network-org]').forEach((button) => { button.hidden = Boolean(query) && !button.textContent.toLocaleLowerCase('pt-BR').includes(query); }); });
  root.querySelector('[data-network-org-form]')?.addEventListener('submit', async (event) => {
    event.preventDefault(); const form = event.currentTarget; const status = form.querySelector('[role=status]'); const submit = form.querySelector('button.primary'); const body = Object.fromEntries(new FormData(form));
    if (body.parentId) body.organizationId = body.parentId;
    delete body.parentId;
    submit.disabled = true; status.textContent = 'Cadastrando na rede…';
    try { await apiClient('/admin/network/organizations', { method: 'POST', body }); status.textContent = 'Empresa adicionada à rede.'; await refresh(); }
    catch (error) { status.textContent = `Não foi possível cadastrar: ${error.message}`; }
    finally { submit.disabled = false; }
  });
  root.querySelector('[data-crm-form]')?.addEventListener('submit', async (event) => {
    event.preventDefault(); const form = event.currentTarget; const status = form.querySelector('[role=status]'); const submit = form.querySelector('button.primary'); const data = Object.fromEntries(new FormData(form));
    const body = { title: data.title.trim(), company: data.company.trim() || null, valueCents: Math.round(Number(data.value || 0) * 100), stage: data.stage, probability: Number(data.probability || 0) };
    submit.disabled = true; status.textContent = 'Salvando oportunidade…';
    try { await apiClient('/admin/network/opportunities', { method: 'POST', body: { ...body, organizationId: selected.id } }); status.textContent = 'Oportunidade adicionada.'; await refresh(); }
    catch (error) { status.textContent = `Não foi possível salvar: ${error.message}`; }
    finally { submit.disabled = false; }
  });
  root.querySelectorAll('[data-open-map]').forEach((button) => button.addEventListener('click', () => root.dispatchEvent(new CustomEvent('angel:navigate', { bubbles: true, detail: { view: 'tvs', locationId: button.dataset.openMap } }))));
  root.querySelector('[data-network-team-form]')?.addEventListener('submit', async (event) => {
    event.preventDefault(); const form = event.currentTarget; const status = form.querySelector('[role=status]'); const submit = form.querySelector('button.primary');
    const changes = [...form.querySelectorAll('[data-member-role]')].filter((select) => select.dataset.adminId).map((select) => ({ adminId: select.dataset.adminId, role: select.value }));
    submit.disabled = true; status.textContent = 'Salvando permissões…';
    try { await Promise.all(changes.map((body) => apiClient(`/admin/organizations/${selected.id}/members`, { method: 'PUT', body }))); status.textContent = 'Permissões atualizadas.'; await refresh(); }
    catch (error) { status.textContent = `Não foi possível salvar: ${error.message}`; }
    finally { submit.disabled = false; }
  });
  root.querySelectorAll('[data-task-done]').forEach((button) => button.addEventListener('click', async () => { button.disabled = true; try { await apiClient(`/admin/organizations/${selected.id}/crm/tasks/${button.dataset.taskDone}`, { method: 'PATCH', body: { status: 'done' } }); await refresh(); } catch { button.disabled = false; } }));
}
