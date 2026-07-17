# Current State

Updated: 2026-07-17T00:35:00-05:00

## Rodada Atual - 20260717-czs-download-footer-polish

- Ajuste local pronto para deploy: download Android deixou de ser flutuante/fixo e ficou como destaque nativo estatico; Cheffe Call no rodape ficou discreta com dica somente no hover/title.
- Rodape agora explica que o CZS usa scroll infinito e que o fim/rodape so aparece pelo botao.
- Estudos locais de Cheffe/Fable-like consultados apontam Cheffe como sala de comando interna; por isso o rodape nao deve carregar textao operacional.
- Validacoes locais passaram: CZS 16/16, AShotelaria 130/130, review team 0 issues, audit de producao 0 vulnerabilidades e smoke DOM sem sobreposicao.

Updated: 2026-07-17T00:05:00-05:00

## Rodada Atual - 20260717-czs-flow-android-render-release

- Fable/Claude Code nao estava disponivel; usuario autorizou incorporar as acoes e seguir com deploy.
- Branch `feature/czs-android-app` integrou `origin/main` e foi enviada para `main`.
- Commit publicado: `c4923b4e43e23b626799adfe47f2e079c6e49b6f`.
- Render `catalogo-cruzeiro-web` deploy `dep-d9cqiptckfvc73cj1jb0` ficou `live`.
- Site publico validado em `https://catalogo-cruzeiro-web.onrender.com`.
- APK Android segue exposto em `/downloads/catalogo-czs-android.apk`; assetlinks TWA 200.
- Rodape agora tem somente botao de acesso para Cheffe Call; a Cheffe funcional fica fora do rodape.
- Testes/revisoes: CZS 16/16, AShotelaria 130/130, review team 0 issues, producao audit 0 vulnerabilidades.
- Pendencia nao bloqueante: audit completo de dev aponta `undici`; nao afeta runtime Render pelo `npm audit --omit=dev`.

Updated: 2026-07-16T17:12:00Z

## Active Goal

- Correção visual/site CZS pós-lançamento

## Summary

Rodada de auto-correção do site: ticker "Últimas em movimento" ajustado para rolagem real por JS, fonte responsiva e sem corte seco; controles do herói compactados; patrocinador Norte Ultra Fibra reduzido/proporcional; imagens faltantes reparadas no acervo/runtime com fallback editorial CZS. Rotina social/site criada para bloquear propaganda visual de outros jornais: citar fonte em texto/legenda, mas remover/cobrir logo, vinheta, marca d'água ou outro visual antes de postar.

## Next

- Monitorar Render após push/deploy.
- Próxima otimização grande: quebrar o `index.html` pesado e tirar acervo embutido da primeira resposta.
- Para Instagram/Reels/notícias: usar crédito textual e visual CZS; se houver logo/outro de veículo, aplicar fluxo de substituição/cobertura antes de publicar.

## Files In Focus

- app.html
- app.css
- app-sw.js
- index.html
- assets/v8-final/v8-merge-ready.css
- assets/v8-final/v8-merge-ready.js
- data/runtime-news.json
- data/news-archive.json
- docs/CODEX_SOCIAL_SITE_ROUTINES.md
