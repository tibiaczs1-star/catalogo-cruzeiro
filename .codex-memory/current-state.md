# Current State

Updated: 2026-04-26T03:18:42.000Z

## Active Goal

- Acervo persistente de noticias

## Summary

Rotina alterada para nao limitar news-data/runtime/archive a 120. re-rodada-dia-geral agora busca ate CATALOGO_SYNC_NEWS_LIMIT (padrao 1000), mescla online + runtime + static + news-archive e grava acervo completo em news-data.js, data/runtime-news.json e data/news-archive.json. sync-online-local audita com o mesmo limite ampliado. O site agora recebe window.NEWS_ARCHIVE_TOTAL e mostra "Acervo total" no bloco Arquivo Vivo; a API /api/news e /api/news/archive tambem retornam archiveTotal/returned separados.

## Next

- Fechamento atual: janela online trouxe 177 itens
- acervo unico persistente ficou com 157 em news-data.js, runtime-news.json e news-archive.json
- API local conferida: /api/news/archive?limit=12 retornou archiveTotal 157 e returned 12; /api/news?limit=5 retornou total 157 e returned 5
- auditoria de imagens 157 ok/0 review/0 error; review team 0 issues
- proximo passo imediato: tentar commit do pacote de noticias/acervo; PubPaid segue fora.
