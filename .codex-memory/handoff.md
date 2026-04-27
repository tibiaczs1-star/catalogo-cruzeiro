# Handoff

Updated: 2026-04-27T03:57:41.341Z

PR #2 e PR #3 foram mergeados. A etapa final encontrou uma pendencia real na API online: o servidor tratava `/assets/news-fallbacks/` como imagem fraca e zerava `imageUrl` quando havia `sourceUrl`.

`server.js` foi corrigido para aceitar fallback local seguro e manter imagem na resposta da API. Validacao local: 360/360 noticias com imagem em `/api/news?limit=400`.

## Next

- Publicar/mergear hotfix de `server.js`.
- Conferir Render online apos deploy: Home 200 e `/api/news?limit=400` com missingCount=0.
