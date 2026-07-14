# AShotelaria Simulation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fazer login, senhas e reserva funcionarem no navegador e entregar uma operação demonstrativa completa do Hotel Juruá Palace.

**Architecture:** Corrigir a coleta dos formulários no frontend, controlar a exigência de troca inicial por configuração explícita e ampliar o seed idempotente do PostgreSQL. Adicionar uma única transição autenticada de status de reserva, implementada de forma equivalente nas stores de memória e PostgreSQL e consumida pelo painel.

**Tech Stack:** Node.js 18+, `node:test`, JavaScript sem framework, PostgreSQL 16, HTML/CSS e Google Chrome.

---

### Task 1: Regressão dos formulários

**Files:**
- Modify: `ashotelaria/__tests__/frontend-contract.test.js`
- Modify: `ashotelaria-app/app.js`
- Modify: `ashotelaria-app/booking.js`

- [ ] **Step 1: Write the failing test**

Adicionar um teste que isola `handleLogin`, `searchAvailability` e `createReservation` e verifica que `new FormData(...)` aparece antes de `setBusy(..., true)`.

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test ashotelaria/__tests__/frontend-contract.test.js`

Expected: FAIL porque os três handlers desativam os campos antes de construir `FormData`.

- [ ] **Step 3: Write minimal implementation**

Mover a leitura de cada formulário para antes de `setBusy`. Mapear também `INVALID_REQUEST`, `ROLE_REQUIRED`, `IDEMPOTENCY_KEY_REQUIRED` e `INVALID_IDEMPOTENCY_KEY` para mensagens diretas em português.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test ashotelaria/__tests__/frontend-contract.test.js`

Expected: PASS.

### Task 2: Senhas iniciais utilizáveis no modo demonstração

**Files:**
- Modify: `ashotelaria/__tests__/auth.test.js`
- Modify: `ashotelaria/auth.js`
- Modify: `server.js`
- Modify: `ashotelaria/.env.example`

- [ ] **Step 1: Write the failing test**

Adicionar caso com `requireInitialPasswordChange: false` que autentica senha inicial de quatro caracteres e espera `session.forceChange === false`, inclusive para perfil previamente criado como temporário.

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test ashotelaria/__tests__/auth.test.js`

Expected: FAIL porque a configuração ainda não existe.

- [ ] **Step 3: Write minimal implementation**

Ler `ASHOTELARIA_REQUIRE_PASSWORD_CHANGE`; quando for `false`, criar e normalizar perfis iniciais com `forceChange: false`. Passar a configuração do servidor para o serviço de autenticação e documentar a variável.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test ashotelaria/__tests__/auth.test.js`

Expected: PASS.

### Task 3: Inventário e reservas demonstrativas

**Files:**
- Modify: `ashotelaria/__tests__/memory-store.test.js`
- Modify: `ashotelaria/seed.js`
- Modify: `ashotelaria/migrate.js`

- [ ] **Step 1: Write the failing test**

Exigir três categorias, doze quartos do Hotel Juruá Palace e reservas demonstrativas nos estados `confirmed`, `checked_in`, `checked_out` e `cancelled`.

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test ashotelaria/__tests__/memory-store.test.js`

Expected: FAIL com apenas uma categoria e dois quartos.

- [ ] **Step 3: Write minimal implementation**

Adicionar Standard, Superior e Suíte Família, quatro quartos por categoria, tarefas e ordens coerentes. Inserir hóspedes, reservas e vínculos de quarto no bootstrap PostgreSQL usando `ON CONFLICT DO NOTHING`, para não sobrescrever ações manuais.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test ashotelaria/__tests__/memory-store.test.js`

Expected: PASS.

### Task 4: Ciclo operacional das reservas

**Files:**
- Modify: `ashotelaria/__tests__/memory-store.test.js`
- Modify: `ashotelaria/__tests__/store.test.js`
- Modify: `ashotelaria/__tests__/http.test.js`
- Modify: `ashotelaria/auth.js`
- Modify: `ashotelaria/memory-store.js`
- Modify: `ashotelaria/postgres-store.js`
- Modify: `ashotelaria/http.js`
- Modify: `ashotelaria-app/app.js`
- Modify: `ashotelaria-app/styles.css`

- [ ] **Step 1: Write the failing tests**

Cobrir `confirmed -> checked_in -> checked_out`, `confirmed -> cancelled`, rejeição de transição inválida, escopo por hotel, auditoria e permissão `reservations.manage`.

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --test ashotelaria/__tests__/memory-store.test.js ashotelaria/__tests__/store.test.js ashotelaria/__tests__/http.test.js`

Expected: FAIL porque `updateReservationStatus` e a rota ainda não existem.

- [ ] **Step 3: Write minimal implementation**

Adicionar `PATCH /reservations/:id/status`, atualizar reserva e quarto na mesma operação e renderizar botões de check-in, check-out e cancelamento no painel. Corrigir a rotação de quarto para usar `blocked`, que é o estado persistido aceito.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test`

Expected: todas as suítes PASS.

### Task 5: Verificação e publicação

**Files:**
- Modify: `ashotelaria-app/index.html`
- Modify: `ashotelaria-app/booking.html`
- Create: `outputs/ashotelaria/manual-chrome-report.md`

- [ ] **Step 1: Invalidate static cache and run local checks**

Atualizar a versão dos assets para `20260714-p2` e executar `npm run ashotelaria:check`, `npm test` e `git diff --check`.

- [ ] **Step 2: Deploy**

Configurar `ASHOTELARIA_REQUIRE_PASSWORD_CHANGE=false`, executar migrations e publicar o commit no serviço Render `catalogo-cruzeiro-web`.

- [ ] **Step 3: Manual Google Chrome validation**

Validar no site publicado: login `admin`/`administrador`, painel com doze quartos, reserva pública completa, nova reserva visível no painel e transições de check-in/check-out. Registrar resultados e capturas em `outputs/ashotelaria/`.

- [ ] **Step 4: Final smoke**

Confirmar health, propriedade, disponibilidade e ausência de erros de console originados pela AShotelaria.
