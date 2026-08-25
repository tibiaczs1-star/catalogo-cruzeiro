export async function loadRelease(fetchImpl = globalThis.fetch) {
  const response = await fetchImpl('./release.json', { cache: 'no-store' });
  if (!response.ok) throw new Error('release_unavailable');
  return response.json();
}
