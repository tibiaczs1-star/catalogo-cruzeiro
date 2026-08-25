import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(scryptCallback);

export function hashToken(token) {
  return createHash('sha256').update(token).digest('hex');
}

export async function hashPassword(password) {
  const salt = randomBytes(16);
  const key = await scrypt(password, salt, 64);
  return `${salt.toString('hex')}:${Buffer.from(key).toString('hex')}`;
}

export async function verifyPassword(password, encoded) {
  if (typeof password !== 'string' || typeof encoded !== 'string') return false;
  const [saltHex, keyHex, extra] = encoded.split(':');
  if (extra !== undefined || !/^[a-f0-9]{32}$/i.test(saltHex ?? '') || !/^[a-f0-9]{128}$/i.test(keyHex ?? '')) {
    return false;
  }

  const expected = Buffer.from(keyHex, 'hex');
  const actual = Buffer.from(await scrypt(password, Buffer.from(saltHex, 'hex'), expected.length));
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export async function requireAdmin(request, reply) {
  const token = request.cookies.amp_session;
  if (!token) return reply.code(401).send({ error: 'authentication_required' });

  const { rows } = await request.server.db.query(
    `select a.id, a.name, a.email
       from sessions s join admins a on a.id = s.admin_id
      where s.token_hash = $1
        and s.revoked_at is null
        and s.expires_at > now()`,
    [hashToken(token)],
  );
  if (!rows[0]) return reply.code(401).send({ error: 'invalid_session' });
  request.admin = rows[0];
}
