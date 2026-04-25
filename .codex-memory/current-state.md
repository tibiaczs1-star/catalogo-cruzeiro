# Current State

Updated: 2026-04-25T18:30:48.309Z

## Active Goal

- Subida sem PubPaid
- Celebridades diário corrigido

## Summary

Lifestile 24h ja esta no remoto como editoria subordinada/visual. PubPaid ficou reservado fora do stage/commit por ordem do usuario. O pacote atual deve subir home/sync/editorial, com resumos curtos na home, leitura completa nas materias e Mailza/Mailsa priorizada.

Bloco `Celebridades & Polêmicas do Dia` estava vazio porque os cards dinamicos entravam depois do `IntersectionObserver` registrar os elementos `.reveal`; eles ocupavam espaco, mas ficavam com `opacity: 0`. A grade de 6 colunas tambem deixava os cards estreitos e altos demais. `script.js` agora ativa os cards dinamicos com `active/is-visible`, e `styles.css` usa 3 colunas no desktop.

## Next

- Finalizar cherry-pick/push do pacote sem PubPaid; PubPaid so volta ao stage quando o usuario mandar explicitamente.
- Se for subir esta correcao, incluir `script.js`, `styles.css` e memoria local.

## Atualizacao 2026-04-25T18:15:00.000Z - Pesquisa Acre 2026

Rodada da Pesquisa Acre 2026 estendida por mais 7 dias sem mexer nos votos atuais. A `weekKey` `2026-W17` fica ativa ate `2026-05-03T04:59:59.999Z` (02/05/2026 23:59:59 em America/Rio_Branco). Arquivos tocados: `server.js`, `data/acre-2026-poll-settings.json` e registro em `.codex-memory/orders.json`.
