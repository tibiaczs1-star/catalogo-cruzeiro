# Current State

Updated: 2026-05-07

## Active Goal

Travas anti-alucinacao instaladas localmente. Aguardar proxima ordem explicita.

## Summary

O workspace esta grande demais para retomada segura. A memoria foi compactada para foco vivo e a ordem anterior de NPCs PubPaid 2 foi pausada.

`npm run codex:health` passou via Node `exec`. O aviso principal e a worktree suja: 3669 mudancas no status normal; 3923 entradas ao expandir todos os untracked.

Temporario seguro removido: `.codex-temp/mailza-cartoon-deploy`. `.codex-temp/real-agents`, `.codex-temp/review-team` e `.codex-temp/online-local-sync` foram preservados.

O commit de higiene inclui apenas memoria/protocolo, `.gitignore` e os 2933 deletados de arquivo morto. Nao inclui os assets novos, `data/`, `scripts` funcionais, PubPaid/Jornal/Cheffe vivos ou mudancas de runtime.

`codex:health` agora imprime aterramento: ordem ativa, worktree normal/expandida, grupos sujos principais, limite de memoria e aviso quando nao houver ordem ativa.

Principais grupos vistos:

- `sprite-vault/`: 2602 deletados rastreados.
- `.codex-backups/`: 89 deletados rastreados.
- `output/`: 82 deletados rastreados.
- `games externos/`: 70 deletados rastreados.
- `.playwright-cli/`: 22 deletados rastreados.
- `assets/news-fallbacks/`: 50 modificados e 569 nao rastreados.
- `assets/pubpaid/`: 1 modificado e 259 nao rastreados.
- `data/`, `scripts/`, `pubpaid-phaser/`, `Cheffe Call`, `Jornal` e `.codex-agents/`: mudancas vivas que precisam triagem fina.

## Guardrails

- Nao resetar, restaurar ou apagar mudancas rastreadas sem classificar.
- Nao apagar dados vivos, assets vivos, PubPaid, Jornal, Cheffe Call, agentes reais ou provas atuais.
- Uma ordem ativa por vez; sem ordem ativa, parar e pedir/registrar a ordem nova.
- `npm run codex:health` deve mostrar aterramento: ordem ativa, worktree e grupos sujos.
- Stage sempre com pathspec explicito em worktree suja.
- Nao publicar PubPaid sem autorizacao.
- Para Jornal grande: `npm run review:team` antes de commit/PR/deploy.
- Para Cheffe/agentes: provar pagina 200, rota de estudo, inicio da call, `complete` e runtime antes de declarar implementado.

## Next

1. Aguardar proxima ordem explicita.
2. Antes de qualquer nova rodada, rodar `npm run codex:health` e obedecer o aterramento.
3. Se continuar limpeza, triar assets e mudancas vivas em commit separado.

## Files In Focus

- `C:\Users\junio\projeto codex\CODEX_MEMORY.md`
- `C:\Users\junio\projeto codex\.codex-memory\current-state.md`
- `C:\Users\junio\projeto codex\.codex-memory\handoff.md`
- `C:\Users\junio\projeto codex\.codex-memory\orders.json`
- `C:\Users\junio\projeto codex\.codex-memory\assets.json`
- `C:\Users\junio\projeto codex\progress.md`
