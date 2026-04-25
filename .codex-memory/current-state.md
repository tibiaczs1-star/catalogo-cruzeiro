# Current State

Updated: 2026-04-25T22:10:00.000Z

## Active Goal

- Fluxo editorial anti-repeticao
- Responsividade de cards com foto
- Autocorrecao de textos publicos
- Bloqueio de quebra de palavras em cards/imagens automaticas

## Summary

Reuniao geral rodada com 181 agentes e review team. Decisao editorial: a home deve funcionar por reserva de superficie: Hero primeiro, Destaques depois, Arquivo de Abril/mes em seguida e Noticias do dia por ultimo, sem repetir slug, URL, foto, titulo normalizado ou pauta central entre esses blocos.

Implementacao atual: `script.js`, `arquivo-noticias.js` e `server.js` ganharam dedupe canonico/fingerprint editorial e balanceamento de arquivo por fonte, categoria, imagem e cluster. `styles.css` ganhou contrato responsivo para o bloco `Celebridades & Polêmicas do Dia`, evitando cards/fotos espremidos em TV, desktop largo, desktop estreito, tablet e mobile. Prompt registrado em `PROMPT_FLUXO_EDITORIAL_RESPONSIVO_2026-04-25.md`.

Rodada nova: correcao de portugues e limpeza de palavras em ingles soltas aplicada em textos visiveis da home, Estilo/antigo Lifestile, lateral comercial e catalogo de servicos. Nomes internos, rotas e classes foram preservados quando eram parte tecnica do runtime.

## Next

- Se for commitar/subir, incluir apenas arquivos da rodada atual e memoria local relevante.
- PubPaid continua fora do pacote salvo ordem explicita.

## Atualizacao 2026-04-25T18:15:00.000Z - Pesquisa Acre 2026

Rodada da Pesquisa Acre 2026 estendida por mais 7 dias sem mexer nos votos atuais. A `weekKey` `2026-W17` fica ativa ate `2026-05-03T04:59:59.999Z` (02/05/2026 23:59:59 em America/Rio_Branco). Arquivos tocados: `server.js`, `data/acre-2026-poll-settings.json` e registro em `.codex-memory/orders.json`.

## Atualizacao 2026-04-25T21:55:00.000Z - Autocorrecao de textos publicos

Arquivos tocados na rodada: `index.html`, `lifestile.html`, `lifestile.js`, `script.js`, `sidebar-data.js`, `sidebar-widgets-recovery.js`, `catalogo-servicos.js`, `.codex-memory/current-state.md`, `.codex-memory/handoff.md` e `.codex-memory/orders.json`.

Validacoes: `node --check script.js`, `node --check lifestile.js`, `node --check sidebar-data.js`, `node --check sidebar-widgets-recovery.js`, `node --check catalogo-servicos.js` e `npm run review:team` com 0 achados.

## Atualizacao 2026-04-25T22:10:00.000Z - Quebra de palavras em imagens automaticas

Usuario apontou que imagens/cards automaticos nao podem quebrar palavra no meio. `styles.css` recebeu regra global para cards gerados, thumbnails, fallbacks e legendas bloquearem `word-break` agressivo, `overflow-wrap: anywhere` e hifenizacao automatica. Tambem removido `overflow-wrap: anywhere` do terminal visual dos insiders.

Validacoes: busca por `overflow-wrap: anywhere`, `word-break: break-all` e `hyphens: auto` sem resultados nos CSS principais; `styles.css` brace-balance 0; `npm run review:team` com 0 achados.
