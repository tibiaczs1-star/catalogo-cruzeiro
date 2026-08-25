export class ApiError extends Error {
  constructor(message, { status = 0, code = '' } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

export function resolveApiBase(pathname = globalThis.location?.pathname || '/') {
  const normalized = String(pathname || '/');
  const lower = normalized.toLowerCase();
  const marker = '/angel-midia';
  const index = lower.indexOf(marker);
  if (index >= 0) return `${normalized.slice(0, index)}${marker}/api`;
  return '/api';
}

export async function api(path, { method = 'GET', body, headers = {} } = {}) {
  const response = await fetch(`${resolveApiBase()}${path}`, {
    method,
    credentials: 'include',
    headers: {
      ...(body && !(body instanceof FormData) ? { 'content-type': 'application/json' } : {}),
      ...headers,
    },
    body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    const code = String(payload?.error || '');
    throw new ApiError(code || `HTTP ${response.status}`, { status: response.status, code });
  }
  return response.status === 204 ? null : response.json();
}
