# AShotelaria Check-in Safety Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tornar o check-in temporalmente correto, atomicamente seguro por quarto e publicamente controlado via HTTP 409.

**Architecture:** Validadores compartilhados no domínio recebem o dia operacional já calculado pelo fuso da propriedade. Os stores injetam o relógio, validam antes de mutar e serializam pelo quarto; o PostgreSQL mantém locks, mutações e auditoria na mesma transação.

**Tech Stack:** Node.js CommonJS, `node:test`, store em memória e PostgreSQL transacional.

---

### Task 1: Regras de data e erro HTTP

**Files:**
- Modify: `ashotelaria/domain.js`
- Modify: `ashotelaria/http.js`
- Test: `ashotelaria/__tests__/domain.test.js`
- Test: `ashotelaria/__tests__/http.test.js`

- [ ] **Step 1: Escrever testes falhos**

Adicionar casos que exigem conversão de `2026-07-15T03:30:00Z` para `2026-07-14` em `America/Rio_Branco`, rejeitam dia anterior/checkout com `CHECK_IN_NOT_ALLOWED` e esperam HTTP 409 público.

- [ ] **Step 2: Executar RED**

Run: `node --test --test-name-pattern="check-in|CHECK_IN_NOT_ALLOWED" ashotelaria/__tests__/domain.test.js ashotelaria/__tests__/http.test.js`

Expected: FAIL porque os validadores e o mapeamento ainda não existem.

- [ ] **Step 3: Implementar o mínimo**

Exportar `operationalDate(now, timeZone)` e `validateCheckInEligibility({ checkIn, checkOut, operationalDate })`; o segundo lança erro com `code = "CHECK_IN_NOT_ALLOWED"`. Mapear a mensagem pública em `normalizeError`.

- [ ] **Step 4: Executar GREEN**

Run: `node --test --test-name-pattern="check-in|CHECK_IN_NOT_ALLOWED" ashotelaria/__tests__/domain.test.js ashotelaria/__tests__/http.test.js`

Expected: PASS.

### Task 2: Segurança equivalente no memory store

**Files:**
- Modify: `ashotelaria/memory-store.js`
- Modify: `ashotelaria/seed.js`
- Test: `ashotelaria/__tests__/memory-store.test.js`

- [ ] **Step 1: Escrever testes falhos**

Adicionar casos para relógio injetado, quarto `maintenance`, outra reserva `checked_in` no mesmo quarto e concorrência; conferir reserva/quarto/auditoria inalterados nos erros.

- [ ] **Step 2: Executar RED**

Run: `node --test --test-name-pattern="check-in" ashotelaria/__tests__/memory-store.test.js`

Expected: FAIL porque a implementação atual muda reserva e quarto sem as novas validações.

- [ ] **Step 3: Implementar o mínimo**

Aceitar `{ now }` como segundo argumento do store, serializar por `tenantId:propertyId:roomId`, validar dia, estado pronto e conflito antes de mudar a reserva para `checked_in` e o quarto para `occupied`. Preservar a auditoria existente após a mutação válida.

- [ ] **Step 4: Executar GREEN**

Run: `node --test --test-name-pattern="check-in|reservation lifecycle" ashotelaria/__tests__/memory-store.test.js`

Expected: PASS.

### Task 3: Locks e invariantes no PostgreSQL

**Files:**
- Modify: `ashotelaria/postgres-store.js`
- Test: `ashotelaria/__tests__/store.test.js`

- [ ] **Step 1: Escrever testes falhos**

Exigir `properties.time_zone`, `rooms ... FOR UPDATE`, consulta scoped de outra reserva `checked_in`, ausência de updates/audit em conflito, rollback e sucesso auditado.

- [ ] **Step 2: Executar RED**

Run: `node --test --test-name-pattern="PostgreSQL check-in" ashotelaria/__tests__/store.test.js`

Expected: FAIL porque o quarto ainda não é bloqueado ou validado.

- [ ] **Step 3: Implementar o mínimo**

Injetar `now`, carregar o fuso com a reserva, bloquear o quarto e consultar o conflito após o lock. Usar `ROOM_NOT_READY` para quarto ausente, incompatível ou ocupado por outra hospedagem; só executar updates e audit depois das validações.

- [ ] **Step 4: Executar GREEN**

Run: `node --test --test-name-pattern="PostgreSQL check-in" ashotelaria/__tests__/store.test.js`

Expected: PASS.

### Task 4: Verificação integral

**Files:**
- Test: `ashotelaria/__tests__/*.test.js`

- [ ] **Step 1: Rodar testes focados**

Run: `node --test ashotelaria/__tests__/domain.test.js ashotelaria/__tests__/memory-store.test.js ashotelaria/__tests__/store.test.js ashotelaria/__tests__/http.test.js`

Expected: zero falhas.

- [ ] **Step 2: Rodar a suíte completa e sintaxe**

Run: `npm test && npm run ashotelaria:check && node --check ashotelaria/memory-store.js && node --check ashotelaria/postgres-store.js && git diff --check`

Expected: zero falhas ou erros.
