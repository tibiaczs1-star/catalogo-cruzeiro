# Handoff

Updated: 2026-04-28T14:12:00-05:00

Rodada atual: usuario pediu sincronizar direito todas as atualizacoes recentes. Use a arvore limpa `.codex-temp/deploy-home-sync` para deploy. Nao use a worktree principal suja para publicar, pois ela tem PubPaid local-only e outras pendencias.

`npm run sync:online-local` terminou `ok: true`. Resultados principais: 360 noticias ativas/arquivo, 0 missing, 54 imagens reparadas, 10 slugs atualizados, `review-team totalIssues=0`, auditoria de imagens `360/360 ok`, runtime com 181 agentes/5 escritorios e PDF em `.codex-temp/online-local-sync/latest-report.pdf`.

O arquivo `scripts/write-online-local-sync-pdf.js` precisa acompanhar o commit porque a rotina chama esse modulo no fechamento; sem ele o sync falha no passo de PDF.

Depois do push inicial, a worktree principal foi comparada contra `origin/main`. Pendencias reais mais novas e publicas: `data/article-integrity-report.json`, `data/image-preview-cache.json`, `data/social-trends-cache.json`, `data/topic-feed-buzz.json` e `data/topic-feed-economy.json`. Arquivos encontrados mas nao promovidos: `data/runtime-news.json` e `data/office-orders.json`, porque a worktree principal tinha versoes mais antigas que o `main`; PubPaid inteiro segue local-only.

## Next

- Stage exato da segunda leva: `data/article-integrity-report.json`, `data/image-preview-cache.json`, `data/social-trends-cache.json`, `data/topic-feed-buzz.json`, `data/topic-feed-economy.json`, `CODEX_MEMORY.md`, `.codex-memory/current-state.md` e `.codex-memory/handoff.md`.
- Commitar e enviar `HEAD:main`.
- Verificar producao com a home, o aviso de rodape e os cache-busts recentes.
- PubPaid segue local-only ate nova autorizacao explicita.
