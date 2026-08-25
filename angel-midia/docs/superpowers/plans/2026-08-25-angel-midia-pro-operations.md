# Angel Mídia Pro Operations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Entregar uma Central de TVs profissional que mostre saúde e conteúdo real, envie três comandos remotos seguros e receba a confirmação do APK TV.

**Architecture:** A API mantém uma fila isolada `device_remote_commands`, expõe um retrato NOC para o superadministrador e entrega no sincronismo somente o comando da própria TV. O painel amplia a Visão geral existente e nunca confunde comando enfileirado com comando executado. O APK aplica uma allowlist idempotente e confirma o resultado.

**Tech Stack:** Fastify/PostgreSQL, JavaScript ES modules, HTML/CSS, Android Kotlin/Gradle, Node test runner, JUnit.

---

## Task 1: Fila remota e retrato operacional na API

**Files:**
- Create: `angel-midia/api/migrations/011_noc_remote_commands.sql`
- Create: `angel-midia/api/src/routes/noc.js`
- Create: `angel-midia/api/test/noc-remote-commands.test.js`
- Modify: `angel-midia/api/src/app.js`
- Modify: `angel-midia/api/src/routes/devices.js`

- [ ] Escrever testes que exijam: retrato NOC; allowlist `refresh_sync|restart_player|clear_media_cache`; idempotência por chave; isolamento por dispositivo; entrega no `/api/device/sync`; ACK idempotente; expiração; erros determinísticos.
- [ ] Executar `node --test test/noc-remote-commands.test.js` em `angel-midia/api` e confirmar RED.
- [ ] Criar a migration aditiva, sem reutilizar a tabela legada `device_commands`.
- [ ] Implementar `GET /api/admin/noc`, `POST /api/admin/devices/:id/remote-commands` e `POST /api/device/remote-commands/:id/ack`.
- [ ] Acrescentar `remoteCommand` opcional ao retorno já existente de `/api/device/sync`, limitado à TV autenticada.
- [ ] Executar o teste específico até GREEN e depois `node --test` para regressão completa.

## Task 2: Telemetria real enviada pelo APK TV

**Files:**
- Create: `angel-midia/android/tv/src/main/java/br/com/angelmidia/tv/TelemetrySnapshot.kt`
- Create: `angel-midia/android/tv/src/test/java/br/com/angelmidia/tv/TelemetrySnapshotTest.kt`
- Modify: `angel-midia/android/tv/src/main/java/br/com/angelmidia/tv/MainActivity.kt`

- [ ] Escrever teste do JSON compatível com os oito campos aceitos por `PUT /api/device/telemetry`.
- [ ] Executar `gradlew.bat :tv:testDebugUnitTest --tests br.com.angelmidia.tv.TelemetrySnapshotTest` e confirmar RED.
- [ ] Implementar snapshot puro e envio periódico a cada 30 segundos, além dos eventos de início/falha/troca de mídia.
- [ ] Usar `StatFs` para espaço livre e `BuildConfig.VERSION_NAME` para versão; falha de telemetria não interrompe playback.
- [ ] Reexecutar teste específico e suíte `:tv:testDebugUnitTest`.

## Task 3: Executor idempotente de comandos no APK TV

**Files:**
- Create: `angel-midia/android/tv/src/main/java/br/com/angelmidia/tv/DeviceCommandPolicy.kt`
- Create: `angel-midia/android/tv/src/test/java/br/com/angelmidia/tv/DeviceCommandPolicyTest.kt`
- Modify: `angel-midia/android/tv/src/main/java/br/com/angelmidia/tv/MainActivity.kt`

- [ ] Escrever testes de deduplicação, ação permitida, alias legado `schedule_changed`, ACK depois de sucesso e limpeza limitada a extensões de mídia.
- [ ] Executar o teste específico e confirmar RED.
- [ ] Persistir IDs aplicados e ACK pendente em `angel_tv`; jamais executar shell, URL ou ação desconhecida.
- [ ] Implementar `refresh_sync`, reinício interno do player e limpeza somente de `*.mp4`, `*.img` e `*.part` em `cacheDir`.
- [ ] Enviar ACK idempotente e reexecutar testes Android.

## Task 4: Central de TVs no painel

**Files:**
- Create: `angel-midia/controller/tests/overview.test.js`
- Modify: `angel-midia/controller/src/overview.js`
- Modify: `angel-midia/controller/src/app.js`
- Modify: `angel-midia/controller/src/tvs.js`
- Modify: `angel-midia/controller/src/styles.css`
- Modify: `angel-midia/controller/src/responsive.css`
- Modify: `angel-midia/controller/src/solid-minimal.css`
- Modify: `angel-midia/controller/tests/app-shell.test.js`
- Modify: `angel-midia/controller/tests/tvs.test.js`

- [ ] Escrever testes para união de `/admin/devices`, `/admin/live` e `/admin/noc`, KPIs, filtros, mídia atual, deep-link e estados de comando `enviado|executado|falhou`.
- [ ] Executar `npm test -- --reporter=dot` em `angel-midia/controller` e confirmar os novos testes RED.
- [ ] Carregar `/admin/noc`, passar `client` e `refresh` à Visão geral e corrigir Empresas de índice 7 para 8.
- [ ] Renderizar quatro KPIs sólidos, busca/filtro, mapa, alertas e inventário com atributos `data-noc-*` acessíveis.
- [ ] Enfileirar ações com chave idempotente, exigir confirmação para reiniciar/limpar e mostrar pendente até o ACK real.
- [ ] Preservar modo noturno, HUD móvel e responsividade; confirmar ausência de qualquer `*-gradient`.
- [ ] Reexecutar suíte completa do controller.

## Task 5: Ilustração operacional Higgsfield

**Files:**
- Create: `angel-midia/controller/assets/angel-noc-empty.webp`
- Modify: `angel-midia/controller/src/overview.js`
- Modify: `angel-midia/controller/src/styles.css`

- [ ] Consultar o schema do modelo de imagem antes da geração.
- [ ] Gerar uma única ilustração sem texto: terminal/tela 3D minimalista, azul sólido `#0B5FEA`, branco e ciano, fundo transparente ou branco, sem gradiente.
- [ ] Converter/otimizar para WebP e usar somente no estado vazio/introdução, sem substituir ícones funcionais.
- [ ] Verificar peso, contraste e comportamento responsivo.

## Task 6: Verificação integrada e artefatos Android

**Files:**
- Modify only if required by build: `angel-midia/android/gradle.properties`
- Replace generated artifacts: `angel-midia/controller/downloads/angel-midia-admin.apk`, `angel-midia/controller/downloads/angel-midia-tv.apk`

- [ ] Executar `node --test` em `angel-midia/api`.
- [ ] Executar `npm test -- --reporter=dot` em `angel-midia/controller`.
- [ ] Executar `gradlew.bat :tv:testDebugUnitTest :admin:testDebugUnitTest :tv:assembleRelease :admin:assembleRelease` em `angel-midia/android`.
- [ ] Copiar os dois APKs release para `controller/downloads` e registrar SHA-256.
- [ ] Abrir o painel local em desktop e celular, testar filtros, seleção, ações e estados vazios, e guardar screenshots.
- [ ] Rodar `git diff --check` e inspecionar `git status --short`; não fazer push ou deploy sem nova autorização explícita.
