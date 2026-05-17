# Handoff

Updated: 2026-05-17T08:20:00.000Z

PubPaid 2.0 esta na versao local `20260517-real-pvp-checkers1`. A causa do fluxo exigir aba anonima era cache/service worker antigo segurando runtime velho em abas normais; a entrada PubPaid agora responde com `no-store`, `Clear-Site-Data: "cache"`, `X-PubPaid-Build`, build endpoint e limpeza de caches/SW antes do jogo.

Mudancas principais: nick salvo em `/api/pubpaid/profile`, botao para alterar nick, `pubpaid-runtime.js` preservando perfil ao recalcular carteira, Damas local/IA removida, saldo/teste e filas mortas removidos, Damas refeita com regra compartilhada e backend autoritativo (`forcedPiece`, captura obrigatoria, maior cadeia, dama voadora).

Validacoes: `node --check` nos JS tocados, `npm run guard:pubpaid`, CSS brace balance, teste API completo com duas sessoes falsas, teste manual de regras de Damas no servidor, Browser desktop/mobile com URL antiga atualizando para a build nova. `npm run review:team` passou PubPaid mas achou 4 textos publicos em ingles em feeds fora do escopo.

## Next

- Stage apenas PubPaid/memoria desta rodada; nao stagear os muitos dados/editorial sujos.
- Commit/push e validar Render.
- Testar online: `https://catalogo-cruzeiro-web.onrender.com/pubpaid.html`, desktop + celular, duas contas Google reais, nick salvo, ambos clicam `Estou pronto`, movimento de Damas no tabuleiro.
