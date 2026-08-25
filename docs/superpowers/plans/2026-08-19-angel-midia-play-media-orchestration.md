# Angel Mídia Play Media Orchestration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Entregar biblioteca de mídia, playlists ordenadas, programação por destino/prioridade, telemetria de TVs, painel premium, atualização automática e APKs versionados do Angel Mídia Play.

**Architecture:** O PostgreSQL permanece como fonte de verdade; novas tabelas desacoplam arquivos, playlists e estado de reprodução, enquanto rotas Fastify autenticadas servem o Admin e tokens individuais servem as TVs. O painel web modular consome essas rotas e o Player recebe um manifesto versionado para baixar e reproduzir offline.

**Tech Stack:** Node.js, Fastify, PostgreSQL, JavaScript ES modules, HTML/CSS responsivo, Vitest/JSDOM, Android/Gradle, Render.

---

### Task 1: Persistência de mídia e playlists

**Files:**
- Create: `angel-midia/api/migrations/003_media_orchestration.sql`
- Test: `angel-midia/api/test/media-orchestration.test.js`

- [ ] **Step 1: Write the failing test**

Criar teste que lê a migration e exige `playlists`, `playlist_items`, `playback_status`, `download_status`, posição única e duração de imagem.

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test angel-midia/api/test/media-orchestration.test.js`
Expected: FAIL porque a migration ainda não existe.

- [ ] **Step 3: Write minimal implementation**

Criar migration idempotente, tornar `media_assets.campaign_id` opcional, adicionar metadados e criar as quatro tabelas com chaves e índices.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test angel-midia/api/test/media-orchestration.test.js`
Expected: PASS.

### Task 2: Login do superadministrador

**Files:**
- Modify: `angel-midia/api/src/routes/auth.js`
- Modify: `angel-midia/api/src/migrate.js`
- Test: `angel-midia/api/test/auth-username.test.js`

- [ ] **Step 1: Write the failing test**

Testar login aceitando somente `identifier` e `password`, localizando `admin` por nome ou e-mail e mantendo comparação de hash.

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test angel-midia/api/test/auth-username.test.js`
Expected: FAIL com `invalid_request` para `identifier`.

- [ ] **Step 3: Write minimal implementation**

Aceitar `identifier` (com compatibilidade temporária de `email`) e inicializar/atualizar o usuário `admin` a partir de `ANGEL_ADMIN_PASSWORD_HASH`, nunca de senha em texto.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test angel-midia/api/test/auth-username.test.js`
Expected: PASS.

### Task 3: Biblioteca e playlists na API

**Files:**
- Create: `angel-midia/api/src/routes/library.js`
- Create: `angel-midia/api/src/routes/playlists.js`
- Modify: `angel-midia/api/src/app.js`
- Test: `angel-midia/api/test/library-playlists.test.js`

- [ ] **Step 1: Write the failing test**

Cobrir upload JPG/PNG/WebP/MP4, listagem, bloqueio de exclusão em uso, criação de playlist, validação da ordem e duração obrigatória para imagem.

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test angel-midia/api/test/library-playlists.test.js`
Expected: FAIL com rotas 404.

- [ ] **Step 3: Write minimal implementation**

Implementar CRUD autenticado com transações, IDs UUID, MIME validado pelo storage existente e posições inteiras contíguas.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test angel-midia/api/test/library-playlists.test.js`
Expected: PASS.

### Task 4: Programação, prioridade e manifesto

**Files:**
- Modify: `angel-midia/api/src/routes/schedules.js`
- Modify: `angel-midia/api/src/services/schedule.js`
- Test: `angel-midia/api/test/schedule-priority.test.js`

- [ ] **Step 1: Write the failing test**

Testar destinos TV/grupo/todas, prioridades `normal`, `alta`, `urgente`, desempate pela criação mais recente e itens ordenados no manifesto.

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test angel-midia/api/test/schedule-priority.test.js`
Expected: FAIL porque a API ainda exige campanha numérica.

- [ ] **Step 3: Write minimal implementation**

Associar programação a `playlist_id`, mapear prioridades para 0/50/100 e resolver apenas a programação ativa vencedora antes de montar manifesto versionado.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test angel-midia/api/test/schedule-priority.test.js`
Expected: PASS.

### Task 5: Telemetria e visão ao vivo

**Files:**
- Create: `angel-midia/api/src/routes/telemetry.js`
- Modify: `angel-midia/api/src/app.js`
- Test: `angel-midia/api/test/telemetry.test.js`

- [ ] **Step 1: Write the failing test**

Cobrir heartbeat da TV, mídia atual/próxima, posição, download, erro, armazenamento e classificação online em 90 segundos.

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test angel-midia/api/test/telemetry.test.js`
Expected: FAIL com rotas 404.

- [ ] **Step 3: Write minimal implementation**

Persistir upserts autenticados pelo token da TV e fornecer listagem administrativa consolidada.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test angel-midia/api/test/telemetry.test.js`
Expected: PASS.

### Task 6: Painel premium completo

**Files:**
- Modify: `angel-midia/controller/index.html`
- Modify: `angel-midia/controller/src/app.js`
- Create: `angel-midia/controller/src/library.js`
- Create: `angel-midia/controller/src/playlists.js`
- Create: `angel-midia/controller/src/live.js`
- Create: `angel-midia/controller/src/reports.js`
- Modify: `angel-midia/controller/src/styles.css`
- Modify: `angel-midia/controller/src/responsive.css`
- Test: `angel-midia/controller/tests/orchestration.test.js`

- [ ] **Step 1: Write the failing test**

Exigir as sete áreas, login com identificador, formulários de upload/playlist/programação, mapa, cards ao vivo e estados vazios.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test --prefix angel-midia/controller`
Expected: FAIL porque a navegação antiga tem quatro áreas.

- [ ] **Step 3: Write minimal implementation**

Construir os módulos acessíveis e responsivos usando a identidade marinho, vidro, celeste e violeta; todos os formulários chamam a API real e atualizam a tela.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test --prefix angel-midia/controller`
Expected: PASS.

### Task 7: Atualização imediata e releases

**Files:**
- Modify: `angel-midia/controller/sw.js`
- Modify: `angel-midia/controller/index.html`
- Modify: `angel-midia/controller/manifest.webmanifest`
- Create: `angel-midia/controller/src/release.js`
- Test: `angel-midia/controller/tests/release.test.js`

- [ ] **Step 1: Write the failing test**

Exigir rede primeiro para navegação/manifesto/SW, cache com versão, remoção de caches antigos, aviso de update e versão visível dos APKs.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test --prefix angel-midia/controller`
Expected: FAIL com cache fixo v1.

- [ ] **Step 3: Write minimal implementation**

Aplicar release única nos assets e downloads, `skipWaiting`, `clients.claim`, limpeza e fluxo de recarga quando novo worker assumir.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test --prefix angel-midia/controller`
Expected: PASS.

### Task 8: APK Admin e Player TV

**Files:**
- Modify/Create: fontes Android do repositório `angel-midia-play-appstation`
- Replace: `angel-midia/controller/downloads/angel-midia-admin.apk`
- Replace: `angel-midia/controller/downloads/angel-midia-tv.apk`

- [ ] **Step 1: Add failing Android checks**

Exigir nome `Angel Mídia Play`, versionCode/versionName novos, URLs públicas corretas e, no Player, cache transacional do manifesto e telemetria.

- [ ] **Step 2: Run checks to verify failure**

Run: `gradlew test`
Expected: FAIL nas expectativas da nova release.

- [ ] **Step 3: Implement and build**

Atualizar Admin como invólucro seguro da subpágina e Player com download, validação SHA-256, ativação atômica, reprodução em loop e heartbeat.

- [ ] **Step 4: Verify artifacts**

Run: `gradlew test assembleRelease` e `apksigner verify --verbose <apk>`
Expected: testes verdes e assinatura válida nos dois APKs.

### Task 9: Verificação visual e deploy

**Files:**
- Modify: `docs/superpowers/plans/2026-08-19-angel-midia-play-media-orchestration.md`

- [ ] **Step 1: Run complete verification**

Run: testes Node/API, Vitest, `node --check`, Gradle e inspeção de APKs.
Expected: todos com saída 0.

- [ ] **Step 2: Validate locally in browsers**

Abrir desktop e mobile, autenticar, enviar mídia, montar playlist, programar e verificar estados ao vivo e atualização do service worker.

- [ ] **Step 3: Commit and push authorized release**

Run: `git push origin HEAD:main`
Expected: push aceito em `tibiaczs1-star/catalogo-cruzeiro`.

- [ ] **Step 4: Configure Render securely and deploy**

Definir somente o hash da senha em variável secreta, iniciar deploy dos serviços e aguardar estado `live`.

- [ ] **Step 5: Validate public acceptance**

Confirmar health, login `admin`, operações principais, atualização visual e downloads HTTP 200 com tamanho/hash da release.
