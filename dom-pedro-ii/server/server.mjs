import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import multer from 'multer';
import { DatabaseSync } from 'node:sqlite';
import { randomBytes, scryptSync, scrypt, timingSafeEqual, createHash } from 'node:crypto';
import { promisify } from 'node:util';
import { mkdirSync, existsSync, readFileSync, unlinkSync } from 'node:fs';
import { dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { transcribeWav, isReady as sttReady } from './stt.mjs';
import { availableVoices, resolveVoicePreset, synthesize } from './tts.mjs';
import { registerStudentAuth } from './student-auth.mjs';
import { registerNewsSync } from './news-sync.mjs';
import { registerPedagogy } from './pedagogy.mjs';
import { registerTeacherVoice, getApprovedTeacherSample } from './teacher-voice.mjs';
import { TEACHERS_SEED } from './teachers-seed.mjs';
import { buildCache } from './cache.mjs';
import { demoAnswer } from './demo-answers.mjs';
import { tutorAnswer, hasTutorConfigured } from './tutor.mjs';
import { buildLongLesson, lessonToDynamicNarration, lessonToFullNarration } from './lesson-builder.mjs';
import { doubtToPdfBuffer, materialToPdfBuffer, buildZipBuffer } from './pdf.mjs';
import { FFMPEG_BIN } from './ffmpeg-bin.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const dataDir = resolve(process.env.ESCOLA_DATA_DIR || join(root, 'local-data'));
const demoMode = process.env.DEMO_MODE === '1';
const persistentDemoStudent = demoMode && process.env.PERSISTENT_DEMO_STUDENT !== '0' && process.env.DOM_PEDRO_PERSISTENT_DEMO !== '0';
const uploadDir = join(dataDir, 'uploads');
mkdirSync(uploadDir, { recursive: true });

const db = new DatabaseSync(join(dataDir, 'escola-viva.sqlite'));
db.exec(`
  PRAGMA journal_mode=WAL;
  PRAGMA foreign_keys=ON;
  CREATE TABLE IF NOT EXISTS schools(id INTEGER PRIMARY KEY, name TEXT NOT NULL, code TEXT UNIQUE NOT NULL);
  CREATE TABLE IF NOT EXISTS users(
    id INTEGER PRIMARY KEY, school_id INTEGER NOT NULL REFERENCES schools(id), registration TEXT NOT NULL,
    name TEXT NOT NULL, password_hash TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'student', grade TEXT,
    active INTEGER NOT NULL DEFAULT 1, anonymous_alias TEXT NOT NULL,
    first_login INTEGER NOT NULL DEFAULT 1, avatar TEXT DEFAULT 'gatao',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(school_id, registration)
  );
  CREATE TABLE IF NOT EXISTS student_profiles (
    user_id INTEGER PRIMARY KEY REFERENCES users(id),
    avatar TEXT NOT NULL DEFAULT 'gatao',
    nickname TEXT,
    fav_subject TEXT,
    hard_subject TEXT,
    learning_style TEXT,
    interests TEXT,
    feeling TEXT,
    completed_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS teachers (
    id INTEGER PRIMARY KEY,
    school_id INTEGER NOT NULL REFERENCES schools(id),
    name TEXT NOT NULL,
    disciplines TEXT NOT NULL,
    turmas TEXT,
    shift TEXT,
    contract TEXT,
    role TEXT,
    voice_preset TEXT NOT NULL,
    voice_name TEXT NOT NULL,
    voice_rate INTEGER NOT NULL DEFAULT 0,
    voice_pitch INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS sessions(token_hash TEXT PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id), expires_at TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS student_access(
    token_hash TEXT PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id),
    kind TEXT NOT NULL CHECK(kind IN ('activation','device')), expires_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS student_access_user ON student_access(user_id,kind);
  CREATE TABLE IF NOT EXISTS doubts(
    id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id), subject TEXT NOT NULL, text TEXT,
    audio_path TEXT, audio_mime TEXT, status TEXT NOT NULL DEFAULT 'received', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS tasks(
    id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id), title TEXT NOT NULL, subject TEXT NOT NULL,
    due_at TEXT, completed INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS materials(
    id INTEGER PRIMARY KEY, school_id INTEGER NOT NULL REFERENCES schools(id), subject TEXT NOT NULL, title TEXT NOT NULL,
    description TEXT NOT NULL, kind TEXT NOT NULL, published INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS messages(
    id INTEGER PRIMARY KEY, school_id INTEGER NOT NULL REFERENCES schools(id), user_id INTEGER NOT NULL REFERENCES users(id),
    channel TEXT NOT NULL, body TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS support_messages(
    id INTEGER PRIMARY KEY, school_id INTEGER NOT NULL REFERENCES schools(id), user_id INTEGER NOT NULL REFERENCES users(id),
    recipient TEXT NOT NULL, body TEXT NOT NULL, risk_flag INTEGER NOT NULL DEFAULT 0, status TEXT NOT NULL DEFAULT 'received',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS micro_lessons(
    id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id), title TEXT NOT NULL, script TEXT NOT NULL,
    format TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'review', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS news(
    id INTEGER PRIMARY KEY, school_id INTEGER NOT NULL REFERENCES schools(id), title TEXT NOT NULL, summary TEXT NOT NULL,
    category TEXT NOT NULL, image_url TEXT, link_url TEXT, published_at TEXT NOT NULL, source TEXT NOT NULL DEFAULT 'Portal CMDPII'
  );
`);

if (!db.prepare('PRAGMA table_info(student_profiles)').all().some(column => column.name === 'instructor_voice')) {
  db.exec("ALTER TABLE student_profiles ADD COLUMN instructor_voice TEXT NOT NULL DEFAULT 'chiquinho'");
}

const scryptAsync = promisify(scrypt);
db.exec(`CREATE TABLE IF NOT EXISTS campaigns(
  id INTEGER PRIMARY KEY, school_id INTEGER NOT NULL REFERENCES schools(id), title TEXT NOT NULL,
  description TEXT NOT NULL, kind TEXT NOT NULL DEFAULT 'participacao', reward TEXT,
  active INTEGER NOT NULL DEFAULT 1, starts_at TEXT, ends_at TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);`);

function passwordHash(password, salt = randomBytes(16).toString('hex')) {
  return `${salt}:${scryptSync(password, salt, 64).toString('hex')}`;
}
async function passwordHashAsync(password, salt = randomBytes(16).toString('hex')) {
  const derived = await scryptAsync(password, salt, 64);
  return `${salt}:${derived.toString('hex')}`;
}
function passwordMatches(password, stored) {
  const [salt, expectedHex] = stored.split(':');
  const actual = scryptSync(password, salt, 64);
  const expected = Buffer.from(expectedHex, 'hex');
  return expected.length === actual.length && timingSafeEqual(actual, expected);
}
async function passwordMatchesAsync(password, stored) {
  const [salt, expectedHex] = String(stored || '').split(':');
  if (!salt || !expectedHex) return false;
  const actual = await scryptAsync(password, salt, 64);
  const expected = Buffer.from(expectedHex, 'hex');
  return expected.length === actual.length && timingSafeEqual(actual, expected);
}
function tokenDigest(token) { return createHash('sha256').update('escola-viva-session-v1|' + token).digest('hex'); }
function cleanText(value, max = 2000) { return String(value ?? '').trim().slice(0, max); }

if (demoMode) {
db.prepare('INSERT OR IGNORE INTO schools(id,name,code) VALUES(1,?,?)').run('Escola Viva Demonstração', 'VIVA001');
if (!db.prepare('SELECT id FROM users WHERE school_id=1 AND registration=?').get('2026001')) {
  db.prepare(`INSERT INTO users(school_id,registration,name,password_hash,role,grade,anonymous_alias)
              VALUES(1,?,?,?,?,?,?)`).run('2026001', 'Aluno Demonstração', passwordHash('Aluno@123'), 'student', '8º ano', 'Estudante Horizonte 27');
}
// Conta reservada para teste persistente; nunca zera nem sobrescreve dados existentes.
if (!db.prepare('SELECT id FROM users WHERE school_id=1 AND registration=?').get('TESTEADMIN')) {
  db.prepare(`INSERT INTO users(school_id,registration,name,password_hash,role,grade,anonymous_alias,first_login,active)
              VALUES(1,?,?,?,?,?,?,0,1)`).run('TESTEADMIN', 'Aluno Teste', passwordHash('admin'), 'student', '8º ano', 'Estudante de teste');
} else {
  db.prepare("UPDATE users SET active=1, first_login=0, name=CASE WHEN name='Admin Admin' THEN 'Aluno Teste' ELSE name END WHERE school_id=1 AND registration='TESTEADMIN'").run();
}
const testeAdminUser = db.prepare('SELECT id FROM users WHERE school_id=1 AND registration=?').get('TESTEADMIN');
if (testeAdminUser) {
  db.prepare("INSERT OR IGNORE INTO student_profiles(user_id, avatar, nickname, instructor_voice) VALUES(?, 'gatao', 'Aluno Teste', 'naira')").run(testeAdminUser.id);
}
for (const reg of ['2026001', 'TESTEADMIN']) {
  const demoUser = db.prepare('SELECT id FROM users WHERE registration=?').get(reg);
  if (demoUser && !db.prepare('SELECT id FROM tasks WHERE user_id=?').get(demoUser.id)) {
    db.prepare('INSERT INTO tasks(user_id,title,subject,due_at,completed) VALUES(?,?,?,?,?)').run(demoUser.id, 'Leitura do capítulo 4', 'Português', null, 0);
  }
}
if (!db.prepare('SELECT id FROM materials WHERE school_id=1').get()) {
  db.prepare('INSERT INTO materials(school_id,subject,title,description,kind) VALUES(1,?,?,?,?)').run('Português', 'Interpretação de texto', 'Guia de leitura com perguntas comentadas.', 'guia');
}

if (!db.prepare('SELECT id FROM news WHERE school_id=1').get()) {
  const add = db.prepare('INSERT INTO news(school_id,title,summary,category,image_url,link_url,published_at) VALUES(1,?,?,?,?,?,?)');
  add.run('Handebol feminino sub-18 é campeão do Open de Handebol', 'A final foi disputada no domingo, 21, contra a equipe da Escola Djalma da Cunha Batista. As atletas do CMDPII-CZS garantiram o título da etapa Cruzeiro do Sul.', 'Esportivo', 'https://axoriin-alunos-fotos.s3.sa-east-1.amazonaws.com/site/cmdpii-czs/1782238491041-IMG_4344.jpg', 'https://colegiodompedro2czs.com.br/site-cmdpii/noticias.html', '2026-06-23T18:21:57.565Z');
  add.run('Acre em destaque na final nacional da 18ª ONHB', 'Pelo 4º ano consecutivo, o colégio assegura presença na fase nacional da Olimpíada Nacional em História do Brasil.', 'Acadêmico', 'https://axoriin-alunos-fotos.s3.sa-east-1.amazonaws.com/site/cmdpii-czs/1780671920331-pA-dium-xadrez-2026.jpg', 'https://colegiodompedro2czs.com.br/site-cmdpii/noticias.html', '2026-06-22T12:00:00.000Z');
  add.run('Desfile cívico reúne famílias no campus', 'Estudantes e famílias participaram do desfile cívico promovido pela unidade, reforçando o lema Saber, Honra e Disciplina.', 'Institucional', 'https://axoriin-alunos-fotos.s3.sa-east-1.amazonaws.com/site/cmdpii-czs/1780604916623-desfile-civico.jpg', 'https://colegiodompedro2czs.com.br/site-cmdpii/galeria.html', '2026-06-01T15:00:00.000Z');
}

if (!db.prepare('SELECT id FROM campaigns WHERE school_id=1').get()) {
  const add = db.prepare('INSERT INTO campaigns(school_id,title,description,kind,reward,starts_at,ends_at) VALUES(1,?,?,?,?,?,?)');
  add.run('Convide para acompanhar a escola', 'Compartilhe o link oficial. O ponto só é validado quando a pessoa indicada acessa e confirma o acompanhamento.', 'indicacao', 'Selo de embaixador + menção no mural', '2026-11-01', '2026-11-30');
  add.run('Agora sou eu, professor', 'Crie uma microaula sobre um assunto que você domina. Um professor revisa antes de publicar para a escola.', 'microaula', 'Publicação na biblioteca da turma', '2026-11-01', '2026-12-15');
}

{
  const teacherCount = db.prepare('SELECT COUNT(*) AS n FROM teachers WHERE school_id=1').get()?.n || 0;
  if (demoMode && teacherCount < TEACHERS_SEED.length) {
    db.prepare('INSERT OR IGNORE INTO schools(id,name,code) VALUES(1,?,?)').run('Escola Viva Demonstração', 'VIVA001');
    const upsertT = db.prepare(`INSERT OR REPLACE INTO teachers(id,school_id,name,disciplines,turmas,shift,contract,role,voice_preset,voice_name,voice_rate)
      VALUES(?,1,?,?,?,?,?,?,?,?,?)`);
    db.exec('BEGIN');
    try {
      for (const t of TEACHERS_SEED) {
        upsertT.run(t.id, t.name, t.disciplines, t.turmas, t.shift, t.contract, t.role, t.voice_preset, t.voice_name, t.voice_rate || 0);
      }
      db.exec('COMMIT');
    } catch (e) { db.exec('ROLLBACK'); throw e; }
  }
}

}

function profileVoiceFor(instructorVoice) {
  if (instructorVoice === 'naira') return 'prof_naira';
  return 'prof_naira';
}

function findTeacherApprovedSample(schoolId, teacherName) {
  if (!teacherName) return null;
  const firstTwo = String(teacherName).trim().split(/\s+/).slice(0, 2).join(' ');
  const u = db.prepare("SELECT id FROM users WHERE school_id=? AND role='teacher' AND LOWER(name) LIKE LOWER(?) LIMIT 1").get(schoolId, `${firstTwo}%`);
  return u ? getApprovedTeacherSample(db, dataDir, schoolId, u.id) : null;
}

const app = express();
app.set('trust proxy', 1);
app.use((_req, res, next) => {
  res.setHeader('Permissions-Policy', 'microphone=(self)');
  next();
});
app.use('/api', (req,res,next) => {
  res.setHeader('Cache-Control','no-store');
  res.setHeader('Access-Control-Expose-Headers', 'X-Voice-Engine');
  const origin = req.headers.origin;
  const allowed = ['https://localhost','capacitor://localhost', ...(process.env.ALLOWED_ORIGINS || '').split(',').filter(Boolean)];
  if (origin && allowed.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin',origin);
    res.setHeader('Vary','Origin');
    res.setHeader('Access-Control-Allow-Headers','Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Methods','GET, POST, PATCH, OPTIONS');
  }
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});
app.disable('x-powered-by');
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
app.use(express.json({ limit: '256kb' }));
const loginIpLimiter = rateLimit({
  windowMs: 15*60*1000,
  limit: Number(process.env.LOGIN_IP_LIMIT || 400),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Muitas tentativas deste local. Aguarde alguns minutos.' }
});
const loginAccountLimiter = rateLimit({
  windowMs: 15*60*1000,
  limit: Number(process.env.LOGIN_ACCOUNT_LIMIT || 12),
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: req => String(req.body?.schoolCode || '') + '|' + String(req.body?.registration || ''),
  message: { error: 'Muitas tentativas para esta matrícula. Aguarde alguns minutos.' }
});
app.use('/api/auth/login', loginIpLimiter, loginAccountLimiter);

/* ---------- métricas simples de uso ---------- */
const ANSWER_CACHE = buildCache(db);
const voiceMetrics = { replies: 0, failures: 0 };
const tutorMetrics = { answered: 0, forwarded: 0, unavailable: 0 };
const startedAt = Date.now();
const metrics = {
  requests: 0,
  byRoute: new Map(),
  errors: 0,
  latency: [],
  startedAt
};
app.use('/api', (req, res, next) => {
  const t0 = performance.now();
  metrics.requests++;
  const key = `${req.method} ${req.path.replace(/\/\d+/g, '/:id')}`;
  res.on('finish', () => {
    if (res.statusCode >= 500) metrics.errors++;
    metrics.byRoute.set(key, (metrics.byRoute.get(key) || 0) + 1);
    metrics.latency.push(performance.now() - t0);
    if (metrics.latency.length > 5000) metrics.latency.splice(0, 1000);
  });
  next();
});

function readCookie(req, name) {
  const raw = String(req.headers.cookie || '');
  if (!raw) return '';
  for (const part of raw.split(';')) {
    const eq = part.indexOf('=');
    if (eq <= 0) continue;
    if (part.slice(0, eq).trim() === name) {
      const val = part.slice(eq + 1).trim();
      try { return decodeURIComponent(val); } catch { return val; }
    }
  }
  return '';
}

function getPersistentDemoUser() {
  return db.prepare(`SELECT u.id,u.school_id,u.registration,u.name,u.role,u.grade,u.active,u.anonymous_alias,u.first_login,u.avatar,s.name AS school_name
    FROM users u JOIN schools s ON s.id=u.school_id
    WHERE u.school_id=1 AND u.role='student' AND u.active=1 AND u.registration IN ('TESTEADMIN','2026001')
    ORDER BY CASE WHEN u.registration='TESTEADMIN' THEN 0 ELSE 1 END LIMIT 1`).get();
}

function auth(req, res, next) {
  const bearer = (req.headers.authorization || '').replace(/^Bearer\s+/i, '').trim();
  const token = bearer || readCookie(req, 'dpii_demo_token');
  let row = null;
  if (token) {
    row = db.prepare(`SELECT u.id,u.school_id,u.registration,u.name,u.role,u.grade,u.active,u.anonymous_alias,u.first_login,u.avatar
      FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=? AND julianday(s.expires_at)>julianday('now')`).get(tokenDigest(token));
  }
  const rawPath = req.originalUrl.split('?')[0];
  const path = rawPath.startsWith('/dom-pedro-ii/') ? rawPath.slice('/dom-pedro-ii'.length) : rawPath;
  if (!row || !row.active) {
    const isProtectedArea = path.startsWith('/api/team/') || path.startsWith('/api/admin/') || path.startsWith('/api/developer/') || path === '/api/auth/logout';
    if (persistentDemoStudent && !isProtectedArea) {
      const demoUser = getPersistentDemoUser();
      if (demoUser && demoUser.active) {
        req.user = demoUser;
        return next();
      }
    }
    return res.status(401).json({ error: token ? 'Sessão inválida ou aluno inativo.' : 'Autenticação necessária.' });
  }
  req.user = row;
  const common = path === '/api/me' || path === '/api/auth/logout' || path.startsWith('/api/voice/');
  if (row.role === 'developer' && !common && !path.startsWith('/api/developer/')) return res.status(403).json({error:'Perfil técnico sem acesso a informações dos alunos.'});
  const directionTeacherAccess = (path === '/api/teachers' || path.startsWith('/api/teachers/'));
  if (['teacher','pedagogy','direction','admin'].includes(row.role) && !common && !directionTeacherAccess && !path.startsWith('/api/team/')) return res.status(403).json({error:'Use o painel da equipe escolar.'});
  next();
}

const voiceLimiter = rateLimit({windowMs:60000,limit:24,keyGenerator:req=>String(req.user.id),standardHeaders:'draft-8',legacyHeaders:false});
app.use('/api/voice', auth, voiceLimiter);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, `${req.user.id}-${Date.now()}-${randomBytes(6).toString('hex')}${extname(file.originalname).slice(0,8) || '.webm'}`)
});
const upload = multer({
  storage,
  limits: { fileSize: 15*1024*1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    const mimeOk = /^(audio\/|video\/webm|application\/ogg|application\/octet-stream)/i.test(file.mimetype || '');
    const extOk = /\.(webm|ogg|m4a|mp4|wav|mp3|aac|opus)$/i.test(file.originalname || '');
    cb(null, mimeOk || extOk);
  }
});

app.get('/api/health', (_req, res) => res.json({ ok: true, service: 'Escola Viva local', demoMode, persistentDemo: persistentDemoStudent, database: 'sqlite', time: new Date().toISOString() }));
function makeSession(user, { ttlDays = 7 } = {}) {
  const days = (persistentDemoStudent && user?.registration === 'TESTEADMIN') ? Math.max(ttlDays, 365) : ttlDays;
  const token = randomBytes(32).toString('base64url');
  db.prepare('INSERT INTO sessions(token_hash,user_id,expires_at) VALUES(?,?,?)').run(tokenDigest(token), user.id, new Date(Date.now()+days*86400000).toISOString());
  return { token, user: { id:user.id, name:user.name, role:user.role, grade:user.grade, school:user.school_name, alias:user.anonymous_alias, first_login:user.first_login ?? 1, avatar:user.avatar || 'gatao' } };
}
registerStudentAuth(app, {db, auth, loginIpLimiter, makeSession, tokenDigest, passwordHashAsync, passwordVerifyAsync: passwordMatchesAsync});
registerNewsSync(app, {db, auth, schoolId: 1});
app.post('/api/auth/demo', (req, res) => {
  if (!demoMode) return res.status(404).json({ error: 'Modo demonstração desativado.' });
  const user = getPersistentDemoUser();
  if (!user) return res.status(404).json({ error: 'Aluno de demonstração indisponível.' });
  const ttlDays = persistentDemoStudent ? 365 : 7;
  const session = makeSession(user, { ttlDays });
  const isSecure = Boolean(req.secure || String(req.headers['x-forwarded-proto'] || '').toLowerCase().includes('https'));
  const cookieParts = [
    `dpii_demo_token=${encodeURIComponent(session.token)}`,
    'Path=/',
    `Max-Age=${ttlDays * 86400}`,
    'SameSite=Lax',
    'HttpOnly'
  ];
  if (isSecure) cookieParts.push('Secure');
  res.setHeader('Set-Cookie', cookieParts.join('; '));
  res.json(session);
});
app.post('/api/auth/login', async (req, res, next) => {
  try {
  const school = cleanText(req.body.schoolCode, 30).toUpperCase();
  const registration = cleanText(req.body.registration, 50);
  if (school === 'VIVA001' && registration === 'ADMIN001') return res.status(401).json({ error: 'Escola, matrícula ou senha inválida.' });
  const user = db.prepare(`SELECT u.*,s.name school_name FROM users u JOIN schools s ON s.id=u.school_id
    WHERE s.code=? AND u.registration=?`).get(school, registration);
  if (!user || user.role === 'student' || !user.active || !(await passwordMatchesAsync(String(req.body.password || ''), user.password_hash))) return res.status(401).json({ error: 'Escola, matrícula ou senha inválida.' });
  res.json(makeSession(user));
  } catch (error) { next(error); }
});
app.post('/api/auth/logout', auth, (req, res) => {
  const bearer = (req.headers.authorization || '').replace(/^Bearer\s+/i, '').trim();
  const token = bearer || readCookie(req, 'dpii_demo_token');
  if (token) db.prepare('DELETE FROM sessions WHERE token_hash=?').run(tokenDigest(token));
  res.setHeader('Set-Cookie', 'dpii_demo_token=; Path=/; Max-Age=0; SameSite=Lax; HttpOnly');
  res.status(204).end();
});
app.get('/api/me', auth, (req, res) => res.json({ user:req.user }));
app.get('/api/me/profile', auth, (req, res) => {
  const profile = db.prepare('SELECT * FROM student_profiles WHERE user_id=?').get(req.user.id);
  res.json({
    first_login: req.user.first_login ?? 1,
    avatar: req.user.avatar || 'gatao',
    profile: profile || null
  });
});
app.post('/api/me/profile', auth, (req, res) => {
  const avatar = cleanText(req.body.avatar, 50) || 'gatao';
  const nickname = cleanText(req.body.nickname, 80) || req.user.name.split(' ')[0];
  const fav_subject = cleanText(req.body.fav_subject, 100);
  const hard_subject = cleanText(req.body.hard_subject, 100);
  const learning_style = cleanText(req.body.learning_style, 100);
  const interests = cleanText(req.body.interests, 300);
  const feeling = cleanText(req.body.feeling, 100);
  const previous = db.prepare('SELECT instructor_voice FROM student_profiles WHERE user_id=?').get(req.user.id);
  const instructor = req.body.instructor_voice ?? previous?.instructor_voice ?? 'chiquinho';
  if (!['naira', 'chiquinho', 'rosinha'].includes(instructor)) return res.status(400).json({error:'Instrutor inválido.'});

  db.prepare(`
    INSERT INTO student_profiles (user_id, avatar, nickname, fav_subject, hard_subject, learning_style, interests, feeling, completed_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    ON CONFLICT(user_id) DO UPDATE SET
      avatar=excluded.avatar,
      nickname=excluded.nickname,
      fav_subject=excluded.fav_subject,
      hard_subject=excluded.hard_subject,
      learning_style=excluded.learning_style,
      interests=excluded.interests,
      feeling=excluded.feeling,
      completed_at=datetime('now')
  `).run(req.user.id, avatar, nickname, fav_subject, hard_subject, learning_style, interests, feeling);

  db.prepare('UPDATE student_profiles SET instructor_voice=? WHERE user_id=?').run(instructor, req.user.id);
  db.prepare('UPDATE users SET avatar=?, first_login=0 WHERE id=?').run(avatar, req.user.id);
  res.json({ ok: true, avatar, nickname, first_login: 0 });
});

app.get('/api/voices', auth, (_req, res) => {
  res.json({ voices: availableVoices() });
});

app.get('/api/teachers', auth, (req, res) => {
  const teachers = db.prepare('SELECT id,name,disciplines,turmas,shift,voice_preset,voice_name,voice_rate FROM teachers WHERE school_id=? ORDER BY name').all(req.user.school_id);
  res.json({ teachers });
});

app.get('/api/teachers/:id/speak', auth, voiceLimiter, async (req, res, next) => {
  try {
    const prof = db.prepare('SELECT * FROM teachers WHERE id=? AND school_id=?').get(Number(req.params.id), req.user.school_id);
    if (!prof) return res.status(404).json({ error: 'Professor não encontrado.' });
    const cleanFirstName = prof.name.split(',')[0].trim().split(' ')[0];
    const isFem = !prof.voice_preset.includes('fallback');
    const art = isFem ? 'a professora' : 'o professor';
    const phrase = `Olá! Sou ${art} ${cleanFirstName}, da disciplina de ${prof.disciplines.split('/')[0].trim()}. Seja bem-vindo ao Dom Pedro Segundo Voice, estou aqui para te ajudar nos estudos!`;
    const refWav = findTeacherApprovedSample(req.user.school_id, prof.name);
    const wav = await synthesize(phrase, { voice: prof.voice_preset, rate: prof.voice_rate, refWav });
    if (wav?.voiceEngine) res.setHeader('X-Voice-Engine', wav.voiceEngine);
    res.type('audio/wav').send(wav);
  } catch(err) { next(err); }
});

app.get('/api/admin/students', auth, (req,res) => {
  if (!['admin','direction'].includes(req.user.role)) return res.status(403).json({error:'Acesso restrito à gestão.'});
  res.json({students:db.prepare(`SELECT id,registration,name,grade,active,anonymous_alias,created_at FROM users
    WHERE school_id=? AND role='student' ORDER BY name`).all(req.user.school_id)});
});
app.post('/api/admin/students', auth, async (req,res,next) => {
  try {
  if (!['admin','direction'].includes(req.user.role)) return res.status(403).json({error:'Acesso restrito à gestão.'});
  const registration=cleanText(req.body.registration,50), name=cleanText(req.body.name,160), grade=cleanText(req.body.grade,80);
  const password=String(req.body.password || '');
  if (!registration || !name || password.length<8) return res.status(400).json({error:'Informe matrícula, nome e senha com ao menos 8 caracteres.'});
  {
    const alias=`Estudante ${['Horizonte','Aurora','Cometa','Estrela','Atlas'][Math.floor(Math.random()*5)]} ${Math.floor(10+Math.random()*89)}`;
    const result=db.prepare(`INSERT INTO users(school_id,registration,name,password_hash,role,grade,anonymous_alias)
      VALUES(?,?,?,?, 'student',?,?)`).run(req.user.school_id,registration,name,await passwordHashAsync(password),grade||null,alias);
    res.status(201).json({id:Number(result.lastInsertRowid),registration,name,grade,active:true,alias});
  }
  } catch (error) {
    if (String(error.message).includes('UNIQUE')) return res.status(409).json({error:'Esta matrícula já está cadastrada.'});
    next(error);
  }
});
app.get('/api/school', (_req, res) => res.json({
  name: 'Colégio Dom Pedro II',
  campus: 'Campus CZS Sul',
  motto: 'Saber, Honra e Disciplina',
  site: 'https://colegiodompedro2czs.com.br/site-cmdpii/index.html',
  stats: { students: 878, years: 7, awards: 38 },
  city: 'Cruzeiro do Sul — AC',
  contact: 'contato@colegiodompedro2czs.com.br'
}));
app.get('/api/summary', auth, (req, res) => {
  const pending = db.prepare('SELECT COUNT(*) n FROM tasks WHERE user_id=? AND completed=0').get(req.user.id).n;
  const late = db.prepare("SELECT COUNT(*) n FROM tasks WHERE user_id=? AND completed=0 AND due_at IS NOT NULL AND due_at < datetime('now')").get(req.user.id).n;
  const materials = db.prepare('SELECT COUNT(*) n FROM materials WHERE school_id=? AND published=1').get(req.user.school_id).n;
  const doubts = db.prepare('SELECT COUNT(*) n FROM doubts WHERE user_id=?').get(req.user.id).n;
  res.json({ pending, late, materials, doubts, alias: req.user.anonymous_alias });
});
app.patch('/api/me', auth, (req, res) => {
  const name = cleanText(req.body.name, 160);
  if (!name) return res.status(400).json({ error: 'Informe seu nome.' });
  db.prepare('UPDATE users SET name=? WHERE id=?').run(name, req.user.id);
  res.json({ ok: true, name });
});
app.get('/api/tasks', auth, (req,res) => res.json({ tasks:db.prepare('SELECT * FROM tasks WHERE user_id=? ORDER BY completed,due_at').all(req.user.id) }));
app.patch('/api/tasks/:id', auth, (req,res) => {
  const completed = req.body.completed ? 1 : 0;
  const result = db.prepare('UPDATE tasks SET completed=? WHERE id=? AND user_id=?').run(completed, Number(req.params.id), req.user.id);
  if (!result.changes) return res.status(404).json({error:'Atividade não encontrada.'});
  res.json({ok:true,completed:Boolean(completed)});
});
db.exec(`CREATE TABLE IF NOT EXISTS lesson_reactions(
   doubt_id INTEGER PRIMARY KEY REFERENCES doubts(id), rating INTEGER, material_id INTEGER REFERENCES materials(id), grade TEXT
 )`);
try { db.exec("ALTER TABLE lesson_reactions ADD COLUMN feedback_note TEXT;"); } catch(_) {}
try { db.exec("ALTER TABLE lesson_reactions ADD COLUMN confirmed_at TEXT;"); } catch(_) {}
try { db.exec("ALTER TABLE doubts ADD COLUMN answer TEXT;"); } catch(_) {}
try { db.exec("ALTER TABLE doubts ADD COLUMN voice TEXT;"); } catch(_) {}
try { db.exec("ALTER TABLE doubts ADD COLUMN lesson_json TEXT;"); } catch(_) {}
try { db.exec("ALTER TABLE doubts ADD COLUMN redo_count INTEGER NOT NULL DEFAULT 0;"); } catch(_) {}
try { db.exec("ALTER TABLE doubts ADD COLUMN needs_human_review INTEGER NOT NULL DEFAULT 0;"); } catch(_) {}
try { db.exec("ALTER TABLE doubts ADD COLUMN feedback_note TEXT;"); } catch(_) {}

app.post('/api/doubts/:id/reaction', auth, (req,res) => {
  const row=db.prepare('SELECT d.id,d.subject,d.answer,u.grade FROM doubts d JOIN users u ON u.id=d.user_id WHERE d.id=? AND d.user_id=?').get(req.params.id,req.user.id);
  if(!row?.answer) return res.status(404).json({error:'Explicação indisponível.'});
  const {rating,share}=req.body;
  const feedbackNote = cleanText(req.body.feedbackNote, 500) || null;
  if(share!==true && !(Number.isInteger(rating)&&rating>=1&&rating<=5)) return res.status(400).json({error:'Escolha uma nota de 1 a 5.'});
  db.exec('BEGIN');
  try {
    db.prepare('INSERT OR IGNORE INTO lesson_reactions(doubt_id,grade) VALUES(?,?)').run(row.id,row.grade);
    if(share===true){
      if(!db.prepare('SELECT material_id FROM lesson_reactions WHERE doubt_id=?').get(row.id).material_id){
        const material=db.prepare('INSERT INTO materials(school_id,subject,title,description,kind,published) VALUES(?,?,?,?,?,0)').run(req.user.school_id,row.subject,'Reforço de '+row.subject,row.answer,'material');
        db.prepare('UPDATE lesson_reactions SET material_id=? WHERE doubt_id=?').run(material.lastInsertRowid,row.id);
      }
    } else {
      db.prepare('UPDATE lesson_reactions SET rating=?, feedback_note=?, confirmed_at=CURRENT_TIMESTAMP WHERE doubt_id=?').run(rating, feedbackNote, row.id);
      if (rating <= 2) {
        db.prepare('UPDATE doubts SET needs_human_review=1, feedback_note=? WHERE id=?').run(feedbackNote || 'Aluno avaliou com nota baixa e solicitou clareza.', row.id);
      } else if (feedbackNote) {
        db.prepare('UPDATE doubts SET feedback_note=? WHERE id=?').run(feedbackNote, row.id);
      }
    }
    db.exec('COMMIT');
    res.json({
      ok: true,
      confirmed: true,
      rating: share === true ? undefined : rating,
      feedbackNote,
      suggestRedo: share !== true && rating <= 3,
      needsHumanReview: share !== true && rating <= 2
    });
  } catch(e){db.exec('ROLLBACK');throw e;}
});

app.post('/api/doubts/:id/redo', auth, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const row = db.prepare('SELECT * FROM doubts WHERE id=? AND user_id=?').get(id, req.user.id);
    if (!row) return res.status(404).json({ error: 'Dúvida não encontrada.' });
    const feedbackNote = cleanText(req.body.feedbackNote, 500) || row.feedback_note || '';
    const detailMode = req.body.detailMode === 'longer_5_7m' ? 'longer_5_7m' : 'simpler';
    const profile = db.prepare('SELECT instructor_voice FROM student_profiles WHERE user_id=?').get(req.user.id);
    const profileVoice = profileVoiceFor(profile?.instructor_voice);
    const preset = resolveVoicePreset(req.body.voice || row.voice || profileVoice);
    const nextRedo = Number(row.redo_count || 0) + 1;

    let lesson = null;
    let answer = null;
    let aiGenerated = false;
    let needsHumanReview = false;
    const questionText = row.text || `Dúvida de ${row.subject}`;

    if (hasTutorConfigured() && row.text) {
      try {
        const priorCount = db.prepare('SELECT COUNT(*) n FROM doubts WHERE user_id=? AND subject=?').get(req.user.id, row.subject).n;
        const previousQuestions = db.prepare('SELECT text FROM doubts WHERE user_id=? AND subject=? AND text IS NOT NULL AND id<>? ORDER BY id DESC LIMIT 3').all(req.user.id, row.subject, id).map(r => r.text);
        const generated = await tutorAnswer({ subject: row.subject, question: questionText, priorCount, previousQuestions, feedbackNote, detailMode });
        if (generated) {
          lesson = generated;
          answer = generated.steps.map(s => `${s.title}\n${s.text}`).join('\n\n');
          aiGenerated = true;
          tutorMetrics.answered++;
        }
      } catch (_) {}
    }

    if (!lesson) {
      let shortBase = demoAnswer(row.subject, questionText) || ANSWER_CACHE.get(row.subject, questionText) || ANSWER_CACHE.findSimilar(row.subject, questionText) || '';
      if (!shortBase && row.lesson_json) {
        try {
          const prev = JSON.parse(row.lesson_json);
          const first = String(prev?.steps?.[0]?.text || '');
          const m = first.match(/Resposta direta e segura para começar:\s*([\s\S]+)/i);
          if (m) shortBase = m[1].split('Antes de avançar,')[0].trim();
        } catch (_) {}
      }
      if (!shortBase && row.answer && !/1\.\s*(?:Abertura da aula|Nova versão acolhedora)/i.test(row.answer)) {
        shortBase = String(row.answer).slice(0, 320);
      }
      const built = buildLongLesson({
        subject: row.subject,
        question: questionText,
        baseAnswer: shortBase,
        voicePreset: preset.id,
        feedbackNote,
        redoCount: nextRedo,
        mode: detailMode
      });
      lesson = built.lesson;
      answer = built.answer;
      needsHumanReview = built.needsHumanReview;
    }

    db.prepare("UPDATE doubts SET answer=?, lesson_json=?, voice=?, redo_count=?, feedback_note=?, status=? WHERE id=?")
      .run(answer, JSON.stringify(lesson), preset.id, nextRedo, feedbackNote || null, needsHumanReview ? 'received' : 'suggested', id);
    db.prepare('UPDATE lesson_reactions SET rating=NULL, confirmed_at=NULL WHERE doubt_id=?').run(id);

    res.json({
      ok: true,
      id,
      status: needsHumanReview ? 'received' : 'suggested',
      answer,
      lesson,
      voice: preset.id,
      instructor: preset.gender === 'F' ? (preset.id === 'prof_naira' ? 'naira' : 'rosinha') : 'chiquinho',
      redo_count: nextRedo,
      feedbackNote,
      source: aiGenerated ? 'ai_tutor' : 'redo_tutor'
    });
  } catch (err) { next(err); }
});
try { db.exec("ALTER TABLE materials ADD COLUMN reviewed_by TEXT;"); } catch(_) {}
try { db.exec("ALTER TABLE materials ADD COLUMN reviewed_at TEXT;"); } catch(_) {}
app.get('/api/team/material-review',auth,(req,res)=>{
  if(!['direction','admin'].includes(req.user.role))return res.sendStatus(403);
  res.json({items:db.prepare('SELECT m.*, d.text AS student_question FROM materials m JOIN lesson_reactions r ON r.material_id=m.id LEFT JOIN doubts d ON d.id=r.doubt_id WHERE m.school_id=? AND m.published=0 ORDER BY m.created_at DESC').all(req.user.school_id)});
});
app.post('/api/team/material-review/:id',auth,(req,res)=>{
  if(!['direction','admin'].includes(req.user.role))return res.sendStatus(403);
  if(!['approve','reject'].includes(req.body.action))return res.sendStatus(400);
  const nextStatus = req.body.action==='approve'?1:-1;
  const reviewer = req.body.action==='approve' ? (req.user.name || 'Equipe Escolar') : null;
  const changed=db.prepare('UPDATE materials SET published=?, reviewed_by=?, reviewed_at=CURRENT_TIMESTAMP WHERE school_id=? AND id=? AND published=0 AND id IN (SELECT material_id FROM lesson_reactions)').run(nextStatus,reviewer,req.user.school_id,req.params.id);
  if(!changed.changes)return res.sendStatus(404);
  res.json({ok:true});
});
app.get('/api/materials', auth, (req,res) => {
  const materials = db.prepare('SELECT m.*, r.doubt_id AS shared_doubt_id FROM materials m LEFT JOIN lesson_reactions r ON r.material_id=m.id WHERE m.school_id=? AND m.published=1 AND (r.doubt_id IS NULL OR r.grade=(SELECT grade FROM users WHERE id=?)) ORDER BY m.created_at DESC').all(req.user.school_id,req.user.id);
  const pendingMaterials = db.prepare('SELECT m.*, r.doubt_id AS shared_doubt_id, r.grade AS target_grade FROM materials m JOIN lesson_reactions r ON r.material_id=m.id JOIN doubts d ON d.id=r.doubt_id WHERE m.school_id=? AND d.user_id=? AND m.published=0 ORDER BY m.created_at DESC').all(req.user.school_id,req.user.id);
  res.json({ materials, pendingMaterials });
});
app.get('/api/materials/:id', auth, (req,res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'Material inválido.' });
  const row = db.prepare(`
    SELECT m.*, r.doubt_id AS shared_doubt_id, r.grade AS target_grade,
           d.user_id AS owner_id, d.text AS doubt_text, d.answer AS doubt_answer, d.voice AS doubt_voice
    FROM materials m
    LEFT JOIN lesson_reactions r ON r.material_id=m.id
    LEFT JOIN doubts d ON d.id=r.doubt_id
    WHERE m.id=? AND m.school_id=?
  `).get(id, req.user.school_id);
  if (!row) return res.status(404).json({ error: 'Material não encontrado.' });
  const myGrade = db.prepare('SELECT grade FROM users WHERE id=?').get(req.user.id)?.grade;
  const canReadPublished = row.published === 1 && (!row.shared_doubt_id || row.target_grade === myGrade);
  const canReadOwnPending = row.published === 0 && row.owner_id === req.user.id;
  if (!canReadPublished && !canReadOwnPending) return res.status(403).json({ error: 'Material aguardando liberação para a turma.' });
  const cleanTitle = String(row.title || '').replace(/^\[Voz:\s*[^\]]+\]\s*/i, '').trim();
  const baseDesc = String(row.description || '').split('|')[0].trim();
  let fullText = row.doubt_answer || ANSWER_CACHE.get(row.subject, cleanTitle) || ANSWER_CACHE.findSimilar(row.subject, cleanTitle + ' ' + baseDesc) || row.description;
  fullText = String(fullText || '').replace(/^\[(Prof\.|Profa\.)[^\]]+\]:\s*/i, '').trim();
  const voiceHint = /rosinha/i.test(row.title) || /Profa\.\s*Rosinha/i.test(fullText) || row.doubt_voice === 'rosinha_sampaio' ? 'maria' : 'daniel';
  res.json({
    material: {
      id: row.id,
      subject: row.subject,
      title: row.title,
      description: row.description,
      kind: row.kind,
      published: row.published,
      reviewed_by: row.reviewed_by || null,
      reviewed_at: row.reviewed_at || null,
      from_student_share: Boolean(row.shared_doubt_id),
      question_text: row.doubt_text || cleanTitle,
      full_text: fullText,
      voice_hint: voiceHint
    }
  });
});

app.get('/api/materials/:id/pdf', auth, (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'Material inválido.' });
  const row = db.prepare(`
    SELECT m.*, r.doubt_id AS shared_doubt_id, r.grade AS target_grade,
           d.user_id AS owner_id, d.answer AS doubt_answer
    FROM materials m
    LEFT JOIN lesson_reactions r ON r.material_id=m.id
    LEFT JOIN doubts d ON d.id=r.doubt_id
    WHERE m.id=? AND m.school_id=?
  `).get(id, req.user.school_id);
  if (!row) return res.status(404).json({ error: 'Material não encontrado.' });
  const myGrade = db.prepare('SELECT grade FROM users WHERE id=?').get(req.user.id)?.grade;
  const canReadPublished = row.published === 1 && (!row.shared_doubt_id || row.target_grade === myGrade);
  const canReadOwnPending = row.published === 0 && row.owner_id === req.user.id;
  if (!canReadPublished && !canReadOwnPending) return res.status(403).json({ error: 'Material aguardando liberação para a turma.' });
  const cleanTitle = String(row.title || '').replace(/^\[Voz:\s*[^\]]+\]\s*/i, '').trim();
  const baseDesc = String(row.description || '').split('|')[0].trim();
  const content = String(row.doubt_answer || ANSWER_CACHE.get(row.subject, cleanTitle) || ANSWER_CACHE.findSimilar(row.subject, cleanTitle + ' ' + baseDesc) || row.description || '').replace(/^\[(Prof\.|Profa\.)[^\]]+\]:\s*/, '').trim();
  const pdfBuf = materialToPdfBuffer({
    id: row.id,
    subject: row.subject,
    title: cleanTitle,
    description: content,
    kind: row.kind,
    reviewedBy: row.reviewed_by,
    createdAt: row.created_at,
    studentName: req.user.name
  });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="material-${id}.pdf"`);
  res.send(pdfBuf);
});

app.get('/api/materials/:id/speak', auth, voiceLimiter, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'Material inválido.' });
    const row = db.prepare(`
      SELECT m.*, r.doubt_id AS shared_doubt_id, r.grade AS target_grade,
             d.user_id AS owner_id, d.answer AS doubt_answer, d.voice AS doubt_voice
      FROM materials m
      LEFT JOIN lesson_reactions r ON r.material_id=m.id
      LEFT JOIN doubts d ON d.id=r.doubt_id
      WHERE m.id=? AND m.school_id=?
    `).get(id, req.user.school_id);
    if (!row) return res.status(404).json({ error: 'Material não encontrado.' });
    const myGrade = db.prepare('SELECT grade FROM users WHERE id=?').get(req.user.id)?.grade;
    const canReadPublished = row.published === 1 && (!row.shared_doubt_id || row.target_grade === myGrade);
    const canReadOwnPending = row.published === 0 && row.owner_id === req.user.id;
    if (!canReadPublished && !canReadOwnPending) return res.status(403).json({ error: 'Material aguardando liberação para a turma.' });
    const cleanTitle = String(row.title || '').replace(/^\[Voz:\s*[^\]]+\]\s*/i, '').trim();
    const baseDesc = String(row.description || '').split('|')[0].trim();
    const fullText = String(row.doubt_answer || ANSWER_CACHE.get(row.subject, cleanTitle) || ANSWER_CACHE.findSimilar(row.subject, cleanTitle + ' ' + baseDesc) || row.description || '').replace(/^\[(Prof\.|Profa\.)[^\]]+\]:\s*/, '').trim().slice(0, 11800);
    const defaultVoice = row.doubt_voice || 'prof_naira';
    const preset = resolveVoicePreset(req.query.voice || defaultVoice);
    const wav = await synthesize(fullText, { voice: preset.id });
    if (wav?.voiceEngine) res.setHeader('X-Voice-Engine', wav.voiceEngine);
    res.type('audio/wav').send(wav);
  } catch (err) { next(err); }
});

try { db.exec("ALTER TABLE doubts ADD COLUMN answer TEXT;"); } catch(_) {}
try { db.exec("ALTER TABLE doubts ADD COLUMN voice TEXT;"); } catch(_) {}
try { db.exec("ALTER TABLE doubts ADD COLUMN lesson_json TEXT;"); } catch(_) {}

app.get('/api/doubts', auth, (req,res) => res.json({ doubts:db.prepare('SELECT id,subject,text,answer,voice,status,lesson_json,redo_count,needs_human_review,feedback_note,created_at,audio_path IS NOT NULL has_audio,(SELECT rating FROM lesson_reactions WHERE doubt_id=doubts.id) rating,(SELECT feedback_note FROM lesson_reactions WHERE doubt_id=doubts.id) reaction_note,(SELECT material_id FROM lesson_reactions WHERE doubt_id=doubts.id) shared FROM doubts WHERE user_id=? ORDER BY id DESC').all(req.user.id) }));
app.post('/api/doubts', auth, upload.single('audio'), async (req,res,next) => {
  try {
    const subject=cleanText(req.body.subject,80), text=cleanText(req.body.text,4000);
    if (!subject || (!text && !req.file)) return res.status(400).json({error:'Informe uma dúvida em texto ou áudio.'});

    let doubtText = text;
    if (!doubtText && req.file && req.body.transcription_attempted !== '1') {
      try {
        const wavPath = resolve(uploadDir, req.file.filename + '.wav');
        const { execFile } = await import('node:child_process');
        await promisify(execFile)(FFMPEG_BIN, ['-y', '-loglevel', 'error', '-i', req.file.path, '-ac', '1', '-ar', '16000', '-f', 'f32le', wavPath], {timeout:30000, windowsHide:true});
        const raw = readFileSync(wavPath);
        unlinkSync(wavPath);
        const samples = new Float32Array(raw.buffer, raw.byteOffset, raw.byteLength / 4);
        doubtText = await transcribeWav(samples);
      } catch (_) {}
    }

    const profile = db.prepare('SELECT instructor_voice FROM student_profiles WHERE user_id=?').get(req.user.id);
    const defaultProfileVoice = profileVoiceFor(profile?.instructor_voice);
    const reviewed = doubtText ? demoAnswer(subject, doubtText) : null;
    const localFallback = reviewed || (doubtText ? (ANSWER_CACHE.get(subject, doubtText) || ANSWER_CACHE.findSimilar(subject, doubtText)) : null);
    let cached = localFallback;
    let aiGenerated = false;
    let demoGuide = false;
    let needsHumanReview = false;
    let lesson = null;
    if (doubtText && hasTutorConfigured()) {
      try {
        const priorCount = db.prepare('SELECT COUNT(*) n FROM doubts WHERE user_id=? AND subject=?').get(req.user.id, subject).n;
        const previousQuestions = db.prepare('SELECT text FROM doubts WHERE user_id=? AND subject=? AND text IS NOT NULL AND text <> ? ORDER BY id DESC LIMIT 3').all(req.user.id, subject, '').map(row => row.text);
        const generated = await tutorAnswer({subject, question: doubtText, priorCount, previousQuestions});
        if (generated) {
          lesson = generated;
          cached = generated.steps.map(step => step.title + '\n' + step.text).join('\n\n');
          aiGenerated = true;
          tutorMetrics.answered++;
        } else {
          cached = localFallback;
          tutorMetrics.forwarded++;
        }
      } catch (error) {
        cached = localFallback;
        tutorMetrics.unavailable++;
        tutorMetrics.forwarded++;
        // Não registrar perguntas, respostas ou credenciais nos logs.
        const reason = /^Tutor indisponível \(\d{3}\)\.$/.test(error.message) || error.message === 'Resposta do tutor incompleta.'
          ? error.message : 'Falha de conexão ou tempo limite.';
        console.warn(`Tutor do piloto: ${reason} Usando fallback pedagógico local.`);
      }
    } else if (!cached) {
      tutorMetrics.forwarded++;
    }

    let voice = req.body.voice ? resolveVoicePreset(req.body.voice).id : defaultProfileVoice;
    // Profª Naira é a voz padrão para todas as matérias (única voz clonada real).
    if (!req.body.voice) {
      voice = 'prof_naira';
    }

    // Responde apenas a dúvida atual, sem preenchimento de outras matérias.
    if (!lesson && (cached || doubtText)) {
      const built = buildLongLesson({
        subject,
        question: doubtText || `Dúvida de ${subject}`,
        baseAnswer: cached || '',
        voicePreset: voice
      });
      lesson = built.lesson;
      if (!cached) {
        demoGuide = true;
      }
      cached = built.answer;
      needsHumanReview = built.needsHumanReview;
    }

    const result = db.prepare('INSERT INTO doubts(user_id,subject,text,answer,voice,audio_path,audio_mime,status,lesson_json) VALUES(?,?,?,?,?,?,?,?,?)')
      .run(req.user.id, subject, doubtText || null, cached, voice, req.file?.path || null, req.file?.mimetype || null, cached && !needsHumanReview ? 'suggested' : 'received', lesson ? JSON.stringify(lesson) : null);
    const id = Number(result.lastInsertRowid);
    const preset = resolveVoicePreset(voice);

    // Pré-síntese assíncrona ("cria voz sozinha") na Etapa 0 para a narração começar em segundos
    if (cached) {
      try {
        const step0Text = lesson?.steps?.[0] ? `${lesson.steps[0].title}. ${lesson.steps[0].text}` : cached.slice(0, 900);
        synthesize(step0Text, { voice: preset.id }).catch(() => {});
      } catch(_) {}
    }

    res.status(201).json({
      id,
      status: cached && !needsHumanReview ? 'suggested' : 'received',
      hasAudio: Boolean(req.file),
      answer: cached,
      lesson,
      source: aiGenerated ? 'ai_tutor' : reviewed ? 'demo_material' : demoGuide ? 'demo_guide' : cached ? 'material' : null,
      voice: preset.id,
      redo_count: 0,
      instructor: preset.gender === 'F' ? (preset.id === 'prof_naira' ? 'naira' : 'rosinha') : 'chiquinho',
      transcriptionStatus: !text && req.file ? (doubtText ? 'completed' : 'pending_human_review') : 'not_required'
    });
  } catch(error) { next(error); }
});
app.get('/api/doubts/:id/speak', auth, voiceLimiter, async (req,res,next) => {
  try {
    const row = db.prepare(`SELECT d.answer,d.voice,d.lesson_json,d.subject,d.user_id,u.school_id FROM doubts d JOIN users u ON u.id=d.user_id WHERE d.id=?`).get(Number(req.params.id));
    if (!row?.answer || row.school_id!==req.user.school_id || (row.user_id!==req.user.id)) {
      return res.status(404).json({error:'Áudio da resposta não disponível.'});
    }
    let lesson; try { lesson = JSON.parse(row.lesson_json); } catch (_) {}
    const isFull = req.query.step === undefined || req.query.full === '1';
    let clean = '';
    if (!isFull) {
      const index = Number(req.query.step);
      if (!Number.isInteger(index) || index < 0 || !lesson?.steps?.[index]) return res.status(400).json({error:'Etapa não disponível.'});
      clean = lesson.steps[index].title + '. ' + lesson.steps[index].text;
    } else {
      clean = lessonToFullNarration(lesson, row.answer, row.subject);
    }
    const profile = db.prepare('SELECT instructor_voice FROM student_profiles WHERE user_id=?').get(req.user.id);
    const fallbackVoice = profileVoiceFor(profile?.instructor_voice);
    const voice = resolveVoicePreset(req.query.voice || row.voice || fallbackVoice).id;
    try {
      const wav = await synthesize(clean, {
        voice,
        fullLesson: isFull,
        dynamicText: isFull ? lessonToDynamicNarration(lesson, row.answer, row.subject) : ''
      });
      voiceMetrics.replies++;
      if (wav?.voiceEngine) res.setHeader('X-Voice-Engine', wav.voiceEngine);
      res.type('audio/wav').send(wav);
    } catch {
      voiceMetrics.failures++;
      res.status(503).json({error:'A explicação em texto já está disponível. A voz está temporariamente indisponível.'});
    }
  } catch(error) { next(error); }
});

app.get('/api/doubts/:id/pdf', auth, (req, res) => {
  const id = Number(req.params.id);
  const row = db.prepare(`
    SELECT d.*, u.school_id, u.name AS student_name, u.grade,
           (SELECT rating FROM lesson_reactions WHERE doubt_id=d.id) AS rating,
           (SELECT feedback_note FROM lesson_reactions WHERE doubt_id=d.id) AS reaction_note
    FROM doubts d JOIN users u ON u.id=d.user_id WHERE d.id=?
  `).get(id);
  if (!row?.answer || row.school_id !== req.user.school_id || row.user_id !== req.user.id) {
    return res.status(404).json({ error: 'PDF da explicação não disponível.' });
  }
  let lesson = null;
  try { lesson = JSON.parse(row.lesson_json); } catch (_) {}
  const preset = resolveVoicePreset(req.query.voice || row.voice);
  const narrationPdf = lessonToFullNarration(lesson, row.answer, row.subject);
  const pdfBuf = doubtToPdfBuffer({
    id: row.id,
    subject: row.subject,
    question: row.text,
    answer: row.answer,
    lesson,
    voiceLabel: preset.label,
    studentName: row.student_name,
    grade: row.grade,
    createdAt: row.created_at,
    rating: row.rating,
    feedbackNote: row.reaction_note || row.feedback_note,
    redoCount: row.redo_count,
    narration: narrationPdf
  });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="estudo-duvida-${id}.pdf"`);
  res.send(pdfBuf);
});

app.get('/api/doubts/:id/study-pack', auth, voiceLimiter, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const row = db.prepare(`
      SELECT d.*, u.school_id, u.name AS student_name, u.grade,
             (SELECT rating FROM lesson_reactions WHERE doubt_id=d.id) AS rating,
             (SELECT feedback_note FROM lesson_reactions WHERE doubt_id=d.id) AS reaction_note
      FROM doubts d JOIN users u ON u.id=d.user_id WHERE d.id=?
    `).get(id);
    if (!row?.answer || row.school_id !== req.user.school_id || row.user_id !== req.user.id) {
      return res.status(404).json({ error: 'Pacote de estudo não disponível.' });
    }
    let lesson = null;
    try { lesson = JSON.parse(row.lesson_json); } catch (_) {}
    const preset = resolveVoicePreset(req.query.voice || row.voice);
    const narration = lessonToFullNarration(lesson, row.answer, row.subject);
    const pdfBuf = doubtToPdfBuffer({
      id: row.id,
      subject: row.subject,
      question: row.text,
      answer: row.answer,
      lesson,
      voiceLabel: preset.label,
      studentName: row.student_name,
      grade: row.grade,
      createdAt: row.created_at,
      rating: row.rating,
      feedbackNote: row.reaction_note || row.feedback_note,
      redoCount: row.redo_count,
      narration
    });
    const wavBuf = await synthesize(narration, {
      voice: preset.id,
      fullLesson: true,
      dynamicText: lessonToDynamicNarration(lesson, row.answer, row.subject)
    });
    const zipBuf = buildZipBuffer([
      { name: `roteiro-estudo-${id}.pdf`, data: pdfBuf },
      { name: `aula-narrada-${id}.wav`, data: wavBuf }
    ]);
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="pacote-estudo-${id}.zip"`);
    res.send(zipBuf);
  } catch (err) { next(err); }
});
app.get('/api/doubts/:id/audio', auth, (req,res) => {
  const row=db.prepare(`SELECT d.audio_path,d.audio_mime,d.user_id,u.school_id FROM doubts d JOIN users u ON u.id=d.user_id WHERE d.id=?`).get(Number(req.params.id));
  if (!row?.audio_path || row.school_id!==req.user.school_id || (row.user_id!==req.user.id)) return res.status(404).json({error:'Áudio não encontrado.'});
  res.type(row.audio_mime || 'application/octet-stream').sendFile(resolve(row.audio_path));
});
app.get('/api/admin/doubts', auth, (req,res) => { return res.status(403).json({error:'Dúvidas individuais são encaminhadas ao docente vinculado.'});
  if (!['admin','direction'].includes(req.user.role)) return res.status(403).json({error:'Acesso restrito à gestão.'});
  res.json({doubts:db.prepare(`SELECT d.id,d.subject,d.text,d.answer,d.voice,d.status,d.created_at,d.audio_path IS NOT NULL has_audio,u.name,u.registration,u.grade FROM doubts d JOIN users u ON u.id=d.user_id WHERE u.school_id=? ORDER BY d.id DESC`).all(req.user.school_id)});
});
app.get('/api/admin/support', auth, (req,res) => {
  if (!['admin','direction'].includes(req.user.role)) return res.status(403).json({error:'Acesso restrito à gestão.'});
  res.json({messages:db.prepare(`SELECT s.id,s.recipient,s.body,s.risk_flag,s.status,s.created_at,u.anonymous_alias alias FROM support_messages s JOIN users u ON u.id=s.user_id WHERE s.school_id=? AND s.recipient IN ('Direção','direcao') ORDER BY s.risk_flag DESC,s.id DESC`).all(req.user.school_id)});
});
app.get('/api/messages', auth, (req,res) => {
  const channel=cleanText(req.query.channel || 'geral',50);
  const rows=db.prepare(`SELECT m.id,m.body,m.channel,m.created_at,u.name author,u.role FROM messages m JOIN users u ON u.id=m.user_id
    WHERE m.school_id=? AND m.channel=? ORDER BY m.id DESC LIMIT 100`).all(req.user.school_id,channel).reverse();
  res.json({messages:rows});
});
app.post('/api/messages', auth, (req,res) => {
  const channel=cleanText(req.body.channel || 'geral',50), body=cleanText(req.body.body,1000);
  if (!body) return res.status(400).json({error:'Mensagem vazia.'});
  const result=db.prepare('INSERT INTO messages(school_id,user_id,channel,body) VALUES(?,?,?,?)').run(req.user.school_id,req.user.id,channel,body);
  res.status(201).json({id:Number(result.lastInsertRowid),body,channel,author:req.user.name});
});
app.post('/api/support', auth, (req,res) => {
  const recipient=cleanText(req.body.recipient,100), body=cleanText(req.body.body,4000);
  if (!['Direção','Coordenação pedagógica','Pedagogo(a)','direcao','pedagogia'].includes(recipient) || !body) return res.status(400).json({error:'Preencha o destinatário e a mensagem.'});
  const risk=/(ameaça|ameaça|violência|bater|arma|suic|morrer|abuso|socorro)/i.test(body) ? 1 : 0;
  const result=db.prepare('INSERT INTO support_messages(school_id,user_id,recipient,body,risk_flag) VALUES(?,?,?,?,?)').run(req.user.school_id,req.user.id,recipient,body,risk);
  res.status(201).json({id:Number(result.lastInsertRowid),alias:req.user.anonymous_alias,status:'received',priority:risk?'urgent':'normal'});
});
app.post('/api/micro-lessons', auth, (req,res) => {
  const title=cleanText(req.body.title,160), script=cleanText(req.body.script,6000), format=cleanText(req.body.format,80);
  if (!title || !script || !format) return res.status(400).json({error:'Preencha título, roteiro e formato.'});
  const result=db.prepare('INSERT INTO micro_lessons(user_id,title,script,format) VALUES(?,?,?,?)').run(req.user.id,title,script,format);
  res.status(201).json({id:Number(result.lastInsertRowid),status:'review'});
});


/* ---------- voz híbrida (Whisper ONNX + OmniVoice Clone + Edge Cinema) ---------- */
app.get('/api/voice/status', auth, (req, res) => {
  const provider = process.env.VOICE_PROVIDER || 'local';
  const google = provider === 'google';
  const configured = Boolean(process.env.GOOGLE_API_KEY?.trim());
  res.json({
    stt: sttReady() ? 'pronto' : 'sob demanda',
    tts: google
      ? (configured ? 'configurado (Gemini TTS + OmniVoice Clone / Edge Cinema)' : 'chave ausente')
      : provider !== 'local' ? 'provedor inválido' : 'disponível (OmniVoice Clone Profª Naira + Edge Cinema)',
    engine: 'whisper (onnx) + OmniVoice Zero-Shot Clone Profª Naira + Edge Cinema (pt-BR)',
    cloud: google
  });
});

app.post('/api/voice/transcribe', auth, upload.single('audio'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Envie um arquivo de áudio.' });
    const wavPath = resolve(uploadDir, req.file.filename + '.wav');
    const { execFile } = await import('node:child_process');
    await promisify(execFile)(FFMPEG_BIN, ['-y', '-loglevel', 'error', '-i', req.file.path, '-ac', '1', '-ar', '16000', '-f', 'f32le', wavPath], {timeout:30000, windowsHide:true});
    const raw = readFileSync(wavPath);
        unlinkSync(wavPath);
    const samples = new Float32Array(raw.buffer, raw.byteOffset, raw.byteLength / 4);
    const text = await transcribeWav(samples);
    res.json({ text, seconds: +(samples.length / 16000).toFixed(1) });
  } catch (error) { next(error); } finally {
    for(const file of [req.file?.path,req.file?.path ? req.file.path+'.wav' : null]) if(file && existsSync(file))unlinkSync(file);
  }
});

app.post('/api/voice/speak', auth, async (req, res, next) => {
  try {
    const text = String(req.body.text || '').trim();
    if (!text) return res.status(400).json({ error: 'Informe o texto para falar.' });
    if (text.length > 18000) return res.status(400).json({error:'Divida a explicação em etapas para ouvir.'});
    const wav = await synthesize(text, {
      voice: cleanText(req.body.voice, 60) || 'maria'
    });
    if (wav?.voiceEngine) res.setHeader('X-Voice-Engine', wav.voiceEngine);
    res.type('audio/wav').send(wav);
  } catch (error) { res.status(503).json({error:'A voz está temporariamente indisponível. Tente novamente.'}); }
});

/* ---------- campanhas ---------- */
app.get('/api/campaigns', auth, (req, res) => res.json({
  campaigns: db.prepare('SELECT * FROM campaigns WHERE school_id=? AND active=1 ORDER BY id DESC').all(req.user.school_id)
}));
app.get('/api/admin/campaigns', auth, (req, res) => {
  if (!['admin','direction'].includes(req.user.role)) return res.status(403).json({ error: 'Acesso restrito à gestão.' });
  res.json({ campaigns: db.prepare('SELECT * FROM campaigns WHERE school_id=? ORDER BY id DESC').all(req.user.school_id) });
});
app.post('/api/admin/campaigns', auth, (req, res) => {
  if (!['admin','direction'].includes(req.user.role)) return res.status(403).json({ error: 'Acesso restrito à gestão.' });
  const title = cleanText(req.body.title, 140), description = cleanText(req.body.description, 600);
  const kind = cleanText(req.body.kind, 30) || 'participacao', reward = cleanText(req.body.reward, 140);
  const starts = cleanText(req.body.startsAt, 20) || null, ends = cleanText(req.body.endsAt, 20) || null;
  if (title.length < 4 || description.length < 10) return res.status(400).json({ error: 'Informe título e descrição da campanha.' });
  const result = db.prepare('INSERT INTO campaigns(school_id,title,description,kind,reward,starts_at,ends_at) VALUES(?,?,?,?,?,?,?)')
    .run(req.user.school_id, title, description, kind, reward || null, starts, ends);
  res.status(201).json({ id: Number(result.lastInsertRowid) });
});
app.patch('/api/admin/campaigns/:id', auth, (req, res) => {
  if (!['admin','direction'].includes(req.user.role)) return res.status(403).json({ error: 'Acesso restrito à gestão.' });
  const active = req.body.active ? 1 : 0;
  const result = db.prepare('UPDATE campaigns SET active=? WHERE id=? AND school_id=?').run(active, Number(req.params.id), req.user.school_id);
  if (!result.changes) return res.status(404).json({ error: 'Campanha não encontrada.' });
  res.json({ ok: true, active: Boolean(active) });
});

registerPedagogy(app, {db, auth, cleanText, metrics, demoMode, passwordHashAsync, voiceMetrics, tutorMetrics});
registerTeacherVoice(app, {db, auth, dataDir});

app.use('/assets', express.static(join(root,'assets'), {dotfiles:'deny'}));
app.use('/icons', express.static(join(root,'icons'), {dotfiles:'deny'}));
for (const file of ['portal.html','prototipo.html','equipe.html','manifest.webmanifest','sw.js']) app.get('/'+file, (_req,res)=>res.sendFile(join(root,file)));
app.get('/favicon.ico', (_req,res)=>res.sendFile(join(root,'icons','favicon.png')));
app.get('/downloads/DomPedroIIVoice-Android-teste.apk', (req,res) => res.download(join(root,'downloads','DomPedroIIVoice-Android-teste.apk')));
app.get(['/','/index.html'], (_req,res)=>res.sendFile(join(root,'portal.html')));
app.get('/admin.html', (_req,res)=>res.redirect('/equipe.html'));
app.use((_req,res)=>res.status(404).json({error:'Recurso não encontrado.'}));

app.use((err, _req, res, _next) => {
  if (err instanceof multer.MulterError) return res.status(400).json({error:`Falha no áudio: ${err.message}`});
  console.error(err); res.status(500).json({error:'Erro interno do servidor local.'});
});

if(process.argv.includes('--recover-access')) {
 const {createInterface}=await import('node:readline/promises');
 const rl=createInterface({input:process.stdin,output:process.stdout});
 try {
  const code=cleanText(await rl.question('Código da escola: '),30).toUpperCase();
  const registration=cleanText(await rl.question('Matrícula da direção ou responsável técnico: '),50);
  const account=db.prepare("SELECT u.id FROM users u JOIN schools s ON s.id=u.school_id WHERE s.code=? AND u.registration=? AND u.active=1 AND u.role IN ('direction','admin','developer')").get(code,registration);
  if(!account) throw Error('Conta ativa não encontrada para esta escola e perfil.');
  const password=randomBytes(15).toString('base64url');
  const hash=await passwordHashAsync(password);
  db.exec('BEGIN');
  try {
   db.prepare('UPDATE users SET password_hash=? WHERE id=?').run(hash,account.id);
   db.prepare('DELETE FROM sessions WHERE user_id=?').run(account.id);
   db.exec('COMMIT');
  } catch(e) {db.exec('ROLLBACK');throw e;}
  console.log(`Nova senha temporária: ${password}\nGuarde em local seguro. As sessões anteriores foram encerradas.`);
 } finally {rl.close();db.close();}
 process.exit(0);
}

if(process.argv.includes('--setup')) {
 const {createInterface}=await import('node:readline/promises');
 const rl=createInterface({input:process.stdin,output:process.stdout});
 try {
 const code=cleanText(await rl.question('Código da escola: '),30).toUpperCase();
 const name=cleanText(await rl.question('Nome da escola: '),160);
 const registration=cleanText(await rl.question('Matrícula da direção: '),50);
 if(!code||!name||!registration)throw Error('Preencha todos os campos.');
 let school=db.prepare('SELECT id FROM schools WHERE code=?').get(code);
 if(!school){const r=db.prepare('INSERT INTO schools(name,code) VALUES(?,?)').run(name,code);school={id:Number(r.lastInsertRowid)};}
 if(db.prepare("SELECT id FROM users WHERE school_id=? AND role IN ('direction','admin')").get(school.id))throw Error('Esta escola já possui direção; configuração preservada.');
 for(const [role,reg] of [['direction',registration],['developer','TEC-'+randomBytes(4).toString('hex')]]){
 const password=randomBytes(15).toString('base64url');
 db.prepare('INSERT INTO users(school_id,registration,name,password_hash,role,anonymous_alias) VALUES(?,?,?,?,?,?)').run(school.id,reg,role==='direction'?'Direção':'Responsável técnico',await passwordHashAsync(password),role,'Equipe');
 console.log(`\nPerfil: ${role} | Matrícula: ${reg} | Senha inicial: ${password}`);
 }
 console.log('Guarde estas senhas em local seguro. Elas não serão exibidas novamente.');
 } finally {rl.close();db.close();}
 process.exit(0);
}

export { app };

if (process.env.DPII_EMBEDDED !== '1') {
  const port = Number(process.env.PORT || 8787);
  app.listen(port, process.env.HOST || '127.0.0.1', () => console.log(`Escola Viva local: http://localhost:${port}`));
}
