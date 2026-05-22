# Handoff

Updated: 2026-05-22T18:48:17.517Z

Fechamento anterior completo preservado. Rodada atual refinou CZS/editorial sem mexer no PubPaid: home agora pre-carrega `/api/news?limit=60&lite=1`; o endpoint lite nao inclui `body`; medicao local reduziu o fetch inicial antigo `limit=80` completo de 233112 bytes para 121138 bytes (-48,0%). O fallback editorial do servidor e dos agentes agora gera corpo com fato confirmado, impacto pratico e acompanhamento; `activeWindowItems`, `items` e `news-data.js` foram cobertos pela rotina.

## Next

- Proximo trabalho deve comecar por este handoff; manter Projeto Codex e PubPaid separados no raciocinio e no escopo.
- Para CZS, validar primeiro `npm run review:team`, `npm run perf:budget`, `/api/news?limit=60&lite=1` e uma materia por slug.
