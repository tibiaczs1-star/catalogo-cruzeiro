# Angel Mídia Brand, Library Editor and APKs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Entregar a identidade oficial Angel Mídia, biblioteca detalhada, editor não destrutivo, sons de interface, central de APKs e releases atualizáveis no painel e nos aplicativos Android.

**Architecture:** O PostgreSQL continua como fonte de verdade e recebe metadados técnicos e parâmetros de apresentação separados entre ativo e item de playlist. O Admin web usa módulos pequenos para biblioteca, editor, sons e downloads; o Player consome o manifesto versionado e aplica enquadramento/áudio localmente sem alterar o arquivo original. Os APKs publicados permanecem separados e a release só é anunciada quando os binários servidos e o painel têm a mesma versão.

**Tech Stack:** Node.js ES modules, Fastify, PostgreSQL, HTML/CSS/JavaScript, Vitest/JSDOM, Android/Gradle, Media3, Render.

---

### Task 1: Registrar a identidade visual oficial

**Files:**
- Create: `angel-midia/controller/assets/angel-midia-logo.png`
- Create: `angel-midia/controller/assets/angel-wing.svg`
- Modify: `angel-midia/controller/index.html`
- Modify: `angel-midia/controller/manifest.webmanifest`
- Test: `angel-midia/controller/tests/app-shell.test.js`

- [ ] **Step 1: Write the failing shell test**

Adicionar expectativas para `angel-midia-logo.png`, nome `Angel Mídia Play`, tema `#080e35` e atalhos Admin/TV:

```js
expect(html).toContain('assets/angel-midia-logo.png');
expect(manifest.name).toBe('Angel Mídia Play');
expect(manifest.theme_color).toBe('#080e35');
expect(html).toContain('data-download="admin"');
expect(html).toContain('data-download="tv"');
```

- [ ] **Step 2: Run the test and confirm RED**

Run: `npm test --prefix angel-midia/controller -- app-shell.test.js`
Expected: FAIL porque logo, cor e atalhos ainda não existem.

- [ ] **Step 3: Add the supplied brand assets and semantic shell**

Copiar a imagem aprovada para o caminho do logo, criar uma asa monocromática derivada para marca-d'água e usar markup acessível:

```html
<img class="brand-logo" src="./assets/angel-midia-logo.png" alt="Angel Mídia — Painéis Digitais">
<a data-download="admin" href="./downloads/angel-midia-admin.apk" download>Baixar Admin</a>
<a data-download="tv" href="./downloads/angel-midia-tv.apk" download>Baixar TV</a>
```

- [ ] **Step 4: Run the focused test and confirm GREEN**

Run: `npm test --prefix angel-midia/controller -- app-shell.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add angel-midia/controller/assets angel-midia/controller/index.html angel-midia/controller/manifest.webmanifest angel-midia/controller/tests/app-shell.test.js
git commit -m "feat: apply Angel Midia visual identity"
```

### Task 2: Persistir metadados e edição não destrutiva

**Files:**
- Create: `angel-midia/api/migrations/004_media_presentation.sql`
- Modify: `angel-midia/api/test/media-orchestration.test.js`

- [ ] **Step 1: Write the failing migration assertions**

Exigir dimensões, áudio, miniatura e parâmetros de apresentação no ativo e no item:

```js
for (const column of ['width', 'height', 'has_audio', 'thumbnail_key', 'fit_mode', 'focal_x', 'focal_y', 'zoom', 'rotation', 'background_color']) {
  assert.match(sql, new RegExp(column));
}
for (const column of ['trim_start_seconds', 'trim_end_seconds', 'volume', 'transition_name']) {
  assert.match(sql, new RegExp(column));
}
```

- [ ] **Step 2: Run the test and confirm RED**

Run: `node --test angel-midia/api/test/media-orchestration.test.js`
Expected: FAIL porque `004_media_presentation.sql` não existe.

- [ ] **Step 3: Add the constrained migration**

Criar colunas com limites explícitos:

```sql
ALTER TABLE media_assets ADD COLUMN IF NOT EXISTS width integer CHECK (width > 0);
ALTER TABLE media_assets ADD COLUMN IF NOT EXISTS height integer CHECK (height > 0);
ALTER TABLE media_assets ADD COLUMN IF NOT EXISTS has_audio boolean;
ALTER TABLE media_assets ADD COLUMN IF NOT EXISTS thumbnail_key text;
ALTER TABLE media_assets ADD COLUMN IF NOT EXISTS original_filename text;
ALTER TABLE media_assets ADD COLUMN IF NOT EXISTS fit_mode text NOT NULL DEFAULT 'contain' CHECK (fit_mode IN ('contain','cover','fill'));
ALTER TABLE media_assets ADD COLUMN IF NOT EXISTS focal_x numeric(5,2) NOT NULL DEFAULT 50 CHECK (focal_x BETWEEN 0 AND 100);
ALTER TABLE media_assets ADD COLUMN IF NOT EXISTS focal_y numeric(5,2) NOT NULL DEFAULT 50 CHECK (focal_y BETWEEN 0 AND 100);
ALTER TABLE media_assets ADD COLUMN IF NOT EXISTS zoom numeric(5,2) NOT NULL DEFAULT 1 CHECK (zoom BETWEEN 1 AND 4);
ALTER TABLE media_assets ADD COLUMN IF NOT EXISTS rotation integer NOT NULL DEFAULT 0 CHECK (rotation IN (0,90,180,270));
ALTER TABLE media_assets ADD COLUMN IF NOT EXISTS background_color text NOT NULL DEFAULT '#000000' CHECK (background_color ~ '^#[0-9A-Fa-f]{6}$');
ALTER TABLE playlist_items ADD COLUMN IF NOT EXISTS trim_start_seconds numeric(10,3) CHECK (trim_start_seconds >= 0);
ALTER TABLE playlist_items ADD COLUMN IF NOT EXISTS trim_end_seconds numeric(10,3) CHECK (trim_end_seconds > 0);
ALTER TABLE playlist_items ADD COLUMN IF NOT EXISTS volume numeric(4,3) NOT NULL DEFAULT 1 CHECK (volume BETWEEN 0 AND 1);
ALTER TABLE playlist_items ADD COLUMN IF NOT EXISTS transition_name text NOT NULL DEFAULT 'fade' CHECK (transition_name IN ('none','fade','slide'));
```

- [ ] **Step 4: Run the migration test and confirm GREEN**

Run: `node --test angel-midia/api/test/media-orchestration.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add angel-midia/api/migrations/004_media_presentation.sql angel-midia/api/test/media-orchestration.test.js
git commit -m "feat: persist media presentation metadata"
```

### Task 3: Expor detalhes, uso e atualização da mídia na API

**Files:**
- Modify: `angel-midia/api/src/routes/library.js`
- Modify: `angel-midia/api/src/routes/playlists.js`
- Modify: `angel-midia/api/test/library-playlists.test.js`

- [ ] **Step 1: Write failing route tests**

Cobrir `GET /library/:id`, `PATCH /library/:id` e usos vinculados:

```js
assert.equal(detail.statusCode, 200);
assert.deepEqual(detail.json().presentation, { fitMode: 'cover', focalX: 25, focalY: 70, zoom: 1.2, rotation: 0, backgroundColor: '#000000' });
assert.equal(detail.json().usage.playlists[0].name, 'Vitrine');
assert.equal(detail.json().usage.playingNow[0].deviceName, 'TV Recepção');
assert.equal(patch.statusCode, 200);
assert.equal(patch.json().media.fitMode, 'contain');
```

Também testar rejeição de `focalX: 101`, `zoom: 5`, `rotation: 45` e `trimEnd <= trimStart` com HTTP 400.

- [ ] **Step 2: Run the route tests and confirm RED**

Run: `node --test angel-midia/api/test/library-playlists.test.js`
Expected: FAIL nas rotas de detalhe/edição.

- [ ] **Step 3: Implement normalized responses and validation**

Adicionar conversores puros e reutilizáveis:

```js
const fitModes = new Set(['contain', 'cover', 'fill']);
function numberInRange(value, min, max, field) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < min || parsed > max) throw httpError(400, `invalid_${field}`);
  return parsed;
}
function validatePresentation(body) {
  return {
    fitMode: fitModes.has(body.fitMode) ? body.fitMode : 'contain',
    focalX: numberInRange(body.focalX ?? 50, 0, 100, 'focal_x'),
    focalY: numberInRange(body.focalY ?? 50, 0, 100, 'focal_y'),
    zoom: numberInRange(body.zoom ?? 1, 1, 4, 'zoom'),
    rotation: [0, 90, 180, 270].includes(Number(body.rotation)) ? Number(body.rotation) : 0,
    backgroundColor: /^#[0-9a-f]{6}$/i.test(body.backgroundColor ?? '') ? body.backgroundColor : '#000000'
  };
}
```

Detalhes devem agregar playlists, programações e `playback_status` em consultas parametrizadas; o `PATCH` atualiza somente campos permitidos.

- [ ] **Step 4: Run all API tests and confirm GREEN**

Run: `node --test angel-midia/api/test/*.test.js`
Expected: todos os testes PASS.

- [ ] **Step 5: Commit**

```powershell
git add angel-midia/api/src/routes/library.js angel-midia/api/src/routes/playlists.js angel-midia/api/test/library-playlists.test.js
git commit -m "feat: expose media details editing and usage"
```

### Task 4: Enriquecer o manifesto do Player

**Files:**
- Modify: `angel-midia/api/src/services/schedule.js`
- Modify: `angel-midia/api/test/schedule-priority.test.js`

- [ ] **Step 1: Write a failing manifest test**

```js
assert.deepEqual(manifest.items[0].presentation, {
  fitMode: 'cover', focalX: 25, focalY: 70, zoom: 1.2, rotation: 0, backgroundColor: '#000000'
});
assert.deepEqual(manifest.items[0].playback, {
  trimStartSeconds: 2, trimEndSeconds: 12, volume: 0.8, transition: 'fade'
});
assert.match(manifest.version, /^[a-f0-9]{64}$/);
```

- [ ] **Step 2: Run the schedule test and confirm RED**

Run: `node --test angel-midia/api/test/schedule-priority.test.js`
Expected: FAIL porque o manifesto não contém apresentação/playback.

- [ ] **Step 3: Add presentation fields before hashing the manifest**

Mapear substituições do item sobre os padrões da mídia e calcular a versão somente depois do objeto final ser serializado em ordem estável. Não incluir token, storage key privada ou senha.

- [ ] **Step 4: Run schedule and API suites**

Run: `node --test angel-midia/api/test/schedule-priority.test.js angel-midia/api/test/telemetry.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add angel-midia/api/src/services/schedule.js angel-midia/api/test/schedule-priority.test.js
git commit -m "feat: deliver media presentation in player manifest"
```

### Task 5: Construir a biblioteca responsiva e o inspetor de edição

**Files:**
- Create: `angel-midia/controller/src/library.js`
- Create: `angel-midia/controller/src/media-editor.js`
- Create: `angel-midia/controller/src/library.css`
- Modify: `angel-midia/controller/src/orchestration.js`
- Modify: `angel-midia/controller/src/api.js`
- Modify: `angel-midia/controller/index.html`
- Modify: `angel-midia/controller/tests/orchestration.test.js`

- [ ] **Step 1: Write failing UI tests**

```js
expect(screen.getByText('VÍDEO')).toBeTruthy();
expect(screen.getByText('MP4 · 1920×1080 · 16:9')).toBeTruthy();
expect(screen.getByText('Rodando agora em 2 TVs')).toBeTruthy();
await click(screen.getByRole('button', { name: 'Editar mídia' }));
expect(screen.getByLabelText('Centralização horizontal')).toBeTruthy();
expect(screen.getByLabelText('Modo de ajuste')).toBeTruthy();
```

Testar também `renderLibrary([])`, falha de upload preservando valores, filtros e troca grade/lista.

- [ ] **Step 2: Run controller tests and confirm RED**

Run: `npm test --prefix angel-midia/controller -- orchestration.test.js`
Expected: FAIL porque detalhes e editor não existem.

- [ ] **Step 3: Implement focused modules**

`library.js` exporta `renderMediaCard`, `filterMedia` e `formatMediaFacts`. `media-editor.js` exporta `openMediaEditor`, `buildPresentationPatch` e `applyPreviewTransform`:

```js
export function applyPreviewTransform(node, value) {
  node.style.objectFit = value.fitMode === 'fill' ? 'fill' : value.fitMode;
  node.style.objectPosition = `${value.focalX}% ${value.focalY}%`;
  node.style.transform = `rotate(${value.rotation}deg) scale(${value.zoom})`;
  node.parentElement.style.backgroundColor = value.backgroundColor;
}
```

O cartão exibe miniatura, tipo, formato, dimensões, proporção, tamanho, duração, status e uso. O inspetor usa controles rotulados, grade 3x3, sliders e ações Salvar/Restaurar/Cancelar.

- [ ] **Step 4: Run the focused test and confirm GREEN**

Run: `npm test --prefix angel-midia/controller -- orchestration.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add angel-midia/controller/src/library.js angel-midia/controller/src/media-editor.js angel-midia/controller/src/library.css angel-midia/controller/src/orchestration.js angel-midia/controller/src/api.js angel-midia/controller/index.html angel-midia/controller/tests/orchestration.test.js
git commit -m "feat: add detailed media library and editor"
```

### Task 6: Aplicar o sistema visual marinho, branco e vermelho

**Files:**
- Modify: `angel-midia/controller/src/styles.css`
- Modify: `angel-midia/controller/src/responsive.css`
- Modify: `angel-midia/controller/src/tvs.css`
- Modify: `angel-midia/controller/src/campaigns.css`
- Modify: `angel-midia/controller/tests/app-shell.test.js`

- [ ] **Step 1: Write failing visual-contract assertions**

Exigir tokens e proteções responsivas:

```js
expect(css).toContain('--angel-navy: #080e35');
expect(css).toContain('--angel-red: #e3062c');
expect(css).toContain('min-width: 0');
expect(css).toContain('overflow-x: clip');
expect(css).toContain('@media (prefers-reduced-motion: reduce)');
```

- [ ] **Step 2: Run shell tests and confirm RED**

Run: `npm test --prefix angel-midia/controller -- app-shell.test.js`
Expected: FAIL nos tokens novos.

- [ ] **Step 3: Replace the generic palette and fix overflow**

Definir `--angel-navy`, `--angel-navy-soft`, `--angel-white`, `--angel-red`, `--angel-muted`; usar vermelho apenas para ação/estado. Aplicar `minmax(0, 1fr)`, `min-width: 0`, `max-width: 100%`, quebra de texto e menu móvel. Remover ciano/violeta como acentos dominantes.

- [ ] **Step 4: Run the full controller suite**

Run: `npm test --prefix angel-midia/controller`
Expected: todos os testes PASS.

- [ ] **Step 5: Commit**

```powershell
git add angel-midia/controller/src/styles.css angel-midia/controller/src/responsive.css angel-midia/controller/src/tvs.css angel-midia/controller/src/campaigns.css angel-midia/controller/tests/app-shell.test.js
git commit -m "feat: redesign Angel Midia admin experience"
```

### Task 7: Adicionar identidade sonora acessível

**Files:**
- Create: `angel-midia/controller/src/sound.js`
- Create: `angel-midia/controller/assets/sounds/success.ogg`
- Create: `angel-midia/controller/assets/sounds/alert.ogg`
- Create: `angel-midia/controller/assets/sounds/error.ogg`
- Create: `angel-midia/controller/assets/sounds/start.ogg`
- Create: `angel-midia/controller/tests/sound.test.js`
- Modify: `angel-midia/controller/src/app.js`
- Modify: `angel-midia/controller/sw.js`

- [ ] **Step 1: Write failing sound-policy tests**

```js
expect(getSoundPreferences(storage)).toEqual({ muted: false, volume: 0.35 });
playUiSound('success', { mediaIsPlaying: true });
expect(audio.play).not.toHaveBeenCalled();
setSoundPreferences({ muted: true, volume: 0.2 });
expect(storage.getItem('angel-sound')).toContain('"muted":true');
```

- [ ] **Step 2: Run the sound test and confirm RED**

Run: `npm test --prefix angel-midia/controller -- sound.test.js`
Expected: FAIL porque `sound.js` não existe.

- [ ] **Step 3: Implement a lazy sound manager**

```js
const SOUND_URLS = { success: './assets/sounds/success.ogg', alert: './assets/sounds/alert.ogg', error: './assets/sounds/error.ogg', start: './assets/sounds/start.ogg' };
export function playUiSound(kind, { mediaIsPlaying = false } = {}) {
  const prefs = getSoundPreferences(localStorage);
  if (prefs.muted || mediaIsPlaying || !SOUND_URLS[kind]) return false;
  const audio = new Audio(SOUND_URLS[kind]);
  audio.volume = prefs.volume;
  void audio.play().catch(() => {});
  return true;
}
```

Usar arquivos originais/licenciados, curtos, normalizados e menores que 80 KB cada. Pré-cachear para funcionamento offline e disparar somente em login, upload, salvar, publicar, sincronizar, alerta e erro.

- [ ] **Step 4: Run sound and controller tests**

Run: `npm test --prefix angel-midia/controller`
Expected: PASS sem reprodução quando vídeo estiver ativo ou preferência estiver muda.

- [ ] **Step 5: Commit**

```powershell
git add angel-midia/controller/src/sound.js angel-midia/controller/assets/sounds angel-midia/controller/tests/sound.test.js angel-midia/controller/src/app.js angel-midia/controller/sw.js
git commit -m "feat: add accessible Angel Midia interaction sounds"
```

### Task 8: Criar a central real dos dois APKs

**Files:**
- Create: `angel-midia/controller/src/apps.js`
- Create: `angel-midia/controller/src/release.js`
- Create: `angel-midia/controller/release.json`
- Create: `angel-midia/controller/tests/apps.test.js`
- Modify: `angel-midia/controller/src/app.js`
- Modify: `angel-midia/controller/index.html`
- Modify: `angel-midia/controller/sw.js`

- [ ] **Step 1: Write failing APK metadata tests**

```js
expect(release.apps.admin.path).toBe('./downloads/angel-midia-admin.apk');
expect(release.apps.tv.path).toBe('./downloads/angel-midia-tv.apk');
expect(release.apps.admin.sha256).toMatch(/^[a-f0-9]{64}$/);
expect(renderApps(release)).toContain('Angel Mídia Admin');
expect(renderApps(release)).toContain('Angel Mídia TV');
```

- [ ] **Step 2: Run the apps test and confirm RED**

Run: `npm test --prefix angel-midia/controller -- apps.test.js`
Expected: FAIL porque página e metadados não existem.

- [ ] **Step 3: Implement release metadata loaded from one source**

`release.json` terá `release`, `publishedAt` e, para cada APK, `version`, `sizeBytes`, `sha256`, `minAndroid`, `path` e `purpose`. `apps.js` renderiza tamanho, data, compatibilidade, hash copiável e instruções; atalhos do menu reutilizam os mesmos caminhos.

- [ ] **Step 4: Generate hashes and run tests**

Run: `Get-FileHash angel-midia/controller/downloads/*.apk -Algorithm SHA256`
Run: `npm test --prefix angel-midia/controller`
Expected: hashes do JSON iguais aos arquivos e testes PASS.

- [ ] **Step 5: Commit**

```powershell
git add angel-midia/controller/src/apps.js angel-midia/controller/src/release.js angel-midia/controller/release.json angel-midia/controller/tests/apps.test.js angel-midia/controller/src/app.js angel-midia/controller/index.html angel-midia/controller/sw.js
git commit -m "feat: add versioned Angel Midia app downloads"
```

### Task 9: Atualizar e validar os APKs Admin e TV

**Files:**
- Create: `angel-midia/android/settings.gradle.kts`
- Create: `angel-midia/android/build.gradle.kts`
- Create: `angel-midia/android/gradle.properties`
- Create: `angel-midia/android/admin/build.gradle.kts`
- Create: `angel-midia/android/admin/src/main/AndroidManifest.xml`
- Create: `angel-midia/android/admin/src/main/java/br/com/angelmidia/admin/MainActivity.kt`
- Create: `angel-midia/android/admin/src/test/java/br/com/angelmidia/admin/NavigationPolicyTest.kt`
- Create: `angel-midia/android/tv/build.gradle.kts`
- Create: `angel-midia/android/tv/src/main/AndroidManifest.xml`
- Create: `angel-midia/android/tv/src/main/java/br/com/angelmidia/tv/MainActivity.kt`
- Create: `angel-midia/android/tv/src/main/java/br/com/angelmidia/tv/ManifestRepository.kt`
- Create: `angel-midia/android/tv/src/test/java/br/com/angelmidia/tv/ManifestRepositoryTest.kt`
- Replace: `angel-midia/controller/downloads/angel-midia-admin.apk`
- Replace: `angel-midia/controller/downloads/angel-midia-tv.apk`
- Replace: `angel-midia/downloads/Angel-Midia-Admin.apk`
- Replace: `angel-midia/downloads/Angel-Midia-TV.apk`
- Modify: `angel-midia/controller/release.json`
- Create: `angel-midia/controller/tests/apk-artifacts.test.js`

- [ ] **Step 1: Write failing artifact checks**

O teste abre os APKs como ZIP e exige `AndroidManifest.xml`, `classes.dex`, tamanho maior que 100 KB, hashes diferentes entre Admin/TV e igualdade entre as duas cópias publicadas de cada aplicativo.

- [ ] **Step 2: Run artifact tests and record the current failure**

Run: `npm test --prefix angel-midia/controller -- apk-artifacts.test.js`
Expected: FAIL se os binários atuais forem marcadores, divergirem ou não tiverem a release nova.

- [ ] **Step 3: Create the reproducible two-module Android source**

Criar `angel-midia/android` com módulos `:admin` e `:tv`, Kotlin, Android Gradle Plugin e repositórios fixados. Centralizar `versionCode`, `versionName` e a URL base em propriedades Gradle sem segredo:

```kotlin
// settings.gradle.kts
pluginManagement { repositories { google(); mavenCentral(); gradlePluginPortal() } }
dependencyResolutionManagement { repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS); repositories { google(); mavenCentral() } }
rootProject.name = "AngelMidiaPlay"
include(":admin", ":tv")
```

O build release lê assinatura exclusivamente de variáveis de ambiente; se elas não existirem, gera artefato unsigned para teste e bloqueia publicação no passo de verificação.

- [ ] **Step 4: Write Android unit tests and confirm RED**

No Admin, testar que somente `https://catalogo-cruzeiro-web.onrender.com/angel-midia/` e seus recursos internos são permitidos. Na TV, testar parse do manifesto, ordem, prioridade, apresentação, corte lógico e rejeição de SHA-256 inválido.

Run: `angel-midia/android/gradlew.bat test`
Expected: FAIL até as duas implementações existirem.

- [ ] **Step 5: Implement and build the Admin APK**

Configurar nome `Angel Mídia Admin`, identidade marinho/branco/vermelho e uma `MainActivity` WebView restrita à origem aprovada. Habilitar upload pelo seletor nativo, downloads dos APKs, cache do shell, sons/vibração respeitando modo silencioso e bloqueio de HTTP/navegação externa. Usar `versionName` igual a `release.json`.

Run: `angel-midia/android/gradlew.bat :admin:test :admin:assembleRelease`
Expected: testes PASS e `admin/build/outputs/apk/release/admin-release.apk` criado.

- [ ] **Step 6: Implement and build the TV APK**

Configurar `Angel Mídia TV` com Media3, ativação por token individual, cache transacional, SHA-256, aplicação de `objectFit` equivalente, ponto focal, rotação, zoom, volume e corte lógico. Sons de interface só em ativação/sincronização/erro e nunca entre anúncios. Executar `gradlew test assembleRelease` e assinatura segura.

- [ ] **Step 7: Replace artifacts and update exact metadata**

Copiar os APKs release para os quatro caminhos, calcular `Get-FileHash` e `(Get-Item).Length`, atualizar `release.json` e verificar com `apksigner verify --verbose` e `apkanalyzer manifest print`.

- [ ] **Step 8: Run Android and artifact tests and confirm GREEN**

Run: `angel-midia/android/gradlew.bat test`
Run: `npm test --prefix angel-midia/controller -- apk-artifacts.test.js`
Expected: PASS para comportamento Android, estrutura dos APKs, paridade e hashes.

- [ ] **Step 9: Commit**

```powershell
git add angel-midia/android angel-midia/controller/downloads angel-midia/downloads angel-midia/controller/release.json angel-midia/controller/tests/apk-artifacts.test.js
git commit -m "feat: publish updated Angel Midia Android apps"
```

### Task 10: Verificação integrada, release e deploy autorizado

**Files:**
- Modify: `angel-midia/controller/sw.js`
- Modify: `angel-midia/controller/index.html`
- Modify: `angel-midia/controller/release.json`
- Create: `docs/reports/2026-08-19-angel-midia-release-verification.md`

- [ ] **Step 1: Run complete automated verification**

Run: `node --test angel-midia/api/test/*.test.js`
Run: `npm test --prefix angel-midia/controller`
Run: `node --check angel-midia/api/src/app.js`
Run: `node --check angel-midia/controller/src/app.js`
Expected: todos saem com código 0.

- [ ] **Step 2: Verify desktop and mobile locally**

Abrir o painel em 1440×900, 768×1024 e 390×844. Validar login, upload JPG/MP4, detalhes, editor, filtros, onde está rodando, sons/mudo, mapa, programação e downloads. Confirmar `document.documentElement.scrollWidth === window.innerWidth` nos três tamanhos e registrar screenshots.

- [ ] **Step 3: Verify offline and release replacement**

Instalar o service worker, carregar biblioteca/aplicativos, simular offline, recarregar e confirmar shell/sons disponíveis. Alterar a versão de teste, ativar novo worker e confirmar limpeza do cache anterior e aviso **Nova versão disponível**.

- [ ] **Step 4: Verify APKs before external effect**

Instalar Admin e TV em emulador/dispositivo autorizado; autenticar Admin, ativar TV de teste, baixar playlist, cortar rede e comprovar reprodução cacheada. Confirmar que vídeo com áudio silencia sons da interface.

- [ ] **Step 5: Record evidence and obtain fresh R5 authorization**

Escrever comandos, contagens de testes, hashes, versão e resultado visual em `docs/reports/2026-08-19-angel-midia-release-verification.md`. Antes de push/deploy, pedir autorização explícita desta release; autorização anterior não é reutilizada automaticamente.

- [ ] **Step 6: Push and deploy only after authorization**

Run: `git push origin HEAD:main`
Expected: push aceito. Aguardar Render concluir em estado `live`, sem alterar segredos fora do escopo.

- [ ] **Step 7: Validate production**

Na URL pública, comprovar login, upload real e limpeza da mídia de teste, edição, programação, release visível, service worker atualizado e HTTP 200 dos dois APKs. Comparar tamanho e SHA-256 baixados com `release.json`.

- [ ] **Step 8: Commit the evidence report if it changed after production**

```powershell
git add docs/reports/2026-08-19-angel-midia-release-verification.md
git commit -m "docs: record Angel Midia release verification"
```
