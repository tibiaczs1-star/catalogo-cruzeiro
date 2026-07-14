# CZS Android App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Entregar um APK Android instalável pelo próprio site, sincronizado com as notícias e vídeos públicos do Catálogo CZS.

**Architecture:** Um shell PWA público e isolado em `/app.html` consome lotes pequenos das APIs existentes, registra um service worker próprio e mostra aviso interno quando chega notícia nova. O APK usa Trusted Web Activity para abrir somente esse shell; o site publica o APK assinado, checksum e manifesto de versão.

**Tech Stack:** HTML/CSS/JavaScript, Node.js, Web App Manifest, Service Worker, Bubblewrap/TWA, Android SDK/JDK, testes `node:test`.

---

### Task 1: Preparar release isolado

**Files:**
- Reference: `docs/superpowers/specs/2026-07-14-czs-android-app-design.md`
- Create worktree: `.codex-temp/worktrees/czs-android-app`

- [ ] **Step 1: Atualizar referências remotas**

Run: `git fetch origin main`

Expected: `origin/main` atualizado sem modificar o worktree sujo atual.

- [ ] **Step 2: Criar worktree limpo**

Run: `git worktree add .codex-temp/worktrees/czs-android-app -b feature/czs-android-app origin/main`

Expected: branch limpa apontando para o `origin/main` atual.

- [ ] **Step 3: Copiar a especificação aprovada**

Run: `Copy-Item -LiteralPath docs/superpowers/specs/2026-07-14-czs-android-app-design.md -Destination .codex-temp/worktrees/czs-android-app/docs/superpowers/specs/`

Expected: especificação disponível no worktree de implementação.

### Task 2: Criar o shell editorial do aplicativo

**Files:**
- Create: `app.html`
- Create: `app.css`
- Create: `app.js`
- Test: `scripts/__tests__/android-app-shell.test.js`

- [ ] **Step 1: Escrever o teste do shell**

```js
test("Android shell exposes only public editorial navigation", () => {
  const html = fs.readFileSync(path.join(ROOT, "app.html"), "utf8");
  assert.match(html, /Agora/);
  assert.match(html, /Vídeos/);
  assert.match(html, /Editorias/);
  assert.match(html, /Buscar/);
  assert.doesNotMatch(html, /Cheffe Call|Escritórios|Agentes/i);
});
```

- [ ] **Step 2: Executar o teste e confirmar falha**

Run: `node --test scripts/__tests__/android-app-shell.test.js`

Expected: FAIL porque `app.html` ainda não existe.

- [ ] **Step 3: Implementar o shell mínimo**

`app.html` deve carregar somente `app.css`, `app.js`, `app.webmanifest`, logo/ícones e conter `main#appFeed`, `section#appVideos`, `form#appSearch` e `button#newStoriesButton` inicialmente oculto.

`app.js` deve usar:

```js
const API_NEWS = "/api/news?limit=40&lite=1";
const state = { items: [], latestId: "", query: "" };
async function fetchNews(limit = 40) {
  const response = await fetch(`/api/news?limit=${limit}&lite=1`, { cache: "no-store" });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}
```

- [ ] **Step 4: Executar o teste do shell**

Run: `node --test scripts/__tests__/android-app-shell.test.js`

Expected: PASS.

- [ ] **Step 5: Commitar o shell**

Run: `git add app.html app.css app.js scripts/__tests__/android-app-shell.test.js && git commit -m "Cria shell editorial do app Android"`

### Task 3: Detectar novas notícias dentro do app

**Files:**
- Modify: `app.js`
- Test: `scripts/__tests__/android-app-news-refresh.test.js`

- [ ] **Step 1: Escrever teste da detecção**

```js
test("detects a newer first item without sending system notifications", () => {
  const app = require("../../app-news-state");
  assert.equal(app.hasNewHeadline("old", [{ id: "new" }]), true);
  assert.equal(app.hasNewHeadline("new", [{ id: "new" }]), false);
});
```

- [ ] **Step 2: Confirmar falha**

Run: `node --test scripts/__tests__/android-app-news-refresh.test.js`

Expected: FAIL porque `app-news-state.js` ainda não existe.

- [ ] **Step 3: Criar função pura e polling interno**

Create `app-news-state.js`:

```js
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.CZS_APP_NEWS_STATE = api;
})(typeof window !== "undefined" ? window : globalThis, function () {
  function itemKey(item = {}) { return String(item.id || item.slug || item.sourceUrl || ""); }
  function hasNewHeadline(previousKey, items = []) { return Boolean(items[0] && itemKey(items[0]) !== String(previousKey || "")); }
  return { itemKey, hasNewHeadline };
});
```

No browser, `app.js` deve consultar `limit=1` a cada 90 segundos enquanto `document.visibilityState === "visible"`, exibir `#newStoriesButton` e atualizar apenas após toque. Não usar `Notification`, Push API ou permissões do Android.

- [ ] **Step 4: Confirmar passagem**

Run: `node --test scripts/__tests__/android-app-news-refresh.test.js`

Expected: PASS.

- [ ] **Step 5: Commitar atualização interna**

Run: `git add app.js app-news-state.js scripts/__tests__/android-app-news-refresh.test.js && git commit -m "Adiciona aviso interno de novas noticias"`

### Task 4: Tornar o shell uma PWA isolada

**Files:**
- Create: `app.webmanifest`
- Create: `app-sw.js`
- Test: `scripts/__tests__/android-app-pwa.test.js`

- [ ] **Step 1: Escrever testes do manifesto e cache**

```js
test("app manifest starts on the isolated editorial route", () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, "app.webmanifest"), "utf8"));
  assert.equal(manifest.start_url, "/app.html");
  assert.equal(manifest.display, "standalone");
  assert.equal(manifest.id, "/app.html");
});
```

- [ ] **Step 2: Confirmar falha**

Run: `node --test scripts/__tests__/android-app-pwa.test.js`

Expected: FAIL porque `app.webmanifest` ainda não existe.

- [ ] **Step 3: Implementar manifesto e service worker**

`app.webmanifest` deve declarar `name`, `short_name`, `id`, `start_url`, `scope`, cores e ícones 192/512. `app-sw.js` deve usar network-first para `/api/` e stale-while-revalidate somente para `app.html`, `app.css`, `app.js` e ícones; não cachear rotas administrativas.

- [ ] **Step 4: Confirmar passagem e sintaxe**

Run: `node --test scripts/__tests__/android-app-pwa.test.js; node --check app.js; node --check app-sw.js`

Expected: todos PASS/exit 0.

- [ ] **Step 5: Commitar PWA**

Run: `git add app.webmanifest app-sw.js scripts/__tests__/android-app-pwa.test.js && git commit -m "Configura PWA do aplicativo CZS"`

### Task 5: Publicar o ponto de download no website

**Files:**
- Modify: `index.html`
- Modify: `assets/v8-final/v8-merge-ready.js`
- Modify: `assets/v8-final/v8-merge-ready.css`
- Create: `downloads/catalogo-czs-android.json`
- Test: `scripts/__tests__/android-app-download.test.js`

- [ ] **Step 1: Escrever teste do download**

```js
test("website exposes a direct Android download", () => {
  const html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
  assert.match(html, /downloads\/catalogo-czs-android\.apk/);
  assert.match(html, /Baixar app CZS/i);
});
```

- [ ] **Step 2: Confirmar falha**

Run: `node --test scripts/__tests__/android-app-download.test.js`

Expected: FAIL porque o link ainda não existe.

- [ ] **Step 3: Implementar CTA sem bloquear notícias**

Adicionar um bloco compacto após a primeira sequência editorial, com link `download`, texto “Android”, versão/tamanho vindos de `downloads/catalogo-czs-android.json` e sem carregar QR/arte pesada no caminho crítico.

- [ ] **Step 4: Confirmar passagem**

Run: `node --test scripts/__tests__/android-app-download.test.js; npm run perf:budget`

Expected: teste PASS e nenhum arquivo em `over`.

- [ ] **Step 5: Commitar o ponto de download**

Run: `git add index.html assets/v8-final/v8-merge-ready.js assets/v8-final/v8-merge-ready.css downloads/catalogo-czs-android.json scripts/__tests__/android-app-download.test.js && git commit -m "Adiciona download do app Android ao site"`

### Task 6: Gerar e assinar o APK TWA

**Files:**
- Create: `android/twa-manifest.json`
- Create: `scripts/build-android-app.ps1`
- Create: `.well-known/assetlinks.json`
- Create locally only: `.secrets/android/catalogo-czs.keystore`
- Create: `downloads/catalogo-czs-android.apk`

- [ ] **Step 1: Instalar Bubblewrap e toolchain fora do runtime do site**

Run: `npx --yes @bubblewrap/cli --version`

Expected: versão do Bubblewrap exibida; o primeiro uso baixa JDK/Android SDK em cache local quando solicitado.

- [ ] **Step 2: Gerar chave fora do Git**

Run: `keytool -genkeypair -keystore .secrets/android/catalogo-czs.keystore -alias catalogo-czs -keyalg RSA -keysize 2048 -validity 10000`

Expected: keystore criado em diretório ignorado pelo Git.

- [ ] **Step 3: Configurar TWA**

`android/twa-manifest.json` deve usar package `com.catalogoczs.app`, host `catalogo-cruzeiro-web.onrender.com`, start URL `/app.html`, versão `1.0.0`, orientação portrait e cores CZS. Gerar `.well-known/assetlinks.json` com o SHA-256 real do certificado criado no passo anterior.

- [ ] **Step 4: Gerar APK release**

Run: `powershell -ExecutionPolicy Bypass -File scripts/build-android-app.ps1`

Expected: `downloads/catalogo-czs-android.apk` assinado e `Get-FileHash -Algorithm SHA256` registrado em `downloads/catalogo-czs-android.json`.

- [ ] **Step 5: Validar APK com ADB**

Run: `adb install -r downloads/catalogo-czs-android.apk`

Expected: `Success`, pacote `com.catalogoczs.app` instalado.

- [ ] **Step 6: Commitar somente arquivos públicos e scripts**

Run: `git add android scripts/build-android-app.ps1 downloads .well-known/assetlinks.json && git commit -m "Gera aplicativo Android CZS"`

### Task 7: Verificação e release Render

**Files:**
- Modify: `render.yaml`
- Modify: `server.js`
- Test: all `scripts/__tests__/*.test.js`

- [ ] **Step 1: Garantir tipos públicos do APK e asset links**

Adicionar `.apk` e `.json` à lista pública com MIME `application/vnd.android.package-archive` e `application/json`, preservando bloqueio das áreas privadas.

- [ ] **Step 2: Executar validação completa**

Run: `$files=(Get-ChildItem scripts/__tests__/*.test.js).FullName; node --test --test-concurrency=1 $files; npm run perf:budget; npm run review:team; npm audit --omit=dev; node scripts/czs-render-p0-regression-check.js`

Expected: testes sem falhas, perf sem `over`, audit sem vulnerabilidades e P0 OK.

- [ ] **Step 3: Verificar release limpo**

Run: `git fetch origin main; git rebase origin/main; git status --short`

Expected: branch baseada no `origin/main` atual e somente arquivos intencionais.

- [ ] **Step 4: Publicar somente com R5 explícito**

Run after approval: `git push origin feature/czs-android-app:main`

Expected: Render inicia auto deploy do commit publicado.

- [ ] **Step 5: Validar publicamente**

Run: `curl.exe -f https://catalogo-cruzeiro-web.onrender.com/api/health; curl.exe -I https://catalogo-cruzeiro-web.onrender.com/downloads/catalogo-czs-android.apk; curl.exe -f https://catalogo-cruzeiro-web.onrender.com/.well-known/assetlinks.json`

Expected: health 200, APK 200 com MIME Android e assetlinks 200.
