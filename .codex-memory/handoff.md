# Handoff

Updated: 2026-04-30T02:23:26.620Z

Home editorial: o defeito nao estava so na hero. `script.js`, `server.js`, `scripts/capture-latest-news.js` e `scripts/re-rodada-dia-geral.js` agora usam comparador editorial por data, prioridade regional e divisao. A ordem oficial esta em `PROMPT_SUPERVISAO_EDITORIAL_DATA_REGIAO_2026-04-29.md`: captar, deduplicar, ordenar por data mais nova, desempatar por Cruzeiro do Sul/Vale do Jurua/Acre, respeitar a area e reservar cada artigo para nao repetir em outra superficie.

Validacao local feita: `node --check script.js`, `server.js`, `scripts/capture-latest-news.js`, `scripts/re-rodada-dia-geral.js`; Playwright em `output/playwright/home-editorial-supervisor-20260429-final-check.png` com duplicatas 0 e stale 26/04 0 nas areas auditadas; `npm run review:team` retornou `totalIssues: 0`. Console so apontou imagem placeholder externa 404 da CNN.

## Next

- Revisar visualmente a home no navegador real e, se aprovado, subir/deployar a rodada editorial.
- Se a area Trending completar espaco com 27/04, isso esta permitido pelo fluxo apenas quando falta item atual compativel; se o usuario quiser, tornar Trending estritamente "somente hoje".
- PubPaid 2.0 segue em pausa local/teste e nao deve ser publicado/commitado sem ordem explicita.
