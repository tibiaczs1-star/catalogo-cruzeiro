# Current State

Updated: 2026-06-04T13:12:18.627Z

## Active Goal

- Deploy V8 pronto para publicar

## Summary

Deploy V8 em fechamento: Render configurado para captação automática de notícias a cada 30 minutos, integridade de artigos e topic feed ligados, captura manual final atualizada com 292 itens captados e 131 de hoje. Home V8 ganhou stories em bolinhas com preview de vídeo e viewer vertical; matérias agora priorizam vídeo quando a fonte traz media de vídeo e usam foto como poster/fallback. Validações locais passaram: node --check nos arquivos críticos, capture-latest-news, npm run review:team totalIssues=0 e Playwright smoke desktop/mobile com screenshots.

## Next

- Stage/commit/push dos arquivos necessários ao deploy sem incluir vendor/tools/lixo local ambíguo
- Verificar Render online após push

## Files In Focus

- render.yaml
- server.js
- scripts/capture-latest-news.js
- assets/v8-final/v8-merge-ready.js
- assets/v8-final/v8-merge-ready.css
- noticia.js
- noticia.html

## Assets In Focus

- output/playwright/czs-v8-stories-desktop.png
- output/playwright/czs-v8-story-viewer-desktop.png
- output/playwright/czs-v8-stories-mobile.png
