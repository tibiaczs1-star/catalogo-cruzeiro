import { createHash } from 'node:crypto';

/**
 * Cache local de respostas de reforço.
 * Repete a resposta pronta para dúvidas iguais: zero custo, latência baixa.
 */
export function buildCache(db) {
  db.exec(`CREATE TABLE IF NOT EXISTS answer_cache(
    key TEXT PRIMARY KEY, subject TEXT NOT NULL, question TEXT NOT NULL,
    answer TEXT NOT NULL, hits INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );`);

  const digest = (subject, question) => createHash('sha256')
    .update(String(subject || '').toLowerCase().trim() + '|' + String(question || '').toLowerCase().replace(/\s+/g, ' ').trim())
    .digest('hex');

  return {
    get(subject, question) {
      const key = digest(subject, question);
      const row = db.prepare('SELECT answer FROM answer_cache WHERE key=?').get(key);
      if (row) db.prepare('UPDATE answer_cache SET hits=hits+1 WHERE key=?').run(key);
      return row?.answer || null;
    },
    findSimilar(subject, queryText) {
      const raw = String(queryText || '').toLowerCase().replace(/[^a-z0-9áéíóúãõâêîôûç\s]/gi, ' ');
      const terms = raw.split(/\s+/).filter(w => w.length >= 3 && !['como','onde','qual','quem','quando','porque','sobre','qual','para','pelo','pela','esse','essa','isso','aqui','deste','desta'].includes(w));
      if (!terms.length) return null;

      const rows = db.prepare(`SELECT key, subject, question, answer FROM answer_cache WHERE subject = ? OR ? = '' OR ? = 'todas'`).all(subject || '', subject || '', subject || '');
      let best = null;
      let maxScore = 0;
      for (const r of rows) {
        const textTarget = (r.question + ' ' + r.answer).toLowerCase();
        let score = 0;
        for (const t of terms) {
          if (textTarget.includes(t)) score++;
        }
        if (score > maxScore) {
          maxScore = score;
          best = r;
        }
      }
      if (best && maxScore >= 1) {
        db.prepare('UPDATE answer_cache SET hits=hits+1 WHERE key=?').run(best.key);
        return best.answer;
      }
      return null;
    },
    set(subject, question, answer) {
      const key = digest(subject, question);
      db.prepare('INSERT OR REPLACE INTO answer_cache(key,subject,question,answer) VALUES(?,?,?,?)')
        .run(key, subject, question, answer);
      return key;
    },
    stats() {
      return db.prepare('SELECT COUNT(*) entries, COALESCE(SUM(hits),0) hits FROM answer_cache').get();
    }
  };
}