# Handoff

Updated: 2026-05-07

## Retomar por aqui

O usuario pediu limpar worktree, commits, Render e memoria para reduzir alucinacao.

Ja feito:

- Lidos `CODEX_MEMORY.md`, `.codex-memory/current-state.md` e `.codex-memory/handoff.md`.
- `npm run codex:health` rodou OK e reconheceu a ordem ativa de limpeza.
- Removidos 497 arquivos nao rastreados sem referencia.
- `npm run review:team` passou com `totalIssues: 0`.
- `node --check` passou nos JS principais.
- Commit `53271593` separou Jornal/Cheffe/agentes/dados/fallbacks.
- `npm run pubpaid:visual-audit` falhou por divida visual real.
- Commit `b355aceb` separou PubPaid 2 como checkpoint com auditoria pendente.
- Render publico respondeu 200 em `/` e `/api/news`.
- Render admin foi validado depois que o usuario forneceu tokens: storage-health 200, Render API encontrou service id `srv-d7heure7r5hc73br2aqg`, safe-cleanup Cheffe removeu 0 arquivo(s), complete 200 e runtime dos 181 agentes 201.
- Removidos defaults hardcoded que coincidiam com o token simples; varredura por valores dos tokens deu 0 hits locais.
- Tokens foram colados no chat; recomendar rotacao no Render e nunca repetir valores.

## Estado esperado

Depois do commit final de memoria, a worktree deve ficar limpa. Se `npm run codex:health` avisar que nao ha ordem ativa, isso e esperado: parar e esperar a proxima ordem do usuario.

## Trava anti-alucinacao

- Nao continuar NPCs, PubPaid, Jornal ou Cheffe por inercia.
- Nao usar arquivo morto como memoria.
- Nao apagar `data/`, assets vivos, `.codex-temp/real-agents`, `.codex-temp/review-team` ou `.codex-temp/online-local-sync` sem nova prova/ordem.
- Nao dizer que Render foi limpo online sem credencial ou prova da rota admin.
- Render online agora tem prova, mas os tokens precisam ser rotacionados.
- Nao dizer que PubPaid 2 esta visualmente limpa enquanto `npm run pubpaid:visual-audit` falhar.
- Travas 10/10 agora devem aparecer em `npm run codex:health`: escopo, Render/admin, PubPaid visual, branch ahead e worktree.
- Se `codex:health` disser `spawnSync git EPERM`, conferir `git status` pelo shell antes de afirmar worktree/branch.
- `data/article-integrity-report.json` e `data/image-preview-cache.json` apareceram modificados fora desta mudanca; tratar como dado vivo ate nova ordem.

## Focos vivos

PubPaid 1, PubPaid 2, Jornal, Cheffe Call / agentes reais. O resto so volta com pedido explicito.
