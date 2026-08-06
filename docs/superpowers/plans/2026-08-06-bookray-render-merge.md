# Bookray Render Merge Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Unir a identidade editorial pública e o acervo R5/R6 em um book animado, robusto e publicado na rota Render correta.

**Architecture:** HTML fornece estrutura completa e pontos de montagem estáveis; JavaScript aprimora progressivamente galerias, lightbox e movimento sem ocultar conteúdo em caso de erro. CSS entrega direção editorial responsiva e respeita movimento reduzido.

**Tech Stack:** HTML5, CSS, JavaScript sem framework, Node test runner, Playwright CLI, Git e Render.

---

### Task 1: Regressão da página preta

**Files:**
- Modify: `bookray/bookray.test.js`
- Modify: `bookray/index.html`
- Modify: `bookray/app.js`

- [ ] Escrever teste que exige todos os seletores usados pelo script e inicialização defensiva.
- [ ] Rodar `node --test bookray/bookray.test.js` e confirmar falha pelo contrato ausente.
- [ ] Alinhar os contêineres do HTML e tornar inicializadores tolerantes a elementos opcionais.
- [ ] Rodar o teste novamente e confirmar aprovação.

### Task 2: Merge editorial e acervo

**Files:**
- Modify: `bookray/index.html`
- Modify: `bookray/app.js`
- Modify: `bookray/styles.css`
- Test: `bookray/bookray.test.js`

- [ ] Escrever testes para as quatro coleções, hero, trajetória, media kit e assets R5/R6.
- [ ] Confirmar a falha antes da implementação.
- [ ] Montar narrativa única preservando hero público e coleções ampliadas.
- [ ] Implementar grid editorial responsivo e lightbox com teclado.
- [ ] Confirmar testes verdes.

### Task 3: Movimento forte e acessível

**Files:**
- Modify: `bookray/app.js`
- Modify: `bookray/styles.css`
- Test: `bookray/bookray.test.js`

- [ ] Escrever teste para reveal seguro, ticker, profundidade e `prefers-reduced-motion`.
- [ ] Confirmar a falha antes da implementação.
- [ ] Implementar sequência do hero, scroll reveal, parallax contido, hover e progresso.
- [ ] Garantir conteúdo visível sem IntersectionObserver e em movimento reduzido.
- [ ] Confirmar testes verdes.

### Task 4: Verificação e publicação

**Files:**
- Verify: `bookray/`

- [ ] Rodar testes Node completos.
- [ ] Servir localmente e validar desktop/mobile no Playwright, incluindo console e links.
- [ ] Revisar `git diff` e commitar somente arquivos do book/spec/plano/assets necessários.
- [ ] Fazer push autorizado para `origin/main` sem sobrescrever mudanças remotas.
- [ ] Acompanhar deploy Render até `live`.
- [ ] Revalidar os três URLs públicos, console, screenshots desktop/mobile e conteúdo das seções.

