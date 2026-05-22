# Current State

Updated: 2026-05-22T18:48:17.517Z

## Active Goal

- Refinamento editorial e velocidade do CZS, separado do PubPaid

## Summary

Projeto Codex/CZS e PubPaid seguem como frentes separadas. Rodada editorial aplicou `/api/news?limit=60&lite=1` para a home, removendo `body` do primeiro fetch e reduzindo localmente o payload inicial de noticias de 233112 para 121138 bytes (-48,0%). Fallback editorial novo troca texto generico por fato confirmado, impacto pratico e o que acompanhar; `data/runtime-news.json` e `news-data.js` ficaram sem os padroes antigos `base desta noticia`, `redacao automatica acompanha` e `ponto principal da atualizacao captada automaticamente`.

## Next

- Retomar CZS por correcoes pontuais/editorial, usando payload lite na home e detalhe completo por slug.
- PubPaid: Sinuca, Damas, Xadrez e PvP real quando houver duas sessoes autenticadas.
