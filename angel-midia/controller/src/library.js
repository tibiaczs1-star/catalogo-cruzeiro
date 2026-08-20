const esc = (value) => String(value ?? '').replace(/[&<>'"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c]));

const ratio = (width, height) => {
  if (!width || !height) return 'resolução pendente';
  const gcd = (a, b) => b ? gcd(b, a % b) : a;
  const divisor = gcd(Number(width), Number(height));
  return `${width / divisor}:${height / divisor}`;
};

export function formatMediaFacts(media) {
  const format = String(media.content_type || media.type || '').split('/')[1]?.toUpperCase() || 'ARQUIVO';
  const dimensions = media.width && media.height ? `${media.width}×${media.height}` : 'dimensões pendentes';
  return `${format} · ${dimensions} · ${ratio(media.width, media.height)}`;
}

export function filterMedia(media, { query = '', type = 'all' } = {}) {
  const term = query.trim().toLocaleLowerCase('pt-BR');
  return media.filter((item) => (!term || String(item.display_name || item.name).toLocaleLowerCase('pt-BR').includes(term))
    && (type === 'all' || String(item.content_type || item.type).startsWith(`${type}/`)));
}

export function renderMediaCard(media) {
  const isVideo = String(media.content_type || '').startsWith('video/');
  const count = Number(media.playing_now_count || 0);
  const size = `${Math.round(Number(media.size_bytes || 0) / 104857.6) / 10} MB`;
  return `<article class="glass media-card" data-media-id="${esc(media.id)}"><div class="media-preview"><span>${isVideo ? '▶' : '▧'}</span></div><div class="media-card-body"><span class="media-type">${isVideo ? 'VÍDEO' : 'IMAGEM'}</span><h3>${esc(media.display_name || media.name)}</h3><p class="media-facts">${esc(formatMediaFacts(media))}</p><p>${size} · ${media.has_audio ? 'com áudio' : 'sem áudio'} · ${esc(media.processing_status || 'ready')}</p><strong>${count ? `Rodando agora em ${count} TV${count === 1 ? '' : 's'}` : 'Fora do ar agora'}</strong><button type="button" class="ghost" data-edit-media="${esc(media.id)}">Editar mídia</button></div></article>`;
}
