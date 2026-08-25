import { angelIcon } from './angel-icons.js';

const esc = (value) => String(value ?? '').replace(/[&<>'"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c]));

export const mediaMimeType = (media) => media.content_type || media.mimeType || media.type || '';

const ratio = (width, height) => {
  if (!width || !height) return 'resolução pendente';
  const gcd = (a, b) => b ? gcd(b, a % b) : a;
  const divisor = gcd(Number(width), Number(height));
  return `${width / divisor}:${height / divisor}`;
};

export function formatMediaFacts(media) {
  const format = String(mediaMimeType(media)).split('/')[1]?.toUpperCase() || 'ARQUIVO';
  const dimensions = media.width && media.height ? `${media.width}×${media.height}` : 'dimensões pendentes';
  return `${format} · ${dimensions} · ${ratio(media.width, media.height)}`;
}

export function filterMedia(media, { query = '', type = 'all' } = {}) {
  const term = query.trim().toLocaleLowerCase('pt-BR');
  return media.filter((item) => (!term || String(item.display_name || item.name).toLocaleLowerCase('pt-BR').includes(term))
    && (type === 'all' || String(mediaMimeType(item)).startsWith(`${type}/`)));
}

export function renderMediaCard(media) {
  const isVideo = String(mediaMimeType(media)).startsWith('video/');
  const count = Number(media.playing_now_count ?? media.playingNowCount ?? 0);
  const sizeBytes = Number(media.size_bytes ?? media.sizeBytes);
  const size = Number.isFinite(sizeBytes) && sizeBytes > 0 ? `${Math.round(sizeBytes / 104857.6) / 10} MB` : 'tamanho não informado';
  const name = media.display_name || media.name;
  const playlists = Array.isArray(media.playlists) ? media.playlists : [];
  const groups = Array.isArray(media.groups) ? media.groups : [];
  const source = `./api/admin/media/${encodeURIComponent(media.id)}/content`;
  const duration = Number(media.duration_seconds ?? media.durationSeconds);
  const durationText = Number.isFinite(duration) && duration > 0 ? `${duration} s` : 'duração não informada';
  const playlistCount = Number(media.playlist_count ?? media.playlistCount ?? playlists.length);
  const groupCount = Number(media.group_count ?? media.groupCount ?? groups.length);
  const playlistLabel = `${playlistCount} playlist${playlistCount === 1 ? '' : 's'}`;
  const groupLabel = `${groupCount} conjunto${groupCount === 1 ? '' : 's'}`;
  const audioValue = media.has_audio ?? media.hasAudio;
  const audioText = audioValue == null ? 'Não informado' : audioValue ? 'Com áudio' : 'Sem áudio';
  const processing = media.processing_status ?? media.status ?? 'não informado';
  const preview = isVideo
    ? `<video src="${source}" controls muted preload="metadata" aria-label="Prévia de ${esc(name)}"></video>`
    : `<img src="${source}" alt="Prévia de ${esc(name)}" loading="lazy">`;
  return `<article class="glass media-card" data-media-id="${esc(media.id)}"><div class="media-preview">${preview}<button type="button" class="media-preview-open" data-preview-media="${esc(media.id)}">${angelIcon('play')} Abrir prévia completa</button></div><div class="media-card-body"><span class="media-type">${angelIcon(isVideo ? 'video' : 'image')} ${isVideo ? 'VÍDEO' : 'IMAGEM'}</span><h3>${esc(name)}</h3><p class="media-facts">${esc(formatMediaFacts(media))}</p><dl class="media-detail-grid"><div><dt>Duração</dt><dd>${esc(durationText)}</dd></div><div><dt>Tamanho</dt><dd>${esc(size)}</dd></div><div><dt>Áudio</dt><dd>${audioText}</dd></div><div><dt>Processamento</dt><dd>${esc(processing)}</dd></div><div><dt>Uso</dt><dd>${playlistLabel} · ${groupLabel}</dd></div><div><dt>Exibição</dt><dd>${count ? `${count} TV${count === 1 ? '' : 's'} agora` : 'Fora do ar'}</dd></div></dl><p class="media-links"><b>Playlists:</b> ${playlists.length ? playlists.map((p) => esc(p.name)).join(' · ') : 'não informado'}<br><b>Conjuntos:</b> ${groups.length ? groups.map((g) => esc(g.name)).join(' · ') : 'não informado'}</p><strong>${count ? `Rodando agora em ${count} TV${count === 1 ? '' : 's'}` : 'Fora do ar agora'}</strong><button type="button" class="ghost" data-edit-media="${esc(media.id)}">${angelIcon('settings')} Editar mídia</button></div></article>`;
}
