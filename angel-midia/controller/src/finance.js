const esc = (value) => String(value ?? '').replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
const money = (cents = 0) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(cents || 0) / 100);
const assetId = (company, kind) => company?.[`${kind}_asset_id`] || company?.[`${kind}AssetId`];

async function uploadCompanyImage(apiClient, file, label) {
  if (!file) return null;
  const body = new FormData();
  body.append('media', file);
  body.append('name', label);
  body.append('durationSeconds', '10');
  return apiClient('/admin/media', { method: 'POST', body });
}

export function renderFinance(root, payload, media, apiClient, refresh) {
  const rows = payload?.advertisers ?? [];
  const companies = payload?.companies ?? [];
  const totals = payload?.totals ?? { amountCents: payload?.totalAmountCents || 0, displays: payload?.totalDisplays || 0 };
  const companyOptions = companies.map((company) => `<option value="${esc(company.id)}">${esc(company.name)}</option>`).join('');
  const companyCards = companies.map((company) => {
    const photo = assetId(company, 'photo'); const logo = assetId(company, 'logo');
    return `<article class="company-profile-card"><div class="company-cover">${photo ? `<img src="./api/admin/media/${esc(photo)}/content" alt="Fachada de ${esc(company.name)}">` : '<span>Foto da empresa</span>'}</div><div class="company-profile-body">${logo ? `<img class="company-logo" src="./api/admin/media/${esc(logo)}/content" alt="Logo de ${esc(company.name)}">` : `<span class="company-logo company-logo-placeholder">${esc(company.name?.slice(0, 2).toUpperCase() || 'AM')}</span>`}<div><b>${esc(company.name)}</b><small>${esc(company.contact_name || company.contactName || 'Contato não informado')}</small></div></div></article>`;
  }).join('');

  root.innerHTML = `<section class="finance-page"><header class="page-head"><div><p class="eyebrow">Relacionamento comercial</p><h1>Empresas & resultados</h1><p>Cadastre o cliente com fachada e logo, associe suas mídias e acompanhe as exibições.</p></div><div class="finance-totals"><span><small>Receita cadastrada</small><b>${money(totals.amountCents)}</b></span><span><small>Exibições</small><b>${Number(totals.displays || 0).toLocaleString('pt-BR')}</b></span></div></header>
    <section class="workflow-note" data-company-kind-note><div><b>Empresa nesta tela = anunciante</b><p>Use aqui para cadastrar identidade, vincular mídias, mensalidades e acompanhar resultados.</p></div><button type="button" class="ghost" data-go-network>Gerenciar acesso ou vincular TVs em Rede & CRM</button></section>
    <section class="company-admin-grid"><form class="surface-card company-editor" data-company><header><p class="eyebrow">Novo cliente</p><h2>Cadastrar empresa</h2></header><div class="company-image-fields"><label class="company-image-picker"><span class="company-photo-preview" data-company-photo-preview>Fachada</span><b>Foto da empresa</b><small>JPG ou PNG horizontal</small><input class="company-photo-input" name="photo" type="file" accept="image/*"></label><label class="company-image-picker is-logo"><span class="company-logo-preview" data-company-logo-preview>Logo</span><b>Logo da empresa</b><small>PNG quadrado recomendado</small><input class="company-photo-input" name="logo" type="file" accept="image/*"></label></div><div class="form-grid"><label class="full">Nome da empresa<input name="name" required placeholder="Ex.: Mercado Juruá"></label><label>Responsável<input name="contactName" placeholder="Nome do contato"></label><label>Telefone<input name="phone" inputmode="tel" placeholder="(68) 99999-9999"></label><label>E-mail<input name="email" type="email" placeholder="contato@empresa.com"></label><label>Observações<input name="notes" placeholder="Informações comerciais"></label></div><button class="primary">Salvar empresa com fotos</button><p role="status" aria-live="polite"></p></form>
    <aside class="surface-card company-directory"><header><div><p class="eyebrow">Clientes cadastrados</p><h2>Identidade visual</h2></div><span>${companies.length}</span></header><div class="company-profile-grid">${companyCards || '<div class="empty-company-gallery"><b>Nenhuma empresa cadastrada</b><p>Use o formulário ao lado para adicionar foto e logo do primeiro cliente.</p></div>'}</div></aside></section>
    <section class="finance-layout"><form class="surface-card editor" data-month><h2>Registrar mensalidade</h2><label>Empresa<select name="advertiserId" required><option value="">Selecione</option>${companyOptions}</select></label><label>Competência<input name="competence" type="month" value="${payload?.competence || new Date().toISOString().slice(0, 7)}" required></label><label>Valor recebido (R$)<input name="monthlyAmount" type="number" min="0" step="0.01" required></label><label>Situação<select name="status"><option value="paid">Pago</option><option value="pending">Pendente</option><option value="late">Atrasado</option><option value="courtesy">Cortesia</option></select></label><label>Observações<input name="notes"></label><button class="primary">Salvar mensalidade</button><p role="status"></p></form>
    <form class="surface-card editor" data-media-links><h2>Vincular mídias à empresa</h2><label>Empresa<select name="advertiserId" required><option value="">Selecione</option>${companyOptions}</select></label><div class="media-checklist">${media.map((item) => `<label><input type="checkbox" name="assetIds" value="${item.id}"> ${esc(item.display_name || item.original_name)} <small>${esc(item.content_type)}</small></label>`).join('') || '<p>Suba mídias na Biblioteca para vinculá-las.</p>'}</div><button class="primary">Salvar vínculos</button><p role="status"></p></form></section>
    <section class="surface-card report" data-chart="displays"><table><thead><tr><th>Empresa</th><th>Mensalidade</th><th>Status</th><th>Exibições</th><th>TVs</th><th>Custo por exibição</th></tr></thead><tbody>${rows.map((row) => `<tr><td>${esc(row.advertiser_name || row.name)}</td><td>${money(row.monthlyAmountCents ?? row.monthly_amount_cents)}</td><td>${esc(row.payment_status || 'pendente')}</td><td>${row.displays || 0}</td><td>${row.tvs || 0}</td><td>${row.costPerDisplayCents == null && row.cost_per_display_cents == null ? '—' : money(row.costPerDisplayCents ?? row.cost_per_display_cents)}</td></tr>`).join('') || '<tr><td colspan="6">Cadastre uma empresa para começar.</td></tr>'}</tbody></table></section></section>`;

  const previewFile = (input, preview) => input.addEventListener('change', () => {
    const file = input.files?.[0]; if (!file || !globalThis.URL?.createObjectURL) return;
    preview.style.backgroundImage = `url(${globalThis.URL.createObjectURL(file)})`; preview.textContent = '';
  });
  previewFile(root.querySelector('[name="photo"]'), root.querySelector('[data-company-photo-preview]'));
  previewFile(root.querySelector('[name="logo"]'), root.querySelector('[data-company-logo-preview]'));
  root.querySelector('[data-go-network]')?.addEventListener('click', () => root.dispatchEvent(new CustomEvent('angel:navigate', { bubbles: true, detail: { view: 'network' } })));

  root.querySelector('[data-company]').addEventListener('submit', async (event) => {
    event.preventDefault(); const form = event.currentTarget; const status = form.querySelector('[role=status]'); const button = form.querySelector('button.primary');
    button.disabled = true; status.textContent = 'Enviando fotos e salvando empresa…';
    try {
      const photo = form.querySelector('[name="photo"]').files?.[0]; const logo = form.querySelector('[name="logo"]').files?.[0];
      const field = (name) => form.querySelector(`[name="${name}"]`).value.trim();
      const name = field('name');
      const photoUpload = await uploadCompanyImage(apiClient, photo, `${name} — fachada`);
      const logoUpload = await uploadCompanyImage(apiClient, logo, `${name} — logo`);
      await apiClient('/admin/advertisers', { method: 'POST', body: { name, contactName: field('contactName'), phone: field('phone'), email: field('email'), notes: field('notes'), photoAssetId: photoUpload?.id || null, logoAssetId: logoUpload?.id || null } });
      status.textContent = 'Empresa cadastrada com identidade visual.'; await refresh();
    } catch (error) { status.textContent = `Falha: ${error.message}`; }
    finally { button.disabled = false; }
  });
  root.querySelector('[data-month]').addEventListener('submit', async (event) => { event.preventDefault(); const form = event.currentTarget; const status = form.querySelector('[role=status]'); const value = Object.fromEntries(new FormData(form)); const id = value.advertiserId; delete value.advertiserId; try { await apiClient(`/admin/advertisers/${id}/months`, { method: 'POST', body: value }); status.textContent = 'Mensalidade registrada.'; await refresh(); } catch (error) { status.textContent = `Falha: ${error.message}`; } });
  root.querySelector('[data-media-links]').addEventListener('submit', async (event) => { event.preventDefault(); const form = event.currentTarget; const status = form.querySelector('[role=status]'); const body = new FormData(form); const id = body.get('advertiserId'); const assetIds = body.getAll('assetIds'); try { await apiClient(`/admin/advertisers/${id}/media`, { method: 'PUT', body: { assetIds } }); status.textContent = 'Mídias vinculadas.'; await refresh(); } catch (error) { status.textContent = `Falha: ${error.message}`; } });
}
