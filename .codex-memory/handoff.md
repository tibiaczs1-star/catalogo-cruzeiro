# Handoff

Updated: 2026-05-07

## Retomar por aqui

O usuario pediu limpar a worktree e a memoria porque o projeto ficou grande e o Codex estava puxando contexto antigo.

Ja feito:

- Lidos `CODEX_MEMORY.md`, `.codex-memory/current-state.md` e `.codex-memory/handoff.md`.
- `npm run codex:health` executado com sucesso via Node `exec`.
- Ordem nova registrada em `.codex-memory/orders.json`.
- Ordem anterior de NPCs PubPaid 2 pausada.
- Memoria principal compactada para foco vivo.
- `.codex-temp/mailza-cartoon-deploy` removido; demais `.codex-temp` preservados eram provas atuais.
- Commit de higiene preparado com memoria/protocolo, `.gitignore` e delecoes de arquivo morto.

## Estado da sujeira

Status expandido: 3923 entradas.

- 2933 deletados rastreados, principalmente `sprite-vault/`, `.codex-backups/`, `output/`, `games externos/`, `.playwright-cli/`, prompts e relatorios antigos.
- 124 modificados rastreados.
- 866 nao rastreados ao expandir todos os arquivos.

Nao usar `git clean -fd` amplo. Nao usar `git reset --hard`.

## Decisao pendente

Ainda resta triar, em rodada separada, os assets nao rastreados de `assets/news-fallbacks/` e `assets/pubpaid/`, alem de mudancas vivas em `data/`, `scripts/` e runtime. Nao misturar isso em commit de higiene.

## Focos vivos

PubPaid 1, PubPaid 2, Jornal, Cheffe Call / agentes reais. O resto so volta com pedido explicito.
