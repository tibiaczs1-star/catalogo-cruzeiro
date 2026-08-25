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

export function filterMedia(media, { query = '', type = 'all', source = 'all' } = {}) {
  const term = query.trim().toLocaleLowerCase('pt-BR');
  return media.filter((item) => (!term || String(item.display_name || item.name).toLocaleLowerCase('pt-BR').includes(term))
    && (type === 'all' || String(mediaMimeType(item)).startsWith(`${type}/`))
    && (source === 'all' || mediaSourceType(item) === source));
}

const SOURCE_LABELS = {
  owned: 'Conteúdo próprio',
  direct: 'Patrocinada direta',
  programmatic: 'Programática',
  editorial: 'Notícia ou meme local',
};

export function mediaSourceType(media) {
  const raw = [media.source_type, media.sourceType, media.campaign_type, media.campaignType, media.origin, media.category, ...(Array.isArray(media.tags) ? media.tags : [])]
    .filter(Boolean).join(' ').toLocaleLowerCase('pt-BR');
  if (/programmatic|exchange|open.?market|rtb/.test(raw)) return 'programmatic';
  if (/news|not[ií]cia|meme|editorial|local/.test(raw)) return 'editorial';
  if (/direct|patrocin|paid|pago|sponsor|anunciante/.test(raw) || media.is_paid === true || media.isPaid === true) return 'direct';
  return 'owned';
}

export const mediaSourceLabel = (media) => SOURCE_LABELS[mediaSourceType(media)];

const CYCLE_PATTERN = ['owned', 'direct', 'owned', 'editorial', 'owned', 'direct', 'owned', 'programmatic'];

export function buildCycleSlots(media) {
  const pools = Object.fromEntries(Object.keys(SOURCE_LABELS).map((kind) => [kind, media.filter((item) => mediaSourceType(item) === kind)]));
  const used = Object.fromEntries(Object.keys(SOURCE_LABELS).map((kind) => [kind, 0]));
  return CYCLE_PATTERN.map((kind, index) => ({
    position: index + 1,
    kind,
    label: SOURCE_LABELS[kind],
    media: pools[kind][used[kind]++] || null,
  }));
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
  const sourceType = mediaSourceType(media);
  const sourceLabel = SOURCE_LABELS[sourceType];
  const preview = isVideo
    ? `<video src="${source}" controls muted preload="metadata" playsinline aria-label="Prévia de ${esc(name)}"></video>`
    : `<img src="${source}" alt="Prévia de ${esc(name)}" loading="lazy" decoding="async">`;
  return `<article class="media-card media-card--${sourceType}${count ? ' is-on-air' : ''}" data-media-id="${esc(media.id)}" data-media-source="${sourceType}">
    <div class="media-preview">${preview}<div class="media-preview-top"><span class="source-badge">${sourceLabel}</span>${count ? `<span class="on-air-badge"><i></i>${count} TV${count === 1 ? '' : 's'}</span>` : ''}</div></div>
    <div class="media-card-body"><div class="media-card-title"><span class="media-type">${angelIcon(isVideo ? 'video' : 'image')} ${isVideo ? 'VÍDEO' : 'IMAGEM'}</span><span>${esc(durationText)}</span></div><h3>${esc(name)}</h3><p class="media-facts">${esc(formatMediaFacts(media))}</p>
      <dl class="media-detail-grid"><div><dt>Tamanho</dt><dd>${esc(size)}</dd></div><div><dt>Áudio</dt><dd>${audioText}</dd></div><div><dt>Processamento</dt><dd>${esc(processing)}</dd></div><div><dt>Uso</dt><dd>${playlistLabel} · ${groupLabel}</dd></div><div><dt>Destino</dt><dd>${groupCount ? groupLabel : 'Sem conjunto'}</dd></div><div><dt>Exibição</dt><dd>${count ? `${count} TV${count === 1 ? '' : 's'} agora` : 'Fora do ar'}</dd></div></dl>
      <p class="media-links"><b>Playlists:</b> ${playlists.length ? playlists.map((p) => esc(p.name)).join(' · ') : 'não informado'}<br><b>Conjuntos:</b> ${groups.length ? groups.map((g) => esc(g.name)).join(' · ') : 'não informado'}</p><strong class="media-air-state">${count ? `Sinal recente em ${count} TV${count === 1 ? '' : 's'}` : 'Sem reprodução recente'}</strong>
      <div class="media-card-actions"><button type="button" class="ghost" data-preview-media="${esc(media.id)}" aria-label="Abrir ${esc(name)} em tela cheia">${angelIcon('tv')} Tela cheia</button><button type="button" class="ghost" data-edit-media="${esc(media.id)}">${angelIcon('settings')} Editar mídia</button><button type="button" class="primary" data-use-media="${esc(media.id)}">${angelIcon('playlist')} Usar em playlist</button></div>
    </div></article>`;
}
