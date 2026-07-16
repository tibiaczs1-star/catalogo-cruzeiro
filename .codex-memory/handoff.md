# Handoff

Updated: 2026-07-16T17:12:00Z

Rodada de correção visual/editorial concluída localmente e pronta para deploy:
- ticker "Últimas em movimento" agora roda por `scrollLeft` interno, com fonte adaptativa e sem `nowrap/ellipsis` cortando letras;
- controles do herói ficaram compactos e menos invasivos;
- bloco Norte Ultra Fibra foi reduzido e proporcional;
- script de reparo de imagens não depende mais obrigatoriamente do arquivo manual da Rayane;
- acervo/runtime/news-data receberam fallback editorial CZS onde faltava imagem;
- `docs/CODEX_SOCIAL_SITE_ROUTINES.md` criado: fonte deve ser citada em texto/legenda, mas logo/vinheta/marca de outro jornal não deve ser promovida visualmente.

Evidência local:
- Playwright/Chrome: ticker `scrollLeft` 47 -> 132 em 1,4s; sem overflow horizontal.
- `npm run audit:news-images`: `error=0`, `ok=55`, `review=25`.
- `npm run review:team`: `totalIssues=0`.
- `npm run editorial:health`: visualIssues caiu para 169.
- `npm run perf:budget`: ok=true, mas `index.html` continua over por ser pesado.

## Next

- Push/deploy Render e validar online.
- Otimização estrutural futura: retirar bloco gigante de notícias embutido no `index.html` e hidratar do JSON.
- Manter regra social: citar fonte sim, propaganda visual de outro jornal não.

## Files In Focus

- app.html
- app.css
- app-sw.js
- index.html
- assets/v8-final/v8-merge-ready.css
- assets/v8-final/v8-merge-ready.js
- scripts/repair-news-images-and-rayane.js
- docs/CODEX_SOCIAL_SITE_ROUTINES.md
