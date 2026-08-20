import { mediaMimeType } from './library.js';
import { angelIcon } from './angel-icons.js';
import { playUiSound } from './sound.js';

const esc = (value) => String(value ?? '').replace(/[&<>'"]/g, (character) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;',
}[character]));

const mediaName = (media) => media.display_name || media.name || 'Mídia sem nome';

export function openMediaViewer(root, media) {
  root.__closeMediaViewer?.();
  const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  const name = mediaName(media);
  const isVideo = mediaMimeType(media).startsWith('video/');
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
  viewer.innerHTML = `<div class="media-viewer-window"><header class="retro-titlebar"><span id="media-viewer-title">${angelIcon(isVideo ? 'video' : 'image')} ${esc(name)}</span><button type="button" aria-label="Fechar visualização" data-close-media-viewer>×</button></header><div class="media-viewer-stage" data-viewer-stage data-fit="contain">${isVideo ? `<video src="${source}" controls preload="metadata" aria-label="Prévia de ${esc(name)}"></video>` : `<img src="${source}" alt="Prévia de ${esc(name)}">`}</div><div class="media-viewer-facts"><span>${isVideo ? 'Vídeo' : 'Imagem'}</span><span>${esc(dimensions)}</span><span>${esc(durationText)}</span><span>${esc(status)}</span></div><footer class="media-viewer-toolbar" aria-label="Controles da visualização"><span class="media-viewer-status" role="status" aria-live="polite" data-viewer-status></span>${isVideo ? `<button type="button" class="ghost" data-viewer-play aria-label="Reproduzir vídeo">${angelIcon('play')} Reproduzir</button>` : ''}<button type="button" class="ghost" data-viewer-fit>${angelIcon('center')} Mostrar inteira</button><button type="button" class="ghost" data-viewer-actual>${angelIcon('zoom')} 100%</button><button type="button" class="ghost" data-viewer-fullscreen>${angelIcon('tv')} Tela cheia</button><button type="button" class="primary" data-close-media-viewer>Fechar</button></footer></div>`;
  root.append(viewer);

  const stage = viewer.querySelector('[data-viewer-stage]');
  const fullscreenButton = viewer.querySelector('[data-viewer-fullscreen]');
  const viewerStatus = viewer.querySelector('[data-viewer-status]');
  const background = [...root.children].filter((element) => element !== viewer).map((element) => ({
    element,
    inert: element.hasAttribute('inert'),
    ariaHidden: element.getAttribute('aria-hidden'),
  }));
  background.forEach(({ element }) => { element.setAttribute('inert', ''); element.setAttribute('aria-hidden', 'true'); });
  const updateFullscreen = () => { fullscreenButton.innerHTML = `${angelIcon('tv')} ${document.fullscreenElement === stage ? 'Sair da tela cheia' : 'Tela cheia'}`; };
  const close = () => {
    document.removeEventListener('keydown', onKeyDown);
    document.removeEventListener('fullscreenchange', updateFullscreen);
    if (video) {
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
      video.removeEventListener('ended', onPause);
    }
    background.forEach(({ element, inert, ariaHidden }) => {
      if (!inert) element.removeAttribute('inert');
      if (ariaHidden === null) element.removeAttribute('aria-hidden'); else element.setAttribute('aria-hidden', ariaHidden);
    });
    viewer.remove();
    if (root.__closeMediaViewer === close) delete root.__closeMediaViewer;
    if (previouslyFocused?.isConnected) previouslyFocused.focus();
  };
  const onKeyDown = (event) => {
    if (event.key === 'Escape') { close(); return; }
    if (event.key !== 'Tab') return;
    const controls = [...viewer.querySelectorAll('button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])')];
    if (!controls.length) return;
    const first = controls[0]; const last = controls.at(-1);
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  };
  root.__closeMediaViewer = close;
  document.addEventListener('keydown', onKeyDown);
  document.addEventListener('fullscreenchange', updateFullscreen);
  viewer.querySelectorAll('[data-close-media-viewer]').forEach((button) => button.addEventListener('click', close));
  viewer.querySelector('[data-viewer-fit]').addEventListener('click', () => { stage.dataset.fit = 'contain'; });
  viewer.querySelector('[data-viewer-actual]').addEventListener('click', () => { stage.dataset.fit = 'actual'; });
  const playbackButton = viewer.querySelector('[data-viewer-play]');
  const video = stage.querySelector('video');
  const updatePlayback = (playing) => {
    if (!playbackButton) return;
    playbackButton.dataset.playing = String(playing);
    playbackButton.setAttribute('aria-label', playing ? 'Pausar vídeo' : 'Reproduzir vídeo');
    playbackButton.innerHTML = `${angelIcon(playing ? 'pause' : 'play')} ${playing ? 'Pausar' : 'Reproduzir'}`;
  };
  const onPlay = () => updatePlayback(true);
  const onPause = () => updatePlayback(false);
  video?.addEventListener('play', onPlay);
  video?.addEventListener('pause', onPause);
  video?.addEventListener('ended', onPause);
  playbackButton?.addEventListener('click', async () => {
    viewerStatus.textContent = '';
    if (playbackButton.dataset.playing === 'true') { video.pause(); return; }
    try {
      await video.play();
    } catch {
      updatePlayback(false);
      viewerStatus.textContent = 'Não foi possível reproduzir o vídeo.';
      playUiSound('error');
    }
  });
  fullscreenButton.addEventListener('click', async () => {
    viewerStatus.textContent = '';
    try {
      if (document.fullscreenElement === stage) {
        if (typeof document.exitFullscreen !== 'function') throw new Error('unsupported');
        await document.exitFullscreen();
      } else {
        if (typeof stage.requestFullscreen !== 'function') { viewerStatus.textContent = 'Tela cheia não está disponível neste dispositivo.'; return; }
        await stage.requestFullscreen();
      }
    } catch {
      viewerStatus.textContent = 'Não foi possível ativar a tela cheia.';
    }
  });
  viewer.querySelector('[data-close-media-viewer]').focus();
  return viewer;
}
