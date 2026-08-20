const esc = (value) => String(value ?? '').replace(/[&<>'"]/g, (character) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;',
}[character]));

const mimeType = (media) => media.content_type || media.mimeType || media.type || '';
const mediaName = (media) => media.display_name || media.name || 'Mídia sem nome';

export function openMediaViewer(root, media) {
  root.__closeMediaViewer?.();
  const name = mediaName(media);
  const isVideo = mimeType(media).startsWith('video/');
  const source = `./api/admin/media/${encodeURIComponent(media.id)}/content`;
  const dimensions = media.width && media.height ? `${media.width}×${media.height}` : 'Dimensões não informadas';
  const duration = Number(media.duration_seconds ?? media.durationSeconds);
  const durationText = Number.isFinite(duration) && duration > 0 ? `${duration} s` : 'Duração não informada';
  const status = media.processing_status ?? media.status ?? 'Processamento não informado';
  const viewer = document.createElement('section');
  viewer.className = 'media-viewer';
  viewer.setAttribute('role', 'dialog');
  viewer.setAttribute('aria-modal', 'true');
  viewer.setAttribute('aria-labelledby', 'media-viewer-title');
  viewer.innerHTML = `<div class="media-viewer-window"><header class="retro-titlebar"><span id="media-viewer-title">${esc(name)}</span><button type="button" aria-label="Fechar visualização" data-close-media-viewer>×</button></header><div class="media-viewer-stage" data-viewer-stage data-fit="contain">${isVideo ? `<video src="${source}" controls preload="metadata" aria-label="Prévia de ${esc(name)}"></video>` : `<img src="${source}" alt="Prévia de ${esc(name)}">`}</div><div class="media-viewer-facts"><span>${isVideo ? 'Vídeo' : 'Imagem'}</span><span>${esc(dimensions)}</span><span>${esc(durationText)}</span><span>${esc(status)}</span></div><footer class="media-viewer-toolbar" aria-label="Controles da visualização"><button type="button" class="ghost" data-viewer-fit>Mostrar inteira</button><button type="button" class="ghost" data-viewer-actual>100%</button><button type="button" class="ghost" data-viewer-fullscreen>Tela cheia</button><button type="button" class="primary" data-close-media-viewer>Fechar</button></footer></div>`;
  root.append(viewer);

  const stage = viewer.querySelector('[data-viewer-stage]');
  const close = () => {
    document.removeEventListener('keydown', onKeyDown);
    viewer.remove();
    if (root.__closeMediaViewer === close) delete root.__closeMediaViewer;
  };
  const onKeyDown = (event) => { if (event.key === 'Escape') close(); };
  root.__closeMediaViewer = close;
  document.addEventListener('keydown', onKeyDown);
  viewer.querySelectorAll('[data-close-media-viewer]').forEach((button) => button.addEventListener('click', close));
  viewer.querySelector('[data-viewer-fit]').addEventListener('click', () => { stage.dataset.fit = 'contain'; });
  viewer.querySelector('[data-viewer-actual]').addEventListener('click', () => { stage.dataset.fit = 'actual'; });
  viewer.querySelector('[data-viewer-fullscreen]').addEventListener('click', () => stage.requestFullscreen?.());
  viewer.querySelector('[data-close-media-viewer]').focus();
  return viewer;
}
