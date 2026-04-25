# Current State

Updated: 2026-04-25T19:55:00.000Z

## Active Goal

- Fluxo editorial anti-repeticao
- Responsividade de cards com foto

## Summary

Reuniao geral rodada com 181 agentes e review team. Decisao editorial: a home deve funcionar por reserva de superficie: Hero primeiro, Destaques depois, Arquivo de Abril/mes em seguida e Noticias do dia por ultimo, sem repetir slug, URL, foto, titulo normalizado ou pauta central entre esses blocos.

Implementacao atual: `script.js`, `arquivo-noticias.js` e `server.js` ganharam dedupe canonico/fingerprint editorial e balanceamento de arquivo por fonte, categoria, imagem e cluster. `styles.css` ganhou contrato responsivo para o bloco `Celebridades & Polêmicas do Dia`, evitando cards/fotos espremidos em TV, desktop largo, desktop estreito, tablet e mobile. Prompt registrado em `PROMPT_FLUXO_EDITORIAL_RESPONSIVO_2026-04-25.md`.

## Next

- Se for commitar/subir, incluir apenas `script.js`, `arquivo-noticias.js`, `server.js`, `styles.css`, `index.html`, `arquivo.html`, `PROMPT_FLUXO_EDITORIAL_RESPONSIVO_2026-04-25.md` e memoria local relevante.
- PubPaid continua fora do pacote salvo ordem explicita.

## Atualizacao 2026-04-25T18:15:00.000Z - Pesquisa Acre 2026

Rodada da Pesquisa Acre 2026 estendida por mais 7 dias sem mexer nos votos atuais. A `weekKey` `2026-W17` fica ativa ate `2026-05-03T04:59:59.999Z` (02/05/2026 23:59:59 em America/Rio_Branco). Arquivos tocados: `server.js`, `data/acre-2026-poll-settings.json` e registro em `.codex-memory/orders.json`.
