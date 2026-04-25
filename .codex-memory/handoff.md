# Handoff

Updated: 2026-04-25T19:55:00.000Z

## Atualizacao 2026-04-25T19:55:00.000Z - Fluxo editorial e cards responsivos

Usuario definiu duas solucoes combinadas: ordenar conteudo por prioridade editorial e corrigir responsividade dos cards/fotos. Reuniao geral rodada: `npm run agents:run` ativou 181 agentes e `npm run review:team` voltou com 0 achados.

Decisao editorial registrada em `PROMPT_FLUXO_EDITORIAL_RESPONSIVO_2026-04-25.md`: Hero reserva a materia principal; Destaques usam itens fortes que ficaram fora; Arquivo de Abril/mes mostra contexto sem repetir Hero/Destaques; Noticias do dia recebe o restante sem competir com superficies promovidas.

Implementacao: `script.js`, `arquivo-noticias.js` e `server.js` ganharam canonicalizacao de URL/titulo/entidades HTML, cluster editorial e balanceamento por fonte/categoria/imagem/pauta. `styles.css` ganhou regras responsivas para `#monthly`, com proporcao de foto por breakpoint: TV, desktop largo, desktop estreito, tablet e mobile.

Validacoes: `node --check script.js`, `node --check arquivo-noticias.js`, `node --check server.js`, `styles.css` brace-balance 0 e `npm run review:team` com 0 achados. Teste local da API `/api/news/archive?limit=18` mostrou 9 fontes nos 18 primeiros, no maximo 2 por fonte.

Lifestile Acre pronto como editoria exclusivamente de moda e ja destacado como acesso subordinado. Usuario pediu para tirar PubPaid do pacote atual; PubPaid modificada fica reservada e nao deve entrar em commit/deploy ate nova ordem explicita.

Arquivos tocados nesta frente: `lifestile.html`, `lifestile.css`, `lifestile.js`, `package.json`, `scripts/real-agents-runtime.js`, `scripts/review-team-audit.js`, `esttiles-config.js`, `escritorio.js`, `data/topic-feed-fallback.json`, `.codex-memory/current-state.md`, `.codex-memory/handoff.md`.

Logs principais para leitura:
- `.codex-temp/lifestile-agents/agents-run-fashion-clean-final.log`
- `.codex-temp/lifestile-agents/review-team-clean-final.log`
- `.codex-temp/lifestile-agents/daily-image-audit-clean-final.log`
- `.codex-temp/real-agents/latest-run.md`
- `.codex-temp/review-team/latest-report.md`

Validação do navegador no preview: 3 story cards, 14 social items, 12 photo cards, 24 article cards, hero com foto.

## Atualização 2026-04-25T14:12:00.000Z - Celebridades diário

O usuário corrigiu a direção: o bloco não deve ser mensal. `index.html` agora apresenta `Celebridades & Polêmicas do Dia` com eyebrow `rodada diária dos agentes`.

Arquivos tocados nesta correção: `index.html`, `script.js`, `styles.css`, `server.js`, `.codex-memory/current-state.md`, `.codex-memory/handoff.md`.

Comportamento novo: `/api/daily-agent-pulse` entrega resumo público sanitizado da rodada dos agentes reais; o render do bloco mistura agentes + topic-feed `buzz` + `window.NEWS_DATA` para montar cards diários com nota de agente/escritório.

Validação: `node --check script.js`, `node --check server.js`, `styles.css` brace-balance 0.

Bloqueio para subir: há conflitos/estados `UU`/`DU` no worktree fora deste ajuste. Resolver/isolar antes de commit/push.

## Atualização 2026-04-25T18:30:48.236Z - Celebridades vazio corrigido

Corrigido o vazio no bloco `Celebridades & Polêmicas do Dia`: `renderDynamicMonthlyBuzz` agora adiciona `active/is-visible` aos cards criados dinamicamente, e a grade dinamica foi ajustada para 3 colunas desktop.

Validação: `node --check script.js`, `styles.css` brace-balance 0, `npm run review:team` com 0 achados e screenshot `output/playwright/monthly-fixed.png`.

## Atualizacao 2026-04-25T15:00:00.000Z - Botao Lifestile subordinado

Commit `ba46268 Destacar acesso subordinado ao Lifestile` enviado para `origin/main`. Alteracoes: `Lifestile 24h` destacado na nav principal, faixa Editoriais e Esttiles; card de Moda ganhou link de subeditoria; Lifestile ganhou retorno para Esttiles. Verificacao imediata: GitHub remoto aponta para `ba46268`; Render ainda estava servindo HTML antigo logo apos o push, aguardar deploy automatico.

## Atualizacao 2026-04-25T18:09:18.016Z - Sync sem PubPaid

Home/cards/chamadas devem usar resumo curto; `noticia.html`/`noticia.js` continuam completos. `npm run sync:online-local` passou com 120 noticias, 0 achados da equipe, 120 imagens ok/0 review e 6 itens Mailza/Mailsa priorizados. Nao incluir PubPaid em commit/deploy ate nova ordem explicita.

## Atualizacao 2026-04-25T18:15:00.000Z - Pesquisa Acre 2026

O usuario pediu para manter a votacao por mais 7 dias sem mexer nos votos atuais. Foi adicionada configuracao manual da rodada em `data/acre-2026-poll-settings.json` e fallback em `server.js`, mantendo `activeWeekKey=2026-W17` ate `2026-05-03T04:59:59.999Z` (02/05/2026 23:59:59 no Acre). Nao houve alteracao em `acre-2026-poll.json`.
