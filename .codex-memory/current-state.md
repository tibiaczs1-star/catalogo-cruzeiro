# Current State

Updated: 2026-05-07

## Active Goal

PubPaid 2 direcao de arte preview-only registrada. Aguardar aprovacao/correcao do usuario sobre `pubpaid-character-approval.html` antes de gerar primeiro pack novo de pedestres.

## Summary

A worktree foi reduzida e organizada sem `git reset --hard`, sem `git clean -fd` amplo e sem apagar dados vivos.

Rodada PubPaid 2 preview-only de 2026-05-07:

- Criado `PUBPAID_2_CHARACTER_ART_PROMPT.md` com o contrato oficial de personagens/pedestres.
- Criado `pubpaid-character-approval.html` como HTML simples de aprovacao.
- Criado `pubpaid-art-direction-preview.html` e `PUBPAID_2_ART_DIRECTION_DECISION.md` para separar norte visual, candidatos e dividas.
- Nenhum arquivo final de runtime PubPaid 2 foi editado.
- `npm run pubpaid:visual-audit` falhou por divida preexistente no runtime; nao declarar visual implementado.

Foram removidos 497 arquivos nao rastreados e sem referencia encontrada:

- 323 fallbacks de noticia fora de `news-data.js`, `data/runtime-news.json` e `data/news-archive.json`.
- 174 assets PubPaid gerados que nenhum runtime, preview ou handoff apontava.
- 35.900.492 bytes removidos.

Commits criados:

- `53271593 Update Jornal Cheffe data and agents`
- `b355aceb Checkpoint PubPaid 2 assets and audit debt`

Restou apenas memoria a commitar nesta rodada.

## Render

Render publico esta online:

- `/` respondeu 200.
- `/api/news` respondeu 200 com JSON.

Limpeza administrativa online concluida em 2026-05-07:

- Render API encontrou service id `srv-d7heure7r5hc73br2aqg`.
- Deploy live `dep-d7trp41oagis73ff8sn0`, commit `cca9821f2bf54715de3b50c438f8297deebc30a6`.
- Storage health autenticado: OK; `DATA_DIR` em `/opt/render/project/src/render-data`; write probe OK; persistencia esperada.
- Cheffe Call online: estudo 201, start 201, safe-cleanup 200, complete 200.
- Safe-cleanup removeu 0 arquivo(s), 0 bytes.
- Runtime online dos agentes: `/api/real-agents/run` 201, 181 agentes.
- Removidos defaults hardcoded do token simples em codigo/exemplos locais.
- Varredura local por valores dos tokens retornou 0 hits.

Os tokens foram expostos no chat; devem ser rotacionados no Render depois desta rodada.

## Guardrails

- Nao publicar PubPaid sem autorizacao.
- PubPaid 1 esta descontinuado como produto: usar somente como fonte de pagamento, carteira, admin e dashboard; seguir `PUBPAID_1_SOURCE_ONLY.md`.
- PubPaid 2 segue com divida visual: `npm run pubpaid:visual-audit` falhou por `graphics`, `fillRect`, gradientes/glow e nomes `canvas` no runtime.
- Para personagens/pedestres PubPaid 2, seguir `PUBPAID_2_CHARACTER_ART_PROMPT.md` e entregar primeiro em `pubpaid-character-approval.html` ou HTML simples equivalente; runtime final so depois de aprovacao humana explicita.
- Para Jornal grande: `npm run review:team` antes de commit/PR/deploy.
- Para Cheffe/agentes: provar pagina 200, rota de estudo, inicio da call, `complete` e runtime antes de declarar implementado.
- Antes de qualquer nova rodada: rodar `npm run codex:health`.
- Health agora deve mostrar risk gates para escopo amplo, Render/admin sem credencial, PubPaid visual, branch ahead e worktree suja.
- Neste sandbox, `codex:health` nao consegue spawnar `git` dentro do Node (`spawnSync git EPERM`); ele avisa e exige conferir `git status` pelo shell.
- Existem mudancas vivas em `data/article-integrity-report.json` e `data/image-preview-cache.json`; nao reverter nem misturar sem ordem explicita.
- Os dois dados vivos foram classificados como atualizacao pequena de runtime/cache e entram no commit de higiene Git desta rodada.

## Files In Focus

- `C:\Users\junio\projeto codex\CODEX_MEMORY.md`
- `C:\Users\junio\projeto codex\.codex-memory\current-state.md`
- `C:\Users\junio\projeto codex\.codex-memory\handoff.md`
- `C:\Users\junio\projeto codex\.codex-memory\orders.json`
- `C:\Users\junio\projeto codex\scripts\codex-health-check.js`
- `C:\Users\junio\projeto codex\server.js`
- `C:\Users\junio\projeto codex\backend\server.js`
- `C:\Users\junio\projeto codex\PUBPAID_1_SOURCE_ONLY.md`
