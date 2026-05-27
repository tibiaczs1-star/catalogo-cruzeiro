# Handoff

Updated: 2026-05-27T19:52:45Z

Rodada atual: CZS restaurado do experimento de split-loading e ajustado para preload da primeira tela visivel antes de liberar o site. A pedido do usuario, a curadoria politica agora e regional/conservadora no sentido editorial: rejeita chamada politica com insulto/deboche/opiniao vendida como fato e bloqueia propaganda estatal sem utilidade publica local. `scripts/capture-latest-news.js` remove os itens bloqueados em captura, merge, arquivo e janela ativa. Captura regenerada removeu exemplos como "picareta", "Pinoquio", "Tapa na cara", "jogo duplo", "ato falho" e propaganda Bolsa Familia/IDH dos dados atuais.

## Next

- Rodar `npm run review:team`
- Commit/push
- Validar online home e `/api/news`
- Continuar investigacao de Chrome aguardando resposta se persistir

## Files In Focus

- index.html
- script.js
- docs/CZS_PRODUCT_MASTER_RULES.md
- scripts/capture-latest-news.js
- data/runtime-news.json
- data/news-archive.json
- news-data.js

## Related Orders

- 2026-05-27-diretriz-curadoria-politica-conservadora-czs
- 2026-05-27-implementar-lazy-loading-real-e-investigar-carregamento-inicial-lento-da-home-pu
