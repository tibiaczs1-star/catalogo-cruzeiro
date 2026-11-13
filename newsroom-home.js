(async () => {
  const ready = new Promise((resolve) => {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', resolve, { once: true });
    else resolve();
  });
  const response = await fetch('/api/editores/publicadas');
  if (!response.ok) return;
  const articles = await response.json();
  await ready;
  window.dispatchEvent(new CustomEvent('czs-newsroom-articles', { detail: articles }));
})().catch((error) => console.warn('Falha ao carregar matérias da redação.', error));
