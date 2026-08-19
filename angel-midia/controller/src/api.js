export async function api(path, { method = 'GET', body, headers = {} } = {}) {
  const response = await fetch(`./api${path}`, {
    method,
    credentials: 'include',
    headers: {
      ...(body && !(body instanceof FormData) ? { 'content-type': 'application/json' } : {}),
      ...headers,
    },
    body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
  });
  if (!response.ok) {
    throw new Error((await response.json().catch(() => ({}))).error || `HTTP ${response.status}`);
  }
  return response.status === 204 ? null : response.json();
}
