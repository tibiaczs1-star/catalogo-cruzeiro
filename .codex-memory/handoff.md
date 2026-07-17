# Handoff

Updated: 2026-07-17T00:35:00-05:00

## Retomada 20260717 - polimento download Android / rodape / Cheffe

Status local antes do deploy: pronto e validado.

- CTA Android: remover qualquer botao flutuante por cima do conteudo; usar apenas `#androidDownloadPanel.android-download-native` no fluxo natural.
- Rodape: gate principal deve dizer `Fim do site` / `só aparece por este botão`; rodape deve explicar o scroll infinito.
- Cheffe no rodape: apenas link discreto com `title`; nao mover `#cheffeCallEditor` para dentro do rodape e nao exibir texto explicativo fixo.
- Validacoes executadas: `node --test scripts/__tests__/portal-anchor-contract.test.js scripts/__tests__/czs-flow-engine.test.js scripts/__tests__/czs-android-pwa-download.test.js`, `npm test`, `node --check`, `git diff --check`, `npm run review:team`, `npm audit --omit=dev`, smoke DOM local mobile/desktop.

Updated: 2026-07-17T00:05:00-05:00

## Retomada 20260717 - CZS flow/app publicado no Render

Status real: publicado e validado.

- Commit live no Render: `c4923b4e43e23b626799adfe47f2e079c6e49b6f`.
- Deploy live: `dep-d9cqiptckfvc73cj1jb0`.
- URL: `https://catalogo-cruzeiro-web.onrender.com`.
- Antes do deploy, a branch integrou `origin/main` (`f5824896`, AShotelaria/APK).
- Testes locais finais: `npm test` 130/130, testes CZS 16/16, `npm run review:team` 0 issues, `npm audit --omit=dev` 0 vulnerabilidades.
- Smoke publico confirmou: home 200, health 200, APK 200, assetlinks 200, scripts 200, `#tempo` e `#ticker` vivos, Cheffe fora do rodape, botao do rodape apontando para `#cheffeCallEditor`, sem erros de console e sem IDs duplicados.
- Observacao para Fable/Claude Code: o handoff temporario de coordenacao foi substituido por este registro; se ele trouxer uma reformulacao nova amanha, comparar contra `main` atual antes de mexer.
- Nao apagar `downloads/catalogo-czs-android.apk`, `.well-known/assetlinks.json`, `android-download.js`, nem provas de deploy/revisao recentes.

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
