import { loadRelease } from './release.js';

const esc = (value) => String(value ?? '').replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
const size = (bytes) => `${(Number(bytes) / 1048576).toFixed(1)} MB`;

export function renderApps(release) {
  return Object.entries(release.apps).map(([kind, app]) => `<article class="glass app-release">
    <p class="eyebrow">${kind === 'admin' ? 'CELULAR DO ADMINISTRADOR' : 'STICK / TV'}</p>
    <h2>${esc(app.name)}</h2><p>${esc(app.purpose)}</p>
    <dl><dt>Versão</dt><dd>${esc(app.version)}</dd><dt>Tamanho</dt><dd>${size(app.sizeBytes)}</dd><dt>Android</dt><dd>${esc(app.minAndroid)} ou superior</dd><dt>SHA-256</dt><dd><code>${esc(app.sha256)}</code></dd></dl>
    <div class="form-actions"><button type="button" class="ghost" data-copy-hash="${esc(app.sha256)}">Copiar hash</button><a class="primary" href="${esc(app.path)}?v=${esc(app.version)}" download>Baixar APK</a></div>
  </article>`).join('');
}

export async function renderAppsPage(root, fetchImpl = globalThis.fetch) {
  root.innerHTML = '<header class="page-head"><div><p class="eyebrow">Aplicativos oficiais</p><h1>Central de APKs</h1><p>Baixe sempre a versão mais nova e confira a integridade antes de instalar.</p></div></header><p role="status">Carregando versões…</p>';
  try {
    const release = await loadRelease(fetchImpl);
    root.innerHTML = `<header class="page-head"><div><p class="eyebrow">Aplicativos oficiais</p><h1>Central de APKs</h1><p>Publicado em ${new Date(release.publishedAt).toLocaleString('pt-BR')}.</p></div><span class="pill">${esc(release.release)}</span></header><section class="apps-grid">${renderApps(release)}</section><p class="release-note">No Android, permita a instalação pelo navegador somente durante a atualização. O hash confirma que o arquivo baixado é o oficial.</p>`;
    root.querySelectorAll('[data-copy-hash]').forEach((button) => button.onclick = async () => { await navigator.clipboard?.writeText(button.dataset.copyHash); button.textContent = 'Hash copiado'; });
  } catch {
    root.querySelector('[role=status]').textContent = 'Não foi possível carregar as versões dos aplicativos.';
  }
}
