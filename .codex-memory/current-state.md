# Current State

Updated: 2026-05-17T03:55:00.000Z

## Active Goal

- PubPaid 2.0 full focus, CZS em manutencao e encerramento publico do PubPaid 1.0

## Summary

Worktree limpo `C:\Users\junio\projeto-codex-pubpaid-fullfocus` recebeu a rodada `20260517-pubpaid-fullfocus-onlinefix1`: home/fallback servem `maintenance.html`, PubPaid 1.0 redireciona ou responde 410, PubPaid 2.0 usa cache-bust novo, service worker nao cacheia PubPaid/home, fullscreen/audio nao bloqueiam, carteira/admin corrigem pendencia falsa apos aprovacao, e escrow consome aposta via `matchSpentCoins`. Cantora/convidados removidos temporariamente; garcom maior. Validado localmente com guard, node check, CSS balance, Playwright desktop/mobile basico e API isolada para deposito/aprovacao/saldo/escrow/Damas.

## Next

- Commit
- push main
- aguardar Render e validar URL cache-busted online `pubpaid-v2.html?v=20260517-pubpaid-fullfocus-onlinefix1`.
- Validar Google real/admin real online quando houver sessao/credenciais reais.
