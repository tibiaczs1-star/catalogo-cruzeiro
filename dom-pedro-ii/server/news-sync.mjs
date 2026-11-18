// Sincronização automática das notícias do site oficial da escola.
// Fonte pública: https://colegiodompedro2czs.com.br/site-cmdpii/noticias.html
// A API do CMS é /api/site-publico/noticias (sem autenticação, usada pelo próprio site).
import { randomUUID } from 'node:crypto';

const PORTAL_ORIGIN = 'https://colegiodompedro2czs.com.br';
const NEWS_API = PORTAL_ORIGIN + '/api/site-publico/noticias';
const NEWS_PAGE = PORTAL_ORIGIN + '/site-cmdpii/noticias.html';
const TTL_MS = 30 * 60 * 1000; // atualiza no máximo a cada 30 minutos

let lastSyncAt = 0;
let lastStatus = { ok: false, synced: 0, error: null, at: null };
let inFlight = null;

const clean = (v, max = 500) => String(v ?? '').replace(/\s+/g, ' ').trim().slice(0, max);

function normalize(item) {
  const title = clean(item.titulo, 240);
  if (!title) return null;
  const slug = clean(item.slug, 240);
  const link = slug ? `${NEWS_PAGE}?noticia=${encodeURIComponent(slug)}` : NEWS_PAGE;
  return {
    external_id: clean(item._id || slug, 120) || null,
    title,
    summary: clean(item.resumo, 1200) || clean(item.conteudo, 1200),
    category: clean(item.categoria, 80) || 'Geral',
    image_url: /^https:\/\//i.test(item.imagem || '') ? clean(item.imagem, 800) : null,
    link_url: link,
    published_at: item.dataPublicacao || item.createdAt || new Date().toISOString(),
    source: clean(item.autor, 80) || 'Portal CMDPII'
  };
}

export function registerNewsSync(app, { db, auth, schoolId = 1 }) {
  // Garante coluna de identificação externa (seguro para bancos antigos).
  if (!db.prepare('PRAGMA table_info(news)').all().some(c => c.name === 'external_id')) {
    db.exec('ALTER TABLE news ADD COLUMN external_id TEXT');
  }
  try {
    db.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_news_external ON news(school_id, external_id) WHERE external_id IS NOT NULL');
  } catch {}

  async function sync({ force = false } = {}) {
    const now = Date.now();
    if (!force && now - lastSyncAt < TTL_MS) return lastStatus;
    if (inFlight) return inFlight;
    inFlight = (async () => {
      try {
        const res = await fetch(NEWS_API, {
          headers: { Accept: 'application/json', 'User-Agent': 'DomPedroII-Voice/1.0' },
          signal: AbortSignal.timeout(12000)
        });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const data = await res.json();
        if (!data?.ok || !Array.isArray(data.noticias)) throw new Error('Resposta inválida do portal');
        const rows = data.noticias.map(normalize).filter(Boolean).slice(0, 12);
        const insert = db.prepare(`
          INSERT OR IGNORE INTO news(school_id,title,summary,category,image_url,link_url,published_at,source,external_id)
          VALUES(?,?,?,?,?,?,?,?,?)
        `);
        const update = db.prepare(`
          UPDATE news SET title=?, summary=?, category=?, image_url=?, link_url=?, published_at=?, source=?
          WHERE school_id=? AND external_id=?
        `);
        db.exec('BEGIN');
        try {
          for (const n of rows) {
            insert.run(schoolId, n.title, n.summary, n.category, n.image_url, n.link_url, n.published_at, n.source, n.external_id);
            update.run(n.title, n.summary, n.category, n.image_url, n.link_url, n.published_at, n.source, schoolId, n.external_id);
          }
          if (rows.length) {
            const removeOld = db.prepare('DELETE FROM news WHERE school_id=? AND external_id IS NOT NULL AND external_id NOT IN (' + rows.map(() => '?').join(',') + ')');
            removeOld.run(schoolId, ...rows.map(n => n.external_id));
            // Remove notícias antigas fixas (sem external_id) para não duplicar as reais.
            db.prepare('DELETE FROM news WHERE school_id=? AND external_id IS NULL').run(schoolId);
          }
          db.exec('COMMIT');
        } catch (e) { db.exec('ROLLBACK'); throw e; }
        lastSyncAt = Date.now();
        lastStatus = { ok: true, synced: rows.length, error: null, at: new Date().toISOString() };
      } catch (e) {
        lastStatus = { ok: false, synced: 0, error: String(e?.message || e), at: new Date().toISOString() };
      } finally {
        inFlight = null;
      }
      return lastStatus;
    })();
    return inFlight;
  }

  // Sincroniza ao subir (não bloqueia o servidor) e periodicamente.
  sync().catch(() => {});
  setInterval(() => sync().catch(() => {}), TTL_MS).unref?.();

  // Endpoint público de diagnóstico (sem dados sensíveis).
  app.get('/api/news/status', (_req, res) => res.json({ ...lastStatus, ttlMs: TTL_MS }));

  // Força uma atualização imediata (útil para o botão "Atualizar notícias").
  app.post('/api/news/refresh', async (_req, res) => {
    const result = await sync({ force: true });
    res.status(result.ok ? 200 : 502).json(result);
  });

  // A rota de notícias do aluno passa a servir sempre a versão sincronizada.
  app.get('/api/news', auth, (_req, res) => {
    void sync().catch(() => {});
    const news = db.prepare('SELECT * FROM news WHERE school_id=? ORDER BY published_at DESC LIMIT 12').all(schoolId);
    res.json({ news, sync: lastStatus });
  });

  return { sync, status: () => lastStatus };
}
