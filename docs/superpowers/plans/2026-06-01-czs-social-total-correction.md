# CZS Social Total Correction Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refazer a rotina social do Catálogo CZS com auditoria, bloqueio dos erros, novo padrão premium, pacotes institucionais e filas seguras para Instagram, WhatsApp e Facebook.

**Architecture:** A rodada fica dividida em auditoria imutável, geradores build-only, manifestos de aprovação e filas por destino. Nenhuma postagem acontece sem prévia, destino/header confirmado e log.

**Tech Stack:** Node.js para auditoria/manifestos, Python/Pillow/ffmpeg para arte e vídeo, arquivos Markdown/JSON para logs e filas, ADB/WhatsApp/Facebook somente quando houver controle visual seguro.

---

### Task 1: Auditoria e bloqueio

**Files:**
- Create: `.codex-temp/social-total-correction-20260601/SOCIAL_TOTAL_CORRECTION_REPORT.md`
- Create: `.codex-temp/social-total-correction-20260601/rejected-packages.json`
- Modify: `.codex-memory/current-state.md`
- Modify: `.codex-memory/handoff.md`

- [ ] Listar pacotes recentes de Instagram, WhatsApp e Facebook.
- [ ] Classificar cada pacote como aprovado, reaproveitar conteúdo ou reprovado não usar.
- [ ] Registrar razões objetivas: voz, caption, mídia real, marca, destino, segurança.

### Task 2: Sistema premium novo

**Files:**
- Create: `.codex-temp/social-total-correction-20260601/premium_v3_assets.py`
- Create: `.codex-temp/social-total-correction-20260601/premium-v3-manifest.json`

- [ ] Criar template novo sem cápsula apertando a marca.
- [ ] Criar story com fonte, local, caption visível e safe area.
- [ ] Criar feed/carrossel institucional com visual de jornal local premium.
- [ ] Gerar tudo em build-only.

### Task 3: Conteúdo institucional fixado

**Files:**
- Create: `.codex-temp/social-total-correction-20260601/pinned-learning-system/`
- Create: `.codex-temp/social-total-correction-20260601/carousels/`

- [ ] Criar post fixado de desculpas e transparência.
- [ ] Criar carrossel Quem Somos.
- [ ] Criar carrossel Nossas Ferramentas.
- [ ] Criar carrossel Serviços.
- [ ] Criar carrossel Nosso Criador, sem foto.

### Task 4: Filas de distribuição

**Files:**
- Create: `.codex-temp/social-total-correction-20260601/WHATSAPP_ADS_SAFE_QUEUE.md`
- Create: `.codex-temp/social-total-correction-20260601/WHATSAPP_NEWS_SAFE_QUEUE.md`
- Create: `.codex-temp/social-total-correction-20260601/FACEBOOK_GROUPS_CLASSIFIED_QUEUE.json`

- [ ] Separar propagandas de notícias.
- [ ] Grupos de venda: só venda, serviço, produto, pedido de links.
- [ ] Notícias: só Catálogo CZS ou grupo/canal confirmado.
- [ ] Facebook: pesquisar/classificar, sem clique no escuro.

### Task 5: Validação

**Files:**
- Create: `.codex-temp/social-total-correction-20260601/VALIDATION_REPORT.md`

- [ ] Ver prévias.
- [ ] Confirmar captions visíveis.
- [ ] Confirmar áudio pt-BR ou bloquear áudio.
- [ ] Confirmar que nada foi postado sem validação.
- [ ] Atualizar memória local.
