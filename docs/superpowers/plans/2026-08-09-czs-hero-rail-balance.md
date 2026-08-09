# CZS Hero Rail Balance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Manter a hero principal intacta e tornar os destaques laterais legíveis em qualquer largura, sem títulos quebrados no meio das palavras.

**Architecture:** Uma regra final de manutenção passa a dimensionar a grade lateral por largura mínima real do card, em vez de quantidades rígidas de colunas por viewport. O card preserva a classificação `cover`/`contain`, limita o título a três linhas e usa quebra natural de palavras.

**Tech Stack:** HTML, CSS responsivo, Node.js `node:test`.

---

### Task 1: Proteger a grade lateral com teste de regressão

**Files:**
- Modify: `scripts/__tests__/czs-v8-hero-final-fit.test.js`

- [x] **Step 1: Escrever o teste que exige grade fluida e quebra natural**

Adicionar asserções para o marcador `CZS_HERO_RAIL_BALANCE_20260809`, `auto-fit`, largura mínima segura, `overflow-wrap: normal`, `word-break: normal`, `hyphens: none` e título de três linhas.

- [x] **Step 2: Executar o teste e confirmar a falha**

Run: `node --test scripts/__tests__/czs-v8-hero-final-fit.test.js`

Expected: FAIL por ausência do marcador de equilíbrio.

### Task 2: Aplicar o equilíbrio responsivo

**Files:**
- Modify: `assets/v8-final/v8-merge-ready.css`

- [x] **Step 1: Adicionar a regra final da grade**

Usar `repeat(auto-fit, minmax(min(100%, 300px), 1fr))` no `#heroSide`, garantindo uma coluna quando o card ficaria estreito e múltiplas colunas apenas quando houver espaço.

- [x] **Step 2: Estabilizar o card e o título**

Manter mídia e texto em proporção útil, impedir hifenização automática e aceitar até três linhas naturais.

- [x] **Step 3: Executar os testes**

Run: `node --test scripts/__tests__/czs-v8-hero-final-fit.test.js`

Expected: PASS.

### Task 3: Validar e publicar

**Files:**
- Verify: `index.html`
- Verify: `assets/v8-final/v8-merge-ready.css`

- [x] **Step 1: Validar visualmente em móvel, intermediário e desktop**

Confirmar hero principal sem corte, rail com uma coluna quando estreito, títulos sem quebra no meio e artes usando `contain`.

- [x] **Step 2: Revisar o diff e executar a suíte pertinente**

Run: `git diff --check`

Expected: nenhuma saída.

- [ ] **Step 3: Versionar somente os arquivos desta correção e publicar**

Run: `git add assets/v8-final/v8-merge-ready.css scripts/__tests__/czs-v8-hero-final-fit.test.js docs/superpowers/plans/2026-08-09-czs-hero-rail-balance.md && git commit && git push origin HEAD:refs/heads/main`

Expected: push aceito pelo remoto.
