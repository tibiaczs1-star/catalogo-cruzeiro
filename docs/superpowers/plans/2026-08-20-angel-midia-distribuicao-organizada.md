# Angel Mídia Distribuição Organizada Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Entregar o fluxo Mídia → Playlist → Conjunto de TVs → Ativação, com relacionamentos visíveis e reprodução fullscreen sem corte indevido.

**Architecture:** A API passa a expor CRUD de conjuntos e detalhes dos vínculos entre mídias, playlists, conjuntos e TVs. O painel reúne a publicação em uma tela guiada, mantendo Biblioteca, Playlists e Programação para ajustes especializados. O player usa os metadados de apresentação existentes e respeita a orientação configurada da TV.

**Tech Stack:** Node.js, Fastify, PostgreSQL, JavaScript modular, Vitest/jsdom, Android Kotlin.

---

### Task 1: API de conjuntos de TVs

**Files:**
- Create: `angel-midia/api/src/routes/groups.js`
- Modify: `angel-midia/api/src/app.js`
- Test: `angel-midia/api/test/groups.test.js`

- [ ] **Step 1: Write the failing tests**

Testar validação de nome, deduplicação de IDs, rejeição de TV inexistente e retorno do conjunto com suas TVs.

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- --run test/groups.test.js`
Expected: FAIL porque a rota e os validadores ainda não existem.

- [ ] **Step 3: Implement the minimal API**

Criar `GET /api/admin/groups`, `POST /api/admin/groups` e `PATCH /api/admin/groups/:id`, usando transação para substituir os vínculos em `group_devices`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- --run test/groups.test.js`
Expected: PASS.

### Task 2: Relacionamentos e visualização integral das mídias

**Files:**
- Modify: `angel-midia/api/src/routes/library.js`
- Modify: `angel-midia/api/src/routes/playlists.js`
- Modify: `angel-midia/controller/src/library.js`
- Modify: `angel-midia/controller/src/library.css`
- Test: `angel-midia/api/test/library-playlists.test.js`
- Test: `angel-midia/controller/tests/library.test.js`

- [ ] **Step 1: Write failing relationship and preview tests**

Exigir tipo legível, dimensões/duração disponíveis, playlists relacionadas, conjuntos e TVs atingidas; exigir `object-fit: contain` na prévia padrão.

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- --run test/library-playlists.test.js` na API e `npm test -- --run tests/library.test.js` no controller.
Expected: FAIL nos novos campos e marcadores.

- [ ] **Step 3: Implement relationships and cards**

Enriquecer o detalhe da mídia e os cartões com marcadores de playlists, destinos e estado, mantendo editor para `contain`, `cover`, ponto focal, zoom, rotação, fundo e volume.

- [ ] **Step 4: Run focused tests**

Expected: PASS nos dois arquivos.

### Task 3: Fluxo guiado de distribuição

**Files:**
- Create: `angel-midia/controller/src/distribution.js`
- Create: `angel-midia/controller/src/distribution.css`
- Modify: `angel-midia/controller/src/app.js`
- Modify: `angel-midia/controller/index.html`
- Test: `angel-midia/controller/tests/distribution.test.js`

- [ ] **Step 1: Write failing UI tests**

Testar seleção de mídias, ordem da playlist, criação/seleção do conjunto, seleção múltipla somente de TVs ativas e payload de programação por grupo.

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- --run tests/distribution.test.js`
Expected: FAIL porque o módulo não existe.

- [ ] **Step 3: Implement the guided flow**

Adicionar tela `Distribuição` com quatro etapas, resumo final e publicação imediata padrão; criar playlist e conjunto antes de publicar `target: { type: 'group', id }`.

- [ ] **Step 4: Run focused controller tests**

Expected: PASS.

### Task 4: Orientação e fullscreen do Player TV

**Files:**
- Modify: `angel-midia/android/tv/src/main/java/br/com/angelmidia/tv/MainActivity.kt`
- Modify: `angel-midia/android/tv/src/main/AndroidManifest.xml`
- Test: `angel-midia/api/test/schedule-priority.test.js`

- [ ] **Step 1: Add contract assertions**

Exigir que o manifesto inclua `fitMode`, ponto focal, cor de fundo e metadado de orientação quando configurado.

- [ ] **Step 2: Verify current failure**

Run: `npm test -- --run test/schedule-priority.test.js`
Expected: FAIL apenas para o novo contrato de orientação.

- [ ] **Step 3: Implement fullscreen orientation behavior**

Manter modo imersivo; usar `FIT_CENTER` para `contain`, `CENTER_CROP` somente para `cover`, fundo preto/desfocado configurável e orientação da tela sem cortar a mídia por padrão.

- [ ] **Step 4: Build TV APK**

Run: `./gradlew :tv:assembleDebug`
Expected: BUILD SUCCESSFUL.

### Task 5: Verificação integrada e publicação

**Files:**
- Modify: `angel-midia/controller/src/release.js`
- Modify: `angel-midia/controller/release.json`
- Modify: `angel-midia/controller/sw.js`
- Modify: APKs em `angel-midia/controller/downloads/`

- [ ] **Step 1: Run all automated tests**

Run API and controller test suites; expected: all PASS.

- [ ] **Step 2: Build both APKs**

Expected: BUILD SUCCESSFUL for admin and TV.

- [ ] **Step 3: Perform local browser acceptance**

Validar visualmente mídia inteira, marcadores, criação de conjunto e resumo da distribuição.

- [ ] **Step 4: Commit and deploy authorized release**

Commit the verified files, push the authorized deployment branch, then verify the public version and API health.

