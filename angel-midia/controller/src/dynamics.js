const money = (cents) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format((Number(cents) || 0) / 100).replace(/\u00a0/g, ' ');
const number = (value) => new Intl.NumberFormat('pt-BR').format(Number(value) || 0);
const CZS_URL = 'https://catalogo-cruzeiro-web.onrender.com/';
const CZS_FEED = 'https://catalogo-cruzeiro-web.onrender.com/api/news';
const CZS_QR = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&margin=8&data=${encodeURIComponent(CZS_URL)}`;
const escapeHtml = (value) => String(value ?? '').replace(/[&<>\"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '\"': '&quot;' })[character]);

const defaultPolicy = {
  enabled: false, intervalItems: 4, maxDynamicPercent: 20,
  allowDirectAds: true, allowProgrammaticAds: false, allowNews: true, allowMemes: true,
  transition: 'fade', effectIntensity: 'balanced', overlayEnabled: true,
  tickerEnabled: true, tickerMode: 'live-news', tickerText: 'Acompanhe o Catálogo CZS',
  tickerSpeed: 'normal', tickerPosition: 'bottom', newsSourceUrl: CZS_URL, newsFeedUrl: CZS_FEED,
  newsQrEnabled: true, scheduleDays: 'all', windowStart: '00:00', windowEnd: '23:59', priorityMode: 'balanced',
  directCpmCents: 2500, programmaticFloorCpmCents: 1200, estimatedDailyCycles: 120,
};

export function buildDynamicsViewModel(payload = {}) {
  const safePayload = payload ?? {};
  const policy = { ...defaultPolicy, ...(safePayload.policy ?? {}) };
  const inventory = { activeTvs: 0, directAds: 0, programmaticAds: 0, news: 0, memes: 0, proofOfPlay30d: 0, ...(safePayload.inventory ?? {}) };
  const candidates = [];
  if (policy.allowDirectAds && inventory.directAds > 0) candidates.push('direct');
  if (policy.allowNews && inventory.news > 0) candidates.push('news');
  if (policy.allowMemes && inventory.memes > 0) candidates.push('meme');
  if (policy.allowProgrammaticAds && inventory.programmaticAds > 0) candidates.push('programmatic');
  const baseCount = 12;
  const maxByFrequency = Math.floor(baseCount / policy.intervalItems);
  const maxByShare = Math.floor((baseCount * policy.maxDynamicPercent) / (100 - policy.maxDynamicPercent));
  const inserted = candidates.slice(0, Math.min(maxByFrequency, maxByShare));
  const cycleSlots = [];
  let next = 0;
  for (let index = 0; index < baseCount; index += 1) {
    cycleSlots.push({ kind: 'owned', label: String(index + 1) });
    if ((index + 1) % policy.intervalItems === 0 && next < inserted.length) {
      const kind = inserted[next++];
      cycleSlots.push({ kind, label: kind === 'direct' || kind === 'programmatic' ? 'AD' : kind === 'news' ? 'NEWS' : 'MEME' });
    }
  }
  const paidSlotsPerCycle = inserted.filter((kind) => kind === 'direct').length;
  const impressions = inventory.activeTvs * paidSlotsPerCycle * policy.estimatedDailyCycles * 30;
  return {
    policy, inventory, cycleSlots, paidSlotsPerCycle,
    estimatedMonthlyRevenueCents: Math.round((impressions / 1000) * policy.directCpmCents),
    dynamicPercent: cycleSlots.length ? Math.round((inserted.length / cycleSlots.length) * 100) : 0,
  };
}

const checked = (value) => value ? 'checked' : '';
const option = (value, current, label) => `<option value="${value}" ${value === current ? 'selected' : ''}>${label}</option>`;

export function renderDynamics(root, payload, _media, client, refresh) {
  const model = buildDynamicsViewModel(payload);
  const { policy, inventory } = model;
  root.innerHTML = `<section class="dynamics-page" data-view="dynamics">
    <header class="page-head dynamics-head"><div><p class="eyebrow">Automação, audiência e receita</p><h1>Receita & dinâmica</h1><p>Programe publicidade, notícias locais, memes seguros, letreiros e efeitos enviados diretamente aos APKs das TVs.</p></div><span class="dynamics-status ${policy.enabled ? 'is-on' : ''}">${policy.enabled ? 'MOTOR ATIVO' : 'MOTOR PAUSADO'}</span></header>

    <section class="dynamics-kpis" aria-label="Resumo de receita e inserções">
      <article class="dynamics-kpi is-blue"><small>Receita direta estimada</small><strong>${money(model.estimatedMonthlyRevenueCents)}</strong><span>por mês · estimativa por CPM</span></article>
      <article class="dynamics-kpi is-cyan"><small>Provas de exibição · 30 dias</small><strong>${number(inventory.proofOfPlay30d)}</strong><span>eventos auditáveis das TVs</span></article>
      <article class="dynamics-kpi is-violet"><small>TVs aptas</small><strong>${number(inventory.activeTvs)}</strong><span>telas ativas para entrega</span></article>
      <article class="dynamics-kpi is-orange"><small>Fatia dinâmica simulada</small><strong>${model.dynamicPercent}%</strong><span>limite configurado: ${policy.maxDynamicPercent}%</span></article>
    </section>

    <section class="revenue-lanes">
      <article><span class="lane-icon is-blue">R$</span><div><h2>Anúncios vendidos por você</h2><p>${inventory.directAds} criativos prontos. Valor apoiado em proof-of-play e CPM configurável.</p></div><button type="button" data-dynamic-action="direct">Adicionar anúncio</button></article>
      <article><span class="lane-icon is-violet">ADS</span><div><h2>Publicidade de terceiros</h2><p><b>Conector SSP necessário.</b> Piso de preço, prioridade e bloqueios já ficam preparados para a futura integração.</p></div><span class="lane-state">AGUARDANDO PARCEIRO</span></article>
      <article><span class="lane-icon is-cyan">CZS</span><div><h2>Notícia local automática</h2><p>O letreiro consulta o jornal Catálogo CZS e leva o público à matéria pelo QR Code.</p></div><a data-czs-connection class="lane-link" href="${CZS_URL}" target="_blank" rel="noopener noreferrer">Abrir Catálogo CZS</a></article>
    </section>

    <section class="cycle-planner">
      <div class="section-title"><div><p class="eyebrow">Simulação do motor</p><h2>Um ciclo da TV</h2></div><div class="cycle-legend"><span><i class="owned"></i>Sua mídia</span><span><i class="direct"></i>Publicidade</span><span><i class="news"></i>Notícia</span><span><i class="meme"></i>Meme</span></div></div>
      <div class="cycle-track">${model.cycleSlots.map((slot) => `<span data-dynamic-slot class="cycle-slot is-${slot.kind}" title="${slot.kind}">${slot.label}</span>`).join('')}</div>
      <p class="cycle-note">O motor respeita frequência, limite percentual, horário e prioridade. Notícia, entretenimento e publicidade sempre aparecem identificados.</p>
    </section>

    <section class="dynamics-config-grid">
      <form data-dynamics-form class="dynamics-form">
        <div class="section-title"><div><p class="eyebrow">Controle enviado às TVs</p><h2>Política de inserções</h2></div><label class="switch"><input name="enabled" type="checkbox" ${checked(policy.enabled)}><span></span>Ativo</label></div>

        <section class="dynamics-form-section"><h3>Frequência e monetização</h3><div class="form-grid">
          <label>Inserir a cada<input name="intervalItems" type="number" min="2" max="20" value="${policy.intervalItems}"><small>itens da programação</small></label>
          <label>Limite dinâmico<input name="maxDynamicPercent" type="number" min="5" max="40" value="${policy.maxDynamicPercent}"><small>percentual máximo do ciclo</small></label>
          <label>CPM venda direta<input name="directCpmCents" type="number" min="0" value="${policy.directCpmCents}"><small>em centavos</small></label>
          <label>Piso CPM programático<input name="programmaticFloorCpmCents" type="number" min="0" value="${policy.programmaticFloorCpmCents}"><small>mínimo aceito pelo parceiro</small></label>
          <label>Ciclos por TV/dia<input name="estimatedDailyCycles" type="number" min="0" value="${policy.estimatedDailyCycles}"><small>base da estimativa</small></label>
          <label>Prioridade<select name="priorityMode">${option('balanced', policy.priorityMode, 'Equilibrar conteúdo')}${option('revenue', policy.priorityMode, 'Maximizar receita')}${option('editorial', policy.priorityMode, 'Priorizar informação')}</select><small>ordem automática das inserções</small></label>
        </div><div class="toggle-grid">
          <label><input name="allowDirectAds" type="checkbox" ${checked(policy.allowDirectAds)}> Anúncios diretos</label>
          <label><input name="allowProgrammaticAds" type="checkbox" ${checked(policy.allowProgrammaticAds)}> Programáticos</label>
          <label><input name="allowNews" type="checkbox" ${checked(policy.allowNews)}> Notícias locais</label>
          <label><input name="allowMemes" type="checkbox" ${checked(policy.allowMemes)}> Memes seguros</label>
          <label><input name="overlayEnabled" type="checkbox" ${checked(policy.overlayEnabled)}> Selo de identificação</label>
        </div></section>

        <section class="dynamics-form-section"><h3>Transições para as TVs</h3><div class="effect-controls">
          <label>Transição<select name="transition">${option('none', policy.transition, 'Corte direto')}${option('fade', policy.transition, 'Dissolver')}${option('slide', policy.transition, 'Deslizar')}${option('zoom', policy.transition, 'Zoom suave')}${option('wipe', policy.transition, 'Cortina lateral')}${option('rise', policy.transition, 'Subir')}${option('flip', policy.transition, 'Giro 3D')}${option('blur', policy.transition, 'Foco suave')}${option('impact', policy.transition, 'Impacto rápido')}</select></label>
          <label>Intensidade<select name="effectIntensity">${option('subtle', policy.effectIntensity, 'Sutil')}${option('balanced', policy.effectIntensity, 'Equilibrada')}${option('strong', policy.effectIntensity, 'Marcante')}</select></label>
        </div></section>

        <section class="dynamics-form-section"><h3>Letreiro animado</h3><div class="toggle-grid compact"><label><input name="tickerEnabled" type="checkbox" ${checked(policy.tickerEnabled)}> Exibir letreiro</label><label><input name="newsQrEnabled" type="checkbox" ${checked(policy.newsQrEnabled)}> QR Code do jornal</label></div><div class="form-grid ticker-controls">
          <label>Conteúdo<select name="tickerMode">${option('live-news', policy.tickerMode, 'Última notícia automática')}${option('custom', policy.tickerMode, 'Mensagem personalizada')}</select></label>
          <label>Texto reserva<input name="tickerText" type="text" maxlength="180" value="${escapeHtml(policy.tickerText)}"><small>aparece se o feed estiver indisponível</small></label>
          <label>Velocidade<select name="tickerSpeed">${option('calm', policy.tickerSpeed, 'Calma')}${option('normal', policy.tickerSpeed, 'Normal')}${option('fast', policy.tickerSpeed, 'Rápida')}</select></label>
          <label>Posição<select name="tickerPosition">${option('top', policy.tickerPosition, 'No topo')}${option('bottom', policy.tickerPosition, 'Na base')}</select></label>
        </div></section>

        <section class="dynamics-form-section"><h3>Programação automática</h3><div class="schedule-controls">
          <label>Dias<select name="scheduleDays">${option('all', policy.scheduleDays, 'Todos os dias')}${option('weekdays', policy.scheduleDays, 'Segunda a sexta')}${option('weekends', policy.scheduleDays, 'Fim de semana')}</select></label>
          <label>Começa<input name="windowStart" type="time" value="${policy.windowStart}"></label>
          <label>Termina<input name="windowEnd" type="time" value="${policy.windowEnd}"></label>
        </div></section>

        <p class="form-status" role="status"></p><button class="primary" type="submit">Salvar e sincronizar TVs</button>
      </form>

      <aside class="effect-studio"><p class="eyebrow">Recebido pelo APK</p><h2>Prévia do efeito</h2><div class="tv-effect-preview" data-effect-preview data-effect="${policy.transition}" data-intensity="${policy.effectIntensity}" data-position="${policy.tickerPosition}"><span>NOTÍCIA LOCAL</span><strong>Informação do Juruá na tela</strong><small>Conteúdo identificado e programado</small><div class="preview-ticker" data-preview-ticker>${escapeHtml(policy.tickerText)}</div></div>
        <div class="czs-connection"><img data-czs-qr src="${CZS_QR}" alt="QR Code real para seguir o Catálogo CZS" width="108" height="108"><div><b>Catálogo CZS conectado</b><p>Feed oficial para notícias e QR Code direto para acompanhar o jornal.</p><a href="${CZS_URL}" target="_blank" rel="noopener noreferrer">Testar ligação real</a></div></div>
        <ul><li>9 transições controladas pelo painel</li><li>Letreiro no topo ou na base</li><li>Modo noturno e redução de movimento respeitados</li></ul>
      </aside>
    </section>
    <p class="revenue-disclaimer">Estimativa não é garantia de receita. O valor real depende de contratos, ocupação, comprovação de exibição e pagamento dos anunciantes.</p>
  </section>`;

  const form = root.querySelector('[data-dynamics-form]');
  const preview = root.querySelector('[data-effect-preview]');
  const previewTicker = root.querySelector('[data-preview-ticker]');
  const updatePreview = () => {
    preview.dataset.effect = form.elements.transition.value;
    preview.dataset.intensity = form.elements.effectIntensity.value;
    preview.dataset.position = form.elements.tickerPosition.value;
    previewTicker.textContent = form.elements.tickerText.value;
    previewTicker.hidden = !form.elements.tickerEnabled.checked;
  };
  ['transition', 'effectIntensity', 'tickerPosition', 'tickerText', 'tickerEnabled'].forEach((name) => form.elements[name].addEventListener(name === 'tickerText' ? 'input' : 'change', updatePreview));
  root.querySelectorAll('[data-dynamic-action]').forEach((button) => button.addEventListener('click', () => root.dispatchEvent(new CustomEvent('angel:navigate', { bubbles: true, detail: { view: 'library', sourceType: button.dataset.dynamicAction } }))));
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const status = form.querySelector('[role=status]');
    const body = {
      enabled: form.elements.enabled.checked,
      intervalItems: Number(form.elements.intervalItems.value), maxDynamicPercent: Number(form.elements.maxDynamicPercent.value),
      allowDirectAds: form.elements.allowDirectAds.checked, allowProgrammaticAds: form.elements.allowProgrammaticAds.checked,
      allowNews: form.elements.allowNews.checked, allowMemes: form.elements.allowMemes.checked,
      transition: form.elements.transition.value, effectIntensity: form.elements.effectIntensity.value,
      overlayEnabled: form.elements.overlayEnabled.checked,
      tickerEnabled: form.elements.tickerEnabled.checked, tickerMode: form.elements.tickerMode.value,
      tickerText: form.elements.tickerText.value.trim(), tickerSpeed: form.elements.tickerSpeed.value,
      tickerPosition: form.elements.tickerPosition.value, newsSourceUrl: CZS_URL, newsFeedUrl: CZS_FEED,
      newsQrEnabled: form.elements.newsQrEnabled.checked, scheduleDays: form.elements.scheduleDays.value,
      windowStart: form.elements.windowStart.value, windowEnd: form.elements.windowEnd.value,
      priorityMode: form.elements.priorityMode.value,
      directCpmCents: Number(form.elements.directCpmCents.value), programmaticFloorCpmCents: Number(form.elements.programmaticFloorCpmCents.value),
      estimatedDailyCycles: Number(form.elements.estimatedDailyCycles.value),
    };
    status.textContent = 'Sincronizando manifestos…';
    try { await client('/admin/dynamic-policy', { method: 'PUT', body }); status.textContent = 'Política salva e TVs notificadas.'; await refresh(); }
    catch { status.textContent = 'Não foi possível salvar. Tente novamente.'; }
  });
  updatePreview();
}
