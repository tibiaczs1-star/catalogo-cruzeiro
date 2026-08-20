const clamp = (value, min, max, fallback) => {
  const number = Number(value);
  return Number.isFinite(number) ? Math.min(max, Math.max(min, number)) : fallback;
};

const optionalNumber = (value) => value === '' || value == null ? null : (Number.isFinite(Number(value)) ? Number(value) : null);
const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);

export function buildPresentationPatch(fields) {
  const fitMode = ['contain', 'cover', 'fill'].includes(fields.fitMode) ? fields.fitMode : 'contain';
  const rotation = [0, 90, 180, 270].includes(Number(fields.rotation)) ? Number(fields.rotation) : 0;
  const color = /^#[0-9a-f]{6}$/i.test(String(fields.backgroundColor || '')) ? String(fields.backgroundColor).toLowerCase() : '#000000';
  const patch = {
    fitMode,
    focalX: clamp(fields.focalX, 0, 100, 50),
    focalY: clamp(fields.focalY, 0, 100, 50),
    zoom: clamp(fields.zoom, 0.25, 4, 1),
    rotation,
    backgroundColor: color,
  };
  const mediaType = String(fields.mediaType || '');
  if (mediaType.startsWith('image/')) patch.durationSeconds = clamp(fields.imageDurationSeconds, 1, 86400, 10);
  if (mediaType.startsWith('video/')) {
    patch.trimStartSeconds = optionalNumber(fields.trimStartSeconds);
    patch.trimEndSeconds = optionalNumber(fields.trimEndSeconds);
    patch.volume = clamp(fields.volume, 0, 100, 100);
  }
  return patch;
}

export function applyPreviewTransform(node, value) {
  node.style.objectFit = value.fitMode === 'fill' ? 'fill' : value.fitMode;
  node.style.objectPosition = `${value.focalX}% ${value.focalY}%`;
  node.style.transform = `rotate(${value.rotation}deg) scale(${value.zoom})`;
  node.parentElement.style.backgroundColor = value.backgroundColor;
}

const alignments = [
  ['top-left', 0, 0, 'Superior esquerdo'], ['top', 50, 0, 'Superior'], ['top-right', 100, 0, 'Superior direito'],
  ['left', 0, 50, 'Esquerda'], ['center', 50, 50, 'Centro'], ['right', 100, 50, 'Direita'],
  ['bottom-left', 0, 100, 'Inferior esquerdo'], ['bottom', 50, 100, 'Inferior'], ['bottom-right', 100, 100, 'Inferior direito'],
];

export function openMediaEditor(root, media, apiClient) {
  root.querySelector('.media-editor')?.remove();
  const opener = document.activeElement;
  const mediaType = String(media.mimeType || media.type || media.content_type || 'image/*');
  const isVideo = mediaType.startsWith('video/');
  const p = media.presentation || {
    fitMode: media.fit_mode || 'contain', focalX: Number(media.focal_x ?? 50), focalY: Number(media.focal_y ?? 50),
    zoom: Number(media.zoom ?? 1), rotation: Number(media.rotation ?? 0), backgroundColor: media.background_color || '#000000',
  };
  const initial = buildPresentationPatch({ ...p, mediaType, imageDurationSeconds: media.durationSeconds ?? media.duration_seconds ?? 10, trimStartSeconds: media.trimStartSeconds ?? media.trim_start_seconds ?? '', trimEndSeconds: media.trimEndSeconds ?? media.trim_end_seconds ?? '', volume: media.volume ?? 100 });
  const usage = media.usage || { playlists: [], playingNow: [] };
  const hasAudio = media.hasAudio ?? media.has_audio ?? false;
  const source = `./api/admin/media/${encodeURIComponent(media.id)}/content`;
  const preview = isVideo ? `<video src="${source}" controls preload="metadata"></video>` : `<img src="${source}" alt="Prévia completa de ${escapeHtml(media.name)}">`;
  const playback = isVideo
    ? `<fieldset class="editor-playback" data-video-timeline><legend>Reprodução do vídeo</legend><div class="editor-timeline" aria-label="Linha do tempo do vídeo"><span>0s</span><span>${escapeHtml(media.durationSeconds ?? '—')}s</span></div><div class="editor-pair"><label>Início do corte (s)<input name="trimStartSeconds" type="number" min="0" step="0.1" value="${initial.trimStartSeconds ?? ''}"></label><label>Fim do corte (s)<input name="trimEndSeconds" type="number" min="0" step="0.1" value="${initial.trimEndSeconds ?? ''}"></label></div><label>Volume <output data-volume-value>${initial.volume}%</output><input name="volume" type="range" min="0" max="100" value="${initial.volume}"></label></fieldset>`
    : `<fieldset class="editor-playback"><legend>Exibição da imagem</legend><label>Duração (segundos)<input name="imageDurationSeconds" type="number" min="1" step="1" value="${initial.durationSeconds}"></label></fieldset>`;
  const panel = document.createElement('dialog');
  panel.className = 'media-editor retro-editor-window'; panel.setAttribute('open', ''); panel.setAttribute('aria-labelledby', 'media-editor-title');
  panel.innerHTML = `<form method="dialog"><header class="editor-titlebar"><div><span class="media-type">${isVideo ? 'VÍDEO' : 'IMAGEM'}</span><h2 id="media-editor-title">${escapeHtml(media.name)}</h2><p>${media.width || '—'}×${media.height || '—'} · ${hasAudio ? 'com áudio' : 'sem áudio'}</p></div><button type="button" data-close aria-label="Fechar editor">×</button></header><div class="editor-layout"><section class="editor-stage-column" aria-label="Prévia"><label>Formato da tela<select name="screenRatio"><option value="16-9">16:9 Paisagem</option><option value="9-16">9:16 Vertical</option><option value="4-3">4:3 Clássico</option><option value="1-1">1:1 Quadrado</option></select></label><div class="editor-preview" data-ratio="16-9">${preview}<div class="editor-safe-area" aria-hidden="true"></div></div></section><section class="editor-controls" aria-label="Ajustes"><label>Modo de ajuste<select name="fitMode" aria-label="Modo de ajuste"><option value="contain">Conter inteira</option><option value="cover">Preencher e cortar</option><option value="fill">Esticar</option></select></label><p class="editor-warning" data-fit-warning hidden>Este modo pode cortar ou deformar partes da mídia.</p><fieldset><legend>Centralização</legend><div class="editor-align-grid">${alignments.map(([key, , , label]) => `<button type="button" data-align="${key}" aria-label="${label}" title="${label}">●</button>`).join('')}</div><label>Horizontal <output data-focal-x-value>${initial.focalX}%</output><span class="editor-control-pair"><input name="focalX" aria-label="Centralização horizontal" type="range" min="0" max="100" value="${initial.focalX}"><input data-number-for="focalX" aria-label="Valor horizontal" type="number" min="0" max="100" value="${initial.focalX}"></span></label><label>Vertical <output data-focal-y-value>${initial.focalY}%</output><span class="editor-control-pair"><input name="focalY" aria-label="Centralização vertical" type="range" min="0" max="100" value="${initial.focalY}"><input data-number-for="focalY" aria-label="Valor vertical" type="number" min="0" max="100" value="${initial.focalY}"></span></label></fieldset><label>Zoom <output data-zoom-value>${initial.zoom}×</output><span class="editor-control-pair"><input name="zoom" type="range" min="0.25" max="4" step="0.05" value="${initial.zoom}"><input data-number-for="zoom" aria-label="Valor do zoom" type="number" min="0.25" max="4" step="0.05" value="${initial.zoom}"></span></label><label>Rotação<select name="rotation"><option>0</option><option>90</option><option>180</option><option>270</option></select></label><label>Cor de fundo<input name="backgroundColor" type="color" value="${initial.backgroundColor}"></label>${playback}<p class="editor-usage"><strong>Em uso:</strong> ${usage.playlists.map((x) => escapeHtml(x.name)).join(', ') || 'nenhuma playlist'} · ${usage.playingNow.length} TVs agora</p></section></div><footer><div><button type="button" data-undo class="ghost" disabled>Desfazer</button><button type="button" data-reset class="ghost">Restaurar padrão</button></div><div><button type="button" data-close class="ghost">Cancelar</button><button type="submit" value="save" class="primary">Salvar alterações</button></div></footer><p role="status" aria-live="polite"></p><input type="hidden" name="mediaType" value="${escapeHtml(mediaType)}"></form>`;
  const form = panel.querySelector('form');
  form.querySelector('[name=fitMode]').value = initial.fitMode; form.querySelector('[name=rotation]').value = String(initial.rotation);
  const previewBox = panel.querySelector('.editor-preview'); const previewNode = previewBox.querySelector('img, video'); const history = [];
  const snapshot = () => Object.fromEntries(new FormData(form));
  const updatePreview = () => {
    const value = buildPresentationPatch(snapshot()); applyPreviewTransform(previewNode, value);
    panel.querySelector('[data-focal-x-value]').textContent = `${value.focalX}%`; panel.querySelector('[data-focal-y-value]').textContent = `${value.focalY}%`; panel.querySelector('[data-zoom-value]').textContent = `${value.zoom}×`;
    panel.querySelector('[data-volume-value]') && (panel.querySelector('[data-volume-value]').textContent = `${value.volume}%`);
    panel.querySelector('[data-fit-warning]').hidden = value.fitMode === 'contain'; previewBox.dataset.ratio = form.elements.screenRatio.value;
    ['focalX', 'focalY', 'zoom'].forEach((name) => { panel.querySelector(`[data-number-for="${name}"]`).value = form.elements[name].value; });
  };
  const restore = (state) => { Object.entries(state).forEach(([name, value]) => { if (form.elements[name]) form.elements[name].value = value; }); updatePreview(); };
  let previous = snapshot();
  const remember = () => { history.push(previous); previous = snapshot(); panel.querySelector('[data-undo]').disabled = false; updatePreview(); };
  form.querySelectorAll('select, input:not([type=hidden]):not([data-number-for])').forEach((control) => control.addEventListener('input', remember));
  panel.querySelectorAll('[data-number-for]').forEach((number) => number.addEventListener('input', () => { form.elements[number.dataset.numberFor].value = number.value; remember(); }));
  panel.querySelectorAll('[data-align]').forEach((button) => button.addEventListener('click', () => { const [, x, y] = alignments.find(([key]) => key === button.dataset.align); form.elements.focalX.value = x; form.elements.focalY.value = y; remember(); }));
  panel.querySelector('[data-undo]').addEventListener('click', () => { if (!history.length) return; const state = history.pop(); restore(state); previous = snapshot(); panel.querySelector('[data-undo]').disabled = history.length === 0; });
  panel.querySelector('[data-reset]').addEventListener('click', () => { form.elements.fitMode.value = 'contain'; form.elements.focalX.value = 50; form.elements.focalY.value = 50; form.elements.zoom.value = 1; form.elements.rotation.value = 0; form.elements.backgroundColor.value = '#000000'; remember(); });
  const close = () => { panel.remove(); if (opener && typeof opener.focus === 'function') opener.focus(); };
  panel.querySelectorAll('[data-close]').forEach((button) => button.addEventListener('click', close));
  panel.addEventListener('keydown', (event) => { if (event.key === 'Escape') { event.preventDefault(); close(); } });
  form.addEventListener('submit', async (event) => { event.preventDefault(); const value = buildPresentationPatch(snapshot()); const status = form.querySelector('[role=status]'); try { await apiClient(`/admin/media/${media.id}`, { method: 'PATCH', body: value }); status.textContent = 'Alterações salvas.'; close(); } catch { status.textContent = 'Não foi possível salvar as alterações.'; } });
  root.append(panel); updatePreview(); panel.querySelector('[data-close]').focus(); return panel;
}
