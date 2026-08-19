import { createHash, randomBytes } from 'node:crypto';

export function generateDeviceToken() {
  return randomBytes(32).toString('base64url');
}

export function hashDeviceToken(token) {
  return createHash('sha256').update(token).digest('hex');
}

export function readBearer(request) {
  const authorization = request.headers.authorization;
  if (typeof authorization !== 'string') return null;
  const match = /^Bearer ([A-Za-z0-9_-]{32,})$/.exec(authorization);
  return match?.[1] ?? null;
}

export async function authenticateDevice(request) {
  const token = readBearer(request);
  if (!token) return null;
  const { rows } = await request.server.db.query(
    `select d.*, c.id as credential_id, c.expires_at as credential_expires_at
       from device_credentials c join devices d on d.id = c.device_id
      where c.token_hash = $1
        and c.revoked_at is null
        and (c.expires_at is null or c.expires_at > now())`,
    [hashDeviceToken(token)],
  );
  return rows[0] ?? null;
}
