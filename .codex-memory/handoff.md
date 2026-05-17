# Handoff

Updated: 2026-05-17T03:55:00.000Z

PubPaid 2.0 entrou em rodada full focus no worktree limpo `C:\Users\junio\projeto-codex-pubpaid-fullfocus`. A home publica/fallback agora entrega `maintenance.html`; `/pubpaid.html` redireciona para `pubpaid-v2.html?v=20260517-pubpaid-fullfocus-onlinefix1`; `/pubpaid.js` e `/pubpaid.css` retornam 410. `catalogo-sw.js` nao cacheia PubPaid/home. `app.js` limpa apenas caches PubPaid/ppg, nao mostra aviso de fullscreen quando nao ha suporte, e nao trava localmente se Google estiver desabilitado. Carteira usa `Pagamento enviado. Aguardando confirmacao.`; aprovacao grava `payment.status=approved`; escrow consome aposta em `matchSpentCoins` antes do payout. Cantora e convidados sentados foram removidos temporariamente; garcom maior.

Validado localmente: `node --check` nos JS tocados, CSS brace balance, `npm run guard:pubpaid`, Playwright desktop/mobile basico, rota de manutencao, redirect do 1.0, e API isolada com dois usuarios Google falsos para deposito pendente, aprovacao, saldo persistente, escrow e movimento de Damas.

## Next

- Deploy em origin/main
- aguardar Render e verificar online `/`, `/pubpaid.html`, `/pubpaid-v2.html?v=20260517-pubpaid-fullfocus-onlinefix1`, JS/CSS com versao nova e ausencia de erro fatal.
- Google real/admin real precisam de validacao online com sessao/credenciais reais; se nao houver acesso, declarar bloqueio.
