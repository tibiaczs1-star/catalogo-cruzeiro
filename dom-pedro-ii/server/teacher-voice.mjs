import multer from 'multer';
import { execFile } from 'node:child_process';
import { FFMPEG_BIN } from './ffmpeg-bin.mjs';
import { randomUUID } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { extname, join } from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

export function getApprovedTeacherSample(db, dataDir, schoolId, teacherId) {
  if (!db || !dataDir || !teacherId) return null;
  const row = db.prepare(`
    SELECT filename FROM teacher_voice_samples
    WHERE school_id=? AND teacher_id=? AND status='approved'
    ORDER BY reviewed_at DESC, created_at DESC LIMIT 1
  `).get(schoolId, teacherId);
  if (!row) return null;
  const fullPath = join(dataDir, 'teacher-voices', row.filename);
  return existsSync(fullPath) ? fullPath : null;
}

export function registerTeacherVoice(app, { db, auth, dataDir }) {
  const folder = join(dataDir, 'teacher-voices');
  mkdirSync(folder, { recursive: true });
  db.exec(`CREATE TABLE IF NOT EXISTS teacher_voice_samples (
    id TEXT PRIMARY KEY, school_id INTEGER NOT NULL, teacher_id INTEGER NOT NULL,
    filename TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'pending',
    consent_version TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TEXT, reviewed_by INTEGER, revoked_at TEXT
  )`);
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 12 * 1024 * 1024, files: 1, fields: 3 }
  });
  const direction = user => ['admin', 'direction'].includes(user.role);
  const validateWav = b => {
    if (!b || b.length < 44 || b.toString('ascii', 0, 4) !== 'RIFF' || b.toString('ascii', 8, 12) !== 'WAVE' || b.readUInt32LE(4) + 8 !== b.length) return false;
    let fmt, bytes = 0;
    for (let p = 12; p + 8 <= b.length;) {
      const type = b.toString('ascii', p, p + 4), size = b.readUInt32LE(p + 4), start = p + 8;
      if (start + size > b.length) return false;
      if (type === 'fmt ' && size >= 16) fmt = { format: b.readUInt16LE(start), channels: b.readUInt16LE(start + 2), rate: b.readUInt32LE(start + 4), byteRate: b.readUInt32LE(start + 8), bits: b.readUInt16LE(start + 14) };
      if (type === 'data') bytes += size;
      p = start + size + (size % 2);
    }
    return !!fmt && fmt.format === 1 && [1, 2].includes(fmt.channels) && fmt.rate >= 8000 && fmt.rate <= 48000 && fmt.bits === 16 && fmt.byteRate === fmt.rate * fmt.channels * 2 && bytes > 0 && bytes / fmt.byteRate <= 120;
  };

  app.get('/api/team/teacher-voices', auth, (req, res) => {
    if (req.user.role !== 'teacher' && !direction(req.user)) return res.sendStatus(403);
    const rows = db.prepare(`SELECT v.id,v.status,v.created_at,v.reviewed_at,v.revoked_at,u.name AS teacher_name
      FROM teacher_voice_samples v JOIN users u ON u.id=v.teacher_id
      WHERE v.school_id=? AND (?=1 OR v.teacher_id=?) ORDER BY v.created_at DESC`).all(req.user.school_id, direction(req.user) ? 1 : 0, req.user.id);
    res.set('Cache-Control', 'no-store').json({ samples: rows });
  });

  app.post('/api/team/teacher-voices', auth, (req, res, next) => req.user.role === 'teacher' ? next() : res.sendStatus(403), upload.single('audio'), async (req, res) => {
    if (req.body.consent !== 'yes') return res.status(400).json({ error: 'Confirme sua autorização antes de enviar.' });
    if (!req.file?.buffer?.length) return res.status(400).json({ error: 'Envie um áudio válido (WAV, OGG, MP3, M4A ou WebM) de até 12 MB.' });

    const id = randomUUID();
    const filename = id + '.wav';
    const finalPath = join(folder, filename);
    const rawExt = (extname(req.file.originalname || '') || '.audio').replace(/[^a-z0-9.]/gi, '').slice(0, 8) || '.bin';
    const rawTmp = join(folder, `${id}.raw${rawExt}`);

    try {
      writeFileSync(rawTmp, req.file.buffer, { flag: 'wx', mode: 0o600 });
      await execFileAsync(FFMPEG_BIN, [
        '-y', '-loglevel', 'error', '-i', rawTmp,
        '-t', '60', '-af', 'highpass=f=75,loudnorm=I=-18:TP=-1.5:LRA=9',
        '-ar', '24000', '-ac', '1', '-c:a', 'pcm_s16le', finalPath
      ], { timeout: 30000, windowsHide: true });

      const converted = readFileSync(finalPath);
      if (!validateWav(converted)) {
        throw new Error('WAV convertido inválido');
      }
    } catch {
      try { if (existsSync(finalPath)) unlinkSync(finalPath); } catch {}
      try { if (existsSync(rawTmp)) unlinkSync(rawTmp); } catch {}
      return res.status(400).json({ error: 'Não foi possível processar o áudio. Envie um arquivo WAV, OGG, MP3, M4A ou WebM de até 12 MB.' });
    }
    try { if (existsSync(rawTmp)) unlinkSync(rawTmp); } catch {}

    try {
      db.prepare('INSERT INTO teacher_voice_samples(id,school_id,teacher_id,filename,consent_version) VALUES(?,?,?,?,?)')
        .run(id, req.user.school_id, req.user.id, filename, 'clone-v1');
    } catch (e) {
      try { unlinkSync(finalPath); } catch {}
      throw e;
    }
    res.status(201).json({ id, status: 'pending' });
  });

  app.post('/api/team/teacher-voices/:id/review', auth, (req, res) => {
    if (!direction(req.user)) return res.sendStatus(403);
    if (!['approved', 'rejected'].includes(req.body.status)) return res.sendStatus(400);
    const result = db.prepare("UPDATE teacher_voice_samples SET status=?,reviewed_at=CURRENT_TIMESTAMP,reviewed_by=? WHERE id=? AND school_id=? AND status='pending'").run(req.body.status, req.user.id, req.params.id, req.user.school_id);
    if (!result.changes) return res.sendStatus(404);
    res.json({ ok: true });
  });

  app.get('/api/team/teacher-voices/:id/audio', auth, (req, res) => {
    if (req.user.role !== 'teacher' && !direction(req.user)) return res.sendStatus(403);
    const row = db.prepare("SELECT filename FROM teacher_voice_samples WHERE id=? AND school_id=? AND status!='revoked' AND (?=1 OR teacher_id=?)").get(req.params.id, req.user.school_id, direction(req.user) ? 1 : 0, req.user.id);
    if (!row) return res.sendStatus(404);
    res.set('Cache-Control', 'no-store').type('audio/wav').sendFile(join(folder, row.filename));
  });

  app.delete('/api/team/teacher-voices/:id', auth, (req, res) => {
    if (req.user.role !== 'teacher') return res.sendStatus(403);
    const row = db.prepare("SELECT filename FROM teacher_voice_samples WHERE id=? AND school_id=? AND teacher_id=? AND status!='revoked'").get(req.params.id, req.user.school_id, req.user.id);
    if (!row) return res.sendStatus(404);
    try { unlinkSync(join(folder, row.filename)); } catch (e) { if (e.code !== 'ENOENT') throw e; }
    db.prepare("UPDATE teacher_voice_samples SET status='revoked',revoked_at=CURRENT_TIMESTAMP WHERE id=?").run(req.params.id);
    res.json({ ok: true });
  });
}
