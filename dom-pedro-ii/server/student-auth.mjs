
import { randomBytes } from 'node:crypto';
import { rateLimit } from 'express-rate-limit';

const THREE_DAYS = 3 * 24 * 60 * 60 * 1000;
const normalize = value => typeof value === 'string'
  ? value.trim().slice(0, 160).normalize('NFKD').replace(/\p{M}/gu, '').toLocaleLowerCase('pt-BR').replace(/\s+/g, ' ')
  : '';
const gradeKey = value => normalize(value).replace(/^(\d{1,2})[ao]?(?: (?:ano|serie)(?: [a-z])?)?$/, '$1');
const identity = ({firstName, secondName, grade} = {}) => [normalize(firstName), normalize(secondName), gradeKey(grade)];
const validIdentity = ([first, second, grade]) => first && second && grade && !first.includes(' ') && !second.includes(' ');
const forDirection = (req, res, next) => ['direction', 'admin'].includes(req.user.role)
  ? next()
  : res.status(403).json({error: 'Somente a direção pode liberar a troca de senha.'});

export function registerStudentAuth(app, {db, auth, loginIpLimiter, makeSession, tokenDigest, passwordHashAsync, passwordVerifyAsync}) {
  app.get('/api/auth/student/grades', loginIpLimiter, (req, res) => {
    const grades = db.prepare("SELECT DISTINCT grade FROM users WHERE role = 'student' AND grade IS NOT NULL AND TRIM(grade) <> '' ORDER BY grade").all().map(row => row.grade);
    res.set('Cache-Control', 'no-store').json({grades});
  });

  const transaction = work => {
    db.exec('BEGIN IMMEDIATE');
    try {
      const result = work();
      db.exec('COMMIT');
      return result;
    } catch (error) {
      db.exec('ROLLBACK');
      throw error;
    }
  };

  transaction(() => {
    const migrated = db.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name='student_password_requests'").get();
    db.exec(
      "CREATE TABLE IF NOT EXISTS student_password_requests (" +
      "id INTEGER PRIMARY KEY, protocol TEXT NOT NULL, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE," +
      "expires_at INTEGER NOT NULL, approved_by INTEGER REFERENCES users(id), grant_hash TEXT UNIQUE, UNIQUE(protocol,user_id));" +
      "CREATE INDEX IF NOT EXISTS student_password_expiry ON student_password_requests(expires_at);"
    );
    if (!migrated) {
      db.exec("DELETE FROM sessions WHERE user_id IN (SELECT id FROM users WHERE role='student'); DELETE FROM student_access;");
    }
  });

  const studentRows = db.prepare("SELECT u.*, s.name school_name FROM users u JOIN schools s ON s.id=u.school_id WHERE u.role='student' AND u.active=1");
  const matchingStudents = ([first, second, grade]) => studentRows.all().filter(user => {
    const [registeredFirst, registeredSecond] = normalize(user.name).split(' ');
    return registeredFirst === first && registeredSecond === second && gradeKey(user.grade) === grade;
  });

  const accountLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 12,
    skipSuccessfulRequests: true,
    keyGenerator: req => JSON.stringify(identity(req.body ?? {})),
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: {error: 'Muitas tentativas. Aguarde alguns minutos.'}
  });
  const recoveryLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 60,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: {error: 'Muitas solicitações. Aguarde alguns minutos.'}
  });

  app.post('/api/auth/student', loginIpLimiter, accountLimiter, async (req, res) => {
    const id = identity(req.body ?? {});
    const password = req.body?.password;
    const failure = {error: 'Confira seu primeiro nome, segundo nome, série e senha.'};
    if (!validIdentity(id) || typeof password !== 'string' || password.length < 1 || password.length > 200) return res.status(401).json(failure);
    const matched = [];
    for (const candidate of matchingStudents(id)) {
      if (await passwordVerifyAsync(password, candidate.password_hash)) matched.push(candidate);
      if (matched.length > 1) break;
    }
    if (matched.length !== 1) return res.status(401).json(failure);
    const user = matched[0];
    if (!db.prepare("SELECT 1 FROM users WHERE id=? AND password_hash=? AND active=1 AND role='student'").get(user.id, user.password_hash)) return res.status(401).json(failure);
    res.json(makeSession(user));
  });

  app.post('/api/auth/student/password-requests', recoveryLimiter, (req, res) => {
    const id = identity(req.body ?? {});
    if (!validIdentity(id)) return res.status(400).json({error: 'Informe seu primeiro nome, segundo nome e série.'});
    const protocol = randomBytes(6).toString('hex').toUpperCase();
    const now = Date.now();
    const expiresAt = now + THREE_DAYS;
    transaction(() => {
      db.prepare('DELETE FROM student_password_requests WHERE expires_at<=?').run(now);
      const save = db.prepare('INSERT INTO student_password_requests(protocol,user_id,expires_at) VALUES(?,?,?)');
      for (const user of matchingStudents(id)) save.run(protocol, user.id, expiresAt);
    });
    res.set('Cache-Control', 'no-store').status(202).json({protocol, expiresAt: new Date(expiresAt).toISOString()});
  });

  app.get('/api/team/student-password-requests', auth, forDirection, (req, res) => {
    const requests = db.prepare(
      "SELECT r.id, r.expires_at, u.name, u.grade, u.registration FROM student_password_requests r " +
      "JOIN users u ON r.user_id=u.id WHERE u.school_id=? AND u.role='student' AND u.active=1 " +
      "AND r.approved_by IS NULL AND r.expires_at>? ORDER BY r.id DESC LIMIT 100"
    ).all(req.user.school_id, Date.now()).map(({expires_at, ...row}) => ({...row, expiresAt: new Date(expires_at).toISOString()}));
    res.set('Cache-Control', 'no-store').json({requests});
  });

  app.post('/api/team/student-password-requests/:id/approve', auth, forDirection, (req, res) => {
    const protocol = String(req.body?.protocol ?? '').trim().toUpperCase();
    if (!/^[0-9A-F]{12}$/.test(protocol) || req.body?.identityConfirmed !== true) {
      return res.status(400).json({error: 'Informe o protocolo recebido do aluno e confirme a identidade no cadastro escolar.'});
    }
    const temporaryPassword = randomBytes(12).toString('base64url');
    const request = transaction(() => {
      const selected = db.prepare(
        "SELECT r.id, r.user_id, r.expires_at FROM student_password_requests r JOIN users u ON u.id=r.user_id " +
        "WHERE r.id=? AND r.protocol=? AND r.approved_by IS NULL AND r.expires_at>? AND u.school_id=? AND u.role='student' AND u.active=1"
      ).get(Number(req.params.id), protocol, Date.now(), req.user.school_id);
      if (!selected) return null;
      db.prepare('DELETE FROM student_password_requests WHERE user_id=? AND id<>? AND approved_by IS NOT NULL').run(selected.user_id, selected.id);
      db.prepare('UPDATE student_password_requests SET approved_by=?, grant_hash=? WHERE id=?').run(req.user.id, tokenDigest(temporaryPassword), selected.id);
      return selected;
    });
    if (!request) return res.status(404).json({error: 'Pedido vencido, já liberado ou protocolo incorreto.'});
    res.set('Cache-Control', 'no-store').json({temporaryPassword, expiresAt: new Date(request.expires_at).toISOString()});
  });

  const findGrant = db.prepare(
    "SELECT r.user_id FROM student_password_requests r JOIN users u ON u.id=r.user_id " +
    "WHERE r.grant_hash=? AND r.approved_by IS NOT NULL AND r.expires_at>? AND u.role='student' AND u.active=1"
  );
  app.post('/api/auth/student/password-reset', recoveryLimiter, async (req, res) => {
    const {temporaryPassword, newPassword} = req.body ?? {};
    const invalid = {error: 'Senha temporária inválida, utilizada ou vencida.'};
    if (typeof temporaryPassword !== 'string' || !/^[A-Za-z0-9_-]{16}$/.test(temporaryPassword.trim())) return res.status(400).json(invalid);
    if (typeof newPassword !== 'string' || newPassword.length < 10 || newPassword.length > 200) {
      return res.status(400).json({error: 'Crie uma senha de 10 a 200 caracteres.'});
    }
    const digest = tokenDigest(temporaryPassword.trim());
    if (!findGrant.get(digest, Date.now())) return res.status(400).json(invalid);
    const hash = await passwordHashAsync(newPassword);
    const changed = transaction(() => {
      const grant = findGrant.get(digest, Date.now());
      if (!grant) return false;
      db.prepare('UPDATE users SET password_hash=? WHERE id=?').run(hash, grant.user_id);
      db.prepare('DELETE FROM sessions WHERE user_id=?').run(grant.user_id);
      db.prepare('DELETE FROM student_password_requests WHERE user_id=?').run(grant.user_id);
      return true;
    });
    if (!changed) return res.status(400).json(invalid);
    res.json({ok: true});
  });
}

