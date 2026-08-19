import { randomBytes, randomUUID } from 'node:crypto';
import { hashToken, requireAdmin, verifyPassword } from '../auth.js';

const SESSION_DURATION_MS = 12 * 60 * 60 * 1000;
const DUMMY_PASSWORD_HASH = `${'00'.repeat(16)}:${'00'.repeat(64)}`;
const PASSWORD_HASH_PATTERN = /^[a-f0-9]{32}:[a-f0-9]{128}$/i;

function validLoginBody(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return false;
  if (Object.keys(body).some((key) => !['identifier', 'email', 'password'].includes(key))) return false;
  const identifier = body.identifier ?? body.email;
  return typeof identifier === 'string'
    && identifier.trim().length > 0
    && identifier.trim().length <= 254
    && typeof body.password === 'string'
    && body.password.length > 0
    && body.password.length <= 1024;
}

export function normalizeLoginIdentifier(value) {
  if (typeof value !== 'string' || !value.trim()) return null;
  return value.trim().toLowerCase();
}

function publicAdmin(admin) {
  return { id: admin.id, name: admin.name, email: admin.email };
}

export default async function authRoutes(app, {
  secureCookies = false,
  now = () => new Date(),
  passwordVerifier = verifyPassword,
} = {}) {
  const cookieOptions = { httpOnly: true, sameSite: 'strict', path: '/', secure: secureCookies };

  app.post('/api/auth/login', async (request, reply) => {
    if (!validLoginBody(request.body)) {
      return reply.code(400).send({ error: 'invalid_request' });
    }

    const identifier = normalizeLoginIdentifier(request.body.identifier ?? request.body.email);
    const { rows } = await app.db.query(
      `select id, name, email, password_hash
         from admins
        where lower(email) = $1 or lower(name) = $1
        order by case when lower(name) = $1 then 0 else 1 end limit 1`,
      [identifier],
    );
    const admin = rows[0];
    const storedHash = admin?.password_hash;
    const hashToVerify = PASSWORD_HASH_PATTERN.test(storedHash ?? '') ? storedHash : DUMMY_PASSWORD_HASH;
    const passwordMatches = await passwordVerifier(request.body.password, hashToVerify);
    if (!admin || !passwordMatches) {
      return reply.code(401).send({ error: 'invalid_credentials' });
    }

    const token = randomBytes(32).toString('base64url');
    const expiresAt = new Date(now().getTime() + SESSION_DURATION_MS);
    await app.db.query(
      `insert into sessions (id, admin_id, token_hash, expires_at)
       values ($1, $2, $3, $4)`,
      [randomUUID(), admin.id, hashToken(token), expiresAt],
    );

    reply.setCookie('amp_session', token, { ...cookieOptions, expires: expiresAt });
    return publicAdmin(admin);
  });

  app.get('/api/auth/me', { preHandler: requireAdmin }, async (request) => publicAdmin(request.admin));

  app.post('/api/auth/logout', async (request, reply) => {
    const token = request.cookies.amp_session;
    if (token) {
      await app.db.query(
        `update sessions set revoked_at = now()
          where token_hash = $1 and revoked_at is null`,
        [hashToken(token)],
      );
    }
    reply.clearCookie('amp_session', cookieOptions);
    return reply.code(204).send();
  });
}
