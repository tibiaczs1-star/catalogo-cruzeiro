export function buildPresentationPatch(fields) {
  return { fitMode: fields.fitMode, focalX: Number(fields.focalX), focalY: Number(fields.focalY), zoom: Number(fields.zoom), rotation: Number(fields.rotation), backgroundColor: fields.backgroundColor };
}

export function applyPreviewTransform(node, value) {
  node.style.objectFit = value.fitMode === 'fill' ? 'fill' : value.fitMode;
  node.style.objectPosition = `${value.focalX}% ${value.focalY}%`;
  node.style.transform = `rotate(${value.rotation}deg) scale(${value.zoom})`;
  node.parentElement.style.backgroundColor = value.backgroundColor;
}

export function openMediaEditor(root, media, apiClient) {
  const p = media.presentation || {
    fitMode: media.fit_mode || 'contain',
    focalX: Number(media.focal_x ?? 50),
    focalY: Number(media.focal_y ?? 50),
    zoom: Number(media.zoom ?? 1),
    rotation: Number(media.rotation ?? 0),
    backgroundColor: media.background_color || '#000000',
  };
  const usage = media.usage || { playlists: [], playingNow: [] };
  const hasAudio = media.hasAudio ?? media.has_audio ?? false;
  const mediaType = String(media.mimeType || media.type || media.content_type || '');
  const panel = document.createElement('dialog'); panel.className = 'media-editor'; panel.setAttribute('open', '');
  panel.innerHTML = `<form method="dialog"><header><div><span class="media-type">${mediaType.startsWith('video/') ? 'VÍDEO' : 'IMAGEM'}</span><h2>${media.name}</h2><p>${media.width || '—'}×${media.height || '—'} · ${hasAudio ? 'com áudio' : 'sem áudio'}</p></div><button value="cancel" aria-label="Fechar">×</button></header><div class="editor-layout"><div class="editor-preview"><div><span>Prévia da mídia</span></div></div><div class="editor-controls"><label>Modo de ajuste<select name="fitMode" aria-label="Modo de ajuste"><option value="contain">Conter inteira</option><option value="cover">Preencher e cortar</option><option value="fill">Esticar</option></select></label><label>Centralização horizontal<input name="focalX" aria-label="Centralização horizontal" type="range" min="0" max="100" value="${p.focalX}"></label><label>Centralização vertical<input name="focalY" type="range" min="0" max="100" value="${p.focalY}"></label><label>Zoom<input name="zoom" type="range" min="0.25" max="4" step="0.05" value="${p.zoom}"></label><label>Rotação<select name="rotation"><option>0</option><option>90</option><option>180</option><option>270</option></select></label><label>Cor de fundo<input name="backgroundColor" type="color" value="${p.backgroundColor}"></label><p><strong>Em uso:</strong> ${usage.playlists.map((x) => x.name).join(', ') || 'nenhuma playlist'} · ${usage.playingNow.length} TVs agora</p></div></div><footer><button value="cancel" class="ghost">Cancelar</button><button type="button" data-reset class="ghost">Restaurar</button><button type="submit" value="save" class="primary">Salvar alterações</button></footer><p role="status"></p></form>`;
  const form = panel.querySelector('form'); form.querySelector('[name=fitMode]').value = p.fitMode; form.querySelector('[name=rotation]').value = String(p.rotation);
  form.addEventListener('submit', async (event) => { event.preventDefault(); const value = buildPresentationPatch(Object.fromEntries(new FormData(form))); const status = form.querySelector('[role=status]'); try { await apiClient(`/admin/media/${media.id}`, { method: 'PATCH', body: value }); status.textContent = 'Alterações salvas.'; panel.remove(); } catch { status.textContent = 'Não foi possível salvar as alterações.'; } });
  panel.querySelector('[data-reset]').addEventListener('click', () => { for (const [name, value] of Object.entries({ fitMode: 'contain', focalX: 50, focalY: 50, zoom: 1, rotation: 0, backgroundColor: '#000000' })) form.querySelector(`[name=${name}]`).value = value; });
  root.append(panel); return panel;
}
