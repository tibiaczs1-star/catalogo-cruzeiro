# Current State

Updated: 2026-05-17T08:20:00.000Z

## Active Goal

- PubPaid 2.0 PvP real, cache sem aba anonima e Damas refeita

## Summary

Rodada atual criou build `20260517-real-pvp-checkers1`, removeu restos de demo/local de Damas, salvou nick no backend por conta Google, preservou perfil no `pubpaid-runtime`, reforcou headers/limpeza de cache para evitar depender de aba anonima e reconstruiu regras/visual de Damas com PvP autoritativo.

Validado localmente com API e browser: URL velha redireciona para build nova; HTML PubPaid sai com `no-store` + `Clear-Site-Data: "cache"`; perfil/nick persiste apos recalculo da carteira; PvP Damas faz `waiting -> readying -> active` so depois dos dois prontos; captura obrigatoria, captura em cadeia/`forcedPiece` e dama voadora passam no servidor.

## Next

- Stage apenas arquivos PubPaid/memoria desta rodada.
- Commit/push.
- Validar online no Render em `https://catalogo-cruzeiro-web.onrender.com/pubpaid.html` e testar dois aparelhos/contas reais.
- Risco separado: `npm run review:team` apontou 4 textos publicos em ingles em feeds de dados fora do escopo PubPaid.
