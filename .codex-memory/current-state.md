# Current State

Updated: 2026-06-05T04:45:00.000Z

## Active Goal

- Finalizar, validar e subir online a rodada corretiva do V8/CZS.

## Summary

Rodada V8 corrigiu hidratação real, galeria, vídeos, área jovem, relato comunitário, serviços ao leitor, links/CTAs e fontes de notícia. A home local está validada em `http://127.0.0.1:3001/?skipIntro=1`.

Captação atualizada em 2026-06-05: `scripts/capture-latest-news.js` captou 371 itens, 218 de hoje, 360 na janela ativa e 480 no arquivo. Fontes novas incluídas e testadas: Portal Acre, O Alto Acre, Estado do Acre, Acre Noticias, Acre Agora e A Gazeta do Acre. As fontes do Juruá continuam com prioridade editorial maior.

Fotos falsas/fallbacks genéricos foram removidos dos campos principais de notícia. `scripts/hydrate-source-screenshots.js` captura print da fonte para matérias sem imagem; 103 entradas já têm `sourceScreenshotUrl`. Restaram 7 URLs difíceis de Chrome headless, principalmente Voz do Norte e e-SAJ/TJAC, marcadas para revisão no Cheffe Call em vez de receber foto inventada.

Validação local: `node --check` nos scripts críticos, HTTP 200 em `http://127.0.0.1:3001/?skipIntro=1`, CDP para `#feed`, `#videos`, `#galeriaFotos`, `#areaJovem`, `#comunidade` e `#servicos`, sem exceção JS e sem 404 de `/assets/v8-final/assets/...`. `npm run review:team` passou; achados do auditor ficaram fora dos arquivos tocados nesta rodada.

## Next

- Stagear apenas arquivos intencionais desta rodada.
- Commitar, pushar `main` e disparar deploy Render.
- Depois do online, verificar `https://catalogo-cruzeiro-web.onrender.com/?skipIntro=1` e rotas por hash.
