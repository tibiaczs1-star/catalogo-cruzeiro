# Fluxo Local do Codex

Este workspace deve ser tratado como um ambiente enxuto. O foco vivo e somente:

- PubPaid 1 (fonte legada)
- PubPaid 2
- Jornal
- Cheffe Call / agentes reais

Todo o resto so deve voltar se o usuario pedir explicitamente.

## Regra de foco

- PubPaid 1: manter `pubpaid.html`, `pubpaid.css`, `pubpaid.js`, `pubpaid-admin.html`, `pubpaid-runtime.js` e `PUBPAID_1_SOURCE_ONLY.md` apenas como fonte legada de metodos de pagamento, carteira, admin e dashboard.
- PubPaid 2: manter `pubpaid-v2.html`, `pubpaid-phaser.css`, `pubpaid-phaser/`, `assets/pubpaid/` e `PUBPAID_2_GLOBAL_HANDOFF.md`.
- Jornal: manter `index.html`, `script.js`, `styles.css`, `server.js`, `news-data.js`, `data/`, `assets/news-fallbacks/`, paginas de noticia/arquivo/editorias e scripts de sync/review.
- Cheffe Call / agentes reais: manter `cheffe-call.html`, `cheffe-call.css`, `cheffe-call.js`, `real-agents.html`, `real-agents.css`, `real-agents.js`, `escritorio*.html`, `escritorio*.css`, `escritorio*.js`, `.codex-agents/`, `scripts/real-agents-runtime.js` e `scripts/news-image-approval-queue.js`.

## Retomada obrigatoria

1. Ler `CODEX_MEMORY.md`.
2. Ler `.codex-memory/current-state.md` e `.codex-memory/handoff.md`.
3. Se for PubPaid 2, ler `PUBPAID_2_GLOBAL_HANDOFF.md`.
4. Rodar `npm run codex:health` antes de trabalho longo, retomada ou travamento.

## Limpeza permanente

- Nao apagar Cheffe Call, real-agents ou escritorios usados pela runtime dos agentes.
- Nao recriar pesquisas, eleicoes, capturas, worktrees temporarias ou relatorios antigos sem ordem explicita.
- Nao usar arquivo morto como memoria operacional.
- Se gerar `output/`, `.codex-temp/`, logs, screenshots ou validacoes temporarias, apagar quando terminar.
- Memoria local deve ficar curta. Registrar so ordens atuais e assets realmente uteis.
- Em deploy, limpar lixo online/temporario seguro quando houver acesso: logs antigos, caches temporarios e artefatos de teste. Nao apagar `data/`, assets vivos, configuracoes ou provas atuais sem backup/validacao.

## Jornal

- Textos publicos de noticia precisam sair em portugues.
- Antes de commit, PR, merge ou deploy do Jornal, usar `npm run review:team` quando a rodada for grande.
- Proxima pendencia conhecida: investigar por que as noticias/agentes pararam de atualizar desde 02/05.

## PubPaid

- PubPaid 1 nao e frente de produto. Nao evoluir jogo, arte, fluxo publico ou runtime visual nele; usar somente como fonte para extrair metodos de pagamento, carteira, dashboard/admin e regras de revisao manual.
- Para PubPaid 1, seguir `PUBPAID_1_SOURCE_ONLY.md` antes de copiar qualquer padrao.
- PubPaid 2 e a frente oficial atual.
- Nao publicar alteracoes de PubPaid sem autorizacao explicita.
- Para PubPaid 2, seguir sempre `PUBPAID_2_GLOBAL_HANDOFF.md`.
- Para qualquer alteracao visual da PubPaid 2, seguir tambem `PUBPAID_2_VISUAL_DIRECTION.md`.
- Nao trocar carros, motos, NPCs, fundo, HUD ou sprites no runtime para "comparar arte"; comparacoes novas devem ficar em HTML/preview externo e so entram no jogo apos aprovacao humana explicita.
- Arte visual final nao pode ser canvas/procedural/runtime: nada de `createCanvas`, `generateTexture`, `document.createElement("canvas")`, `graphics()` para personagem/veiculo/fundo/UI final, Canva, vetor, clipart, stock ou personagem generico.
- Antes de concluir qualquer rodada visual PubPaid, rodar `npm run pubpaid:visual-audit`; se falhar, reportar os achados e nao dizer que a direcao visual esta implementada.

## Cheffe Call / Agentes

- Antes de dizer que a solucao esta implementada, provar localmente: pagina 200, rota de estudo, inicio da call, acao `complete` e runtime dos agentes.
- A sequencia esperada e: problema identificado -> causa encontrada -> arquivo alterado -> teste passou -> prova retornada.
- Provas principais: `data/real-agents-ecosystem-study.json`, `data/cheffe-call-state.json`, `data/office-orders.json`, `.codex-temp/real-agents/latest-run.json` e `.codex-temp/real-agents/latest-run.md`.
