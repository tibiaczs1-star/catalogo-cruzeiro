# CODEX_MEMORY - memoria viva curta

Atualizado: 2026-05-07

## Foco vivo

Trabalhar somente em quatro frentes:

- PubPaid 1: `pubpaid.html`, `pubpaid.css`, `pubpaid.js`, `pubpaid-admin.html`, `pubpaid-runtime.js`.
- PubPaid 2: `pubpaid-v2.html`, `pubpaid-phaser.css`, `pubpaid-phaser/`, `assets/pubpaid/`, `PUBPAID_2_GLOBAL_HANDOFF.md`, `PUBPAID_2_VISUAL_DIRECTION.md`.
- Jornal: `index.html`, `script.js`, `styles.css`, `server.js`, `news-data.js`, `data/`, `assets/news-fallbacks/`, paginas de noticia/arquivo/editorias e scripts de sync/review.
- Cheffe Call / agentes reais: `cheffe-call.*`, `real-agents.*`, `escritorio*.*`, `.codex-agents/`, `scripts/real-agents-runtime.js`, `scripts/news-image-approval-queue.js`.

Todo o resto e arquivo morto ou lixo potencial ate o usuario pedir explicitamente.

## Ordem ativa

Limpeza local concluida nesta rodada: memoria curta, protocolo curto e commit de higiene no Git. Nao continuar PubPaid, Jornal ou Cheffe por inercia; retomar somente a proxima ordem explicita do usuario.

## Estado confirmado

- `npm run codex:health` rodou OK em 2026-05-07 via Node `exec`, porque o PowerShell direto retornou `operacao requer elevacao`.
- O health apontou worktree muito suja: 3669 mudancas no modo normal; com `--untracked-files=all`, 3923 entradas.
- Principais blocos: `sprite-vault/` deletado, `.codex-backups/` deletado, `output/` deletado, `games externos/` deletado, muitos fallback assets do Jornal e muitos assets PubPaid ainda nao triados.
- Temporario fisico removido nesta limpeza: `.codex-temp/mailza-cartoon-deploy`. Restaram apenas `.codex-temp/real-agents`, `.codex-temp/review-team` e `.codex-temp/online-local-sync`, preservados como provas atuais.
- Commit de higiene preparado apenas com memoria/protocolo, `.gitignore` de temporarios e delecoes de arquivo morto. Assets vivos e codigo funcional ficaram fora.
- Cheffe Call / Saude editorial online ja foi validado no commit `689d838`.
- Pacote Jornal/Cheffe limpo esta no PR draft #9, branch `codex/jornal-cheffe-operacional`, commit `5284d96f`.
- PubPaid 2 e local. Nao publicar sem autorizacao explicita. Mudancas visuais exigem preview externo e `npm run pubpaid:visual-audit`.
- A ultima auditoria visual PubPaid falhou por divida preexistente no runtime; nao declarar visual limpo ate resolver.

## Preservar

- `data/`, `news-data.js`, assets vivos do Jornal e PubPaid.
- `.codex-temp/real-agents`, `.codex-temp/review-team`, `.codex-temp/online-local-sync` enquanto forem prova atual.
- `.codex-temp/deploy-news-24h-fix-v2` porque foi marcada como worktree Git suja.
- Cheffe Call, real-agents, escritorios e `.codex-agents/`.

## Anti-alucinacao

- Uma ordem ativa por vez. Se `npm run codex:health` mostrar nenhuma ordem ativa, nao continuar tarefa antiga por inercia.
- Antes de editar, declarar escopo e conferir os grupos sujos da worktree.
- Em Git, usar `git add` com pathspec explicito; nunca `git add .` em worktree suja.
- Memoria local deve continuar curta. Se crescer, compactar antes de trabalhar.

## Proximo passo

Proxima ordem deve partir do usuario. Se for continuar limpeza, triar separadamente os assets nao rastreados em `assets/news-fallbacks/` e `assets/pubpaid/`.
