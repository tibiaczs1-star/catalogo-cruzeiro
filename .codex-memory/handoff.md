# Handoff

Updated: 2026-04-26T03:18:42.000Z

Regra do usuario implementada: acervo de noticias deve ser acumulativo/infinito em arquivos, nao uma janela descartavel de 120. Foram removidos cortes slice(0,120) nas escritas de news-data.js em server.js, re-rodada-dia-geral.js e agents-autonomy-cycle.js; news-archive.json agora e alimentado pela rotina diaria. O site mostra "Acervo total" no Arquivo Vivo via window.NEWS_ARCHIVE_TOTAL, e /api/news + /api/news/archive separam archiveTotal/returned para nao confundir limite de exibicao com acervo real.

## Next

- Sempre reportar Acervo e Pendencias. Estado atual: news-data/runtime/archive com 157 noticias unicas; activeWindowItems 177; imagens 157 ok/0 review/0 error; review-team 0; API local conferida com total 157. Rodar sync:online-local antes de publicar.
