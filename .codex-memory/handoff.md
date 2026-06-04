# Handoff

Updated: 2026-06-04T13:12:18.714Z

Deploy V8 em fechamento: Render configurado para captação automática de notícias a cada 30 minutos, integridade de artigos e topic feed ligados, captura manual final atualizada com 292 itens captados e 131 de hoje. Home V8 ganhou stories em bolinhas com preview de vídeo e viewer vertical; matérias agora priorizam vídeo quando a fonte traz media de vídeo e usam foto como poster/fallback. Validações locais passaram: node --check nos arquivos críticos, capture-latest-news, npm run review:team totalIssues=0 e Playwright smoke desktop/mobile com screenshots.

## Next

- Nao apagar material amplo automaticamente: vendor/tools/.automation/assets antigos precisam de auditoria antes de remover
- Depois do deploy
- conferir URL publica do Render e logs se o auto-deploy nao iniciar

## Files In Focus

- render.yaml
- assets/v8-final/v8-merge-ready.js
- assets/v8-final/v8-merge-ready.css
- noticia.js

## Related Orders

- 2026-06-04-fechamento-v8-para-deploy-captacao-30-min-midia-foto-video-nas-materias-stories-
